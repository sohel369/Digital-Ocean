@echo off
cd /d "%~dp0"
echo Setting up environment...
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat

echo Installing dependencies...
python -m pip install --upgrade pip
pip install pillow --only-binary :all:
pip install -r requirements.txt

echo Initializing database...
python scripts\init_db.py

echo Starting server...
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
