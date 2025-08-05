# 🧪 Monday.com App Testing Guide

This guide explains how to properly test your Monday.com app and understand how it integrates with Monday.com's interface.

## 🎯 **How Monday.com Apps Work**

### **Types of Monday.com Apps:**

1. **Board Views** - Appears as a custom view within a Monday.com board
2. **Widgets** - Appears as a widget on a board or dashboard
3. **Sidebar Apps** - Appears in the right sidebar of a board
4. **Modal Apps** - Opens in a popup/modal window

### **Your App Type: Board View**
Your storage billing app is designed as a **Board View** that appears directly within Monday.com boards.

## 🚀 **Step-by-Step Testing Process**

### **Step 1: Set Up Your Development Environment**

1. **Install Dependencies:**
   ```bash
   cd monday-app-v2
   npm install
   ```

2. **Create Environment File:**
   ```bash
   # Create .env file
   echo "REACT_APP_BACKEND_URL=http://localhost:3000" > .env
   ```

3. **Start Your Backend:**
   ```bash
   # In your main project directory
   npm start
   ```

4. **Start the Monday.com App:**
   ```bash
   # In monday-app-v2 directory
   npm run dev
   ```

### **Step 2: Deploy Your App for Testing**

For Monday.com to access your app, it needs to be publicly accessible. You have several options:

#### **Option A: Use ngrok (Recommended for testing)**
```bash
# Install ngrok
npm install -g ngrok

# Start your app on port 3001
npm run dev

# In another terminal, expose your app
ngrok http 3001
```

This will give you a public URL like: `https://abc123.ngrok.io`

#### **Option B: Deploy to Vercel (Production-ready)**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### **Step 3: Register Your App in Monday.com**

1. **Go to Monday.com Developer Portal:**
   - Visit: https://developer.monday.com/
   - Sign up for a developer account
   - Verify your email

2. **Create a New App:**
   - Click "Create New App"
   - Fill in the details:
     - **Name**: Storage Billing App
     - **Description**: Automated storage billing with dynamic monthly columns
     - **Category**: Business Tools

3. **Upload Your Manifest:**
   - Upload the `manifest.json` file from `monday-app-v2/`
   - Set the app URL to your deployed URL (e.g., `https://abc123.ngrok.io/board-view`)

4. **Configure App Settings:**
   - **App URL**: Your deployed frontend URL
   - **Board View URL**: `https://your-url.com/board-view`
   - **Widget URL**: `https://your-url.com/widget`

### **Step 4: Test in Monday.com**

1. **Create a Test Board:**
   - Go to your Monday.com workspace
   - Create a new board called "Storage Billing Test"

2. **Add the App View:**
   - Click the "Views" dropdown (top right of board)
   - Select "Storage Billing View" (your app)
   - The app should now appear as a custom view

3. **Test the Integration:**
   - Add some test items to the board
   - Fill in the required columns (Customer Name, Date Received, CBM, Rate)
   - Use the app's buttons to calculate billing

## 🔧 **How the App Integrates with Monday.com**

### **Board View Integration:**

```javascript
// The app listens for Monday.com context
monday.listen('context', (res) => {
  setBoardId(res.data.boardId); // Gets the current board ID
  loadBoardItems(res.data.boardId); // Loads items from that board
});
```

### **What Happens When You Use the App:**

1. **User opens your app view** in Monday.com
2. **App receives board context** (board ID, workspace ID)
3. **App loads board items** using Monday.com API
4. **User clicks "Calculate Billing"**
5. **App calls your backend** with the board ID
6. **Backend processes billing** and updates Monday.com
7. **App refreshes** to show updated data

### **Visual Integration:**

```
Monday.com Board
├── Standard Monday.com Views (Table, Kanban, etc.)
├── Your App View ← This is where your app appears
│   ├── Storage Billing Dashboard
│   ├── Action Buttons
│   ├── Item Cards
│   └── Statistics
└── Other Views
```

## 📱 **What Users See in Monday.com**

### **Before Adding Your App:**
- Standard Monday.com board with table/kanban views
- No storage billing functionality

### **After Adding Your App:**
- **New View Option**: "Storage Billing View" in the views dropdown
- **Custom Interface**: Your app's dashboard appears
- **Integrated Actions**: Billing calculations work directly on the board data
- **Real-time Updates**: Changes reflect immediately in Monday.com

## 🧪 **Testing Scenarios**

### **Test 1: Basic Integration**
1. Create a board in Monday.com
2. Add your app view
3. Verify the app loads and shows the board ID
4. Check that it can read board items

### **Test 2: Billing Calculations**
1. Add test items with:
   - Customer Name: "Test Customer"
   - Date Received: "2025-01-01"
   - CBM: "2.5"
   - Rate per CBM/Day: "1.00"
2. Click "Calculate Current Month Billing"
3. Verify billing amounts appear in the board

### **Test 3: Invoice Generation**
1. Set up test data
2. Click "Generate Invoices"
3. Check that PDF invoices are created
4. Verify invoice files appear in the board

### **Test 4: Bill Date Updates**
1. Add items with different dates and free days
2. Click "Update Bill Dates"
3. Verify bill dates are calculated correctly

## 🔍 **Debugging Tips**

### **Check Browser Console:**
- Open browser developer tools
- Look for errors in the console
- Check network requests to your backend

### **Check Monday.com API:**
```javascript
// Test Monday.com API directly
monday.api(`query {
  boards(ids: [${boardId}]) {
    items {
      id
      name
    }
  }
}`).then(res => console.log(res));
```

### **Check Backend Logs:**
- Monitor your backend server logs
- Check for API call errors
- Verify environment variables

### **Common Issues:**

1. **App not appearing in views:**
   - Check manifest.json configuration
   - Verify app URL is accessible
   - Ensure app is properly registered

2. **CORS errors:**
   - Add your Monday.com domain to CORS settings
   - Check backend CORS configuration

3. **API connection errors:**
   - Verify backend URL is correct
   - Check that backend is running
   - Test API endpoints directly

## 🚀 **Production Deployment**

### **1. Deploy Backend:**
```bash
# Deploy to Heroku, Vercel, or similar
git push heroku main
```

### **2. Deploy Frontend:**
```bash
# Build and deploy
npm run build
vercel --prod
```

### **3. Update App Configuration:**
- Update app URLs in Monday.com developer portal
- Test all functionality in production
- Submit app for review

## 📊 **Monitoring and Analytics**

### **Track App Usage:**
- Monitor Monday.com API usage
- Track user interactions
- Monitor backend performance

### **User Feedback:**
- Collect feedback through Monday.com app reviews
- Monitor error rates
- Track feature usage

## 🎉 **Success Indicators**

Your app is working correctly when:

✅ **App appears** in Monday.com views dropdown  
✅ **Board context** is received correctly  
✅ **Items load** from the board  
✅ **Billing calculations** work and update the board  
✅ **Invoices generate** successfully  
✅ **Real-time updates** reflect in Monday.com  

---

**Need Help?** Check the Monday.com developer documentation or reach out to the developer community! 