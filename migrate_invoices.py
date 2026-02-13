import sqlite3
import os

def migrate():
    db_path = "app.db"
    if not os.path.exists(db_path):
        print(f"Database {db_path} not found!")
        return

    print(f"Migrating {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # 1. Add tax_rate to geodata
    cursor.execute("PRAGMA table_info(geodata)")
    cols = [c[1] for c in cursor.fetchall()]
    if 'tax_rate' not in cols:
        print("  Adding tax_rate to geodata...")
        cursor.execute("ALTER TABLE geodata ADD COLUMN tax_rate FLOAT DEFAULT 0.0")
    else:
        print("  geodata.tax_rate already exists.")

    # 2. Create invoices table
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='invoices'")
    if not cursor.fetchone():
        print("  Creating invoices table...")
        cursor.execute("""
            CREATE TABLE invoices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                campaign_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                invoice_number VARCHAR(50) UNIQUE NOT NULL,
                amount FLOAT NOT NULL,
                tax_rate FLOAT DEFAULT 0.0,
                tax_amount FLOAT DEFAULT 0.0,
                total_amount FLOAT NOT NULL,
                currency VARCHAR(10) DEFAULT 'USD',
                billing_date DATETIME NOT NULL,
                due_date DATETIME NOT NULL,
                status VARCHAR(20) DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                paid_at DATETIME,
                FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        cursor.execute("CREATE INDEX ix_invoices_invoice_number ON invoices (invoice_number)")
    else:
        print("  invoices table already exists.")

    conn.commit()
    conn.close()
    print("Migration complete!")

if __name__ == "__main__":
    migrate()
