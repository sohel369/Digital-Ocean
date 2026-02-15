
import os
import sys

# Add parent directory to path to import app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

from backend.app.database import engine, SessionLocal
from backend.app import models

def check_cn_records():
    db = SessionLocal()
    try:
        print("\nCN records detail:")
        results = db.query(models.GeoData.country_code, models.GeoData.state_code, models.GeoData.state_name, models.GeoData.tax_rate).filter(models.GeoData.country_code == 'CN').limit(5).all()
        for r in results:
            print(f"Country: {r.country_code}, State Code: '{r.state_code}', State Name: '{r.state_name}', Tax: {r.tax_rate}")
    finally:
        db.close()

if __name__ == "__main__":
    check_cn_records()
