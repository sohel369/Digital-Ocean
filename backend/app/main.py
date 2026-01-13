"""
FastAPI Application - Advertiser Dashboard Backend
Main application entry point with router configuration and middleware.
"""
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import time
import logging

from .config import settings
from .database import engine, Base, init_db

# Import routers
from .routers import (
    auth,
    campaigns,
    media,
    pricing,
    analytics,
    admin,
    payment,
    frontend_compat
)

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Database initialization is handled in startup_event
# Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
    ## Advertiser Dashboard API
    
    A comprehensive advertising platform backend with:
    - **Authentication**: JWT-based auth with Google OAuth support
    - **Campaign Management**: Create, manage, and track ad campaigns
    - **Dynamic Pricing**: Intelligent pricing based on coverage, industry, and location
    - **Media Uploads**: Secure file uploads with approval workflow
    - **Payment Integration**: Stripe checkout and webhooks
    - **Analytics**: Campaign performance tracking (impressions, clicks, CTR)
    - **Admin Controls**: User management, pricing configuration, system oversight
    
    ### Authentication
    Most endpoints require authentication. Use `/auth/login` to get an access token,
    then include it in the `Authorization` header as `Bearer <token>`.
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    debug=settings.DEBUG
)

# ==================== Middleware ====================

# CORS configuration
# Note: When allow_credentials=True, cannot use allow_origins=["*"]
# So we handle wildcard specially
# Request Logger Middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Detailed logging for debugging 500 errors."""
    logger.info(f"🔍 [REQUEST] {request.method} {request.url.path}")
    logger.debug(f"📋 Headers: {dict(request.headers)}")
    
    try:
        response = await call_next(request)
        logger.info(f"✅ [RESPONSE] Status: {response.status_code}")
        return response
    except Exception as exc:
        logger.error(f"🔥 [CRASH] Unhandled exception: {str(exc)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error", "detail": str(exc)}
        )

# Fixed CORS Middleware - Mandatory for 'credentials: include'
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="https?://.*", # Safely allow any origin with credentials
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)


# ==================== Exception Handlers ====================

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle HTTP exceptions with consistent JSON response."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle request validation errors with detailed messages."""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation error",
            "details": exc.errors(),
            "status_code": 422
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions."""
    logger.error(f"❌ Unhandled exception: {str(exc)}", exc_info=True)
    # Ensure even 500 errors include the detail in debug mode
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal server error",
            "detail": str(exc),
            "status_code": 500
        }
    )


# ==================== Routes ====================

@app.get("/", tags=["Root"])
async def root():
    """
    Root endpoint - API health check.
    """
    return {
        "message": "Advertiser Dashboard API",
        "version": settings.APP_VERSION,
        "status": "operational",
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/health", tags=["Root"])
async def health_check():
    """
    Health check endpoint for monitoring.
    """
    return {
        "status": "healthy",
        "version": settings.APP_VERSION
    }


# ==================== Include Routers ====================

# Include routers with /api prefix
app.include_router(frontend_compat.router)  # Frontend compatibility layer (already has /api prefix)
app.include_router(auth.router, prefix="/api")
app.include_router(campaigns.router, prefix="/api")
app.include_router(media.router, prefix="/api")
app.include_router(pricing.router, prefix="/api")
app.include_router(payment.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(admin.router, prefix="/api")


# ==================== Startup/Shutdown Events ====================

@app.on_event("startup")
async def startup_event():
    """
    Run on application startup.
    Initialize database, connections, etc.
    """
    # Initialize database immediately (creates tables if they don't exist)
    init_db()
    logger.info("✅ Database tables initialized successfully")
    
    logger.info("🚀 Starting Advertiser Dashboard API")
    logger.info(f"📍 Environment: {'Development' if settings.DEBUG else 'Production'}")
    if '@' in settings.DATABASE_URL:
        logger.info(f"🗄️  Database: {settings.DATABASE_URL.split('@')[1]}")
    else:
        logger.info("🗄️  Database: configured")


@app.on_event("shutdown")
async def shutdown_event():
    """
    Run on application shutdown.
    Clean up connections, etc.
    """
    logger.info("👋 Shutting down Advertiser Dashboard API")


# ==================== Main Entry Point ====================

if __name__ == "__main__":
    import uvicorn
    import os
    
    port = int(os.environ.get("PORT", 8000))
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )
