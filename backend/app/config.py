"""
Configuration settings for the application.
Loads environment variables and provides typed configuration.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import List, Any, Union, Optional
import os
import json


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Application
    APP_NAME: str = "Advertiser Dashboard API"
    APP_VERSION: str = "1.1.9-final-stable"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./app.db")
    
    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def fix_database_url(cls, v: Any) -> Any:
        if isinstance(v, str) and v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql://", 1)
        return v
    
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 0
    
    # JWT - Load from environment with proper defaults
    SECRET_KEY: str = os.environ.get("JWT_SECRET", "dev_secret_key_change_me_in_production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    
    # OAuth (Optional)
    GOOGLE_CLIENT_ID: str = os.environ.get("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.environ.get("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REDIRECT_URI: str = os.environ.get("GOOGLE_REDIRECT_URI", "")
    
    # File Upload
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE: int = 10485760  # 10MB
    ALLOWED_EXTENSIONS: str = "jpg,jpeg,png,mp4,csv"
    
    # AWS S3 (Optional)
    # AWS S3 (Optional)
    USE_S3: bool = False
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_S3_BUCKET: str = ""
    AWS_REGION: str = "us-east-1"
    
    # Stripe (Optional)
    STRIPE_API_KEY: str = os.environ.get("STRIPE_API_KEY", "")
    STRIPE_WEBHOOK_SECRET: str = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
    
    # CORS
    BACKEND_URL: str = os.environ.get("BACKEND_URL", "http://localhost:8000")
    FRONTEND_URL: str = os.environ.get("FRONTEND_URL", "http://localhost:5173")
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    # SMTP Settings (Optional)
    SMTP_HOST: str = os.environ.get("SMTP_HOST", "")
    SMTP_PORT: int = 587
    SMTP_USER: str = os.environ.get("SMTP_USER", "")
    SMTP_PASS: str = os.environ.get("SMTP_PASS", "")
    EMAILS_FROM_EMAIL: str = os.environ.get("EMAILS_FROM_EMAIL", "support@adplatform.com")
    EMAILS_FROM_NAME: str = os.environ.get("EMAILS_FROM_NAME", "AdPlatform Support")

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="allow"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from string or return defaults."""
        origins = [self.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"]
        return [o for o in origins if o]

    @property
    def allowed_extensions_list(self) -> List[str]:
        """Get allowed file extensions as a list."""
        return [ext.strip() for ext in self.ALLOWED_EXTENSIONS.split(",")]

# Create settings instance
settings = Settings()

# Ensure upload directory exists
if not os.path.exists(settings.UPLOAD_DIR):
    try:
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    except Exception as e:
        print(f"Warning: Could not create upload directory {settings.UPLOAD_DIR}: {e}")
