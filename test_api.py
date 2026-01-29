import requests

API_BASE = "http://localhost:8000/api"

def test_login():
    try:
        # 1. Login to get token
        res = requests.post(f"{API_BASE}/auth/login/json", json={
            "email": "advertiser@test.com",
            "password": "test123"
        })
        if res.status_code != 200:
            print(f"Login failed: {res.status_code} - {res.text}")
            return None
        
        token = res.json()["access_token"]
        print("Login Success!")
        return token
    except Exception as e:
        print(f"Error: {e}")
        return None

def test_create_campaign(token):
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "name": "API Test Campaign",
        "industry_type": "Retail",
        "start_date": "2024-02-01",
        "duration": 3,
        "budget": 5000,
        "coverage_type": "30-mile",
        "target_postcode": "12345",
        "description": "Created via API Test Script"
    }
    
    res = requests.post(f"{API_BASE}/campaigns", json=payload, headers=headers)
    print(f"Status: {res.status_code}")
    print(f"Response: {res.json()}")

if __name__ == "__main__":
    t = test_login()
    if t:
        test_create_campaign(t)
