from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
import os
import platform
from datetime import datetime

from ..database import get_db, engine
from ..config import settings
from .. import models

router = APIRouter(prefix="/debug", tags=["Debug"])

@router.get("/system")
async def system_debug():
    """Check basic system info and environment stability."""
    return {
        "status": "online",
        "timestamp": datetime.utcnow().isoformat(),
        "platform": platform.platform(),
        "python_version": platform.python_version(),
        "app_version": settings.APP_VERSION,
        "debug_mode": settings.DEBUG,
        "database_type": "Postgres" if "postgres" in settings.DATABASE_URL else "SQLite/Other"
    }

@router.get("/env")
async def env_debug():
    """Check critical environment variables (sanitized)."""
    return {
        "JWT_SECRET_SET": settings.SECRET_KEY != "dev_secret_key_change_me_in_production",
        "JWT_SECRET_LENGTH": len(settings.SECRET_KEY),
        "ACCESS_TOKEN_EXPIRE": settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        "DATABASE_URL_CONFIGURED": bool(settings.DATABASE_URL),
        "CORS_ORIGINS": settings.CORS_ORIGINS,
        "STRIPE_CONFIGURED": bool(settings.STRIPE_SECRET_KEY and len(settings.STRIPE_SECRET_KEY) > 10)
    }

@router.get("/db")
async def db_debug(db: Session = Depends(get_db)):
    """Check database connectivity and tables."""
    try:
        # Check users table
        user_count = db.query(models.User).count()
        admin_exists = db.query(models.User).filter(models.User.role == models.UserRole.ADMIN).first() is not None
        
        # Check columns in users table
        columns = []
        with engine.connect() as conn:
            result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'"))
            columns = [row[0] for row in result]
            
        return {
            "connectivity": "OK",
            "user_count": user_count,
            "admin_account_ready": admin_exists,
            "user_table_columns": columns,
            "required_columns_present": "industry" in columns and "oauth_provider" in columns
        }
    except Exception as e:
        return {
            "connectivity": "FAILED",
            "error": str(e)
        }
