
import sqlite3
import os

# Try root DB first
db_path = 'app.db'
if not os.path.exists(db_path):
    # Try backend folder
    db_path = 'backend/app.db'

print(f"Checking DB at: {db_path}")

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT count(*) FROM geodata WHERE country_code = 'US'")
    count = cursor.fetchone()[0]
    print(f"US States Count: {count}")
    
    cursor.execute("SELECT state_name FROM geodata WHERE country_code = 'US' LIMIT 5")
    rows = cursor.fetchall()
    print("Sample States:", [r[0] for r in rows])
    
    conn.close()
except Exception as e:
    print(f"Error: {e}")
