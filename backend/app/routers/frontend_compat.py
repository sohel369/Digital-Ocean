"""
Frontend compatibility layer - Maps frontend API calls to backend routes.
"""
from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from datetime import datetime

from .. import models, auth
from ..database import get_db

router = APIRouter(prefix="/api", tags=["Frontend Compatibility"])


@router.get("/stats")
async def get_stats(db: Session = Depends(get_db)):
    """
    Get dashboard statistics.
    Returns empty stats (frontend uses Firebase auth only).
    """
    return {
        "totalSpend": 0,
        "impressions": 0,
        "clicks": 0,
        "ctr": 0.0,
        "budgetRemaining": 0
    }


@router.get("/campaigns")
async def list_campaigns_compat(db: Session = Depends(get_db)):
    """
    List campaigns.
    Returns all campaigns (frontend handles filtering via Firebase auth).
    """
    campaigns = db.query(models.Campaign).order_by(models.Campaign.created_at.desc()).limit(50).all()
    
    # Transform to frontend format
    return [
        {
            "id": c.id,
            "name": c.name,
            "budget": c.budget,
            "spend": c.calculated_price or 0,
            "start_date": str(c.start_date),
            "end_date": str(c.end_date) if c.end_date else None,
            "status": c.status.value,
            "impressions": c.impressions,
            "clicks": c.clicks,
            "ctr": c.ctr,
            "ad_format": "Display",
            "headline": c.name,
            "description": c.description or "",
            "image": None,
            "meta": {
                "industry": c.industry_type,
                "coverage": c.coverage_type.value,
                "location": c.target_state or c.target_postcode or c.target_country
            }
        }
        for c in campaigns
    ]


