@echo off
echo.
echo ================================================================================
echo Railway Deployment Health Check
echo ================================================================================
echo.

echo Testing Backend Health...
echo.
curl -s https://balanced-wholeness-production-ca00.up.railway.app/health
echo.
echo.

echo Testing Backend API Root...
echo.  
curl -s https://balanced-wholeness-production-ca00.up.railway.app/api
echo.
echo.

echo Testing Backend Debug Routes...
echo.
curl -s https://balanced-wholeness-production-ca00.up.railway.app/api/debug/routes
echo.
echo.

echo ================================================================================
echo Test Complete
echo ================================================================================
echo.
echo If you see valid JSON responses above, your backend is working correctly.
echo.
echo Next Steps:
echo 1. Copy the test-railway-routes.js script
echo 2. Open your Railway frontend URL in browser
echo 3. Press F12 and go to Console
echo 4. Paste the script and press Enter
echo.
echo For local development issues, see: LOCAL_FIX_GUIDE.md
echo For Railway deployment issues, see: RAILWAY_STATUS.md
echo.
pause
