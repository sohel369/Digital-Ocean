"""
Analytics router for campaign performance metrics.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/campaign/{campaign_id}", response_model=schemas.CampaignAnalytics)
async def get_campaign_analytics(
    campaign_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get analytics for a specific campaign.
    
    Returns:
    - Impressions
    - Clicks
    - CTR (Click-Through Rate)
    - Budget vs Spent
    - Campaign dates and status
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
            detail="Not authorized to view analytics for this campaign"
        )
    
    # Calculate spent (in a real system, this would come from payment/impression tracking)
    # For now, we'll use a placeholder calculation
    spent = campaign.calculated_price or 0.0 if campaign.status in [models.CampaignStatus.APPROVED, models.CampaignStatus.ACTIVE, models.CampaignStatus.COMPLETED] else 0.0
    
    analytics = schemas.CampaignAnalytics(
        campaign_id=campaign.id,
        campaign_name=campaign.name,
        impressions=campaign.impressions,
        clicks=campaign.clicks,
        ctr=campaign.ctr,
        budget=campaign.budget,
        spent=spent,
        remaining_budget=max(campaign.budget - spent, 0),
        start_date=campaign.start_date,
        end_date=campaign.end_date,
        status=campaign.status
    )
    
    return analytics


@router.get("/user/summary", response_model=dict)
async def get_user_analytics_summary(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get analytics summary for the current user.
    
    Returns aggregated metrics across all user campaigns.
    """
    # Get all user campaigns
    campaigns = db.query(models.Campaign).filter(
        models.Campaign.advertiser_id == current_user.id
    ).all()
    
    if not campaigns:
        return {
            "total_campaigns": 0,
            "active_campaigns": 0,
            "total_impressions": 0,
            "total_clicks": 0,
            "average_ctr": 0.0,
            "total_spent": 0.0,
            "total_budget": 0.0
        }
    
    # Aggregate metrics
    total_impressions = sum(c.impressions for c in campaigns)
    total_clicks = sum(c.clicks for c in campaigns)
    average_ctr = (total_clicks / total_impressions * 100) if total_impressions > 0 else 0.0
    
    active_campaigns = sum(1 for c in campaigns if c.status in [models.CampaignStatus.APPROVED, models.CampaignStatus.ACTIVE])
    
    total_spent = sum(
        c.calculated_price or 0 
        for c in campaigns 
        if c.status in [models.CampaignStatus.APPROVED, models.CampaignStatus.ACTIVE, models.CampaignStatus.COMPLETED]
    )
    total_budget = sum(c.budget for c in campaigns)
    
    return {
        "total_campaigns": len(campaigns),
        "active_campaigns": active_campaigns,
        "total_impressions": total_impressions,
        "total_clicks": total_clicks,
        "average_ctr": round(average_ctr, 2),
        "total_spent": round(total_spent, 2),
        "total_budget": round(total_budget, 2)
    }


@router.post("/campaign/{campaign_id}/record", response_model=schemas.MessageResponse)
async def record_campaign_event(
    campaign_id: int,
    event_type: str,  # 'impression' or 'click'
    count: int = 1,
    current_user: models.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Record analytics events for a campaign (Admin/System only).
    
    This endpoint would typically be called by your ad serving system.
    
    - **event_type**: 'impression' or 'click'
    - **count**: Number of events to record (default: 1)
    """
    campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
    
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )
    
    if event_type.lower() == 'impression':
        campaign.impressions += count
    elif event_type.lower() == 'click':
        campaign.clicks += count
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid event_type. Must be 'impression' or 'click'"
        )
    
    db.commit()
    
    return schemas.MessageResponse(
        message=f"Recorded {count} {event_type}(s) for campaign {campaign.name}"
    )
