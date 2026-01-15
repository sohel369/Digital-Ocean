
import requests
import sys

BASE_URL = "http://localhost:8000"

def test_endpoint(path, name):
    print(f"Testing {name} ({path})...")
    try:
        response = requests.get(f"{BASE_URL}{path}")
        print(f"Status: {response.status_code}")
        print(f"Content: {response.text[:200]}")
        if response.status_code == 200:
            print("✅ PASSED")
        else:
            print("❌ FAILED")
    except Exception as e:
        print(f"❌ ERROR: {e}")

if __name__ == "__main__":
    test_endpoint("/", "Root")
    test_endpoint("/api/debug/env", "Debug Env")
    test_endpoint("/api/debug/db", "Debug DB")
