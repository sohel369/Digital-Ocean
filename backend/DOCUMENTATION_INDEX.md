# 📚 Documentation Index

Welcome to the Advertiser Dashboard Backend Documentation!

This is your central hub for all documentation. Follow the links below to find what you need.

---

## 🚀 Getting Started

**New to the project?** Start here:

1. **[README.md](README.md)** - Project overview, installation, and quick start
2. **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Complete feature list and what's included
3. **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Common commands and quick tips

---

## 📖 Core Documentation

### For Developers

- **[README.md](README.md)** 
  - Project overview
  - Installation instructions
  - Local development setup
  - Environment configuration
  - Test credentials

- **[API_REFERENCE.md](API_REFERENCE.md)**
  - Complete endpoint documentation
  - Request/response examples
  - Authentication guide
  - Error handling

- **[ARCHITECTURE.md](ARCHITECTURE.md)**
  - System architecture diagrams
  - Request flow visualization
  - Module dependencies
  - Database schema
  - Security layers

### For Operations

- **[DEPLOYMENT.md](DEPLOYMENT.md)**
  - Railway deployment guide
  - Digital Ocean setup
  - Heroku deployment
  - Docker deployment
  - AWS deployment
  - Post-deployment checklist
  - Monitoring setup

- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)**
  - Common commands (Git, Docker, Database)
  - API call examples (curl)
  - Debugging tips
  - Troubleshooting guide
  - Pro tips

### For Product/Business

- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)**
  - Complete feature overview
  - Technology stack
  - Sample workflows
  - What you can do with this API
  - Business capabilities

---

## 📁 Code Documentation

### Application Structure

```
backend/
├── app/                      # Main application code
│   ├── main.py              # FastAPI app & middleware
│   ├── config.py            # Configuration settings
│   ├── database.py          # Database connection
│   ├── models.py            # SQLAlchemy ORM models
│   ├── schemas.py           # Pydantic validation
│   ├── auth.py              # JWT authentication
│   ├── pricing.py           # Dynamic pricing engine
│   │
│   ├── routers/             # API endpoints
│   │   ├── auth.py          # Login, signup, OAuth
│   │   ├── campaigns.py     # Campaign CRUD
│   │   ├── media.py         # File uploads
│   │   ├── pricing.py       # Pricing calculations
│   │   ├── analytics.py     # Performance metrics
│   │   ├── admin.py         # Admin controls
│   │   └── payment.py       # Stripe integration
│   │
│   └── utils/               # Utility modules
│       └── file_upload.py   # File management
│
├── scripts/                 # Helper scripts
│   └── init_db.py          # Database setup
│
└── [Configuration Files]    # Docker, deployment configs
```

---

## 🎯 Quick Navigation

### By Task

**I want to...**

- **Get the project running locally**
  → [README.md](README.md) (Installation section)
  → [start.bat](start.bat) or [start.sh](start.sh)

- **Understand the API endpoints**
  → [API_REFERENCE.md](API_REFERENCE.md)
  → http://localhost:8000/docs (Interactive)

- **Deploy to production**
  → [DEPLOYMENT.md](DEPLOYMENT.md)
  → Choose your platform (Railway, Heroku, etc.)

- **Debug an issue**
  → [QUICK_REFERENCE.md](QUICK_REFERENCE.md) (Troubleshooting)
  → Check logs first!

- **Understand the architecture**
  → [ARCHITECTURE.md](ARCHITECTURE.md)
  → Visual diagrams included

