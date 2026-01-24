"""
Pydantic schemas for request/response validation.
Ensures type-safe data validation and serialization.
"""
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime, date
from enum import Enum


# ==================== Enums ====================
class UserRole(str, Enum):
    ADVERTISER = "advertiser"
    USER = "user"
    ADMIN = "admin"



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
    id: int
    name: str
    email: EmailStr
    role: UserRole
    country: Optional[str]
    industry: Optional[str]
    profile_picture: Optional[str]
    created_at: datetime
    last_login: Optional[datetime]
    
    class Config:
        from_attributes = True


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
    
    @validator('status', pre=True)
    def normalize_status(cls, v):
        if isinstance(v, str):
            return v.upper()
        return v
    
    @validator('end_date')
    def end_date_after_start(cls, v, values):
        if v and 'start_date' in values and v <= values['start_date']:
            raise ValueError('end_date must be after start_date')
        return v
    
    @validator('duration')
    def validate_dates_and_duration(cls, v, values):
        if not v and not values.get('end_date'):
            raise ValueError('Either end_date or duration must be provided')
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
    
    @validator('status', pre=True)
    def normalize_status(cls, v):
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
    id: int
    advertiser_id: int
    name: str
    industry_type: str
    start_date: date
    end_date: date
    budget: float
    calculated_price: Optional[float]
    status: str
    coverage_type: CoverageType
    coverage_area: Optional[str]
    target_postcode: Optional[str]
    target_state: Optional[str]
    target_country: Optional[str]
    impressions: int
    clicks: int
    ctr: float
    description: Optional[str]
    headline: Optional[str]
    landing_page_url: Optional[str]
    ad_format: Optional[str]
    tags: Optional[List[str]]
    created_at: datetime
    updated_at: Optional[datetime]
    # Admin approval fields
    submitted_at: Optional[datetime] = None
    admin_message: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    
    @validator('status', pre=True)
    def status_to_lowercase(cls, v):
        if hasattr(v, 'value'):
            return v.value.lower()
        if isinstance(v, str):
            return v.lower()
        return v
    
    class Config:
        from_attributes = True


# ==================== Media Schemas ====================
class MediaUploadResponse(BaseModel):
    """Schema for media upload response."""
    id: int
    campaign_id: int
    file_path: str
    file_type: str
    file_size: int
    mime_type: Optional[str]
    width: Optional[int]
    height: Optional[int]
    approved_status: MediaApprovalStatus
    uploaded_at: datetime
    
    class Config:
        from_attributes = True


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
    id: int
    industry_type: str
    advert_type: str
    coverage_type: CoverageType
    base_rate: float
    multiplier: float
    state_discount: float
    national_discount: float
    country_id: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


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
    
    @validator('status', pre=True)
    def status_to_lowercase(cls, v):
        if hasattr(v, 'value'):
            return v.value.lower()
        if isinstance(v, str):
            return v.lower()
        return v


# ==================== Pricing Multi-Config Schemas ====================
class IndustryConfig(BaseModel):
    name: str
    multiplier: float

class AdTypeConfig(BaseModel):
    name: str
    base_rate: float

class StateConfig(BaseModel):
    name: str
    land_area: float
    population: int
    density_multiplier: float
    state_code: Optional[str] = None
    country_code: str = "US"

class DiscountConfig(BaseModel):
    state: float
    national: float

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
    id: int
    country_code: str
    state_code: Optional[str]
    state_name: Optional[str]
    land_area_sq_km: float
    population: int
    density_multiplier: float
    urban_percentage: Optional[float]
    created_at: datetime
    
    class Config:
        from_attributes = True


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
    
    @validator('status', pre=True)
    def status_to_lowercase(cls, v):
        if hasattr(v, 'value'):
            return v.value.lower()
        if isinstance(v, str):
            return v.lower()
        return v


class PendingCampaignResponse(BaseModel):
    """Schema for pending campaign list (admin view)."""
    id: int
    name: str
    advertiser_id: int
    advertiser_name: str
    advertiser_email: str
    industry_type: str
    ad_format: Optional[str]
    coverage_type: str
    coverage_area: Optional[str]
    target_country: Optional[str]
    calculated_price: Optional[float]
    submitted_at: Optional[datetime]
    status: str
    
    class Config:
        from_attributes = True

    @validator('status', pre=True)
    def status_to_lowercase(cls, v):
        if hasattr(v, 'value'):
            return v.value.lower()
        if isinstance(v, str):
            return v.lower()
        return v
    
    @validator('coverage_type', pre=True)
    def coverage_to_string(cls, v):
        if hasattr(v, 'value'):
            return v.value
        return str(v)


# ==================== Notification Schemas ====================
class NotificationType(str, Enum):
    CAMPAIGN_APPROVED = "campaign_approved"
    CAMPAIGN_REJECTED = "campaign_rejected"
    CHANGES_REQUIRED = "changes_required"
    CAMPAIGN_SUBMITTED = "campaign_submitted"
    SYSTEM = "system"


class NotificationResponse(BaseModel):
    """Schema for notification responses."""
    id: int
    notification_type: NotificationType
    title: str
    message: str
    campaign_id: Optional[int]
    is_read: bool
    created_at: datetime
    
    class Config:
        from_attributes = True
