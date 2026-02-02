from fastapi import APIRouter, Depends, HTTPException, status, Request, Header
from sqlalchemy.orm import Session
from typing import Optional, List
import stripe
import logging
from pydantic import BaseModel

logger = logging.getLogger(__name__)

from ..database import get_db
from .. import models, schemas, auth
from ..config import settings
from ..pricing import PricingEngine, get_pricing_engine
import math

# Initialize Stripe
stripe.api_version = "2023-10-16"

# ROBUST KEY HANDLING: Check for user copy-paste errors
SECRET_KEY_CANDIDATE = settings.STRIPE_SECRET_KEY
PUBLISHABLE_KEY_CANDIDATE = settings.STRIPE_PUBLISHABLE_KEY

# Swap if user accidentally put pk_ in secret slot and sk_ in public slot
if SECRET_KEY_CANDIDATE.startswith("pk_") and PUBLISHABLE_KEY_CANDIDATE.startswith("sk_"):
    logging.warning("⚠️  SWAPPED KEYS DETECTED: Automatically fixing Stripe keys.")
    SECRET_KEY_CANDIDATE, PUBLISHABLE_KEY_CANDIDATE = PUBLISHABLE_KEY_CANDIDATE, SECRET_KEY_CANDIDATE

stripe.api_key = SECRET_KEY_CANDIDATE

# Validation
if stripe.api_key and stripe.api_key.startswith("pk_"):
    logging.error("❌  FATAL STRIPE ERROR: 'STRIPE_SECRET_KEY' contains a PUBLISHABLE key (pk_...). It MUST be a SECRET key (sk_...). Payment will fail.")


def is_stripe_configured():
    return bool(settings.STRIPE_SECRET_KEY and not settings.STRIPE_SECRET_KEY.startswith("dummy") and settings.STRIPE_SECRET_KEY != "")

router = APIRouter(prefix="/payment", tags=["Payment"])

class CheckoutSessionRequest(BaseModel):
    campaign_id: int
    success_url: str
    cancel_url: str
    currency: str = "usd"

@router.get("/config")
async def get_payment_config():
    """
    Expose public Stripe configuration.
    """
    is_sandbox = settings.STRIPE_SECRET_KEY.startswith("sk_test") or not is_stripe_configured()
    return {
        "publishableKey": settings.STRIPE_PUBLISHABLE_KEY,
        "isSandbox": is_sandbox,
        "environment": "sandbox" if is_sandbox else "production"
    }

