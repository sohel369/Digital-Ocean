"""
Railway Authentication Test Script
Tests JWT authentication on Railway deployment
"""
import requests
import json
import sys

# Railway Backend URL - UPDATE THIS!
RAILWAY_BACKEND_URL = "https://balanced-wholeness-production-ca00.up.railway.app"

def test_health():
    """Test health endpoint"""
    print("\n" + "="*80)
    print("🏥 Testing Health Endpoint")
    print("="*80)
    
    try:
        response = requests.get(f"{RAILWAY_BACKEND_URL}/api/health", timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ Health check passed!")
            return True
        else:
            print("❌ Health check failed!")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_admin_login():
    """Test admin login"""
    print("\n" + "="*80)
    print("🔐 Testing Admin Login")
    print("="*80)
    
    try:
        response = requests.post(
            f"{RAILWAY_BACKEND_URL}/api/auth/login/json",
            json={
                "email": "admin@adplatform.com",
                "password": "admin123"
            },
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Admin login successful!")
            print(f"Access Token: {data.get('access_token', 'N/A')[:50]}...")
            print(f"Token Type: {data.get('token_type', 'N/A')}")
            return data.get('access_token')
        else:
            print(f"❌ Admin login failed!")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_authenticated_request(access_token):
    """Test authenticated request with token"""
    print("\n" + "="*80)
    print("🔒 Testing Authenticated Request")
    print("="*80)
    
    try:
        headers = {
            "Authorization": f"Bearer {access_token}"
        }
        
        response = requests.get(
            f"{RAILWAY_BACKEND_URL}/api/auth/me",
            headers=headers,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Authenticated request successful!")
            print(f"User: {data.get('email', 'N/A')}")
            print(f"Role: {data.get('role', 'N/A')}")
            return True
        else:
            print(f"❌ Authenticated request failed!")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_jwt_config():
    """Test JWT configuration from debug endpoint"""
    print("\n" + "="*80)
    print("🔍 Checking JWT Configuration")
    print("="*80)
    
    try:
        response = requests.get(f"{RAILWAY_BACKEND_URL}/api/debug/env", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            has_jwt_secret = "JWT_SECRET" in data.get("env_keys", [])
            
            print(f"Has JWT_SECRET: {has_jwt_secret}")
            print(f"Has DATABASE_URL: {data.get('has_database_url', False)}")
            print(f"Environment: {data.get('app_env', 'unknown')}")
            
            if has_jwt_secret:
                print("✅ JWT_SECRET is configured!")
            else:
                print("❌ JWT_SECRET is NOT configured!")
                print("⚠️  You MUST set JWT_SECRET in Railway Variables!")
            
            return has_jwt_secret
        else:
            print(f"❌ Could not check JWT config")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    """Run all tests"""
    print("="*80)
    print("🚀 RAILWAY AUTHENTICATION TEST SUITE")
    print("="*80)
    print(f"Backend URL: {RAILWAY_BACKEND_URL}")
    
    results = {
        "health": False,
        "jwt_config": False,
        "admin_login": False,
        "authenticated_request": False
    }
    
    # Test 1: Health check
    results["health"] = test_health()
    
    # Test 2: JWT configuration
    results["jwt_config"] = test_jwt_config()
    
    # Test 3: Admin login
    access_token = test_admin_login()
    results["admin_login"] = access_token is not None
    
    # Test 4: Authenticated request (only if login succeeded)
    if access_token:
        results["authenticated_request"] = test_authenticated_request(access_token)
    
    # Summary
    print("\n" + "="*80)
    print("📊 TEST SUMMARY")
    print("="*80)
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
    
    all_passed = all(results.values())
    
    print("\n" + "="*80)
    if all_passed:
        print("🎉 ALL TESTS PASSED! Authentication is working correctly!")
    else:
        print("⚠️  SOME TESTS FAILED! Please check the errors above.")
        print("\nCommon fixes:")
        print("1. Set JWT_SECRET in Railway Variables")
        print("2. Set ACCESS_TOKEN_EXPIRE_MINUTES=1440")
        print("3. Set REFRESH_TOKEN_EXPIRE_DAYS=30")
        print("4. Wait 2-3 minutes for Railway to redeploy")
        print("5. Clear browser cache and try again")
    print("="*80)
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
