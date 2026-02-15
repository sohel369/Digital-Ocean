
import os
import sys
import sqlite3

# Path to the database
db_path = "app.db"

def migrate():
    if not os.path.exists(db_path):
        print(f"Database {db_path} not found.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        print("Checking 'invoices' table columns...")
        cursor.execute("PRAGMA table_info(invoices)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'country' not in columns:
            print("Adding 'country' column to 'invoices' table...")
            cursor.execute("ALTER TABLE invoices ADD COLUMN country VARCHAR(100)")
            print("✅ Column 'country' added.")
        else:
            print("Column 'country' already exists.")
            
        conn.commit()
    except Exception as e:
        print(f"❌ Error during migration: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
