# Railway Route Problem - Complete Solution Guide

## 📚 Documentation Index

I've created comprehensive documentation to help you solve your Railway deployment route problem:

### 1. **RAILWAY_ROUTE_QUICK_FIX.md** ⚡ START HERE
   - Quick reference card for common issues
   - Immediate solutions for 5 most common problems
   - Copy-paste commands ready to use
   - **Use this first** for fast fixes

### 2. **RAILWAY_ROUTE_DIAGNOSTIC.md** 🔍 DETAILED GUIDE
   - Complete diagnostic workflow
   - Step-by-step troubleshooting
   - Detailed explanations of each issue
   - **Use this** if quick fixes don't work

### 3. **RAILWAY_ROUTE_FLOW.md** 📊 VISUAL GUIDE
   - Visual diagrams of request flow
   - Route registration patterns
   - Environment variable flow
   - **Use this** to understand how it all works

### 4. **test-railway-routes.js** 🧪 AUTOMATED TESTING
   - Browser console diagnostic script
   - Tests all routes automatically
   - Provides detailed results
   - **Run this** to identify exact problems

---

## 🎯 Quick Start (3 Steps)

### Step 1: Identify Your Problem

**Run the diagnostic script:**
1. Open your Railway frontend URL in browser
2. Press `F12` to open DevTools
3. Go to Console tab
4. Copy entire contents of `test-railway-routes.js`
5. Paste and press Enter
6. Review the test results

The script will tell you exactly what's wrong!

---

### Step 2: Apply the Fix

Based on the test results, apply the appropriate fix:

#### ❌ If "Backend Health Check" fails:
```bash
# Your backend is not running or URL is wrong
# Fix: Check Railway backend service is deployed
# Verify URL in VITE_API_URL matches your backend domain
```

#### ❌ If "VITE_API_URL not set":
```bash
# Railway Dashboard → Frontend Service → Variables
# Add:
VITE_API_URL=https://YOUR-BACKEND-URL.railway.app/api
# Then redeploy frontend
```

#### ❌ If routes return 404:
```bash
# Wrong API URL or route doesn't exist
# Fix: Verify VITE_API_URL is correct
# Check route exists: /api/debug/routes
```

#### ❌ If routes return 500:
```bash
# Backend error (database, missing data, etc.)
# Fix: Check Railway backend logs
# Look for error messages in red
```

#### ❌ If authentication fails:
```bash
# Missing JWT_SECRET or token expired
# Fix: Set JWT_SECRET in Railway backend variables
JWT_SECRET=your-secret-key-min-32-chars
```

---

### Step 3: Verify the Fix

After applying the fix:

```bash
# 1. Test backend health
curl https://YOUR-BACKEND.railway.app/health
# Should return: {"status":"healthy","version":"1.0.0"}

# 2. Test in browser
# Open frontend → F12 → Console
fetch(import.meta.env.VITE_API_URL + '/health')
  .then(r => r.json())
  .then(d => console.log('✅ Success:', d))
  .catch(e => console.error('❌ Failed:', e));

# 3. Test login
# Try logging in with: admin@adplatform.com / admin123
# Should work without errors
```

---

## 🔥 Most Common Issues (90% of problems)

### Issue #1: VITE_API_URL Not Set (40%)
**Fix:**
```bash
Railway → Frontend Service → Variables → Add Variable
Key: VITE_API_URL
Value: https://your-backend-url.railway.app/api
Then: Click "Redeploy"
```

### Issue #2: Wrong Backend URL (30%)
**Fix:**
```bash
# Make sure you're using BACKEND url, not frontend url
# ❌ Wrong: https://your-frontend.railway.app/api
# ✅ Correct: https://your-backend.railway.app/api
```

### Issue #3: Database Not Initialized (15%)
**Fix:**
```bash
# Check Railway backend logs for:
✅ Database tables initialized successfully
✅ Admin user created

# If missing, redeploy backend
# Database auto-initializes on startup
```

### Issue #4: Missing JWT_SECRET (10%)
**Fix:**
```bash
Railway → Backend Service → Variables → Add Variable
Key: JWT_SECRET
Value: your-super-secret-key-at-least-32-characters-long
Then: Redeploy backend
```

### Issue #5: Forgot to Redeploy (5%)
**Fix:**
```bash
# After changing environment variables, you MUST redeploy!
Railway → Service → Deployments → Click "Redeploy"
```

---

## 📋 Pre-Flight Checklist

Before deploying, verify:

