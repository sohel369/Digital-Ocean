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
    from ..pricing import PricingEngine
    
    data = await request.json()
    
    # Get the most recent user (fallback since frontend uses Firebase auth)
    user = db.query(models.User).order_by(models.User.last_login.desc()).first()
    if not user:
        return JSONResponse(
            status_code=401,
            content={"error": "No user found. Please log in first."}
        )
    
    # Map frontend fields to backend schema
    coverage_map = {
        "radius": models.CoverageType.RADIUS_30,
        "state": models.CoverageType.STATE,
        "national": models.CoverageType.COUNTRY
    }
    
    coverage_type = coverage_map.get(data.get("meta", {}).get("coverage", "radius"))
    
    # Extract dates
    start_date = data.get("startDate")
    end_date = data.get("endDate", start_date)  # Default to same as start if not provided
    
    if not start_date:
        from datetime import datetime, timedelta
        start_date = datetime.now().date()
        end_date = start_date + timedelta(days=30)
    
    # Calculate pricing
    from datetime import datetime as dt
    if isinstance(start_date, str):
        start_date = dt.fromisoformat(start_date).date()
    if isinstance(end_date, str):
        end_date = dt.fromisoformat(end_date).date()
    
    duration_days = (end_date - start_date).days
    if duration_days <= 0:
        duration_days = 30  # Default
    
    pricing_engine = PricingEngine(db)
    pricing_result = pricing_engine.calculate_price(
        industry_type=data.get("meta", {}).get("industry", "retail"),
        advert_type="display",
        coverage_type=coverage_type,
        duration_days=duration_days,
        target_postcode=data.get("meta", {}).get("location") if data.get("meta", {}).get("coverage") == "radius" else None,
        target_state=data.get("meta", {}).get("location") if data.get("meta", {}).get("coverage") == "state" else None,
        target_country="US" if data.get("meta", {}).get("coverage") == "national" else None
    )
    
    # Create campaign
    new_campaign = models.Campaign(
        advertiser_id=user.id,
        name=data.get("name", "Untitled Campaign"),
        industry_type=data.get("meta", {}).get("industry", "retail"),
        start_date=start_date,
        end_date=end_date,
        budget=float(data.get("budget", 0)),
        calculated_price=pricing_result.total_price,
        status=models.CampaignStatus.DRAFT if data.get("status") == "review" else models.CampaignStatus.DRAFT,
        coverage_type=coverage_type,
        coverage_area=pricing_result.breakdown['coverage_area_description'],
        target_postcode=data.get("meta", {}).get("location") if data.get("meta", {}).get("coverage") == "radius" else None,
        target_state=data.get("meta", {}).get("location") if data.get("meta", {}).get("coverage") == "state" else None,
        target_country="US" if data.get("meta", {}).get("coverage") == "national" else None,
        description=data.get("description", "")
    )
    
    db.add(new_campaign)
    db.commit()
    db.refresh(new_campaign)
    
    # Return in frontend format
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
    return {
        "success": True,
        "user": {
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
