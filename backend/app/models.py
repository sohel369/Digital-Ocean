"""
Database models for Advertiser Dashboard.
Defines SQLAlchemy ORM models for all entities.
"""
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Boolean, 
    ForeignKey, Enum, Text, Date, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum
from .database import Base


class UserRole(str, enum.Enum):
    """User role enumeration."""
    ADVERTISER = "advertiser"
    USER = "user"
    ADMIN = "admin"



class CampaignStatus(str, enum.Enum):
    """Campaign status enumeration."""
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    PENDING_REVIEW = "PENDING_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CHANGES_REQUIRED = "CHANGES_REQUIRED"
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"
    # Legacy alias for compatibility
    PENDING = "PENDING"


class MediaApprovalStatus(str, enum.Enum):
    """Media approval status enumeration."""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class CoverageType(str, enum.Enum):
    """Coverage type for campaigns."""
    RADIUS_30 = "30-mile"
    STATE = "state"
    COUNTRY = "country"


class User(Base):
    """User model for authentication and profile management."""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=True)  # Nullable for OAuth users
    role = Column(Enum(UserRole), default=UserRole.ADVERTISER, nullable=False)
    country = Column(String(100), nullable=True)
    industry = Column(String(255), nullable=True)
    
    # OAuth fields
    oauth_provider = Column(String(50), nullable=True)  # 'google', 'facebook', etc.
    oauth_id = Column(String(255), nullable=True)
    profile_picture = Column(String(500), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    campaigns = relationship("Campaign", back_populates="advertiser", cascade="all, delete-orphan", foreign_keys="Campaign.advertiser_id")
    reviewed_campaigns = relationship("Campaign", back_populates="reviewer", foreign_keys="Campaign.reviewed_by")
    
    def __repr__(self):
        return f"<User {self.email} ({self.role})>"


class Campaign(Base):
    """Campaign model for ad campaigns."""
    __tablename__ = "campaigns"
    
    id = Column(Integer, primary_key=True, index=True)
    advertiser_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Campaign details
    name = Column(String(255), nullable=False)
    industry_type = Column(String(100), nullable=False)  # e.g., 'retail', 'healthcare', 'tech'
    
    # Schedule
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    
    # Budget & Pricing
    budget = Column(Float, nullable=False)
    calculated_price = Column(Float, nullable=True)  # Calculated by pricing engine
    
    # Status
    status = Column(Enum(CampaignStatus), default=CampaignStatus.DRAFT, nullable=False)
    
    # Geographic targeting
    coverage_type = Column(Enum(CoverageType), nullable=False)
    coverage_area = Column(String(255), nullable=True)  # Human-readable description
    target_postcode = Column(String(20), nullable=True)  # For radius targeting
    target_state = Column(String(100), nullable=True)  # For state targeting
    target_country = Column(String(100), nullable=True)  # For country targeting
    
    # Analytics placeholders
    impressions = Column(Integer, default=0)
    clicks = Column(Integer, default=0)
    
    # Creative details
    headline = Column(String(500), nullable=True)
    landing_page_url = Column(String(500), nullable=True)
    ad_format = Column(String(100), nullable=True) # e.g., 'Leaderboard', 'Mobile Banner'
    
    # Metadata
    description = Column(Text, nullable=True)
    tags = Column(JSON, nullable=True)  # Store as JSON array
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    submitted_at = Column(DateTime(timezone=True), nullable=True)  # When submitted for review
    
    # Admin Review Fields
    admin_message = Column(Text, nullable=True)  # Feedback from admin (for rejections/changes)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # Admin who reviewed
    reviewed_at = Column(DateTime(timezone=True), nullable=True)  # When reviewed
    
    # Relationships
    advertiser = relationship("User", back_populates="campaigns", foreign_keys=[advertiser_id])
    reviewer = relationship("User", back_populates="reviewed_campaigns", foreign_keys=[reviewed_by])
    media_files = relationship("Media", back_populates="campaign", cascade="all, delete-orphan")
    
    @property
    def ctr(self) -> float:
        """Calculate Click-Through Rate."""
        if self.impressions == 0:
            return 0.0
        return (self.clicks / self.impressions) * 100
    
    def __repr__(self):
        return f"<Campaign {self.name} ({self.status})>"


class Media(Base):
    """Media files associated with campaigns."""
    __tablename__ = "media"
    
    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=False)
    
    # File information
    file_path = Column(String(500), nullable=False)  # Local path or S3 URL
    file_type = Column(String(50), nullable=False)  # 'image', 'video', 'document'
    file_size = Column(Integer, nullable=False)  # Size in bytes
    mime_type = Column(String(100), nullable=True)
    
    # Validation metadata
    width = Column(Integer, nullable=True)  # For images/videos
    height = Column(Integer, nullable=True)
    duration = Column(Integer, nullable=True)  # For videos (seconds)
    
    # Approval workflow
    approved_status = Column(Enum(MediaApprovalStatus), default=MediaApprovalStatus.PENDING)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    
    # Timestamps
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    campaign = relationship("Campaign", back_populates="media_files")
    
    def __repr__(self):
        return f"<Media {self.file_type} for Campaign {self.campaign_id}>"


