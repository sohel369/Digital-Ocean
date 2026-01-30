import requests

def test_admin_get_users():
    base_url = "http://127.0.0.1:8000/api"
    
    # login as admin
    login_data = {
        "email": "admin@adplatform.com",
        "password": "admin123"
    }
    
    print("Attempting to login...")
    login_res = requests.post(f"{base_url}/auth/login/json", json=login_data)
    if not login_res.ok:
        print(f"Login failed: {login_res.status_code} {login_res.text}")
        return
    
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    print("Fetching users...")
    users_res = requests.get(f"{base_url}/admin/users", headers=headers)
    if users_res.ok:
        users = users_res.json()
        print(f"Successfully fetched {len(users)} users.")
        for u in users:
            print(f"- {u['email']} (Role: {u['role']})")
    else:
        print(f"Failed to fetch users: {users_res.status_code} {users_res.text}")

if __name__ == "__main__":
    test_admin_get_users()
