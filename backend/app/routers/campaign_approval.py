"""
Admin Campaign Approval Router.
Handles campaign submission, approval, rejection, and change requests.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from ..database import get_db
from .. import models, schemas, auth

import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/campaigns/approval", tags=["Campaign Approval"])


def require_admin(current_user: models.User = Depends(auth.get_current_active_user)):
    """Dependency to ensure only admin users can access."""
    role = str(current_user.role).lower() if current_user.role else ""
    if role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


def create_notification(
    db: Session,
    user_id: int,
    campaign_id: int,
    notification_type: models.NotificationType,
    title: str,
    message: str
):
    """Helper to create notifications for campaign status changes."""
    notification = models.Notification(
        user_id=user_id,
        campaign_id=campaign_id,
        notification_type=notification_type,
        title=title,
        message=message
    )
    db.add(notification)
    return notification


@router.post("/submit", response_model=schemas.CampaignApprovalResponse)
async def submit_campaign_for_review(
    request: schemas.CampaignSubmitRequest,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Submit a campaign for admin review.
    Changes status from 'draft' to 'pending_review'.
    """
    campaign = db.query(models.Campaign).filter(
        models.Campaign.id == request.campaign_id
    ).first()
    
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )
    
    # Verify ownership (unless admin)
    if current_user.role != models.UserRole.ADMIN:
        if campaign.advertiser_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to submit this campaign"
            )
    
    # Check current status allows submission
    if campaign.status not in [models.CampaignStatus.DRAFT, models.CampaignStatus.CHANGES_REQUIRED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Campaign cannot be submitted from status '{campaign.status.value}'. Only draft or changes_required campaigns can be submitted."
        )
    
    # Update campaign status
    campaign.status = models.CampaignStatus.PENDING_REVIEW
    campaign.submitted_at = datetime.utcnow()
    campaign.admin_message = None  # Clear previous admin message
    
    db.commit()
    db.refresh(campaign)
    
    logger.info(f"📨 Campaign '{campaign.name}' (ID: {campaign.id}) submitted for review by user {current_user.id}")
    
    return schemas.CampaignApprovalResponse(
        campaign_id=campaign.id,
        status=schemas.CampaignStatus.PENDING_REVIEW,
        message="Campaign submitted successfully. It is now in the review queue."
    )


@router.get("/pending", response_model=List[schemas.PendingCampaignResponse])
async def list_pending_campaigns(
    admin_user: models.User = Depends(auth.get_any_admin_user),
    db: Session = Depends(get_db)
):
    """
    List all campaigns pending admin review.
    Filtered by managed_country if user is a COUNTRY_ADMIN.
    """
    query = db.query(models.Campaign).filter(
        models.Campaign.status.in_([
            models.CampaignStatus.PENDING_REVIEW, 
            models.CampaignStatus.PENDING
        ])
    )
    
    # PERMISSION CHECK: Country Admins only see campaigns for their country
    if admin_user.role == models.UserRole.COUNTRY_ADMIN:
        managed = (admin_user.managed_country or "").upper()
        if managed:
            query = query.filter(models.Campaign.target_country == managed)

    pending_campaigns = query.order_by(models.Campaign.submitted_at.asc()).all()
    
    result = []
    for c in pending_campaigns:
        try:
            # Get advertiser info
            advertiser = db.query(models.User).filter(models.User.id == c.advertiser_id).first()
            
            # Safely get enum values as strings
            status_val = c.status.value if hasattr(c.status, 'value') else str(c.status)
            coverage_val = c.coverage_type.value if hasattr(c.coverage_type, 'value') else str(c.coverage_type)
            
            result.append(schemas.PendingCampaignResponse(
                id=c.id,
                name=c.name or "Untitled Campaign",
                advertiser_id=c.advertiser_id,
                advertiser_name=advertiser.name if advertiser else "Unknown Advertiser",
                advertiser_email=advertiser.email if advertiser else "unknown@email.com",
                industry_type=c.industry_type or "General",
                ad_format=c.ad_format or "Display",
                coverage_type=coverage_val,
                coverage_area=c.coverage_area or "Not Specified",
                target_country=c.target_country or "US",
                calculated_price=c.calculated_price or 0.0,
                submitted_at=c.submitted_at,
                status=status_val.lower()
            ))
        except Exception as item_err:
            logger.error(f"❌ Error processing pending campaign {c.id}: {item_err}")
            continue
    
    logger.info(f"📋 Admin {admin_user.email} (Role: {admin_user.role}) fetched {len(result)} pending campaigns")
    return result


