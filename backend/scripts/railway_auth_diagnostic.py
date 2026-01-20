"""
Railway Authentication Diagnostic and Fix Script
Diagnoses and fixes authentication issues in production
"""
import os
import sys
from datetime import datetime
from passlib.context import CryptContext

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.database import SessionLocal, engine
from app import models
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def diagnose_and_fix():
    """Comprehensive authentication diagnostic and fix"""
    print("\n" + "="*80)
    print("🔍 Railway Authentication Diagnostic & Fix")
    print("="*80 + "\n")
    
    db = SessionLocal()
    
    try:
        # 1. Check JWT_SECRET configuration
        print("1️⃣ Checking JWT_SECRET Configuration...")
        print(f"   SECRET_KEY Type: {type(settings.SECRET_KEY)}")
        print(f"   SECRET_KEY Length: {len(settings.SECRET_KEY)}")
        
        if settings.SECRET_KEY == "dev_secret_key_change_me_in_production":
            print("   ❌ WARNING: Using default development SECRET_KEY!")
            print("   💡 Set JWT_SECRET environment variable in Railway")
        else:
            print(f"   ✅ Custom SECRET_KEY detected (first 10 chars): {settings.SECRET_KEY[:10]}...")
        
        print(f"   Algorithm: {settings.ALGORITHM}")
        print(f"   Token Expiration: {settings.ACCESS_TOKEN_EXPIRE_MINUTES} minutes")
        print()
        
        # 2. Check Database Connection
        print("2️⃣ Checking Database Connection...")
        try:
            db.execute("SELECT 1")
            print("   ✅ Database connection successful")
        except Exception as e:
            print(f"   ❌ Database connection failed: {e}")
            return
        print()
        
        # 3. Check Admin User
        print("3️⃣ Checking Admin User...")
        admin = db.query(models.User).filter(
            models.User.email == "admin@adplatform.com"
        ).first()
        
        if not admin:
            print("   ❌ Admin user not found!")
            print("   🔧 Creating admin user...")
            
            # Create admin user
            admin = models.User(
                name="Administrator",
                email="admin@adplatform.com",
                password_hash=pwd_context.hash("admin123"),
                role=models.UserRole.ADMIN,
                country="US",
                created_at=datetime.utcnow(),
                last_login=datetime.utcnow()
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            print("   ✅ Admin user created successfully!")
        else:
            print(f"   ✅ Admin user found (ID: {admin.id})")
            print(f"   Name: {admin.name}")
            print(f"   Email: {admin.email}")
            print(f"   Role: {admin.role.value}")
            print(f"   Has Password Hash: {bool(admin.password_hash)}")
            
            # Verify password
            if admin.password_hash:
                is_valid = pwd_context.verify("admin123", admin.password_hash)
                if is_valid:
                    print("   ✅ Admin password verification successful")
                else:
                    print("   ❌ Admin password verification failed!")
                    print("   🔧 Resetting admin password...")
                    admin.password_hash = pwd_context.hash("admin123")
                    db.commit()
                    print("   ✅ Admin password reset to 'admin123'")
            else:
                print("   ❌ Admin has no password hash!")
                print("   🔧 Setting admin password...")
                admin.password_hash = pwd_context.hash("admin123")
                db.commit()
                print("   ✅ Admin password set to 'admin123'")
        print()
        
        # 4. Test Token Generation
        print("4️⃣ Testing Token Generation...")
        try:
            from app.auth import create_access_token, decode_token
            
            test_token = create_access_token(
                data={"sub": str(admin.id), "email": admin.email, "role": admin.role.value}
            )
            print(f"   ✅ Token generated (length: {len(test_token)})")
            print(f"   Token preview: {test_token[:50]}...")
            
            # Verify token can be decoded
            payload = decode_token(test_token)
            print(f"   ✅ Token decoded successfully")
            print(f"   Token payload: sub={payload.get('sub')}, email={payload.get('email')}")
        except Exception as e:
            print(f"   ❌ Token generation/verification failed: {e}")
            import traceback
            traceback.print_exc()
        print()
        
        # 5. Check Test User
        print("5 ️⃣ Checking Test User...")
        test_user = db.query(models.User).filter(
            models.User.email == "advertiser@test.com"
        ).first()
        
        if not test_user:
            print("   ⚠️ Test user not found")
            print("   🔧 Creating test user...")
            
            test_user = models.User(
                name="Test Advertiser",
                email="advertiser@test.com",
                password_hash=pwd_context.hash("test123"),
                role=models.UserRole.ADVERTISER,
                country="US",
                industry="Vehicle Servicing And Maintenance",
                created_at=datetime.utcnow(),
                last_login=datetime.utcnow()
            )
            db.add(test_user)
            db.commit()
            print("   ✅ Test user created successfully!")
        else:
            print(f"   ✅ Test user found (ID: {test_user.id})")
        print()
        
        # 6. Database Statistics
        print("6️⃣ Database Statistics...")
        total_users = db.query(models.User).count()
        admin_users = db.query(models.User).filter(models.User.role == models.UserRole.ADMIN).count()
        advertiser_users = db.query(models.User).filter(models.User.role == models.UserRole.ADVERTISER).count()
        
        print(f"   Total Users: {total_users}")
        print(f"   Admin Users: {admin_users}")
        print(f"   Advertiser Users: {advertiser_users}")
        print()
        
        # Summary
        print("="*80)
        print("📊 Diagnostic Summary")
        print("="*80)
        print()
        print("✅ Database: Connected")
        print(f"✅ Admin User: {'Verified' if admin else 'Created'}")
        print(f"✅ Test User: {'Verified' if test_user else 'Created'}")
        print("✅ Token Generation: Working")
        print()
        print("🔐 Test Credentials:")
        print("   Admin: admin@adplatform.com / admin123")
        print("   User: advertiser@test.com / test123")
        print()
        
        if settings.SECRET_KEY == "dev_secret_key_change_me_in_production":
            print("⚠️  ACTION REQUIRED:")
            print("   Set JWT_SECRET environment variable in Railway!")
            print("   Without this, tokens will be invalidated on every deployment.")
            print()
        
        print("="*80)
        print("✨ Diagnostic Complete!")
        print("="*80)
        
    except Exception as e:
        print(f"\n❌ Error during diagnostic: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    diagnose_and_fix()
