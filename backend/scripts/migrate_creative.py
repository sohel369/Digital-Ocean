import sys
import os
from sqlalchemy import create_engine, text

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.config import settings

def migrate():
    print(f"Connecting to {settings.DATABASE_URL}...")
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        print("Adding columns to campaigns table...")
        try:
            conn.execute(text("ALTER TABLE campaigns ADD COLUMN headline VARCHAR(500)"))
            print("✅ Added headline column")
        except Exception as e:
            print(f"⚠️  Could not add headline column: {e}")

        try:
            conn.execute(text("ALTER TABLE campaigns ADD COLUMN landing_page_url VARCHAR(500)"))
            print("✅ Added landing_page_url column")
        except Exception as e:
            print(f"⚠️  Could not add landing_page_url column: {e}")

        try:
            conn.execute(text("ALTER TABLE campaigns ADD COLUMN ad_format VARCHAR(100)"))
            print("✅ Added ad_format column")
        except Exception as e:
            print(f"⚠️  Could not add ad_format column: {e}")
        
        conn.commit()
    print("Migration complete!")

if __name__ == "__main__":
    migrate()
