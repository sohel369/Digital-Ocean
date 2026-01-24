
from app.config import settings
import os

print(f"SMTP_HOST: '{settings.SMTP_HOST}'")
print(f"SMTP_USER: '{settings.SMTP_USER}'")
print(f"SMTP_PORT: {settings.SMTP_PORT}")
print(f"FROM_EMAIL: '{settings.FROM_EMAIL}'")
print(f"HAS_PASSWORD: {bool(settings.SMTP_PASSWORD)}")
