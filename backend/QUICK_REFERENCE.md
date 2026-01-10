# Quick Reference Card

Fast reference for common commands and operations.

---

## 🚀 Quick Start

```bash
# Windows
start.bat

# Unix/Mac
chmod +x start.sh && ./start.sh

# Docker
docker-compose up --build
```

---

## 📦 Setup Commands

```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Unix/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Initialize database
python scripts/init_db.py

# Start server
uvicorn app.main:app --reload
```

---

## 🔑 Test Credentials

**Admin:**
- Email: `admin@adplatform.com`
- Password: `admin123`

**Advertiser:**
- Email: `advertiser@test.com`  
- Password: `test123`

---

## 📡 Common API Calls

### Login
```bash
curl -X POST http://localhost:8000/auth/login/json \
  -H "Content-Type: application/json" \
  -d '{"email":"advertiser@test.com","password":"test123"}'
```

### Get Current User
```bash
curl http://localhost:8000/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Campaign
```bash
curl -X POST http://localhost:8000/campaigns/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Campaign",
    "industry_type": "retail",
    "start_date": "2024-06-01",
    "end_date": "2024-08-31",
    "budget": 5000,
    "coverage_type": "state",
    "target_state": "CA",
    "target_country": "US"
  }'
```

### Calculate Pricing
```bash
curl -X POST http://localhost:8000/pricing/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "industry_type": "retail",
    "advert_type": "display",
    "coverage_type": "state",
    "target_state": "CA",
    "duration_days": 90
  }'
```

---

## 🐳 Docker Commands

```bash
# Build and start
docker-compose up --build

# Start in background
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f api

# Execute command in container
docker-compose exec api python scripts/init_db.py

# Rebuild specific service
docker-compose build api

# Remove volumes
docker-compose down -v
```

---

## 🗄️ Database Commands

```bash
# Connect to PostgreSQL
psql $DATABASE_URL

# Or with connection string
psql postgresql://user:pass@localhost:5432/adplatform_db

# Create database
createdb adplatform_db

# Drop database
dropdb adplatform_db

# Backup database
pg_dump adplatform_db > backup.sql

# Restore database
psql adplatform_db < backup.sql
```

### Common SQL Queries

```sql
-- List all users
SELECT id, email, role FROM users;

-- List campaigns
SELECT id, name, status, budget FROM campaigns;

-- Check pricing matrix
SELECT * FROM pricing_matrix;

-- View recent transactions
SELECT * FROM payment_transactions ORDER BY created_at DESC LIMIT 10;
```

---

## 🚂 Railway Commands

```bash
# Login
railway login

# Initialize project
railway init

# Add PostgreSQL
railway add postgresql

# Set environment variable
railway variables set KEY=value

# Deploy
railway up

# View logs
railway logs

# Get deployment URL
railway domain

# Run command in deployed environment
railway run python scripts/init_db.py
```

---

## 🌊 Heroku Commands

```bash
# Login
heroku login

# Create app
heroku create app-name

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Set config
heroku config:set KEY=value

# Deploy
git push heroku main

# View logs
heroku logs --tail

# Run command
heroku run python scripts/init_db.py

# Open app
heroku open
```

---

## 🔍 Debugging

```bash
# Check Python version
python --version

# Check pip packages
pip list

# Check if port is in use
lsof -ti:8000 | xargs kill -9  # Unix
netstat -ano | findstr :8000    # Windows

# Test database connection
python -c "from app.database import engine; engine.connect()"

# View all routes
python -c "from app.main import app; print(app.routes)"
```

---

## 📊 Monitoring

```bash
# Check server health
curl http://localhost:8000/health

# Monitor logs
tail -f app.log

# Check system stats (Admin)
curl http://localhost:8000/admin/stats \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## 🧪 Testing

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=app

# Run specific test
pytest tests/test_auth.py

# Verbose output
pytest -v
```

---

## 🔐 Security

```bash
# Generate secret key
openssl rand -hex 32
python -c "import secrets; print(secrets.token_hex(32))"

# Test Stripe webhook
stripe listen --forward-to localhost:8000/payment/webhook

# Check CORS
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS http://localhost:8000/auth/login
```

---

## 📝 Git Commands

```bash
# Initial setup
git init
git add .
git commit -m "Initial commit"
git branch -M main

# Push to GitHub
git remote add origin https://github.com/user/repo.git
git push -u origin main

# Pull latest
git pull origin main

# Create branch
git checkout -b feature/new-feature

# Merge branch
git checkout main
git merge feature/new-feature
```

---

## 🛠️ Maintenance

```bash
# Update dependencies
pip install --upgrade -r requirements.txt

# Freeze dependencies
pip freeze > requirements.txt

# Clean Python cache
find . -type d -name __pycache__ -exec rm -r {} +
find . -type f -name "*.pyc" -delete

# Clean Docker
docker system prune -a

# Check disk usage
du -sh uploads/
```

---

## 🔧 Environment Variables

**Required:**
```bash
DATABASE_URL=postgresql://user:pass@host:5432/db
SECRET_KEY=your-secret-key
STRIPE_SECRET_KEY=sk_test_...
```

**Optional:**
```bash
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
USE_S3=True
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=...
DEBUG=False
```

---

## 📍 Important URLs

**Local:**
- API: http://localhost:8000
- Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Health: http://localhost:8000/health

**Deployed:**
- Replace `localhost:8000` with your domain

---

## 💡 Pro Tips

1. **Always use virtual environment** for isolated dependencies
2. **Check logs first** when debugging issues
3. **Test locally** before deploying
4. **Use .env files** for environment-specific configs
5. **Run migrations** before deploying database changes
6. **Monitor webhooks** in Stripe dashboard
7. **Set DEBUG=False** in production
8. **Use managed databases** for production
9. **Enable HTTPS** in production
10. **Regular backups** of your database

---

## 🆘 Common Issues

**Issue: Port already in use**
```bash
# Unix
lsof -ti:8000 | xargs kill -9

# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

**Issue: Database connection failed**
```bash
# Check DATABASE_URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL
```

**Issue: Module not found**
```bash
# Reinstall dependencies
pip install -r requirements.txt
```

**Issue: Permission denied**
```bash
# Make script executable
chmod +x start.sh
```

---

## 📚 Documentation

- **README.md** - Getting started
- **API_REFERENCE.md** - All endpoints
- **DEPLOYMENT.md** - Deployment guides
- **PROJECT_SUMMARY.md** - Feature overview

---

**Keep this card handy for quick reference!** 📌