@router.post("/create-checkout-session")
async def create_checkout_session(
    request_data: CheckoutSessionRequest,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db),
    pricing_engine: PricingEngine = Depends(get_pricing_engine)
):
    """
    Create a Stripe Checkout session for campaign payment.
    """
    campaign_id = request_data.campaign_id
    success_url = request_data.success_url
    cancel_url = request_data.cancel_url
    currency = request_data.currency

    logger.info(f"💳 [SESSION] Creating for Campaign {campaign_id} | User: {current_user.email} | Currency: {currency}")

    # Get campaign
    campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
    
    if not campaign:
        logger.error(f"❌ [SESSION] Campaign {campaign_id} not found")
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Owner or Admin/CountryAdmin for the campaign's country
    role = str(current_user.role).lower() if current_user.role else ""
    is_admin = role == "admin"
    is_country_admin = role == "country_admin" and campaign.target_country == current_user.managed_country
    
    if not (campaign.advertiser_id == current_user.id or is_admin or is_country_admin):
        logger.error(f"❌ [SESSION] Unauthorized access for user {current_user.id} on campaign {campaign_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to pay for this campaign"
        )
    
    # Check if campaign already has a successful payment
    existing_payment = db.query(models.PaymentTransaction).filter(
        models.PaymentTransaction.campaign_id == campaign_id,
        models.PaymentTransaction.status == "succeeded"
    ).first()
    
    if existing_payment:
        logger.warning(f"⚠️ [SESSION] Campaign {campaign_id} already paid")
        raise HTTPException(status_code=400, detail="Campaign has already been paid for")
    
    # Smallest unit calculation
    target_currency = currency.lower()
    zero_decimal_currencies = ['vnd', 'jpy', 'krw', 'bif', 'clp', 'djf', 'gnf', 'kmf', 'mga', 'pyg', 'rwf', 'ugx', 'vuv', 'xaf', 'xof', 'xpf']
    multiplier = 1 if target_currency in zero_decimal_currencies else 100
    
    # Pricing verify
    duration_days = max((campaign.end_date - campaign.start_date).days, 1)
    # Use campaign.budget STRICTLY as per user request "selected price will be cost no other"
    # ignoring backend calculated_price which might have defaulted to high values
    base_price = campaign.budget
    
    # SIMPLIFIED CALCULATION:
    # We trust that 'base_price' (campaign.budget) is already expressed in the 'currency' requested,
    # because the frontend displays it and saves it in that context.
    # Therefore, we do NOT convert it again. We just handle the cents multiplier.
    
    amount_smallest_unit = int(base_price * multiplier)
    
    # STRIPE LIMIT HANDLING (BDT)
    # Stripe BDT limit is ~999,999.99 BDT. If amount exceeds this, we MUST process in USD.
    if target_currency == 'bdt' and amount_smallest_unit > 99999999:
        logger.warning(f"⚠️ [PAYMENT] Amount {amount_smallest_unit} BDT exceeds Stripe limit. Converting to USD.")
        # Approximate Rate: 1 USD = 120 BDT (Safe fallback)
        usd_amount = base_price / 120.0
        target_currency = 'usd'
        amount_smallest_unit = int(usd_amount * 100) # USD cents
        logger.info(f"🔄 [PAYMENT] Converted to {amount_smallest_unit} cents (USD)")

    # GLOBAL STRIPE LIMIT CHECK (Max 8 digits: 99,999,999 units)
    # This applies to USD ($999,999.99) and others.
    STRIPE_MAX_UNIT = 99999999
    if amount_smallest_unit > STRIPE_MAX_UNIT:
        if 'sk_test' in settings.STRIPE_SECRET_KEY or not is_stripe_configured():
            logger.warning(f"⚠️ [TEST MODE] Amount {amount_smallest_unit} exceeds global Stripe limit. Capping at 99,999,999 for success.")
            amount_smallest_unit = STRIPE_MAX_UNIT
        else:
             raise HTTPException(status_code=400, detail="Transaction amount exceeds the online payment limit ($999,999.99). Please contact sales for wire transfer.")

    if amount_smallest_unit < 50 and multiplier == 100: # Stripe minimum $0.50
        amount_smallest_unit = 50
    elif amount_smallest_unit <= 0:
        amount_smallest_unit = 1

    try:
        if not is_stripe_configured():
            logger.warning("⚠️ STRIPE: Not configured, returning mock session")
            import uuid
            mock_id = f"cs_test_{str(uuid.uuid4())}"
            return {
                "checkout_url": f"{success_url}{'&' if '?' in success_url else '?'}session_id={mock_id}&mock=true",
                "session_id": mock_id
            }

        # Create Stripe Checkout Session (ONE-TIME PAYMENT)
        # We use mode='payment' to support all currencies (including BDT) without complex subscription mandates.
        checkout_session = stripe.checkout.Session.create(
            # Force Card to ensure support for BDT and others
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': target_currency,
                    'product_data': {
                        'name': campaign.name,
                        'description': f"Advertising Campaign: {campaign.industry_type} - {campaign.coverage_area}",
                    },
                    'unit_amount': amount_smallest_unit,
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=success_url + (("&" if "?" in success_url else "?") + "session_id={CHECKOUT_SESSION_ID}"),
            cancel_url=cancel_url,
            customer_email=current_user.email,
            client_reference_id=str(campaign_id),
            metadata={
                'campaign_id': campaign_id,
                'user_id': current_user.id,
                'environment': 'test' if 'sk_test' in settings.STRIPE_SECRET_KEY else 'production',
                'type': 'one_time_payment'
            }
        )

        logger.info(f"✅ [SESSION] Stripe session created: {checkout_session.id}")
        
        # Log transaction
        tx = models.PaymentTransaction(
            campaign_id=campaign_id,
            user_id=current_user.id,
            stripe_payment_intent_id=checkout_session.id,
            amount=base_price,
            currency=target_currency.upper(),
            status='pending',
            payment_method='stripe_checkout'
        )
        db.add(tx)
        db.commit()
        
        return { "checkout_url": checkout_session.url, "session_id": checkout_session.id }
    
    except stripe.error.StripeError as e:
        logger.error(f"❌ [STRIPE] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Stripe Gateway Error: {str(e)}")
    except Exception as e:
        logger.error(f"🔥 [CRASH] Unexpected error in payment: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error during payment initialization")

class PaymentIntentRequest(BaseModel):
    campaign_id: int
    currency: str = "usd"

