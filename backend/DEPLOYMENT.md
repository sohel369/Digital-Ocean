# Deployment Guide

Complete guide for deploying the Advertiser Dashboard Backend to various platforms.

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] PostgreSQL database (managed or self-hosted)
- [ ] Stripe account with API keys
- [ ] (Optional) Google OAuth credentials
- [ ] (Optional) AWS S3 bucket for media storage
- [ ] Environment variables configured
- [ ] Secret key generated (use: `openssl rand -hex 32`)

---

## 🚂 Railway Deployment

Railway provides the easiest deployment with automatic PostgreSQL provisioning.

### Steps:

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   # or
   brew install railway
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Initialize Project**
   ```bash
   cd backend
   railway init
   ```

4. **Add PostgreSQL Database**
   ```bash
   railway add postgresql
   ```

5. **Set Environment Variables**
   ```bash
   railway variables set SECRET_KEY=$(openssl rand -hex 32)
   railway variables set STRIPE_SECRET_KEY=sk_test_your_key
   railway variables set GOOGLE_CLIENT_ID=your_client_id
   railway variables set GOOGLE_CLIENT_SECRET=your_client_secret
   ```

6. **Deploy**
   ```bash
   railway up
   ```

7. **Get Deployment URL**
   ```bash
   railway domain
   ```

8. **Initialize Database**
   ```bash
   railway run python scripts/init_db.py
   ```

### Configuration

The `railway.toml` file is already configured:
```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "uvicorn app.main:app --host 0.0.0.0 --port $PORT"
```

---

## 🌊 Digital Ocean App Platform

Digital Ocean provides managed container deployment.

### Steps:

1. **Create App**
   - Go to Digital Ocean App Platform
   - Connect your GitHub repository
   - Select the `backend` directory

2. **Configure Build**
   - **Build Command**: (Auto-detected from Dockerfile)
   - **Run Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

3. **Add Database**
   - Create PostgreSQL managed database
   - Note connection string

4. **Set Environment Variables**
   ```
   DATABASE_URL=postgresql://user:pass@host:port/db
   SECRET_KEY=your-secret-key
   STRIPE_SECRET_KEY=sk_test_your_key
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   DEBUG=False
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for build and deployment

6. **Initialize Database**
   - Use DO Console or:
   ```bash
   doctl apps exec <app-id> -- python scripts/init_db.py
   ```

---

## 🟣 Heroku Deployment

### Steps:

1. **Install Heroku CLI**
   ```bash
   brew install heroku/brew/heroku
   # or download from heroku.com
   ```

2. **Login**
   ```bash
   heroku login
   ```

3. **Create App**
   ```bash
   cd backend
   heroku create your-app-name
   ```

4. **Add PostgreSQL**
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```

5. **Set Environment Variables**
   ```bash
   heroku config:set SECRET_KEY=$(openssl rand -hex 32)
   heroku config:set STRIPE_SECRET_KEY=sk_test_your_key
   heroku config:set GOOGLE_CLIENT_ID=your_client_id
   heroku config:set GOOGLE_CLIENT_SECRET=your_client_secret
   heroku config:set DEBUG=False
   ```

6. **Deploy**
   ```bash
   git push heroku main
   ```

7. **Initialize Database**
   ```bash
   heroku run python scripts/init_db.py
   ```

The `Procfile` is already configured:
```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 4
```

---

## 🐳 Docker Deployment (VPS/Cloud)

Deploy using Docker on any VPS (AWS EC2, DigitalOcean Droplet, etc.)

### Steps:

1. **SSH into Server**
   ```bash
   ssh user@your-server-ip
   ```

