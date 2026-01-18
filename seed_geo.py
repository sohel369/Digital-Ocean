import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the backend directory to sys.path to import app modules
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app import models, database

def seed_geo_data():
    db = database.SessionLocal()
    
    # Regions data to populate
    regions = [
        # Australia
        {'name': 'New South Wales', 'code': 'NSW', 'country': 'AU', 'pop': 8100000, 'density': 1.2},
        {'name': 'Victoria', 'code': 'VIC', 'country': 'AU', 'pop': 6600000, 'density': 1.5},
        {'name': 'Queensland', 'code': 'QLD', 'country': 'AU', 'pop': 5200000, 'density': 1.1},
        {'name': 'Western Australia', 'code': 'WA', 'country': 'AU', 'pop': 2700000, 'density': 0.8},
        {'name': 'South Australia', 'code': 'SA', 'country': 'AU', 'pop': 1800000, 'density': 0.9},
        
        # United States 
        {'name': 'California', 'code': 'CA', 'country': 'US', 'pop': 39000000, 'density': 2.0},
        {'name': 'Texas', 'code': 'TX', 'country': 'US', 'pop': 29000000, 'density': 1.5},
        {'name': 'New York', 'code': 'NY', 'country': 'US', 'pop': 19000000, 'density': 2.5},
        {'name': 'London', 'code': 'LND', 'country': 'GB', 'pop': 9000000, 'density': 3.0},
        {'name': 'Greater Manchester', 'code': 'MAN', 'country': 'GB', 'pop': 2800000, 'density': 2.0},
        
        # Japan
        {'name': 'Tokyo', 'code': 'TK', 'country': 'JP', 'pop': 14000000, 'density': 4.5},
        {'name': 'Osaka', 'code': 'OS', 'country': 'JP', 'pop': 8800000, 'density': 3.5},
        
        # Germany
        {'name': 'Bavaria', 'code': 'BY', 'country': 'DE', 'pop': 13000000, 'density': 1.5},
        {'name': 'Berlin', 'code': 'BE', 'country': 'DE', 'pop': 3700000, 'density': 2.5},
        
        # Italy
        {'name': 'Lombardy', 'code': 'LO', 'country': 'IT', 'pop': 10000000, 'density': 2.0},
        {'name': 'Lazio', 'code': 'LA', 'country': 'IT', 'pop': 5800000, 'density': 1.8},
        
        # China
        {'name': 'Guangdong', 'code': 'GD', 'country': 'CN', 'pop': 126000000, 'density': 3.0},
        {'name': 'Shandong', 'code': 'SD', 'country': 'CN', 'pop': 101000000, 'density': 2.8}
    ]

    print("Seeding Geo Data...")
    
    for r in regions:
        # Check if exists
        exists = db.query(models.GeoData).filter(
            models.GeoData.state_code == r['code'],
            models.GeoData.country_code == r['country']
        ).first()
        
        if not exists:
            geo = models.GeoData(
                country_code=r['country'],
                state_code=r['code'],
                region_name=r['name'],
                population=r['pop'],
                density_multiplier=r['density'],
                land_area_sq_km=10000 # Mock
            )
            db.add(geo)
            print(f"Added {r['name']}")
        else:
            print(f"Skipped {r['name']} (Exists)")
            
    db.commit()
    print("Geo Data seeding complete.")

if __name__ == "__main__":
    seed_geo_data()
