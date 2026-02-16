import os
import sys
import logging
from sqlalchemy import text, create_engine
from dotenv import load_dotenv

# Add backend to path so we can import app
sys.path.append(os.path.join(os.getcwd(), 'backend'))

def fix_railway_roles():
    # Try to load from .env if it exists
    load_dotenv('backend/.env')
    
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("❌ Error: DATABASE_URL environment variable is not set.")
        return

    print(f"🔗 Connecting to database to fix role column...")
    
    try:
        engine = create_engine(db_url)
        with engine.connect() as conn:
            # Check current column type
            res = conn.execute(text("""
                SELECT data_type, udt_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'role'
            """)).fetchone()
            
            if res:
                data_type, udt_name = res
                print(f"📊 Current 'role' column type: {data_type} ({udt_name})")
                
                # If it's a USER-DEFINED type (like an enum), convert it to VARCHAR
                if data_type == 'USER-DEFINED' or udt_name == 'userrole':
                    print("⚠️  Detected ENUM type. Converting to VARCHAR(50) for compatibility...")
                    
                    # 1. Convert column to VARCHAR
                    # We use a transaction-safe way or AUTOCOMMIT for Postgres broad changes
                    conn = conn.execution_options(isolation_level="AUTOCOMMIT")
                    
                    try:
                        conn.execute(text("ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(50) USING role::text"))
                        print("✅ Role column converted to VARCHAR(50)")
                        
                        # 2. Add missing values to the enum JUST IN CASE something else still uses it
                        # though usually we can just drop it if no other columns use it.
                        print("⏳ Also ensuring 'userrole' ENUM has all required values...")
                        roles = ['admin', 'country_admin', 'user', 'advertiser']
                        for role in roles:
                            try:
                                conn.execute(text(f"ALTER TYPE userrole ADD VALUE IF NOT EXISTS '{role}'"))
                                print(f"  - Added/Verified {role} in Enum")
                            except Exception as e:
                                # 'IF NOT EXISTS' is only PG 9.4+, older might fail, handle that
                                if "already exists" in str(e).lower():
                                    pass
                                else:
                                    print(f"  - (Note: Could not add {role} to enum directly: {e})")
                                    
                    except Exception as e:
                        print(f"❌ Error during conversion: {e}")
                else:
                    print("✅ Column is already VARCHAR or compatible type.")
                    
                    # Still check for Enum values if the user wants to stay on Enum
                    # But if it's already VARCHAR, we are good.
                    print("⏳ Checking if we should still update the 'userrole' type just in case...")
                    try:
                        roles = ['admin', 'country_admin', 'user', 'advertiser']
                        conn = conn.execution_options(isolation_level="AUTOCOMMIT")
                        for role in roles:
                            try:
                                conn.execute(text(f"ALTER TYPE userrole ADD VALUE '{role}'"))
                                print(f"  - Added {role} to Enum")
                            except Exception as e:
                                if "already exists" in str(e).lower():
                                    print(f"  - {role} already in Enum")
                                else:
                                    print(f"  - (Note: {e})")
                    except:
                        pass
            else:
                print("❌ 'users' table or 'role' column not found.")

        print("\n🎉 Fix process completed!")
            
    except Exception as e:
        print(f"❌ Critical error: {e}")

if __name__ == "__main__":
    fix_railway_roles()
