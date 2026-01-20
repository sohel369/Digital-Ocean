@echo off
echo.
echo ================================================================================
echo Railway Authentication Diagnostic Tool
echo ================================================================================
echo.
echo This script will diagnose and fix authentication issues on your backend
echo.

cd backend

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo Running diagnostic script...
python scripts\railway_auth_diagnostic.py

echo.
echo ================================================================================
echo Diagnostic Complete!
echo ================================================================================
echo.
echo Next Steps:
echo 1. If errors were found, the script attempted to fix them
echo 2. Verify JWT_SECRET is set in Railway (see output above)
echo 3. Deploy this fix to Railway: git push
echo 4. Check Railway backend logs after deployment
echo.
pause
