# Railway Deployment Status & Troubleshooting

## Current Configuration ✅

### Environment Variables (Set in Railway)
```
VITE_API_URL=https://balanced-wholeness-production-ca00.up.railway.app/api
```

### API URL Logic (AppContext.jsx)
The frontend uses this priority order:
1. **VITE_API_URL** (environment variable) - Used in production ✅
2. **window.VITE_API_URL** (runtime injection)
3. **Localhost detection** - For local development
4. **Railway detection** - Falls back to `/api` for Railway deployments
5. **Relative `/api`** - Ultimate fallback

## Quick Railway Status Check

### Option 1: Use the Test Script (In Browser)
1. Open your Railway frontend URL: `https://digital-ocean-production-[YOUR-ID].up.railway.app`
2. Press `F12` to open Developer Tools
3. Go to **Console** tab
4. Copy and paste the contents of `test-railway-routes.js`
5. Press Enter
6. Review the results

### Option 2: Manual Health Check
```bash
# Test backend directly
curl https://balanced-wholeness-production-ca00.up.railway.app/health

# Test frontend (should proxy to backend)
curl https://digital-ocean-production-[YOUR-ID].up.railway.app/api/health
```

## Common Railway Issues & Fixes

### Issue 1: "ECONNREFUSED" or "Backend Not Responding"
**Cause:** Backend service is not running or URL is wrong

**Fix:**
1. Check Railway Dashboard → Backend Service → Deployments
2. Ensure status is "Active" (green)
3. Check logs for errors
4. Verify `VITE_API_URL` points to your actual backend URL

### Issue 2: "404 Not Found" on API Calls
**Cause:** Wrong API URL or routing issue

**Fix:**
1. Verify `VITE_API_URL` ends with `/api`
2. Check backend logs to see if requests are reaching it
3. Ensure serve.js is proxying correctly (if using SPA setup)

### Issue 3: "500 Internal Server Error"
**Cause:** Backend database or configuration issue

**Fix:**
1. Check Railway Backend → Logs
2. Look for database connection errors
3. Verify DATABASE_URL is set
4. Check for schema migration errors
5. Restart backend service

### Issue 4: "401 Unauthorized" on All Requests
**Cause:** JWT secret mismatch or session issues

**Fix:**
1. Ensure `JWT_SECRET` is set in Railway backend
2. Clear browser localStorage and cookies
3. Try logging in again
4. Check backend logs for JWT validation errors

### Issue 5: Logout After 0.5 Seconds
**Cause:** Token validation failing immediately

**Fix:**
1. Check `JWT_SECRET` in Railway matches what backend expects
2. Token expiration settings might be too short
3. Check browser console for auth errors
4. Review backend auth logic

## Deployment Checklist

### Backend Service
- [✅] Service is deployed and active
- [ ] DATABASE_URL is set
- [ ] JWT_SECRET is set
- [ ] PORT is set (or defaults to 8000)
- [ ] Health endpoint responds: `/health`
- [ ] Logs show no errors

### Frontend Service
- [ ] Service is deployed and active
- [✅] VITE_API_URL is set to backend service URL
- [ ] Build completed successfully
- [ ] serve.js or equivalent is serving the app
- [ ] Can access frontend URL
- [ ] Browser console shows correct API URL

### Testing Steps
1. Open frontend URL
2. Open DevTools (F12) → Console
3. Check API URL log: "🚀 Final API URL:"
4. Check connectivity: "✅ Backend Connectivity: OK"
5. Try logging in
6. Check Network tab for API calls
7. Verify requests go to correct backend URL

## Debug Commands

### Check Backend Logs (Railway CLI)
```bash
railway logs --service backend
```

### Check Frontend Logs
```bash
railway logs --service frontend
```

### Test Backend Health (Local)
```powershell
curl https://balanced-wholeness-production-ca00.up.railway.app/health
```

### Check All Routes (Backend)
```powershell
curl https://balanced-wholeness-production-ca00.up.railway.app/api/debug/routes
```

## Current Status Summary

✅ **Local Development:**
- Backend: Running on port 8000
- Frontend: Should work after restart
- Connection: Vite proxy to localhost:8000

❓ **Railway Deployment:**
- Backend URL: `https://balanced-wholeness-production-ca00.up.railway.app`
- Frontend URL: Unknown (check Railway dashboard)
- VITE_API_URL: Set and configured
- Status: Requires verification with test script

## Next Steps

### For Local Development:
1. Restart frontend: Press Ctrl+C in npm dev terminal
2. Run: `npm run dev` again
3. Verify connection in browser

### For Railway Deployment:
1. Open Railway frontend URL
2. Run test script from `test-railway-routes.js`
3. Check results and fix any failing tests
4. Review backend logs if issues persist

## Support Resources

- Railway Docs: https://docs.railway.app
- Backend API Docs: `https://balanced-wholeness-production-ca00.up.railway.app/docs`
- Frontend Fix Guide: `LOCAL_FIX_GUIDE.md`
- Detailed Railway Fix: `RAILWAY_FIX_STEPS.md`
