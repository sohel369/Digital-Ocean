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

router = APIRouter(prefix="/campaigns", tags=["Campaigns"])


@router.post("/create", response_model=schemas.CampaignResponse, status_code=status.HTTP_201_CREATED)
async def create_campaign(
    campaign_data: schemas.CampaignCreate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db),
    pricing_engine: PricingEngine = Depends(get_pricing_engine)
):
    """
    Create a new advertising campaign.
    
    The pricing will be automatically calculated based on:
    - Industry type
    - Coverage area
    - Campaign duration
    - Geographic location
    """
    # Calculate campaign duration
    duration_days = (campaign_data.end_date - campaign_data.start_date).days
    
    # Calculate pricing
    pricing_result = pricing_engine.calculate_price(
        industry_type=campaign_data.industry_type,
        advert_type="display",  # Default advert type
        coverage_type=campaign_data.coverage_type,
        duration_days=duration_days,
        target_postcode=campaign_data.target_postcode,
        target_state=campaign_data.target_state,
        target_country=campaign_data.target_country
    )
    
    # Create campaign
    new_campaign = models.Campaign(
        advertiser_id=current_user.id,
        name=campaign_data.name,
        industry_type=campaign_data.industry_type,
        start_date=campaign_data.start_date,
        end_date=campaign_data.end_date,
        budget=campaign_data.budget,
        calculated_price=pricing_result.total_price,
        status=models.CampaignStatus.DRAFT,
        coverage_type=campaign_data.coverage_type,
        coverage_area=pricing_result.breakdown['coverage_area_description'],
        target_postcode=campaign_data.target_postcode,
        target_state=campaign_data.target_state,
        target_country=campaign_data.target_country,
        description=campaign_data.description,
        tags=campaign_data.tags
    )
    
    db.add(new_campaign)
    db.commit()
    db.refresh(new_campaign)
    
    return new_campaign


@router.get("/list", response_model=List[schemas.CampaignResponse])
async def list_campaigns(
    status: Optional[str] = Query(None, description="Filter by status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    List all campaigns for the current user.
    
    Admins can see all campaigns, advertisers only see their own.
    
    - **status**: Filter by campaign status (optional)
    - **skip**: Number of records to skip (pagination)
    - **limit**: Maximum number of records to return
    """
    query = db.query(models.Campaign)
    
    # Role-based filtering
    if current_user.role != models.UserRole.ADMIN:
        query = query.filter(models.Campaign.advertiser_id == current_user.id)
    
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
    
    # Check ownership
    if current_user.role != models.UserRole.ADMIN and campaign.advertiser_id != current_user.id:
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
    
    # Check ownership
    if current_user.role != models.UserRole.ADMIN and campaign.advertiser_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this campaign"
        )
    
    # Update fields
    update_data = campaign_update.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(campaign, field, value)
    
    # Recalculate pricing if relevant fields changed
    if any(key in update_data for key in ['industry_type', 'coverage_type', 'start_date', 'end_date', 'target_postcode', 'target_state', 'target_country']):
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
        campaign.calculated_price = pricing_result.total_price
        campaign.coverage_area = pricing_result.breakdown['coverage_area_description']
    
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
    
    # Check ownership
    if current_user.role != models.UserRole.ADMIN and campaign.advertiser_id != current_user.id:
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
