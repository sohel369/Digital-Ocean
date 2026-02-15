
import os
import sys

# Add parent directory to path to import app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

from backend.app.database import engine, SessionLocal
from backend.app import models
from sqlalchemy import inspect

def check_db():
    print(f"Engine: {engine}")
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"Tables: {tables}")
    
    if 'invoices' in tables:
        print("\nColumns in 'invoices':")
        columns = inspector.get_columns('invoices')
        for col in columns:
            print(f"- {col['name']}: {col['type']}")
    else:
        print("\n❌ Table 'invoices' NOT found!")

    if 'geodata' in tables:
        print("\nTax data in 'geodata' (first 10):")
        db = SessionLocal()
        try:
            results = db.query(models.GeoData.country_code, models.GeoData.state_code, models.GeoData.tax_rate).limit(10).all()
            for r in results:
                print(f"Country: {r.country_code}, State: {r.state_code}, Tax: {r.tax_rate}")
        finally:
            db.close()
    else:
        print("\n❌ Table 'geodata' NOT found!")

if __name__ == "__main__":
    check_db()
