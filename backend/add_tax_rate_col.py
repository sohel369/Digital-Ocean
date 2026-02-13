
import sys
import os
from sqlalchemy import text

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from app.database import engine

def add_column():
    print("Attempting to add 'tax_rate' column to 'geodata' table...")
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE geodata ADD COLUMN tax_rate FLOAT DEFAULT 0.0"))
            conn.commit()
            print("Successfully added 'tax_rate' column.")
        except Exception as e:
            if "duplicate column name" in str(e):
                print("Column 'tax_rate' already exists.")
            else:
                print(f"Error adding column: {e}")

if __name__ == "__main__":
    add_column()
