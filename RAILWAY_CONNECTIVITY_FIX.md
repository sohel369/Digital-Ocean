# 🚨 CRITICAL FIX: Connect Frontend to Backend

Your frontend is likely trying to connect to a **non-existent** or **old** backend because the connection URL is missing. This causes 404 errors during login and payments.

## Step 1: Get Your Backend URL
1. Open [Railway Dashboard](https://railway.app).
2. Click on your project.
3. Click on the **Backend** service.
4. Top right (or under "Networking"), copy the **Public Domain**.
   - It usually looks like: `project-name-production.up.railway.app`
   - **Note:** Make sure it stays `https://...`

## Step 2: Configure Frontend
1. Go back to project view.
2. Click on the **Frontend** service (where `serve.js` runs).
3. Go to **Variables** tab.
4. Add a new variable:
   - **Name:** `VITE_API_URL`
   - **Value:** (Paste your Backend URL from Step 1)
   - *Example:* `https://backend-production-123.up.railway.app`

## Step 3: Configure Stripe (If not done)
1. Go to **Backend** service.
2. Go to **Variables**.
3. Add your Stripe keys if missing:
   - `STRIPE_SECRET_KEY` (sk_live_...)
   - `STRIPE_PUBLISHABLE_KEY` (pk_live_...)

## Step 4: Verify
1. Wait for the Frontend to redeploy (2-3 mins).
2. Open your app.
3. Try to login and create a campaign.
4. The payment page should now work!

---
**Why this happens:**
The `serve.js` file defaults to a placeholder URL (`balanced-wholeness...`) if `VITE_API_URL` is not set. You must override this with your actual backend URL.
