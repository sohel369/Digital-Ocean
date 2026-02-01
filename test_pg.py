import psycopg2
import sys

url = "postgresql://postgres:postgres@localhost:5432/adplatform_db"
print(f"Testing connection to: {url}")

try:
    conn = psycopg2.connect(url)
    print("✅ Connection Successful!")
    cursor = conn.cursor()
    cursor.execute("SELECT count(*) FROM users;")
    count = cursor.fetchone()[0]
    print(f"Users count: {count}")
    conn.close()
except Exception as e:
    print(f"❌ Connection Failed: {e}")
