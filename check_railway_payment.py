import requests
import json
import sys

# Configuration
BASE_URL = "https://digital-ocean-production-01ee.up.railway.app"  # User's provided URL
LOGIN_URL = f"{BASE_URL}/api/auth/login/json"
PAYMENT_URL = f"{BASE_URL}/api/payment/create-checkout-session"

CREDENTIALS = {
    "email": "admin@adplatform.com",
    "password": "admin123"
}

def check_payment_status():
    print(f"🔍 Checking payment configuration on: {BASE_URL}")
    print("-" * 50)

    # 0. Health Check
    print("0️⃣  Checking API Reachability...")
    try:
        health_resp = requests.get(f"{BASE_URL}/api/health", timeout=10)
        print(f"   /api/health status: {health_resp.status_code}")
        if health_resp.status_code == 200:
            print(f"   ✅ API is reachable. Version: {health_resp.json().get('version', 'Unknown')}")
            
            # Try debugging routes
            routes_resp = requests.get(f"{BASE_URL}/api/debug/routes", timeout=5)
            if routes_resp.status_code == 200:
                print("   ✅ Routes list retrieved.")
                routes = routes_resp.json().get("routes", [])
                print(f"   Found {len(routes)} routes.")
                auth_routes = [r['path'] for r in routes if 'login' in r['path']]
                print(f"   Auth Routes found: {auth_routes}")
            else:
                 print(f"   ⚠️ Could not list routes: {routes_resp.status_code}")
        else:
            print(f"   ❌ API Health Check Failed: {health_resp.text}")
            # Try without /api prefix just in case
            health_resp_root = requests.get(f"{BASE_URL}/health", timeout=10)
            print(f"   /health status: {health_resp_root.status_code}")
    except Exception as e:
        print(f"   ❌ Connection Error: {e}")
        return

    # 1. Login
    print("\n1️⃣  Logging in...")
    try:
        session = requests.Session()
        resp = session.post(LOGIN_URL, json=CREDENTIALS, timeout=10)
        
        if resp.status_code != 200:
            print(f"❌ Login Failed: {resp.status_code}")
            print(resp.text)
            return
            
        token_data = resp.json()
        token = token_data.get("access_token")
        if not token:
            print("❌ No access token received")
            return
            
        print("✅ Login Successful")
        headers = {"Authorization": f"Bearer {token}"}
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        return

    # 2. Initiate Payment (Mock Campaign)
    print("\n2️⃣  Initiating Test Checkout...")
    payload = {
        "campaign_id": 99999, # Dummy ID, might 404 if validation is strict, let's see
        "success_url": "http://localhost/success",
        "cancel_url": "http://localhost/cancel",
        "currency": "usd"
    }

    try:
        # We need a valid campaign ID usually. If 99999 fails with 404, we might need to create one or list one.
        # Let's try to fetch campaigns first to get a valid ID.
        print("   Fetching a valid campaign ID...")
        camp_resp = session.get(f"{BASE_URL}/api/campaigns", headers=headers)
        if camp_resp.status_code == 200:
            campaigns = camp_resp.json()
            if campaigns:
                payload["campaign_id"] = campaigns[0]["id"]
                print(f"   Using Campaign ID: {payload['campaign_id']}")
            else:
                print("   ⚠️ No campaigns found. Payment test might fail with 404.")
        
        resp = session.post(PAYMENT_URL, json=payload, headers=headers)
        
        if resp.status_code == 200:
            data = resp.json()
            url = data.get("checkout_url", "")
            print(f"\n📄 Response: {json.dumps(data, indent=2)}")
            
            if "mock=true" in url or "cs_test_" in url:
                print("\n⚠️  RESULT: MOCK MODE DETECTED")
                print("   The server is NOT using real Stripe.")
                print("   Reason: STRIPE_SECRET_KEY is missing or invalid in Railway variables.")
            elif "stripe.com" in url:
                print("\n✅ RESULT: STRIPE IS ACTIVE")
                print("   The server successfully generated a real Stripe Checkout URL.")
            else:
                print("\n❓ RESULT: Unknown URL format.")
                print(f"   URL: {url}")
        
        elif resp.status_code == 404:
             print("\n❌ Error: Campaign not found. Cannot test payment without a valid campaign.")
        else:
             print(f"\n❌ Error: Server returned {resp.status_code}")
             print(resp.text)

    except Exception as e:
        print(f"\n❌ Request Error: {e}")

if __name__ == "__main__":
    check_payment_status()