class PricingMatrix(Base):
    """Dynamic pricing configuration."""
    __tablename__ = "pricing_matrix"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Targeting criteria
    industry_type = Column(String(100), nullable=False)  # 'retail', 'healthcare', etc.
    advert_type = Column(String(100), nullable=False)  # 'display', 'video', 'sponsored'
    coverage_type = Column(Enum(CoverageType), nullable=False)
    
    # Pricing parameters
    base_rate = Column(Float, nullable=False)  # Base cost in currency
    multiplier = Column(Float, default=1.0)  # Industry-specific multiplier
    
    # Geographic adjustments
    state_discount = Column(Float, default=0.0)  # Percentage discount for state-wide
    national_discount = Column(Float, default=0.0)  # Percentage discount for country-wide
    country_id = Column(String(100), nullable=True)  # ISO country code (e.g., 'US', 'CA')
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<PricingMatrix {self.industry_type} - {self.coverage_type}>"


class GeoData(Base):
    """Geographic data for pricing calculations."""
    __tablename__ = "geodata"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Location identifiers
    country_code = Column(String(10), nullable=False)  # ISO code
    state_code = Column(String(10), nullable=True)  # State/province code
    state_name = Column(String(100), nullable=True)
    
    # Geographic metrics
    land_area_sq_km = Column(Float, nullable=False)  # Total area
    population = Column(Integer, nullable=False)
    density_multiplier = Column(Float, default=1.0)  # Population density factor
    
    # Urban/Rural split (optional)
    urban_percentage = Column(Float, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<GeoData {self.state_name or self.country_code}>"


class PaymentTransaction(Base):
    """Payment transaction records."""
    __tablename__ = "payment_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Stripe transaction details
    stripe_payment_intent_id = Column(String(255), unique=True, nullable=False)
    stripe_charge_id = Column(String(255), nullable=True)
    
    # Payment details
    amount = Column(Float, nullable=False)  # Total amount
    currency = Column(String(10), default="USD")
    status = Column(String(50), nullable=False)  # 'pending', 'succeeded', 'failed'
    
    # Metadata
    payment_method = Column(String(50), nullable=True)
    receipt_url = Column(String(500), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    def __repr__(self):
        return f"<Payment {self.stripe_payment_intent_id} - {self.status}>"


class NotificationType(str, enum.Enum):
    """Notification type enumeration."""
    CAMPAIGN_APPROVED = "campaign_approved"
    CAMPAIGN_REJECTED = "campaign_rejected"
    CHANGES_REQUIRED = "changes_required"
    CAMPAIGN_SUBMITTED = "campaign_submitted"
    SYSTEM = "system"


class Notification(Base):
    """User notifications for campaign status updates and admin actions."""
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=True)
    
    # Notification content
    notification_type = Column(Enum(NotificationType), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    
    # Read status
    is_read = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    read_at = Column(DateTime(timezone=True), nullable=True)
    
    def __repr__(self):
        return f"<Notification {self.title} for User {self.user_id}>"
