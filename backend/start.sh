#!/bin/bash

# Quick Start Script for Advertiser Dashboard Backend
# This script sets up the development environment and runs the application

set -e  # Exit on error

echo "🚀 Advertiser Dashboard Backend - Quick Start"
echo "=============================================="

# Check Python version
echo ""
echo "📋 Checking Python version..."
python_version=$(python --version 2>&1 | awk '{print $2}')
echo "✅ Python $python_version installed"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo ""
    echo "📦 Creating virtual environment..."
    python -m venv venv
    echo "✅ Virtual environment created"
fi

# Activate virtual environment
echo ""
echo "🔄 Activating virtual environment..."
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi
echo "✅ Virtual environment activated"

# Install dependencies
echo ""
echo "📚 Installing dependencies..."
pip install --upgrade pip -q
pip install -r requirements.txt -q
echo "✅ Dependencies installed"

# Check if PostgreSQL is running
echo ""
echo "🗄️  Checking database connection..."
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL is installed"
    
    # Try to create database if it doesn't exist
    echo "Creating database if it doesn't exist..."
    createdb adplatform_db 2>/dev/null || echo "Database already exists or check permissions"
else
    echo "⚠️  PostgreSQL not found. Please install PostgreSQL or use Docker."
fi

# Initialize database
echo ""
echo "🏗️  Initializing database..."
python scripts/init_db.py
echo "✅ Database initialized"

# Show test credentials
echo ""
echo "=============================================="
echo "📝 Test Credentials:"
echo "=============================================="
echo ""
echo "🔑 Admin Account:"
echo "   Email: admin@adplatform.com"
echo "   Password: admin123"
echo ""
echo "👤 Advertiser Account:"
echo "   Email: advertiser@test.com"
echo "   Password: test123"
echo ""
echo "=============================================="

# Start server
echo ""
echo "🚀 Starting development server..."
echo "📍 API: http://localhost:8000"
echo "📚 Docs: http://localhost:8000/docs"
echo "📖 ReDoc: http://localhost:8000/redoc"
echo ""
echo "Press CTRL+C to stop the server"
echo ""

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
