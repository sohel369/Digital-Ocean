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
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    pool_pre_ping=True,  # Verify connections before using
    echo=settings.DEBUG,  # Log SQL queries in debug mode
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
    Handles connection errors gracefully.
    """
    db = None
    try:
        db = SessionLocal()
        yield db
    except SQLAlchemyError as e:
        logger.error(f"❌ Database Connection Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection failed"
        )
    except Exception as e:
        logger.error(f"❌ Unexpected Database Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal database error"
        )
    finally:
        if db:
            db.close()


def init_db():
    """
    Initialize database tables.
    Creates all tables defined in models.
    """
    # Import all models here to ensure they're registered with Base
    from . import models  # noqa
    Base.metadata.create_all(bind=engine)
