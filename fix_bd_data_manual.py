import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

from backend.app.database import SessionLocal
from backend.app import models

def fix_bd():
    db = SessionLocal()
    try:
        print("Checking Bangladesh GeoData...")
        bd_count = db.query(models.GeoData).filter(models.GeoData.country_code == "BD").count()
        
        if bd_count > 0:
            print(f"✅ Found {bd_count} records for BD. Deleting old ones to refresh...")
            db.query(models.GeoData).filter(models.GeoData.country_code == "BD").delete()
        
        print("Inserting fresh BD data...")
        entries = [
            models.GeoData(country_code="BD", state_code="DHK", state_name="Dhaka", land_area_sq_km=1463, population=21000000, density_multiplier=5.0),
            models.GeoData(country_code="BD", state_code="CTG", state_name="Chittagong", land_area_sq_km=168, population=9000000, density_multiplier=3.5),
            models.GeoData(country_code="BD", state_code="SYL", state_name="Sylhet", land_area_sq_km=12000, population=4000000, density_multiplier=2.0),
            models.GeoData(country_code="BD", state_code="RAJ", state_name="Rajshahi", land_area_sq_km=18000, population=6000000, density_multiplier=1.8),
        ]
        db.add_all(entries)
        db.commit()
        print("🎉 Bangladesh data synchronized successfully!")
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_bd()
