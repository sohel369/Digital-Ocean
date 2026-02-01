# Configure logging immediately at the top
import logging
import sys
import os
import time
import asyncio

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("startup")
logger.info("🔥 [BOOT] Backend process starting...")
print("🔥 [STDOUT] Backend process starting...", flush=True)

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

# Create FastAPI instance with early health check
app = FastAPI(title="Advertiser Dashboard API")

@app.get("/api/health")
@app.get("/")
async def health_check():
    """Ultra-fast health check to satisfy Railway immediately."""
    return {"status": "healthy", "timestamp": time.time()}

logger.info("✅ [BOOT] Health check route registered.")

# --- MIDDLEWARE ---
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    try:
        response = await call_next(request)
        return response
    except Exception as exc:
        logger.error(f"🔥 [CRASH] {str(exc)}", exc_info=True)
        return JSONResponse(
            status_code=500, 
            content={"error": "Internal server error", "detail": str(exc)}
        )

from .config import settings

# --- 3. LATE IMPORTS ---
try:
    from .database import engine, Base, init_db, SessionLocal
    from . import models, auth
    
    # Import routers
    from .routers import (
        auth as auth_router, campaigns, media, pricing,
        analytics, admin, payment, frontend_compat,
        geo, campaign_approval, debug
    )
    
    # Include Routers
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
    app.include_router(frontend_compat.router)
    logger.info("✅ [BOOT] All routers included.")
except Exception as e:
    logger.error(f"❌ [CRASH] Failed to load modules/routers: {e}", exc_info=True)

# --- 5. EMERGENCY ENDPOINTS ---
@app.get("/api/admin/fix-db")
async def fix_database():
    """Emergency migration endpoint to fix Postgres ENUM and missing columns."""
    try:
        from sqlalchemy import text, inspect
        # Fast init
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
            for table_name, columns in [
                ("users", [("role", "VARCHAR(50)"), ("country", "VARCHAR(100)"), ("industry", "VARCHAR(255)"), ("managed_country", "VARCHAR(10)"), ("last_login", "TIMESTAMP")]),
                ("campaigns", [("budget", "FLOAT DEFAULT 0"), ("headline", "VARCHAR(500)"), ("landing_page_url", "VARCHAR(500)"), ("ad_format", "VARCHAR(100)"), ("reviewed_at", "TIMESTAMP")]),
                ("geodata", [("radius_areas_count", "INTEGER DEFAULT 1"), ("fips", "INTEGER"), ("density_mi", "FLOAT")])
            ]:
                for c, t in columns:
                    migrate(table_name, c, t)
            
            # Postgres ENUM bypass
            try:
                conn.execute(text("ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(50) USING role::text"))
            except: pass
        
        return {"status": "success", "message": "Database refined."}
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        return {"status": "error", "detail": str(e)}

# --- 6. STARTUP LOGIC ---
async def background_initialization():
    """Background task to initialize DB and sync admin without blocking startup."""
    # Wait a tiny bit to let the server start accepting requests first
    await asyncio.sleep(2)
    logger.info("📦 Running background initialization (DB & Admin)...")
    try:
        from .database import init_db, SessionLocal
        from sqlalchemy import func
        
        # 1. Initialize Tables (Safe to run multiple times)
        logger.info("🗄️  Ensuring database tables...")
        init_db()
        
        # 2. Sync Admin Account
        db = SessionLocal()
        admin_email = "admin@adplatform.com"
        admin = db.query(models.User).filter(func.lower(models.User.email) == admin_email.lower()).first()
        
        if not admin:
            logger.info("➕ Creating default admin account...")
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
            if admin.role != "admin":
                admin.role = "admin"
                db.commit()
                logger.info("✅ Admin role synced.")
            else:
                logger.info("✅ Admin already exists and is valid.")
        db.close()
        logger.info("🎉 Background initialization complete!")
    except Exception as e:
        logger.error(f"❌ Background initialization failed: {e}")

@app.on_event("startup")
async def startup_event():
    """Ultra-minimal non-blocking startup."""
    logger.info(f"🚀 App starting (Ver {settings.APP_VERSION})...")
    
    # Sanity check for JWT_SECRET
    if settings.SECRET_KEY == "dev_secret_key_change_me_in_production":
        logger.warning("⚠️ SECURITY: Using default development JWT_SECRET. NOT RECOMMENDED FOR PRODUCTION!")
    else:
        logger.info(f"🔑 SECURITY: Custom JWT_SECRET detected (Length: {len(settings.SECRET_KEY)})")
        
    # Start DB init and sync in background so it doesn't block Railway healthchecks
    asyncio.create_task(background_initialization())
    logger.info("✅ Startup sequence initiated (background tasks running)")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)
