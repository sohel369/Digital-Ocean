
import sys
import os
from fastapi.testclient import TestClient

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from app.main import app
from app.auth import create_access_token
from app.database import SessionLocal
from app import models

client = TestClient(app)

def get_user_token(email):
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            print(f"User {email} not found")
            return None
        
        # Ensure role is string for token creation
        role_val = user.role.value if hasattr(user.role, "value") else user.role
        token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": role_val})
        return token
    finally:
        db.close()

def test_pricing_config():
    token = get_user_token("sohel@gmail.com")
    if not token:
        return

    headers = {"Authorization": f"Bearer {token}"}
    print("Testing /api/pricing/config?country_code=BD")
    try:
        response = client.get("/api/pricing/config?country_code=BD", headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code != 200:
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"EXCEPTION in pricing: {e}")
        import traceback
        traceback.print_exc()

    print("\nTesting /api/geo/regions/BD")
    try:
        response_geo = client.get("/api/geo/regions/BD", headers=headers)
        print(f"Status: {response_geo.status_code}")
        if response_geo.status_code != 200:
            print(f"Response: {response_geo.text}")
    except Exception as e:
        print(f"EXCEPTION in geo: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_pricing_config()
