# Railway Route Problem - Quick Fix Card

## 🎯 Most Common Issues & Solutions

### Issue #1: 404 Not Found on All Routes
**Symptom:** All API calls return 404
**Cause:** Wrong API URL in frontend
**Fix:**
```bash
# Railway Dashboard → Frontend Service → Variables
VITE_API_URL=https://YOUR-BACKEND-URL.railway.app/api
# Then click "Redeploy"
```

---

### Issue #2: Backend URL Not Set
**Symptom:** API calls go to wrong URL or localhost
**Cause:** VITE_API_URL not configured
**Fix:**
1. Get backend URL: Railway → Backend Service → Settings → Domain
2. Set in frontend: Railway → Frontend Service → Variables
   ```
   VITE_API_URL=https://balanced-wholeness-production-ca00.up.railway.app/api
   ```
3. Redeploy frontend

---

### Issue #3: 500 Internal Server Error
**Symptom:** Routes return 500 error
**Cause:** Database not initialized or missing env vars
**Fix:**
1. Check Railway backend logs
2. Look for:
   ```
   ✅ Database tables initialized successfully
   ✅ Admin user created
   ```
3. If missing, check DATABASE_URL is set
4. Redeploy backend

---

### Issue #4: CORS Errors
**Symptom:** "Blocked by CORS policy" in console
**Cause:** Backend not allowing frontend origin
**Fix:**
Your backend already allows all origins. If you still see this:
1. Verify backend is actually running
2. Check if URL is correct (https not http)
3. Clear browser cache

---

### Issue #5: Authentication Fails
**Symptom:** Login works locally but not on Railway
**Cause:** Missing JWT_SECRET
**Fix:**
```bash
# Railway → Backend Service → Variables
JWT_SECRET=your-super-secret-key-here-min-32-chars
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

---

## 🔍 Quick Diagnostic Commands

### Test Backend Health
```bash
curl https://YOUR-BACKEND.railway.app/health
# Should return: {"status":"healthy","version":"1.0.0"}
```

### List All Routes
```bash
curl https://YOUR-BACKEND.railway.app/api/debug/routes
# Shows all registered routes
```

### Check Database
```bash
curl https://YOUR-BACKEND.railway.app/api/debug/db
# Shows database connection status
```

### Test in Browser Console
```javascript
// Open Railway frontend → F12 → Console
console.log('API URL:', import.meta.env.VITE_API_URL);
// Should show: https://your-backend.railway.app/api
```

---

## 📋 Pre-Deployment Checklist

### Backend Service
- [ ] DATABASE_URL is set (auto by Railway PostgreSQL)
- [ ] JWT_SECRET is set (manual)
- [ ] Start command: `cd backend && /opt/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- [ ] Health check path: `/health`
- [ ] Deployment successful (check logs)

### Frontend Service
- [ ] VITE_API_URL is set to backend URL + /api
- [ ] Build command: `npm run build`
- [ ] Start command: serves dist folder
- [ ] Deployment successful

### Testing
- [ ] Backend health: `https://backend.railway.app/health` returns OK
- [ ] Frontend loads without errors
- [ ] Can login successfully
- [ ] Can create campaign
- [ ] No CORS errors in console

---

## 🆘 Emergency Fixes

### Reset Database State
```bash
curl -X POST https://YOUR-BACKEND.railway.app/api/debug/reset
```

### Force Redeploy
1. Railway Dashboard → Service → Deployments
2. Click "..." on latest deployment
3. Click "Redeploy"

### View Logs
1. Railway Dashboard → Service → Deployments
2. Click latest deployment
3. Click "View Logs"
4. Look for errors in red

---

## 📞 Need More Help?

Run the diagnostic script:
1. Open Railway frontend in browser
2. Press F12 → Console
3. Copy contents of `test-railway-routes.js`
4. Paste and press Enter
5. Review test results

Or check the full guide: `RAILWAY_ROUTE_DIAGNOSTIC.md`

---

## 🎯 Your Current Setup

Based on your code:

**Backend Routes:**
- All routes are under `/api` prefix
- Health check at `/health` and `/api/health`
- Docs at `/docs`

**Frontend Should Use:**
```
VITE_API_URL=https://YOUR-BACKEND.railway.app/api
```

**Common Endpoints:**
- `POST /api/auth/login` - Login
- `POST /api/auth/signup` - Signup
- `GET /api/campaigns` - List campaigns (auth required)
- `POST /api/campaigns` - Create campaign (auth required)
- `GET /api/pricing/config` - Get pricing
- `GET /api/stats` - Dashboard stats (auth required)

---

## ✅ Success Indicators

You'll know it's working when:
1. ✅ `/health` returns `{"status":"healthy"}`
2. ✅ Frontend console shows correct API URL
3. ✅ No CORS errors
4. ✅ Login works
5. ✅ Campaign creation works
6. ✅ Backend logs show successful requests

---

**Last Updated:** 2026-01-19
**Version:** 1.0.0
