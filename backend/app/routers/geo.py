from fastapi import APIRouter, HTTPException, Query, Request
from typing import List, Dict, Optional
from pydantic import BaseModel
from ..utils import geo_ip

router = APIRouter(
    prefix="/geo",
    tags=["GeoTargeting"]
)

class Region(BaseModel):
    name: str
    code: str
    country_code: str

# Static Data for Supported Countries
# robust list ensuring all 50 US states + other countries
GEO_DATA = {
    "US": [
        {"name": "Alabama", "code": "AL"}, {"name": "Alaska", "code": "AK"}, {"name": "Arizona", "code": "AZ"},
        {"name": "Arkansas", "code": "AR"}, {"name": "California", "code": "CA"}, {"name": "Colorado", "code": "CO"},
        {"name": "Connecticut", "code": "CT"}, {"name": "Delaware", "code": "DE"}, {"name": "Florida", "code": "FL"},
        {"name": "Georgia", "code": "GA"}, {"name": "Hawaii", "code": "HI"}, {"name": "Idaho", "code": "ID"},
        {"name": "Illinois", "code": "IL"}, {"name": "Indiana", "code": "IN"}, {"name": "Iowa", "code": "IA"},
        {"name": "Kansas", "code": "KS"}, {"name": "Kentucky", "code": "KY"}, {"name": "Louisiana", "code": "LA"},
        {"name": "Maine", "code": "ME"}, {"name": "Maryland", "code": "MD"}, {"name": "Massachusetts", "code": "MA"},
        {"name": "Michigan", "code": "MI"}, {"name": "Minnesota", "code": "MN"}, {"name": "Mississippi", "code": "MS"},
        {"name": "Missouri", "code": "MO"}, {"name": "Montana", "code": "MT"}, {"name": "Nebraska", "code": "NE"},
        {"name": "Nevada", "code": "NV"}, {"name": "New Hampshire", "code": "NH"}, {"name": "New Jersey", "code": "NJ"},
        {"name": "New Mexico", "code": "NM"}, {"name": "New York", "code": "NY"}, {"name": "North Carolina", "code": "NC"},
        {"name": "North Dakota", "code": "ND"}, {"name": "Ohio", "code": "OH"}, {"name": "Oklahoma", "code": "OK"},
        {"name": "Oregon", "code": "OR"}, {"name": "Pennsylvania", "code": "PA"}, {"name": "Rhode Island", "code": "RI"},
        {"name": "South Carolina", "code": "SC"}, {"name": "South Dakota", "code": "SD"}, {"name": "Tennessee", "code": "TN"},
        {"name": "Texas", "code": "TX"}, {"name": "Utah", "code": "UT"}, {"name": "Vermont", "code": "VT"},
        {"name": "Virginia", "code": "VA"}, {"name": "Washington", "code": "WA"}, {"name": "West Virginia", "code": "WV"},
        {"name": "Wisconsin", "code": "WI"}, {"name": "Wyoming", "code": "WY"}, {"name": "District of Columbia", "code": "DC"}
    ],
    "CA": [
        {"name": "Alberta", "code": "AB"}, {"name": "British Columbia", "code": "BC"}, {"name": "Manitoba", "code": "MB"},
        {"name": "New Brunswick", "code": "NB"}, {"name": "Newfoundland and Labrador", "code": "NL"}, {"name": "Nova Scotia", "code": "NS"},
        {"name": "Ontario", "code": "ON"}, {"name": "Prince Edward Island", "code": "PE"}, {"name": "Quebec", "code": "QC"},
        {"name": "Saskatchewan", "code": "SK"}
    ],
    "AU": [
        {"name": "New South Wales", "code": "NSW"}, {"name": "Victoria", "code": "VIC"}, {"name": "Queensland", "code": "QLD"},
        {"name": "Western Australia", "code": "WA"}, {"name": "South Australia", "code": "SA"}, {"name": "Tasmania", "code": "TAS"},
        {"name": "Australian Capital Territory", "code": "ACT"}, {"name": "Northern Territory", "code": "NT"}
    ],
    "GB": [
        {"name": "England", "code": "ENG"}, {"name": "Scotland", "code": "SCT"}, {"name": "Wales", "code": "WLS"}, {"name": "Northern Ireland", "code": "NIR"}
    ],
    "FR": [
        {"name": "Île-de-France", "code": "IDF"}, {"name": "Provence-Alpes-Côte d'Azur", "code": "PACA"}, 
        {"name": "Auvergne-Rhône-Alpes", "code": "ARA"}, {"name": "Nouvelle-Aquitaine", "code": "NAQ"},
        {"name": "Occitanie", "code": "OCC"}, {"name": "Hauts-de-France", "code": "HDF"},
        {"name": "Grand Est", "code": "GES"}, {"name": "Brittany", "code": "BRE"}
    ],
    "DE": [
        {"name": "Bavaria", "code": "BY"}, {"name": "North Rhine-Westphalia", "code": "NW"}, 
        {"name": "Baden-Württemberg", "code": "BW"}, {"name": "Hesse", "code": "HE"},
        {"name": "Lower Saxony", "code": "NI"}, {"name": "Berlin", "code": "BE"}
    ],
    "ID": [
        {"name": "Jakarta", "code": "JK"}, {"name": "West Java", "code": "JB"}, {"name": "Central Java", "code": "JT"},
        {"name": "East Java", "code": "JI"}, {"name": "Bali", "code": "BA"}, {"name": "Banten", "code": "BT"}
    ],
    "VN": [
        {"name": "Ho Chi Minh City", "code": "SG"}, {"name": "Hanoi", "code": "HN"}, {"name": "Da Nang", "code": "DN"},
        {"name": "Hai Phong", "code": "HP"}, {"name": "Can Tho", "code": "CT"}
    ],
    "PH": [
        {"name": "Metro Manila", "code": "NCR"}, {"name": "Cebu", "code": "CEB"}, {"name": "Davao", "code": "DAV"},
        {"name": "CALABARZON", "code": "4A"}, {"name": "Central Luzon", "code": "3"}
    ]
}

@router.get("/regions/{country_code}", response_model=List[Region])
async def get_regions(country_code: str):
    """
    Get administrative regions (States/Provinces) for a specific country.
    """
    code = country_code.upper()
    if code not in GEO_DATA:
        # Fallback or empty list
        return []
    
    regions = GEO_DATA[code]
    return [Region(name=r["name"], code=r["code"], country_code=code) for r in regions]

@router.get("/validate-postcode")
async def validate_postcode(postcode: str, country_code: str):
    """
    Simple validation structure (logic usually handled by Nominatim client-side 
    to avoid rate limits on backend, but this endpoint can be expanded).
    """
    # Placeholder for server-side validation if needed
    return {"valid": True, "formatted": postcode.upper()}

@router.get("/detect-country")
async def detect_country(request: Request):
    """
    Detect the user's country from their IP address.
    """
    country = await geo_ip.get_country_from_ip(request)
    return {
        "country": country or "US", 
        "is_local": country is None,
        "ip": request.client.host if request.client else "unknown"
    }
