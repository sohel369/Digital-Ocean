import os
import sys
import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the backend directory to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app import models, database

# Mapping of Country Names in Excel to ISO Codes
COUNTRY_MAP = {
    "USA": "US",
    "Spain": "ES",
    "Bedfordshire": "GB", # Bedfordshire name section header but it is UK
    "UK": "GB",
    "Great Britain": "GB",
    "Italy": "IT",
    "Abruzzo": "IT",
    "Canada": "CA",
    "Alberta": "CA",
    "Japan": "JP",
    "Hokkaido": "JP",
    "Philippines": "PH",
    "Illocus": "PH",
    "India": "IN",
    "Andrha Pradesh": "IN",
    "Andhra Pradesh": "IN",
    "Australia": "AU",
    "Germany": "DE",
    "France": "FR",
    "Brazil": "BR",
    "Mexico": "MX"
}

# The user mentioned 14 countries. I will detect headers and try to map.
ISO_MAP = {
    "USA": "US",
    "ESPAÑA": "ES",
    "UNITED KINGDOM": "GB",
    "ITALIA": "IT",
    "CANADA": "CA",
    "JAPAN": "JP",
    "PHILIPPINES": "PH",
    "INDIA": "IN",
    "AUSTRALIA": "AU",
    "GERMANY": "DE",
    "FRANCE": "FR",
    "BANGLADESH": "BD",
    "UNITED ARAB EMIRATES": "AE",
    "SAUDI ARABIA": "SA"
}

def clean_num(val):
    if pd.isna(val) or val == "":
        return 0
    try:
        if isinstance(val, str):
            val = val.replace(",", "").replace(" ", "")
        return float(val)
    except:
        return 0

def import_data():
    file_path = "Geograpic Size and Population of  14 Different Countries.xlsx"
    if not os.path.exists(file_path):
        print(f"Error: {file_path} not found")
        return

    print(f"Reading {file_path}...")
    xl = pd.ExcelFile(file_path)
    df = xl.parse('us-states---ranking-by-populati')

    database.init_db()
    db = database.SessionLocal()

    current_country_code = "US"
    count = 0

    for i, row in df.iterrows():
        col0 = str(row[0]).strip()
        
        # Detect new country section
        if "Column1.state" in col0:
            # Check row-1 for country name? Or check columns
            hint = ""
            for c in row.tolist():
                if isinstance(c, str) and " as Control" in c:
                    hint = c.replace(" as Control", "").strip()
                    break
            
            if hint and hint in COUNTRY_MAP:
                current_country_code = COUNTRY_MAP[hint]
            elif hint in ISO_MAP:
                current_country_code = ISO_MAP[hint]
            elif i == 0:
                current_country_code = "US"
            else:
                # If we can't find hint, maybe it's in a previous row
                prev_row = df.iloc[i-1].tolist() if i > 0 else []
                for pr in prev_row:
                    if isinstance(pr, str) and pr.strip() in COUNTRY_MAP:
                        current_country_code = COUNTRY_MAP[pr.strip()]
                        break

            print(f"Switching to Country: {current_country_code} at row {i}")
            continue

        if col0 == 'nan' or not col0 or col0.lower() == 'state' or 'column1' in col0.lower():
            continue

        # Data Row
        name = col0
        code = str(row[1]).strip() if not pd.isna(row[1]) else ""
        pop = clean_num(row[2])
        density_mi = clean_num(row[3])
        area = clean_num(row[4])
        radius_count = int(clean_num(row[5])) or 1
        density_mult = clean_num(row[6]) or 1.0

        if pop == 0:
            continue

        # Check if exists
        state = db.query(models.GeoData).filter(
            models.GeoData.state_name == name,
            models.GeoData.country_code == current_country_code
        ).first()

        if state:
            state.population = int(pop)
            state.land_area_sq_km = area * 2.58999 # Sq mi to sq km approx
            state.density_multiplier = density_mult
            state.radius_areas_count = radius_count
            state.state_code = code
        else:
            state = models.GeoData(
                country_code=current_country_code,
                state_name=name,
                state_code=code,
                population=int(pop),
                land_area_sq_km=area * 2.58999,
                density_multiplier=density_mult,
                radius_areas_count=radius_count
            )
            db.add(state)
        
        count += 1
        if count % 50 == 0:
            db.commit()
            print(f"Processed {count} regions...")

    db.commit()
    print(f"Finished! Total {count} regions imported across multiple countries.")

if __name__ == "__main__":
    import_data()
