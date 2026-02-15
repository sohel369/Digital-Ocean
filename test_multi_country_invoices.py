
import os
import sys
from datetime import date, datetime

# Add parent directory to path to import app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

from backend.app.database import SessionLocal, engine
from backend.app import models, invoice_service

def setup_tax_data(db):
    print("Setting up Tax Rates...")
    tax_rates = {
        "US": 7.5,    # 7.5%
        "BD": 15.0,   # 15% (VAT)
        "GB": 20.0    # 20% (VAT)
    }
    
    for country, rate in tax_rates.items():
        geo = db.query(models.GeoData).filter(models.GeoData.country_code == country, models.GeoData.state_code.is_(None)).first()
        if not geo:
            geo = models.GeoData(
                country_code=country,
                state_code=None,
                state_name=f"Country {country}",
                land_area_sq_km=1000,
                population=1000000,
                tax_rate=rate
            )
            db.add(geo)
        else:
            geo.tax_rate = rate
    db.commit()
    print("✅ Tax Rates updated.")

def test_multi_country_invoices():
    db = SessionLocal()
    try:
        setup_tax_data(db)
        
        user = db.query(models.User).filter(models.User.email == "admin@adplatform.com").first()
        
        countries = ["US", "BD", "GB"]
        budget = 3000.0 # $1000/month for 3 months
        
        for country in countries:
            print(f"\n--- Testing Country: {country} ---")
            campaign = models.Campaign(
                advertiser_id=user.id,
                name=f"Contract Test {country}",
                industry_type="Tech",
                start_date=date(2026, 1, 1),
                end_date=date(2026, 3, 31), # 3 months roughly
                budget=budget,
                status=models.CampaignStatus.ACTIVE,
                coverage_type=models.CoverageType.COUNTRY,
                target_country=country
            )
            db.add(campaign)
            db.commit()
            db.refresh(campaign)
            
            invoices = invoice_service.generate_monthly_invoices(db, campaign)
            print(f"Generated {len(invoices)} invoices for {country}")
            
            # Check last generated invoice for this country
            last_inv = invoices[-1]
            print(f"  First Invoice Date: {invoices[0].billing_date}")
            print(f"  Month 2 Date: {invoices[1].billing_date}")
            print(f"  Month 3 Date: {invoices[2].billing_date}")
            print(f"  Tax Rate: {last_inv.tax_rate}%")
            print(f"  Tax Amount: {last_inv.tax_amount}")
            print(f"  Total: {last_inv.total_amount}")
            
            # Verify status
            print(f"  Invoice 1 Status: {invoices[0].status}")
            print(f"  Invoice 3 Status: {invoices[2].status}")

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    test_multi_country_invoices()
