
import os
import sys

# Add parent directory to path to import app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

from backend.app.database import engine, SessionLocal
from backend.app import models

def check_tax_data():
    db = SessionLocal()
    try:
        print("\nCountry-level Tax data (state_code is None):")
        results = db.query(models.GeoData.country_code, models.GeoData.tax_rate).filter(models.GeoData.state_code.is_(None)).all()
        if not results:
            print("No country-level records found!")
        for r in results:
            print(f"Country: {r.country_code}, Tax: {r.tax_rate}")
            
        print("\nAll distinct countries in geodata:")
        countries = db.query(models.GeoData.country_code).distinct().all()
        print([c[0] for c in countries])
    finally:
        db.close()

if __name__ == "__main__":
    check_tax_data()
