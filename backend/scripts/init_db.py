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
        industries = [
            "Asset Recovery and Anti-Theft Technologies",
            "Real Estate",
            "Retail",
            "Healthcare",
            "Tech",
            "Education",
            "Finance",
            "Entertainment",
            "Travel and Hospitality",
            "Automotive"
        ]
        
        countries = ["US", "ID", "VN", "PH", "TH", "AU", "GB", "CA", "FR"]
        
        pricing_entries = []
        for country_code in countries:
            for ind in industries:
                pricing_entries.append(models.PricingMatrix(
                    industry_type=ind,
                    advert_type="display",
                    coverage_type=models.CoverageType.RADIUS_30,
                    base_rate=100.0 if country_code == "US" else 150000.0 if country_code == "ID" else 100.0,
                    multiplier=1.2 if "Retail" in ind else 1.5 if "Healthcare" in ind else 1.0,
                    state_discount=0.15,
                    national_discount=0.30,
                    country_id=country_code
                ))
        
        for pricing in pricing_entries:
            db.add(pricing)
        
        db.commit()
        print(f"✅ Created {len(pricing_entries)} pricing matrix entries")
        
        # Create geographic data
        geodata_entries = [
            # US States
            models.GeoData(country_code="US", state_code="CA", state_name="California", land_area_sq_km=423970, population=39538223, density_multiplier=1.5),
            models.GeoData(country_code="US", state_code="NY", state_name="New York", land_area_sq_km=141300, population=20201249, density_multiplier=1.8),
            models.GeoData(country_code="US", state_code="TX", state_name="Texas", land_area_sq_km=695662, population=29145505, density_multiplier=1.2),
            
            # UK
            models.GeoData(country_code="GB", state_code="ENG", state_name="England", land_area_sq_km=130279, population=56286961, density_multiplier=1.3),
            
            # Australia
            models.GeoData(country_code="AU", state_code="NSW", state_name="New South Wales", land_area_sq_km=800642, population=8166000, density_multiplier=1.1),
            
            # Indonesia
            models.GeoData(country_code="ID", state_code="JK", state_name="Jakarta", land_area_sq_km=661, population=10562088, density_multiplier=2.5),
            
            # Vietnam
            models.GeoData(country_code="VN", state_code="HC", state_name="Ho Chi Minh City", land_area_sq_km=2061, population=8993000, density_multiplier=2.0),
            
            # Philippines
            models.GeoData(country_code="PH", state_code="M", state_name="Metro Manila", land_area_sq_km=619, population=13484462, density_multiplier=2.2),
            
            # Thailand
            models.GeoData(country_code="TH", state_code="BK", state_name="Bangkok", land_area_sq_km=1568, population=8305218, density_multiplier=1.9),
            
            # Canada
            models.GeoData(country_code="CA", state_code="ON", state_name="Ontario", land_area_sq_km=1076395, population=14570000, density_multiplier=1.2),
            
            # France
            models.GeoData(country_code="FR", state_code="IDF", state_name="Île-de-France", land_area_sq_km=12012, population=12271708, density_multiplier=1.8),
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
