# 🚀 Railway Deployment Guide (Complete)

This project is configured to be deployed on Railway as two separate services (Frontend + Backend) from the same repository.

## 📦 Prerequisites

1.  **GitHub Repository**: Push this code to a GitHub repository.
2.  **Railway Account**: Log in to [Railway.app](https://railway.app).

---

## Step 1: Deploy Backend Service

1.  Click **New Project** → **Deploy from GitHub repo**.
2.  Select your repository.
3.  Click **Deploy Now**.
4.  **Important:** By default, it might pick up `railway.toml` which is good for the backend.
5.  Go to **Settings** → **General** and change the service name to `backend`.
6.  Go to **Variables** tab and add:
    *   `PORT` = `8000`
    *   `JWT_SECRET` = `(Use the secret generated in RAILWAY_CHECKLIST.md)`
    *   `DATABASE_URL` = (Add a PostgreSQL plugin in Railway and it will auto-populate this, or use your own)
7.  **Watch the deployment logs**. It should start successfully.

**Note:** If deployment fails, ensure the `Build Command` is empty (it uses Dockerfile) and `Start Command` matches `railway.toml`.

---

## Step 2: Deploy Frontend Service

1.  In the same Railway project, click **New** → **GitHub Repo**.
2.  Select the **SAME repository** again.
3.  Click **Deploy Now**.
4.  Once created, go to **Settings** → **General**.
    *   Change name to `frontend`.
    *   **Root Directory**: Leave as `/` (root).
5.  **Configuration File**:
    *   Railway checks for `railway.toml` by default. We need to tell it to use the frontend config.
    *   Go to **Settings** → **Service** (or Build) settings.
    *   Find **Railway Config File Path**.
    *   Change it from `railway.toml` to `railway.frontend.toml`.
6.  Go to **Variables** tab and add:
    *   `PORT` = `3000`
    *   `VITE_API_URL` = (The **Public URL** of your Backend service, e.g., `https://backend-production.up.railway.app`)
        *   *Note: Since we use a proxy in `serve.js`, you can also use the internal private URL if checking Private Networking, but using the Public HTTPS URL is safest to start.*
7.  Railway will redeploy.

---

## Step 3: Verify Connections

1.  Open your **Frontend URL** (e.g., `https://frontend-production.up.railway.app`).
2.  Open **Developer Tools** (F12) → Network Tab.
3.  Try to **Login**.
4.  You should see a request to `https://frontend.../api/auth/login`.
5.  This request is proxied by `serve.js` to your Backend Service.
6.  If successful, you are ready!

---

## 🛠️ Troubleshooting

*   **Backend 404/500 Errors**: Check Backend Service logs. Ensure `DATABASE_URL` is correct.
*   **Frontend "Backend Unreachable"**: Check Frontend Service logs. Ensure `VITE_API_URL` variable is set correctly in the Frontend service.
*   **CORS Issues**: You shouldn't see these because `serve.js` proxies requests. If you do, ensure you are hitting `/api/...` endpoints.

## 📂 Configuration Files Reference

*   **Backend**: Uses `railway.toml` and `Dockerfile`.
*   **Frontend**: Uses `railway.frontend.toml` and `frontend.Dockerfile`.
*   **Proxy Server**: `serve.js` (handles routing and API proxying).
