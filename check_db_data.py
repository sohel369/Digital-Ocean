
import sqlite3
import os

db_path = "backend/app.db"
if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("--- PricingMatrix ---")
    try:
        cursor.execute("SELECT * FROM pricing_matrix")
        rows = cursor.fetchall()
        for row in rows:
            print(row)
        if not rows:
            print("PricingMatrix is empty")
    except Exception as e:
        print(f"Error reading pricing_matrix: {e}")
        
    print("\n--- GeoData ---")
    try:
        cursor.execute("SELECT * FROM geo_data")
        rows = cursor.fetchall()
        for row in rows:
            print(row)
        if not rows:
            print("GeoData is empty")
    except Exception as e:
        print(f"Error reading geo_data: {e}")
        
    conn.close()
