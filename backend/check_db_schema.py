import os
import sys
import logging
from sqlalchemy import create_engine, inspect, text
from urllib.parse import urlparse

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("schema_check")

# Get Database URL from environment or arguments
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print("❌ Error: DATABASE_URL environment variable is not set.")
    print("Usage: POSTGRES_URL=... python check_db_schema.py")
    sys.exit(1)

def check_schema():
    print(f"🔌 Connecting to database...")
    try:
        # Create engine
        engine = create_engine(DATABASE_URL)
        inspector = inspect(engine)
        
        # Check connection
        with engine.connect() as conn:
            version = conn.execute(text("SELECT version();")).scalar()
            print(f"✅ Connected to: {version}")

        print("\n🔍 Inspecting Tables...")
        tables = inspector.get_table_names()
        print(f"found tables: {tables}")

        required_checks = {
            "campaigns": ["headline", "landing_page_url", "ad_format", "calculated_price"],
            "users": ["last_login", "profile_picture"],
            "pricing_matrix": ["industry_type", "base_rate", "multiplier"]
        }

        all_good = True

        for table, required_cols in required_checks.items():
            if table not in tables:
                print(f"❌ Table '{table}' assumes missing!")
                all_good = False
                continue
            
            print(f"\nChecking table '{table}':")
            columns = inspector.get_columns(table)
            existing_col_names = [c["name"] for c in columns]
            
            for req in required_cols:
                if req in existing_col_names:
                    print(f"  ✅ {req} exists")
                else:
                    print(f"  ❌ {req} MISSING!")
                    all_good = False
        
        if all_good:
            print("\n✨ All critical schema elements are present! The application should run correctly.")
        else:
            print("\n⚠️ Database schema mismatches found. Migration script in main.py should run on next startup.")

    except Exception as e:
        print(f"❌ Connection failed: {e}")

if __name__ == "__main__":
    check_schema()
