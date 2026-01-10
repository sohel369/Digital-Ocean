"""
Pricing calculation and management router.
Handles dynamic pricing calculation and admin pricing matrix management.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from .. import models, schemas, auth
from ..pricing import PricingEngine, get_pricing_engine

router = APIRouter(prefix="/pricing", tags=["Pricing"])


@router.post("/calculate", response_model=schemas.PricingCalculateResponse)
async def calculate_pricing(
    pricing_request: schemas.PricingCalculateRequest,
    db: Session = Depends(get_db),
    pricing_engine: PricingEngine = Depends(get_pricing_engine)
):
    """
    Calculate campaign pricing based on parameters.
    
    This endpoint provides a pricing estimate before creating a campaign.
    
    **Parameters:**
    - **industry_type**: Industry category (e.g., 'retail', 'healthcare', 'tech')
    - **advert_type**: Advertisement format ('display', 'video', 'sponsored')
    - **coverage_type**: Geographic coverage ('30-mile', 'state', 'country')
    - **target_postcode**: Postcode for radius targeting
    - **target_state**: State for state-wide targeting
    - **target_country**: Country for country-wide targeting
    - **duration_days**: Campaign duration in days
    
    **Returns:**
    - Detailed pricing breakdown with base rate, multipliers, discounts, and estimated reach
    """
    pricing_result = pricing_engine.calculate_price(
        industry_type=pricing_request.industry_type,
        advert_type=pricing_request.advert_type,
        coverage_type=pricing_request.coverage_type,
        duration_days=pricing_request.duration_days,
        target_postcode=pricing_request.target_postcode,
        target_state=pricing_request.target_state,
        target_country=pricing_request.target_country
    )
    
    return pricing_result


# ==================== Admin Pricing Management ====================

@router.get("/admin/matrix", response_model=List[schemas.PricingMatrixResponse])
async def get_pricing_matrix(
    industry_type: Optional[str] = Query(None),
    coverage_type: Optional[str] = Query(None),
    current_user: models.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get all pricing matrix entries (Admin only).
    
    Can be filtered by industry_type and coverage_type.
    """
    query = db.query(models.PricingMatrix)
    
    if industry_type:
        query = query.filter(models.PricingMatrix.industry_type == industry_type)
    
    if coverage_type:
        try:
            coverage_enum = models.CoverageType(coverage_type)
            query = query.filter(models.PricingMatrix.coverage_type == coverage_enum)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid coverage_type: {coverage_type}"
            )
    
    pricing_entries = query.all()
    return pricing_entries


@router.post("/admin/matrix", response_model=schemas.PricingMatrixResponse, status_code=status.HTTP_201_CREATED)
async def create_pricing_matrix_entry(
    pricing_data: schemas.PricingMatrixCreate,
    current_user: models.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Create a new pricing matrix entry (Admin only).
    
    This sets base rates, multipliers, and discounts for specific configurations.
    """
    # Check if entry already exists
    existing = db.query(models.PricingMatrix).filter(
        models.PricingMatrix.industry_type == pricing_data.industry_type,
        models.PricingMatrix.advert_type == pricing_data.advert_type,
        models.PricingMatrix.coverage_type == pricing_data.coverage_type,
        models.PricingMatrix.country_id == pricing_data.country_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pricing matrix entry already exists for this configuration"
        )
    
    new_pricing = models.PricingMatrix(
        industry_type=pricing_data.industry_type,
        advert_type=pricing_data.advert_type,
        coverage_type=pricing_data.coverage_type,
        base_rate=pricing_data.base_rate,
        multiplier=pricing_data.multiplier,
        state_discount=pricing_data.state_discount,
        national_discount=pricing_data.national_discount,
        country_id=pricing_data.country_id
    )
    
    db.add(new_pricing)
    db.commit()
    db.refresh(new_pricing)
    
    return new_pricing


@router.put("/admin/matrix/{pricing_id}", response_model=schemas.PricingMatrixResponse)
async def update_pricing_matrix_entry(
    pricing_id: int,
    pricing_update: schemas.PricingMatrixUpdate,
    current_user: models.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Update a pricing matrix entry (Admin only).
    
    Allows modification of base rates, multipliers, and discounts.
    """
    pricing_entry = db.query(models.PricingMatrix).filter(models.PricingMatrix.id == pricing_id).first()
    
    if not pricing_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pricing matrix entry not found"
        )
    
    # Update fields
    update_data = pricing_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(pricing_entry, field, value)
    
    db.commit()
    db.refresh(pricing_entry)
    
    return pricing_entry


@router.delete("/admin/matrix/{pricing_id}", response_model=schemas.MessageResponse)
async def delete_pricing_matrix_entry(
    pricing_id: int,
    current_user: models.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Delete a pricing matrix entry (Admin only).
    """
    pricing_entry = db.query(models.PricingMatrix).filter(models.PricingMatrix.id == pricing_id).first()
    
    if not pricing_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pricing matrix entry not found"
        )
    
    db.delete(pricing_entry)
    db.commit()
    
    return schemas.MessageResponse(
        message="Pricing matrix entry deleted successfully"
    )
