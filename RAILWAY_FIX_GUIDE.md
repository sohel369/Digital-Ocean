# Railway Deployment Fix - Campaign Creation & Admin Save Errors

## Root Cause
The errors on Railway are caused by:
1. **API URL Mismatch**: Frontend trying to call wrong backend URL
2. **Database Not Initialized**: Tables/data missing on Railway backend
3. **CORS Issues**: Backend not accepting requests from frontend domain

## Fix Steps

### 1. Set Environment Variables in Railway Dashboard

For **BACKEND Service** (balanced-wholeness):
```bash
DATABASE_URL=<automatically-set-by-railway-postgres>
SECRET_KEY=your-super-secret-production-key-change-me
DEBUG=false
LOG_LEVEL=INFO
PYTHONUNBUFFERED=1
```

For **FRONTEND Service** (Digital-Ocean or your frontend service name):
```bash
VITE_API_URL=https://balanced-wholeness-production-ca00.up.railway.app/api
```

**IMPORTANT**: Replace `balanced-wholeness-production-ca00.up.railway.app` with your ACTUAL backend Railway URL!

### 2. Get Your Backend Railway URL

1. Go to Railway Dashboard
2. Click on your **backend service** (balanced-wholeness)
3. Go to **Settings** tab
4. Look for **Public Networking** or **Domains** section
5. Copy the generated Railway domain (e.g., `YOURAPP.up.railway.app`)
6. Add `/api` to the end: `https://YOURAPP.up.railway.app/api`

### 3. Update Frontend Environment Variable

1. Go to your **frontend service** in Railway
2. Go to **Variables** tab
3. Click **+ New Variable**
4. Key: `VITE_API_URL`
5. Value: `https://YOUR-BACKEND-URL.up.railway.app/api`
6. Click **Add**

### 4. Backend CORS Configuration (Already Fixed in Code)

The backend `app/main.py` already has:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="https?://.*",  # Allows any Railway domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 5. Database Initialization

The `nixpacks.toml` has been updated to automatically run database initialization:
```toml
[phases.build]
cmds = [
    "cd backend && /opt/venv/bin/python scripts/init_db.py || echo 'Database init skipped'"
]
```

This runs automatically when you redeploy.

### 6. Verify Deployment

After setting environment variables and redeploying:

1. **Check Backend Health**:
   ```
   https://YOUR-BACKEND-URL.up.railway.app/health
   ```
   Should return: `{"status":"healthy","version":"1.0.0"}`

2. **Check API Docs**:
   ```
   https://YOUR-BACKEND-URL.up.railway.app/docs
   ```
   Should show Swagger UI

3. **Check Frontend Console** (F12):
   - Look for: `🚀 Primary API URL: https://...`
   - Should match your backend URL

### 7. Test Campaign Creation

1. Log in as admin: `admin@adplatform.com` / `admin123`
2. Create a new campaign
3. Open browser console (F12)
4. Check for errors
5. If you see "Failed to fetch" or CORS errors:
   - Double-check the `VITE_API_URL` environment variable
   - Make sure it includes `/api` at the end
   - Redeploy frontend after changing variables

### 8. Test Admin Save

1. Go to Admin Pricing page
2. Change a value
3. Click Save
4. Check console for errors
5. Common issues:
   - "403 Forbidden" = User not logged in as admin
   - "401 Unauthorized" = Session expired, log in again
   - "Network error" = API URL wrong

## Troubleshooting

### Error: "Network Error" or "Failed to fetch"
**Solution**: Check `VITE_API_URL` environment variable
```bash
# In Railway Frontend Service → Variables
VITE_API_URL=https://balanced-wholeness-production-ca00.up.railway.app/api
```
Then **redeploy frontend**.

### Error: "500 Internal Server Error"
**Solution**: Check Railway backend logs
1. Railway Dashboard → Backend Service → Deployments
2. Click latest deployment → View Logs
3. Look for Python errors
4. Common fix: Redeploy to trigger database init

### Error: "Database not found" or "table doesn't exist"
**Solution**: Manually initialize database
1. Railway Dashboard → Backend Service
2. Click "..." menu → Shell
3. Run:
   ```bash
   cd backend
   python scripts/init_db.py
   ```

### Error: "CORS policy blocked"
**Solution**: Already fixed in code, but if persists:
1. Check backend logs for CORS errors
2. Verify frontend URL is https:// not http://
3. Clear browser cache

## Quick Deploy Checklist

- [ ] Backend deployed with PostgreSQL database attached
- [ ] Frontend deployed
- [ ] `VITE_API_URL` set in frontend variables
- [ ] Backend URL copied correctly (with `/api`)
- [ ] Both services redeployed after variable changes
- [ ] Backend health endpoint returns 200 OK
- [ ] Frontend console shows correct API URL
- [ ] Can log in successfully
- [ ] Campaign creation works
- [ ] Admin save works

## Testing URLs

Replace `YOUR-BACKEND` with your actual Railway backend domain:

- Health: `https://YOUR-BACKEND.up.railway.app/health`
- API Docs: `https://YOUR-BACKEND.up.railway.app/docs`
- Login Test: POST to `https://YOUR-BACKEND.up.railway.app/api/auth/login`

## Need More Help?

If errors persist, share:
1. Frontend console errors (F12 → Console)
2. Backend deployment logs from Railway
3. Network tab showing the failed request (F12 → Network)
4. Screenshot of your Railway environment variables
