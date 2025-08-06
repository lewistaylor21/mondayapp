#!/bin/bash

# Monday Code Deployment Script for Storage Billing App
# This script deploys both backend and frontend to Monday Code

echo "🚀 Starting Monday Code deployment for Storage Billing App..."

# Check if Monday Code CLI is installed
if ! command -v monday-code &> /dev/null; then
    echo "❌ Monday Code CLI not found. Installing..."
    npm install -g @mondaydotcomorg/monday-code-cli
fi

# Check if user is logged in
if ! monday-code whoami &> /dev/null; then
    echo "🔐 Please log in to Monday Code..."
    monday-code login
fi

# Deploy Backend
echo "📦 Deploying backend to Monday Code..."
cd "$(dirname "$0")"

# Create backend deployment
monday-code deploy --name "storage-billing-backend" --runtime nodejs --entry-point app.js

if [ $? -eq 0 ]; then
    echo "✅ Backend deployed successfully!"
    BACKEND_URL=$(monday-code get-url --name "storage-billing-backend")
    echo "🔗 Backend URL: $BACKEND_URL"
else
    echo "❌ Backend deployment failed!"
    exit 1
fi

# Deploy Frontend
echo "📦 Deploying frontend to Monday Code..."
cd monday-app

# Build the React app
echo "🔨 Building React app..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ React app built successfully!"
    
    # Deploy to Monday Code
    monday-code deploy --name "storage-billing-frontend" --runtime static --entry-point dist/index.html
    
    if [ $? -eq 0 ]; then
        echo "✅ Frontend deployed successfully!"
        FRONTEND_URL=$(monday-code get-url --name "storage-billing-frontend")
        echo "🔗 Frontend URL: $FRONTEND_URL"
    else
        echo "❌ Frontend deployment failed!"
        exit 1
    fi
else
    echo "❌ React app build failed!"
    exit 1
fi

echo "🎉 Deployment completed successfully!"
echo "📊 Backend URL: $BACKEND_URL"
echo "🌐 Frontend URL: $FRONTEND_URL"
echo ""
echo "📝 Next steps:"
echo "1. Update your Monday.com app configuration with the frontend URL"
echo "2. Set environment variables in Monday Code dashboard"
echo "3. Test the integration in Monday.com"
