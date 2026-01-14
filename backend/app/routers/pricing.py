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
@router.get("/config", response_model=schemas.GlobalPricingConfig)
async def get_global_pricing_config(
    db: Session = Depends(get_db)
):
    """
    Fetch the entire pricing configuration for admin management.
    Derives unique lists from PricingMatrix and GeoData.
    """
    from sqlalchemy import func
    
    # Get unique industries and their multipliers
    industries_data = db.query(
        models.PricingMatrix.industry_type,
        func.max(models.PricingMatrix.multiplier).label('multiplier')
    ).group_by(models.PricingMatrix.industry_type).all()
    
    industries = [
        schemas.IndustryConfig(name=row.industry_type, multiplier=row.multiplier)
        for row in industries_data
    ]
    
    # Fallback if empty
    if not industries:
        industries = [
            schemas.IndustryConfig(name="Retail", multiplier=1.0),
            schemas.IndustryConfig(name="Healthcare", multiplier=1.5),
            schemas.IndustryConfig(name="Tech", multiplier=1.3)
        ]
    
    # Get unique ad types and their base rates
    ad_types_data = db.query(
        models.PricingMatrix.advert_type,
        func.max(models.PricingMatrix.base_rate).label('base_rate')
    ).group_by(models.PricingMatrix.advert_type).all()
    
    ad_types = [
        schemas.AdTypeConfig(name=row.advert_type, base_rate=row.base_rate)
        for row in ad_types_data
    ]
    
    if not ad_types:
        ad_types = [
            schemas.AdTypeConfig(name="Display", base_rate=100.0),
            schemas.AdTypeConfig(name="Video", base_rate=250.0)
        ]
    
    # Get states/geo data
    states_data = db.query(models.GeoData).all()
    states = [
        schemas.StateConfig(
            name=row.state_name or row.country_code,
            land_area=row.land_area_sq_km,
            population=row.population,
            density_multiplier=row.density_multiplier,
            state_code=row.state_code,
            country_code=row.country_code
        )
        for row in states_data
    ]
    
    if not states:
        states = [
            schemas.StateConfig(name="California", land_area=423970, population=39538223, density_multiplier=1.5, state_code="CA", country_code="US")
        ]
    
    # Get global discounts (from first available matrix entry or defaults)
    first_matrix = db.query(models.PricingMatrix).first()
    discounts = schemas.DiscountConfig(
        state=first_matrix.state_discount if first_matrix else 0.15,
        national=first_matrix.national_discount if first_matrix else 0.30
    )
    
    return schemas.GlobalPricingConfig(
        industries=industries,
        ad_types=ad_types,
        states=states,
        discounts=discounts
    )


@router.post("/admin/config", response_model=schemas.MessageResponse)
async def save_global_pricing_config(
    config: schemas.GlobalPricingConfig,
    current_user: models.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Save global pricing configuration.
    Updates all relevant rows in PricingMatrix and GeoData in bulk.
    Uses upsert logic to ensure data is created if missing.
    """
    # 1. Update/Upsert Industry Multipliers in PricingMatrix
    # We'll update ALL entries that match this industry name
    for ind in config.industries:
        affected = db.query(models.PricingMatrix).filter(
            models.PricingMatrix.industry_type == ind.name
        ).update({"multiplier": ind.multiplier})
        
        if affected == 0:
            # If no rows affected, create a default entry for US
            # This ensures subsequent GET calls return the data
            new_entry = models.PricingMatrix(
                industry_type=ind.name,
                advert_type="display",
                coverage_type=models.CoverageType.RADIUS_30,
                base_rate=100.0,
                multiplier=ind.multiplier,
                state_discount=config.discounts.state,
                national_discount=config.discounts.national,
                country_id="US"
            )
            db.add(new_entry)
        
    # 2. Update Ad Type Base Rates
    for ad in config.ad_types:
        affected = db.query(models.PricingMatrix).filter(
            models.PricingMatrix.advert_type == ad.name
        ).update({"base_rate": ad.base_rate})
        
        if affected == 0:
            new_entry = models.PricingMatrix(
                industry_type="Retail",  # Default industry
                advert_type=ad.name,
                coverage_type=models.CoverageType.RADIUS_30,
                base_rate=ad.base_rate,
                multiplier=1.0,
                state_discount=config.discounts.state,
                national_discount=config.discounts.national,
                country_id="US"
            )
            db.add(new_entry)
        
    # 3. Update Discounts globally
    db.query(models.PricingMatrix).update({
        "state_discount": config.discounts.state,
        "national_discount": config.discounts.national
    })
    
    # 4. Update Geo Data / Density Multipliers
    for state in config.states:
        existing_geo = db.query(models.GeoData).filter(
            models.GeoData.state_name == state.name
        ).first()
        
        if existing_geo:
            existing_geo.density_multiplier = state.density_multiplier
            existing_geo.population = state.population
            existing_geo.land_area_sq_km = state.land_area
            existing_geo.state_code = state.state_code
            existing_geo.country_code = state.country_code
        else:
            new_geo = models.GeoData(
                state_name=state.name,
                country_code=state.country_code,
                state_code=state.state_code,
                land_area_sq_km=state.land_area,
                population=state.population,
                density_multiplier=state.density_multiplier
            )
            db.add(new_geo)
    
    db.commit()
    return schemas.MessageResponse(message="Global pricing configuration updated successfully")
