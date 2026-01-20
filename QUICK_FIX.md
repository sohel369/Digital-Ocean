## 🎯 Railway Authentication Error - Quick Fix Guide

### সমস্যা (Problem):
- Admin: "Could not validate credentials" ❌
- User: "Your session has expired" ❌  
- Login করার পর logout হচ্ছে ❌

### সমাধান (Solution) - 5 Minutes:

#### 1️⃣ JWT Secret Copy করুন:
```
6AC8271E64E3893B10EDF923E32841EB6E17CE15A2AE8AD4F79C21EA522307F2
```

#### 2️⃣ Railway Dashboard-এ যান:
🔗 https://railway.app

#### 3️⃣ Backend Service → Variables → Add:

**Variable Name:** `JWT_SECRET`
**Value:** `6AC8271E64E3893B10EDF923E32841EB6E17CE15A2AE8AD4F79C21EA522307F2`

(Optional but recommended)
**Variable Name:** `ACCESS_TOKEN_EXPIRE_MINUTES`
**Value:** `1440`

#### 4️⃣ Save করুন → Railway automatic redeploy করবে (2-3 min)

#### 5️⃣ Browser-এ যান এবং old cache clear করুন:

**Console-এ (F12) run করুন:**
```javascript
localStorage.clear();
location.reload();
```

#### 6️⃣ Login করুন:
- Admin: admin@adplatform.com / admin123
- ✅ Success! No more errors

---

### 📚 বিস্তারিত Documentation:

1. **RAILWAY_AUTH_FIX.md** - Complete authentication fix guide (Bengali + English)
2. **RAILWAY_CHECKLIST.md** - Step-by-step verification checklist  
3. **generate-jwt-secret.ps1** - Script to generate new JWT secrets

---

### ⚠️ Important:
- এই JWT_SECRET **কাউকে share করবেন না**
- Production এবং Development-এ **আলাদা secret ব্যবহার করুন**
- Railway Variables-এ add করার পর backend **automatically redeploy** হবে

---

### ✅ Expected Result:
- Login works perfectly ✅
- Session lasts 24 hours ✅
- No "Could not validate credentials" error ✅
- No unexpected logout ✅

**Total Time: ~5 minutes**
