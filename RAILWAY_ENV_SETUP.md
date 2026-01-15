# Railway Environment Variable Setup & Fix Guide

## 1. Set Environment Variable in Railway

To ensure your frontend uses the correct Backend URL regardless of code changes, you must set the `VITE_API_URL` environment variable in your Railway project.

1.  Go to your **Railway Dashboard**.
2.  Select your **Frontend Service** (the React app).
3.  Click on the **Variables** tab.
4.  Click **New Variable**.
5.  Enter:
    *   **Variable Name:** `VITE_API_URL`
    *   **Value:** `https://balanced-wholeness-production-ca00.up.railway.app/api`
6.  Click **Add**.
7.  Railway will automatically trigger a **Redeploy**.

---

## 2. Dynamic Code Implementation

We have updated `src/context/AppContext.jsx` to prioritize this environment variable.

**Code Logic:**
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL 
    || (window.location.hostname === 'localhost' ? '/api' : 'https://balanced-wholeness-production-ca00.up.railway.app/api');
```
*   **Priority 1:** `import.meta.env.VITE_API_URL` (The variable you just set).
*   **Priority 2:** `/api` (If running on localhost).
*   **Priority 3:** Hardcoded URL (Fallback safety net).

---

## 3. Axios Instance Example (If used later)

If you decide to switch to `axios` in the future, here is how you would configure it dynamically:

```javascript
// src/api/axiosConfig.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL 
    || (window.location.hostname === 'localhost' ? '/api' : 'https://balanced-wholeness-production-ca00.up.railway.app/api');

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true // Important for cookies/sessions
});

// Add interceptor for Auth Token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
```

---

## 4. Verification & Testing (After Redeploy)

Once Railway redeploys the app:

1.  Open your website in the browser (e.g., Chrome).
2.  Open **Developer Tools** (F12 or Right Click -> Inspect).
3.  Go to the **Console** tab.
4.  Refresh the page.
5.  Look for these logs:
    *   `🌐 App Environment: production`
    *   `🚀 API Base URL: https://balanced-wholeness-production-ca00.up.railway.app/api`
6.  If you see the **old** Digital Ocean URL, verify the Railway Variable again.
7.  Go to the **Network** tab, filter by `Fetch/XHR`, and perform an action (like Login or Create Campaign). Ensure the Request URL starts with the correct Backend URL.
