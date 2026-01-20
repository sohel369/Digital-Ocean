# Railway Authentication Configuration - Step by Step

## 🎯 Generated JWT Secret

আপনার secure JWT secret তৈরি হয়েছে:

```
6AC8271E64E3893B10EDF923E32841EB6E17CE15A2AE8AD4F79C21EA522307F2
```

⚠️ **এই secret কপি করে নিরাপদ জায়গায় রাখুন!**

---

## 📋 Railway Configuration Checklist

### Step 1: Backend Service Configuration

1. ✅ **Railway Dashboard খুলুন**: https://railway.app
2. ✅ **আপনার Project সিলেক্ট করুন**
3. ✅ **Backend Service** ক্লিক করুন (Python/FastAPI service)
4. ✅ **Variables** tab-এ যান
5. ✅ নিচের environment variables যোগ করুন:

#### Required Variables:

```bash
# JWT Authentication (CRITICAL)
JWT_SECRET=6AC8271E64E3893B10EDF923E32841EB6E17CE15A2AE8AD4F79C21EA522307F2

# Token Expiration (Recommended)
ACCESS_TOKEN_EXPIRE_MINUTES=1440
REFRESH_TOKEN_EXPIRE_DAYS=30
```

#### Database (Should already exist):
```bash
DATABASE_URL=postgresql://[your-postgres-connection-string]
```

#### Optional but Recommended:
```bash
DEBUG=false
LOG_LEVEL=INFO
```

6. ✅ **Add/Save করুন** - Railway automatically redeploy করবে
7. ✅ **2-3 মিনিট অপেক্ষা করুন** deployment complete হওয়ার জন্য

---

### Step 2: Verify Backend Deployment

1. **Deployments** tab-এ যান
2. Latest deployment দেখুন - Status **Active** (green) হওয়া উচিত
3. **View Logs** ক্লিক করুন
4. এই logs খুঁজুন:

   ✅ **Success Indicators:**
   ```
   🔑 SECURITY: Custom JWT_SECRET detected (Length: 64)
   ✅ Schema migrations checked/applied
   INFO:     Application startup complete
   INFO:     Uvicorn running on http://0.0.0.0:8000
   ```

   ❌ **Problem Indicators (ঠিক করতে হবে):**
   ```
   ⚠️  SECURITY: Using default development JWT_SECRET
   ERROR: Database connection failed
   ```

---

### Step 3: Frontend Service Configuration (Optional)

Frontend-এ কোনো JWT secret লাগবে না, তবে verify করুন:

1. **Frontend Service** ক্লিক করুন
2. **Variables** tab চেক করুন
3. এটি আছে কিনা দেখুন:

```bash
VITE_API_URL=https://balanced-wholeness-production-ca00.up.railway.app/api
```

যদি না থাকে, add করুন এবং frontend redeploy করুন।

---

### Step 4: Test Authentication

#### Test 1: Backend Health Check

Browser-এ খুলুন বা curl দিয়ে test করুন:

```bash
curl https://balanced-wholeness-production-ca00.up.railway.app/health
```

Expected Response:
```json
{"status":"healthy","version":"1.0.3-migration-fix"}
```

#### Test 2: Frontend Login

1. আপনার Railway **Frontend URL** খুলুন
2. Browser **DevTools** খুলুন (F12)
3. **Console** tab-এ যান
4. Login করুন:
   - **Admin**: `admin@adplatform.com` / `admin123`
   - **User**: যেকোনো registered user

5. Console-এ দেখুন:
   ```
   🔐 AUTH: Validating token...
   ✅ AUTH: Validated user admin@adplatform.com (ID: X)
   ✅ Backend Connectivity: OK
   ```

6. **Network** tab-এ দেখুন:
   - `/api/auth/login/json` → Status: **200 OK**
   - Response body-তে `access_token` এবং `refresh_token` আছে

#### Test 3: Session Persistence

1. Login করুন
2. Dashboard-এ navigate করুন
3. Browser refresh করুন (F5)
4. **Still logged in থাকা উচিত** - logout হবে না

---

### Step 5: Clear Old Sessions

