"""
Admin router for user, campaign, and system management.
Provides comprehensive administrative controls.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/admin", tags=["Admin"])


# ==================== User Management ====================

@router.get("/users", response_model=List[schemas.UserResponse])
async def get_all_users(
    role: Optional[str] = Query(None, description="Filter by user role"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: models.User = Depends(auth.get_any_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get all users (Admin/Country Admin).
    
    - **role**: Filter by role ('advertiser' or 'admin')
    - **skip**: Pagination offset
    - **limit**: Maximum number of results
    """
    query = db.query(models.User)
    
    # If Country Admin, only show users from their managed country
    if current_user.role == models.UserRole.COUNTRY_ADMIN:
        if current_user.managed_country:
            query = query.filter(models.User.country == current_user.managed_country)
        else:
            # If they don't have a managed country assigned, they see no one
            return []

    if role:
        try:
            role_enum = models.UserRole(role)
            query = query.filter(models.User.role == role_enum)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role: {role}"
            )
    
    users = query.order_by(models.User.created_at.desc()).offset(skip).limit(limit).all()
    
    return users


@router.get("/users/count")
async def get_user_count(
    role: Optional[str] = Query(None, description="Filter by user role"),
    current_user: models.User = Depends(auth.get_any_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get the total count of users (Admin/Country Admin).
    """
    query = db.query(func.count(models.User.id))
    
    # If Country Admin, only count users from their managed country
    if current_user.role == models.UserRole.COUNTRY_ADMIN:
        if current_user.managed_country:
            query = query.filter(models.User.country == current_user.managed_country)
        else:
            return {"count": 0}

    if role:
        try:
            role_enum = models.UserRole(role)
            query = query.filter(models.User.role == role_enum)
        except ValueError:
            pass
            
    count = query.scalar()
    return {"count": count}


@router.get("/users/{user_id}", response_model=schemas.UserResponse)
async def get_user_by_id(
    user_id: int,
    current_user: models.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific user by ID (Admin only).
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.put("/users/{user_id}", response_model=schemas.UserResponse)
async def update_user(
    user_id: int,
    user_update: schemas.AdminUserUpdate,
    current_user: models.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Update a user's information (Admin only).
    
    Can change name, role, and country.
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent admin from demoting themselves
    if user.id == current_user.id and user_update.role and user_update.role != models.UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change your own admin role"
        )
    
    # Update fields
    update_data = user_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        # Ensure role is always persisted as its lowercase value
        if field == 'role' and value:
            role_val = value.value if hasattr(value, 'value') else str(value).lower()
            setattr(user, field, role_val)
        else:
            setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    
    return user


@router.delete("/users/{user_id}", response_model=schemas.MessageResponse)
async def delete_user(
    user_id: int,
    current_user: models.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Delete a user (Admin only).
    
    This will also delete all associated campaigns and media.
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent admin from deleting themselves
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    db.delete(user)
    db.commit()
    
    return schemas.MessageResponse(
        message="User deleted successfully",
        detail=f"User {user.email} and all associated data have been deleted"
    )


# ==================== Campaign Management ====================

@router.get("/campaigns", response_model=List[schemas.CampaignResponse])
async def get_all_campaigns(
    status: Optional[str] = Query(None),
    advertiser_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: models.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get all campaigns (Admin only).
    
    - **status**: Filter by campaign status
    - **advertiser_id**: Filter by advertiser
    - **skip**: Pagination offset
    - **limit**: Maximum number of results
    """
    query = db.query(models.Campaign)
    
    if status:
        try:
            status_enum = models.CampaignStatus(status)
            query = query.filter(models.Campaign.status == status_enum)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status: {status}"
            )
    
    if advertiser_id:
        query = query.filter(models.Campaign.advertiser_id == advertiser_id)
    
    campaigns = query.order_by(models.Campaign.created_at.desc()).offset(skip).limit(limit).all()
    
    return campaigns


@router.put("/campaigns/{campaign_id}/status", response_model=schemas.CampaignResponse)
async def update_campaign_status(
    campaign_id: int,
    new_status: str,
    current_user: models.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Update campaign status (Admin only).
    
    Allows direct status changes (e.g., approve/reject campaigns).
    """
    campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
    
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )
    
    try:
        status_enum = models.CampaignStatus(new_status)
        campaign.status = status_enum
        db.commit()
        db.refresh(campaign)
        return campaign
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status: {new_status}"
        )


# ==================== Geographic Data Management ====================

@router.get("/geodata", response_model=List[schemas.GeoDataResponse])
async def get_all_geodata(
    country_code: Optional[str] = Query(None),
    current_user: models.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get all geographic data entries (Admin only).
    """
    query = db.query(models.GeoData)
    
    if country_code:
        query = query.filter(models.GeoData.country_code == country_code)
    
    geodata = query.all()
    return geodata


@router.post("/geodata", response_model=schemas.GeoDataResponse, status_code=status.HTTP_201_CREATED)
async def create_geodata(
    geodata: schemas.GeoDataCreate,
    current_user: models.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Create geographic data entry (Admin only).
    
    Used for population, density, and area data for pricing calculations.
    """
    # Check if entry already exists
    existing = db.query(models.GeoData).filter(
        models.GeoData.country_code == geodata.country_code,
        models.GeoData.state_code == geodata.state_code
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Geographic data already exists for this location"
        )
    
    new_geodata = models.GeoData(**geodata.dict())
    db.add(new_geodata)
    db.commit()
    db.refresh(new_geodata)
    
    return new_geodata


@router.delete("/geodata/{geodata_id}", response_model=schemas.MessageResponse)
async def delete_geodata(
    geodata_id: int,
    current_user: models.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Delete geographic data entry (Admin only).
    """
    geodata = db.query(models.GeoData).filter(models.GeoData.id == geodata_id).first()
    
    if not geodata:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Geographic data not found"
        )
    
    db.delete(geodata)
    db.commit()
    
    return schemas.MessageResponse(message="Geographic data deleted successfully")


# ==================== System Statistics ====================

@router.get("/stats")
async def get_system_stats(
    current_user: models.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get system-wide statistics (Admin only).
    
    Returns overview of users, campaigns, revenue, etc.
    """
    # User statistics
    total_users = db.query(func.count(models.User.id)).scalar()
    total_advertisers = db.query(func.count(models.User.id)).filter(
        models.User.role == models.UserRole.ADVERTISER
    ).scalar()
    total_admins = db.query(func.count(models.User.id)).filter(
        models.User.role == models.UserRole.ADMIN
    ).scalar()
    
    # Campaign statistics
    total_campaigns = db.query(func.count(models.Campaign.id)).scalar()
    active_campaigns = db.query(func.count(models.Campaign.id)).filter(
        models.Campaign.status == models.CampaignStatus.ACTIVE
    ).scalar()
    pending_campaigns = db.query(func.count(models.Campaign.id)).filter(
        models.Campaign.status == models.CampaignStatus.PENDING_REVIEW
    ).scalar()
    
    # Media statistics
    total_media = db.query(func.count(models.Media.id)).scalar()
    pending_media = db.query(func.count(models.Media.id)).filter(
        models.Media.approved_status == models.MediaApprovalStatus.PENDING
    ).scalar()
    
    # Revenue statistics
    total_revenue = db.query(func.sum(models.Campaign.calculated_price)).filter(
        models.Campaign.status.in_([models.CampaignStatus.ACTIVE, models.CampaignStatus.COMPLETED])
    ).scalar() or 0
    
    return {
        "users": {
            "total": total_users,
            "advertisers": total_advertisers,
            "admins": total_admins
        },
        "campaigns": {
            "total": total_campaigns,
            "active": active_campaigns,
            "pending": pending_campaigns
        },
        "media": {
            "total": total_media,
            "pending_approval": pending_media
        },
        "revenue": {
            "total": round(total_revenue, 2)
        }
    }
