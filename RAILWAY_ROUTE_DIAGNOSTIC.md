# Railway Deployment Route Problem - Diagnostic Guide

## 🔍 Current Route Structure

Based on your backend configuration, here's how routes are organized:

### Backend Routes (All prefixed with `/api`)

```
Main App Routes:
├── / (Root)                          → API info
├── /health                           → Health check
├── /api/health                       → Health check (duplicate)
└── /docs                             → API documentation

API Routes (all under /api prefix):
├── /api/auth/*                       → Authentication (login, signup, OAuth)
├── /api/campaigns/*                  → Campaign management
├── /api/media/*                      → Media uploads
├── /api/pricing/*                    → Pricing configuration
├── /api/payment/*                    → Payment/Stripe
├── /api/analytics/*                  → Analytics data
├── /api/admin/*                      → Admin controls
├── /api/geo/*                        → Geographic data
├── /api/campaign_approval/*          → Campaign approval workflow
└── /api/* (frontend_compat)          → Frontend compatibility layer
```

### Frontend Compatibility Routes (from frontend_compat.py)

These are special routes that the frontend expects:
- `GET /api/` → API root
- `GET /api/stats` → Dashboard statistics
- `GET /api/campaigns` → List campaigns (with role-based filtering)
- `POST /api/campaigns` → Create campaign
- `GET /api/notifications` → Get notifications
- `POST /api/notifications/read` → Mark notifications as read
- `POST /api/auth/google-sync` → Google OAuth sync
- `POST /api/auth/logout` → Logout

## 🚨 Common Railway Route Problems

### Problem 1: Routes Return 404 Not Found

**Symptoms:**
- Frontend shows "404 Not Found" for API calls
- Routes work locally but not on Railway

**Possible Causes:**
1. **Wrong API URL in frontend environment variable**
   ```bash
   # ❌ Wrong
   VITE_API_URL=https://your-frontend.railway.app/api
   
   # ✅ Correct
   VITE_API_URL=https://your-backend.railway.app/api
   ```

2. **Missing `/api` prefix**
   ```bash
   # ❌ Wrong
   VITE_API_URL=https://your-backend.railway.app
   
   # ✅ Correct
   VITE_API_URL=https://your-backend.railway.app/api
   ```

3. **Backend not starting properly**
   - Check Railway logs for startup errors
   - Verify database connection

**Solution:**
```bash
# 1. Get your backend URL from Railway Dashboard
# 2. Set in frontend service environment variables:
VITE_API_URL=https://YOUR-BACKEND-URL.up.railway.app/api

# 3. Redeploy frontend
```

---

### Problem 2: Routes Return 500 Internal Server Error

**Symptoms:**
- API calls return 500 error
- Works locally but fails on Railway

**Possible Causes:**
1. **Database not initialized**
2. **Missing environment variables**
3. **Schema mismatch**

**Diagnostic Steps:**
```bash
# Test these endpoints on Railway:
1. https://your-backend.railway.app/health
   → Should return: {"status":"healthy","version":"1.0.0"}

2. https://your-backend.railway.app/api/debug/db
   → Shows database connection status

3. https://your-backend.railway.app/api/debug/env
   → Shows environment variables (keys only)

4. https://your-backend.railway.app/api/debug/routes
   → Lists all registered routes
```

**Solution:**
Check Railway backend logs for specific error messages.

---

### Problem 3: CORS Errors

**Symptoms:**
- Browser console shows CORS errors
- "Access to fetch has been blocked by CORS policy"

**Current CORS Configuration:**
```python
# In backend/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="https?://.*",  # Allows any origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)
```

This should allow all origins. If you still get CORS errors:

**Solution:**
1. Verify the backend is actually running
2. Check if requests are reaching the backend (check Railway logs)
3. Ensure frontend is using `credentials: 'include'` in fetch calls

---

### Problem 4: Authentication Routes Fail

**Symptoms:**
- Login works locally but fails on Railway
- 401 Unauthorized errors
- Token not being accepted

**Possible Causes:**
1. **JWT_SECRET not set in Railway**
2. **Token expiration issues**
3. **Cookie domain mismatch**

**Solution:**
```bash
# In Railway backend service, ensure these are set:
JWT_SECRET=your-secret-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

---

### Problem 5: Campaign Creation Fails

**Symptoms:**
- POST /api/campaigns returns 500
- Works locally but not on Railway

**Diagnostic:**
Your backend has extensive logging. Check Railway logs for:
```
📦 Campaign creation request size: XXX bytes
✅ Successfully parsed JSON request
👤 User: email@example.com
📅 Campaign dates: ...
💰 Calculated price: $XXX
💾 Saving campaign to database...
```

If you see errors, they'll show the exact problem.

**Common Issues:**
1. Database schema mismatch
2. Missing required fields
3. File upload size limits
4. Database connection timeout

---

## 🛠️ Quick Diagnostic Checklist

Run through this checklist to identify your specific problem:

### Step 1: Verify Backend is Running
```bash
# Test health endpoint
curl https://YOUR-BACKEND.railway.app/health

