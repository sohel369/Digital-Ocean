"""
Database initialization and seeding script.
Creates initial data for testing and development.
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import SessionLocal, engine, Base
from app import models
from app.auth import get_password_hash


def init_database():
    """Create all database tables."""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created successfully")


def seed_data():
    """Seed initial data for development."""
    db = SessionLocal()
    
    try:
        print("\n📦 Seeding initial data...")
        
        # Check if data already exists
        existing_users = db.query(models.User).count()
        if existing_users > 0:
            print("⚠️  Database already contains data. Skipping seed.")
            return
        
        # Create admin user
        admin_user = models.User(
            name="Admin User",
            email="admin@adplatform.com",
            password_hash=get_password_hash("admin123"),
            role=models.UserRole.ADMIN,
            country="US"
        )
        db.add(admin_user)
        
        # Create test advertiser
        advertiser = models.User(
            name="Test Advertiser",
            email="advertiser@test.com",
            password_hash=get_password_hash("test123"),
            role=models.UserRole.ADVERTISER,
            country="US"
        )
        db.add(advertiser)
        
        db.commit()
        print("✅ Created admin and test users")
        
        # Create pricing matrix entries
        pricing_entries = [
            # Retail industry
            models.PricingMatrix(
                industry_type="retail",
                advert_type="display",
                coverage_type=models.CoverageType.RADIUS_30,
                base_rate=100.0,
                multiplier=1.2,
                state_discount=10.0,
                national_discount=15.0,
                country_id="US"
            ),
            models.PricingMatrix(
                industry_type="retail",
                advert_type="display",
                coverage_type=models.CoverageType.STATE,
                base_rate=500.0,
                multiplier=1.2,
                state_discount=10.0,
                national_discount=15.0,
                country_id="US"
            ),
            models.PricingMatrix(
                industry_type="retail",
                advert_type="display",
                coverage_type=models.CoverageType.COUNTRY,
                base_rate=2000.0,
                multiplier=1.2,
                state_discount=10.0,
                national_discount=15.0,
                country_id="US"
            ),
            # Healthcare industry
            models.PricingMatrix(
                industry_type="healthcare",
                advert_type="display",
                coverage_type=models.CoverageType.RADIUS_30,
                base_rate=150.0,
                multiplier=1.5,
                state_discount=8.0,
                national_discount=12.0,
                country_id="US"
            ),
            models.PricingMatrix(
                industry_type="healthcare",
                advert_type="display",
                coverage_type=models.CoverageType.STATE,
                base_rate=700.0,
                multiplier=1.5,
                state_discount=8.0,
                national_discount=12.0,
                country_id="US"
            ),
            # Tech industry
            models.PricingMatrix(
                industry_type="tech",
                advert_type="display",
                coverage_type=models.CoverageType.RADIUS_30,
                base_rate=120.0,
                multiplier=1.3,
                state_discount=12.0,
                national_discount=18.0,
                country_id="US"
            ),
        ]
        
        for pricing in pricing_entries:
            db.add(pricing)
        
        db.commit()
        print(f"✅ Created {len(pricing_entries)} pricing matrix entries")
        
        # Create geographic data
        geodata_entries = [
            # US States
            models.GeoData(
                country_code="US",
                state_code="CA",
                state_name="California",
                land_area_sq_km=423970,
                population=39538223,
                density_multiplier=1.5,
                urban_percentage=95.0
            ),
            models.GeoData(
                country_code="US",
                state_code="NY",
                state_name="New York",
                land_area_sq_km=141300,
                population=20201249,
                density_multiplier=1.8,
                urban_percentage=87.9
            ),
            models.GeoData(
                country_code="US",
                state_code="TX",
                state_name="Texas",
                land_area_sq_km=695662,
                population=29145505,
                density_multiplier=1.2,
                urban_percentage=84.7
            ),
            # Country-level
            models.GeoData(
                country_code="US",
                state_code=None,
                state_name=None,
                land_area_sq_km=9833520,
                population=331900000,
                density_multiplier=1.0,
                urban_percentage=82.7
            ),
        ]
        
        for geodata in geodata_entries:
            db.add(geodata)
        
        db.commit()
        print(f"✅ Created {len(geodata_entries)} geographic data entries")
        
        print("\n🎉 Database seeded successfully!")
        print("\n📝 Test Credentials:")
        print("   Admin:")
        print("     Email: admin@adplatform.com")
        print("     Password: admin123")
        print("\n   Advertiser:")
        print("     Email: advertiser@test.com")
        print("     Password: test123")
        
    except Exception as e:
        print(f"❌ Error seeding data: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("🗄️  Advertiser Dashboard - Database Setup")
    print("=" * 50)
    
    init_database()
    seed_data()
    
    print("\n✅ Database setup complete!")
