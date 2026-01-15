"""
Configuration settings for the application.
Loads environment variables and provides typed configuration.
"""
from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List, Any, Union
import os
import json


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Application
    APP_NAME: str = "Advertiser Dashboard API"
    APP_VERSION: str = "1.0.1-fix"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "sqlite:///./app.db"
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 0
    
    # JWT
    SECRET_KEY: str = "dev_secret_key_change_me_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # OAuth (Optional)
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = ""
    
    # File Upload
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE: int = 10485760  # 10MB
    ALLOWED_EXTENSIONS: str = "jpg,jpeg,png,gif,mp4,mov,avi,pdf"
    
    # AWS S3 (Optional)
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "us-east-1"
    S3_BUCKET_NAME: str = ""
    USE_S3: bool = False
    
    # Stripe (Optional)
    STRIPE_SECRET_KEY: str = ""
    STRIPE_PUBLISHABLE_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    
    # CORS - Default to allow all origins for production
    CORS_ORIGINS: Any = ["*"]
    
    # Security
    RATE_LIMIT_PER_MINUTE: int = 100
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except:
                    # If JSON parsing fails, treat it as a raw string and split
                    v = v.strip("[]").replace("'", "").replace('"', "")
            
            if v == "*" or v == "":
                return ["*"]
            
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["*"] # Fallback to allow all

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Fix for SQLAlchemy requiring postgresql:// instead of postgres://
        if self.DATABASE_URL and self.DATABASE_URL.startswith("postgres://"):
            self.DATABASE_URL = self.DATABASE_URL.replace("postgres://", "postgresql://", 1)

    @property
    def allowed_extensions_list(self) -> List[str]:
        """Get allowed file extensions as a list."""
        return [ext.strip() for ext in self.ALLOWED_EXTENSIONS.split(",")]


# Global settings instance
settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

# Compatibility warning
if "postgres://" in settings.DATABASE_URL:
    settings.DATABASE_URL = settings.DATABASE_URL.replace("postgres://", "postgresql://")

if settings.DATABASE_URL.startswith("sqlite"):
    print("⚠️  WARNING: Running with SQLite database. This is not recommended for production on Railway.")

