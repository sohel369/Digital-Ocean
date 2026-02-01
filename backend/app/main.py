# 1. IMMEDIATE LOGGING & APP SETUP
import logging
import sys
import os
import time

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("startup")

print(f"🔥 [DEBUG] Starting process at {time.ctime()}", flush=True)
print(f"🔥 [DEBUG] PYTHON PATH: {sys.path}", flush=True)
print(f"🔥 [DEBUG] PORT: {os.environ.get('PORT', '8000')}", flush=True)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# 2. LOAD ALL DEPENDENCIES FIRST (SYNCHRONOUS)
logger.info("📦 Loading dependencies...")
from .config import settings
from .database import engine, Base, init_db, SessionLocal
from . import models, auth
from .routers import (
    auth as auth_router, campaigns, media, pricing,
    analytics, admin, payment, frontend_compat,
    geo, campaign_approval, debug
)

app = FastAPI(title="AdPlatform API")

# --- 3. CORS CONFIGURATION (CRITICAL FOR RAILWAY) ---
# Get allowed origins from environment or use defaults
ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "").split(",") if os.environ.get("ALLOWED_ORIGINS") else [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://digital-ocean-production-01ee.up.railway.app",
    "https://balanced-wholeness-production-ca00.up.railway.app"
]

# Clean up origins list
ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS if origin.strip()]

logger.info(f"🌐 CORS Allowed Origins: {ALLOWED_ORIGINS}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # Specific origins for credentials
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# 4. PRIORITY HEALTH CHECK (MUST BE FAST)
@app.get("/api/health")
@app.get("/")
async def health_check():
    return {"status": "healthy", "timestamp": time.time(), "env": "railway"}

# 5. INITIALIZE DATABASE (SYNCHRONOUS - BEFORE STARTUP)
logger.info("🗄️ Initializing database...")
init_db()

# 6. INCLUDE ALL ROUTERS (SYNCHRONOUS - CRITICAL FOR RAILWAY)
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

@app.on_event("startup")
async def startup_event():
    logger.info("🚀 Server startup complete. All endpoints ready.")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)
