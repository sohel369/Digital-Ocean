@echo off
cd /d "%~dp0"
REM Quick Start Script for Advertiser Dashboard Backend (Windows)
REM This script sets up the development environment and runs the application

echo.
echo ========================================
echo Advertiser Dashboard Backend - Quick Start
echo ========================================

REM Check Python version
echo.
echo Checking Python version...
python --version
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Python is not installed or not in PATH
    exit /b 1
)

REM Create virtual environment if it doesn't exist
if not exist "venv\" (
    echo.
    echo Creating virtual environment...
    python -m venv venv
    echo Virtual environment created
)

REM Activate virtual environment
echo.
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo.
echo Installing dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt

REM Initialize database
echo.
echo Initializing database...
python scripts\init_db.py

REM Show test credentials
echo.
echo ========================================
echo Test Credentials:
echo ========================================
echo.
echo Admin Account:
echo    Email: admin@adplatform.com
echo    Password: admin123
echo.
echo Advertiser Account:
echo    Email: advertiser@test.com
echo    Password: test123
echo.
echo ========================================

REM Start server
echo.
echo Starting development server...
echo API: http://localhost:8000
echo Docs: http://localhost:8000/docs
echo ReDoc: http://localhost:8000/redoc
echo.
echo Press CTRL+C to stop the server
echo.

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
