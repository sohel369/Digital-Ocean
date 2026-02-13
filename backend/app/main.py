# 1. MINIMAL STARTUP - Health Check First
import logging
import sys
import os
import time

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("startup")

print(f"🔥 [DEBUG] Starting process at {time.ctime()}", flush=True)
print(f"🔥 [DEBUG] PYTHON PATH: {sys.path}", flush=True)
print(f"🔥 [DEBUG] PORT: {os.environ.get('PORT', '8000')}", flush=True)
print(f"🔥 [DEBUG] CWD: {os.getcwd()}", flush=True)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Create app IMMEDIATELY for health checks
app = FastAPI(title="AdPlatform API")

# CORS - Must be before health check
ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "").split(",") if os.environ.get("ALLOWED_ORIGINS") else [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://digital-ocean-production-01ee.up.railway.app",
    "https://balanced-wholeness-production-ca00.up.railway.app"
]
ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS if origin.strip()]

logger.info(f"🌐 CORS Allowed Origins: {ALLOWED_ORIGINS}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.up\.railway\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# CRITICAL: Health check BEFORE heavy imports
@app.get("/api/health")
@app.get("/")
async def health_check():
    return {"status": "healthy", "timestamp": time.time(), "env": "railway"}

# Debug endpoint to check initialization status
initialization_status = {"loaded": False, "error": None}

@app.get("/api/debug/status")
async def debug_status():
    return initialization_status

# 2. NOW load heavy dependencies (after health check is ready)
logger.info("📦 Loading dependencies...")
try:
    # Use absolute imports for Railway compatibility
    from app.config import settings
    from app.database import engine, Base, init_db, SessionLocal
    from app import models, auth
    from app.routers import (
        auth as auth_router, campaigns, media, pricing,
        analytics, admin, payment, frontend_compat,
        geo, campaign_approval, debug
    )
    
    logger.info("✅ Dependencies loaded successfully")
    
    # 3. Initialize database
    logger.info("🗄️ Initializing database...")
    init_db()
    logger.info("✅ Database initialized")
    
    # 4. Register routers
    logger.info("🔌 Registering API routers...")
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
    
    logger.info("✅ All routers registered successfully.")
    initialization_status["loaded"] = True
except Exception as e:
    logger.error(f"❌ Initialization error: {e}", exc_info=True)
    print(f"❌ FATAL ERROR: {e}", flush=True)
    import traceback
    traceback.print_exc()
    initialization_status["error"] = str(e)
    initialization_status["traceback"] = traceback.format_exc()
    # App will still respond to health checks even if initialization fails

@app.on_event("startup")
async def startup_event():
    logger.info("🚀 Server startup complete.")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)
