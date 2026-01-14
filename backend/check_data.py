
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.database import SessionLocal
from app import models

db = SessionLocal()
pricing = db.query(models.PricingMatrix).all()
for p in pricing:
    print(f"ID: {p.id}, Industry: {p.industry_type}, Rate: {p.base_rate}, Country: {p.country_id}")

geodata = db.query(models.GeoData).all()
for g in geodata:
    print(f"Geo: {g.state_name}, Code: {g.state_code}, Country: {g.country_code}")
