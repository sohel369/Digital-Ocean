"""
Database migration script to add missing 'industry' column to users table.
Run this on Railway to fix the schema issue.
"""
import os
import sys
from sqlalchemy import create_engine, text

# Get DATABASE_URL from environment
DATABASE_URL = os.environ.get("DATABASE_URL")

if not DATABASE_URL:
    print("❌ ERROR: DATABASE_URL environment variable not set!")
    sys.exit(1)

# Fix postgres:// to postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

print("="*80)
print("🔧 DATABASE MIGRATION: Adding 'industry' column to users table")
print("="*80)
print(f"Database: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else 'configured'}")
print()

try:
    # Create engine
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        # Check if column exists
        print("Checking if 'industry' column exists...")
        
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='industry'
        """))
        
        exists = result.fetchone() is not None
        
        if exists:
            print("✅ Column 'industry' already exists in users table")
            print("No migration needed!")
        else:
            print("⚠️  Column 'industry' does NOT exist")
            print("Adding column...")
            
            # Add the column
            conn.execute(text("ALTER TABLE users ADD COLUMN industry VARCHAR(255)"))
            conn.commit()
            
            print("✅ Successfully added 'industry' column to users table")
            
            # Verify
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='users' AND column_name='industry'
            """))
            
            if result.fetchone():
                print("✅ Verification successful: Column exists")
            else:
                print("❌ Verification failed: Column not found after migration")
                sys.exit(1)
    
    print()
    print("="*80)
    print("🎉 MIGRATION COMPLETE!")
    print("="*80)
    print()
    print("Next steps:")
    print("1. Restart your Railway backend service")
    print("2. Test login: admin@adplatform.com / admin123")
    print("3. Verify no more 'column users.industry does not exist' errors")
    print()
    
except Exception as e:
    print()
    print("="*80)
    print("❌ MIGRATION FAILED!")
    print("="*80)
    print(f"Error: {e}")
    print()
    print("Troubleshooting:")
    print("1. Check DATABASE_URL is correct")
    print("2. Verify database connection")
    print("3. Check PostgreSQL permissions")
    print()
    sys.exit(1)
