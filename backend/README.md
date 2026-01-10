# Advertiser Dashboard Backend API

A comprehensive FastAPI-based backend for an advertising platform with campaign management, dynamic pricing, media uploads, payment processing, and analytics.

## 🚀 Features

- **🔐 Authentication**
  - JWT-based authentication
  - Email/password login
  - Google OAuth integration
  - Role-based access control (Advertiser, Admin)

- **📊 Campaign Management**
  - Create, update, delete campaigns
  - Industry-specific targeting
  - Geographic coverage (30-mile radius, state-wide, country-wide)
  - Campaign status tracking

- **💰 Dynamic Pricing Engine**
  - Industry-based multipliers
  - Coverage area pricing
  - Population density calculations
  - State and national discounts
  - Reach estimation

- **📁 Media Management**
  - File upload with validation
  - Support for images and videos
  - S3 or local storage
  - Admin approval workflow

- **💳 Payment Integration**
  - Stripe Checkout
  - Webhook handling
  - Transaction tracking
  - Campaign payment workflow

- **📈 Analytics**
  - Impressions and clicks tracking
  - Click-through rate (CTR) calculation
  - Campaign performance metrics
  - User summary statistics

- **⚙️ Admin Controls**
  - User management
  - Pricing matrix configuration
  - Campaign oversight
  - Geographic data management
  - System statistics

## 📋 Prerequisites

- Python 3.11+
- PostgreSQL 13+
- (Optional) Redis for caching
- (Optional) AWS S3 for media storage
- Stripe account for payments

## 🛠️ Installation

### Local Development

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Set up database**
   ```bash
   # Create PostgreSQL database
   createdb adplatform_db
   
   # Initialize and seed database
   python scripts/init_db.py
   ```

6. **Run development server**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Docker Development

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

2. **Access the application**
   - API: http://localhost:8000
   - Docs: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

## 📚 API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Test Credentials

After running `init_db.py`:

**Admin:**
- Email: `admin@adplatform.com`
- Password: `admin123`

**Advertiser:**
- Email: `advertiser@test.com`
- Password: `test123`

## 🔑 Environment Variables

Key environment variables (see `.env.example` for complete list):

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/adplatform_db

# JWT
SECRET_KEY=your-super-secret-key-change-this
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# File Storage
USE_S3=False
UPLOAD_DIR=./uploads
```

## 📁 Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Configuration settings
│   ├── database.py          # Database connection
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── auth.py              # Authentication utilities
│   ├── pricing.py           # Dynamic pricing engine
│   ├── routers/
│   │   ├── auth.py          # Auth endpoints
│   │   ├── campaigns.py     # Campaign management
│   │   ├── media.py         # Media upload
│   │   ├── pricing.py       # Pricing calculations
│   │   ├── analytics.py     # Analytics endpoints
│   │   ├── admin.py         # Admin controls
│   │   └── payment.py       # Payment processing
│   └── utils/
│       └── file_upload.py   # File handling utilities
├── scripts/
│   └── init_db.py           # Database initialization
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

## 🚢 Deployment

### Railway

1. **Create new project on Railway**
2. **Add PostgreSQL database**
3. **Configure environment variables**
4. **Deploy from GitHub or CLI**

```bash
railway login
railway up
```

### Digital Ocean

1. **Create App Platform app**
2. **Connect repository**
3. **Add PostgreSQL managed database**
4. **Set environment variables**
5. **Deploy**

### Docker

```bash
# Build image
docker build -t adplatform-api .

# Run container
docker run -p 8000:8000 \
  -e DATABASE_URL=postgresql://... \
  -e SECRET_KEY=... \
  adplatform-api
```

## 🧪 Testing

```bash
# Run tests (if implemented)
pytest

# Run with coverage
pytest --cov=app
```

## 📊 Database Migrations

For production, use Alembic for database migrations:

```bash
# Initialize Alembic
alembic init alembic

# Create migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head
```

## 🔒 Security

- JWT tokens for authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation with Pydantic
- CORS configuration
- Rate limiting (recommended for production)
- SQL injection protection (SQLAlchemy ORM)

## 🤝 API Endpoints Overview

### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login with credentials
- `GET /auth/google/login` - Google OAuth flow
- `POST /auth/logout` - Logout
- `GET /auth/me` - Get current user

### Campaigns
- `POST /campaigns/create` - Create campaign
- `GET /campaigns/list` - List campaigns
- `GET /campaigns/{id}` - Get campaign details
- `PUT /campaigns/{id}` - Update campaign
- `DELETE /campaigns/{id}` - Delete campaign

### Media
- `POST /media/upload` - Upload media file
- `GET /media/campaign/{id}` - Get campaign media
- `DELETE /media/{id}` - Delete media
- `POST /media/{id}/approve` - Approve/reject media (Admin)

### Pricing
- `POST /pricing/calculate` - Calculate pricing
- `GET /pricing/admin/matrix` - Get pricing matrix (Admin)
- `POST /pricing/admin/matrix` - Create pricing entry (Admin)

### Analytics
- `GET /analytics/campaign/{id}` - Campaign analytics
- `GET /analytics/user/summary` - User summary

### Admin
- `GET /admin/users` - List all users
- `GET /admin/campaigns` - List all campaigns
- `GET /admin/stats` - System statistics

### Payment
- `POST /payment/create-checkout-session` - Create Stripe checkout
- `POST /payment/webhook` - Stripe webhook handler

## 📝 License

MIT License - feel free to use this project for your own purposes.

## 👨‍💻 Author

Built with ❤️ using FastAPI

---

**Need help?** Check the [API documentation](http://localhost:8000/docs) or open an issue.
