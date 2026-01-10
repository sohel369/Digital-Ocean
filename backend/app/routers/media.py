"""
Media upload and management router.
Handles file uploads, validation, approval workflow.
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from ..database import get_db
from .. import models, schemas, auth
from ..utils.file_upload import file_upload_manager

router = APIRouter(prefix="/media", tags=["Media"])


@router.post("/upload", response_model=schemas.MediaUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_media(
    campaign_id: int,
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Upload media file for a campaign.
    
    Supports images (jpg, png, gif) and videos (mp4, mov, avi).
    Files are validated for size, format, and dimensions.
    
    - **campaign_id**: ID of the campaign to associate the media with
    - **file**: Media file to upload
    """
    # Verify campaign exists and user has access
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
            detail="Not authorized to upload media for this campaign"
        )
    
    # Save file and get metadata
    file_path, metadata = await file_upload_manager.save_file(file, campaign_id)
    
    # Create media record
    new_media = models.Media(
        campaign_id=campaign_id,
        file_path=file_path,
        file_type=metadata.get('file_type', 'unknown'),
        file_size=metadata['file_size'],
        mime_type=metadata.get('mime_type'),
        width=metadata.get('width'),
        height=metadata.get('height'),
        duration=metadata.get('duration'),
        approved_status=models.MediaApprovalStatus.PENDING
    )
    
    db.add(new_media)
    db.commit()
    db.refresh(new_media)
    
    return new_media


@router.get("/campaign/{campaign_id}", response_model=List[schemas.MediaUploadResponse])
async def get_campaign_media(
    campaign_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get all media files for a campaign.
    
    - **campaign_id**: ID of the campaign
    """
    # Verify campaign exists and user has access
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
            detail="Not authorized to view media for this campaign"
        )
    
    media_files = db.query(models.Media).filter(models.Media.campaign_id == campaign_id).all()
    
    return media_files


@router.delete("/{media_id}", response_model=schemas.MessageResponse)
async def delete_media(
    media_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete a media file.
    
    Only the campaign owner or an admin can delete media.
    
    - **media_id**: ID of the media file to delete
    """
    media = db.query(models.Media).filter(models.Media.id == media_id).first()
    
    if not media:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media not found"
        )
    
    # Get campaign to check ownership
    campaign = db.query(models.Campaign).filter(models.Campaign.id == media.campaign_id).first()
    
    # Check ownership
    if current_user.role != models.UserRole.ADMIN and campaign.advertiser_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this media"
        )
    
    # Delete file from storage
    try:
        await file_upload_manager.delete_file(media.file_path)
    except Exception as e:
        # Log error but continue with database deletion
        print(f"Error deleting file: {e}")
    
    # Delete database record
    db.delete(media)
    db.commit()
    
    return schemas.MessageResponse(
        message="Media deleted successfully",
        detail=f"Media file has been removed"
    )


@router.post("/{media_id}/approve", response_model=schemas.MediaUploadResponse)
async def approve_media(
    media_id: int,
    approval: schemas.MediaApproval,
    current_user: models.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Approve or reject a media file (Admin only).
    
    - **media_id**: ID of the media file
    - **approved**: True to approve, False to reject
    - **rejection_reason**: Reason for rejection (required if rejected)
    """
    media = db.query(models.Media).filter(models.Media.id == media_id).first()
    
    if not media:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media not found"
        )
    
    if approval.approved:
        media.approved_status = models.MediaApprovalStatus.APPROVED
        media.rejection_reason = None
    else:
        if not approval.rejection_reason:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Rejection reason is required when rejecting media"
            )
        media.approved_status = models.MediaApprovalStatus.REJECTED
        media.rejection_reason = approval.rejection_reason
    
    media.approved_by = current_user.id
    media.approved_at = datetime.utcnow()
    
    db.commit()
    db.refresh(media)
    
    return media


@router.get("/pending", response_model=List[schemas.MediaUploadResponse])
async def get_pending_media(
    current_user: models.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get all media files pending approval (Admin only).
    """
    pending_media = db.query(models.Media).filter(
        models.Media.approved_status == models.MediaApprovalStatus.PENDING
    ).order_by(models.Media.uploaded_at.desc()).all()
    
    return pending_media
