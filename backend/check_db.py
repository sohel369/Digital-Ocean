
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.database import SessionLocal
from app import models

db = SessionLocal()
users = db.query(models.User).count()
pricing = db.query(models.PricingMatrix).count()
geodata = db.query(models.GeoData).count()

print(f"Users: {users}")
print(f"PricingMatrix: {pricing}")
print(f"GeoData: {geodata}")

if users > 0:
    for user in db.query(models.User).all():
        print(f"User: {user.email}, Role: {user.role}")
