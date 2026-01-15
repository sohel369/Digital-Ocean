"""
FastAPI Application - Advertiser Dashboard Backend
Main application entry point with router configuration and middleware.
"""
import logging
import time

from .config import settings

# Configure logging at the very top
# Configure logging at the very top
import sys
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL, logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)
print("🚀 STARTING ADVERTISING BACKEND VERSION: 1.0.3-reset 🚀")
print("🚀 STARTING ADVERTISING BACKEND VERSION: 1.0.3-reset 🚀")
print("🚀 STARTING ADVERTISING BACKEND VERSION: 1.0.3-reset 🚀")

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

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

# Robust CORS Middleware - Mandatory for 'credentials: include'
# Note: allow_origins cannot be ["*"] when allow_credentials is True
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="https?://.*", # This safely allows any origin (including random Railway domains)
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

# ==================== Debug/Diagnostic Endpoints ====================
@app.get("/api/debug/db", tags=["Debug"])
async def debug_db():
    from .database import SessionLocal
    from sqlalchemy import text
    try:
        db = SessionLocal()
        # Test 1: Simple SELECT 1
        db.execute(text("SELECT 1"))
        
        # Test 2: Count users
        from . import models
        user_count = db.query(models.User).count()
        pricing_count = db.query(models.PricingMatrix).count()
        
        db.close()
        return {
            "status": "ok", 
            "database_connected": True, 
            "user_count": user_count,
            "pricing_count": pricing_count
        }
    except Exception as e:
        import traceback
        return {
            "status": "error", 
            "error": str(e), 
            "traceback": traceback.format_exc()
        }

@app.get("/api/debug/env", tags=["Debug"])
async def debug_env():
    import os
    # Return existence of keys only, not values for security
    env_keys = list(os.environ.keys())
    has_db_url = "DATABASE_URL" in os.environ
    db_url_start = os.environ.get("DATABASE_URL", "")[:10] if has_db_url else None
    
    return {
        "env_keys": env_keys,
        "has_database_url": has_db_url,
        "database_url_start": db_url_start,
        "app_env": os.environ.get("RAILWAY_ENVIRONMENT", "unknown")
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
    logger.info("🚀 STARTUP: Beginning initialization...")
    try:
        # Initialize database immediately (creates tables if they don't exist)
        try:
            init_db()
            logger.info("✅ Database tables initialized successfully")
        except Exception as e:
            logger.error(f"⚠️ init_db failed: {e}")
        
        # Schema Migration: Add missing columns if they don't exist (Production Fix)
        try:
            from .database import engine, SessionLocal
            from sqlalchemy import text
            
            with engine.connect() as conn:
                logger.info("🛠️ Checking for schema migrations...")
                try:
                    # 1. Add missing columns to campaigns table
                    columns_to_add = [
                        ("headline", "VARCHAR(500)"),
                        ("landing_page_url", "VARCHAR(500)"),
                        ("ad_format", "VARCHAR(100)"),
                        ("description", "TEXT"),
                        ("tags", "JSON"),
                        ("calculated_price", "FLOAT"),
                        ("coverage_area", "VARCHAR(255)")
                    ]
                    
                    for col_name, col_type in columns_to_add:
                        try:
                            # Using text() explicitly for safety
                            conn.execute(text(f"ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS {col_name} {col_type}"))
                            conn.commit()
                        except Exception as col_err:
                            logger.warning(f"Note: Column {col_name} check: {col_err}")
                    
                    # 2. Add missing columns to users table (if any)
                    try:
                        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE"))
                        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(500)"))
                        conn.commit()
                    except Exception:
                        pass
                        
                    logger.info("✅ Schema migrations checked/applied")
                except Exception as e:
                    logger.error(f"❌ Migration check failed: {e}")
        except Exception as e:
            logger.error(f"⚠️ Migration outer block failed: {e}")

        # Ensure PricingMatrix and GeoData are initialized (Production Fix)
        try:
            from .database import SessionLocal
            from . import models
            db = SessionLocal()
            try:
                # Check if PricingMatrix is empty
                try:
                    count = db.query(models.PricingMatrix).count()
                except Exception:
                    count = 0
                    
                if count == 0:
                    logger.info("📦 Seeding default PricingMatrix...")
                    # Create default pricing entries
                    defaults = [
                        models.PricingMatrix(industry_type="Retail", advert_type="display", coverage_type=models.CoverageType.RADIUS_30, base_rate=100.0, multiplier=1.0, country_id="US"),
                        models.PricingMatrix(industry_type="Healthcare", advert_type="display", coverage_type=models.CoverageType.RADIUS_30, base_rate=100.0, multiplier=1.5, country_id="US"),
                        models.PricingMatrix(industry_type="Tech", advert_type="display", coverage_type=models.CoverageType.RADIUS_30, base_rate=100.0, multiplier=1.2, country_id="US"),
                    ]
                    db.add_all(defaults)
                    db.commit()
                    logger.info("✅ Default PricingMatrix seeded")
                    
                # Check if GeoData is empty
                try:
                    count = db.query(models.GeoData).count()
                except Exception:
                    count = 0
                    
                if count == 0:
                    logger.info("📦 Seeding default GeoData...")
                    ca_geo = models.GeoData(state_name="California", country_code="US", state_code="CA", land_area_sq_km=423970, population=39538223, density_multiplier=1.5)
                    db.add(ca_geo)
                    db.commit()
                    logger.info("✅ Default GeoData seeded")
                    
            except Exception as e:
                logger.error(f"❌ Error during auto-seeding pricing/geo: {e}")
            finally:
                db.close()
        except Exception as e:
             logger.error(f"⚠️ Seeding block failed: {e}")
        
        # Ensure admin user exists for production login
        try:
            from .database import SessionLocal
            from . import models, auth
            db = SessionLocal()
            try:
                admin = db.query(models.User).filter(models.User.email == "admin@adplatform.com").first()
                if not admin:
                    logger.info("📦 Seeding essential admin user...")
                    admin_user = models.User(
                        name="Admin User",
                        email="admin@adplatform.com",
                        password_hash=auth.get_password_hash("admin123"),
                        role=models.UserRole.ADMIN,
                        country="US"
                    )
                    db.add(admin_user)
                    db.commit()
                    logger.info("✅ Admin user created: admin@adplatform.com")
                else:
                    # FORCE RESET PASSWORD and ROLE to ensure access
                    admin.role = models.UserRole.ADMIN
                    admin.password_hash = auth.get_password_hash("admin123")
                    db.commit()
                    logger.info("✅ Admin user updated: Role=ADMIN, Password=Reset")
            except Exception as e:
                logger.error(f"❌ Error during auto-seeding: {e}")
            finally:
                db.close()
        except Exception as e:
            logger.error(f"⚠️ Admin creation failed: {e}")
        
        logger.info("🚀 Startup initialization finished")
        logger.info(f"📍 Environment: {'Development' if settings.DEBUG else 'Production'}")
        if '@' in settings.DATABASE_URL:
            logger.info(f"🗄️  Database: {settings.DATABASE_URL.split('@')[1]}")
        else:
            logger.info("🗄️  Database: configured")
            
    except Exception as critical_error:
        # CATCH ALL - Prevent startup crash
        logger.error(f"🔥🔥🔥 CRITICAL STARTUP ERROR: {critical_error} 🔥🔥🔥", exc_info=True)
        print(f"CRITICAL STARTUP ERROR: {critical_error}")
        # We do NOT raise here, allowing uvicorn to start the HTTP server anyway
        # This way /health and /api/debug/db still work


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
