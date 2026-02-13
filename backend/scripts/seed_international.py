import os
import sys
import pandas as pd
import re

# Add the backend directory to sys.path so we can import 'app'
# This handles both local and Railway environments
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(base_dir)

from app import models, database
from sqlalchemy.orm import Session

# Country mapping
COUNTRY_MAP = {
    'USA': 'US',
    'China': 'CN',
    'Vietnam': 'VN',
    'Indonesia': 'ID',
    'Thailand': 'TH',
    'Germany': 'DE',
    'France': 'FR',
    'Spain': 'ES',
    'United Kingdom': 'GB',
    'Italy': 'IT',
    'Canada': 'CA',
    'Japan': 'JP',
    'Phillipines': 'PH',
    'India': 'IN'
}

def clean_val(val):
    if pd.isna(val) or str(val).strip() == '':
        return None
    return str(val).strip()

def to_float(val):
    try:
        if pd.isna(val): return 0.0
        return float(str(val).replace(',', '').strip())
    except:
        return 0.0

def to_int(val):
    try:
        if pd.isna(val): return 0
        return int(float(str(val).replace(',', '').strip()))
    except:
        return 0

def seed():
    # File is now inside backend/data/
    csv_file = os.path.join(base_dir, 'data', 'international_geo.csv')
    if not os.path.exists(csv_file):
        print(f"❌ Error: {csv_file} not found.")
        return

    print(f"🚀 Starting International Geodata Seeding from {csv_file}")
    db = database.SessionLocal()
    
    try:
        df = pd.read_csv(csv_file, header=None)
        current_country_name = None
        current_country_code = None
        added = 0
        updated = 0

        for _, row in df.iterrows():
            col0 = clean_val(row[0])
            if not col0: continue
            
            if col0 in COUNTRY_MAP:
                current_country_name = col0
                current_country_code = COUNTRY_MAP[col0]
                print(f"🌍 Processing {current_country_name}...")
                continue
            
            if col0 in ['Column1.state', 'USA', 'TOTALS', 'Totals']:
                continue
                
            if current_country_code:
                state_raw = col0
                state_name = re.sub(r'\s*\([^)]*\)', '', state_raw).strip()
                
                # Special Philippines mapping
                if current_country_code == 'PH':
                    if "Region I" in state_raw and "Ilocos" not in state_name:
                        state_name = "Ilocos Region"
                    if "Region II" in state_raw and "Cagayan" not in state_name:
                        state_name = "Cagayan Valley"

                state_code = clean_val(row[1])
                pop = to_int(row[2])
                density_mi = to_float(row[3])
                area_mi = to_float(row[4])
                radius_30 = to_int(row[5])
                density_mult = to_float(row[6])
                
                area_km = area_mi * 2.58999
                
                existing = db.query(models.GeoData).filter(
                    models.GeoData.country_code == current_country_code,
                    models.GeoData.state_name == state_name
                ).first()
                
                if existing:
                    existing.state_code = state_code
                    existing.population = pop
                    existing.density_mi = density_mi
                    existing.land_area_sq_km = area_km
                    existing.radius_areas_count = radius_30
                    existing.density_multiplier = density_mult
                    updated += 1
                else:
                    new_geo = models.GeoData(
                        country_code=current_country_code,
                        state_code=state_code,
                        state_name=state_name,
                        population=pop,
                        density_mi=density_mi,
                        land_area_sq_km=area_km,
                        radius_areas_count=radius_30,
                        density_multiplier=density_mult
                    )
                    db.add(new_geo)
                    added += 1
                    
        db.commit()
        print(f"✅ Seeding Complete! Added: {added}, Updated: {updated}")
    except Exception as e:
        print(f"❌ Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
