
import os
import sys
from datetime import date, timedelta

# Add parent directory to path to import app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

from backend.app.database import SessionLocal
from backend.app import models, invoice_service

def test_invoice_generation():
    db = SessionLocal()
    try:
        # 1. Get or create a user
        user = db.query(models.User).filter(models.User.email == "test_invoice@example.com").first()
        if not user:
            user = models.User(
                name="Test Invoice User",
                email="test_invoice@example.com",
                role="advertiser",
                country="US"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"Created test user: {user.email}")
        
        # 2. Set some tax rate for US in geodata to verify tax calculation
        us_geo = db.query(models.GeoData).filter(models.GeoData.country_code == "US", models.GeoData.state_code.is_(None)).first()
        if not us_geo:
            # Create a country level record if missing
            us_geo = models.GeoData(
                country_code="US",
                state_code=None,
                state_name="United States",
                land_area_sq_km=9833517,
                population=331000000,
                tax_rate=10.0 # 10% tax for testing
            )
            db.add(us_geo)
            print("Created US country level geodata with 10% tax")
        else:
            us_geo.tax_rate = 10.0
            print("Updated US tax rate to 10%")
        db.commit()

        # 3. Create a test campaign (6 months)
        start_date = date.today()
        end_date = start_date + timedelta(days=180) # ~6 months
        
        campaign = models.Campaign(
            advertiser_id=user.id,
            name="Invoice Test Campaign",
            industry_type="Retail",
            start_date=start_date,
            end_date=end_date,
            budget=6000.0, # $1000 per month gross
            status=models.CampaignStatus.APPROVED,
            coverage_type=models.CoverageType.COUNTRY,
            target_country="US"
        )
        db.add(campaign)
        db.commit()
        db.refresh(campaign)
        print(f"Created test campaign: {campaign.name}, Budget: {campaign.budget}, Months: 6")

        # 4. Generate Invoices
        print("\n🚀 Generating invoices...")
        invoices = invoice_service.generate_monthly_invoices(db, campaign)
        
        # 5. Verify results
        print(f"Total Invoices Generated: {len(invoices)}")
        
        for idx, inv in enumerate(invoices):
            print(f"Invoice {idx+1}:")
            print(f"  - Number: {inv.invoice_number}")
            print(f"  - Amount (Net): {inv.amount}")
            print(f"  - Tax Rate: {inv.tax_rate}%")
            print(f"  - Tax Amount: {inv.tax_amount}")
            print(f"  - Total Amount: {inv.total_amount}")
            print(f"  - Country: {inv.country}")
            print(f"  - Billing Date: {inv.billing_date}")
            print(f"  - Status: {inv.status}")
            
        # Clean up test data if you want, but better to keep for user to see
        # db.delete(campaign)
        # db.commit()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    test_invoice_generation()
