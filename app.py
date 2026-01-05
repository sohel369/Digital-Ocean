import os
import secrets
from datetime import datetime, timedelta
from flask import Flask, jsonify, request, session, url_for, send_from_directory, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from models import db, User, Campaign, Target, Pricing, Billing, Analytics, Notification

# --- Flask Server Initialization ---
app = Flask(__name__, static_folder='dist', static_url_path='/')

# SECURITY CONFIGURATION
app.config['SECRET_KEY'] = 'super-secret-terminal-key-2024'
app.config['JWT_SECRET_KEY'] = 'jwt-secret-key-999'

# Database configuration - Use /tmp for Vercel compatibility
if os.environ.get('VERCEL'):
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:////tmp/terminal_dashboard.db'
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///terminal_dashboard.db'

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
if os.environ.get('VERCEL'):
    app.config['UPLOAD_FOLDER'] = '/tmp/uploads'
else:
    app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB limit

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Enable CORS for frontend
CORS(app, supports_credentials=True, origins=["*"])

# Initialize Database
db.init_app(app)

# Initialize JWT Manager
jwt = JWTManager(app)

# Initialize Login Manager
login_manager = LoginManager()
login_manager.init_app(app)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# --- Database Setup & Seeding ---
with app.app_context():
    db.create_all()
    # Seed a default admin
    if not User.query.filter_by(username='admin').first():
        admin = User(
            username='admin', 
            email='admin@adplatform.com', 
            password_hash=generate_password_hash('admin123'),
            role='admin'
        )
        db.session.add(admin)
        db.session.commit()
        
        # Initial stats for admin
        n = Notification(user_id=admin.id, title="System Init", message="Backend operational.")
        db.session.add(n)
        db.session.commit()

