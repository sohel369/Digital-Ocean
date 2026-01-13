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

# Create database tables
# Note: In production, consider using Alembic migrations for more control
# Tables are created at startup - this is idempotent (safe to run multiple times)
Base.metadata.create_all(bind=engine)

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
cors_origins = settings.CORS_ORIGINS
allow_all_origins = cors_origins == ["*"] or "*" in cors_origins

if allow_all_origins:
    # When allowing all origins with credentials, use regex instead
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=".*",  # Match any origin
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


# Request logging middleware
# @app.middleware("http")
# async def log_requests(request: Request, call_next):
#     """Log all incoming requests and their processing time."""
#     start_time = time.time()
#     
#     # Log request
#     logger.info(f"📨 {request.method} {request.url.path}")
#     
#     # Process request
#     response = await call_next(request)
#     
#     # Calculate processing time
#     process_time = time.time() - start_time
#     response.headers["X-Process-Time"] = str(process_time)
#     
#     # Log response
#     logger.info(f"✅ {request.method} {request.url.path} - {response.status_code} ({process_time:.3f}s)")
#     
#     return response


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
    logger.info("🚀 Starting Advertiser Dashboard API")
    logger.info(f"📍 Environment: {'Development' if settings.DEBUG else 'Production'}")
    logger.info(f"🗄️  Database: {settings.DATABASE_URL.split('@')[1] if '@' in settings.DATABASE_URL else 'configured'}")
    
    # Initialize database (creates tables if they don't exist - idempotent)
    init_db()
    logger.info("✅ Database tables initialized")


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
