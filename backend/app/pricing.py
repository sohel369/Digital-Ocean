"""
Dynamic Pricing Engine for Ad Campaigns.
Calculates pricing based on coverage type, industry, location, and population density.
"""
from sqlalchemy.orm import Session
from typing import Dict, Optional
import math
from fastapi import Depends
from . import models, schemas
from .database import get_db


class PricingEngine:
    """
    Sophisticated pricing calculation engine for Fixed Monthly Advertising Investment.
    
    PRICING PHILOSOPHY:
    - This platform operates on a FIXED MONTHLY COST model.
    - It is NOT Pay-Per-Click (PPC) or Cost-Per-Mille (CPM).
    - Advertisers pay a flat fee for specific coverage and duration.
    - Performance metrics (clicks, impressions) are indicative only and do not affect billing.

    Pricing formula:
    Total Price = (Base Rate × Industry Multiplier × Coverage Multiplier × Duration) - Discounts
    
    Components:
    1. Base Rate: Set by Admin per industry/coverage.
    2. Industry Multiplier: Sector-specific valuation (Admin controlled). Hidden from advertiser.
    3. Coverage Multiplier: Geographic scope weighting (Admin controlled).
    
    Coverage calculations (Used for Base Rate determination, NOT billing):
    - 30-mile radius: Focused local coverage.
    - State-wide: Regional coverage (State multiplier applied).
    - Country-wide: National coverage (Country multiplier applied).
    """
    
    # Default coverage multipliers
    COVERAGE_MULTIPLIERS = {
        models.CoverageType.RADIUS_30: 1.0,
        models.CoverageType.STATE: 2.5,
        models.CoverageType.COUNTRY: 5.0
    }
    
    # Default reach calculations (people per unit)
    RADIUS_30_REACH_PER_SQ_MILE = 500  # Average population density
    
    def __init__(self, db: Session):
        self.db = db
    
    def calculate_price(
        self,
        industry_type: str,
        advert_type: str,
        coverage_type: models.CoverageType,
        duration_days: int,
        target_postcode: Optional[str] = None,
        target_state: Optional[str] = None,
        target_country: Optional[str] = None
    ) -> schemas.PricingCalculateResponse:
        """
        Calculate total campaign price based on all parameters.
        
        Args:
            industry_type: Type of industry (e.g., 'retail', 'healthcare')
            advert_type: Type of advertisement (e.g., 'display', 'video')
            coverage_type: Coverage area type
            duration_days: Campaign duration in days
            target_postcode: Postcode for radius targeting
            target_state: State for state-wide targeting
            target_country: Country for country-wide targeting
        
        Returns:
            Detailed pricing breakdown
        """
        # Get pricing matrix for this configuration
        pricing_matrix = self._get_pricing_matrix(
            industry_type, advert_type, coverage_type, target_country
        )
        
        if not pricing_matrix:
            # Return default pricing if no matrix exists
            pricing_matrix = self._create_default_pricing(industry_type, advert_type, coverage_type)
        
        # Calculate base components (Monthly Basis)
        base_rate = pricing_matrix.base_rate
        industry_multiplier = pricing_matrix.multiplier
        coverage_multiplier = self._get_coverage_multiplier(coverage_type)
        
        # Calculate estimated reach
        estimated_reach = self._calculate_reach(
            coverage_type, target_postcode, target_state, target_country
        )
        
        # Calculate Monthly Gross Price (FIXED COST)
        # This is a fixed monthly investment fee.
        # It is NOT based on estimated reach, clicks, or impressions.
        # Formula: Base (Monthly) * Industry * Coverage
        monthly_gross = base_rate * industry_multiplier * coverage_multiplier
        
        # Apply discounts to Monthly Price
        discount_amount = 0.0
        if coverage_type == models.CoverageType.STATE:
            discount_amount = monthly_gross * (pricing_matrix.state_discount / 100)
        elif coverage_type == models.CoverageType.COUNTRY:
            discount_amount = monthly_gross * (pricing_matrix.national_discount / 100)
        
        # Final Monthly Price
        monthly_price = max(monthly_gross - discount_amount, 0)
        
        # Calculate Total Price based on Fixed Monthly Blocks
        # Users purchase in 1-month increments only.
        # 1 day to 30 days = 1 Month charge
        # 31 days to 60 days = 2 Months charge
        duration_months = math.ceil(duration_days / 30.0)
        
        # Optional: Long-term commitment discounts
        # 3+ Months = 5% off
        # 6+ Months = 10% off
        # 12+ Months = 15% off
        commitment_discount_percent = 0.0
        if duration_months >= 12:
            commitment_discount_percent = 15.0
        elif duration_months >= 6:
            commitment_discount_percent = 10.0
        elif duration_months >= 3:
            commitment_discount_percent = 5.0
            
        gross_total = monthly_price * duration_months
        commitment_saving = gross_total * (commitment_discount_percent / 100.0)
        total_price = gross_total - commitment_saving
        
        # Build detailed breakdown
        breakdown = {
            "base_rate_monthly": base_rate,
            "industry_multiplier": industry_multiplier,
            "coverage_multiplier": coverage_multiplier,
            "duration_days": duration_days,
            "billed_months": int(duration_months),
            "monthly_gross": monthly_gross,
            "monthly_price": monthly_price,
            "state_discount_percent": pricing_matrix.state_discount if coverage_type == models.CoverageType.STATE else 0,
            "national_discount_percent": pricing_matrix.national_discount if coverage_type == models.CoverageType.COUNTRY else 0,
            "discount_amount_monthly": discount_amount,
            "commitment_discount_percent": commitment_discount_percent,
            "commitment_saving_total": round(commitment_saving, 2),
            "coverage_area_description": self._get_coverage_description(
                coverage_type, target_postcode, target_state, target_country
            )
        }
        
        return schemas.PricingCalculateResponse(
            base_rate=base_rate,
            multiplier=industry_multiplier,
            coverage_multiplier=coverage_multiplier,
            discount=discount_amount,
            estimated_reach=estimated_reach,
            monthly_price=round(monthly_price, 2),
            total_price=round(total_price, 2),
            breakdown=breakdown
        )
    
    def _get_pricing_matrix(
        self,
        industry_type: str,
        advert_type: str,
        coverage_type: models.CoverageType,
        country_id: Optional[str] = None
    ) -> Optional[models.PricingMatrix]:
        """Retrieve pricing matrix from database."""
        query = self.db.query(models.PricingMatrix).filter(
            models.PricingMatrix.industry_type == industry_type,
            models.PricingMatrix.advert_type == advert_type,
            models.PricingMatrix.coverage_type == coverage_type
        )
        
        if country_id:
            query = query.filter(models.PricingMatrix.country_id == country_id)
        
        return query.first()
    
    def _create_default_pricing(
        self,
        industry_type: str,
        advert_type: str,
        coverage_type: models.CoverageType
    ) -> models.PricingMatrix:
        """Create default pricing matrix (not saved to DB)."""
        # Default base rates by coverage type
        default_base_rates = {
            models.CoverageType.RADIUS_30: 150.0,
            models.CoverageType.STATE: 500.0,
            models.CoverageType.COUNTRY: 1500.0
        }
        
        return models.PricingMatrix(
            industry_type=industry_type,
            advert_type=advert_type,
            coverage_type=coverage_type,
            base_rate=default_base_rates.get(coverage_type, 100.0),
            multiplier=1.0,
            state_discount=10.0,
            national_discount=15.0,
            country_id=None
        )
    
    def _get_coverage_multiplier(self, coverage_type: models.CoverageType) -> float:
        """Get coverage multiplier based on type."""
        return self.COVERAGE_MULTIPLIERS.get(coverage_type, 1.0)
    
    def _calculate_reach(
        self,
        coverage_type: models.CoverageType,
        target_postcode: Optional[str] = None,
        target_state: Optional[str] = None,
        target_country: Optional[str] = None
    ) -> int:
        """
        Calculate estimated reach (number of people).
        
        For radius: π × r² × average density
        For state: state population
        For country: country population
        """
        if coverage_type == models.CoverageType.RADIUS_30:
            # Calculate area: π × 30²
            radius_miles = 30
            area_sq_miles = math.pi * (radius_miles ** 2)
            
            # Get density from geodata if available
            density = self._get_density_for_postcode(target_postcode)
            
            return int(area_sq_miles * density)
        
        elif coverage_type == models.CoverageType.STATE:
            # Get state population
            geodata = self._get_geodata_for_state(target_state, target_country)
            if geodata:
                return geodata.population
            return 500000  # Default estimate
        
        elif coverage_type == models.CoverageType.COUNTRY:
            # Get country population
            geodata = self._get_geodata_for_country(target_country)
            if geodata:
                return geodata.population
            return 50000000  # Default estimate
        
        return 0
    
    def _get_density_for_postcode(self, postcode: Optional[str]) -> float:
        """Get population density for a postcode, falling back to national average."""
        # For this implementation, we'll try to find any GeoData record to use as a density source
        # or use the default national density.
        avg_density = self.db.query(models.GeoData.density_multiplier).filter(
            models.GeoData.state_code.is_(None)
        ).scalar()
        
        return (avg_density or 1.0) * self.RADIUS_30_REACH_PER_SQ_MILE

    
    def _get_geodata_for_state(
        self, state_code: Optional[str], country_code: Optional[str]
    ) -> Optional[models.GeoData]:
        """Get geographic data for a state."""
        if not state_code:
            return None
        
        query = self.db.query(models.GeoData).filter(
            models.GeoData.state_code == state_code
        )
        
        if country_code:
            query = query.filter(models.GeoData.country_code == country_code)
        
        return query.first()
    
    def _get_geodata_for_country(
        self, country_code: Optional[str]
    ) -> Optional[models.GeoData]:
        """Get geographic data for a country."""
        if not country_code:
            return None
        
        return self.db.query(models.GeoData).filter(
            models.GeoData.country_code == country_code,
            models.GeoData.state_code.is_(None)  # Country-level record
        ).first()
    
    def _get_coverage_description(
        self,
        coverage_type: models.CoverageType,
        target_postcode: Optional[str] = None,
        target_state: Optional[str] = None,
        target_country: Optional[str] = None
    ) -> str:
        """Generate human-readable coverage description."""
        if coverage_type == models.CoverageType.RADIUS_30:
            return f"30-mile radius around {target_postcode or 'specified location'}"
        elif coverage_type == models.CoverageType.STATE:
            return f"State-wide: {target_state or 'specified state'}, {target_country or 'country'}"
        elif coverage_type == models.CoverageType.COUNTRY:
            return f"Country-wide: {target_country or 'specified country'}"
        return "Unknown coverage"


def get_pricing_engine(db: Session = Depends(get_db)) -> PricingEngine:
    """Dependency for getting pricing engine instance."""
    return PricingEngine(db)