@router.post("/{campaign_id}/action", response_model=schemas.CampaignApprovalResponse)
async def take_approval_action(
    campaign_id: int,
    action_request: schemas.CampaignApprovalAction,
    admin_user: models.User = Depends(auth.get_any_admin_user),
    db: Session = Depends(get_db)
):
    """
    Admin action on a campaign: approve, reject, or request changes.
    Restricted by managed_country for COUNTRY_ADMIN.
    """
    campaign = db.query(models.Campaign).filter(
        models.Campaign.id == campaign_id
    ).first()
    
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )
    
    # PERMISSION CHECK: Country Admin cannot manage other country campaigns
    if admin_user.role == models.UserRole.COUNTRY_ADMIN:
        managed = (admin_user.managed_country or "").upper()
        if campaign.target_country != managed:
            logger.warning(f"🚫 UNAUTHORIZED ACCESS: {admin_user.email} tried to manage {campaign.target_country} campaign {campaign.id}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Denied: You are only authorized to manage campaigns for {managed}."
            )
    
    if campaign.status not in [models.CampaignStatus.PENDING_REVIEW, models.CampaignStatus.PENDING]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Campaign is not pending review (current status: {campaign.status.value})"
        )
    
    action = action_request.action.lower()
    
    if action == "approve":
        campaign.status = models.CampaignStatus.APPROVED
        campaign.admin_message = action_request.message or "Your campaign has been approved."
        campaign.reviewed_by = admin_user.id
        campaign.reviewed_at = datetime.utcnow()
        
        # Create notification for advertiser
        create_notification(
            db=db,
            user_id=campaign.advertiser_id,
            campaign_id=campaign.id,
            notification_type=models.NotificationType.CAMPAIGN_APPROVED,
            title="Campaign Approved",
            message=f"Your campaign '{campaign.name}' has been approved and is now active."
        )
        
        response_message = "Campaign approved and activated successfully"
        logger.info(f"✅ Campaign '{campaign.name}' (ID: {campaign.id}) APPROVED and ACTIVATED by admin {admin_user.email}")
        
    elif action == "reject":
        if not action_request.message:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Rejection reason is required"
            )
        
        campaign.status = models.CampaignStatus.REJECTED
        campaign.admin_message = action_request.message
        campaign.reviewed_by = admin_user.id
        campaign.reviewed_at = datetime.utcnow()
        
        # Create notification for advertiser
        create_notification(
            db=db,
            user_id=campaign.advertiser_id,
            campaign_id=campaign.id,
            notification_type=models.NotificationType.CAMPAIGN_REJECTED,
            title="Campaign Rejected",
            message=f"Your campaign '{campaign.name}' has been rejected. Reason: {action_request.message}"
        )
        
        response_message = "Campaign rejected"
        logger.info(f"❌ Campaign '{campaign.name}' (ID: {campaign.id}) REJECTED by admin {admin_user.email}")
        
    elif action == "request_changes":
        if not action_request.message:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Change request message is required"
            )
        
        campaign.status = models.CampaignStatus.CHANGES_REQUIRED
        campaign.admin_message = action_request.message
        campaign.reviewed_by = admin_user.id
        campaign.reviewed_at = datetime.utcnow()
        
        # Create notification for advertiser
        create_notification(
            db=db,
            user_id=campaign.advertiser_id,
            campaign_id=campaign.id,
            notification_type=models.NotificationType.CHANGES_REQUIRED,
            title="Changes Required",
            message=f"Your campaign '{campaign.name}' requires changes. Details: {action_request.message}"
        )
        
        response_message = "Changes requested from advertiser"
        logger.info(f"📝 Campaign '{campaign.name}' (ID: {campaign.id}) - CHANGES REQUIRED by admin {admin_user.email}")
        
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid action '{action}'. Valid actions: approve, reject, request_changes"
        )
    
    db.commit()
    db.refresh(campaign)
    
    return schemas.CampaignApprovalResponse(
        campaign_id=campaign.id,
        status=campaign.status,
        message=response_message,
        admin_message=campaign.admin_message
    )


@router.get("/notifications", response_model=List[schemas.NotificationResponse])
async def get_user_notifications(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get all notifications for the current user.
    """
    notifications = db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id
    ).order_by(models.Notification.created_at.desc()).limit(50).all()
    
    return [
        schemas.NotificationResponse(
            id=n.id,
            notification_type=n.notification_type,
            title=n.title,
            message=n.message,
            campaign_id=n.campaign_id,
            is_read=n.is_read,
            created_at=n.created_at
        )
        for n in notifications
    ]


@router.post("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Mark a specific notification as read."""
    notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    notification.is_read = True
    notification.read_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Notification marked as read"}


@router.post("/notifications/read-all")
async def mark_all_notifications_read(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read for the current user."""
    db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.is_read == False
    ).update({
        "is_read": True,
        "read_at": datetime.utcnow()
    })
    db.commit()
    
    return {"message": "All notifications marked as read"}
