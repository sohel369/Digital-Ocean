# Railway Environment Variables Setup Guide

## 🎯 Visual Step-by-Step Guide

### Step 1: Open Railway Dashboard
1. Go to: https://railway.app
2. Login to your account
3. You should see your projects

### Step 2: Select Backend Service
1. Click on your project (e.g., "Digital Ocean" or your project name)
2. You'll see multiple services (Frontend, Backend, Database)
3. Click on the **Backend** service (usually named "backend" or "api")

### Step 3: Navigate to Variables Tab
1. In the backend service view, you'll see several tabs at the top:
   - Deployments
   - Metrics
   - **Variables** ← Click this one
   - Settings
   - Logs

### Step 4: Add JWT_SECRET Variable

1. Click the **"New Variable"** button (usually blue/purple)
2. You'll see two input fields:
   - **Variable Name**: Type `JWT_SECRET`
   - **Value**: Paste your generated secret (from generate_jwt_secret.py)
3. Click **"Add"** button

**Example:**
```
Variable Name: JWT_SECRET
Value: ZLimJq3AC6NdeMX8ms2TYl0b8fSHgMqp-vjAg__SFMSsPycOt-RgVPHWsn8gWTGP
```

### Step 5: Add ACCESS_TOKEN_EXPIRE_MINUTES Variable

1. Click **"New Variable"** again
2. Fill in:
   - **Variable Name**: `ACCESS_TOKEN_EXPIRE_MINUTES`
   - **Value**: `1440`
3. Click **"Add"**

**Example:**
```
Variable Name: ACCESS_TOKEN_EXPIRE_MINUTES
Value: 1440
```

### Step 6: Add REFRESH_TOKEN_EXPIRE_DAYS Variable

1. Click **"New Variable"** again
2. Fill in:
   - **Variable Name**: `REFRESH_TOKEN_EXPIRE_DAYS`
   - **Value**: `30`
3. Click **"Add"**

**Example:**
```
Variable Name: REFRESH_TOKEN_EXPIRE_DAYS
Value: 30
```

### Step 7: Verify Variables

After adding all variables, you should see them listed in the Variables tab:

```
✅ JWT_SECRET = ZLimJq3AC6NdeMX8ms2TYl0b8fSHgMqp-vjAg__SFMSsPycOt-RgVPHWsn8gWTGP
✅ ACCESS_TOKEN_EXPIRE_MINUTES = 1440
✅ REFRESH_TOKEN_EXPIRE_DAYS = 30
✅ DATABASE_URL = postgresql://... (should already exist)
```

### Step 8: Wait for Automatic Redeploy

1. Railway will **automatically trigger a new deployment** when you add variables
2. You'll see a notification: "Deploying..."
3. Wait **2-3 minutes** for the deployment to complete
4. You can watch the progress in the **"Deployments"** tab

### Step 9: Check Deployment Logs

1. Go to **"Deployments"** tab
2. Click on the **latest deployment** (should be at the top)
3. Click **"View Logs"** or scroll down to see logs
4. Look for these success messages:

```
🔐 JWT SECRET CONFIGURATION CHECK
SECRET_KEY Length: 64 characters
✅ SECURITY: Custom JWT_SECRET detected (Length: 64)
✅ JWT Token Generation Test: SUCCESS (token length: XXX)
✅ JWT Token Validation Test: SUCCESS (decoded sub: 1)
Access Token Expiration: 1440 minutes (24.0 hours)
Refresh Token Expiration: 30 days
```

### Step 10: Test Authentication

1. Open your **Frontend URL** (e.g., https://your-app.railway.app)
2. **Clear browser cache**:
   - Press F12 to open DevTools
   - Go to Console tab
   - Run:
     ```javascript
     localStorage.clear();
     sessionStorage.clear();
     location.reload();
     ```
3. **Login** with admin credentials:
   - Email: `admin@adplatform.com`
   - Password: `admin123`
4. **Verify** in browser console:
   ```
   ✅ AUTH: Validated user admin@adplatform.com (ID: 1)
   ```
5. **Test persistence**:
   - Refresh the page (F5)
   - You should **stay logged in** ✅

---

## 🔍 Common Issues

### Issue 1: Variables not showing up

**Solution:**
- Refresh the Railway dashboard page
- Make sure you're in the correct service (Backend, not Frontend)
- Check if you have permission to edit variables

### Issue 2: Deployment not triggering

**Solution:**
- Manually trigger deployment:
  1. Go to Deployments tab
  2. Click "Deploy" button (top right)
  3. Select "Redeploy"

### Issue 3: Still seeing "Using default development JWT_SECRET" in logs

**Solution:**
- Double-check variable name is exactly: `JWT_SECRET` (case-sensitive!)
- Make sure there are no extra spaces in the variable name or value
- Try removing and re-adding the variable
- Manually trigger a new deployment

### Issue 4: Login still not working after adding variables

**Solution:**
1. Verify all 3 variables are added correctly
2. Check deployment logs for errors
3. Clear browser cache completely
4. Try incognito/private browsing mode
5. Run the test script: `python test_railway_auth.py`

---

## 📋 Final Checklist

Before considering the fix complete, verify:

- [ ] All 3 environment variables added in Railway
- [ ] Deployment completed successfully (green checkmark)
- [ ] Logs show "✅ Custom JWT_SECRET detected"
- [ ] Logs show "✅ JWT Token Generation Test: SUCCESS"
- [ ] Browser cache cleared
- [ ] Can login without errors
- [ ] No immediate logout after login
- [ ] Page refresh maintains login state

---

## 🎉 Success!

If all checks pass, your authentication is now working correctly!

**What changed:**
- JWT tokens are now signed with a secure, persistent secret
- Tokens last 24 hours instead of 30 minutes
- Refresh tokens last 30 days instead of 7 days
- No more random logouts on Railway restarts

**You can now:**
- Login as admin or user
- Stay logged in for 24 hours
- Refresh pages without losing session
- Use the platform normally

---

## 🔗 Additional Resources

- **Railway Docs**: https://docs.railway.app/develop/variables
- **JWT Best Practices**: https://jwt.io/introduction
- **FastAPI Security**: https://fastapi.tiangolo.com/tutorial/security/

---

## 💡 Pro Tips

1. **Save your JWT_SECRET**: Store it in a password manager for future reference
2. **Different secrets for different environments**: Use different JWT_SECRET for development and production
3. **Rotate secrets periodically**: Change JWT_SECRET every few months for better security (will require all users to re-login)
4. **Monitor logs**: Check Railway logs regularly for any authentication errors
5. **Backup variables**: Keep a copy of all environment variables in a secure location

---

## 📞 Need Help?

If you're still experiencing issues after following this guide:

1. Check the deployment logs for specific error messages
2. Run the test script: `python test_railway_auth.py`
3. Verify your backend code is up to date
4. Make sure Railway has the latest code from your Git repository
5. Try a fresh deployment from scratch

---

**Last Updated:** 2026-01-21  
**Version:** 1.0  
**Status:** ✅ Tested and Working
