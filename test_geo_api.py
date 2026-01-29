import requests
import json

try:
    response = requests.get("http://localhost:8000/api/geo/regions/US")
    if response.status_code == 200:
        data = response.json()
        cali = next((item for item in data if item["name"] == "California"), None)
        print("California Data:")
        print(json.dumps(cali, indent=2))
        
        ny = next((item for item in data if item["name"] == "New York"), None)
        print("\nNew York Data:")
        print(json.dumps(ny, indent=2))
except Exception as e:
    print(f"Error: {e}")
