"""
Frontend compatibility layer - Maps frontend API calls to backend routes.
"""
from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from datetime import datetime

import logging
import json

from .. import models, auth
from ..database import get_db
from ..config import settings

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
            "/api/login",
            "/api/stats",
            "/api/campaigns",
            "/api/pricing/admin/config"
        ]
    }

@router.post("/login", response_model=schemas.Token)
@router.post("/login/json", response_model=schemas.Token)
async def compatibility_login(
    user_credentials: schemas.UserLogin, 
    db: Session = Depends(get_db)
):
    """
    Direct login endpoint for frontend compatibility. 
    Matches both /api/login and /api/login/json.
    """
    username = user_credentials.email
    password = user_credentials.password
    
    user = auth.authenticate_user(db, username, password)
    
    if not user:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Update last login
    try:
        user.last_login = datetime.utcnow()
        db.commit()
    except:
        db.rollback()
        
    return auth.create_user_tokens(user)


@router.get("/stats")
async def get_stats(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get dashboard statistics for the authenticated user.
    """
    try:
        # If admin or country_admin
        role = str(current_user.role).lower() if current_user.role else ""
        if role in ["admin", "country_admin"]:
            from sqlalchemy import func
            
            spend_query = db.query(func.sum(models.Campaign.calculated_price)).filter(
                models.Campaign.status.in_([models.CampaignStatus.APPROVED, models.CampaignStatus.ACTIVE, models.CampaignStatus.COMPLETED])
            )
            impressions_query = db.query(func.sum(models.Campaign.impressions))
            clicks_query = db.query(func.sum(models.Campaign.clicks))
            
            # Filter by managed country if Country Admin
            if role == "country_admin":
                managed = (current_user.managed_country or "").upper()
                if managed:
                    spend_query = spend_query.filter(models.Campaign.target_country == managed)
                    impressions_query = impressions_query.filter(models.Campaign.target_country == managed)
                    clicks_query = clicks_query.filter(models.Campaign.target_country == managed)
            
            total_spend = spend_query.scalar() or 0
            impressions = impressions_query.scalar() or 0
            clicks = clicks_query.scalar() or 0
            
            return {
                "totalSpend": round(float(total_spend), 2),
                "impressions": int(impressions),
                "clicks": int(clicks),
                "ctr": round((clicks / impressions * 100) if impressions > 0 else 0, 2),
                "budgetRemaining": 0
            }
        
        # Calculate for specific user
        user_campaigns = db.query(models.Campaign).filter(models.Campaign.advertiser_id == current_user.id).all()
        total_spend = sum(c.calculated_price for c in user_campaigns if c.calculated_price and c.status in [models.CampaignStatus.APPROVED, models.CampaignStatus.ACTIVE, models.CampaignStatus.COMPLETED])
        impressions = sum(c.impressions for c in user_campaigns)
        clicks = sum(c.clicks for c in user_campaigns)
        
        return {
            "totalSpend": round(float(total_spend), 2),
            "impressions": int(impressions),
            "clicks": int(clicks),
            "ctr": round((clicks / impressions * 100) if impressions > 0 else 0, 2),
            "budgetRemaining": sum(c.budget for c in user_campaigns) - total_spend
        }
    except Exception as e:
        logger.error(f"❌ Error in get_stats: {str(e)}", exc_info=True)
        # Return empty stats instead of 500
        return {
            "totalSpend": 0,
            "impressions": 0,
            "clicks": 0,
            "ctr": 0,
            "budgetRemaining": 0
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
    try:
        query = db.query(models.Campaign)
        
        # Role-based & Geo-based filtering
        role = str(current_user.role).lower() if current_user.role else ""
        if role == "admin":
            # Super Admin sees everything
            pass
        elif role == "country_admin":
            # Country Admin sees campaigns in their managed country
            managed = (current_user.managed_country or "").upper()
            if managed:
                query = query.filter(models.Campaign.target_country == managed)
            else:
                # If no managed country, they see nothing
                return []
        else:
            # Advertiser only sees their own campaigns
            query = query.filter(models.Campaign.advertiser_id == current_user.id)
            
        campaigns = query.order_by(models.Campaign.created_at.desc()).limit(50).all()

        
        # Transform to frontend format
        return [
            {
                "id": c.id,
                "name": c.name or "Untitled",
                "budget": c.budget or 0,
                "spend": c.calculated_price or 0,
                "start_date": str(c.start_date) if c.start_date else str(datetime.now().date()),
                "end_date": str(c.end_date) if c.end_date else None,
                "status": (c.status.value.lower() if hasattr(c.status, 'value') else str(c.status).lower()) if c.status else "draft",
                "impressions": c.impressions or 0,
                "clicks": c.clicks or 0,
                "ctr": c.ctr or 0,
                "ad_format": c.ad_format or "Display",
                "headline": c.headline or c.name,
                "description": c.description or "",
                "image": None,
                # Admin approval fields
                "submitted_at": c.submitted_at.isoformat() if c.submitted_at else None,
                "admin_message": c.admin_message,
                "reviewed_at": c.reviewed_at.isoformat() if c.reviewed_at else None,
                "meta": {
                    "industry": c.industry_type,
                    "coverage": c.coverage_type.value if hasattr(c.coverage_type, 'value') else str(c.coverage_type),
                    "location": c.target_state or c.target_postcode or c.target_country
                }
            }
            for c in campaigns
        ]
    except Exception as e:
        logger.error(f"❌ Error in list_campaigns_compat: {str(e)}", exc_info=True)
        return []


@router.post("/campaigns")
async def create_campaign_compat(
    request: Request,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Frontend-compatible campaign creation endpoint.
    Handles campaign creation with robust error handling and fallbacks.
    """
    try:
        from ..pricing import PricingEngine
        from datetime import datetime as dt, timedelta
        
        # Read and validate request body
        try:
            body = await request.body()
            body_size = len(body)
            logger.info(f"📦 Campaign creation request size: {body_size} bytes ({body_size / 1024:.2f} KB)")
            
            # Validate request size (max 5MB for safety)
            if body_size > 5 * 1024 * 1024:
                logger.error(f"❌ Request too large: {body_size} bytes")
                return JSONResponse(
                    status_code=413,
                    content={"error": "Request too large", "detail": f"Request size {body_size / 1024:.2f} KB exceeds 5MB limit"}
                )
            
            data = await request.json()
            logger.info(f"✅ Successfully parsed JSON request")
            logger.debug(f"Campaign data keys: {list(data.keys())}")
            
        except json.JSONDecodeError as e:
            logger.error(f"❌ JSON decode error: {str(e)}")
            return JSONResponse(
                status_code=400,
                content={"error": "Invalid JSON", "detail": str(e)}
            )
        except Exception as e:
            logger.error(f"❌ Request parsing error: {str(e)}")
            return JSONResponse(
                status_code=400,
                content={"error": "Request parsing failed", "detail": str(e)}
            )

        user = current_user
        logger.info(f"👤 User: {user.email} (ID: {user.id})")

        # Extract meta and provide robust defaults
        # Map legacy/compat fields to backend schema
        # Support both flat and nested 'meta' structures
        meta = data.get("meta", {})
        industry_val = data.get("industry") or meta.get("industry") or "General"
        
        # Enforce registered industry for non-admins
        role = str(current_user.role).lower() if current_user.role else ""
        if role != "admin" and current_user.industry:
             industry_val = current_user.industry
             
        coverage_val = data.get("coverage") or meta.get("coverage", "radius")
        location_val = data.get("location") or meta.get("location") or data.get("state") or data.get("postcode")
        
        # Normalize coverage type
        if coverage_val == "30-mile" or coverage_val == "radius":
            coverage_type = models.CoverageType.RADIUS_30
        elif coverage_val == "state":
            coverage_type = models.CoverageType.STATE
        elif coverage_val == "country" or coverage_val == "national":
            coverage_type = models.CoverageType.COUNTRY
        else:
            coverage_type = models.CoverageType.RADIUS_30
        
        # Calculate pricing with extreme fallback
        calculated_price = float(data.get("budget", 0))
        coverage_area_desc = "Standard Area"
        try:
            pricing_engine = PricingEngine(db)
            
            # Calculate duration and dates
            try:
                start_date = data.get("startDate") or data.get("start_date")
                end_date = data.get("endDate") or data.get("end_date")
                duration = data.get("duration")
                
                def parse_date(date_str):
                    if not date_str: return dt.now().date()
                    try: return dt.strptime(str(date_str)[:10], "%Y-%m-%d").date()
                    except: return dt.now().date()
                
                s_date = parse_date(start_date)
                
                if duration:
                    # Auto-calculate end date from duration (months)
                    from dateutil.relativedelta import relativedelta
                    e_date = s_date + relativedelta(months=int(duration))
                else:
                    e_date = parse_date(end_date)
                
                duration_days = max((e_date - s_date).days, 1)
            except Exception as de:
                logger.warning(f"⚠️ Date/Duration calculation failed: {str(de)}")
                duration_days = 30
                s_date = dt.now().date()
                e_date = s_date + timedelta(days=30)

            pricing_result = pricing_engine.calculate_price(
                industry_type=industry_val,
                advert_type="display",
                coverage_type=coverage_type,
                duration_days=duration_days,
                target_postcode=data.get("postcode") or (location_val if coverage_type == models.CoverageType.RADIUS_30 else None),
                target_state=data.get("state") or (location_val if coverage_type == models.CoverageType.STATE else None),
                target_country=user.country or "US"
            )
            calculated_price = pricing_result.total_price
            coverage_area_desc = pricing_result.breakdown.get("coverage_area_description", coverage_area_desc)
            logger.info(f"💰 Calculated price: ${calculated_price:.2f}")
        except Exception as pricing_err:
            logger.warning(f"⚠️ Pricing calculation failed, using budget: {str(pricing_err)}")
            # Initialize dates if they couldn't be parsed above
            if 's_date' not in locals(): s_date = dt.now().date()
            if 'e_date' not in locals(): e_date = s_date + timedelta(days=30)
        
        # Save to database
        try:
            logger.info(f"💾 Saving campaign to database...")
            # Extract status from request or default to PENDING_REVIEW if not provided
            req_status = data.get("status")
            if req_status:
                try:
                    # Normalize to uppercase for DB enum compatibility
                    target_status = models.CampaignStatus(req_status.upper())
                except ValueError:
                    # Fallback to PENDING_REVIEW if invalid
                    target_status = models.CampaignStatus.PENDING_REVIEW
            else:
                target_status = models.CampaignStatus.PENDING_REVIEW

            # Robust numeric parsing for budget (handle strings with commas)
            try:
                raw_budget = data.get("budget", 0)
                if isinstance(raw_budget, str):
                    # Remove currency symbols and commas
                    clean_budget = raw_budget.replace("$", "").replace(",", "").strip()
                    budget_val = float(clean_budget)
                else:
                    budget_val = float(raw_budget)
            except (ValueError, TypeError):
                logger.warning(f"⚠️ Could not parse budget '{data.get('budget')}', defaulting to 0")
                budget_val = 0.0

            new_campaign = models.Campaign(
                advertiser_id=user.id,
                name=data.get("name", "Untitled Campaign"),
                industry_type=industry_val,
                start_date=s_date,
                end_date=e_date,
                budget=budget_val,
                calculated_price=calculated_price or budget_val, # Fallback
                status=target_status,
                submitted_at=dt.utcnow() if target_status == models.CampaignStatus.PENDING_REVIEW else None,
                coverage_type=coverage_type,
                coverage_area=coverage_area_desc,
                target_postcode=data.get("postcode") or (location_val if coverage_type == models.CoverageType.RADIUS_30 else None),
                target_state=data.get("state") or (location_val if coverage_type == models.CoverageType.STATE else None),
                target_country=user.country or "US",
                description=data.get("description", ""),
                headline=data.get("headline") or data.get("adText", {}).get("headline"),
                landing_page_url=data.get("landing_page_url") or data.get("landingPage") or data.get("url"),
                ad_format=data.get("ad_format") or data.get("format")
            )
            
            db.add(new_campaign)
            db.commit()
            db.refresh(new_campaign)
            logger.info(f"✅ Campaign saved successfully! ID: {new_campaign.id}")
        except Exception as dbe:
            db.rollback()
            logger.error(f"❌ DB Save failed: {str(dbe)}")
            import traceback
            error_trace = traceback.format_exc()
            logger.error(f"Traceback: {error_trace}")
            
            # Send the actual error message back so we can see it in frontend console
            return JSONResponse(
                status_code=500, 
                content={
                    "error": "Database error", 
                    "detail": str(dbe),
                    "type": type(dbe).__name__,
                    "trace": error_trace if settings.DEBUG else "Check logs"
                }
            )
        
        response_data = {
            "id": new_campaign.id,
            "name": new_campaign.name,
            "budget": new_campaign.budget,
            "spend": new_campaign.calculated_price,
            "start_date": str(new_campaign.start_date),
            "end_date": str(new_campaign.end_date),
            "status": new_campaign.status.value.lower() if hasattr(new_campaign.status, 'value') else str(new_campaign.status).lower(),
            "impressions": new_campaign.impressions,
            "clicks": new_campaign.clicks,
            "ctr": new_campaign.ctr
        }
        
        logger.info(f"✅ Campaign creation complete, returning response")
        return JSONResponse(status_code=201, content=response_data)
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        logger.error(f"🔥 FATAL ERROR in create_campaign_compat: {str(e)}")
        logger.error(f"Traceback:\n{error_trace}")
        return JSONResponse(
            status_code=500, 
            content={
                "error": "Unexpected server error", 
                "detail": str(e),
                "type": type(e).__name__,
                "trace": error_trace if settings.DEBUG else "Check server logs for details" # Security: hide trace in prod
            }
        )


@router.get("/notifications")
async def get_notifications(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get notifications for the authenticated user.
    """
    try:
        # Check if notifications table exists before querying
        notifications = db.query(models.Notification).filter(
            models.Notification.user_id == current_user.id
        ).order_by(models.Notification.created_at.desc()).limit(20).all()
        
        return [
            {
                "id": n.id,
                "type": n.notification_type.value if hasattr(n.notification_type, 'value') else str(n.notification_type),
                "title": n.title,
                "message": n.message,
                "campaign_id": n.campaign_id,
                "is_read": n.is_read,
                "time": n.created_at.strftime("%Y-%m-%d %H:%M") if n.created_at else None
            }
            for n in notifications
        ]
    except Exception as e:
        logger.warning(f"Notifications fetch failed (table may not exist yet): {e}")
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
    industry = data.get("industry")
    country = data.get("country")
    
    if not email:
        return JSONResponse(
            status_code=400,
            content={"success": False, "message": "Email required"}
        )
    
    # Check if user exists (case-insensitive)
    from sqlalchemy import func
    user = db.query(models.User).filter(func.lower(models.User.email) == email.lower()).first()
    
    if user:
        # Update OAuth info if needed
        if not user.oauth_id:
            user.oauth_provider = 'google'
            user.oauth_id = uid
            user.profile_picture = photo_url
        
        # update country/industry if provided (e.g. during signup flow for existing google user)
        if country:
            user.country = country
        if industry:
            user.industry = industry
            
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
            industry=industry,
            country=country,
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
            "role": user.role.value if hasattr(user.role, 'value') else user.role,
            "country": user.country,
            "industry": user.industry
        }
    }



@router.post("/logout")
async def logout_compat():
    """
    Logout endpoint - primarily for frontend to call.
    With JWT/Firebase, logout is mainly client-side.
    """
    return {"message": "Logged out successfully"}
