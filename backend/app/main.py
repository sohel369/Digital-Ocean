"""
FastAPI Application - Advertiser Dashboard Backend
Main application entry point with router configuration and middleware.
"""
import logging
import time
import sys
import os
import traceback

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

# Robust CORS Configuration for Railway Production
cors_origins = [
    settings.FRONTEND_URL,
    "http://localhost:5173",
    "http://localhost:3000",
    "https://digital-ocean-production-01ee.up.railway.app",  # Main Prod
    "https://digital-ocean-production-01ee.up.railway.app/", # Main Prod Slash
    "https://balanced-wholeness-production-ca00.up.railway.app" # Backend itself
]

# Add railway deployment URL to CORS just in case
if os.environ.get("RAILWAY_STATIC_URL"):
    cors_origins.append(f"https://{os.environ.get('RAILWAY_STATIC_URL')}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o for o in cors_origins if o],
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

# Routers - IMPORTANT: frontend_compat must be at ROOT because it carries its own /api prefix
app.include_router(frontend_compat.router)

# Standard Routers
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

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "version": settings.APP_VERSION}

@app.get("/api/admin/fix-db")
async def fix_database():
    """Emergency endpoint to run migrations and fix missing columns."""
    try:
        from sqlalchemy import text, inspect
        init_db()
        with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
            inspector = inspect(engine)
            def migrate(table, col, dtype):
                try:
                    if col not in [c['name'] for c in inspector.get_columns(table)]:
                        logger.info(f"➕ Adding {table}.{col}...")
                        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {dtype}"))
                except: pass
            
            # Critical migrations
            for c, t in [("role", "VARCHAR(50)"), ("country", "VARCHAR(100)"), ("industry", "VARCHAR(255)"), ("managed_country", "VARCHAR(10)")]:
                migrate("users", c, t)
            for c, t in [("budget", "FLOAT DEFAULT 0"), ("headline", "VARCHAR(500)"), ("landing_page_url", "VARCHAR(500)"), ("ad_format", "VARCHAR(100)")]:
                migrate("campaigns", c, t)
            for c, t in [("radius_areas_count", "INTEGER DEFAULT 1"), ("fips", "INTEGER"), ("density_mi", "FLOAT")]:
                migrate("geodata", c, t)
        
        return {"status": "success", "message": "Database migrations applied."}
    except Exception as e:
        return {"status": "error", "detail": str(e)}

@app.on_event("startup")
async def startup_event():
    logger.info("🚀 App starting (Ver 1.1.1)...")
    try:
        db = SessionLocal()
        # Find admin by case-insensitive email
        from sqlalchemy import func
        admin = db.query(models.User).filter(func.lower(models.User.email) == "admin@adplatform.com").first()
        if not admin:
            logger.info("📦 Creating default admin account...")
            new_admin = models.User(
                name="System Admin", 
                email="admin@adplatform.com",
                password_hash=auth.get_password_hash("admin123"),
                role="admin"
            )
            db.add(new_admin)
            db.commit()
            logger.info("✅ Default admin created (admin@adplatform.com / admin123)")
        else:
            # Ensure role is 'admin' even if it was something else
            if str(admin.role).lower() != "admin":
                admin.role = "admin"
                db.commit()
        db.close()
    except Exception as e:
        logger.warning(f"⚠️ Startup admin sync skipped: {e}")
    logger.info("✅ Startup sequence complete")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
