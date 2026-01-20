"""
Authentication utilities for JWT token management and password hashing.
Provides secure user authentication and authorization.
"""
from datetime import datetime, timedelta
from typing import Optional, Union
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from .config import settings
from .database import get_db
from . import models, schemas
from .utils import geo_ip

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme for token extraction from Authorization header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a plain password."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Payload data to encode in the token
        expires_delta: Custom expiration time (default from settings)
    
    Returns:
        Encoded JWT token
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """
    Create a JWT refresh token with longer expiration.
    
    Args:
        data: Payload data to encode in the token
    
    Returns:
        Encoded JWT refresh token
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> dict:
    """
    Decode and verify a JWT token.
    
    Args:
        token: JWT token to decode
    
    Returns:
        Decoded token payload
    
    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError as e:
        print(f"JWT DECODE ERROR: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def authenticate_user(db: Session, email: str, password: str) -> Optional[models.User]:
    """
    Authenticate a user by email and password.
    
    Args:
        db: Database session
        email: User email
        password: Plain password
    
    Returns:
        User object if authenticated, None otherwise
    """
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        return None
    if not user.password_hash:  # OAuth user without password
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> models.User:
    """
    Get current user from JWT token.
    Used as a dependency in protected routes.
    
    Args:
        token: JWT token from Authorization header
        db: Database session
    
    Returns:
        Current authenticated user
    
    Raises:
        HTTPException: If authentication fails
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = decode_token(token)
        sub = payload.get("sub")
        if sub is None:
            raise credentials_exception
        try:
            user_id = int(sub)
        except (ValueError, TypeError):
            print(f"❌ AUTH ERROR: Invalid user ID format in token sub: {sub}")
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise credentials_exception
    
    # Update last login (non-critical, wrap in try to prevent request crash)
    try:
        user.last_login = datetime.utcnow()
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"⚠️ Warning: Failed to update last_login: {e}")
    
    return user


async def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme_optional),
    db: Session = Depends(get_db)
) -> Optional[models.User]:
    """
    Get current user from JWT token if present, otherwise None.
    Does not raise exception if token is missing or invalid.
    """
    if not token:
        return None
    
    try:
        from jose import JWTError
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            sub = payload.get("sub")
            if sub is None:
                return None
            user_id = int(sub)
        except (JWTError, ValueError, TypeError):
            return None
        
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if user:
            try:
                user.last_login = datetime.utcnow()
                db.commit()
            except Exception:
                db.rollback()
            return user
        return None
    except Exception:
        return None


async def get_current_active_user(
    current_user: models.User = Depends(get_current_user)
) -> models.User:
    """
    Get current active user (additional checks can be added here).
    
    Args:
        current_user: User from get_current_user dependency
    
    Returns:
        Active user
    """
    # Add additional checks here (e.g., is_active, email_verified)
    return current_user


async def get_current_admin_user(
    current_user: models.User = Depends(get_current_user)
) -> models.User:
    """
    Get current user and verify admin role.
    Use this dependency for admin-only routes.
    
    Args:
        current_user: User from get_current_user dependency
    
    Returns:
        Admin user
    
    Raises:
        HTTPException: If user is not an admin
    """
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


async def verify_geo_access(
    request: Request,
    current_user: models.User = Depends(get_current_active_user)
) -> str:
    """
    Dependency to enforce IP-based geo-blocking.
    
    1. Detects country from IP.
    2. Compares against user's registered country.
    3. Blocks if there's a mismatch (unless Admin).
    
    Returns:
        The verified country code.
    """
    # 1. Admins bypass geo-blocking
    if current_user.role == models.UserRole.ADMIN:
        return current_user.country or "US"

    # 2. Detect country from IP
    detected_country = await geo_ip.get_country_from_ip(request)
    
    # 3. If we couldn't detect (local/error), fall back to user's registered country
    user_country = (current_user.country or "US").upper()
    
    if detected_country:
        detected_country = detected_country.upper()
        # 4. Strict Enforcement: Detected IP must match profile country
        if detected_country != user_country:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Denied: Your IP location ({detected_country}) does not match your registered country ({user_country})."
            )

    return user_country


def create_user_tokens(user: models.User) -> schemas.Token:
    """
    Create both access and refresh tokens for a user.
    
    Args:
        user: User object
    
    Returns:
        Token response with access and refresh tokens
    """
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
            "role": user.role.value
        }
    )
    
    refresh_token = create_refresh_token(
        data={
            "sub": str(user.id),
            "email": user.email
        }
    )
    
    return schemas.Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer"
    )
