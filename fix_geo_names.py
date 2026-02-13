import os
import sys
import re

# Add the backend directory to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app import models, database
from sqlalchemy.orm import Session

def fix_ph_names():
    db = database.SessionLocal()
    
    # PH Mapping from static geoData.js for exact matching
    EXPECTED_PH_NAMES = [
        'National Capital Region', 'CALABARZON', 'Central Luzon', 
        'Central Visayas', 'Western Visayas', 'Davao Region', 
        'Northern Mindanao', 'Ilocos Region', 'Bicol Region', 
        'Zamboanga Peninsula', 'MIMAROPA', 'Eastern Visayas', 
        'SOCCSKSARGEN', 'Caraga', 'Bangsamoro Autonomous Region', 
        'Cordillera Administrative Region'
    ]
    
    # Update PH Records
    ph_regions = db.query(models.GeoData).filter(models.GeoData.country_code == 'PH').all()
    print(f"Checking {len(ph_regions)} PH regions...")
    
    updated_count = 0
    for r in ph_regions:
        old_name = r.state_name
        # Remove anything in parentheses like " (Region X)" or " (NCR)"
        new_name = re.sub(r'\s*\([^)]*\)', '', old_name).strip()
        
        # Special case: "Region (Region I)" -> "Ilocos Region"
        if "Region I" in old_name and "Ilocos" not in old_name:
             new_name = "Ilocos Region"
        if "Region II" in old_name and "Cagayan" not in old_name:
             new_name = "Cagayan Valley"
             
        if old_name != new_name:
            r.state_name = new_name
            print(f"Updating: '{old_name}' -> '{new_name}'")
            updated_count += 1
            
    db.commit()
    print(f"Updated {updated_count} PH records.")
    
    # Check other countries for similar patterns
    other_regions = db.query(models.GeoData).filter(models.GeoData.country_code != 'PH', models.GeoData.country_code != 'US').all()
    other_updated = 0
    for r in other_regions:
        old_name = r.state_name
        if not old_name: continue
        
        # Strip trailing spaces or parentheses if any
        new_name = re.sub(r'\s*\([^)]*\)', '', old_name).strip()
        
        if old_name != new_name:
            r.state_name = new_name
            # print(f"Updating: '{old_name}' -> '{new_name}'")
            other_updated += 1
            
    db.commit()
    print(f"Updated {other_updated} other country records.")
    
    db.close()

if __name__ == "__main__":
    fix_ph_names()
