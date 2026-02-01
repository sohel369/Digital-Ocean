"""
Pydantic schemas for request/response validation.
Ensures type-safe data validation and serialization.
Compatible with Pydantic v2.
"""
from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict
from typing import Optional, List, Any
from datetime import datetime, date
from enum import Enum
import re


# ==================== Enums ====================
class UserRole(str, Enum):
    """User role enumeration."""
    ADVERTISER = "advertiser"
    USER = "user"
    ADMIN = "admin"
    COUNTRY_ADMIN = "country_admin"

    @classmethod
    def _missing_(cls, value):
        if isinstance(value, str):
            v_lower = value.lower().replace(" ", "").replace("_", "")
            if v_lower in ["admin", "superadmin"]:
                return cls.ADMIN
            if v_lower in ["countryadmin"]:
                return cls.COUNTRY_ADMIN
            if v_lower in ["advertiser"]:
                return cls.ADVERTISER
            for member in cls:
                if member.value.replace("_", "") == v_lower:
                    return member
        return None



class CampaignStatus(str, Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    PENDING_REVIEW = "PENDING_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CHANGES_REQUIRED = "CHANGES_REQUIRED"
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"
    PENDING = "PENDING"  # Legacy alias


class MediaApprovalStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class CoverageType(str, Enum):
    RADIUS_30 = "30-mile"
    STATE = "state"
    COUNTRY = "country"


# ==================== Auth Schemas ====================
class UserSignup(BaseModel):
    """Schema for user registration."""
    name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    country: Optional[str] = None
    industry: str = Field(..., description="Industry from fixed list")
    role: UserRole = UserRole.ADVERTISER
    
    @field_validator('role', mode='before')
    @classmethod
    def normalize_role(cls, v: Any) -> Any:
        if isinstance(v, str):
            return v.lower()
        return v


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    """Schema for requesting a password reset email."""
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Schema for resetting password with a token."""
    token: str
    new_password: str = Field(..., min_length=8, max_length=100)


class Token(BaseModel):
    """Schema for JWT token response."""
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """Schema for JWT token payload."""
    sub: int  # User ID
    email: str
    role: str
    exp: datetime


class UserResponse(BaseModel):
    """Schema for user data in responses."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    name: str
    email: EmailStr
    role: UserRole
    
    @field_validator('role', mode='before')
    @classmethod
    def normalize_role(cls, v: Any) -> Any:
        if v is None:
            return UserRole.ADVERTISER
        if isinstance(v, str):
            v_low = v.lower()
            # Try to match enum
            try: return UserRole(v_low)
            except: return UserRole.ADVERTISER
        if hasattr(v, 'name'):
            return v.value.lower()
        return v
        
    country: Optional[str] = "US"
    industry: Optional[str] = "General"
    profile_picture: Optional[str] = None
    managed_country: Optional[str] = None
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None


# ==================== Campaign Schemas ====================
class CampaignCreate(BaseModel):
    """Schema for creating a campaign."""
    name: str = Field(..., min_length=3, max_length=255)
    industry_type: str
    start_date: date
    end_date: Optional[date] = None
    duration: Optional[int] = Field(None, description="Duration in months")
    budget: float = Field(..., gt=0)
    coverage_type: CoverageType
    target_postcode: Optional[str] = None
    target_state: Optional[str] = None
    target_country: Optional[str] = None
    description: Optional[str] = None
    headline: Optional[str] = None
    landing_page_url: Optional[str] = None
    ad_format: Optional[str] = None
    status: Optional[CampaignStatus] = CampaignStatus.DRAFT
    tags: Optional[List[str]] = []
    
    @field_validator('status', mode='before')
    @classmethod
    def normalize_status(cls, v: Any) -> Any:
        if isinstance(v, str):
            return v.upper()
        return v
    
    @field_validator('end_date', mode='after')
    @classmethod
    def end_date_after_start(cls, v: Optional[date], info: Any) -> Optional[date]:
        if v and 'start_date' in info.data and v <= info.data['start_date']:
            raise ValueError('end_date must be after start_date')
        return v


class CampaignUpdate(BaseModel):
    """Schema for updating a campaign."""
    name: Optional[str] = None
    industry_type: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    duration: Optional[int] = Field(None, description="Duration in months")
    budget: Optional[float] = None
    status: Optional[CampaignStatus] = None
    coverage_type: Optional[CoverageType] = None
    
    @field_validator('status', mode='before')
    @classmethod
    def normalize_status(cls, v: Any) -> Any:
        if isinstance(v, str):
            return v.upper()
        return v
    target_postcode: Optional[str] = None
    target_state: Optional[str] = None
    target_country: Optional[str] = None
    description: Optional[str] = None
    headline: Optional[str] = None
    landing_page_url: Optional[str] = None
    ad_format: Optional[str] = None
    tags: Optional[List[str]] = None


class CampaignResponse(BaseModel):
    """Schema for campaign data in responses."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    advertiser_id: int
    name: str
    industry_type: str
    start_date: date
    end_date: date
    budget: float
    calculated_price: Optional[float] = None
    status: str
    coverage_type: CoverageType
    coverage_area: Optional[str] = None
    target_postcode: Optional[str] = None
    target_state: Optional[str] = None
    target_country: Optional[str] = None
    impressions: int = 0
    clicks: int = 0
    ctr: float = 0.0
    description: Optional[str] = None
    headline: Optional[str] = None
    landing_page_url: Optional[str] = None
    ad_format: Optional[str] = None
    tags: Optional[List[str]] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    # Admin approval fields
    submitted_at: Optional[datetime] = None
    admin_message: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    
    @field_validator('status', mode='before')
    @classmethod
    def status_to_lowercase(cls, v: Any) -> Any:
        if hasattr(v, 'value'):
            return v.value.lower()
        if isinstance(v, str):
            return v.lower()
        return v


# ==================== Media Schemas ====================
class MediaUploadResponse(BaseModel):
    """Schema for media upload response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    campaign_id: int
    file_path: str
    file_type: str
    file_size: int
    mime_type: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    approved_status: MediaApprovalStatus
    uploaded_at: datetime


class MediaApproval(BaseModel):
    """Schema for media approval action."""
    approved: bool
    rejection_reason: Optional[str] = None


# ==================== Pricing Schemas ====================
class PricingCalculateRequest(BaseModel):
    """Schema for pricing calculation request."""
    industry_type: str
    advert_type: str = "display"
    coverage_type: CoverageType
    target_postcode: Optional[str] = None
    target_state: Optional[str] = None
    target_country: Optional[str] = None
    duration_days: int = Field(..., gt=0)


class PricingCalculateResponse(BaseModel):
    """Schema for pricing calculation response."""
    base_rate: float
    multiplier: float
    coverage_multiplier: float
    discount: float
    estimated_reach: int
    monthly_price: float
    total_price: float
    breakdown: dict


class PricingMatrixCreate(BaseModel):
    """Schema for creating pricing matrix entry."""
    industry_type: str
    advert_type: str
    coverage_type: CoverageType
    base_rate: float = Field(..., gt=0)
    multiplier: float = Field(default=1.0, gt=0)
    state_discount: float = Field(default=0.0, ge=0, le=100)
    national_discount: float = Field(default=0.0, ge=0, le=100)
    country_id: Optional[str] = None


class PricingMatrixUpdate(BaseModel):
    """Schema for updating pricing matrix."""
    base_rate: Optional[float] = None
    multiplier: Optional[float] = None
    state_discount: Optional[float] = None
    national_discount: Optional[float] = None


class PricingMatrixResponse(BaseModel):
    """Schema for pricing matrix response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    industry_type: str
    advert_type: str
    coverage_type: CoverageType
    base_rate: float
    multiplier: float
    state_discount: float
    national_discount: float
    country_id: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


# ==================== Analytics Schemas ====================
class CampaignAnalytics(BaseModel):
    """Schema for campaign analytics."""
    campaign_id: int
    campaign_name: str
    impressions: int
    clicks: int
    ctr: float
    budget: float
    spent: float
    remaining_budget: float
    start_date: date
    end_date: date
    status: str
    
    @field_validator('status', mode='before')
    @classmethod
    def status_to_lowercase(cls, v: Any) -> Any:
        if hasattr(v, 'value'):
            return v.value.lower()
        if isinstance(v, str):
            return v.lower()
        return v


# ==================== Pricing Multi-Config Schemas ====================
class IndustryConfig(BaseModel):
    name: str
    multiplier: float
    
    @field_validator('multiplier', mode='before')
    @classmethod
    def clean_multiplier(cls, v: Any) -> Any:
        if isinstance(v, str):
            try:
                # Remove any %, commas, currency symbols, etc. leaving only digits and dot
                clean_v = re.sub(r'[^\d.]', '', v)
                return float(clean_v) if clean_v else 1.0
            except: return 1.0
        return v

class AdTypeConfig(BaseModel):
    name: str
    base_rate: float
    
    @field_validator('base_rate', mode='before')
    @classmethod
    def clean_base_rate(cls, v: Any) -> Any:
        if isinstance(v, str):
            try:
                # Remove currency symbols (like $, ৳) and commas
                clean_v = re.sub(r'[^\d.]', '', v)
                return float(clean_v) if clean_v else 100.0
            except: return 100.0
        return v

class StateConfig(BaseModel):
    name: str
    land_area: float
    population: int = 0
    radius_areas_count: Optional[int] = 1
    density_multiplier: float = 1.0
    state_code: Optional[str] = "UNK"
    country_code: str = "US"
    fips: Optional[int] = None
    density_mi: Optional[float] = None
    rank: Optional[int] = None
    population_percent: Optional[float] = None

    @field_validator('land_area', 'density_multiplier', 'density_mi', 'population_percent', mode='before')
    @classmethod
    def clean_floats(cls, v: Any) -> Any:
        if v == "" or v is None: return 0.0
        if isinstance(v, str):
            try:
                return float(v.replace(',', '').strip())
            except: return 0.0
        return v

    @field_validator('population', 'radius_areas_count', 'fips', 'rank', mode='before')
    @classmethod
    def clean_ints(cls, v: Any) -> Any:
        if v == "" or v is None: return 0
        if isinstance(v, str):
            try:
                # Handle cases like "1,000,000"
                clean_v = "".join(filter(str.isdigit, v))
                return int(clean_v) if clean_v else 0
            except: return 0
        return v

class DiscountConfig(BaseModel):
    state: float = 0.15
    national: float = 0.30
    
    @field_validator('state', 'national', mode='before')
    @classmethod
    def clean_discounts(cls, v: Any) -> Any:
        if v == "" or v is None: return 0.0
        if isinstance(v, str):
            try:
                val = float(v.replace('%', '').replace(',', '').strip())
                # If they sent "15" instead of "0.15", convert to decimal
                if val > 1.0: return val / 100.0
                return val
            except: return 0.0
        if isinstance(v, (int, float)) and v > 1.0:
            return v / 100.0
        return v

class GlobalPricingConfig(BaseModel):
    industries: List[IndustryConfig]
    ad_types: List[AdTypeConfig]
    states: List[StateConfig]
    discounts: DiscountConfig
    currency: str = "USD"
    country_code: Optional[str] = None

# ==================== Admin Schemas ====================

class AdminUserUpdate(BaseModel):
    """Schema for admin updating user."""
    name: Optional[str] = None
    role: Optional[UserRole] = None
    country: Optional[str] = None
    managed_country: Optional[str] = None
    
    @field_validator('role', mode='before')
    @classmethod
    def normalize_role(cls, v: Any) -> Any:
        if isinstance(v, str):
            return v.lower()
        return v


class GeoDataCreate(BaseModel):
    """Schema for creating geographic data."""
    country_code: str = Field(..., min_length=2, max_length=10)
    state_code: Optional[str] = None
    state_name: Optional[str] = None
    land_area_sq_km: float = Field(..., gt=0)
    population: int = Field(..., gt=0)
    density_multiplier: float = Field(default=1.0, gt=0)
    urban_percentage: Optional[float] = Field(None, ge=0, le=100)


class GeoDataResponse(BaseModel):
    """Schema for geographic data response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    country_code: str
    state_code: Optional[str] = None
    state_name: Optional[str] = None
    land_area_sq_km: float
    population: int
    density_multiplier: float
    urban_percentage: Optional[float] = None
    fips: Optional[int] = None
    density_mi: Optional[float] = None
    rank: Optional[int] = None
    population_percent: Optional[float] = None
    created_at: datetime


# ==================== Generic Responses ====================
class MessageResponse(BaseModel):
    """Generic message response."""
    message: str
    detail: Optional[str] = None


class PaginatedResponse(BaseModel):
    """Generic paginated response."""
    total: int
    page: int
    page_size: int
    items: List[dict]


# ==================== Admin Campaign Approval Schemas ====================
class CampaignSubmitRequest(BaseModel):
    """Schema for submitting a campaign for review."""
    campaign_id: int


class CampaignApprovalAction(BaseModel):
    """Schema for admin approval actions."""
    action: str  # 'approve', 'reject', 'request_changes'
    message: Optional[str] = None  # Required for reject/request_changes


class CampaignApprovalResponse(BaseModel):
    """Schema for campaign approval response."""
    campaign_id: int
    status: str
    message: str
    admin_message: Optional[str] = None
    
    @field_validator('status', mode='before')
    @classmethod
    def status_to_lowercase(cls, v: Any) -> Any:
        if hasattr(v, 'value'):
            return v.value.lower()
        if isinstance(v, str):
            return v.lower()
        return v


class PendingCampaignResponse(BaseModel):
    """Schema for pending campaign list (admin view)."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    name: str
    advertiser_id: int
    advertiser_name: str
    advertiser_email: str
    industry_type: str
    ad_format: Optional[str] = None
    coverage_type: str
    coverage_area: Optional[str] = None
    target_country: Optional[str] = None
    calculated_price: Optional[float] = None
    submitted_at: Optional[datetime] = None
    status: str
    
    @field_validator('status', mode='before')
    @classmethod
    def status_to_lowercase(cls, v: Any) -> Any:
        if hasattr(v, 'value'):
            return v.value.lower()
        if isinstance(v, str):
            return v.lower()
        return v
    
    @field_validator('coverage_type', mode='before')
    @classmethod
    def coverage_to_string(cls, v: Any) -> Any:
        if hasattr(v, 'value'):
            return v.value
        return str(v)


# ==================== Notification Schemas ====================
class NotificationResponse(BaseModel):
    """Schema for notification responses."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    notification_type: str
    title: str
    message: str
    campaign_id: Optional[int] = None
    is_read: bool = False
    created_at: datetime
