
import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

def migrate_postgres():
    load_dotenv('backend/.env')
    db_url = os.getenv('DATABASE_URL')
    print(f"Migrating Postgres at {db_url}")
    
    engine = create_engine(db_url)
    
    columns_to_add = [
        ("radius_areas_count", "INTEGER DEFAULT 1"),
        ("density_multiplier", "FLOAT DEFAULT 1.0"),
        ("fips", "INTEGER"),
        ("density_mi", "FLOAT"),
        ("rank", "INTEGER"),
        ("population_percent", "FLOAT")
    ]
    
    with engine.connect() as conn:
        for col, dtype in columns_to_add:
            try:
                # Check if column exists (Postgres)
                res = conn.execute(text(f"SELECT column_name FROM information_schema.columns WHERE table_name='geodata' AND column_name='{col}'"))
                if res.fetchone() is None:
                    print(f"Adding column {col}...")
                    conn.execute(text(f"ALTER TABLE geodata ADD COLUMN {col} {dtype}"))
                else:
                    print(f"Column {col} already exists.")
            except Exception as e:
                print(f"Error adding {col}: {e}")
        conn.commit()

if __name__ == "__main__":
    migrate_postgres()
