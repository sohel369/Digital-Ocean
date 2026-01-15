#!/bin/bash

# Railway Backend URL Detection Script
# This script helps you find and configure the correct backend URL for Railway

echo "🚂 Railway Backend URL Configuration Helper"
echo "============================================"
echo ""

# Check if we're in a Railway environment
if [ -n "$RAILWAY_ENVIRONMENT" ]; then
    echo "✅ Detected Railway environment: $RAILWAY_ENVIRONMENT"
    
    if [ -n "$RAILWAY_PUBLIC_DOMAIN" ]; then
        BACKEND_URL="https://$RAILWAY_PUBLIC_DOMAIN/api"
        echo "✅ Backend URL detected: $BACKEND_URL"
        echo ""
        echo "Add this to your FRONTEND Railway service variables:"
        echo "VITE_API_URL=$BACKEND_URL"
    else
        echo "⚠️  No public domain found. Make sure networking is enabled for this service."
    fi
else
    echo "ℹ️  Not running in Railway environment."
    echo ""
    echo "To configure Railway deployment:"
    echo "1. Find your backend Railway URL (e.g., your-app.up.railway.app)"
    echo "2. Add /api to the end"
    echo "3. Set as VITE_API_URL in frontend service"
    echo ""
    echo "Example:"
    echo "VITE_API_URL=https://balanced-wholeness-production-ca00.up.railway.app/api"
fi

echo ""
echo "📚 For detailed instructions, see RAILWAY_FIX_GUIDE.md"
