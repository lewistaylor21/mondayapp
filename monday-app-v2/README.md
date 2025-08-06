# Storage Billing Monday.com App

A native Monday.com app for automated storage billing with dynamic monthly columns and invoice generation.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn
- ngrok (for tunneling)

### Installation
```bash
npm install
```

### Development
```bash
# Start development server with HTTPS
npm run dev

# In another terminal, create ngrok tunnel
npm run tunnel
```

### Build & Deploy
```bash
# Build for production
npm run build

# Create deployment package
npm run deploy
```

## 📦 Deployment Package

The deployment creates a `deploy.zip` file with the following structure:
```
deploy.zip
├── manifest.json
└── app/
    ├── index.html (Dashboard Widget)
    ├── index.bundle.js
    ├── board_view.html (Board View)
    └── board_view.bundle.js
```

## 🔧 Recent Bug Fixes

### 1. Bundle Size Optimization
- **Issue**: Bundles were too large (775KB, 515KB) causing upload failures
- **Fix**: Implemented code splitting with webpack optimization
- **Result**: Main bundles now only 19.2KB and 17.5KB

### 2. Monday.com SDK Integration
- **Issue**: SDK initialization errors and poor error handling
- **Fix**: Added proper error handling and authentication checks
- **Result**: Better error messages and fallback to demo data

### 3. Backend URL Configuration
- **Issue**: Hardcoded backend URLs causing connection issues
- **Fix**: Removed hardcoded URLs, using relative paths
- **Result**: More flexible deployment across environments

### 4. HTML Structure
- **Issue**: Missing bundle references in HTML files
- **Fix**: Updated webpack to properly inject all bundle files
- **Result**: All JavaScript bundles now properly loaded

## 🏗️ App Structure

### Features
- **Dashboard Widget**: Overview of storage billing statistics
- **Board View**: Detailed view of storage items with billing calculations
- **Real-time Updates**: Automatic refresh when board data changes
- **Error Handling**: Graceful fallbacks and user-friendly error messages

### Components
- `App.jsx`: Main dashboard widget component
- `BoardView.jsx`: Board view component for detailed item management
- `App.css`: Styling with Monday.com design system
- `BoardView.css`: Board-specific styling

## 🔌 API Integration

The app integrates with your backend API endpoints:
- `/api/billing/calculate-current-month`
- `/api/invoices/generate-current-month`
- `/api/billing/update-bill-dates`

## 📋 Monday.com Configuration

### Manifest Settings
- **Integration Types**: `board_view`, `dashboard_widget`
- **Permissions**: Read/write access to boards, items, and columns
- **Features**: Board view and dashboard widget with configurable dimensions

### Required Board Columns
- Status (dropdown)
- CBM (numbers)
- Rate per CBM/Day (numbers)
- Date Received (date)
- Bill Date (date)
- Current Month Billing (numbers)

## 🧪 Testing

### Local Testing
```bash
# Start development server
npm run dev

# Open test page
open https://localhost:8301/test.html
```

### Monday.com Testing
1. Create ngrok tunnel: `npm run tunnel`
2. Update manifest.json with ngrok URL
3. Upload deploy.zip to Monday.com
4. Test in Monday.com board

## 🐛 Troubleshooting

### Common Issues

1. **Bundle Upload Fails**
   - Ensure bundle size is under 500KB
   - Check webpack optimization settings
   - Verify all dependencies are properly externalized

2. **SDK Initialization Errors**
   - Check Monday.com app permissions
   - Verify manifest.json structure
   - Ensure HTTPS is enabled

3. **API Connection Issues**
   - Verify backend server is running
   - Check CORS settings
   - Ensure API endpoints are accessible

4. **Authentication Problems**
   - Verify Monday.com app is properly installed
   - Check user permissions on the board
   - Ensure app is running in Monday.com context

### Debug Mode
Enable debug logging by opening browser console and checking for:
- Monday.com SDK initialization messages
- API request/response logs
- Error stack traces

## 📈 Performance

### Bundle Analysis
- **Main App**: 19.2KB (down from 775KB)
- **Board View**: 17.5KB (down from 515KB)
- **Shared Libraries**: 559KB (Monday.com SDK + UI components)
- **Total Package**: 0.01MB (down from 0.25MB)

### Optimization Features
- Code splitting for better caching
- Tree shaking to remove unused code
- Minification and compression
- Lazy loading of non-critical components

## 🔄 Updates

### Version History
- **v1.0.0**: Initial release with basic billing functionality
- **v1.0.1**: Bundle size optimization and bug fixes
- **v1.0.2**: Improved error handling and SDK integration

### Future Enhancements
- Real-time billing calculations
- Advanced filtering and sorting
- Export functionality
- Multi-board support
- Custom billing rules

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review console logs for error messages
3. Test with the provided test page
4. Verify Monday.com app configuration

## 📄 License

This project is licensed under the MIT License.
