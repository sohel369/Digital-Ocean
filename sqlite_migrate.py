import sqlite3
import os

def migrate():
    # Detect db path
    db_paths = ['backend/app.db', 'app.db']
    found = False
    for path in db_paths:
        if os.path.exists(path):
            print(f"Checking database: {path}")
            conn = sqlite3.connect(path)
            cursor = conn.cursor()
            
            # Check users table
            cursor.execute("PRAGMA table_info(users)")
            columns = [c[1] for c in cursor.fetchall()]
            
            if 'managed_country' not in columns:
                print(f"Adding 'managed_country' column to 'users' table in {path}...")
                try:
                    cursor.execute("ALTER TABLE users ADD COLUMN managed_country VARCHAR(10)")
                    conn.commit()
                    print("Column added successfully.")
                except Exception as e:
                    print(f"Error adding column: {e}")
            else:
                print("'managed_country' column already exists.")
            
            conn.close()
            found = True
    
    if not found:
        print("No SQLite database found to migrate.")

if __name__ == "__main__":
    migrate()
