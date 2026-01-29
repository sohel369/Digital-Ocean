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
from app.constants import SUPPORTED_INDUSTRIES


def init_database():
    """Create all database tables if they don't exist."""
    print("Initializing database tables...")
    # Base.metadata.drop_all(bind=engine) # RE-RUNNING THIS WIPES ALL DATA. Disabled for persistence.
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables ensured")


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
            password_hash="$2b$12$6uXoTqO9M9R9PqR9PqR9Pu6uXoTqO9M9R9PqR9PqR9PqR9PqR9PqR", # Placeholder
            role=models.UserRole.ADMIN,
            country="United States",
            industry=SUPPORTED_INDUSTRIES[0]
        )
        db.add(admin_user)
        
        # Create test advertiser
        advertiser = models.User(
            name="Test Advertiser",
            email="advertiser@test.com",
            password_hash="$2b$12$6uXoTqO9M9R9PqR9PqR9Pu6uXoTqO9M9R9PqR9PqR9PqR9PqR9PqR", # Placeholder
            role=models.UserRole.ADVERTISER,
            country="United States",
            industry=SUPPORTED_INDUSTRIES[1]
        )
        db.add(advertiser)
        
        db.commit()

        # Try to re-hash correctly if passlib works, otherwise keep placeholder
        try:
            admin_user.password_hash = get_password_hash("admin123")
            advertiser.password_hash = get_password_hash("test123")
            db.commit()
            print("✅ Created admin and test users with real hashes")
        except:
            print("⚠️  Created users with placeholder hashes (bcrypt failed)")
        
        # Create pricing matrix entries
        industries = SUPPORTED_INDUSTRIES
        
        # Country codes for the supported countries
        # Mapping names from SUPPORTED_COUNTRIES to codes
        country_codes = ["US", "GB", "CA", "AU", "CN", "JP", "DE", "FR", "ES", "ID", "IN", "IT", "TH", "VN", "PH"]
        
        pricing_entries = []
        for country_code in country_codes:
            for ind in industries:
                pricing_entries.append(models.PricingMatrix(
                    industry_type=ind,
                    advert_type="display",
                    coverage_type=models.CoverageType.RADIUS_30,
                    base_rate=2500.0,
                    multiplier=1.2 if "Retail" in ind else 1.5 if "Healthcare" in ind else 1.0,
                    state_discount=15.0, # Percentage as float 15.0
                    national_discount=30.0, # Percentage as float 30.0
                    country_id=country_code
                ))
        
        for pricing in pricing_entries:
            db.add(pricing)
        
        db.commit()
        print(f"✅ Created {len(pricing_entries)} pricing matrix entries")
        
        # Create geographic data (Sample for key countries)
        geodata_entries = [
             models.GeoData(country_code="US", state_code="NY", state_name="New York", land_area_sq_km=141300, population=20201249),
             models.GeoData(country_code="GB", state_code="LND", state_name="London", land_area_sq_km=1572, population=8982000),
             models.GeoData(country_code="AU", state_code="NSW", state_name="New South Wales", land_area_sq_km=800642, population=8166000),
             models.GeoData(country_code="IN", state_code="MH", state_name="Maharashtra", land_area_sq_km=307713, population=112374333),
             models.GeoData(country_code="TH", state_code="BKK", state_name="Bangkok", land_area_sq_km=1568, population=10539000),
             models.GeoData(country_code="BD", state_code="DHK", state_name="Dhaka", land_area_sq_km=1463, population=21000000, density_multiplier=5.0),
             models.GeoData(country_code="BD", state_code="CTG", state_name="Chittagong", land_area_sq_km=168, population=9000000, density_multiplier=3.5),
             models.GeoData(country_code="BD", state_code="SYL", state_name="Sylhet", land_area_sq_km=12000, population=4000000, density_multiplier=2.0),
             models.GeoData(country_code="BD", state_code="RAJ", state_name="Rajshahi", land_area_sq_km=18000, population=6000000, density_multiplier=1.8),
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
