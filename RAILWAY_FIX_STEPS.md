# Railway Deployment & Fix Checklist

Follow this guide to fix your Frontend-Backend connection errors and Database issues.

## ⚠️ The Problem
Your Frontend is running on `digital-ocean-production...` but it thinks the API is on `localhost` or checking its own URL, leading to **500 Errors**.
Your Backend has the code to fix the database ("headline missing"), but it needs to be accessible by the frontend.

---

## ✅ Step 1: Set Environment Variable in Railway (Crucial)

This tells the Frontend exactly where the Backend lives.

1.  Go to **Railway Dashboard** → Click your **Frontend Service** (the React app).
2.  Click the **Variables** tab.
3.  Click **New Variable**.
4.  Add this mapping:
    *   **Variable Name:** `VITE_API_URL`
    *   **Value:** `https://balanced-wholeness-production-ca00.up.railway.app/api`
    *(Note: Ensure there is no trailing slash after `/api` unless your code expects it, but your current code handles it)*
5.  Click **Add**. This will trigger a **Redeploy**.

---

## ✅ Step 2: Verify Backend CORS (Automatically Handled)

We verified your `main.py`. It is already configured correctly for Railway:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="https?://.*",  # Allows your frontend domain dynamically
    allow_credentials=True,            # Allows cookies/auth headers
    ...
)
```
**No changes needed here.**

---

## ✅ Step 3: Fix Database Schema (Missing Columns)

Your Backend `main.py` has a "Self-Healing" startup script. It **automatically** adds missing columns like `headline` when the server starts.

**To ensure it runs:**
1.  Go to **Railway Dashboard** → **Backend Service**.
2.  Click **Settings** → **Restart Service**.
3.  Wait 1-2 minutes.
4.  Go to **Deployments** → **View Logs**.
5.  Look for logs like:
    *   `🛠️ Checking for schema migrations...`
    *   `✅ Schema migrations checked/applied`

**If you want to manually verify:**
We created a script `backend/check_db_schema.py`. You can run this locally if you have the Postgres URL, or deploy it.
*   **Locally:** `DATABASE_URL="postgresql://..." python backend/check_db_schema.py`

---

## ✅ Step 4: Verify Frontend Code (Done)

We updated `src/context/AppContext.jsx` for you.
It now strictly follows this logic:
1.  Is `VITE_API_URL` set? **Use it.** (This happens after Step 1)
2.  Is it Localhost? **Use /api proxy.**
3.  Fallback? **Use the hardcoded balanced-wholeness URL.**

**Credentials & Headers:**
Your code already includes:
```javascript
fetch(..., {
   credentials: 'include', // Important for cookies
   headers: { ...getAuthHeaders() } // Important for strict tokens
})
```
This is correct.

---

## ✅ Step 5: Final Testing

After the Railway Frontend redeploys (takes ~2-3 mins):

1.  Open your Frontend URL.
2.  Open **Developer Tools (F12)** → **Network**.
3.  Try to **Login** or **Create Campaign**.
4.  Click the request in the Network tab.
5.  **Verify Request URL:** It should start with `https://balanced-wholeness...`, NOT `https://digital-ocean...`.
6.  **Verify Status:** It should be `200 OK` or `201 Created`.

If you still see 500 API errors, check the **Backend Logs** in Railway immediately for the specific Python error.
