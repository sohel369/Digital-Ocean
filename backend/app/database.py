"""
Database configuration and session management.
Sets up SQLAlchemy engine, session maker, and base model.
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
from .config import settings

# Create database engine
# Create database engine
connect_args = {}
engine_args = {
    "pool_pre_ping": True,
    "echo": settings.DEBUG,
}

if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False
    # SQLite does not support pool_size/max_overflow with default pool
else:
    # Postgres/MySQL optimization
    engine_args["pool_size"] = settings.DATABASE_POOL_SIZE
    engine_args["max_overflow"] = settings.DATABASE_MAX_OVERFLOW

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    **engine_args
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


# Logger for database errors
import logging
logger = logging.getLogger(__name__)
from fastapi import HTTPException, status
from sqlalchemy.exc import SQLAlchemyError

def get_db() -> Generator[Session, None, None]:
    """
    Dependency function that yields database session.
    Automatically closes session after request completes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> bool:
    """
    Initialize database tables and test connection.
    Returns True if successful, False otherwise.
    """
    try:
        # Sanitize URL for logging (hide password)
        raw_url = settings.DATABASE_URL
        if "@" in raw_url:
            prefix, rest = raw_url.split("://", 1)
            creds, host = rest.split("@", 1)
            sanitized_url = f"{prefix}://****@{host}"
        else:
            sanitized_url = raw_url
            
        logger.info(f"🔗 Testing connection to: {sanitized_url}")
        
        # Import all models here to ensure they're registered with Base
        from . import models  # noqa
        
        # Create tables
        Base.metadata.create_all(bind=engine)
        
        # Test connection with a simple query
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        
        logger.info("✅ Database connection test: SUCCESS")
        return True
    except Exception as e:
        logger.error(f"❌ Database connection test: FAILED - {e}")
        return False
