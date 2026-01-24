import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from ..config import settings
import logging

logger = logging.getLogger(__name__)

def send_email(to_email: str, subject: str, html_content: str):
    """
    Send an email using smtplib for better reliability and error reporting.
    """
    # 1. Configuration Validation
    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning(f"⚠️ SMTP Missing Config: Host={bool(settings.SMTP_HOST)}, User={bool(settings.SMTP_USER)}, Pass={bool(settings.SMTP_PASSWORD)}")
        logger.warning(f"Logging email to {to_email} to email_logs.txt instead.")
        with open("email_logs.txt", "a", encoding="utf-8") as f:
            f.write(f"\n--- FALLBACK | {to_email} | {subject} ---\n{html_content}\n")
        return True

    # 2. Build Message
    msg = MIMEMultipart()
    msg['From'] = settings.FROM_EMAIL
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(html_content, 'html'))

    # 3. Send Email
    try:
        # Use SMTP according to port
        if settings.SMTP_PORT == 465:
            server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT)
        else:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
            server.starttls() # Secure the connection for 587
            
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        
        logger.info(f"✅ Email successfully sent to {to_email}")
        return True
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"❌ SMTP Error sending to {to_email}: {error_msg}")
        
        # Fallback to file so we don't lose the token during debugging
        with open("email_logs.txt", "a", encoding="utf-8") as f:
            f.write(f"\n--- ERROR ({error_msg}) | {to_email} ---\n{html_content}\n")
            
        return False

def send_password_reset_email(to_email: str, token: str):
    """
    Send a password reset email with a token.
    """
    # Use production URL if set, otherwise fallback to default
    frontend_url = settings.FRONTEND_URL or "http://localhost:5173"
    reset_link = f"{frontend_url}/reset-password?token={token}"
    
    subject = "Password Reset Request - AdPlatform"
    html_content = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #2563eb;">Password Reset</h2>
        <p>You requested a password reset for your AdPlatform account.</p>
        <p>Click the button below to set a new password. This link will expire in 1 hour.</p>
        <div style="margin: 30px 0;">
            <a href="{reset_link}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;">
        <p style="font-size: 12px; color: #64748b;">AdPlatform Premium Terminal Access</p>
    </div>
    """
    
    return send_email(to_email, subject, html_content)
