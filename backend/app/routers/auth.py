"""
Authentication router for signup, login, logout, and OAuth.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from authlib.integrations.starlette_client import OAuth
from starlette.requests import Request
from starlette.responses import RedirectResponse
from datetime import datetime

from ..database import get_db
from .. import models, schemas, auth
from ..config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

# OAuth setup for Google
# OAuth setup for Google
oauth = OAuth()

# Only register if client ID is provided
if settings.GOOGLE_CLIENT_ID:
    try:
        oauth.register(
            name='google',
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
            client_kwargs={'scope': 'openid email profile'}
        )
    except Exception as e:
        # Log error or just pass, as we want to degrade gracefully
        pass



@router.post("/signup", response_model=schemas.Token, status_code=status.HTTP_201_CREATED)
async def signup(user_data: schemas.UserSignup, db: Session = Depends(get_db)):
    """
    Register a new user account.
    
    - **name**: User's full name
    - **email**: Valid email address
    - **password**: Password (min 8 characters)
    - **role**: User role (advertiser or admin)
    - **country**: User's country (optional)
    """
    # Check if user already exists
    existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = auth.get_password_hash(user_data.password)
    new_user = models.User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hashed_password,
        role=user_data.role,
        country=user_data.country,
        industry=user_data.industry,
        last_login=datetime.utcnow()
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Generate tokens
    tokens = auth.create_user_tokens(new_user)
    
    return tokens


@router.post("/login", response_model=schemas.Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Login with email and password.
    
    Returns JWT access token and refresh token.
    """
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Update last login (non-critical, wrap in try to prevent request crash)
    try:
        user.last_login = datetime.utcnow()
        db.commit()
    except Exception as e:
        db.rollback()
        # Log error but don't fail authentication
        from ..main import logger
        logger.warning(f"⚠️ Failed to update last_login for {user.email}: {e}")
    
    # Generate tokens
    tokens = auth.create_user_tokens(user)
    
    return tokens


@router.post("/login/json", response_model=schemas.Token)
async def login_json(user_credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    """
    Login with JSON body (alternative to form data).
    
    - **email**: User email
    - **password**: User password
    """
    user = auth.authenticate_user(db, user_credentials.email, user_credentials.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Update last login (non-critical, wrap in try to prevent request crash)
    try:
        user.last_login = datetime.utcnow()
        db.commit()
    except Exception as e:
        db.rollback()
        # Log error but don't fail authentication
        from ..main import logger
        logger.warning(f"⚠️ Failed to update last_login for {user.email}: {e}")
    
    # Generate tokens
    tokens = auth.create_user_tokens(user)
    
    return tokens


@router.post("/refresh", response_model=schemas.Token)
async def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    """
    Refresh access token using refresh token.
    
    - **refresh_token**: Valid refresh token
    """
    try:
        payload = auth.decode_token(refresh_token)
        user_id = payload.get("sub")
        
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        # Generate new tokens
        tokens = auth.create_user_tokens(user)
        return tokens
    
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )


@router.post("/logout")
async def logout(current_user: models.User = Depends(auth.get_current_user)):
    """
    Logout current user.
    
    Note: With JWT, logout is primarily client-side (delete token).
    This endpoint is for tracking/analytics purposes.
    """
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=schemas.UserResponse)
async def get_current_user_info(current_user: models.User = Depends(auth.get_current_user)):
    """
    Get current authenticated user information.
    """
    return current_user


# ==================== Google OAuth ====================

@router.get("/google/login")
async def google_login(request: Request):
    """
    Initiate Google OAuth login flow.
    Redirects to Google authentication page.
    """
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth is not configured."
        )
        
    redirect_uri = settings.GOOGLE_REDIRECT_URI
    return await oauth.google.authorize_redirect(request, redirect_uri)



@router.get("/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    """
    Google OAuth callback handler.
    Completes authentication and creates/logs in user.
    """
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get('userinfo')
        
        if not user_info:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to get user info from Google"
            )
        
        email = user_info.get('email')
        name = user_info.get('name', email.split('@')[0])
        oauth_id = user_info.get('sub')
        picture = user_info.get('picture')
        
        # Check if user exists
        user = db.query(models.User).filter(models.User.email == email).first()
        
        if user:
            # Update OAuth info if needed
            if not user.oauth_id:
                user.oauth_provider = 'google'
                user.oauth_id = oauth_id
                user.profile_picture = picture
            user.last_login = datetime.utcnow()
        else:
            # Create new user
            user = models.User(
                name=name,
                email=email,
                oauth_provider='google',
                oauth_id=oauth_id,
                profile_picture=picture,
                role=models.UserRole.ADVERTISER,
                last_login=datetime.utcnow()
            )
            db.add(user)
        
        db.commit()
        db.refresh(user)
        
        # Generate tokens
        tokens = auth.create_user_tokens(user)
        
        # Redirect to frontend with token
        # In production, you'd redirect to your frontend URL with the token as a query parameter
        frontend_url = settings.CORS_ORIGINS[0] if settings.CORS_ORIGINS else "http://localhost:3000"
        return RedirectResponse(
            url=f"{frontend_url}/auth/callback?access_token={tokens.access_token}&refresh_token={tokens.refresh_token}"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OAuth authentication failed: {str(e)}"
        )
