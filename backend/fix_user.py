
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from app import models
from app.database import SessionLocal

def fix_user():
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.email == "sohel@gmail.com").first()
        if user:
            print(f"Updating user {user.email}...")
            user.managed_country = "BD"
            db.commit()
            print("User updated successfully. Managed Country set to 'BD'.")
        else:
            print("User sohel@gmail.com not found.")
            
    except Exception as e:
        print(f"Error updating user: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_user()
