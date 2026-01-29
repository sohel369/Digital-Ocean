
import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

def check_postgres():
    load_dotenv('backend/.env')
    db_url = os.getenv('DATABASE_URL')
    print(f"Checking Postgres at {db_url}")
    
    engine = create_engine(db_url)
    with engine.connect() as conn:
        # Check Iowa
        res = conn.execute(text("SELECT state_name, population, radius_areas_count FROM geodata WHERE state_name='Iowa'"))
        print(f"Iowa: {res.fetchone()}")
        
        # Check count
        res = conn.execute(text("SELECT count(*) FROM geodata WHERE country_code='US'"))
        print(f"Total US states: {res.fetchone()[0]}")
        
        # Check first 5
        res = conn.execute(text("SELECT state_name FROM geodata WHERE country_code='US' LIMIT 5"))
        print(f"First 5: {[r[0] for r in res]}")

if __name__ == "__main__":
    check_postgres()