- **Find a specific command**
  → [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
  → Ctrl+F to search

- **See what features are available**
  → [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)
  → Complete feature list

---

## 📋 Configuration Files

- **[.env.example](.env.example)** - Environment variable template
- **[requirements.txt](requirements.txt)** - Python dependencies
- **[Dockerfile](Dockerfile)** - Docker container definition
- **[docker-compose.yml](docker-compose.yml)** - Multi-container setup
- **[Procfile](Procfile)** - Heroku/Railway startup
- **[railway.toml](railway.toml)** - Railway configuration
- **[.gitignore](.gitignore)** - Git ignore rules

---

## 🔍 Feature Documentation

### Authentication
- **JWT-based authentication** - See [auth.py](app/auth.py)
- **Google OAuth** - See [routers/auth.py](app/routers/auth.py)
- **Role-based access** - Admin vs Advertiser

### Campaign Management
- **CRUD operations** - See [routers/campaigns.py](app/routers/campaigns.py)
- **Status workflow** - Draft → Pending → Active → Completed
- **Geographic targeting** - 30-mile, state, country

### Dynamic Pricing
- **Pricing engine** - See [pricing.py](app/pricing.py)
- **Coverage calculations** - Based on area and population
- **Industry multipliers** - Configurable rates
- **Discounts** - State and national discounts

### Media Management
- **File uploads** - See [routers/media.py](app/routers/media.py)
- **Validation** - Size, format, dimensions
- **Storage** - Local or S3
- **Approval workflow** - Admin moderation

### Payment Processing
- **Stripe integration** - See [routers/payment.py](app/routers/payment.py)
- **Checkout sessions** - Stripe Checkout
- **Webhooks** - Event handling
- **Transaction tracking** - Payment history

### Analytics
- **Performance metrics** - See [routers/analytics.py](app/routers/analytics.py)
- **Impressions & Clicks** - Campaign tracking
- **CTR calculation** - Click-through rate
- **User summaries** - Aggregate statistics

### Admin Controls
- **User management** - See [routers/admin.py](app/routers/admin.py)
- **System oversight** - All campaigns, users
- **Pricing configuration** - Manage pricing matrix
- **Statistics dashboard** - System-wide metrics

---

## 🗄️ Database Documentation

### Tables
- **users** - User accounts and authentication
- **campaigns** - Advertising campaigns
- **media** - Uploaded media files
- **pricing_matrix** - Pricing configuration
- **geodata** - Geographic data for pricing
- **payment_transactions** - Payment records

### Relationships
- User → Campaigns (one-to-many)
- Campaign → Media (one-to-many)
- Campaign → PaymentTransactions (one-to-many)

See [ARCHITECTURE.md](ARCHITECTURE.md) for visual schema.

---

## 🔗 External Resources

### API Documentation (Live)
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Dependencies
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [Stripe API Documentation](https://stripe.com/docs/api)

### Tools
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [Railway Documentation](https://docs.railway.app/)

---

## 📊 Documentation Statistics

- **Total Documentation Files**: 8
- **Total Code Files**: 24
- **Total Lines of Code**: ~3,000+
- **Total Lines of Documentation**: ~2,000+
- **Languages**: Python, SQL, Shell, Docker
- **Frameworks**: FastAPI, SQLAlchemy, Pydantic

---

## 🆘 Getting Help

### Order of Troubleshooting

1. **Check the logs** - Always start here
   ```bash
   # Local
   Check terminal output
   
   # Docker
   docker-compose logs -f api
   
   # Production
   railway logs / heroku logs --tail
   ```

2. **Review documentation**
   - [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Common issues
   - [API_REFERENCE.md](API_REFERENCE.md) - Endpoint details
   - [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment issues

3. **Test locally**
   - Run `start.bat` or `start.sh`
   - Check http://localhost:8000/health
   - Try http://localhost:8000/docs

4. **Verify configuration**
   - Check environment variables
   - Verify database connection
   - Test API credentials (Stripe, Google)

5. **Common issues**
   - Port already in use → Kill process
   - Database connection failed → Check DATABASE_URL
   - Module not found → Reinstall dependencies
   - Permission denied → chmod +x script

---

## 📅 Version History

- **v1.0.0** (2024-01-08) - Initial release
  - Complete FastAPI backend
  - All core features implemented
  - Production-ready deployment

---

## 📝 Contributing

When contributing, please:
1. Read existing documentation
2. Follow code style (PEP 8)
3. Add comments for complex logic
4. Update relevant documentation
5. Test thoroughly before committing

---

## 📜 License

MIT License - See project repository for details.

---

## 🎯 Next Steps

Choose your path:

### 👨‍💻 Developer
1. Read [README.md](README.md)
2. Run `start.bat` or `start.sh`
3. Explore http://localhost:8000/docs
4. Review [API_REFERENCE.md](API_REFERENCE.md)

### 🚀 DevOps
1. Read [DEPLOYMENT.md](DEPLOYMENT.md)
2. Choose deployment platform
3. Configure environment variables
4. Deploy and monitor

### 📊 Product Manager
1. Read [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)
2. Review feature list
3. Test endpoints via Swagger UI
4. Plan integration with frontend

### 🏗️ Architect
1. Read [ARCHITECTURE.md](ARCHITECTURE.md)
2. Review system design
3. Understand data flows
4. Plan scaling strategy

---

**Happy coding! 🎉**

For questions, issues, or contributions, please refer to the project repository.

Last updated: 2024-01-08
