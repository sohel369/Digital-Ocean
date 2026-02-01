"""
Campaign management router.
Handles CRUD operations for advertising campaigns.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..database import get_db
from .. import models, schemas, auth
from ..pricing import PricingEngine, get_pricing_engine
from dateutil.relativedelta import relativedelta

router = APIRouter(prefix="/campaigns", tags=["Campaigns"])


@router.post("", response_model=schemas.CampaignResponse, status_code=status.HTTP_201_CREATED)
@router.post("/create", response_model=schemas.CampaignResponse, status_code=status.HTTP_201_CREATED)
async def create_campaign(
    campaign_data: schemas.CampaignCreate,
    current_user: models.User = Depends(auth.get_current_active_user),
    verified_country: str = Depends(auth.verify_geo_access),
    db: Session = Depends(get_db),
    pricing_engine: PricingEngine = Depends(get_pricing_engine)
):
    """
    Create a new advertising campaign.
    """
    try:
        from .. import models
        from datetime import datetime
        import logging
        logger = logging.getLogger(__name__)

        role = str(current_user.role).lower() if current_user.role else ""
        if role != "admin":
            campaign_data.target_country = verified_country

        # 1. Handle dates logic robustly
        if campaign_data.duration and not campaign_data.end_date:
            campaign_data.end_date = campaign_data.start_date + relativedelta(months=campaign_data.duration)
        elif not campaign_data.end_date:
            campaign_data.end_date = campaign_data.start_date + relativedelta(months=1)

        # Ensure end_date is after start_date
        duration_delta = campaign_data.end_date - campaign_data.start_date
        duration_days = max(duration_delta.days, 1) # Minimum 1 day to avoid 0/negative division
        
        # 2. Calculate pricing with fallback
        try:
            pricing_result = pricing_engine.calculate_price(
                industry_type=campaign_data.industry_type,
                advert_type="display",
                coverage_type=campaign_data.coverage_type,
                duration_days=duration_days,
                target_postcode=campaign_data.target_postcode,
                target_state=campaign_data.target_state,
                target_country=campaign_data.target_country
            )
            coverage_area_desc = pricing_result.breakdown.get('coverage_area_description', 'Specified Coverage Area')
        except Exception as pe:
            logger.error(f"⚠️ Pricing engine error: {pe}")
            coverage_area_desc = f"{campaign_data.coverage_type} coverage"

        # 3. Create campaign object
        target_status = campaign_data.status or models.CampaignStatus.PENDING_REVIEW
        
        # Convert status string to enum if it's coming as string from Pydantic
        if isinstance(target_status, str):
            target_status = models.CampaignStatus(target_status.upper())

        new_campaign = models.Campaign(
            advertiser_id=current_user.id,
            name=campaign_data.name,
            industry_type=campaign_data.industry_type,
            start_date=campaign_data.start_date,
            end_date=campaign_data.end_date,
            budget=campaign_data.budget,
            calculated_price=campaign_data.budget, 
            status=target_status,
            submitted_at=datetime.utcnow() if target_status == models.CampaignStatus.PENDING_REVIEW else None,
            coverage_type=campaign_data.coverage_type,
            coverage_area=coverage_area_desc,
            target_postcode=campaign_data.target_postcode,
            target_state=campaign_data.target_state,
            target_country=campaign_data.target_country,
            description=campaign_data.description,
            headline=campaign_data.headline,
            landing_page_url=campaign_data.landing_page_url,
            ad_format=campaign_data.ad_format,
            tags=campaign_data.tags
        )
        
        db.add(new_campaign)
        db.commit()
        db.refresh(new_campaign)
        
        return new_campaign
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        logger.error(f"🔥 CRITICAL ERROR in create_campaign: {e}\n{error_trace}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Campaign creation failed: {str(e)}"
        )


@router.get("/list", response_model=List[schemas.CampaignResponse])
async def list_campaigns(
    status: Optional[str] = Query(None, description="Filter by status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: models.User = Depends(auth.get_current_active_user),
    verified_country: str = Depends(auth.verify_geo_access),
    db: Session = Depends(get_db)
):
    """
    List all campaigns for the current user.
    
    Admins can see all campaigns, advertisers only see their own
    AND only campaigns within their verified country.
    """
    query = db.query(models.Campaign)
    
    # Role-based & Geo-based filtering
    role = str(current_user.role).lower() if current_user.role else ""
    if role == "admin":
        # Super Admin sees everything
        pass
    elif role == "country_admin":
        # Country Admin sees campaigns in their managed country
        if current_user.managed_country:
            query = query.filter(models.Campaign.target_country == current_user.managed_country)
        else:
            return []
    else:
        # Advertiser only sees their own campaigns in their verified country
        query = query.filter(
            models.Campaign.advertiser_id == current_user.id,
            models.Campaign.target_country == verified_country
        )
    
    # Status filter
    if status:
        try:
            status_enum = models.CampaignStatus(status)
            query = query.filter(models.Campaign.status == status_enum)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status value: {status}"
            )
    
    # Order by created date (newest first)
    query = query.order_by(models.Campaign.created_at.desc())
    
    campaigns = query.offset(skip).limit(limit).all()
    
    return campaigns


@router.get("/{campaign_id}", response_model=schemas.CampaignResponse)
async def get_campaign(
    campaign_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific campaign by ID.
    
    Users can only access their own campaigns unless they're an admin.
    """
    campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
    
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )
    
    # Check ownership/access
    role = str(current_user.role).lower() if current_user.role else ""
    is_admin = role == "admin"
    is_country_admin = role == "country_admin" and campaign.target_country == current_user.managed_country
    is_owner = campaign.advertiser_id == current_user.id

    if not (is_admin or is_country_admin or is_owner):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this campaign"
        )
    
    return campaign


