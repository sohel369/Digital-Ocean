import sys
import os

# Root directory
root_dir = os.path.dirname(os.path.abspath(__file__))
# Backend directory
backend_dir = os.path.join(root_dir, "backend")
sys.path.append(backend_dir)

from app.database import SessionLocal
from app import models

db = SessionLocal()
try:
    print("--- Users in DB ---")
    users = db.query(models.User).all()
    for u in users:
        print(f"ID: {u.id}, Email: {u.email}, Role: {u.role}")
    
    print("\n--- Campaigns in DB ---")
    campaigns = db.query(models.Campaign).all()
    for c in campaigns:
        print(f"ID: {c.id}, Name: {c.name}, Status: {c.status}")
    
    if not users:
        print("NO USERS FOUND!")
    if not campaigns:
        print("NO CAMPAIGNS FOUND!")
finally:
    db.close()
