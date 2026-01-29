import sys
import os

# Root directory
root_dir = os.path.dirname(os.path.abspath(__file__))
# Backend directory
backend_dir = os.path.join(root_dir, "backend")
sys.path.append(backend_dir)

from app.database import SessionLocal, init_db
from app import models, auth

def seed_essential():
    # Ensure tables exist
    init_db()
    
    db = SessionLocal()
    try:
        # 1. Admin
        admin = db.query(models.User).filter(models.User.email == "admin@adplatform.com").first()
        if not admin:
            print("Seeding Admin...")
            admin = models.User(
                name="System Admin",
                email="admin@adplatform.com",
                password_hash=auth.get_password_hash("admin123"),
                role=models.UserRole.ADMIN,
                country="US"
            )
            db.add(admin)
        else:
            admin.password_hash = auth.get_password_hash("admin123")
            admin.role = models.UserRole.ADMIN
            
        # 2. Test Advertiser
        adv = db.query(models.User).filter(models.User.email == "advertiser@test.com").first()
        if not adv:
            print("Seeding Test Advertiser...")
            adv = models.User(
                name="Test Advertiser",
                email="advertiser@test.com",
                password_hash=auth.get_password_hash("test123"),
                role=models.UserRole.ADVERTISER,
                country="US",
                industry="Tyres And Wheels"
            )
            db.add(adv)
        
        db.commit()
        print("Essential seeding complete.")
    finally:
        db.close()

if __name__ == "__main__":
    seed_essential()
