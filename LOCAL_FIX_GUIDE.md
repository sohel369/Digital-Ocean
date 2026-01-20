# Local Development Connection Fix

## Problem
Frontend (Vite) shows `ECONNREFUSED 127.0.0.1:8000` errors when trying to connect to the backend API.

## Status Check ✅
- Backend IS running on port 8000 ✅
- Backend responds to `curl http://localhost:8000/api/health` ✅  
- Process ID: 8024 (python/uvicorn)
- Frontend is stuck trying to connect ❌

## Root Cause
The Vite dev server's proxy connection was established before the backend was ready, and is now in a bad state. The proxy needs to be refreshed.

## Solution

### Option 1: Restart Frontend (Recommended)
1. In the terminal running `npm run dev`, press `Ctrl+C`
2. Wait for it to stop completely
3. Run: `npm run dev` again
4. The proxy connection will be re-established

### Option 2: Hard Restart
If Option 1 doesn't work:
1. Stop both terminals (frontend and backend)
2. Start backend first: `.\run_backend.bat`
3. Wait 30 seconds for backend to fully start
4. Start frontend: `npm run dev`

### Option 3: Check Firewall (If still failing)
Windows Firewall might be blocking localhost connections:
```powershell
# Check if port 8000 is accessible
Test-NetConnection -ComputerName 127.0.0.1 -Port 8000

# If blocked, temporarily disable Windows Firewall for testing:
# Settings → Windows Security → Firewall & network protection → Turn off
```

## Verification
After restarting, you should see:
- No more `ECONNREFUSED` errors in terminal
- API calls succeeding in browser DevTools (F12 → Network)
- Dashboard loading correctly

## Railway Deployment
For Railway deployment issues, see `RAILWAY_FIX_STEPS.md`
