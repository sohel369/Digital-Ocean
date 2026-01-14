"""
Frontend compatibility layer - Maps frontend API calls to backend routes.
"""
from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from datetime import datetime

from .. import models, auth
from ..database import get_db

import logging

# Ensure logger is defined at module level
logger = logging.getLogger(__name__)


router = APIRouter(prefix="/api", tags=["Frontend Compatibility"])


@router.get("/")
async def api_root():
    """
    API Root endpoint.
    """
    return {
        "message": "Advertiser Dashboard API - Compatibility Layer",
        "endpoints": [
            "/api/stats",
            "/api/campaigns",
            "/api/pricing/admin/config",
            "/api/notifications"
        ]
    }


@router.get("/stats")
async def get_stats(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get dashboard statistics for the authenticated user.
    """
    # If admin, show system-wide stats or just 0s as per original compat intent
    # But for advertiser, show their own stats
    if current_user.role == models.UserRole.ADMIN:
        from sqlalchemy import func
        total_spend = db.query(func.sum(models.Campaign.calculated_price)).scalar() or 0
        impressions = db.query(func.sum(models.Campaign.impressions)).scalar() or 0
        clicks = db.query(func.sum(models.Campaign.clicks)).scalar() or 0
        return {
            "totalSpend": round(float(total_spend), 2),
            "impressions": int(impressions),
            "clicks": int(clicks),
            "ctr": round((clicks / impressions * 100) if impressions > 0 else 0, 2),
            "budgetRemaining": 0
        }
    
    # Calculate for specific user
    user_campaigns = db.query(models.Campaign).filter(models.Campaign.advertiser_id == current_user.id).all()
    total_spend = sum(c.calculated_price for c in user_campaigns if c.calculated_price)
    impressions = sum(c.impressions for c in user_campaigns)
    clicks = sum(c.clicks for c in user_campaigns)
    
    return {
        "totalSpend": round(float(total_spend), 2),
        "impressions": int(impressions),
        "clicks": int(clicks),
        "ctr": round((clicks / impressions * 100) if impressions > 0 else 0, 2),
        "budgetRemaining": sum(c.budget for c in user_campaigns) - total_spend
    }



@router.get("/campaigns")
async def list_campaigns_compat(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    List campaigns with strict data isolation.
    If admin -> all campaigns. If advertiser -> only own campaigns.
    """
    query = db.query(models.Campaign)
    
    # Role-based filtering
    if current_user.role != models.UserRole.ADMIN:
        query = query.filter(models.Campaign.advertiser_id == current_user.id)
        
    campaigns = query.order_by(models.Campaign.created_at.desc()).limit(50).all()

    
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
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create campaign - compatibility endpoint for frontend.
    Strictly uses the authenticated user as the owner.
    """
    try:
        from ..pricing import PricingEngine
        from datetime import datetime as dt, timedelta
        
        # Parse JSON manually
        try:
            data = await request.json()
        except Exception:
            return JSONResponse(status_code=400, content={"error": "Invalid JSON body"})

        user = current_user

        # Extract meta and provide defaults
        meta = data.get("meta", {})
        if not isinstance(meta, dict):
            meta = {}
            
        # Ensure we have some basic meta values even if data format is flat
        if not meta:
            meta = {
                "coverage": data.get("coverage", "radius"),
                "industry": data.get("ad_format", "retail"),  # Use ad_format as industry fallback for compatibility
                "location": data.get("location", "Standard")
            }
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
            try: return dt.strptime(str(date_str)[:10], "%Y-%m-%d").date()
            except: 
                try: return dt.fromisoformat(str(date_str).replace('Z', '+00:00')).date()
                except: return None

        start_date = parse_date(data.get("startDate")) or dt.now().date()
        end_date = parse_date(data.get("endDate")) or (start_date + timedelta(days=30))
        
        # Calculate pricing with extreme fallback
        calculated_price = float(data.get("budget", 0))
        coverage_area_desc = "Standard Area"
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
            calculated_price = pricing_result.total_price
            coverage_area_desc = pricing_result.breakdown.get('coverage_area_description', coverage_area_desc)
        except Exception as pe:
            logger.error(f"⚠️ Pricing Engine failed, using budget as price: {str(pe)}")

        # Create campaign
        try:
            new_campaign = models.Campaign(
                advertiser_id=user.id,
                name=data.get("name") or "New Campaign",
                industry_type=meta.get("industry") or "retail",
                start_date=start_date,
                end_date=end_date,
                budget=float(data.get("budget", 0)),
                calculated_price=calculated_price,
                status=models.CampaignStatus.DRAFT,
                coverage_type=coverage_type,
                coverage_area=coverage_area_desc,
                target_postcode=meta.get("location") if coverage_val == "radius" else None,
                target_state=meta.get("location") if coverage_val == "state" else None,
                target_country="US" if coverage_val == "national" else None,
                description=data.get("description", ""),
                headline=data.get("headline"),
                landing_page_url=data.get("landing_page_url") or data.get("landingPageUrl"),
                ad_format=data.get("ad_format") or data.get("format")
            )
            
            db.add(new_campaign)
            db.commit()
            db.refresh(new_campaign)
        except Exception as dbe:
            db.rollback()
            logger.error(f"❌ DB Save failed: {str(dbe)}")
            return JSONResponse(status_code=500, content={"error": "Database error", "detail": str(dbe)})
        
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
async def get_notifications(current_user: models.User = Depends(auth.get_current_active_user)):
    """
    Get notifications for the authenticated user.
    """
    return []


@router.post("/notifications/read")
async def mark_notifications_read(current_user: models.User = Depends(auth.get_current_active_user)):
    """
    Mark all notifications as read for current user.
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
    
    # Return user data in frontend format + JWT tokens
    logger.info(f"✅ User synced: {user.email}")
    tokens = auth.create_user_tokens(user)
    
    return {
        "success": True,
        "access_token": tokens.access_token,
        "refresh_token": tokens.refresh_token,
        "token_type": "bearer",
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
