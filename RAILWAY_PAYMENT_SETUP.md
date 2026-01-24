# Railway Payment (Stripe) Setup Guide

To enable **real payments** in your Railway deployment (instead of being redirected to the dashboard), you must configure the Stripe environment variables.

## ⚠️ Important
Without these variables, the system defaults to "Mock Mode" which simulates a successful payment and redirects you immediately to the dashboard.

## 🚀 Environment Variables to Add

### Step 1: Get Stripe Keys
1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com/apikeys).
2. For **Production (Real Money)**: Ensure "Test Mode" toggle is **OFF**.
3. For **Testing**: Ensure "Test Mode" toggle is **ON**.

You need:
- **Secret Key**: Starts with `sk_live_` (Production) or `sk_test_` (Testing).
- **Publishable Key**: Starts with `pk_live_` (Production) or `pk_test_` (Testing).
- **Webhook Secret**: Found in Developers > Webhooks (optional but recommended for async status updates).

### Step 2: Add Variables in Railway
1. Go to [Railway Dashboard](https://railway.app).
2. Select your Project > **Backend Service**.
3. Go to the **Variables** tab.
4. Add the following variables:

#### 1. STRIPE_SECRET_KEY (Required)
- **Name**: `STRIPE_SECRET_KEY`
- **Value**: `sk_live_...` (Your actual secret key)

#### 2. STRIPE_PUBLISHABLE_KEY (Required)
- **Name**: `STRIPE_PUBLISHABLE_KEY`
- **Value**: `pk_live_...` (Your actual publishable key)

#### 3. STRIPE_WEBHOOK_SECRET (Recommended)
- **Name**: `STRIPE_WEBHOOK_SECRET`
- **Value**: `whsec_...`

### Step 3: Redeploy
1. Railway typically redeploys automatically when variables change.
2. If not, click **Deploy** > **Redeploy**.

## ✅ Verification
Once redeployed:
1. Go to your live app.
2. Create a new campaign.
3. Click "Next Step" or "Submit".
4. You should now be redirected to a **Stripe Checkout Page** (hosted by stripe.com) instead of the internal dashboard.

---

## 🐞 Troubleshooting

**Still redirecting to Dashboard?**
- Check Railway logs. If you see `⚠️ STRIPE: Not configured, returning mock session`, then the variable is not set correctly.
- Ensure the key does NOT start with `dummy`.
- Ensure there are no spaces in the variable value.