2. **Install Docker & Docker Compose**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo apt install docker-compose
   ```

3. **Clone Repository**
   ```bash
   git clone https://github.com/your-repo/adplatform.git
   cd adplatform/backend
   ```

4. **Configure Environment**
   ```bash
   cp .env.example .env
   nano .env  # Edit with your credentials
   ```

5. **Build and Run**
   ```bash
   docker-compose up -d --build
   ```

6. **Check Status**
   ```bash
   docker-compose ps
   docker-compose logs -f api
   ```

7. **Initialize Database**
   ```bash
   docker-compose exec api python scripts/init_db.py
   ```

### Nginx Reverse Proxy (Recommended)

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### SSL with Certbot

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

---

## ☁️ AWS Deployment

### Using AWS Elastic Beanstalk

1. **Install EB CLI**
   ```bash
   pip install awsebcli
   ```

2. **Initialize**
   ```bash
   cd backend
   eb init -p docker your-app-name
   ```

3. **Create Environment**
   ```bash
   eb create production-env
   ```

4. **Set Environment Variables**
   ```bash
   eb setenv SECRET_KEY=your-secret \
             DATABASE_URL=postgresql://... \
             STRIPE_SECRET_KEY=sk_test_...
   ```

5. **Deploy**
   ```bash
   eb deploy
   ```

### Using AWS ECS (Fargate)

1. Build and push Docker image to ECR
2. Create ECS cluster
3. Define task definition
4. Create service with load balancer
5. Configure environment variables

---

## 🔧 Post-Deployment Configuration

### 1. **Stripe Webhook**

Configure Stripe webhook in Stripe Dashboard:
- **URL**: `https://your-domain.com/payment/webhook`
- **Events**: 
  - `checkout.session.completed`
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`

### 2. **Google OAuth**

Update Google Cloud Console:
- **Authorized redirect URIs**: 
  - `https://your-domain.com/auth/google/callback`

### 3. **CORS Origins**

Update `CORS_ORIGINS` environment variable:
```
CORS_ORIGINS=["https://your-frontend.com","https://www.your-frontend.com"]
```

### 4. **S3 Setup (Optional)**

If using S3 for media storage:
1. Create S3 bucket
2. Configure bucket policy for public read
3. Set environment variables:
   ```
   USE_S3=True
   AWS_ACCESS_KEY_ID=your-key
   AWS_SECRET_ACCESS_KEY=your-secret
   S3_BUCKET_NAME=your-bucket
   ```

---

## 🔒 Production Security Checklist

- [ ] Set `DEBUG=False`
- [ ] Use strong `SECRET_KEY` (32+ characters)
- [ ] Enable HTTPS (SSL/TLS)
- [ ] Configure CORS properly
- [ ] Use managed database with backups
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Enable rate limiting
- [ ] Use environment variables for secrets
- [ ] Regular security updates
- [ ] Database connection pooling configured
- [ ] Implement proper logging
- [ ] Set up health checks

---

## 📊 Monitoring & Logging

### Sentry Integration

```python
# Add to requirements.txt
sentry-sdk[fastapi]==1.40.0

# Add to app/main.py
import sentry_sdk

sentry_sdk.init(
    dsn="your-sentry-dsn",
    traces_sample_rate=1.0,
)
```

### Database Monitoring

```bash
# Check connection pool
SELECT * FROM pg_stat_activity;

# Monitor slow queries
SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;
```

### Application Metrics

Use tools like:
- **New Relic** - Application performance monitoring
- **Datadog** - Infrastructure & application monitoring
- **Prometheus + Grafana** - Custom metrics

---

## 🔄 Database Migrations (Alembic)

For production, use Alembic for database migrations:

```bash
# Install Alembic
pip install alembic

# Initialize
alembic init alembic

# Configure alembic.ini with your DATABASE_URL

# Create migration
alembic revision --autogenerate -m "Initial migration"

# Apply migration
alembic upgrade head
```

---

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL

# Check environment variable
echo $DATABASE_URL
```

### Application Won't Start

```bash
# Check logs
docker-compose logs api
# or
heroku logs --tail
# or
railway logs
```

### Port Already in Use

```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9
```

### Stripe Webhook Not Working

- Verify webhook secret
- Check webhook endpoint URL
- Test with Stripe CLI: `stripe listen --forward-to localhost:8000/payment/webhook`

---

## 📞 Support

For issues or questions:
1. Check logs first
2. Verify environment variables
3. Test locally with `start.bat` or `start.sh`
4. Review API documentation at `/docs`

---

## 🎉 Success!

Your API should now be live at your deployment URL!

- **API Root**: `https://your-domain.com/`
- **Documentation**: `https://your-domain.com/docs`
- **Health Check**: `https://your-domain.com/health`
