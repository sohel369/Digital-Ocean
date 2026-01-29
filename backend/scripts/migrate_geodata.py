"""
Script to add missing columns to PostgreSQL database.
"""
import sys
import os
from sqlalchemy import text

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import engine

def migrate():
    with engine.connect() as conn:
        print("🔍 Checking if radius_areas_count exists...")
        try:
            conn.execute(text("ALTER TABLE geodata ADD COLUMN radius_areas_count INTEGER DEFAULT 1"))
            conn.commit()
            print("✅ Column radius_areas_count added to geodata table.")
        except Exception as e:
            if "already exists" in str(e):
                print("ℹ️ Column radius_areas_count already exists.")
            else:
                print(f"❌ Error adding column: {e}")
                
if __name__ == "__main__":
    migrate()