ব্রাউজারে পুরাতন invalid tokens থাকতে পারে। Clean করতে:

**Browser Console-এ run করুন:**
```javascript
// Clear all stored authentication data
localStorage.clear();
sessionStorage.clear();

// Optional: Just clear auth tokens
// localStorage.removeItem('access_token');
// localStorage.removeItem('refresh_token');
// localStorage.removeItem('user');

// Reload the page
location.reload();
```

এরপর আবার login করুন।

---

## 🔍 Verification Results

### ✅ Success Criteria

- [ ] JWT_SECRET Railway backend-এ set করা আছে
- [ ] Backend deployment successful এবং logs-এ "Custom JWT_SECRET detected" দেখা যাচ্ছে
- [ ] Frontend থেকে login করা যাচ্ছে
- [ ] "Could not validate credentials" error আসছে না
- [ ] "Your session has expired" frequently আসছে না
- [ ] Login করার পরে logout হচ্ছে না
- [ ] Dashboard এবং সব features কাজ করছে
- [ ] Browser refresh করলেও logged in থাকছে

---

## 🛠️ Troubleshooting

### সমস্যা 1: "Could not validate credentials" এখনও আসছে

**Solutions:**
1. Railway Variables-এ JWT_SECRET সঠিকভাবে add করেছেন কিনা check করুন
2. Backend **redeploy** হয়েছে কিনা verify করুন (Variables add করার পর automatic হওয়া উচিত)
3. Browser localStorage clear করুন (Step 5 দেখুন)
4. Backend logs দেখুন - JWT decode error আছে কিনা

### সমস্যা 2: Login করার পরেই logout হচ্ছে

**Possible Causes:**
- JWT_SECRET সঠিকভাবে set হয়নি
- Backend restart হয়েছে different secret দিয়ে
- Token decode করতে পারছে না

**Solutions:**
1. Backend logs দেখুন:
   ```
   ❌ AUTH ERROR: JWT Error: Signature verification failed
   ```
   এই error থাকলে, JWT_SECRET মিসম্যাচ আছে

2. Railway Variables verify করুন - JWT_SECRET ঠিক আছে কিনা

3. Backend service **manually restart** করুন:
   - Railway Dashboard → Backend Service → Settings → Restart

### সমস্যা 3: Admin login করতে পারছে কিন্তু User পারছে না

**Cause:** User database-এ নেই বা password wrong

**Solutions:**
1. Signup করে নতুন user তৈরি করুন
2. অথবা backend-এ test user create করতে script run করুন

---

## 📊 Current Configuration Summary

**Backend Service:**
- URL: `https://balanced-wholeness-production-ca00.up.railway.app`
- JWT_SECRET: ✅ Set (64 characters)
- Token Expiry: 1440 minutes (24 hours)
- Database: PostgreSQL (recommended)

**Frontend Service:**
- VITE_API_URL: Points to backend
- Proxy: Not needed (direct API calls)

**Authentication:**
- Method: JWT Bearer token
- Admin: admin@adplatform.com
- Token in: `Authorization: Bearer <token>` header

---

## 🎉 Expected Final Result

সফলভাবে configure করার পর:

✅ Admin এবং User উভয়ই login করতে পারবে
✅ Session 24 hours পর্যন্ত active থাকবে
✅ Browser refresh করলেও logged in থাকবে
✅ Dashboard, campaigns, settings সব features কাজ করবে
✅ কোনো "Could not validate credentials" error আসবে না
✅ কোনো unexpected logout হবে না

---

## 📞 Support

যদি সমস্যা continue করে:

1. **Backend Logs** দেখুন: Railway Dashboard → Backend → Deployments → View Logs
2. **Browser Console** দেখুন: F12 → Console tab
3. **Network Requests** দেখুন: F12 → Network tab → Filter by "api"

**Key Files Created:**
- `RAILWAY_AUTH_FIX.md` - বিস্তারিত authentication fix guide
- `generate-jwt-secret.ps1` - JWT secret generator
- `RAILWAY_CHECKLIST.md` - এই checklist

---

**🚀 Ready to deploy? Follow the steps above and test thoroughly!**
