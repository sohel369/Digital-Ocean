# Railway Deployment - Quick Fix Summary

## ⚡ The Problem
Campaign creation and admin save fail on Railway (but work locally).

## 🎯 The Solution
Set the correct backend URL in frontend environment variables.

## 🔧 Steps to Fix (5 minutes)

### Step 1: Get Your Backend URL
1. Open Railway Dashboard
2. Click your **backend service** (balanced-wholeness)
3. Go to **Settings** tab
4. Copy the domain under **Public Networking**
   - Example: `balanced-wholeness-production-ca00.up.railway.app`

### Step 2: Set Frontend Environment Variable
1. Go to your **frontend service** in Railway
2. Click **Variables** tab
3. Add new variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://YOUR-BACKEND-URL.up.railway.app/api`
   - ⚠️ **Important**: Replace `YOUR-BACKEND-URL` with your actual backend domain from Step 1
   - ⚠️ **Important**: Make sure it starts with `https://` and ends with `/api`

### Step 3: Redeploy
1. Click **Deploy** button in frontend service
2. Wait for deployment to complete (~1-2 minutes)

### Step 4: Test
1. Open your Railway frontend URL
2. Try creating a campaign
3. Try saving admin settings
4. ✅ Should work now!

## 📝 Example Configuration

If your backend URL is: `balanced-wholeness-production-ca00.up.railway.app`

Then set in frontend:
```
VITE_API_URL=https://balanced-wholeness-production-ca00.up.railway.app/api
```

**Common Mistakes:**
- ❌ `http://` instead of `https://`
- ❌ Missing `/api` at the end
- ❌ Using frontend URL instead of backend URL
- ❌ Forgetting to redeploy after setting variable

## 🧪 Quick Test

After deploying visit (replace with your backend URL):
```
https://YOUR-BACKEND-URL.up.railway.app/health
```

Should return:
```json
{"status":"healthy","version":"1.0.0"}
```

## 🆘 Still Not Working?

1. Check browser console (F12 → Console)
2. Look for the API URL being used
3. Should show: `🚀 Primary API URL: https://your-backend.up.railway.app/api`
4. If wrong URL shown, double-check environment variable and redeploy

See **RAILWAY_FIX_GUIDE.md** for detailed troubleshooting.
