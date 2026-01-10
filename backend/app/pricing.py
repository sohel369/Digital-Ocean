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
    Sophisticated pricing calculation engine.
    
    Pricing formula:
    Total Price = (Base Rate × Industry Multiplier × Coverage Multiplier × Duration) - Discounts
    
    Coverage calculations:
    - 30-mile radius: π × r² (area in sq miles), multiplied by density
    - State-wide: State population × state discount
    - Country-wide: Country population × national discount
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
        
        # Calculate base components
        base_rate = pricing_matrix.base_rate
        industry_multiplier = pricing_matrix.multiplier
        coverage_multiplier = self._get_coverage_multiplier(coverage_type)
        
        # Calculate estimated reach
        estimated_reach = self._calculate_reach(
            coverage_type, target_postcode, target_state, target_country
        )
        
        # Calculate gross price
        gross_price = base_rate * industry_multiplier * coverage_multiplier * duration_days
        
        # Apply discounts
        discount_amount = 0.0
        if coverage_type == models.CoverageType.STATE:
            discount_amount = gross_price * (pricing_matrix.state_discount / 100)
        elif coverage_type == models.CoverageType.COUNTRY:
            discount_amount = gross_price * (pricing_matrix.national_discount / 100)
        
        # Final price
        total_price = max(gross_price - discount_amount, 0)
        
        # Build detailed breakdown
        breakdown = {
            "base_rate": base_rate,
            "industry_multiplier": industry_multiplier,
            "coverage_multiplier": coverage_multiplier,
            "duration_days": duration_days,
            "gross_price": gross_price,
            "state_discount_percent": pricing_matrix.state_discount if coverage_type == models.CoverageType.STATE else 0,
            "national_discount_percent": pricing_matrix.national_discount if coverage_type == models.CoverageType.COUNTRY else 0,
            "discount_amount": discount_amount,
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
            models.CoverageType.RADIUS_30: 100.0,
            models.CoverageType.STATE: 500.0,
            models.CoverageType.COUNTRY: 2000.0
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
        """Get population density for a postcode (simplified)."""
        # In a real implementation, you'd look up the postcode's state/region
        # and get the density from geodata
        # For now, return average density
        return self.RADIUS_30_REACH_PER_SQ_MILE
    
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
