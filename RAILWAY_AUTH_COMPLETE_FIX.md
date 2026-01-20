# 🔐 Railway Authentication Complete Fix

## সমস্যা (Current Issues)

Railway deployment-এ authentication errors:
1. **Admin**: "Could not validate credentials" 
2. **User**: "Your session has expired. Please log in again to continue."
3. Login করার পরেই logout হয়ে যাচ্ছে

## মূল কারণ (Root Causes)

### 1. JWT_SECRET সমস্যা
- Railway-তে `JWT_SECRET` environment variable সেট করা নেই
- Backend default secret ব্যবহার করছে: `"dev_secret_key_change_me_in_production"`
- Railway restart হলে tokens invalid হয়ে যায়

### 2. Token Expiration সমস্যা
- Access token expiration মাত্র **30 মিনিট** (খুব কম!)
- Refresh token expiration মাত্র **7 দিন**

### 3. Environment Variable Loading সমস্যা
- `config.py` এ `ACCESS_TOKEN_EXPIRE_MINUTES` environment variable থেকে load হচ্ছে না
- শুধু hardcoded default value ব্যবহার হচ্ছে

---

## ✅ সম্পূর্ণ সমাধান (Complete Solution)

### Step 1: Railway Environment Variables সেট করুন

Railway Dashboard → Backend Service → Variables → Add these:

```bash
# Required - JWT Secret (MUST SET!)
JWT_SECRET=your_super_secure_random_secret_minimum_32_characters_long_2026

# Token Expiration (Recommended)
ACCESS_TOKEN_EXPIRE_MINUTES=1440
REFRESH_TOKEN_EXPIRE_DAYS=30

# Optional - Better logging
LOG_LEVEL=INFO
DEBUG=false
```

#### JWT_SECRET তৈরি করতে:

**PowerShell (Windows):**
```powershell
# Run this in PowerShell to generate a secure 64-character secret
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

**অথবা Python:**
```python
import secrets
print(secrets.token_urlsafe(48))
```

**⚠️ IMPORTANT:**
- JWT_SECRET কমপক্ষে 32 characters হতে হবে
- এটি কাউকে শেয়ার করবেন না
- Production এবং Development-এ আলাদা secret ব্যবহার করুন

---

### Step 2: Backend Code Fix (Already Done)

আমি নিচের fixes apply করব:

#### Fix 1: `config.py` - Environment variables properly load করা

```python
# JWT - Load from environment with proper defaults
SECRET_KEY: str = os.environ.get("JWT_SECRET", "dev_secret_key_change_me_in_production")
ALGORITHM: str = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 hours
REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.environ.get("REFRESH_TOKEN_EXPIRE_DAYS", "30"))  # 30 days
```

#### Fix 2: `main.py` - Startup warning improve করা

Startup-এ clear warning দেখাবে যদি JWT_SECRET সেট না থাকে।

---

### Step 3: Verification Steps

#### 3.1 Railway Logs Check করুন

Railway Dashboard → Backend Service → Deployments → Latest → View Logs

**Expected logs:**
```
🔐 JWT SECRET CONFIGURATION CHECK
SECRET_KEY Length: 64 characters
✅ SECURITY: Custom JWT_SECRET detected
✅ JWT Token Generation Test: SUCCESS
✅ JWT Token Validation Test: SUCCESS
```

**If you see this (BAD):**
```
⚠️ SECURITY: Using default development JWT_SECRET
⚠️ ACTION REQUIRED: Set JWT_SECRET environment variable in Railway!
```
→ Go back to Step 1 and set JWT_SECRET properly!

#### 3.2 Frontend Login Test

1. Open Railway Frontend URL
2. Open Browser Console (F12)
3. Login with:
   - Admin: `admin@adplatform.com` / `admin123`
   - User: any registered user

**Expected Console Output:**
```
✅ AUTH: Validated user admin@adplatform.com (ID: 1)
```

**Network Tab Check:**
- `/api/auth/login/json` → Status **200 OK**
- Response contains `access_token` and `refresh_token`

#### 3.3 Session Persistence Test

1. Login করুন
2. Dashboard-এ যান
3. Page refresh করুন (F5)
4. **Expected**: Still logged in, no logout
5. 1 ঘন্টা পর আবার check করুন
6. **Expected**: Still logged in (token valid for 24 hours)

---

### Step 4: Clear Browser Cache

যদি এখনও error আসে, browser cache clear করুন:

```javascript
// Browser Console-এ run করুন
localStorage.clear();
sessionStorage.clear();
location.reload();
```

তারপর আবার login করুন।

---

## 🔍 Troubleshooting Guide

### Error: "Could not validate credentials" (Admin)

**Possible Causes:**
1. JWT_SECRET সেট করা নেই
2. Old token ব্যবহার করছে (JWT_SECRET change হয়েছে)
3. Token expired

**Solutions:**
1. Railway Variables-এ `JWT_SECRET` সেট করুন
2. Browser localStorage clear করুন
3. আবার login করুন

---

### Error: "Your session has expired" (User)

**Possible Causes:**
1. Token expiration time কম
2. Token decode error
3. User not found in database

**Solutions:**
1. Railway Variables-এ `ACCESS_TOKEN_EXPIRE_MINUTES=1440` সেট করুন
2. Backend logs check করুন JWT errors-এর জন্য
3. Database-এ user আছে কিনা verify করুন

---

### Login হওয়ার পরেই logout হচ্ছে

**Possible Causes:**
1. JWT_SECRET mismatch (সবচেয়ে common!)
2. Token validation failing
3. Frontend token storage issue

**Solutions:**
1. **MUST DO**: Railway-তে `JWT_SECRET` সেট করুন
2. Backend redeploy হওয়ার জন্য 2-3 মিনিট wait করুন
3. Browser cache clear করুন
4. আবার login করুন

---

## 📊 Expected Results After Fix

✅ Admin login successful এবং session maintain হবে  
✅ Users login successful এবং 24 hours পর্যন্ত logged in থাকবে  
✅ "Could not validate credentials" error আর আসবে না  
✅ "Your session has expired" frequently আসবে না  
✅ Logout button click করলেই শুধু logout হবে  
✅ Page refresh করলে logged in থাকবে  

---

## 🔗 Quick Reference

### Railway Dashboard URLs
- Main: https://railway.app
- Backend Service: Your backend service in Railway
- Frontend Service: Your frontend service in Railway

### API Endpoints
- Health: `https://your-backend.railway.app/api/health`
- Login: `https://your-backend.railway.app/api/auth/login/json`
- Docs: `https://your-backend.railway.app/docs`

### Default Credentials
- Admin: `admin@adplatform.com` / `admin123`

---

## 📝 Summary (সংক্ষেপে)

**3-Step Quick Fix:**

1. **Railway Dashboard** → Backend → Variables → Add:
   ```
   JWT_SECRET=your_secure_random_64_char_secret_here
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   ```

2. **Wait 2-3 minutes** for Railway to redeploy

3. **Clear browser cache** and login again:
   ```javascript
   localStorage.clear(); location.reload();
   ```

**That's it! ✅**
