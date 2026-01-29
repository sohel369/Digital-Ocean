from sqlalchemy import create_engine
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv
import sys

# Add current directory to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app import models

load_dotenv(dotenv_path="backend/.env")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("Error: DATABASE_URL not found in .env")
    sys.exit(1)

engine = create_engine(DATABASE_URL)

try:
    with Session(engine) as session:
        count = session.query(models.GeoData).count()
        print(f"Total GeoData records: {count}")
        
        if count > 0:
            results = session.query(models.GeoData).limit(5).all()
            for r in results:
                print(f"Record: {r.state_name} ({r.country_code}), Pop: {r.population}, Code: {r.state_code}")
        else:
            print("Table is empty!")
except Exception as e:
    print(f"Database error: {e}")
