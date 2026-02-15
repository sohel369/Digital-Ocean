from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from . import models
import uuid

def generate_monthly_invoices(db: Session, campaign: models.Campaign):
    """
    Generate a series of monthly invoices for a campaign duration.
    """
    # Calculate duration in months
    duration_days = (campaign.end_date - campaign.start_date).days
    duration_months = max(1, round(duration_days / 30))
    
    # Monthly amount (gross)
    monthly_total = campaign.budget / duration_months
    
    # Get tax rate for the country
    # We look for a country-level record (state_code is None)
    country_geo = db.query(models.GeoData).filter(
        models.GeoData.country_code == campaign.target_country,
        models.GeoData.state_code.is_(None)
    ).first()
    
    tax_rate = country_geo.tax_rate if country_geo else 0.0
    
    # Calculate tax components
    # Tax is usually added ON TOP of the net amount, or included?
    # User said "Country specific Tax will be apply on invoices"
    # Usually it's added on top.
    
    invoices = []
    current_date = campaign.start_date
    
    for i in range(duration_months):
        invoice_num = f"INV-{campaign.id}-{i+1}-{uuid.uuid4().hex[:6].upper()}"
        
        amount_net = monthly_total
        tax_amt = amount_net * (tax_rate / 100.0)
        total_amt = amount_net + tax_amt
        
        # Billing date is start of each month
        billing_date = datetime.combine(current_date, datetime.min.time())
        due_date = billing_date + timedelta(days=7) # 7 days payment terms
        
        invoice = models.Invoice(
            campaign_id=campaign.id,
            user_id=campaign.advertiser_id,
            invoice_number=invoice_num,
            amount=amount_net,
            tax_rate=tax_rate,
            tax_amount=tax_amt,
            total_amount=total_amt,
            currency="USD", # Should be campaign currency if we add it
            country=campaign.target_country,
            billing_date=billing_date,
            due_date=due_date,
            status="paid" if i == 0 and campaign.status != "DRAFT" else "pending"
        )
        
        db.add(invoice)
        invoices.append(invoice)
        
        # Advance current_date by 30 days for next billing
        current_date += timedelta(days=30)

    db.commit()
    return invoices
