# 🚀 Deployment Guide - Hybrid Monday.com App

This guide will help you deploy both your backend and Monday.com app frontend for a complete hybrid solution.

## 📋 Overview

You now have:
- **Backend**: Your existing Express.js server (port 3000)
- **Frontend**: New Monday.com app (port 3001)
- **Integration**: Frontend calls backend API

## 🎯 Deployment Strategy

### Option 1: Local Development (Recommended for testing)

Keep both running locally for development and testing.

### Option 2: Production Deployment

Deploy backend to cloud service and frontend to static hosting.

## 🛠️ Step 1: Local Development Setup

### 1.1 Start Your Backend

```bash
# In your main project directory
npm start
```

Your backend will run on `http://localhost:3000`

### 1.2 Start Monday.com App Frontend

```bash
# In a new terminal, navigate to monday-app directory
cd monday-app
npm install
npm run dev
```

Your frontend will run on `http://localhost:3001`

### 1.3 Test the Integration

1. Open `http://localhost:3001` in your browser
2. Click "Create Storage Billing Board"
3. Check that it creates a board in your Monday.com workspace
4. Test other features (billing calculations, invoice generation)

## ☁️ Step 2: Production Deployment

### 2.1 Deploy Backend

Choose one of these options:

#### Option A: Deploy to Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create Heroku app
heroku create your-storage-billing-app

# Add environment variables
heroku config:set MONDAY_API_TOKEN=your_monday_token
heroku config:set NODE_ENV=production
heroku config:set WEBHOOK_SECRET=your_webhook_secret

# Deploy
git add .
git commit -m "Deploy backend"
git push heroku main
```

#### Option B: Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

#### Option C: Deploy to Railway

1. Connect your GitHub repository to Railway
2. Railway will automatically detect your Node.js app
3. Add environment variables in Railway dashboard
4. Deploy automatically on git push

### 2.2 Deploy Frontend

#### Option A: Deploy to Vercel

```bash
cd monday-app

# Install Vercel CLI if not already installed
npm install -g vercel

# Deploy
vercel --prod
```

#### Option B: Deploy to Netlify

```bash
cd monday-app

# Build the app
npm run build

# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

#### Option C: Deploy to GitHub Pages

1. Push your code to GitHub
2. Go to repository settings
3. Enable GitHub Pages
4. Set source to `monday-app/dist` branch

### 2.3 Update Configuration

After deploying both parts, update the frontend configuration:

1. **Get your backend URL** (e.g., `https://your-app.herokuapp.com`)
2. **Update frontend environment**:

```bash
# In monday-app directory, create .env file
echo "REACT_APP_BACKEND_URL=https://your-backend-url.com" > .env
```

3. **Rebuild and redeploy frontend**:

```bash
npm run build
# Redeploy to your hosting service
```

## 🔧 Step 3: Monday.com App Registration

### 3.1 Create Developer Account

1. Go to [Monday.com Developer Portal](https://developer.monday.com/)
2. Sign up for a developer account
3. Verify your email

### 3.2 Create New App

1. Click "Create New App"
2. Fill in app details:
   - **Name**: Storage Billing App
   - **Description**: Automated storage billing with dynamic monthly columns
   - **Category**: Business Tools

### 3.3 Upload App Files

1. **Upload manifest.json** from your `monday-app` directory
2. **Set app URL** to your deployed frontend URL
3. **Configure OAuth settings**:
   - Redirect URL: `https://your-frontend-url.com/auth/callback`
   - Scopes: Select all required permissions

### 3.4 Configure Webhooks

Update your `manifest.json` with your backend webhook URLs:

```json
{
  "triggers": [
    {
      "name": "item_created",
      "url": "https://your-backend-url.com/webhooks/item-created"
    },
    {
      "name": "item_updated", 
      "url": "https://your-backend-url.com/webhooks/item-updated"
    }
  ]
}
```

### 3.5 Submit for Review

1. **Test your app** thoroughly
2. **Fill out submission form**:
   - App description
   - Screenshots
   - Use cases
   - Privacy policy
3. **Submit for review**

## 🔐 Step 4: Environment Variables

### Backend Environment Variables

Set these in your cloud hosting platform:

```env
MONDAY_API_TOKEN=your_monday_api_token
MONDAY_API_URL=https://api.monday.com/v2
NODE_ENV=production
WEBHOOK_SECRET=your_webhook_secret
STORAGE_PATH=./invoices
PORT=3000
```

### Frontend Environment Variables

Create `.env` file in `monday-app` directory:

```env
REACT_APP_BACKEND_URL=https://your-backend-url.com
```

## 🧪 Step 5: Testing

### 5.1 Test Backend

```bash
# Test health endpoint
curl https://your-backend-url.com/health

# Test API endpoints
curl -X POST https://your-backend-url.com/api/boards/create \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Board"}'
```

### 5.2 Test Frontend

1. Open your deployed frontend URL
2. Test all features:
   - Board creation
   - Billing calculations
   - Invoice generation
   - Bill date updates

### 5.3 Test Monday.com Integration

1. Install your app in Monday.com
2. Create a test board
3. Add test items
4. Run billing calculations
5. Generate test invoices

## 📊 Step 6: Monitoring

### 6.1 Backend Monitoring

- **Health checks**: Monitor `/health` endpoint
- **Error logging**: Check cloud platform logs
- **Performance**: Monitor response times
- **Uptime**: Set up uptime monitoring

### 6.2 Frontend Monitoring

- **Error tracking**: Add error tracking service
- **Performance**: Monitor page load times
- **User analytics**: Track app usage

### 6.3 Monday.com Integration

- **Webhook delivery**: Monitor webhook success rates
- **API usage**: Track API call limits
- **User feedback**: Monitor app reviews

## 🔄 Step 7: Updates and Maintenance

### 7.1 Backend Updates

```bash
# Make changes to your backend code
git add .
git commit -m "Update backend"
git push heroku main  # or your deployment platform
```

### 7.2 Frontend Updates

```bash
cd monday-app
# Make changes to frontend code
npm run build
# Redeploy to your hosting platform
```

### 7.3 Monday.com App Updates

1. **Update manifest.json** if needed
2. **Redeploy frontend** with new version
3. **Submit update** to Monday.com for review

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Add your frontend URL to backend CORS configuration
   - Check that backend allows requests from frontend domain

2. **API Connection Errors**
   - Verify backend URL is correct
   - Check that backend is running and accessible
   - Test API endpoints directly

3. **Monday.com API Errors**
   - Verify API token is valid
   - Check app permissions in Monday.com
   - Ensure workspace access

4. **Build Errors**
   - Check Node.js version compatibility
   - Clear node_modules and reinstall
   - Verify all dependencies are installed

### Debug Commands

```bash
# Check backend logs
heroku logs --tail  # for Heroku
vercel logs         # for Vercel

# Check frontend build
cd monday-app
npm run build

# Test API locally
curl http://localhost:3000/health
```

## 🎉 Success!

Once deployed, you'll have:

✅ **Backend API** running in the cloud  
✅ **Monday.com app** available in the marketplace  
✅ **Full integration** between frontend and backend  
✅ **Professional storage billing solution** for Monday.com users  

## 📚 Next Steps

1. **Market your app** to storage companies
2. **Gather user feedback** and iterate
3. **Add more features** based on user needs
4. **Scale up** as your user base grows

---

**Need help?** Check the troubleshooting section or reach out to the Monday.com developer community! 