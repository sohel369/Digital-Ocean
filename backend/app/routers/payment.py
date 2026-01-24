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
    
    # Check ownership
    if current_user.role != models.UserRole.ADMIN and campaign.advertiser_id != current_user.id:
        logger.error(f"❌ [SESSION] Unauthorized access for user {current_user.id} on campaign {campaign_id}")
        raise HTTPException(status_code=403, detail="Not authorized to pay for this campaign")
    
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
    # Use campaign.calculated_price if available, else recalculate
    base_price = campaign.calculated_price or campaign.budget
    
    # Exchange rates
    exchange_rates = { 
        'usd': 1.0, 
        'aud': 1.5, 
        'cad': 1.35, 
        'eur': 0.92, 
        'gbp': 0.8, 
        'bdt': 120.0, 
        'thb': 35.0 
    }
    base_currency = getattr(settings, 'BASE_CURRENCY', 'usd').lower()
    conversion_rate = exchange_rates.get(target_currency, 1.0) / exchange_rates.get(base_currency, 1.0)
    
    amount_smallest_unit = int(base_price * conversion_rate * multiplier)
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

        # Create Stripe Checkout Session
        checkout_session = stripe.checkout.Session.create(
            # Use explicit payment methods to avoid 'unknown parameter' errors
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': target_currency,
                    'product_data': {
                        'name': campaign.name,
                        'description': f"Premium reach for {campaign.industry_type} in {campaign.coverage_area}",
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
                'environment': 'test' if 'sk_test' in settings.STRIPE_SECRET_KEY else 'production'
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