@router.post("/campaigns")
async def create_campaign_compat(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Create campaign - compatibility endpoint for frontend.
    Uses the last authenticated user from google-auth.
    """
    try:
        from ..pricing import PricingEngine
        from datetime import datetime as dt, timedelta
        
        # Parse JSON manually to handle potential empty/bad bodies
        try:
            data = await request.json()
            logger.info(f"📥 Received compatibility campaign request: {data}")
        except Exception as e:
            logger.error(f"❌ Failed to parse JSON body: {str(e)}")
            return JSONResponse(status_code=400, content={"error": "Invalid JSON body"})

        # Get user (fallback)
        user = db.query(models.User).order_by(models.User.last_login.desc()).first()
        if not user:
            logger.warning("⚠️ No user found in DB for campaign creation")
            return JSONResponse(status_code=401, content={"error": "User session not synchronized. Please log in again."})
        
        # Robustly extract metadata
        meta = data.get("meta", {})
        if isinstance(meta, str): # Handle cases where meta might be sent as string
            import json
            try: meta = json.loads(meta)
            except: meta = {}

        coverage_val = meta.get("coverage", "radius")
        coverage_map = {
            "radius": models.CoverageType.RADIUS_30,
            "state": models.CoverageType.STATE,
            "national": models.CoverageType.COUNTRY
        }
        coverage_type = coverage_map.get(coverage_val, models.CoverageType.RADIUS_30)
        
        # Robust date handling
        def parse_date(date_str):
            if not date_str: return None
            try: return dt.strptime(date_str[:10], "%Y-%m-%d").date()
            except: 
                try: return dt.fromisoformat(str(date_str).replace('Z', '+00:00')).date()
                except: return None

        start_date = parse_date(data.get("startDate")) or dt.now().date()
        end_date = parse_date(data.get("endDate")) or (start_date + timedelta(days=30))
        
        # Calculate pricing
        try:
            pricing_engine = PricingEngine(db)
            pricing_result = pricing_engine.calculate_price(
                industry_type=meta.get("industry", "retail"),
                advert_type="display",
                coverage_type=coverage_type,
                duration_days=max((end_date - start_date).days, 1),
                target_postcode=meta.get("location") if coverage_val == "radius" else None,
                target_state=meta.get("location") if coverage_val == "state" else None,
                target_country="US" if coverage_val == "national" else None
            )
        except Exception as e:
            logger.error(f"❌ Pricing calculation failed: {str(e)}")
            # Fallback pricing to prevent 500
            pricing_result = type('obj', (object,), {'total_price': float(data.get("budget", 0)), 'breakdown': {'coverage_area_description': 'Standard Coverage'}})

        # Create campaign and save to DB
        try:
            new_campaign = models.Campaign(
                advertiser_id=user.id,
                name=data.get("name") or "New Campaign",
                industry_type=meta.get("industry") or "other",
                start_date=start_date,
                end_date=end_date,
                budget=float(data.get("budget", 0)),
                calculated_price=pricing_result.total_price,
                status=models.CampaignStatus.DRAFT,
                coverage_type=coverage_type,
                coverage_area=pricing_result.breakdown.get('coverage_area_description', 'Specified Area'),
                target_postcode=meta.get("location") if coverage_val == "radius" else None,
                target_state=meta.get("location") if coverage_val == "state" else None,
                target_country="US" if coverage_val == "national" else None,
                description=data.get("description", "")
            )
            
            db.add(new_campaign)
            db.commit()
            db.refresh(new_campaign)
            logger.info(f"✅ Campaign created successfully: ID {new_campaign.id}")
        except Exception as e:
            db.rollback()
            logger.error(f"❌ Database error during campaign save: {str(e)}")
            return JSONResponse(status_code=500, content={"error": "Database error", "detail": str(e)})
        
        return {
            "id": new_campaign.id,
            "name": new_campaign.name,
            "budget": new_campaign.budget,
            "spend": new_campaign.calculated_price,
            "start_date": str(new_campaign.start_date),
            "end_date": str(new_campaign.end_date),
            "status": new_campaign.status.value,
            "impressions": new_campaign.impressions,
            "clicks": new_campaign.clicks,
            "ctr": new_campaign.ctr
        }
    except Exception as e:
        import traceback
        logger.error(f"🔥 FATAL ERROR in create_campaign_compat: {str(e)}\n{traceback.format_exc()}")
        return JSONResponse(status_code=500, content={"error": "Unexpected server error", "detail": str(e)})


@router.get("/notifications")
async def get_notifications():
    """
    Get notifications.
    Returns empty array (not implemented yet in backend).
    """
    return []


@router.post("/notifications/read")
async def mark_notifications_read():
    """
    Mark all notifications as read.
    """
    return {"message": "Marked as read"}


@router.post("/google-auth")
async def google_auth_sync(request: Request, db: Session = Depends(get_db)):
    """
    Sync Firebase authenticated user with backend.
    Creates or updates user record and returns user data.
    """
    data = await request.json()
    
    email = data.get("email")
    username = data.get("username")
    photo_url = data.get("photoURL")
    uid = data.get("uid")
    
    if not email:
        return JSONResponse(
            status_code=400,
            content={"success": False, "message": "Email required"}
        )
    
    # Check if user exists
    user = db.query(models.User).filter(models.User.email == email).first()
    
    if user:
        # Update OAuth info if needed
        if not user.oauth_id:
            user.oauth_provider = 'google'
            user.oauth_id = uid
            user.profile_picture = photo_url
        user.last_login = datetime.utcnow()
    else:
        # Create new user
        user = models.User(
            name=username or email.split('@')[0],
            email=email,
            oauth_provider='google',
            oauth_id=uid,
            profile_picture=photo_url,
            role=models.UserRole.ADVERTISER,
            last_login=datetime.utcnow()
        )
        db.add(user)
    
    db.commit()
    db.refresh(user)
    
    # Return user data in frontend format
    logger.info(f"✅ User synced: {user.email}")
    return {
        "success": True,
        "user": {
            "id": user.id,
            "username": user.name,
            "email": user.email,
            "avatar": user.profile_picture,
            "role": user.role.value
        }
    }


@router.post("/logout")
async def logout_compat():
    """
    Logout endpoint - primarily for frontend to call.
    With JWT/Firebase, logout is mainly client-side.
    """
    return {"message": "Logged out successfully"}
