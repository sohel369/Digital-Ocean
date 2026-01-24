
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
import os

load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
FROM_EMAIL = os.getenv("FROM_EMAIL") or SMTP_USER

# Clean password from spaces if present
if SMTP_PASSWORD:
    SMTP_PASSWORD = SMTP_PASSWORD.replace(" ", "")

print(f"--- Debug SMTP Connection ---")
print(f"Host: {SMTP_HOST}")
print(f"Port: {SMTP_PORT}")
print(f"User: {SMTP_USER}")
print(f"From: {FROM_EMAIL}")

msg = MIMEMultipart()
msg['From'] = FROM_EMAIL
msg['To'] = SMTP_USER
msg['Subject'] = "SMTP Terminal Test"
msg.attach(MIMEText("This is a direct test from terminal code.", 'plain'))

try:
    print("\n[Step 1] Connecting to server...")
    server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15)
    server.set_debuglevel(1)  # THIS SHOWS THE FULL CONVERSATION
    
    print("\n[Step 2] Sending STARTTLS...")
    server.starttls()
    
    print("\n[Step 3] Attempting Login...")
    server.login(SMTP_USER, SMTP_PASSWORD)
    
    print("\n[Step 4] Sending Message...")
    server.send_message(msg)
    server.quit()
    
    print("\n✅ SMTP TEST SUCCESSFUL!")
except Exception as e:
    print(f"\n❌ SMTP TEST FAILED: {str(e)}")
