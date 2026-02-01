import psycopg2
import sys

url = "postgresql://postgres:postgres@localhost:5432/adplatform_db"

try:
    conn = psycopg2.connect(url)
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, role, left(password_hash, 10) as pass_start, country FROM users;")
    rows = cursor.fetchall()
    print("--- POSTGRES USERS ---")
    for row in rows:
        print(row)
    conn.close()
except Exception as e:
    print(f"Failed: {e}")