# Expected response:
{"status":"healthy","version":"1.0.0"}
```

### Step 2: Check Route Registration
```bash
# List all routes
curl https://YOUR-BACKEND.railway.app/api/debug/routes

# This will show all registered routes
```

### Step 3: Test Database Connection
```bash
# Check database
curl https://YOUR-BACKEND.railway.app/api/debug/db

# Expected response:
{
  "status": "ok",
  "database_connected": true,
  "user_count": X,
  "pricing_count": Y
}
```

### Step 4: Verify Environment Variables
```bash
# Check environment (from Railway dashboard or API)
curl https://YOUR-BACKEND.railway.app/api/debug/env

# Should show DATABASE_URL exists
```

### Step 5: Test Frontend API URL
Open your Railway frontend in browser, press F12, and run:
```javascript
console.log('API URL:', import.meta.env.VITE_API_URL);
```

Should show: `https://your-backend.railway.app/api`

### Step 6: Test Specific Route
```bash
# Test the route that's failing
# For example, campaigns list (requires auth):
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://YOUR-BACKEND.railway.app/api/campaigns
```

---

## 🔧 Common Fixes

### Fix 1: Update Frontend Environment Variable
```bash
# Railway Dashboard → Frontend Service → Variables
VITE_API_URL=https://YOUR-BACKEND-URL.up.railway.app/api

# Then redeploy frontend
```

### Fix 2: Ensure Database is Initialized
Your backend auto-initializes on startup. Check logs for:
```
✅ Database tables initialized successfully
✅ Schema migrations checked/applied
✅ Admin user created: admin@adplatform.com
```

If missing, database didn't initialize properly.

### Fix 3: Reset Database State (Emergency)
```bash
# Call the reset endpoint
curl -X POST https://YOUR-BACKEND.railway.app/api/debug/reset
```

### Fix 4: Check Railway Service Configuration

**Backend Service:**
- Build Command: (auto-detected by Nixpacks)
- Start Command: `cd backend && /opt/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Health Check Path: `/health`
- Health Check Timeout: 120 seconds

**Frontend Service:**
- Environment Variable: `VITE_API_URL` must point to backend
- Build Command: `npm run build`
- Start Command: Should serve the `dist` folder

---

## 📊 Debugging Workflow

When you encounter a route problem:

1. **Identify the failing route**
   - Check browser console (F12 → Console)
   - Note the exact URL being called
   - Note the error code (404, 500, etc.)

2. **Check Railway backend logs**
   - Railway Dashboard → Backend Service → Deployments → Latest → Logs
   - Look for errors around the time of the request

3. **Verify the route exists**
   - Call `/api/debug/routes` to see all routes
   - Confirm your route is registered

4. **Test the route directly**
   - Use curl or Postman to test the backend URL directly
   - This isolates frontend vs backend issues

5. **Check authentication**
   - If 401 error, verify token is being sent
   - Check token is valid and not expired

6. **Review request payload**
   - Check Network tab (F12 → Network)
   - Verify request body matches backend expectations

---

## 🆘 Still Having Issues?

### Collect This Information:

1. **Exact error message** from browser console
2. **Railway backend logs** (last 50 lines)
3. **The specific route** that's failing
4. **Request details** from Network tab:
   - URL
   - Method
   - Headers
   - Body
   - Response

5. **Environment check**:
   ```javascript
   // Run in browser console
   console.log('Frontend URL:', window.location.href);
   console.log('API URL:', import.meta.env.VITE_API_URL);
   ```

### Test Script

Run this in your Railway frontend browser console:
```javascript
// Copy the entire content of railway-diagnostic-test.js
// Or just run:
fetch(import.meta.env.VITE_API_URL + '/health')
  .then(r => r.json())
  .then(d => console.log('✅ Backend healthy:', d))
  .catch(e => console.error('❌ Backend unreachable:', e));
```

---

## 📝 Route-Specific Issues

### `/api/campaigns` (GET)
- **Requires**: Authentication token
- **Returns**: List of campaigns (filtered by user role)
- **Common issue**: 401 if not authenticated

### `/api/campaigns` (POST)
- **Requires**: Authentication token, campaign data
- **Max size**: 5MB (for images)
- **Common issues**: 
  - 500 if database not initialized
  - 422 if validation fails
  - 413 if payload too large

### `/api/auth/login`
- **No auth required**
- **Returns**: Access token
- **Common issue**: 401 if credentials wrong

### `/api/pricing/config`
- **Requires**: Authentication
- **Returns**: Pricing configuration
- **Common issue**: Empty if database not seeded

### `/api/admin/*`
- **Requires**: Admin role
- **Returns**: 403 if not admin
- **Common issue**: Regular users can't access

---

## 🎯 Next Steps

1. **Identify your specific problem** using the checklist above
2. **Run the diagnostic tests** to narrow down the issue
3. **Check Railway logs** for detailed error messages
4. **Apply the appropriate fix** from this guide

If you provide me with:
- The specific route that's failing
- The error message
- Railway backend logs

I can give you a precise solution! 🚀
