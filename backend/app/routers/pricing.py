"""
Pricing calculation and management router.
Handles dynamic pricing calculation and admin pricing matrix management.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
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
    country_code: Optional[str] = Query(None),
    current_user: Optional[models.User] = Depends(auth.get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Fetch pricing configuration.
    If country_code is provided, tries to find country-specific pricing (Currency Override).
    Falls back to US/Global pricing if no specific override exists.
    """
    from sqlalchemy import func, or_
    
    target_country = country_code.upper() if country_code else "US"
    
    # helper to getting rates with fallback
    def get_matrix_entries(filters):
        # Try specific country first
        query = db.query(models.PricingMatrix)
        for k, v in filters.items():
            query = query.filter(getattr(models.PricingMatrix, k) == v)
            
        specific = query.filter(models.PricingMatrix.country_id == target_country).all()
        if specific:
            return specific, True # Found specific
            
        # Fallback to US or NULL
        fallback = query.filter(
            or_(models.PricingMatrix.country_id == "US", models.PricingMatrix.country_id.is_(None))
        ).all()
        return fallback, False # Found fallback

    # 1. Industries & Multipliers
    # We fetch all unique industries first to ensure we allow selection
    all_industries = db.query(models.PricingMatrix.industry_type).distinct().all()
    industries = []
    
    if all_industries:
        for (ind_name,) in all_industries:
            # For each industry, find the effective multiplier for this country
            entries, _ = get_matrix_entries({"industry_type": ind_name})
            # Use max multiplier to be safe/conservative if duplicates exist
            mult_list = [e.multiplier for e in entries if e.multiplier is not None]
            mult = max(mult_list) if mult_list else 1.0
            industries.append(schemas.IndustryConfig(name=ind_name, multiplier=mult))
    
    # Ensure we always have at least some industries if DB is fresh
    if not industries:
        default_industries = [
            "Tyres And Wheels", "Vehicle Servicing And Maintenance", "Panel Beating And Smash Repairs",
            "Automotive Finance Solutions", "Vehicle Insurance Products", "Auto Parts Tools And Accessories",
            "Fleet Management Tools", "Workshop Technology And Equipment", "Telematics Systems And Vehicle Tracking Solutions",
            "Fuel Cards And Fuel Management Services", "Vehicle Cleaning And Detailing Services", "Logistics And Scheduling Software",
            "Safety And Compliance Solutions", "Driver Training And Induction Programs", "Roadside Assistance Programs",
            "Gps Navigation And Route Optimisation Tools", "Ev Charging Infrastructure And Electric Vehicle Solutions",
            "Mobile Device Integration And Communications Equipment", "Asset Recovery And Anti Theft Technologies"
        ]
        industries = [schemas.IndustryConfig(name=name, multiplier=1.0) for name in default_industries]

    # Filter industries for non-admin users
    if current_user and current_user.role != models.UserRole.ADMIN and hasattr(current_user, 'industry') and current_user.industry:
        user_ind = current_user.industry.lower()
        # Filter strictly
        filtered = [i for i in industries if i.name.lower() == user_ind]
        if filtered:
            industries = filtered
        else:
            # Fallback if industry not found in matrix
            industries = [schemas.IndustryConfig(name=current_user.industry, multiplier=1.0)]

    # 2. Ad Types & Base Rates
    # Similar logic: check if this country has a specific base rate
    all_ad_types = db.query(models.PricingMatrix.advert_type).distinct().all()
    ad_types = []
    
    if all_ad_types:
        for (ad_name,) in all_ad_types:
            entries, _ = get_matrix_entries({"advert_type": ad_name})
            rate_list = [e.base_rate for e in entries if e.base_rate is not None]
            rate = max(rate_list) if rate_list else 100.0
            ad_types.append(schemas.AdTypeConfig(name=ad_name, base_rate=rate))
        
    if not ad_types:
        ad_types = [
            schemas.AdTypeConfig(name="Leaderboard (728x90)", base_rate=150.0),
            schemas.AdTypeConfig(name="Skyscraper (160x600)", base_rate=180.0),
            schemas.AdTypeConfig(name="Medium Rectangle (300x250)", base_rate=200.0),
            schemas.AdTypeConfig(name="Mobile Leaderboard (320x50)", base_rate=100.0),
            schemas.AdTypeConfig(name="Email Newsletter (600x200)", base_rate=250.0)
        ]

    # 3. Geo Data (Existing Logic)
    geo_query = db.query(models.GeoData)
    
    # PERMISSION CHECK: Country Admins only see their own country's states
    if current_user and current_user.role == models.UserRole.COUNTRY_ADMIN:
        managed = (current_user.managed_country or "").upper()
        if managed:
            geo_query = geo_query.filter(models.GeoData.country_code == managed)
    else:
        # Default filtering by target country for advertisers/admins
        geo_query = geo_query.filter(models.GeoData.country_code == target_country)
            
    states_data = geo_query.all()
    states = [
        schemas.StateConfig(
            name=row.state_name or row.state_code or row.country_code or "Unknown",
            land_area=row.land_area_sq_km or 0.0,
            population=row.population or 0,
            radius_areas_count=row.radius_areas_count or 1,
            density_multiplier=row.density_multiplier or 1.0,
            state_code=row.state_code or "UNKNOWN",
            country_code=row.country_code or target_country
        )
        for row in states_data
    ]
    if not states:
        # Provide a contextual fallback based on requested country
        states = [
            schemas.StateConfig(name=f"Standard Region ({target_country})", land_area=10000, population=1000000, density_multiplier=1.0, state_code="STD", country_code=target_country)
        ]

    # 4. Discounts (Country specific or default)
    disc_entries, _ = get_matrix_entries({}) # Just get any for this country
    
    # Safely pick first valid discount or use defaults
    s_discount = 0.15
    n_discount = 0.30
    
    if disc_entries:
        # Filter out Nones
        states_d = [e.state_discount for e in disc_entries if e.state_discount is not None]
        nats_d = [e.national_discount for e in disc_entries if e.national_discount is not None]
        
        if states_d: s_discount = states_d[0]
        if nats_d: n_discount = nats_d[0]
    
    discounts = schemas.DiscountConfig(
        state=s_discount,
        national=n_discount
    )

    # Determine currency based on context
    # basic mapping, in prod this should be in a DB table
    currency_map = {
        "US": "USD", "TH": "THB", "VN": "VND", "PH": "PHP", 
        "GB": "GBP", "FR": "EUR", "DE": "EUR", "CA": "CAD", 
        "AU": "AUD", "IN": "INR", "ID": "IDR", "JP": "JPY",
        "CN": "CNY", "IT": "EUR", "ES": "EUR"
    }
    
    # Heuristic: If we found specific rates for the requested country, return that currency.
    # Otherwise return USD.
    # We check if any of the lookups returned specific data
    industry_specific = any(get_matrix_entries({"industry_type": i.name})[1] for i in industries)
    ad_specific = any(get_matrix_entries({"advert_type": a.name})[1] for a in ad_types)
    
    is_specific_pricing = industry_specific or ad_specific
    
    response_currency = "USD"
    if is_specific_pricing and target_country in currency_map:
        response_currency = currency_map[target_country]

    return schemas.GlobalPricingConfig(
        industries=industries,
        ad_types=ad_types,
        states=states,
        discounts=discounts,
        currency=response_currency
    )


