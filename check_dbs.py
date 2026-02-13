import sqlite3
conn = sqlite3.connect('app.db')
c = conn.cursor()
c.execute('SELECT country_code, COUNT(*) FROM geodata GROUP BY country_code ORDER BY COUNT(*) DESC')
for r in c.fetchall():
    print(f"{r[0]}: {r[1]} regions")
c.execute('SELECT name FROM sqlite_master WHERE type="table"')
print("\nAll tables:", [r[0] for r in c.fetchall()])
c.execute('PRAGMA table_info(geodata)')
print("\nGeodata columns:", [r[1] for r in c.fetchall()])
conn.close()
