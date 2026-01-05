from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model, UserMixin):
    """
    User model for authentication and role-based access.
    - roles: 'admin' or 'advertiser'
    """
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='advertiser') # 'admin' or 'advertiser'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    campaigns = db.relationship('Campaign', backref='owner', lazy=True)
    billing = db.relationship('Billing', backref='user', lazy=True, uselist=False)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'created_at': self.created_at.isoformat()
        }

class Campaign(db.Model):
    """
    Campaign model with creative details and performance metrics.
    """
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    budget = db.Column(db.Float, default=0.0)
    status = db.Column(db.String(20), default='draft') # 'live', 'review', 'draft', 'paused'
    start_date = db.Column(db.String(50))
    
    # Creative & Business Fields
    ad_format = db.Column(db.String(50)) # 'display', 'video', 'social'
    headline = db.Column(db.String(200))
    description = db.Column(db.Text)
    media_url = db.Column(db.String(255))
    industry = db.Column(db.String(100))
    coverage_area = db.Column(db.String(50)) # 'radius', 'state', 'national'
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    target = db.relationship('Target', backref='campaign', uselist=False, cascade="all, delete-orphan")
    pricing = db.relationship('Pricing', backref='campaign', uselist=False, cascade="all, delete-orphan")
    analytics = db.relationship('Analytics', backref='campaign', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'budget': self.budget,
            'status': self.status,
            'start_date': self.start_date,
            'ad_format': self.ad_format,
            'headline': self.headline,
            'description': self.description,
            'media_url': self.media_url,
            'industry': self.industry,
            'coverage_area': self.coverage_area,
            'created_at': self.created_at.isoformat(),
            'stats': {
                'clicks': 0,
                'ctr': 0.0,
                'impressions': 0
            }
        }

class Target(db.Model):
    """Geo-targeting audience definition."""
    id = db.Column(db.Integer, primary_key=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaign.id'), nullable=False)
    city = db.Column(db.String(100))
    postcode = db.Column(db.String(20))
    radius = db.Column(db.Integer, default=10) # in km

    def to_dict(self):
        return {
            'city': self.city,
            'postcode': self.postcode,
            'radius': self.radius
        }

class Pricing(db.Model):
    """Financial breakdown for a specific campaign."""
    id = db.Column(db.Integer, primary_key=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaign.id'), nullable=False)
    base_fee = db.Column(db.Float, default=0.0)
    radius_cost = db.Column(db.Float, default=0.0)
    discount = db.Column(db.Float, default=0.0)
    total = db.Column(db.Float, default=0.0)

    def to_dict(self):
        return {
            'base_fee': self.base_fee,
            'radius_cost': self.radius_cost,
            'discount': self.discount,
            'total': self.total
        }

class Billing(db.Model):
    """User-level billing and subscription status."""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    amount_due = db.Column(db.Float, default=0.0)
    paid = db.Column(db.Boolean, default=True)
    subscription_duration = db.Column(db.Integer, default=30) # days

class Analytics(db.Model):
    """Performance statistics recorded over time."""
    id = db.Column(db.Integer, primary_key=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaign.id'), nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    impressions = db.Column(db.Integer, default=0)
    clicks = db.Column(db.Integer, default=0)
    ctr = db.Column(db.Float, default=0.0)
    budget_used = db.Column(db.Float, default=0.0)
    
    # Device Split
    device_mobile = db.Column(db.Integer, default=0)
    device_desktop = db.Column(db.Integer, default=0)
    device_tablet = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            'date': self.date.strftime('%Y-%m-%d'),
            'impressions': self.impressions,
            'clicks': self.clicks,
            'ctr': self.ctr,
            'budget_used': self.budget_used,
            'devices': {
                'mobile': self.device_mobile,
                'desktop': self.device_desktop,
                'tablet': self.device_tablet
            }
        }

class Notification(db.Model):
    """System alerts and logs."""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    type = db.Column(db.String(20), default='info')
    title = db.Column(db.String(100))
    message = db.Column(db.String(255))
    time = db.Column(db.String(50), default='Just now')
    read = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            'id': self.id,
            'type': self.type,
            'title': self.title,
            'message': self.message,
            'time': self.time,
            'read': self.read
        }
