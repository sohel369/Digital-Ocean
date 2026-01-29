import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the backend directory to sys.path to import app modules
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app import models, database

def seed_geo_data():
    # Ensure tables exist
    database.init_db()
    
    db = database.SessionLocal()
    
    # Regions data to populate
    regions = [
        # United States (Complete 50 States + DC)
        {'name': 'Alabama', 'code': 'AL', 'country': 'US', 'pop': 5024279, 'density': 1.1},
        {'name': 'Alaska', 'code': 'AK', 'country': 'US', 'pop': 733391, 'density': 0.5},
        {'name': 'Arizona', 'code': 'AZ', 'country': 'US', 'pop': 7151502, 'density': 1.1},
        {'name': 'Arkansas', 'code': 'AR', 'country': 'US', 'pop': 3011524, 'density': 1.1},
        {'name': 'California', 'code': 'CA', 'country': 'US', 'pop': 39538223, 'density': 2.0},
        {'name': 'Colorado', 'code': 'CO', 'country': 'US', 'pop': 5773714, 'density': 1.2},
        {'name': 'Connecticut', 'code': 'CT', 'country': 'US', 'pop': 3605944, 'density': 1.5},
        {'name': 'Delaware', 'code': 'DE', 'country': 'US', 'pop': 989948, 'density': 1.4},
        {'name': 'District of Columbia', 'code': 'DC', 'country': 'US', 'pop': 689545, 'density': 3.0},
        {'name': 'Florida', 'code': 'FL', 'country': 'US', 'pop': 21538187, 'density': 1.8},
        {'name': 'Georgia', 'code': 'GA', 'country': 'US', 'pop': 10711908, 'density': 1.2},
        {'name': 'Hawaii', 'code': 'HI', 'country': 'US', 'pop': 1455271, 'density': 1.3},
        {'name': 'Idaho', 'code': 'ID', 'country': 'US', 'pop': 1839106, 'density': 0.8},
        {'name': 'Illinois', 'code': 'IL', 'country': 'US', 'pop': 12812508, 'density': 1.6},
        {'name': 'Indiana', 'code': 'IN', 'country': 'US', 'pop': 6785528, 'density': 1.3},
        {'name': 'Iowa', 'code': 'IA', 'country': 'US', 'pop': 3190369, 'density': 0.9},
        {'name': 'Kansas', 'code': 'KS', 'country': 'US', 'pop': 2937880, 'density': 0.9},
        {'name': 'Kentucky', 'code': 'KY', 'country': 'US', 'pop': 4505836, 'density': 1.1},
        {'name': 'Louisiana', 'code': 'LA', 'country': 'US', 'pop': 4657757, 'density': 1.1},
        {'name': 'Maine', 'code': 'ME', 'country': 'US', 'pop': 1362359, 'density': 0.8},
        {'name': 'Maryland', 'code': 'MD', 'country': 'US', 'pop': 6177224, 'density': 1.6},
        {'name': 'Massachusetts', 'code': 'MA', 'country': 'US', 'pop': 7029917, 'density': 1.9},
        {'name': 'Michigan', 'code': 'MI', 'country': 'US', 'pop': 10077331, 'density': 1.3},
        {'name': 'Minnesota', 'code': 'MN', 'country': 'US', 'pop': 5706494, 'density': 1.0},
        {'name': 'Mississippi', 'code': 'MS', 'country': 'US', 'pop': 2961279, 'density': 0.9},
        {'name': 'Missouri', 'code': 'MO', 'country': 'US', 'pop': 6154913, 'density': 1.1},
        {'name': 'Montana', 'code': 'MT', 'country': 'US', 'pop': 1084225, 'density': 0.6},
        {'name': 'Nebraska', 'code': 'NE', 'country': 'US', 'pop': 1961504, 'density': 0.8},
        {'name': 'Nevada', 'code': 'NV', 'country': 'US', 'pop': 3104614, 'density': 1.1},
        {'name': 'New Hampshire', 'code': 'NH', 'country': 'US', 'pop': 1377529, 'density': 1.2},
        {'name': 'New Jersey', 'code': 'NJ', 'country': 'US', 'pop': 9288994, 'density': 2.2},
        {'name': 'New Mexico', 'code': 'NM', 'country': 'US', 'pop': 2117522, 'density': 0.8},
        {'name': 'New York', 'code': 'NY', 'country': 'US', 'pop': 20201249, 'density': 2.5},
        {'name': 'North Carolina', 'code': 'NC', 'country': 'US', 'pop': 10439388, 'density': 1.2},
        {'name': 'North Dakota', 'code': 'ND', 'country': 'US', 'pop': 779094, 'density': 0.6},
        {'name': 'Ohio', 'code': 'OH', 'country': 'US', 'pop': 11799448, 'density': 1.3},
        {'name': 'Oklahoma', 'code': 'OK', 'country': 'US', 'pop': 3959353, 'density': 1.0},
        {'name': 'Oregon', 'code': 'OR', 'country': 'US', 'pop': 4237256, 'density': 1.1},
        {'name': 'Pennsylvania', 'code': 'PA', 'country': 'US', 'pop': 13002700, 'density': 1.4},
        {'name': 'Rhode Island', 'code': 'RI', 'country': 'US', 'pop': 1097379, 'density': 2.0},
        {'name': 'South Carolina', 'code': 'SC', 'country': 'US', 'pop': 5118425, 'density': 1.2},
        {'name': 'South Dakota', 'code': 'SD', 'country': 'US', 'pop': 886667, 'density': 0.6},
        {'name': 'Tennessee', 'code': 'TN', 'country': 'US', 'pop': 6910840, 'density': 1.2},
        {'name': 'Texas', 'code': 'TX', 'country': 'US', 'pop': 29145505, 'density': 1.5},
        {'name': 'Utah', 'code': 'UT', 'country': 'US', 'pop': 3271616, 'density': 1.0},
        {'name': 'Vermont', 'code': 'VT', 'country': 'US', 'pop': 643077, 'density': 0.8},
        {'name': 'Virginia', 'code': 'VA', 'country': 'US', 'pop': 8631393, 'density': 1.3},
        {'name': 'Washington', 'code': 'WA', 'country': 'US', 'pop': 7705281, 'density': 1.4},
        {'name': 'West Virginia', 'code': 'WV', 'country': 'US', 'pop': 1793716, 'density': 1.0},
        {'name': 'Wisconsin', 'code': 'WI', 'country': 'US', 'pop': 5893718, 'density': 1.1},
        {'name': 'Wyoming', 'code': 'WY', 'country': 'US', 'pop': 576851, 'density': 0.5},
        
        # Other Countries (International Support)
        {'name': 'London', 'code': 'LND', 'country': 'GB', 'pop': 9000000, 'density': 3.0},
        {'name': 'Greater Manchester', 'code': 'MAN', 'country': 'GB', 'pop': 2800000, 'density': 2.0},
        {'name': 'Ontario', 'code': 'ON', 'country': 'CA', 'pop': 14730000, 'density': 1.5},
        {'name': 'British Columbia', 'code': 'BC', 'country': 'CA', 'pop': 5140000, 'density': 1.3},
        {'name': 'New South Wales', 'code': 'NSW', 'country': 'AU', 'pop': 8166000, 'density': 1.2},
        {'name': 'Victoria', 'code': 'VIC', 'country': 'AU', 'pop': 6680000, 'density': 1.5},
        {'name': 'Tokyo', 'code': 'TK', 'country': 'JP', 'pop': 14000000, 'density': 4.5},
        {'name': 'Bavaria', 'code': 'BY', 'country': 'DE', 'pop': 13120000, 'density': 1.5},
        {'name': 'Île-de-France', 'code': 'IDF', 'country': 'FR', 'pop': 12210000, 'density': 4.0},
        {'name': 'Lombardy', 'code': 'LOM', 'country': 'IT', 'pop': 10060000, 'density': 2.0},
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
                state_name=r['name'],
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
