from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
import os
import platform
from datetime import datetime

from ..database import get_db, engine
from ..config import settings
from .. import models

router = APIRouter(prefix="/debug", tags=["Debug"])

@router.post("/auto-fix")
async def auto_fix(db: Session = Depends(get_db)):
    """
    Emergency tool to fix Railway deployment issues:
    1. Seeds US Geographic Data (51 states)
    2. Seeds Essential Data (Admin account)
    3. Fixes Role Enum issues
    4. Seeds Pricing Matrix for Video
    """
    results = {}
    
    # 1. Role Enum Fix
    try:
        if "postgresql" in settings.DATABASE_URL.lower():
            with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
                res = conn.execute(text("""
                    SELECT data_type, udt_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'users' AND column_name = 'role'
                """)).fetchone()
                
                if res and (res[0] == 'USER-DEFINED' or res[1] == 'userrole'):
                    conn.execute(text("ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(50) USING role::text"))
                    results["role_fix"] = "Converted to VARCHAR(50)"
                else:
                    results["role_fix"] = "Already compatible"
        else:
            results["role_fix"] = "Skipped (not Postgres)"
    except Exception as e:
        results["role_fix"] = f"Error: {str(e)}"

    # 2. Geo Data Seeding
    try:
        from ..utils.geo_data_seed import US_STATES_DATA
        added = 0
        for name, code, fips, pop, dens_mi, rank, pct, area, radius_count, mult in US_STATES_DATA:
            existing = db.query(models.GeoData).filter(
                models.GeoData.country_code == "US",
                models.GeoData.state_code == code
            ).first()
            
            # Conversion: 1 sq mile = 2.58999 sq km
            area_km = area * 2.58999
            
            if not existing:
                new_geo = models.GeoData(
                    country_code="US", state_code=code, state_name=name,
                    population=pop, land_area_sq_km=area_km, radius_areas_count=radius_count,
                    density_multiplier=mult, fips=fips, density_mi=dens_mi,
                    rank=rank, population_percent=pct
                )
                db.add(new_geo)
                added += 1
            elif existing.population == 0:
                existing.population = pop
                existing.land_area_sq_km = area_km
                added += 1
        
        db.commit()
        results["geo_seed"] = f"Processed {len(US_STATES_DATA)} states. updated {added} records."
    except Exception as e:
        results["geo_seed"] = f"Error: {str(e)}"

    # 3. Essential Data (Admin)
    try:
        from ..auth import get_password_hash
        admin = db.query(models.User).filter(models.User.email == "admin@adplatform.com").first()
        if not admin:
            admin = models.User(
                name="System Admin",
                email="admin@adplatform.com",
                password_hash=get_password_hash("admin123"),
                role="admin",
                country="US"
            )
            db.add(admin)
            db.commit()
            results["admin_seed"] = "Created admin@adplatform.com"
        else:
            results["admin_seed"] = "Admin already exists"
    except Exception as e:
        results["admin_seed"] = f"Error: {str(e)}"

    # 4. Pricing Matrix (Video)
    try:
        video_types = ["Video", "Video Content"]
        for vt in video_types:
            exists = db.query(models.PricingMatrix).filter(models.PricingMatrix.advert_type == vt).first()
            if not exists:
                new_entry = models.PricingMatrix(
                    industry_type="General",
                    advert_type=vt,
                    coverage_type="30-mile",
                    base_rate=500.0,
                    multiplier=1.0,
                    country_id="US"
                )
                db.add(new_entry)
        db.commit()
        results["pricing_fix"] = "Video formats added to matrix"
    except Exception as e:
        results["pricing_fix"] = f"Error: {str(e)}"

    return results

@router.get("/system")
async def system_debug():
    """Check basic system info and environment stability."""
    return {
        "status": "online",
        "timestamp": datetime.utcnow().isoformat(),
        "platform": platform.platform(),
        "python_version": platform.python_version(),
        "app_version": settings.APP_VERSION,
        "debug_mode": settings.DEBUG,
        "database_type": "Postgres" if "postgres" in settings.DATABASE_URL else "SQLite/Other"
    }

@router.get("/env")
async def env_debug():
    """Check critical environment variables (sanitized)."""
    return {
        "JWT_SECRET_SET": settings.SECRET_KEY != "dev_secret_key_change_me_in_production",
        "JWT_SECRET_LENGTH": len(settings.SECRET_KEY),
        "ACCESS_TOKEN_EXPIRE": settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        "DATABASE_URL_CONFIGURED": bool(settings.DATABASE_URL),
        "CORS_ORIGINS": settings.CORS_ORIGINS,
        "STRIPE_CONFIGURED": bool(settings.STRIPE_SECRET_KEY and len(settings.STRIPE_SECRET_KEY) > 10)
    }

@router.get("/db")
async def db_debug(db: Session = Depends(get_db)):
    """Check database connectivity and tables."""
    try:
        # Check users table
        user_count = db.query(models.User).count()
        admin_exists = db.query(models.User).filter(models.User.role == models.UserRole.ADMIN).first() is not None
        
        # Check columns in users table
        columns = []
        with engine.connect() as conn:
            result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'"))
            columns = [row[0] for row in result]
            
        return {
            "connectivity": "OK",
            "user_count": user_count,
            "admin_account_ready": admin_exists,
            "user_table_columns": columns,
            "required_columns_present": "industry" in columns and "oauth_provider" in columns
        }
    except Exception as e:
        return {
            "connectivity": "FAILED",
            "error": str(e)
        }
