"""
Admin router for user, campaign, and system management.
Provides comprehensive administrative controls.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import logging
logger = logging.getLogger(__name__)

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
    user_role = str(current_user.role).lower() if current_user.role else ""
    if user_role == "country_admin":
        if current_user.managed_country:
            query = query.filter(models.User.country == current_user.managed_country)
        else:
            return []

    # Apply filter if provided in query parameter
    if role:
        try:
            # Check if role is valid enum value
            role_enum = models.UserRole(role.lower())
            query = query.filter(models.User.role == role_enum)
        except (ValueError, AttributeError):
            # If invalid role requested, just don't filter or return error
            pass
    
    try:
        # Fetch users
        users = query.order_by(models.User.created_at.desc()).offset(skip).limit(limit).all()
        
        # Log success
        logger.info(f"✅ Fetched {len(users)} users for admin {current_user.email}")
        
        return users
    except Exception as e:
        logger.error(f"❌ User Directory Error: {str(e)}")
        # If columns are missing, this will fail. Suggest running fix-db.
        if "column" in str(e).lower() or "no such column" in str(e).lower():
             raise HTTPException(
                status_code=500,
                detail=f"Database schema mismatch. Please visit /api/admin/fix-db to update tables. Error: {str(e)}"
            )
        raise HTTPException(status_code=500, detail=str(e))


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
    user_role = str(current_user.role).lower() if current_user.role else ""
    if user_role == "country_admin":
        if current_user.managed_country:
            query = query.filter(models.User.country == current_user.managed_country)
        else:
            return {"count": 0}

    # Apply filter if provided
    if role:
        try:
            role_enum = models.UserRole(role.lower())
            query = query.filter(models.User.role == role_enum)
        except (ValueError, AttributeError):
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
    try:
        update_data = user_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            if field == 'role' and value:
                # Ensure we get the string value of the role
                role_val = value.value if hasattr(value, 'value') else str(value).lower()
                # Final safeguard mapping
                if "admin" in role_val and "country" not in role_val:
                    role_val = "admin"
                setattr(user, field, role_val)
            elif field == 'role' and value is None:
                # Never allow role to be set to null
                logger.warning(f"Attempted to set user {user.id}'s role to null by admin {current_user.email}. Ignoring.")
                continue
            else:
                setattr(user, field, value)
        
        db.commit()
        db.refresh(user)
        logger.info(f"✅ User {user.email} (ID: {user.id}) updated by admin {current_user.email} (ID: {current_user.id})")
        return user
    except Exception as e:
        db.rollback()
        logger.error(f"❌ User Update Error for user {user_id} by admin {current_user.email}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


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


@router.post("/seed/bd-data", response_model=schemas.MessageResponse, status_code=status.HTTP_201_CREATED)
async def seed_bd_data(
    current_user: models.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Manually seed Bangladesh geographic data (Admin only).
    Useful for fixing missing data in production.
    """
    try:
        # Delete existing BD data to prevent duplicates
        db.query(models.GeoData).filter(models.GeoData.country_code == "BD").delete()
        
        # Insert fresh BD data
        entries = [
            models.GeoData(country_code="BD", state_code="DHK", state_name="Dhaka", land_area_sq_km=1463, population=21000000, density_multiplier=5.0),
            models.GeoData(country_code="BD", state_code="CTG", state_name="Chittagong", land_area_sq_km=168, population=9000000, density_multiplier=3.5),
            models.GeoData(country_code="BD", state_code="SYL", state_name="Sylhet", land_area_sq_km=12000, population=4000000, density_multiplier=2.0),
            models.GeoData(country_code="BD", state_code="RAJ", state_name="Rajshahi", land_area_sq_km=18000, population=6000000, density_multiplier=1.8),
        ]
        
        db.add_all(entries)
        db.commit()
        
        return schemas.MessageResponse(
            message="Bangladesh data seeded successfully",
            detail=f"Added {len(entries)} regions: {', '.join([e.state_name for e in entries])}"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to seed BD data: {str(e)}"
        )


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
