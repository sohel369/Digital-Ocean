import requests
import json

url = "http://localhost:8000/api/auth/login/json"
payload = {
    "email": "admin@admin.com",
    "password": "admin123"
}
headers = {
    "Content-Type": "application/json"
}

try:
    print(f"Sending POST request to {url}...")
    print(f"Payload: {payload}")
    response = requests.post(url, json=payload, headers=headers)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
    
    if response.status_code == 500:
        print("\n❌ 500 Internal Server Error confirmed.")
    elif response.status_code == 200:
        print("\n✅ Login successful!")
        print(response.json())
    else:
        print(f"\n⚠️ Unexpected status code: {response.status_code}")

except Exception as e:
    print(f"Request failed: {e}")
