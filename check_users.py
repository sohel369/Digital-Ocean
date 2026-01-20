
import sqlite3
import os

db_path = "backend/app.db"
if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("--- Users ---")
    try:
        cursor.execute("SELECT id, email, role, industry FROM users")
        rows = cursor.fetchall()
        for row in rows:
            print(row)
        if not rows:
            print("Users table is empty")
    except Exception as e:
        print(f"Error reading users: {e}")
        
    conn.close()
