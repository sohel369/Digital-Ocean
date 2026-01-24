import emails
from ..config import settings
import logging

logger = logging.getLogger(__name__)

def send_email(to_email: str, subject: str, html_content: str):
    """
    Send an email using SMTP settings from config.
    """
    if not settings.SMTP_HOST:
        logger.warning(f"⚠️ SMTP_HOST not configured. Email to {to_email} logged to email_logs.txt.")
        fallback = True
    elif not settings.SMTP_USER:
        logger.warning(f"⚠️ SMTP_USER not configured. Email to {to_email} logged to email_logs.txt.")
        fallback = True
    elif "your-email" in settings.SMTP_USER:
        logger.warning(f"⚠️ SMTP_USER still has placeholder value. Email to {to_email} logged to email_logs.txt.")
        fallback = True
    else:
        fallback = False

    if fallback:
        with open("email_logs.txt", "a", encoding="utf-8") as f:
            f.write(f"\n--- {to_email} | {subject} ---\n{html_content}\n")
        return True

    try:
        message = emails.html(
            html=html_content,
            subject=subject,
            mail_from=settings.FROM_EMAIL
        )

        r = message.send(
            to=to_email,
            smtp={
                "host": settings.SMTP_HOST,
                "port": settings.SMTP_PORT,
                "ssl": settings.SMTP_PORT == 465,
                "tls": settings.SMTP_PORT == 587,
                "user": settings.SMTP_USER,
                "password": settings.SMTP_PASSWORD,
            }
        )
        
        if r.status_code == 250:
            logger.info(f"✅ Email sent to {to_email}")
            return True
        else:
            logger.error(f"❌ Failed to send email to {to_email}: {r.status_code}")
            # Even if SMTP fails, we log it locally for the user to see during development
            with open("email_logs.txt", "a", encoding="utf-8") as f:
                f.write(f"\n--- {to_email} | {subject} ---\n{html_content}\n")
            return False
            
    except Exception as e:
        logger.error(f"❌ Email sending error: {str(e)}")
        # Log to file as fallback
        with open("email_logs.txt", "a", encoding="utf-8") as f:
            f.write(f"\n--- ERROR SENDING TO {to_email} ---\n{subject}\n{html_content}\nError: {str(e)}\n")
        return False

def send_password_reset_email(to_email: str, token: str):
    """
    Send a password reset email with a token.
    """
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    
    subject = "Password Reset Request - AdPlatform"
    html_content = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
        <h2 style="color: #2563eb;">Password Reset</h2>
        <p>You requested a password reset for your AdPlatform account.</p>
        <p>Click the button below to set a new password. This link will expire in 1 hour.</p>
        <div style="margin: 30px 0;">
            <a href="{reset_link}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
        </div>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;">
        <p style="font-size: 12px; color: #64748b;">AdPlatform Premium Terminal Access</p>
    </div>
    """
    
    return send_email(to_email, subject, html_content)