@router.put("/{campaign_id}", response_model=schemas.CampaignResponse)
async def update_campaign(
    campaign_id: int,
    campaign_update: schemas.CampaignUpdate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db),
    pricing_engine: PricingEngine = Depends(get_pricing_engine)
):
    """
    Update a campaign.
    
    Only the campaign owner or an admin can update a campaign.
    Active campaigns may have restrictions on what can be updated.
    """
    campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
    
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )
    
    # Check ownership/access
    role = str(current_user.role).lower() if current_user.role else ""
    is_admin = role == "admin"
    is_country_admin = role == "country_admin" and campaign.target_country == current_user.managed_country
    is_owner = campaign.advertiser_id == current_user.id

    if not (is_admin or is_country_admin or is_owner):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this campaign"
        )
    
    # Restrict updates based on status (Production-ready logic)
    if role != "admin":
        if campaign.status not in [models.CampaignStatus.DRAFT, models.CampaignStatus.CHANGES_REQUIRED, models.CampaignStatus.REJECTED]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Cannot update campaign in '{campaign.status.value}' status. Please contact support or request changes if needed."
            )
    
    # Update fields
    update_data = campaign_update.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(campaign, field, value)
        if field == 'status' and value == models.CampaignStatus.PENDING_REVIEW:
            campaign.submitted_at = datetime.utcnow()
            campaign.admin_message = None
    
    # Handle duration-based end date update
    if hasattr(campaign_update, 'duration') and campaign_update.duration:
        campaign.end_date = campaign.start_date + relativedelta(months=campaign_update.duration)
    
    # Recalculate pricing ONLY for metadata updates (coverage area description), NOT pricing numbers.
    # We now trust the campaign.budget as the source of truth for pricing.
    if any(key in update_data for key in ['industry_type', 'coverage_type', 'start_date', 'end_date', 'target_postcode', 'target_state', 'target_country']) or (hasattr(campaign_update, 'duration') and campaign_update.duration):
        duration_days = (campaign.end_date - campaign.start_date).days
        pricing_result = pricing_engine.calculate_price(
            industry_type=campaign.industry_type,
            advert_type="display",
            coverage_type=campaign.coverage_type,
            duration_days=duration_days,
            target_postcode=campaign.target_postcode,
            target_state=campaign.target_state,
            target_country=campaign.target_country
        )
        # Update descriptive fields only
        campaign.coverage_area = pricing_result.breakdown['coverage_area_description']
        # DO NOT update campaign.calculated_price or campaign.budget automatically
        # The user sets this manually now.
    
    campaign.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(campaign)
    
    return campaign


@router.delete("/{campaign_id}", response_model=schemas.MessageResponse)
async def delete_campaign(
    campaign_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete a campaign.
    
    Only the campaign owner or an admin can delete a campaign.
    Active campaigns cannot be deleted (must be paused first).
    """
    campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
    
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )
    
    # Check ownership/access
    role = str(current_user.role).lower() if current_user.role else ""
    is_admin = role == "admin"
    is_country_admin = role == "country_admin" and campaign.target_country == current_user.managed_country
    is_owner = campaign.advertiser_id == current_user.id

    if not (is_admin or is_country_admin or is_owner):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this campaign"
        )
    
    # Prevent deletion of active campaigns
    if campaign.status == models.CampaignStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete an active campaign. Please pause it first."
        )
    
    db.delete(campaign)
    db.commit()
    
    return schemas.MessageResponse(
        message="Campaign deleted successfully",
        detail=f"Campaign '{campaign.name}' has been deleted"
    )
