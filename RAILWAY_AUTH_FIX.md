# Railway Authentication Error Fix
## সমস্যা (Problem)

Railway deployment-এ দুটি authentication error হচ্ছে:
1. **Admin**: "Could not validate credentials"
2. **User**: "Your session has expired. Please log in again to continue."
3. Login করার পরেই logout হয়ে যাচ্ছে

## মূল কারণ (Root Cause)

**JWT_SECRET environment variable Railway-তে সেট করা নেই!**

যখন JWT_SECRET সেট না থাকে:
- Backend default secret key ব্যবহার করে: `"dev_secret_key_change_me_in_production"`
- Railway রেস্টার্ট বা redeploy হলে, নতুন random secret তৈরি হতে পারে
- পুরাতন tokens দিয়ে তৈরি sessions invalid হয়ে যায়
- Result: **"Could not validate credentials"** error

এছাড়া:
- Access token expiration মাত্র **30 মিনিট**
- এটি খুব কম সময়, তাই frequently logout হয়

---

## ✅ সমাধান (Solution)

### Step 1: Railway-তে JWT_SECRET সেট করুন

#### Option A: Railway Dashboard (Recommended)
1. **Railway Dashboard** খুলুন: https://railway.app
2. আপনার **Backend Service** ক্লিক করুন
3. **Variables** tab-এ যান
4. **New Variable** ক্লিক করুন
5. নিচের variable যোগ করুন:

```
Variable Name: JWT_SECRET
Value: [একটি strong random secret - নিচে দেখুন]
```

#### Strong JWT Secret তৈরি করতে:

**PowerShell (Windows) দিয়ে:**
```powershell
# 64-character random hex string
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

**অথবা manually:**
```
railway_production_jwt_secret_2026_secure_key_do_not_share_1234567890abcdef
```

**⚠️ Important:**
- এই secret **কাউকে শেয়ার করবেন না**
- Production এবং Development-এ **আলাদা secret ব্যবহার করুন**
- Secret copy করে নিরাপদ জায়গায় রাখুন

6. **Add** ক্লিক করুন
7. Railway **automatically redeploy** করবে (2-3 মিনিট অপেক্ষা করুন)

---

### Step 2: Token Expiration Time বাড়ান (Optional)

Railway Variables-এ আরও যোগ করুন:

```
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```
(1440 minutes = 24 hours)

এবং:
```
REFRESH_TOKEN_EXPIRE_DAYS=30
```
(30 days)

---

### Step 3: Backend Logs চেক করুন

Railway redeploy হওয়ার পর:

1. Railway Dashboard → **Backend Service** → **Deployments**
2. Latest deployment-এ ক্লিক করুন
3. **View Logs** ক্লিক করুন
4. এই log দেখা উচিত:
   ```
   🔑 SECURITY: Custom JWT_SECRET detected (Length: XX)
   ```

যদি এটি দেখায়:
   ```
   ⚠️  SECURITY: Using default development JWT_SECRET
   ```
তাহলে JWT_SECRET সঠিকভাবে সেট হয়নি। আবার চেষ্টা করুন।

---

### Step 4: Frontend থেকে Test করুন

1. আপনার Railway **Frontend URL** খুলুন
2. Browser console খুলুন (F12)
3. Login করার চেষ্টা করুন:
   - Admin: `admin@adplatform.com` / `admin123`
   - User: যেকোনো registered user

4. Console-এ দেখুন:
   ```
   ✅ AUTH: Validated user admin@adplatform.com (ID: X)
   ```

5. Network tab-এ check করুন:
   - `/api/auth/login/json` request → Status **200 OK**
   - Response-এ `access_token` এবং `refresh_token` আছে কিনা

---

### Step 5: Existing User Sessions Clear করুন

যদি এখনও error আসে:

1. Browser Console-এ run করুন:
```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```

2. আবার login করুন

---

## 🔍 Verification Checklist

Backend Variables (Railway Dashboard → Backend → Variables):
- [x] `JWT_SECRET` - একটি strong random string
- [x] `ACCESS_TOKEN_EXPIRE_MINUTES` - 1440 (recommended)
- [x] `REFRESH_TOKEN_EXPIRE_DAYS` - 30 (recommended)
- [x] `DATABASE_URL` - PostgreSQL connection string

Backend Logs:
- [x] "🔑 SECURITY: Custom JWT_SECRET detected"
- [x] "✅ Schema migrations checked/applied"
- [x] No JWT decode errors

Frontend Login Test:
- [x] Login successful
- [x] No "Could not validate credentials" error  
- [x] No "Your session has expired" error
- [x] Dashboard loads correctly
- [x] API calls working (stats, campaigns, etc.)

---

## 🛠️ Troubleshooting

### Error: "Could not validate credentials" এখনও আসছে

**Check:**
1. JWT_SECRET Railway-তে সঠিকভাবে সেট করা আছে কিনা
2. Backend redeploy হয়েছে কিনা (Variables add করার পর)
3. Browser localStorage clear করেছেন কিনা

**Solution:**
```javascript
// Browser console-এ
localStorage.removeItem('access_token');
localStorage.removeItem('refresh_token');
localStorage.removeItem('user');
location.reload();
```

---

### Error: "Your session has expired" frequently আসছে

**Reason:** Token expiration time কম

**Solution:**
Railway Variables-এ যোগ করুন:
```
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

---

### Error: "500 Internal Server Error" on Login

**Reason:** Database Schema imbalance. নতুন columns (যেমন: `industry`, `oauth_provider`) তৈরি না হওয়ার কারণে backend crash করছে।

**Solution:**
1. Backend automatic migration এখন সব columns যোগ করে দিবে।
2. যদি তবুও সমস্যা হয়, সরাসরি **Railway Console**-এ এই query রান করতে পারেন:
   ```sql
   ALTER TABLE users ADD COLUMN IF NOT EXISTS industry VARCHAR(255);
   ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(50);
   ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_id VARCHAR(255);
   ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;
   ```
3. Backend Logs-এ দেখুন **"✅ Database synchronisation complete"** মেসেজটি আসছে কিনা।

---

## 📝 Additional Security Recommendations

### Production Environment Variables (Railway)

```bash
# Required
JWT_SECRET=your_super_secure_random_secret_here_64_chars_min
DATABASE_URL=postgresql://user:pass@host:port/dbname

# Recommended
ACCESS_TOKEN_EXPIRE_MINUTES=1440
REFRESH_TOKEN_EXPIRE_DAYS=30
DEBUG=false
LOG_LEVEL=INFO

# Optional (if using)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
```

---

## 🎯 Expected Result

সফল fix-এর পর:

✅ Admin login করতে পারবে এবং session maintain হবে
✅ Users login করতে পারবে এবং 24 hours পর্যন্ত logged in থাকবে  
✅ "Could not validate credentials" error আর আসবে না
✅ "Your session has expired" frequently আসবে না
✅ Logout button click করলেই শুধু logout হবে

---

## 🔗 Quick Links

- Railway Dashboard: https://railway.app
- Backend API Docs: https://balanced-wholeness-production-ca00.up.railway.app/docs
- Test Script: `test-railway-routes.js`

---

## Summary (সংক্ষেপে)

**একটি লাইনে solution:**
Railway Dashboard → Backend Service → Variables → Add: `JWT_SECRET=একটি_random_secure_string` → Save → Wait 2 mins → Clear browser cache → Login again ✅