# --- Auth API Routes ---

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json

    if User.query.filter(User.username.ilike(data.get('username'))).first():
        return jsonify({"success": False, "message": "Username taken"}), 400
    
    if User.query.filter(User.email.ilike(data.get('email'))).first():
        return jsonify({"success": False, "message": "Email already registered"}), 400
    
    new_user = User(
        username=data.get('username'),
        email=data.get('email'),
        password_hash=generate_password_hash(data.get('password')),
        role=data.get('role', 'advertiser')
    )
    db.session.add(new_user)
    db.session.commit()
    
    # Create billing record
    billing = Billing(user_id=new_user.id)
    db.session.add(billing)
    db.session.commit()
    
    return jsonify({"success": True, "message": "User registered"}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    # Case-insensitive lookup
    user = User.query.filter(User.username.ilike(username)).first()
    
    if user and check_password_hash(user.password_hash, password):
        login_user(user, remember=True)
        # Generate JWT for token-based clients
        access_token = create_access_token(identity=user.id)
        return jsonify({
            "success": True, 
            "user": user.to_dict(),
            "token": access_token
        })
    return jsonify({"success": False, "message": "Invalid credentials"}), 401

@app.route('/api/google-auth', methods=['POST'])
def google_auth():
    data = request.json
    email = data.get('email')
    username = data.get('username')
    
    if not email:
        return jsonify({"success": False, "message": "Email is required"}), 400
        
    user = User.query.filter(User.email.ilike(email)).first()
    
    if not user:
        # Create new user for social login
        user = User(
            username=username,
            email=email,
            password_hash=generate_password_hash(secrets.token_hex(16)),
            role='advertiser'
        )
        db.session.add(user)
        db.session.commit()
        
        # Create billing record
        billing = Billing(user_id=user.id)
        db.session.add(billing)
        db.session.commit()
        
    login_user(user, remember=True)
    access_token = create_access_token(identity=user.id)
    
    return jsonify({
        "success": True, 
        "user": user.to_dict(),
        "token": access_token
    })

@app.route('/api/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({"success": True, "message": "Logged out"})

@app.route('/api/user', methods=['GET'])
@login_required
def get_user_info():
    return jsonify(current_user.to_dict())

# --- Campaign Management API Routes ---

@app.route('/api/campaigns', methods=['GET'])
@login_required
def list_campaigns():
    # If admin, show all, if advertiser, show theirs
    if current_user.role == 'admin':
        campaigns = Campaign.query.all()
    else:
        campaigns = Campaign.query.filter_by(user_id=current_user.id).all()
    return jsonify([c.to_dict() for c in campaigns])

@app.route('/api/campaigns', methods=['POST'])
@login_required
def create_campaign():
    data = request.json
    meta = data.get('meta', {})
    
    new_campaign = Campaign(
        user_id=current_user.id,
        name=data.get('name'),
        budget=float(data.get('budget', 0)),
        status='review',
        start_date=data.get('startDate', datetime.now().strftime('%Y-%m-%d')),
        ad_format=data.get('ad_format', 'display'),
        headline=data.get('headline', ''),
        description=data.get('description', ''),
        media_url=data.get('image'),
        industry=meta.get('industry', 'Tyres and wheels'),
        coverage_area=meta.get('coverage', 'radius')
    )
    db.session.add(new_campaign)
    db.session.commit()
    
    # Add targeting based on frontend meta
    location = meta.get('location', '')
    target = Target(
        campaign_id=new_campaign.id, 
        city=location if meta.get('coverage') == 'state' else 'Radius Area',
        postcode=location if meta.get('coverage') == 'radius' else '',
        radius=30 if meta.get('coverage') == 'radius' else 0
    )
    db.session.add(target)
    
    # Add initial pricing
    pricing = Pricing(campaign_id=new_campaign.id, base_fee=100.0, total=new_campaign.budget)
    db.session.add(pricing)
    
    # Add a notification for the user
    notif = Notification(
        user_id=current_user.id,
        type='approval',
        title="Campaign Submitted",
        message=f"'{new_campaign.name}' is now under review by Rule 7 AdOps.",
        time="Just now"
    )
    db.session.add(notif)
    
    db.session.commit()
    return jsonify(new_campaign.to_dict()), 201

@app.route('/api/campaigns/<int:id>', methods=['PUT'])
@login_required
def edit_campaign(id):
    campaign = Campaign.query.get_or_404(id)
    if campaign.user_id != current_user.id and current_user.role != 'admin':
        return jsonify({"error": "Unauthorized"}), 403
    
    data = request.json
    campaign.name = data.get('name', campaign.name)
    campaign.budget = float(data.get('budget', campaign.budget))
    campaign.status = data.get('status', campaign.status)
    campaign.headline = data.get('headline', campaign.headline)
    campaign.description = data.get('description', campaign.description)
    
    db.session.commit()
    return jsonify(campaign.to_dict())

@app.route('/api/campaigns/<int:id>', methods=['DELETE'])
@login_required
def delete_campaign(id):
    campaign = Campaign.query.get_or_404(id)
    if campaign.user_id != current_user.id and current_user.role != 'admin':
        return jsonify({"error": "Unauthorized"}), 403
    
    db.session.delete(campaign)
    db.session.commit()
    return jsonify({"success": True})

# --- Geo-Targeting API Routes ---

@app.route('/api/campaigns/<int:id>/target', methods=['GET', 'POST'])
@login_required
def campaign_target(id):
    campaign = Campaign.query.get_or_404(id)
    if request.method == 'POST':
        data = request.json
        target = Target.query.filter_by(campaign_id=id).first()
        if not target:
            target = Target(campaign_id=id)
            db.session.add(target)
        
        target.city = data.get('city', target.city)
        target.postcode = data.get('postcode', target.postcode)
        target.radius = data.get('radius', target.radius)
        db.session.commit()
        return jsonify(target.to_dict())
    
    target = Target.query.filter_by(campaign_id=id).first()
    return jsonify(target.to_dict() if target else {})

# --- Pricing & Billing API Routes ---

@app.route('/api/campaigns/<int:id>/pricing', methods=['GET'])
@login_required
def get_pricing(id):
    pricing = Pricing.query.filter_by(campaign_id=id).first_or_404()
    return jsonify(pricing.to_dict())

@app.route('/api/payments/checkout', methods=['POST'])
@login_required
def checkout():
    # Mocking a payment checkout process
    data = request.json
    return jsonify({
        "success": True, 
        "checkout_url": "https://checkout.stripe.com/mock-session",
        "message": "Redirecting to secure gateway..."
    })

@app.route('/api/payments/history', methods=['GET'])
@login_required
def payment_history():
    return jsonify([
        {"id": 1, "date": "2024-11-20", "amount": 500.0, "status": "paid"},
        {"id": 2, "date": "2024-12-05", "amount": 1200.0, "status": "paid"}
    ])

# --- Analytics API Routes ---

@app.route('/api/campaigns/<int:id>/analytics', methods=['GET'])
@login_required
def get_analytics(id):
    campaign = Campaign.query.get_or_404(id)
    # Generate some mock daily stats if none exist
    if not campaign.analytics:
        for i in range(7):
            day = datetime.now() - timedelta(days=i)
            stat = Analytics(
                campaign_id=id,
                date=day,
                impressions=secrets.randbelow(10000) + 5000,
                clicks=secrets.randbelow(500) + 100,
                ctr=2.5,
                budget_used=50.0,
                device_mobile=60,
                device_desktop=30,
                device_tablet=10
            )
            db.session.add(stat)
        db.session.commit()
    
    return jsonify([a.to_dict() for a in campaign.analytics])

@app.route('/api/stats', methods=['GET'])
@login_required
def global_stats():
    # Helper for the main dashboard dashboard
    campaigns = Campaign.query.filter_by(user_id=current_user.id).all()
    total_spend = sum([c.budget for c in campaigns if c.status == 'live'])
    
    return jsonify({
        'totalSpend': total_spend,
        'impressions': 1240000,
        'ctr': 3.5,
        'budgetRemaining': 50000 - total_spend,
        'count': len(campaigns)
    })

# --- Notification Routes ---

@app.route('/api/notifications', methods=['GET'])
@login_required
def get_notifications():
    notifs = Notification.query.filter_by(user_id=current_user.id).order_by(Notification.id.desc()).all()
    return jsonify([n.to_dict() for n in notifs])

# --- Upload Support ---

@app.route('/api/upload', methods=['POST'])
@login_required
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    filename = secure_filename(file.filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)
    
    return jsonify({
        "success": True, 
        "url": url_for('static', filename=f'uploads/{filename}', _external=True)
    })

# --- UI Routes (Manual/Admin Views) ---

@app.route('/view/login')
def login_view():
    return render_template('login.html')

@app.route('/view/dashboard')
@login_required
def dashboard_view():
    return render_template('index.html')

# --- Status / Root ---

@app.route('/api/status')
def api_status():
    return jsonify({
        "status": "online",
        "api": "AdPlatform V2",
        "auth": "Enabled (JWT & Session)"
    })

# Catch-all route for React SPA
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(debug=True, port=8000)
