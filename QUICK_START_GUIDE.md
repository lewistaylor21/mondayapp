# 🚀 Quick Start Guide - Monday.com App

## 🎯 **What You Have Now**

✅ **Backend**: Your Express server (running on port 3000)  
✅ **Monday.com App**: React app that integrates with Monday.com  
✅ **Complete Integration**: App connects to your backend and Monday.com  

## 🛠️ **Step 1: Fix the Current Issues**

### **Fix the monday-app package.json:**
The error you saw was because `@monday/monday-apps-sdk` doesn't exist. I've already fixed this.

### **Install Dependencies:**
```bash
# In the monday-app directory
cd monday-app
npm install
```

## 🚀 **Step 2: Start Both Services**

### **Terminal 1 - Start Your Backend:**
```bash
# In your main project directory
npm start
```
Your backend will run on `http://localhost:3000`

### **Terminal 2 - Start Monday.com App:**
```bash
# In monday-app directory
cd monday-app
npm run dev
```
Your app will run on `http://localhost:3001`

## 🧪 **Step 3: Test Locally First**

1. **Open your browser** to `http://localhost:3001`
2. **You should see** the Storage Billing App interface
3. **Test the connection** by clicking buttons (they'll show errors until you set up Monday.com integration)

## 🌐 **Step 4: Make It Public for Monday.com**

Monday.com needs to access your app from the internet. Use ngrok:

```bash
# Install ngrok
npm install -g ngrok

# Expose your app (in a new terminal)
ngrok http 3001
```

This gives you a public URL like `https://abc123.ngrok.io`

## 🔧 **Step 5: Register in Monday.com**

1. **Go to** https://developer.monday.com/
2. **Create account** and verify email
3. **Create new app**:
   - Name: "Storage Billing App"
   - Description: "Automated storage billing"
   - Category: "Business Tools"
4. **Upload manifest.json** from `monday-app/` directory
5. **Set app URL** to your ngrok URL

## 📱 **Step 6: Test in Monday.com**

1. **Create a board** in Monday.com
2. **Click "Views"** dropdown (top right)
3. **Select "Storage Billing View"**
4. **Your app appears** inside Monday.com!

## 🎯 **What You'll See**

### **In Monday.com:**
- Your app appears as a view option
- Clicking it shows your billing dashboard
- All data comes from the current board
- Actions update the board in real-time

### **In Your App:**
- Board ID is automatically detected
- Items load from the current board
- Billing calculations update the board
- Invoices are generated and attached to items

## 🔍 **Troubleshooting**

### **If npm install fails:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### **If app doesn't load:**
- Check browser console for errors
- Verify both servers are running
- Check that ports 3000 and 3001 are available

### **If Monday.com integration fails:**
- Verify ngrok URL is accessible
- Check app registration in Monday.com developer portal
- Ensure manifest.json is uploaded correctly

## 🎉 **Success Indicators**

Your setup is working when:

✅ **Backend runs** on localhost:3000  
✅ **App runs** on localhost:3001  
✅ **ngrok provides** public URL  
✅ **App appears** in Monday.com views  
✅ **Board context** is received  
✅ **Items load** from board  
✅ **Billing calculations** work  

## 📚 **Next Steps**

1. **Test all features** in Monday.com
2. **Deploy to production** (Vercel, Heroku, etc.)
3. **Submit app** for Monday.com review
4. **Market your app** to storage companies

---

**Need Help?** Check the detailed guides in `MONDAY_APP_TESTING_GUIDE.md` and `DEPLOYMENT_GUIDE.md` 