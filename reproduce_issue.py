
import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_admin_config():
    print("Testing Admin Config Save...")
    url = f"{BASE_URL}/pricing/admin/config"
    # Need admin token? backend/app/routers/pricing.py says Depends(auth.get_current_admin_user)
    # So I need to login as admin first.
    
    # Login as admin
    auth_url = f"{BASE_URL}/auth/token"
    # Assuming admin user exists (created in startup)
    data = {"username": "admin@adplatform.com", "password": "admin123"}
    try:
        resp = requests.post(auth_url, data=data)
        if resp.status_code != 200:
            print(f"Login failed: {resp.status_code} {resp.text}")
            return
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Now try to save config
        config_payload = {
            "industries": [{"name": "Retail", "multiplier": 1.2}],
            "ad_types": [{"name": "Display", "base_rate": 100}],
            "states": [{"name": "California", "land_area": 100, "population": 1000, "density_multiplier": 1.0, "state_code": "CA", "country_code": "US"}],
            "discounts": {"state": 10, "national": 20}
        }
        
        resp = requests.post(url, json=config_payload, headers=headers)
        print(f"Save Config: {resp.status_code}")
        print(resp.text)
        
    except Exception as e:
        print(f"Admin Config Test Error: {e}")

def test_create_campaign():
    print("Testing Campaign Create...")
    url = f"{BASE_URL}/campaigns"
    # Need user token. default user?
    # Create user first? Or use admin.
    
    auth_url = f"{BASE_URL}/auth/token"
    data = {"username": "admin@adplatform.com", "password": "admin123"}
    resp = requests.post(auth_url, data=data)
    if resp.status_code != 200:
        print("Login failed")
        return
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    payload = {
        "name": "Test Campaign",
        "budget": 1000,
        "industry": "Retail",
        "format": "Display",
        "startDate": "2026-02-01",
        "endDate": "2026-02-10",
        "meta": {
            "location": "90210",
            "coverage": "radius"
        }
    }
    
    try:
        resp = requests.post(url, json=payload, headers=headers)
        print(f"Create Campaign: {resp.status_code}")
        print(resp.text)
    except Exception as e:
        print(f"Create Campaign Error: {e}")

if __name__ == "__main__":
    test_admin_config()
    test_create_campaign()
