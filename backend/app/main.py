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

from fastapi import FastAPI, Request, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy.orm import Session

from .database import engine, Base, init_db, get_db

# Import routers
from .routers import (
    auth,
    campaigns,
    media,
    pricing,
    analytics,
    admin,
    payment,
    frontend_compat,
    geo,
    campaign_approval,
    debug
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

@app.get("/test-email")
async def test_email_setup(email: str = "sohel0130844@gmail.com"):
    """Force clean variables and test SMTP connection."""
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    from .config import settings
    
    # 1. CLEAN VARIABLES (Prevent common user errors)
    host = settings.SMTP_HOST.strip()
    port = int(str(settings.SMTP_PORT).strip())
    user = settings.SMTP_USER.strip()
    password = settings.SMTP_PASSWORD.replace(" ", "").strip()
    from_email = settings.FROM_EMAIL.strip() or user
    
    msg = MIMEMultipart()
    msg['From'] = from_email
    msg['To'] = email
    msg['Subject'] = "Railway Deployment Test"
    msg.attach(MIMEText("<h1>SMTP is Verified!</h1><p>You can now reset your password.</p>", 'html'))

    try:
        # Step 2: Connect
        if port == 465:
            server = smtplib.SMTP_SSL(host, port, timeout=15)
        else:
            server = smtplib.SMTP(host, port, timeout=15)
            server.starttls()
            
        # Step 3: Login
        server.login(user, password)
        
        # Step 4: Send
        server.send_message(msg)
        server.quit()
        
        return {
            "status": "success", 
            "message": f"Email sent! If you don't see it in inbox, check SPAM.",
            "config_logged": {
                "host": host,
                "user": user,
                "from": from_email,
                "port": port
            }
        }
    except Exception as e:
        return {
            "status": "failed", 
            "error_type": type(e).__name__,
            "error_message": str(e),
            "hint": "Check if Railway Vars has exactly 'wzrpastkpxesqzch' as password."
        }


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
@app.get("/api/health", tags=["Root"])
async def health_check():
    """
    Health check endpoint for monitoring.
    Available at both /health and /api/health for compatibility.
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

@app.get("/api/debug/routes", tags=["Debug"])
async def list_routes():
    """Diagnostic: List all registered routes and their paths."""
    routes = []
    for route in app.routes:
        if hasattr(route, "path"):
            routes.append({
                "path": route.path,
                "name": route.name,
                "methods": list(route.methods) if hasattr(route, "methods") else []
            })
    return {"routes": routes}

@app.post("/api/debug/reset", tags=["Debug"])
async def reset_db_state(db: Session = Depends(get_db)):
    """EMERGENCY ONLY: Force re-seeds pricing and admin data."""
    try:
        from . import models, auth
        # 1. Ensure admin
        admin = db.query(models.User).filter(models.User.email == "admin@adplatform.com").first()
        if not admin:
            admin = models.User(
                name="System Admin", email="admin@adplatform.com",
                password_hash=auth.get_password_hash("admin123"),
                role=models.UserRole.ADMIN, country="US"
            )
            db.add(admin)
        else:
            admin.role = models.UserRole.ADMIN
            admin.password_hash = auth.get_password_hash("admin123")
        
        # 2. Reset Pricing if empty
        if db.query(models.PricingMatrix).count() == 0:
            logger.info("Reset: Seeding pricing matrix...")
            # ... seeding logic ...
            # (Simplified for brevity, the startup_event handles the full list)
        
        db.commit()
        return {"status": "success", "message": "Admin user and roles synchronized"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}


# ==================== Include Routers ====================

# Include routers with /api prefix
app.include_router(frontend_compat.router)  # Frontend compatibility layer (already has /api prefix)
app.include_router(auth.router, prefix="/api")
app.include_router(campaigns.router, prefix="/api")
app.include_router(media.router, prefix="/api")
app.include_router(pricing.router, prefix="/api")
app.include_router(payment.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(debug.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(geo.router, prefix="/api")
app.include_router(campaign_approval.router, prefix="/api")


# ==================== Startup/Shutdown Events ====================

@app.on_event("startup")
async def startup_event():
    """
    Run on application startup.
    Initialize database, connections, etc.
    """
    logger.info("🚀 STARTUP: Beginning initialization...")
    
    try:
        # Check SECRET_KEY stability - ENHANCED DIAGNOSTICS
        logger.info("="*80)
        logger.info("🔐 JWT SECRET CONFIGURATION CHECK")
        logger.info("="*80)
        logger.info(f"SECRET_KEY Source: Environment variable JWT_SECRET")
        logger.info(f"SECRET_KEY Length: {len(settings.SECRET_KEY)} characters")
        logger.info(f"SECRET_KEY Preview: {settings.SECRET_KEY[:15]}...{settings.SECRET_KEY[-15:]}")
        logger.info(f"Algorithm: {settings.ALGORITHM}")
        logger.info(f"Access Token Expiration: {settings.ACCESS_TOKEN_EXPIRE_MINUTES} minutes ({settings.ACCESS_TOKEN_EXPIRE_MINUTES/60:.1f} hours)")
        logger.info(f"Access Token Expiration: {settings.ACCESS_TOKEN_EXPIRE_MINUTES} minutes ({settings.ACCESS_TOKEN_EXPIRE_MINUTES/60:.1f} hours)")
        logger.info(f"Refresh Token Expiration: {settings.REFRESH_TOKEN_EXPIRE_DAYS} days")

        # STRIPE KEY DIAGNOSTICS
        logger.info("="*80)
        logger.info("💳 STRIPE CONFIGURATION CHECK")
        stripe_key = settings.STRIPE_SECRET_KEY
        if stripe_key:
            prefix = stripe_key[:7] if len(stripe_key) > 7 else "???"
            logger.info(f"✅ Stripe Secret Key Detected: {prefix}****************")
            if prefix.startswith("pk_"):
                logger.error("❌ CRITICAL: Your SECRET key starts with 'pk_'. This is a PUBLISHABLE key!")
                logger.error("👉 ACTION: Go to Railway > Variables > STRIPE_SECRET_KEY and replace it with your 'sk_...' key.")
            elif prefix.startswith("sk_"):
                logger.info("✅ Key format looks correct (starts with sk_)")
        else:
            logger.warning("❌ NO STRIPE SECRET KEY DETECTED! Payments will default to Mock Mode.")
        logger.info("="*80)
        
        if settings.SECRET_KEY == "dev_secret_key_change_me_in_production":
            logger.warning("="*80)
            logger.warning("⚠️  CRITICAL SECURITY WARNING!")
            logger.warning("⚠️  Using default development JWT_SECRET")
            logger.warning("⚠️  Tokens will be INVALID if server restarts!")
            logger.warning("⚠️  ")
            logger.warning("⚠️  ACTION REQUIRED:")
            logger.warning("⚠️  1. Go to Railway Dashboard")
            logger.warning("⚠️  2. Select your Backend Service")
            logger.warning("⚠️  3. Go to Variables tab")
            logger.warning("⚠️  4. Add: JWT_SECRET=<your_secure_random_64_char_secret>")
            logger.warning("⚠️  5. Add: ACCESS_TOKEN_EXPIRE_MINUTES=1440")
            logger.warning("⚠️  6. Add: REFRESH_TOKEN_EXPIRE_DAYS=30")
            logger.warning("="*80)
        else:
            logger.info(f"✅ SECURITY: Custom JWT_SECRET detected (Length: {len(settings.SECRET_KEY)})")
            
            # Test token generation and validation
            try:
                from . import auth as auth_module
                test_payload = {"sub": "1", "email": "test@example.com", "role": "admin"}
                test_token = auth_module.create_access_token(data=test_payload)
                logger.info(f"✅ JWT Token Generation Test: SUCCESS (token length: {len(test_token)})")
                
                # Try to decode it
                decoded = auth_module.decode_token(test_token)
                logger.info(f"✅ JWT Token Validation Test: SUCCESS (decoded sub: {decoded.get('sub')})")
            except Exception as token_err:
                logger.error(f"❌ JWT Token Test FAILED: {token_err}")
                
        logger.info("="*80)

        # COMPREHENSIVE SCHEMA MIGRATION (Ensures Railway DB matches local models)
        # COMPREHENSIVE SCHEMA MIGRATION (Ensures Railway DB matches local models)
        logger.info("🔧 Starting Database Synchronization...")
        
        # helper for individual column migrations
        def add_column_safely(table_name, col_name, col_type):
            try:
                from sqlalchemy import text
                with engine.connect() as conn:
                    # Check if column exists first (Postgres specific check for safety)
                    check_query = text(f"""
                        SELECT count(*) 
                        FROM information_schema.columns 
                        WHERE table_name = '{table_name}' AND column_name = '{col_name}'
                    """)
                    exists = conn.execute(check_query).scalar()
                    
                    if not exists:
                        logger.info(f"➕ Adding column {col_name} to {table_name}...")
                        conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_type}"))
                        conn.commit()
                        logger.info(f"✅ Added {col_name} to {table_name}")
                    else:
                        logger.debug(f"⏭️  Column {col_name} already exists in {table_name}")
            except Exception as e:
                logger.error(f"❌ Migration Error adding {col_name} to {table_name}: {e}")

        try:
            # 1. USERS Table Columns
            user_cols = [
                ("role", "VARCHAR(50) DEFAULT 'advertiser'"),
                ("country", "VARCHAR(100)"),
                ("industry", "VARCHAR(255)"),
                ("oauth_provider", "VARCHAR(50)"),
                ("oauth_id", "VARCHAR(255)"),
                ("profile_picture", "VARCHAR(500)"),
                ("last_login", "TIMESTAMP WITH TIME ZONE"),
                ("managed_country", "VARCHAR(10)")
            ]
            for name, dtype in user_cols:
                add_column_safely("users", name, dtype)

            # 2. CAMPAIGNS Table Columns
            campaign_cols = [
                ("headline", "VARCHAR(500)"),
                ("landing_page_url", "VARCHAR(500)"),
                ("ad_format", "VARCHAR(100)"),
                ("description", "TEXT"),
                ("tags", "JSON"),
                ("calculated_price", "FLOAT"),
                ("coverage_area", "VARCHAR(255)"),
                ("submitted_at", "TIMESTAMP WITH TIME ZONE"),
                ("admin_message", "TEXT"),
                ("reviewed_by", "INTEGER"),
                ("reviewed_at", "TIMESTAMP WITH TIME ZONE"),
                ("impressions", "INTEGER DEFAULT 0"),
                ("clicks", "INTEGER DEFAULT 0"),
                ("target_postcode", "VARCHAR(20)"),
                ("target_state", "VARCHAR(100)"),
                ("target_country", "VARCHAR(100)")
            ]
            for name, dtype in campaign_cols:
                add_column_safely("campaigns", name, dtype)

            # 3. Handle Notifications table correctly
            try:
                from sqlalchemy import text
                with engine.connect() as conn:
                    conn.execute(text("""
                        CREATE TABLE IF NOT EXISTS notifications (
                            id SERIAL PRIMARY KEY,
                            user_id INTEGER NOT NULL REFERENCES users(id),
                            campaign_id INTEGER REFERENCES campaigns(id),
                            notification_type VARCHAR(50) NOT NULL,
                            title VARCHAR(255) NOT NULL,
                            message TEXT NOT NULL,
                            is_read BOOLEAN DEFAULT FALSE,
                            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                            read_at TIMESTAMP WITH TIME ZONE
                        )
                    """))
                    conn.commit()
                    logger.info("✅ Notifications table checked/created")
            except Exception as e:
                logger.error(f"⚠️ Notifications table check failed: {e}")

            # 4. Sync Enums (Postgres specific)
            try:
                from sqlalchemy import text
                # Use execution_options(isolation_level="AUTOCOMMIT") for ALTER TYPE
                with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
                    status_values = [
                        "DRAFT", "SUBMITTED", "PENDING_REVIEW", "APPROVED", 
                        "REJECTED", "CHANGES_REQUIRED", "ACTIVE", "PAUSED", 
                        "COMPLETED", "PENDING"
                    ]
                    for val in status_values:
                        try:
                            conn.execute(text(f"ALTER TYPE campaignstatus ADD VALUE '{val}'"))
                            logger.info(f"💾 Added Enum Value: {val} to campaignstatus type")
                        except Exception:
                            # Most likely already exists, ignore
                            pass
            except Exception as enum_err:
                logger.warning(f"⚠️ Enum synchronization skipped: {enum_err}")

            # 5. Fix Foreign Key Constraints (Cascade Delete)
            try:
                from sqlalchemy import text
                with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
                    # 5a. Notifications -> Campaigns Cascade
                    conn.execute(text("""
                        DO $$ 
                        BEGIN 
                            IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'notifications_campaign_id_fkey') THEN
                                ALTER TABLE notifications DROP CONSTRAINT notifications_campaign_id_fkey;
                                ALTER TABLE notifications ADD CONSTRAINT notifications_campaign_id_fkey 
                                FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;
                            END IF;
                        END $$;
                    """))
                    
                    # 5b. Payment Transactions -> Campaigns Cascade
                    conn.execute(text("""
                        DO $$ 
                        BEGIN 
                            IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'payment_transactions_campaign_id_fkey') THEN
                                ALTER TABLE payment_transactions DROP CONSTRAINT payment_transactions_campaign_id_fkey;
                                ALTER TABLE payment_transactions ADD CONSTRAINT payment_transactions_campaign_id_fkey 
                                FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;
                            END IF;
                        END $$;
                    """))
                    
                    # 5c. Media -> Campaigns Cascade
                    conn.execute(text("""
                        DO $$ 
                        BEGIN 
                            IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'media_campaign_id_fkey') THEN
                                ALTER TABLE media DROP CONSTRAINT media_campaign_id_fkey;
                                ALTER TABLE media ADD CONSTRAINT media_campaign_id_fkey 
                                FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;
                            END IF;
                        END $$;
                    """))
                    
                    logger.info("✅ All Campaign FKs updated to CASCADE")
            except Exception as fk_err:
                logger.warning(f"⚠️ FK migration skipped: {fk_err}")

            # 6. Expand GEODATA column lengths (Fix for StringDataRightTruncation)
            try:
                from sqlalchemy import text
                logger.info("📐 Expanding GEODATA column lengths...")
                with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
                    conn.execute(text("ALTER TABLE geodata ALTER COLUMN state_code TYPE VARCHAR(100)"))
                    conn.execute(text("ALTER TABLE geodata ALTER COLUMN country_code TYPE VARCHAR(100)"))
                    logger.info("✅ GEODATA column lengths expanded")
            except Exception as ex_err:
                logger.warning(f"⚠️ GEODATA expansion failed: {ex_err}")

            logger.info("✅ Database synchronization complete")
        except Exception as mig_err:
            logger.error(f"❌ COMPREHENSIVE MIGRATION FAILED: {mig_err}")

        # COMPREHENSIVE GEODATA SEEDING (Ensures all 50 US states + DC)
        try:
            from .database import SessionLocal
            from . import models
            db = SessionLocal()
            try:
                # Check US states count (Need 51: 50 states + 1 DC)
                us_count = db.query(models.GeoData).filter(models.GeoData.country_code == "US").count()
                dc_exists = db.query(models.GeoData).filter(models.GeoData.country_code == "US", models.GeoData.state_code == "DC").first()
                
                # If data is incomplete or corrupted (e.g. population 0), re-seed.
                force_reseed = db.query(models.GeoData).filter(models.GeoData.country_code == "US", models.GeoData.population == 0).count() > 0
                
                if us_count < 51 or not dc_exists or force_reseed:
                    logger.info(f"📦 Re-seeding US Geodata (Found {us_count}, needing 51, reseed_forced={force_reseed})...")
                    # Clear incomplete US records to prevent duplicates or mix-ups
                    db.query(models.GeoData).filter(models.GeoData.country_code == "US").delete()
                    db.commit()
                    
                    # Comprehensive US Data including DC
                    us_states_data = [
                        ("California", "CA", 6, 39896400, 256.1, 1, 0.1153, 155779.0, 297, 1.0000),
                        ("Texas", "TX", 48, 32416700, 124.09, 2, 0.0936, 261232.0, 639, 0.4845),
                        ("Florida", "FL", 12, 24306900, 453.27, 3, 0.0702, 53625.0, 291, 1.7699),
                        ("New York", "NY", 36, 20127000, 427.08, 4, 0.0581, 47126.0, 372, 1.6676),
                        ("Pennsylvania", "PA", 42, 13200800, 295.03, 5, 0.0381, 44743.0, 288, 1.1520),
                        ("Illinois", "IL", 17, 12846000, 231.38, 6, 0.0371, 55519.0, 471, 0.9034),
                        ("Ohio", "OH", 39, 12001800, 293.72, 7, 0.0346, 40861.0, 256, 1.1469),
                        ("Georgia", "GA", 13, 11413800, 198.45, 8, 0.0329, 57513.0, 832, 0.7749),
                        ("North Carolina", "NC", 37, 11375700, 233.98, 9, 0.0328, 48618.0, 351, 0.9136),
                        ("Michigan", "MI", 26, 10254700, 181.37, 10, 0.0296, 56539.0, 289, 0.7082),
                        ("New Jersey", "NJ", 34, 9743271, 1324.89, 11, 0.0281, 7354.0, 38, 5.1732),
                        ("Virginia", "VA", 51, 8964220, 226.99, 12, 0.0259, 39490.0, 371, 0.8863),
                        ("Washington", "WA", 53, 8159900, 122.78, 13, 0.0235, 66456.0, 362, 0.4794),
                        ("Arizona", "AZ", 4, 7801100, 68.67, 14, 0.0225, 113594.0, 278, 0.2681),
                        ("Tennessee", "TN", 47, 7386640, 179.13, 15, 0.0213, 41235.0, 214, 0.6994),
                        ("Massachusetts", "MA", 25, 7275380, 932.74, 16, 0.0210, 7799.0, 52, 3.6420),
                        ("Indiana", "IN", 18, 7012560, 195.73, 17, 0.0202, 35826.0, 184, 0.7643),
                        ("Maryland", "MD", 24, 6355540, 654.73, 18, 0.0183, 9707.0, 56, 2.5565),
                        ("Missouri", "MO", 29, 6320320, 91.94, 19, 0.0182, 68742.0, 243, 0.3590),
                        ("Colorado", "CO", 8, 6069800, 58.56, 20, 0.0175, 103642.0, 413, 0.2287),
                        ("Wisconsin", "WI", 55, 6022120, 111.19, 21, 0.0174, 54158.0, 191, 0.4342),
                        ("Minnesota", "MN", 27, 5873360, 73.76, 22, 0.0169, 79627.0, 281, 0.2880),
                        ("South Carolina", "SC", 45, 5660830, 188.31, 23, 0.0163, 30061.0, 610, 0.7353),
                        ("Alabama", "AL", 1, 5237750, 103.42, 24, 0.0151, 50645.0, 217, 0.4038),
                        ("Kentucky", "KY", 21, 4663930, 118.11, 25, 0.0134, 39486.0, 131, 0.4612),
                        ("Louisiana", "LA", 22, 4617080, 106.86, 26, 0.0133, 43204.0, 111, 0.4173),
                        ("Oregon", "OR", 41, 4309810, 44.89, 27, 0.0124, 95988.0, 313, 0.1753),
                        ("Oklahoma", "OK", 40, 4158420, 60.62, 28, 0.0120, 68595.0, 162, 0.2367),
                        ("Connecticut", "CT", 9, 3739160, 772.23, 29, 0.0108, 4842.0, 71, 3.0153),
                        ("Utah", "UT", 49, 3624400, 44.1, 30, 0.0104, 82170.0, 129, 0.1722),
                        ("Nevada", "NV", 32, 3373680, 30.73, 31, 0.0097, 109781.0, 393, 0.1200),
                        ("Iowa", "IA", 19, 3287640, 58.85, 32, 0.0095, 55857.0, 177, 0.2298),
                        ("Arkansas", "AR", 5, 3126140, 60.07, 33, 0.0090, 52035.0, 318, 0.2346),
                        ("Kansas", "KS", 20, 3008820, 36.8, 34, 0.0086, 81759.0, 104, 0.1437),
                        ("Mississippi", "MS", 28, 2942790, 62.71, 35, 0.0085, 46923.0, 166, 0.2449),
                        ("New Mexico", "NM", 35, 2148440, 17.71, 36, 0.0062, 121298.0, 534, 0.0692),
                        ("Idaho", "ID", 16, 2062610, 24.95, 37, 0.0059, 82643.0, 292, 0.0975),
                        ("Nebraska", "NE", 31, 2040670, 26.56, 38, 0.0058, 76824.0, 271, 0.1037),
                        ("West Virginia", "WV", 54, 1768950, 73.58, 39, 0.0051, 24038.0, 88, 0.2873),
                        ("Hawaii", "HI", 15, 1455660, 226.63, 40, 0.0042, 6423.0, 33, 0.8849),
                        ("New Hampshire", "NH", 33, 1422700, 158.9, 41, 0.0041, 8953.0, 31, 0.6205),
                        ("Maine", "ME", 23, 1415740, 45.9, 42, 0.0040, 30843.0, 204, 0.1792),
                        ("Montana", "MT", 30, 1149100, 7.89, 43, 0.0033, 145546.0, 514, 0.0308),
                        ("Rhode Island", "RI", 44, 1130070, 1092.91, 44, 0.0032, 1034.0, 6, 4.2674),
                        ("Delaware", "DE", 10, 1082900, 555.61, 45, 0.0031, 1949.0, 19, 2.1695),
                        ("South Dakota", "SD", 46, 937397, 12.36, 46, 0.0027, 75811.0, 26, 0.0483),
                        ("North Dakota", "ND", 38, 811610, 11.76, 47, 0.0023, 70001.0, 24, 0.0459),
                        ("Alaska", "AK", 2, 747379, 1.3, 48, 0.0021, 570640.0, 201, 0.0051),
                        ("Vermont", "VT", 50, 648063, 70.31, 49, 0.0018, 9217.0, 3, 0.2745),
                        ("Wyoming", "WY", 56, 592720, 6.1, 50, 0.0017, 97093.0, 34, 0.0238),
                        ("District of Columbia", "DC", 11, 715000, 11280.0, 51, 0.0021, 68.3, 1, 40.8)
                    ]
                    
                    for name, code, fips, pop, dens_mi, rank, pct, area, radius_count, mult in us_states_data:
                        existing = db.query(models.GeoData).filter(
                            models.GeoData.country_code == "US",
                            models.GeoData.state_code == code
                        ).first()
                        
                        area_km = area * 2.58999
                        
                        if existing:
                            existing.state_name = name
                            existing.population = pop
                            existing.land_area_sq_km = area_km
                            existing.radius_areas_count = radius_count
                            existing.density_multiplier = mult
                            existing.fips = fips
                            existing.density_mi = dens_mi
                            existing.rank = rank
                            existing.population_percent = pct
                        else:
                            new_geo = models.GeoData(
                                country_code="US", state_code=code, state_name=name,
                                population=pop, land_area_sq_km=area_km, 
                                radius_areas_count=radius_count, density_multiplier=mult,
                                fips=fips, density_mi=dens_mi, rank=rank, population_percent=pct
                            )
                            db.add(new_geo)
                    db.commit()
                    logger.info("✅ US Geodata synchronized (51 records)")

                # Also seed UK data if missing
                gb_count = db.query(models.GeoData).filter(models.GeoData.country_code == "GB").count()
                if gb_count < 10:
                    logger.info("📦 Seeding missing UK Geodata...")
                    uk_regions = [
                        ("London", "GB", "LDN", 1572, 8982000, 2.5),
                        ("South East", "GB", "SE", 19095, 9180000, 1.2),
                        ("North West", "GB", "NW", 14165, 7341000, 1.1),
                        ("East of England", "GB", "EE", 19120, 6235000, 1.0),
                        ("South West", "GB", "SW", 23829, 5624000, 0.9),
                        ("West Midlands", "GB", "WM", 13000, 5935000, 1.1),
                        ("Scotland", "GB", "SCT", 77910, 5463000, 0.8),
                        ("Wales", "GB", "WLS", 20735, 3153000, 0.7),
                        ("East Midlands", "GB", "EM", 15627, 4836000, 0.9),
                        ("Yorkshire", "GB", "YKH", 11903, 5500000, 1.0)
                    ]
                    for name, country, code, area, pop, dens in uk_regions:
                        if not db.query(models.GeoData).filter(models.GeoData.state_code == code).first():
                            db.add(models.GeoData(
                                state_name=name, country_code=country, state_code=code, 
                                land_area_sq_km=area, population=pop, density_multiplier=dens
                            ))
                    db.commit()
                    logger.info("✅ UK Geodata synchronized")
                
                # Check for Pricing Matrix Synchronization
                if db.query(models.PricingMatrix).count() < 10:
                    logger.info("📦 Synchronizing Pricing Matrix Defaults...")
                    industries = [
                        "Tyres And Wheels", "Vehicle Servicing And Maintenance", "Panel Beating And Smash Repairs",
                        "Automotive Finance Solutions", "Vehicle Insurance Products", "Auto Parts Tools And Accessories",
                        "Fleet Management Tools", "Workshop Technology And Equipment", "Telematics Systems And Vehicle Tracking Solutions",
                        "Fuel Cards And Fuel Management Services", "Vehicle Cleaning And Detailing Services", "Logistics And Scheduling Software",
                        "Safety And Compliance Solutions", "Driver Training And Induction Programs", "Roadside Assistance Programs",
                        "Gps Navigation And Route Optimisation Tools", "Ev Charging Infrastructure And Electric Vehicle Solutions",
                        "Mobile Device Integration And Communications Equipment", "Asset Recovery And Anti Theft Technologies"
                    ]
                    ad_types = [
                        ("Leaderboard (728x90)", 150.0), ("Skyscraper (160x600)", 180.0), 
                        ("Medium Rectangle (300x250)", 200.0), ("Mobile Leaderboard (320x50)", 100.0), 
                        ("Email Newsletter (600x200)", 250.0)
                    ]
                    
                    for ind in industries:
                        for ad_name, ad_rate in ad_types:
                            if not db.query(models.PricingMatrix).filter(
                                models.PricingMatrix.industry_type == ind,
                                models.PricingMatrix.advert_type == ad_name
                            ).first():
                                db.add(models.PricingMatrix(
                                    industry_type=ind, advert_type=ad_name, 
                                    coverage_type=models.CoverageType.RADIUS_30,
                                    base_rate=ad_rate, multiplier=1.0, 
                                    state_discount=0.15, national_discount=0.30, 
                                    country_id="US"
                                ))
                    db.commit()
                    logger.info("✅ Pricing Matrix synchronized")
                    
            except Exception as e:
                logger.error(f"❌ Error during sync: {e}")
                db.rollback()
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
                    # Pre-calculated hash for 'admin123'
                    admin_user = models.User(
                        name="Admin User",
                        email="admin@adplatform.com",
                        password_hash="$2b$12$6uXoTqO9M9R9PqR9PqR9Pu6uXoTqO9M9R9PqR9PqR9PqR9PqR9PqR",
                        role=models.UserRole.ADMIN,
                        country="US"
                    )
                    db.add(admin_user)
                    db.commit()
                    try:
                        admin_user.password_hash = auth.get_password_hash("admin123")
                        db.commit()
                    except: pass
                else:
                    admin.role = models.UserRole.ADMIN
                    try:
                        # Only reset password if it looks like a stub or requested
                        if not admin.password_hash or len(admin.password_hash) < 20:
                            admin.password_hash = auth.get_password_hash("admin123")
                        db.commit()
                    except: pass
            except Exception as e:
                logger.error(f"❌ Error during admin sync: {e}")
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
