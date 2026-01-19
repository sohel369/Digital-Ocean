# Railway Deployment Route Flow

## 🌐 Complete Request Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER'S BROWSER                          │
│                                                                 │
│  Frontend URL: https://your-frontend.railway.app               │
│  React App running with Vite                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ API Request
                              │ Uses: import.meta.env.VITE_API_URL
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VITE_API_URL Setting                         │
│                                                                 │
│  ❌ WRONG: https://your-frontend.railway.app/api               │
│  ❌ WRONG: http://localhost:8000/api                           │
│  ✅ CORRECT: https://your-backend.railway.app/api              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP Request
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RAILWAY BACKEND SERVICE                      │
│                                                                 │
│  URL: https://balanced-wholeness-production-ca00.railway.app   │
│  Running: FastAPI + Uvicorn                                    │
│  Port: $PORT (assigned by Railway)                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Request hits FastAPI
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FASTAPI MIDDLEWARE                         │
│                                                                 │
│  1. CORS Middleware (allows all origins)                       │
│  2. Request Logger (logs all requests)                         │
│  3. Exception Handlers (catches errors)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Route Matching
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       ROUTE RESOLUTION                          │
│                                                                 │
│  Example: POST /api/campaigns                                  │
│                                                                 │
│  1. Check if route exists                                      │
│  2. Extract /api prefix                                        │
│  3. Match to router: campaigns.router                          │
│  4. Find handler: create_campaign_compat()                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Authentication Check
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AUTHENTICATION                             │
│                                                                 │
│  Depends(auth.get_current_active_user)                         │
│                                                                 │
│  1. Extract Bearer token from Authorization header             │
│  2. Verify JWT signature using JWT_SECRET                      │
│  3. Check token expiration                                     │
│  4. Load user from database                                    │
│  5. Return user object or raise 401                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Database Query
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    POSTGRESQL DATABASE                          │
│                                                                 │
│  Provided by: Railway PostgreSQL Plugin                        │
│  Connection: DATABASE_URL environment variable                 │
│                                                                 │
│  Tables:                                                        │
│  - users                                                        │
│  - campaigns                                                    │
│  - pricing_matrix                                               │
│  - geo_data                                                     │
│  - notifications                                                │
│  - media                                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Response
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      JSON RESPONSE                              │
│                                                                 │
│  Success (200):                                                 │
│  {                                                              │
│    "id": 1,                                                     │
│    "name": "My Campaign",                                       │
│    "status": "draft"                                            │
│  }                                                              │
│                                                                 │
│  Error (500):                                                   │
│  {                                                              │
│    "error": "Internal server error",                            │
│    "detail": "Database connection failed"                       │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔀 Route Registration Flow

```
main.py (FastAPI App)
│
├── Root Routes (No prefix)
│   ├── GET  /              → API info
│   ├── GET  /health        → Health check
│   └── GET  /docs          → API documentation
│
└── API Routes (All with /api prefix)
    │
    ├── frontend_compat.router (prefix: /api)
    │   ├── GET  /api/                     → API root
    │   ├── GET  /api/stats                → Dashboard stats
    │   ├── GET  /api/campaigns            → List campaigns
    │   ├── POST /api/campaigns            → Create campaign
    │   ├── GET  /api/notifications        → Get notifications
    │   └── POST /api/notifications/read   → Mark as read
    │
    ├── auth.router (prefix: /api)
    │   ├── POST /api/auth/login           → Login
    │   ├── POST /api/auth/signup          → Signup
    │   ├── POST /api/auth/google-sync     → Google OAuth
    │   └── POST /api/auth/logout          → Logout
    │
    ├── campaigns.router (prefix: /api)
    │   ├── GET    /api/campaigns          → List campaigns
    │   ├── POST   /api/campaigns          → Create campaign
    │   ├── GET    /api/campaigns/{id}     → Get campaign
    │   ├── PUT    /api/campaigns/{id}     → Update campaign
    │   └── DELETE /api/campaigns/{id}     → Delete campaign
    │
    ├── pricing.router (prefix: /api)
    │   ├── GET  /api/pricing/config       → Get pricing config
    │   ├── POST /api/pricing/calculate    → Calculate price
    │   └── PUT  /api/pricing/config       → Update pricing (admin)
    │
    ├── admin.router (prefix: /api)
    │   ├── GET  /api/admin/users          → List users
    │   ├── GET  /api/admin/campaigns      → All campaigns
    │   └── PUT  /api/admin/pricing        → Update pricing
    │
    ├── geo.router (prefix: /api)
    │   ├── GET  /api/geo/regions/{country} → Get regions
    │   └── GET  /api/geo/states/{country}  → Get states
    │
    ├── media.router (prefix: /api)
    │   ├── POST /api/media/upload         → Upload file
    │   └── GET  /api/media/{id}           → Get file
    │
    ├── payment.router (prefix: /api)
    │   ├── POST /api/payment/checkout     → Create checkout
    │   └── POST /api/payment/webhook      → Stripe webhook
    │
    ├── analytics.router (prefix: /api)
    │   └── GET  /api/analytics/stats      → Get analytics
    │
    └── campaign_approval.router (prefix: /api)
        ├── POST /api/campaigns/approval/submit  → Submit for review
        ├── GET  /api/campaigns/approval/pending → Get pending
        ├── POST /api/campaigns/approval/approve → Approve
        └── POST /api/campaigns/approval/reject  → Reject
```

---

## 🎯 Common Route Patterns

### Pattern 1: Public Route (No Auth)
```
Request:  GET /api/pricing/config
          No Authorization header needed

Response: 200 OK
          { "industries": [...], "ad_types": [...] }
```

### Pattern 2: Authenticated Route
```
Request:  GET /api/campaigns
          Authorization: Bearer eyJhbGc...

Process:  1. Verify JWT token
          2. Load user from database
          3. Filter campaigns by user
          4. Return results

Response: 200 OK
          [{ "id": 1, "name": "Campaign 1" }]
```

### Pattern 3: Admin-Only Route
```
Request:  PUT /api/admin/pricing
          Authorization: Bearer eyJhbGc...

Process:  1. Verify JWT token
          2. Load user from database
          3. Check if user.role == ADMIN
          4. If not admin → 403 Forbidden
          5. If admin → process request

Response: 200 OK (if admin)
          403 Forbidden (if not admin)
```

### Pattern 4: File Upload Route
```
Request:  POST /api/media/upload
          Content-Type: multipart/form-data
          Authorization: Bearer eyJhbGc...
          Body: [file data]

Process:  1. Verify JWT token
          2. Validate file size (max 5MB)
          3. Validate file type
          4. Save to uploads/ directory
          5. Create database record

Response: 200 OK
          { "id": 1, "url": "/uploads/file.jpg" }
```

---

## 🔍 Debugging Route Problems

### Problem: Route Returns 404

```
Request Flow:
Browser → VITE_API_URL → Backend → Route Matching → 404

Check:
1. Is VITE_API_URL correct?
   console.log(import.meta.env.VITE_API_URL)
   
2. Is the route registered?
   curl https://backend.railway.app/api/debug/routes
   
3. Is the URL path correct?
   /api/campaigns ✅
   /campaigns ❌ (missing /api)
   /api/campaign ❌ (wrong path)
```

### Problem: Route Returns 401

```
Request Flow:
Browser → Backend → Auth Check → 401 Unauthorized

Check:
1. Is token being sent?
   Network tab → Request Headers → Authorization
   
2. Is token valid?
   Check expiration (default: 30 minutes)
   
3. Is JWT_SECRET set in Railway?
   Railway → Backend → Variables → JWT_SECRET
```

### Problem: Route Returns 500

```
Request Flow:
Browser → Backend → Handler → Database → Error → 500

Check:
1. Backend logs (Railway → Deployments → Logs)
   Look for error traceback
   
2. Database connection
   curl https://backend.railway.app/api/debug/db
   
3. Missing data
   Check if pricing/geo data is seeded
```

---

## 📊 Environment Variable Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    RAILWAY DASHBOARD                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Set Variables
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND SERVICE                              │
│                                                                 │
│  Variables:                                                     │
│  - DATABASE_URL (auto from PostgreSQL plugin)                  │
│  - JWT_SECRET (manual)                                          │
│  - JWT_ALGORITHM=HS256                                          │
│  - ACCESS_TOKEN_EXPIRE_MINUTES=30                               │
│  - DEBUG=False                                                  │
│  - LOG_LEVEL=INFO                                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Used by FastAPI
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    app/config.py                                │
│                                                                 │
│  class Settings(BaseSettings):                                 │
│      DATABASE_URL: str                                          │
│      JWT_SECRET: str                                            │
│      JWT_ALGORITHM: str = "HS256"                               │
│      ...                                                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND SERVICE                             │
│                                                                 │
│  Variables:                                                     │
│  - VITE_API_URL=https://backend.railway.app/api                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Build Time
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Built JavaScript                             │
│                                                                 │
│  const API_URL = "https://backend.railway.app/api"             │
│  // Hardcoded at build time                                    │
└─────────────────────────────────────────────────────────────────┘
```

**Important:** Frontend env vars are baked into the build. If you change `VITE_API_URL`, you MUST redeploy the frontend!

---

## ✅ Verification Checklist

Use this to verify your Railway deployment:

```bash
# 1. Backend is running
curl https://YOUR-BACKEND.railway.app/health
# ✅ Should return: {"status":"healthy","version":"1.0.0"}

# 2. Routes are registered
curl https://YOUR-BACKEND.railway.app/api/debug/routes
# ✅ Should list all routes including /api/campaigns

# 3. Database is connected
curl https://YOUR-BACKEND.railway.app/api/debug/db
# ✅ Should return: {"status":"ok","database_connected":true}

# 4. Frontend has correct API URL
# Open frontend → F12 → Console
console.log(import.meta.env.VITE_API_URL)
# ✅ Should show: https://YOUR-BACKEND.railway.app/api

# 5. Can login
curl -X POST https://YOUR-BACKEND.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@adplatform.com","password":"admin123"}'
# ✅ Should return: {"access_token":"...","token_type":"bearer"}

# 6. Can access authenticated route
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://YOUR-BACKEND.railway.app/api/campaigns
# ✅ Should return: [] or list of campaigns
```

---

**Need Help?** Run `test-railway-routes.js` in your browser console for automated diagnostics!