@router.post("/create-payment-intent")
async def create_payment_intent(
    request_data: PaymentIntentRequest,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a Stripe Payment Intent for embedded elements.
    """
    campaign_id = request_data.campaign_id
    currency = request_data.currency

    logger.info(f"💳 [INTENT] Creating for Campaign {campaign_id} | User: {current_user.email} | Currency: {currency}")

    # Get campaign
    campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Auth Check
    role = str(current_user.role).lower() if current_user.role else ""
    is_admin = role == "admin"
    is_country_admin = role == "country_admin" and campaign.target_country == current_user.managed_country
    
    if not (campaign.advertiser_id == current_user.id or is_admin or is_country_admin):
        raise HTTPException(status_code=403, detail="Not authorized")

    # Check existing payment
    existing_payment = db.query(models.PaymentTransaction).filter(
        models.PaymentTransaction.campaign_id == campaign_id,
        models.PaymentTransaction.status == "succeeded"
    ).first()
    
    if existing_payment:
        raise HTTPException(status_code=400, detail="Campaign already paid")

    # Calculate Amount
    target_currency = currency.lower()
    zero_decimal_currencies = ['vnd', 'jpy', 'krw', 'bif', 'clp', 'djf', 'gnf', 'kmf', 'mga', 'pyg', 'rwf', 'ugx', 'vuv', 'xaf', 'xof', 'xpf']
    multiplier = 1 if target_currency in zero_decimal_currencies else 100
    
    base_price = campaign.budget
    amount_smallest_unit = int(base_price * multiplier)
    
    if amount_smallest_unit < 50 and multiplier == 100:
        amount_smallest_unit = 50
    elif amount_smallest_unit <= 0:
        amount_smallest_unit = 1

    try:
        if not is_stripe_configured():
            # Mock Intent for dev/test without keys
            return { "clientSecret": f"pi_mock_{campaign_id}_secret_{current_user.id}", "amount": amount_smallest_unit }

        intent = stripe.PaymentIntent.create(
            amount=amount_smallest_unit,
            currency=target_currency,
            # automatic_payment_methods={"enabled": True}, # Causing issues with some currencies (BDT)
            payment_method_types=['card'], # Force card to ensure global support
            metadata={
                'campaign_id': campaign_id,
                'user_id': current_user.id,
                'environment': 'test' if 'sk_test' in settings.STRIPE_SECRET_KEY else 'production'
            }
        )

        return { 
            "clientSecret": intent.client_secret, 
            "id": intent.id,
            "amount": amount_smallest_unit
        }

    except stripe.error.StripeError as e:
        logger.error(f"❌ [STRIPE] Intent Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"🔥 [CRASH] Intent Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Error")

@router.get("/session/{session_id}")
async def get_checkout_session(session_id: str, current_user: models.User = Depends(auth.get_current_active_user), db: Session = Depends(get_db)):
    try:
        if session_id.startswith("cs_test_") and not is_stripe_configured():
            return { "id": session_id, "payment_status": "paid", "amount_total": 0, "currency": "usd", "customer_email": current_user.email, "metadata": {} }
        session = stripe.checkout.Session.retrieve(session_id)
        return { "id": session.id, "payment_status": session.payment_status, "amount_total": session.amount_total / 100 if session.amount_total else 0, "currency": session.currency, "customer_email": session.customer_email, "metadata": session.metadata }
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=500, detail=f"Stripe error: {str(e)}")

@router.post("/webhook")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None, alias="stripe-signature"), db: Session = Depends(get_db)):
    payload = await request.body()
    try:
        event = stripe.Webhook.construct_event(payload, stripe_signature, settings.STRIPE_WEBHOOK_SECRET)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid webhook payload or signature")
    
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        campaign_id = int(session['metadata']['campaign_id'])
        payment = db.query(models.PaymentTransaction).filter(models.PaymentTransaction.campaign_id == campaign_id, models.PaymentTransaction.status == 'pending').first()
        if payment:
            payment.status = 'succeeded'
            payment.stripe_charge_id = session.get('payment_intent')
            payment.completed_at = db.func.now()
            campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
            if campaign:
                campaign.status = models.CampaignStatus.PENDING_REVIEW
                campaign.submitted_at = db.func.now()
            db.commit()
    return {"status": "success"}

@router.get("/transactions")
async def get_user_transactions(current_user: models.User = Depends(auth.get_current_active_user), db: Session = Depends(get_db)):
    transactions = db.query(models.PaymentTransaction).filter(models.PaymentTransaction.user_id == current_user.id).order_by(models.PaymentTransaction.created_at.desc()).all()
    return [{ "id": t.id, "campaign_id": t.campaign_id, "amount": t.amount, "currency": t.currency, "status": t.status, "payment_method": t.payment_method, "created_at": t.created_at, "completed_at": t.completed_at } for t in transactions]

@router.get("/admin/transactions")
async def get_all_transactions(current_user: models.User = Depends(auth.get_current_admin_user), db: Session = Depends(get_db)):
    transactions = db.query(models.PaymentTransaction).order_by(models.PaymentTransaction.created_at.desc()).all()
    return [{ "id": t.id, "campaign_id": t.campaign_id, "user_id": t.user_id, "amount": t.amount, "currency": t.currency, "status": t.status, "payment_method": t.payment_method, "stripe_payment_intent_id": t.stripe_payment_intent_id, "created_at": t.created_at, "completed_at": t.completed_at } for t in transactions]
