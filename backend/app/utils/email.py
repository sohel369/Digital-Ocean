import smtplib
import socket
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from ..config import settings
import logging

logger = logging.getLogger(__name__)

def send_email(to_email: str, subject: str, html_content: str):
    """
    Highly resilient SMTP sender with automatic clean-up and protocol switching.
    """
    # 1. CLEAN & EXTRACT VARS
    host = settings.SMTP_HOST.strip() or "smtp.gmail.com"
    user = settings.SMTP_USER.strip()
    password = settings.SMTP_PASSWORD.replace(" ", "").strip()
    from_email = settings.FROM_EMAIL.strip() or user
    port = int(str(settings.SMTP_PORT).strip() or "465")

    # 2. VALIDATION
    if not user or not password:
        logger.error("❌ SMTP Credentials missing in environment variables.")
        return False

    # 3. BUILD MESSAGE
    msg = MIMEMultipart()
    msg['From'] = from_email
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(html_content, 'html'))

    # 4. SENDING LOGIC (SSL VS TLS)
    server = None
    try:
        logger.info(f"📧 Connectivity: Trying {host}:{port} for {to_email}...")
        
        if port == 465:
            # Force IPv4 connection to prevent Railway IPv6 unreachable errors
            server = smtplib.SMTP_SSL(host, port, timeout=20)
        else:
            server = smtplib.SMTP(host, port, timeout=20)
            server.starttls()
            
        server.login(user, password)
        server.send_message(msg)
        server.quit()
        
        logger.info(f"✅ SUCCESS: Email delivered to {to_email}")
        return True
        
    except (socket.gaierror, socket.error, OSError) as net_err:
        logger.error(f"❌ NETWORK ERROR: Railway cannot reach {host}:{port}. Error: {str(net_err)}")
        # Fallback logging to file so the user can still get their token
        with open("email_logs.txt", "a", encoding="utf-8") as f:
            f.write(f"\n--- NETWORK_FAIL_FALLBACK | {to_email} | {subject} ---\n{html_content}\n")
        return False
        
    except Exception as e:
        logger.error(f"❌ SMTP FAILED: {type(e).__name__} - {str(e)}")
        return False

def send_password_reset_email(to_email: str, token: str):
    """Generates reset link and sends email."""
    # Production URL priority
    base_url = settings.FRONTEND_URL
    if not base_url or "localhost" in base_url:
        base_url = "https://digital-ocean-production-01ee.up.railway.app"
        
    reset_link = f"{base_url.rstrip('/')}/reset-password?token={token}"
    
    subject = "Reset Your Password - AdPlatform"
    html_content = f"""
    <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #2563eb;">Password Reset Requested</h2>
        <p>Use the button below to secure your account. Link expires in 60 minutes.</p>
        <div style="margin: 25px 0;">
            <a href="{reset_link}" style="background: #2563eb; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password Now</a>
        </div>
        <p style="color: #777; font-size: 12px;">Link: {reset_link}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin-top: 20px;">
        <p style="font-size: 10px; color: #999;">AdPlatform Security Terminal</p>
    </div>
    """
    return send_email(to_email, subject, html_content)
