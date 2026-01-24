# 🚨 URGENT FIX: CONNECT FRONTEND & STRIPE

Your deployment is split into two services (Frontend & Backend). They are currently ** disconnected**, which is why login and payments fail.

## 1️⃣ FIND YOUR BACKEND URL
1. Go to **Railway Dashboard**.
2. Look for your **Python/Backend** service (NOT the one named `digital-ocean-production-01ee`).
3. If you don't have a second service, **YOU MUST DEPLOY ONE**.
   - Create New Service -> GitHub Repo -> `Digital-Ocean`.
   - Variables: Add `PORT=8000`.
4. Copy the **Public Domain** of this backend service (e.g., `https://backend-production-xyz.up.railway.app`).

## 2️⃣ CONNECT FRONTEND
1. Go to your **Frontend Service** (`digital-ocean-production-01ee`).
2. Go to **Variables**.
3. Add: `VITE_API_URL`
4. Value: `https://backend-production-xyz.up.railway.app` (Paste URL from Step 1).

## 3️⃣ SETUP PAYMENTS (STRIPE)
1. Go to your **Backend Service** (the Python one).
2. Go to **Variables**.
3. Add `STRIPE_SECRET_KEY` (starts with `sk_live_...`).
4. Add `STRIPE_PUBLISHABLE_KEY` (starts with `pk_live_...`).

## ✅ DONE
Once both services redeploy (wait 3 mins), the "Pay" button will work.
