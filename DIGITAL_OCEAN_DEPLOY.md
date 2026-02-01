# Production Deployment Guide (Digital Ocean / Railway)

## 1. Overview
Your application is designed to be deployed as two separate services:
1. **Backend**: Python/FastAPI (Port 8000)
2. **Frontend**: Node.js/Express (Port 3000) - Serves the React app and proxies API calls.

## 2. Digital Ocean App Platform Setup

### Step 1: Create Backend Component
1. Create a `Web Service`.
2. Source: Your GitHub Repo.
3. Directory: `/` (Root).
4. Build Command: `pip install -r requirements.txt` (or use Dockerfile).
    - *Better Option*: Select **Docker** build if available, pointing to `backend/backend.Dockerfile`.
5. Run Command: `uvicorn backend.app.main:app --host 0.0.0.0 --port 8080`
6. **Environment Variables**:
   - `DATABASE_URL`: Your production PostgreSQL URL.
   - `JWT_SECRET`: A long random string.
   - `STRIPE_SECRET_KEY`: Your Stripe Live Secret Key (`sk_live_...`).
   - `CORS_ORIGINS`: `https://your-frontend-domain.com` (Optional, as backend allows all by default).

### Step 2: Create Frontend Component
1. Create a `Web Service` (Not just a Static Site, because we use `serve.js` for proxying).
2. Source: Your GitHub Repo.
3. Build Command: `npm install && npm run build`.
4. Run Command: `npm run start` (This runs `node serve.js`).
5. **Environment Variables**:
   - `VITE_API_URL`: **IMPORTANT** - The URL of your Backend Service (e.g., `https://backend-app.ondigitalocean.app`).
   - `PORT`: `8080` (Digital Ocean injects this, `serve.js` will use it).

## 3. Verify Connection
When users visit `https://your-frontend.com`:
1. The React App loads.
2. Apps calls `/api/geo/detect-country`.
3. `serve.js` receives this and proxies it to `VITE_API_URL` (`https://your-backend.app/api/geo/detect-country`).
4. **Success!**

## 4. Custom Domain
1. Buy your domain (e.g., `adplatform.com`).
2. Add it to Digital Ocean App Platform -> Settings -> Domains.
3. Your code is already configured to handle any hostname (`AppContext.jsx` and `main.py` are permissive).

## Troubleshooting "Connection Refused"
If you see this in production:
1. Check `VITE_API_URL` in Frontend Settings. It MUST start with `https://` and no trailing slash.
2. Check Backend Logs. Is it crashing?
3. Ensure Backend is listening on `0.0.0.0`, not `127.0.0.1`.
