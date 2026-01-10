"""
Payment integration router using Stripe.
Handles campaign payment processing and webhook events.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request, Header
from sqlalchemy.orm import Session
from typing import Optional, List
import stripe

from ..database import get_db
from .. import models, schemas, auth
from ..config import settings

# Initialize Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

def is_stripe_configured():
    return bool(settings.STRIPE_SECRET_KEY and not settings.STRIPE_SECRET_KEY.startswith("dummy"))


router = APIRouter(prefix="/payment", tags=["Payment"])


@router.post("/create-checkout-session")
async def create_checkout_session(
    campaign_id: int,
    success_url: str,
    cancel_url: str,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a Stripe Checkout session for campaign payment.
    
    - **campaign_id**: ID of the campaign to pay for
    - **success_url**: URL to redirect after successful payment
    - **cancel_url**: URL to redirect if payment is cancelled
    
    Returns:
    - Checkout session URL to redirect the user to
    """
    # Get campaign
    campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
    
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )
    
    # Check ownership
    if current_user.role != models.UserRole.ADMIN and campaign.advertiser_id != current_user.id:
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
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Campaign has already been paid for"
        )
    
    # Calculate amount (in cents for Stripe)
    amount_cents = int(campaign.calculated_price * 100)
    
    if amount_cents <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid campaign price"
        )
    
    try:
        if not is_stripe_configured():
            # Return mock response
            import uuid
            mock_session_id = f"cs_test_{str(uuid.uuid4())}"
            return {
                "checkout_url": f"{success_url}?session_id={mock_session_id}&mock=true",
                "session_id": mock_session_id
            }

        # Create Stripe Checkout Session
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[
                {
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': f'Campaign: {campaign.name}',
                            'description': f'{campaign.industry_type} - {campaign.coverage_type.value} coverage',
                        },
                        'unit_amount': amount_cents,
                    },
                    'quantity': 1,
                }
            ],
            mode='payment',
            success_url=success_url + '?session_id={CHECKOUT_SESSION_ID}',
            cancel_url=cancel_url,
            client_reference_id=str(campaign_id),
            customer_email=current_user.email,
            metadata={
                'campaign_id': campaign_id,
                'user_id': current_user.id,
                'campaign_name': campaign.name
            }
        )
        
        # Create pending payment transaction
        payment_transaction = models.PaymentTransaction(
            campaign_id=campaign_id,
            user_id=current_user.id,
            stripe_payment_intent_id=checkout_session.payment_intent or checkout_session.id,
            amount=campaign.calculated_price,
            currency='USD',
            status='pending',
            payment_method='stripe_checkout'
        )
        
        db.add(payment_transaction)
        db.commit()
        
        return {
            "checkout_url": checkout_session.url,
            "session_id": checkout_session.id
        }
    
    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Stripe error: {str(e)}"
        )


@router.get("/session/{session_id}")
async def get_checkout_session(
    session_id: str,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve Stripe Checkout session details.
    
    Used to verify payment status after redirect.
    """
    try:
        if session_id.startswith("cs_test_") and not is_stripe_configured():
             # Return mock session
            return {
                "id": session_id,
                "payment_status": "paid",
                "amount_total": 0,
                "currency": "usd",
                "customer_email": current_user.email,
                "metadata": {}
            }

        session = stripe.checkout.Session.retrieve(session_id)
        
        return {
            "id": session.id,
            "payment_status": session.payment_status,
            "amount_total": session.amount_total / 100 if session.amount_total else 0,
            "currency": session.currency,
            "customer_email": session.customer_email,
            "metadata": session.metadata
        }
    
    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Stripe error: {str(e)}"
        )


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="stripe-signature"),
    db: Session = Depends(get_db)
):
    """
    Stripe webhook endpoint for payment events.
    
    Handles:
    - checkout.session.completed
    - payment_intent.succeeded
    - payment_intent.failed
    
    This endpoint is called by Stripe when payment events occur.
    Configure webhook URL in Stripe Dashboard.
    """
    payload = await request.body()
    
    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid signature")
    
    # Handle different event types
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        
        # Get campaign ID from metadata
        campaign_id = int(session['metadata']['campaign_id'])
        user_id = int(session['metadata']['user_id'])
        
        # Update payment transaction
        payment = db.query(models.PaymentTransaction).filter(
            models.PaymentTransaction.campaign_id == campaign_id,
            models.PaymentTransaction.user_id == user_id,
            models.PaymentTransaction.status == 'pending'
        ).first()
        
        if payment:
            payment.status = 'succeeded'
            payment.stripe_charge_id = session.get('payment_intent')
            payment.completed_at = db.func.now()
            
            # Update campaign status to PENDING (awaiting admin approval)
            campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
            if campaign:
                campaign.status = models.CampaignStatus.PENDING
            
            db.commit()
    
    elif event['type'] == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        
        # Update payment record if exists
        payment = db.query(models.PaymentTransaction).filter(
            models.PaymentTransaction.stripe_payment_intent_id == payment_intent['id']
        ).first()
        
        if payment:
            payment.status = 'succeeded'
            payment.receipt_url = payment_intent.get('charges', {}).get('data', [{}])[0].get('receipt_url')
            payment.completed_at = db.func.now()
            db.commit()
    
    elif event['type'] == 'payment_intent.payment_failed':
        payment_intent = event['data']['object']
        
        payment = db.query(models.PaymentTransaction).filter(
            models.PaymentTransaction.stripe_payment_intent_id == payment_intent['id']
        ).first()
        
        if payment:
            payment.status = 'failed'
            db.commit()
    
    return {"status": "success"}


@router.get("/transactions", response_model=List[dict])
async def get_user_transactions(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get payment transactions for the current user.
    """
    transactions = db.query(models.PaymentTransaction).filter(
        models.PaymentTransaction.user_id == current_user.id
    ).order_by(models.PaymentTransaction.created_at.desc()).all()
    
    return [
        {
            "id": t.id,
            "campaign_id": t.campaign_id,
            "amount": t.amount,
            "currency": t.currency,
            "status": t.status,
            "payment_method": t.payment_method,
            "created_at": t.created_at,
            "completed_at": t.completed_at
        }
        for t in transactions
    ]


@router.get("/admin/transactions", response_model=List[dict])
async def get_all_transactions(
    current_user: models.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get all payment transactions (Admin only).
    """
    transactions = db.query(models.PaymentTransaction).order_by(
        models.PaymentTransaction.created_at.desc()
    ).all()
    
    return [
        {
            "id": t.id,
            "campaign_id": t.campaign_id,
            "user_id": t.user_id,
            "amount": t.amount,
            "currency": t.currency,
            "status": t.status,
            "payment_method": t.payment_method,
            "stripe_payment_intent_id": t.stripe_payment_intent_id,
            "created_at": t.created_at,
            "completed_at": t.completed_at
        }
        for t in transactions
    ]
