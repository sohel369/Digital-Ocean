import os
import sys
import logging
from sqlalchemy import text, create_engine

# Add backend to path so we can import app
sys.path.append(os.path.join(os.getcwd(), 'backend'))

try:
    from app.config import settings
    from app.database import engine
except ImportError:
    print("❌ Could not import app settings. Make sure you are in the project root.")
    sys.exit(1)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("fix_enum")

def fix_enum():
    if "postgres" not in settings.DATABASE_URL:
        logger.info("ℹ️ Database is not Postgres. Skipping Enum fix.")
        return

    logger.info(f"🔗 Connecting to database to fix 'userrole' enum...")
    
    # We need a connection that doesn't use transactions for ALTER TYPE ADD VALUE
    # if the postgres version is older, but usually Railway is fine.
    try:
        with engine.connect() as conn:
            # We use execution_options(isolation_level="AUTOCOMMIT") because 
            # ALTER TYPE ... ADD VALUE cannot run inside a transaction block in some PG versions
            conn = conn.execution_options(isolation_level="AUTOCOMMIT")
            
            roles_to_add = ['admin', 'country_admin', 'user', 'advertiser']
            
            for role in roles_to_add:
                try:
                    logger.info(f"⏳ Checking/Adding role: {role}")
                    # Checking if value exists in enum is better to avoid errors
                    conn.execute(text(f"ALTER TYPE userrole ADD VALUE '{role}'"))
                    logger.info(f"✅ Added {role} to userrole enum")
                except Exception as e:
                    if "already exists" in str(e).lower():
                        logger.info(f"✅ Role {role} already exists in enum.")
                    else:
                        logger.warning(f"⚠️ Error adding {role}: {e}")

            logger.info("🎉 Database Enum fix completed!")
            
    except Exception as e:
        logger.error(f"❌ Critical error during fix: {e}")

if __name__ == "__main__":
    fix_enum()