@router.post("/admin/config", response_model=schemas.MessageResponse)
async def save_global_pricing_config(
    config: schemas.GlobalPricingConfig,
    current_user: models.User = Depends(auth.get_current_pricing_admin_user),
    db: Session = Depends(get_db)
):
    """
    Save global pricing configuration.
    Updates all relevant rows in PricingMatrix and GeoData in bulk.
    Uses upsert logic to ensure data is created if missing.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        # Determine target country for these pricing rows
        target_country = (config.country_code or "US").upper()
        
        # PERMISSION CHECK: Country Admins can only edit their own country
        if current_user.role == models.UserRole.COUNTRY_ADMIN:
            managed = (current_user.managed_country or "").upper()
            if managed != target_country:
                logger.warning(f"🚫 PERMISSION DENIED: {current_user.email} (managed={managed}) attempted to edit {target_country}")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access Denied: You are only authorized to manage pricing for {managed}."
                )

        logger.info(f"💾 ADMIN SAVE INITIATED by {current_user.email} for {target_country}")
        logger.info(f"📋 Config data: {len(config.industries)} industries, {len(config.ad_types)} ad types, {len(config.states)} states")

        # 1. Update/Upsert Industry Multipliers in PricingMatrix
        for ind in config.industries:
            logger.debug(f"Updating industry: {ind.name} for {target_country}")
            affected = db.query(models.PricingMatrix).filter(
                models.PricingMatrix.industry_type == ind.name,
                models.PricingMatrix.country_id == target_country
            ).update({"multiplier": ind.multiplier}, synchronize_session=False)
            
            if affected == 0:
                logger.info(f"Creating new matrix entry for industry: {ind.name} ({target_country})")
                new_entry = models.PricingMatrix(
                    industry_type=ind.name,
                    advert_type="display",
                    coverage_type=models.CoverageType.RADIUS_30,
                    base_rate=100.0,
                    multiplier=ind.multiplier,
                    state_discount=config.discounts.state,
                    national_discount=config.discounts.national,
                    country_id=target_country
                )
                db.add(new_entry)
            
        # 2. Update Ad Type Base Rates
        for ad in config.ad_types:
            logger.debug(f"Updating ad type: {ad.name} for {target_country}")
            affected = db.query(models.PricingMatrix).filter(
                models.PricingMatrix.advert_type == ad.name,
                models.PricingMatrix.country_id == target_country
            ).update({"base_rate": ad.base_rate}, synchronize_session=False)
            
            if affected == 0:
                logger.info(f"Creating new matrix entry for ad type: {ad.name} ({target_country})")
                new_entry = models.PricingMatrix(
                    industry_type="General",
                    advert_type=ad.name,
                    coverage_type=models.CoverageType.RADIUS_30,
                    base_rate=ad.base_rate,
                    multiplier=1.0,
                    state_discount=config.discounts.state,
                    national_discount=config.discounts.national,
                    country_id=target_country
                )
                db.add(new_entry)
            
        # 3. Update Discounts for this country
        logger.info(f"Updating discounts for {target_country}: State={config.discounts.state}, National={config.discounts.national}")
        db.query(models.PricingMatrix).filter(
            models.PricingMatrix.country_id == target_country
        ).update({
            "state_discount": config.discounts.state,
            "national_discount": config.discounts.national
        }, synchronize_session=False)
        
        # 4. Update Geo Data / Density Multipliers efficiently
        # Pre-fetch all geo data to avoid N+1 queries
        all_geo = db.query(models.GeoData).all()
        geo_map = {g.state_name: g for g in all_geo if g.state_name}
        
        for state in config.states:
            if not state.name: continue
            
            existing_geo = geo_map.get(state.name)
            
            if existing_geo:
                existing_geo.density_multiplier = state.density_multiplier
                existing_geo.population = state.population
                existing_geo.radius_areas_count = state.radius_areas_count
                existing_geo.land_area_sq_km = state.land_area
                existing_geo.state_code = state.state_code
                # Ensure country code is set correctly
                existing_geo.country_code = state.country_code or target_country
            else:
                new_geo = models.GeoData(
                    state_name=state.name,
                    country_code=state.country_code or target_country,
                    state_code=state.state_code or "UNK",
                    land_area_sq_km=state.land_area,
                    population=state.population,
                    radius_areas_count=state.radius_areas_count,
                    density_multiplier=state.density_multiplier
                )
                db.add(new_geo)
        
        db.commit()
        logger.info("✅ Admin Config saved successfully")
        return schemas.MessageResponse(message="Global pricing configuration updated successfully")
        
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Admin Config Save Failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save configuration: {str(e)}"
        )
