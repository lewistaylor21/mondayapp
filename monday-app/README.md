# Storage Billing Monday.com App

A native Monday.com app for automated storage billing with dynamic monthly columns and invoice generation.

## 🚀 Features

- **Create Storage Billing Boards** - Automatically creates boards with specialized columns
- **Billing Calculations** - Calculate monthly billing for storage items
- **Invoice Generation** - Generate PDF invoices for customers
- **Bill Date Management** - Update billing start dates automatically
- **Real-time Integration** - Connects to your existing backend API

## 📋 Prerequisites

- Node.js 16.0.0 or higher
- Your backend server running (the existing Express app)
- Monday.com developer account

## 🛠️ Installation

### 1. Install Dependencies

```bash
cd monday-app
npm install
```

### 2. Configure Backend URL

Create a `.env` file in the `monday-app` directory:

```env
REACT_APP_BACKEND_URL=http://localhost:3000
```

**Note:** Update this URL to your deployed backend when ready for production.

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3001`

## 🏗️ Development

### Project Structure

```
monday-app/
├── public/
│   └── index.html          # HTML template
├── src/
│   ├── App.jsx            # Main React component
│   ├── App.css            # Styles
│   └── index.js           # Entry point
├── manifest.json          # Monday.com app configuration
├── package.json           # Dependencies
└── webpack.config.js      # Build configuration
```

### Key Components

#### App.jsx
- **Monday.com SDK Integration** - Connects to Monday.com workspace
- **Board Management** - Create and select boards
- **API Integration** - Calls your existing backend endpoints
- **User Interface** - Modern, responsive design

#### manifest.json
- **App Configuration** - Name, version, description
- **Permissions** - Required Monday.com permissions
- **Capabilities** - What the app can do
- **Triggers** - Webhook endpoints

## 🔧 Configuration

### Backend Integration

The app connects to your existing backend API. Make sure your backend is running and accessible.

**Required Backend Endpoints:**
- `POST /api/boards/create` - Create new boards
- `POST /api/billing/calculate-current-month` - Calculate billing
- `POST /api/invoices/generate-current-month` - Generate invoices
- `POST /api/billing/update-bill-dates` - Update bill dates

### Environment Variables

```env
REACT_APP_BACKEND_URL=http://localhost:3000
```

## 🚀 Deployment

### 1. Build for Production

```bash
npm run build
```

### 2. Deploy Frontend

Deploy the `dist` folder to a static hosting service:
- **Vercel**: `vercel --prod`
- **Netlify**: `netlify deploy --prod`
- **GitHub Pages**: Configure in repository settings

### 3. Deploy Backend

Deploy your existing Express backend to:
- **Heroku**: `git push heroku main`
- **Vercel**: `vercel --prod`
- **Railway**: Connect GitHub repository

### 4. Update Configuration

Update the `REACT_APP_BACKEND_URL` to point to your deployed backend.

### 5. Register Monday.com App

1. Go to [Monday.com Developer Portal](https://developer.monday.com/)
2. Create a new app
3. Upload your `manifest.json`
4. Configure OAuth settings
5. Submit for review

## 📱 Usage

### 1. Install the App

Users can install your app from the Monday.com marketplace.

### 2. Create Storage Billing Board

Click "Create Storage Billing Board" to create a new board with:
- Customer information columns
- Billing calculation columns
- Monthly billing columns (12 months)
- Action buttons for operations

### 3. Manage Billing

- **Select a board** from the dropdown
- **Calculate billing** for current month
- **Generate invoices** for customers
- **Update bill dates** for all items

### 4. View Results

All operations update the Monday.com board directly, so users can see:
- Calculated billing amounts
- Generated invoices
- Updated bill dates
- Monthly billing breakdown

## 🔗 API Integration

The app calls your existing backend API endpoints:

```javascript
// Example API call
const response = await fetch(`${BACKEND_URL}/api/boards/create`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Storage Billing Board' })
});
```

## 🎯 Benefits

✅ **Native Monday.com Integration** - Users can install from marketplace  
✅ **Keep Existing Backend** - No need to rewrite your logic  
✅ **Modern UI** - Professional, responsive interface  
✅ **Real-time Updates** - Changes reflect immediately in Monday.com  
✅ **Scalable** - Can handle multiple workspaces and boards  

## 🐛 Troubleshooting

### Common Issues

1. **Backend Connection Error**
   - Check if your backend is running
   - Verify `REACT_APP_BACKEND_URL` is correct
   - Check CORS configuration on backend

2. **Monday.com API Errors**
   - Verify app permissions in manifest.json
   - Check Monday.com API token
   - Ensure workspace access

3. **Build Errors**
   - Run `npm install` to ensure dependencies
   - Check Node.js version (16+ required)
   - Clear node_modules and reinstall

### Debug Mode

Enable debug logging:

```bash
DEBUG=monday-app:* npm run dev
```

## 📚 Resources

- [Monday.com Developer Documentation](https://developer.monday.com/)
- [Monday.com SDK Documentation](https://monday.com/developers/v2)
- [React Documentation](https://reactjs.org/docs/)
- [Webpack Documentation](https://webpack.js.org/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Built with ❤️ for Monday.com users** 