### Backend Service ✅
- [ ] PostgreSQL plugin is attached
- [ ] DATABASE_URL is automatically set
- [ ] JWT_SECRET is manually set
- [ ] Start command: `cd backend && /opt/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- [ ] Health check path: `/health`
- [ ] Deployment shows "Success"
- [ ] Logs show "Database tables initialized successfully"

### Frontend Service ✅
- [ ] VITE_API_URL is set to backend URL + /api
- [ ] Build command: `npm run build`
- [ ] Deployment shows "Success"
- [ ] Can access frontend URL

### Testing ✅
- [ ] Backend `/health` returns OK
- [ ] Frontend loads without errors
- [ ] Browser console shows correct API URL
- [ ] Can login successfully
- [ ] Can create campaign
- [ ] No CORS errors

---

## 🛠️ Debugging Workflow

When something goes wrong:

```
1. Run test-railway-routes.js in browser console
   ↓
2. Identify which test failed
   ↓
3. Check Railway logs for that service
   ↓
4. Apply the fix from RAILWAY_ROUTE_QUICK_FIX.md
   ↓
5. Redeploy if needed
   ↓
6. Re-run tests to verify
   ↓
7. ✅ Success!
```

---

## 🎓 Understanding the Architecture

### Your Current Setup:

```
Frontend (Vite + React)
  ↓ VITE_API_URL
Backend (FastAPI + Uvicorn)
  ↓ DATABASE_URL
Database (PostgreSQL)
```

### Request Flow:

```
User clicks button
  → Frontend makes fetch() call
  → Uses VITE_API_URL
  → Hits Railway backend
  → FastAPI routes request
  → Checks authentication
  → Queries database
  → Returns JSON response
  → Frontend displays result
```

### Key Points:

1. **Frontend env vars are baked in at build time**
   - Changing VITE_API_URL requires redeploying frontend
   
2. **Backend env vars are runtime**
   - Changing JWT_SECRET requires restarting backend
   
3. **All API routes have /api prefix**
   - Frontend must include /api in VITE_API_URL
   
4. **Authentication uses JWT tokens**
   - Stored in localStorage
   - Sent in Authorization header
   
5. **Database auto-initializes on startup**
   - Creates tables
   - Seeds pricing data
   - Creates admin user

---

## 🆘 Still Stuck?

### Collect This Information:

1. **Test Results**
   ```javascript
   // Run in browser console
   window.railwayTestResults
   // Copy the output
   ```

2. **Backend Logs**
   ```bash
   Railway → Backend Service → Deployments → Latest → View Logs
   # Copy last 100 lines
   ```

3. **Environment Check**
   ```javascript
   // Run in browser console
   console.log('Frontend URL:', window.location.href);
   console.log('API URL:', import.meta.env.VITE_API_URL);
   console.log('Has Token:', !!localStorage.getItem('access_token'));
   ```

4. **Network Tab**
   ```
   F12 → Network → Try the failing action
   Click the failed request
   Copy: Request URL, Status, Response
   ```

### Then:

Share the collected information with your developer or support team. With this data, they can pinpoint the exact issue!

---

## 📖 Additional Resources

### Railway Documentation:
- [Railway Docs](https://docs.railway.app/)
- [Environment Variables](https://docs.railway.app/develop/variables)
- [Deployment Logs](https://docs.railway.app/deploy/deployments)

### Your Backend API Docs:
- Production: `https://your-backend.railway.app/docs`
- Local: `http://localhost:8000/docs`

### Debug Endpoints:
- `/health` - Health check
- `/api/debug/routes` - List all routes
- `/api/debug/db` - Database status
- `/api/debug/env` - Environment check

---

## ✅ Success Criteria

You'll know everything is working when:

1. ✅ Backend health check returns OK
2. ✅ Frontend loads without console errors
3. ✅ Can login with admin@adplatform.com / admin123
4. ✅ Can create a new campaign
5. ✅ Can view campaign list
6. ✅ No CORS errors in browser console
7. ✅ All test-railway-routes.js tests pass

---

## 🎉 Final Notes

- **Most issues are environment variable related** - Double-check VITE_API_URL
- **Always redeploy after changing env vars** - Changes don't apply automatically
- **Check logs first** - They usually tell you exactly what's wrong
- **Use the diagnostic script** - It automates most of the troubleshooting
- **Don't panic** - These are common issues with simple fixes!

---

**Created:** 2026-01-19
**Version:** 1.0.0
**Status:** Ready to use

Good luck with your deployment! 🚀
