import pandas as pd
import os
import sys
import re

# Add the backend directory to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app import models, database
from sqlalchemy.orm import Session

# Country mapping (keys must match stripped values from clean_val)
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

def seed_international_data():
    csv_file = 'sheet_us-states---ranking-by-populati.csv'
    if not os.path.exists(csv_file):
        print(f"Error: {csv_file} not found. Run export_sheets.py first.")
        return

    db = database.SessionLocal()
    
    # Read CSV without headers to parse country blocks
    df = pd.read_csv(csv_file, header=None)
    
    current_country_name = None
    current_country_code = None
    
    added_count = 0
    updated_count = 0
    
    print("Starting seeding process...")
    
    for _, row in df.iterrows():
        col0 = clean_val(row[0])
        if not col0:
            continue
            
        # Check if this row is a country identifier
        if col0 in COUNTRY_MAP:
            current_country_name = col0
            current_country_code = COUNTRY_MAP[col0]
            print(f"\n🌍 Processing Country: {current_country_name} ({current_country_code})")
            continue
            
        # Skip header rows
        if col0 == 'Column1.state' or col0 == 'USA' or col0 == 'TOTALS' or col0 == 'Totals':
            continue
            
        # If we have a country, and it's not a header, it's a data row
        if current_country_code:
            state_raw = col0
            # Clean name: remove stuff in parentheses like "(Region X)"
            state_name = re.sub(r'\s*\([^)]*\)', '', state_raw).strip()
            
            # Special Philippines mapping for Ilocos/Cagayan if they are cut off in CSV
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
            
            # Conversion
            area_km = area_mi * 2.58999
            
            # Check if exists
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
                updated_count += 1
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
                added_count += 1
                
    db.commit()
    db.close()
    
    print("\n" + "="*30)
    print(f"Seeding Complete!")
    print(f"Added: {added_count}")
    print(f"Updated: {updated_count}")
    print("="*30)

if __name__ == "__main__":
    seed_international_data()
