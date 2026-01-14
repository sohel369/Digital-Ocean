
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.database import SessionLocal
from app import models, auth

db = SessionLocal()
user = db.query(models.User).filter(models.User.email == "admin@adplatform.com").first()
if user:
    tokens = auth.create_user_tokens(user)
    print(tokens.access_token)
else:
    print("Admin not found")
