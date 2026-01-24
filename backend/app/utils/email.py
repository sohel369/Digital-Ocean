import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from ..config import settings
import logging

logger = logging.getLogger(__name__)

def send_email(to_email: str, subject: str, html_content: str):
    """
    Send an email using smtplib with detailed step-by-step logging.
    """
    # 1. Configuration Validation
    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.error(f"❌ SMTP Config Missing! Host={settings.SMTP_HOST}, User={settings.SMTP_USER}")
        with open("email_logs.txt", "a", encoding="utf-8") as f:
            f.write(f"\n--- CONFIG MISSING | {to_email} ---\n{html_content}\n")
        return False

    # 2. Build Message
    msg = MIMEMultipart()
    msg['From'] = settings.FROM_EMAIL
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(html_content, 'html'))

    # 3. Connection and Sending
    try:
        logger.info(f"📧 Attempting to connect to {settings.SMTP_HOST}:{settings.SMTP_PORT}...")
        
        # Use SSL for Port 465, STARTTLS for 587
        if int(settings.SMTP_PORT) == 465:
            server = smtplib.SMTP_SSL(settings.SMTP_HOST, int(settings.SMTP_PORT), timeout=10)
        else:
            server = smtplib.SMTP(settings.SMTP_HOST, int(settings.SMTP_PORT), timeout=10)
            server.starttls()
            
        logger.info(f"🔑 Attempting SMTP login for {settings.SMTP_USER}...")
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        
        logger.info(f"📤 Sending message to {to_email}...")
        server.send_message(msg)
        server.quit()
        
        logger.info(f"✅ SUCCESS: Email sent to {to_email}")
        return True
        
    except smtplib.SMTPAuthenticationError:
        logger.error("❌ SMTP ERROR: Authentication Failed. Check if your App Password is correct.")
        return False
    except Exception as e:
        logger.error(f"❌ SMTP ERROR ({type(e).__name__}): {str(e)}")
        # Fallback to local file for recovery
        with open("email_logs.txt", "a", encoding="utf-8") as f:
            f.write(f"\n--- ERROR ({str(e)}) | {to_email} ---\n{html_content}\n")
        return False

def send_password_reset_email(to_email: str, token: str):
    """
    Send a password reset email with a token using production-safe URL.
    """
    # Priority: Railway FRONTEND_URL -> Local Dev URL
    frontend_url = settings.FRONTEND_URL
    if not frontend_url or "localhost" in frontend_url:
         # Fallback to current browser origin if possible, but backend needs a fixed URL
         frontend_url = "https://digital-ocean-production-01ee.up.railway.app" # Your actual domain
    
    reset_link = f"{frontend_url.rstrip('/')}/reset-password?token={token}"
    
    subject = "Password Reset Request - AdPlatform"
    html_content = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #333333;">
        <h2 style="color: #2563eb;">Password Reset</h2>
        <p>You requested a password reset for your AdPlatform account.</p>
        <p>Click the button below to set a new password. This link will expire in 1 hour.</p>
        <div style="margin: 30px 0;">
            <a href="{reset_link}" style="background-color: #2563eb; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="font-size: 11px; color: #666;">If the button doesn't work, copy-paste this link: {reset_link}</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;">
        <p style="font-size: 12px; color: #64748b;">AdPlatform Premium Terminal Access</p>
    </div>
    """
    return send_email(to_email, subject, html_content)
