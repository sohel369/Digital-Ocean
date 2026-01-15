# Railway Environment configuration Guide (Vite + React)

আপনার Frontend (React) কে Backend (FastAPI) এর সাথে connect করার জন্য নিচের step গুলো follow করুন।

## ✅ Step 1: Railway Dashboard-এ Variable Set করা

আপনার code এখন `VITE_API_URL` খুঁজছে। এটি Railway-এ set করতে হবে।

1.  **Railway Dashboard**-এ যান (https://railway.app)।
2.  আপনার Project open করুন।
3.  **Frontend Service** (React App) টি select করুন।
4.  উপরে **"Variables"** Tab-এ click করুন।
5.  **New Variable** button-এ click করুন।
6.  নিচের তথ্য দিন:
    *   **VARIABLE_NAME:** `VITE_API_URL`
    *   **VALUE:** `https://balanced-wholeness-production-ca00.up.railway.app/api`
7.  **Add** এ click করুন।

✨ **Note:** Variable add করার সাথে সাথে Railway অটোমেটিক **Redeploy** শুরু করবে। ২-৩ মিনিট অপেক্ষা করুন।

---

## ✅ Step 2: Code এ পরিবর্তন (ইতিমধ্যে করা হয়েছে)

আমরা আপনার `src/context/AppContext.jsx` ফাইলে code update করেছি। এটি এখন নিচের logic follow করে:

```javascript
// src/context/AppContext.jsx

// 1. Priority: যদি Railway তে VITE_API_URL সেট করা থাকে, সেটা ব্যবহার করবে।
// 2. Fallback: যদি Localhost এ থাকেন, তাহলে proxy (/api) ব্যবহার করবে।
// 3. Safety Net: যদি কিছু না পায়, তাহলে hardcoded সঠিক URL ব্যবহার করবে।

const API_BASE_URL = import.meta.env.VITE_API_URL 
    || (window.location.hostname === 'localhost' ? '/api' : 'https://balanced-wholeness-production-ca00.up.railway.app/api');
```

**আপনার আর কোড পরিবর্তন করার প্রয়োজন নেই।**

---

## ✅ Step 3: Verify করা (Redeploy এর পর)

Deploy শেষ হলে:

1.  আপনার ওয়েবসাইট open করুন (Refresh দিন)।
2.  Right click করে **Inspect** -> **Console** -এ যান।
3.  দেখবেন: `🚀 API Base URL: https://balanced-wholeness-production-ca00.up.railway.app/api`
4.  যদি দেখেন, তাহলে Connection ঠিক আছে!

---

## ❓ সাধারণ প্রশ্নের উত্তর

**Q: `process.env` ব্যবহার করব না কেন?**
A: Vite এ `process.env` কাজ করে না, `import.meta.env` ব্যবহার করতে হয়। এবং variable এর নাম অবশ্যই `VITE_` দিয়ে শুরু হতে হবে।

**Q: `import.meta.env.VITE_API_URL` undefined দেখাচ্ছে কেন?**
A: সম্ভবত আপনি Railway তে variable টি set করেননি অথবা `VITE_` prefix দেননি। অথবা redeploy এখনো শেষ হয়নি।
