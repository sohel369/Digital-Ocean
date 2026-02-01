# 1. IMMEDIATE LOGGING & APP SETUP
import logging
import sys
import os
import time
import asyncio

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("startup")

print(f"🔥 [DEBUG] Starting process at {time.ctime()}", flush=True)
print(f"🔥 [DEBUG] PYTHON PATH: {sys.path}", flush=True)
print(f"🔥 [DEBUG] PORT: {os.environ.get('PORT', '8000')}", flush=True)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

app = FastAPI(title="AdPlatform API")

# --- 2. CORS CONFIGURATION (CRITICAL) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows your frontend to connect
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. PRIORITY HEALTH CHECK (MUST BE FAST)
@app.get("/api/health")
@app.get("/")
async def health_check():
    return {"status": "healthy", "timestamp": time.time(), "env": "railway"}

# 3. BACKGROUND INITIALIZATION (To avoid blocking startup)
async def init_everything():
    await asyncio.sleep(1) # Give server 1 second to breathe
    logger.info("🚀 Starting async background initialization...")
    try:
        from .config import settings
        from .database import engine, Base, init_db, SessionLocal
        from . import models, auth
        from .routers import (
            auth as auth_router, campaigns, media, pricing,
            analytics, admin, payment, frontend_compat,
            geo, campaign_approval, debug
        )
        
        # Init DB tables
        logger.info("🗄️ Initializing DB tables...")
        init_db()
        
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
        
        logger.info("✅ All modules and routers loaded successfully.")
    except Exception as e:
        logger.error(f"❌ Initialization failed: {e}", exc_info=True)

@app.on_event("startup")
async def startup_event():
    logger.info("🔥 Server has started and is listening. Starting background tasks...")
    asyncio.create_task(init_everything())

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)
