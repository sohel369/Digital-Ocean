"""
FastAPI Application - Advertiser Dashboard Backend
Main application entry point with router configuration and middleware.
"""
import logging
import time
import sys
import os

from .config import settings

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL, logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

from fastapi import FastAPI, Request, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .database import engine, Base, init_db, SessionLocal
from . import models, auth

# Import routers
from .routers import (
    auth as auth_router, campaigns, media, pricing,
    analytics, admin, payment, frontend_compat,
    geo, campaign_approval, debug
)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG
)

# Robust CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Simplest for Railway healthcheck success
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Logger
@app.middleware("http")
async def log_requests(request: Request, call_next):
    try:
        response = await call_next(request)
        return response
    except Exception as exc:
        logger.error(f"🔥 [CRASH] {str(exc)}", exc_info=True)
        return JSONResponse(status_code=500, content={"error": "Internal server error", "detail": str(exc)})

# Router Inclusions
app.include_router(auth_router.router, prefix="/api")
app.include_router(campaigns.router, prefix="/api")
app.include_router(media.router, prefix="/api")
app.include_router(pricing.router, prefix="/api")
app.include_router(payment.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(debug.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(geo.router, prefix="/api")
app.include_router(campaign_approval.router, prefix="/api")
app.include_router(frontend_compat.router) # Prefix handled internally

@app.get("/api/health")
async def health_check():
    """Ultra-simple health check for Railway."""
    return {"status": "healthy", "version": settings.APP_VERSION}

@app.get("/api/admin/fix-db")
async def fix_database():
    """Emergency migration endpoint."""
    try:
        from sqlalchemy import text, inspect
        init_db()
        with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
            inspector = inspect(engine)
            def migrate(table, col, dtype):
                try:
                    cols = [c['name'] for c in inspector.get_columns(table)]
                    if col not in cols:
                        logger.info(f"➕ Adding {table}.{col}...")
                        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {dtype}"))
                except Exception as e:
                    logger.warning(f"⚠️ Could not migrate {table}.{col}: {e}")
            
            # Critical migrations
            for c, t in [("role", "VARCHAR(50)"), ("country", "VARCHAR(100)"), ("industry", "VARCHAR(255)"), ("managed_country", "VARCHAR(10)"), ("last_login", "TIMESTAMP")]:
                migrate("users", c, t)
            
            # Special fix for ENUM type issue on Postgres
            try:
                conn.execute(text("ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(50) USING role::text"))
            except: pass

            for c, t in [("budget", "FLOAT DEFAULT 0"), ("headline", "VARCHAR(500)"), ("landing_page_url", "VARCHAR(500)"), ("ad_format", "VARCHAR(100)"), ("reviewed_at", "TIMESTAMP")]:
                migrate("campaigns", c, t)
        
        return {"status": "success", "message": "Database migrations applied."}
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        return {"status": "error", "detail": str(e)}

@app.on_event("startup")
async def startup_event():
    """Startup initialization."""
    logger.info(f"🚀 App starting (Ver {settings.APP_VERSION})...")
    try:
        # Fast initialization
        db = SessionLocal()
        from sqlalchemy import func
        admin_email = "admin@adplatform.com"
        admin = db.query(models.User).filter(func.lower(models.User.email) == admin_email.lower()).first()
        
        if not admin:
            logger.info(f"📦 Creating default admin account: {admin_email}")
            new_admin = models.User(
                name="System Admin", 
                email=admin_email,
                password_hash=auth.get_password_hash("admin123"),
                role="admin"
            )
            db.add(new_admin)
            db.commit()
            logger.info("✅ Default admin created.")
        else:
            admin.role = "admin"
            db.commit()
            logger.info("✅ Admin synced.")
        db.close()
    except Exception as e:
        logger.warning(f"⚠️ Startup warning: {e}")
    logger.info("✅ Startup complete")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
