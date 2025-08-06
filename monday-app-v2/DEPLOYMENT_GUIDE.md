# Monday.com App Deployment Guide

This guide explains how to deploy your Storage Billing Manager app to Monday.com with both Dashboard Widget and Board View features.

## Project Structure

```
monday-app-v2/
├── src/
│   ├── index.js          # Dashboard Widget entry point
│   ├── board_view.js     # Board View entry point
│   ├── App.jsx           # Dashboard Widget component
│   └── BoardView.jsx     # Board View component
├── public/
│   ├── index.html        # Dashboard Widget HTML
│   └── board_view.html   # Board View HTML
├── manifest.json         # Monday.com app configuration
└── webpack.config.js     # Build configuration
```

## Features

### 1. Dashboard Widget (`App.jsx`)
- **Entry Point**: `src/index.js` → `public/index.html`
- **Purpose**: Shows billing summary and statistics
- **Location**: Monday.com dashboard
- **Size**: 400x400 pixels (auto-adjusting height)

### 2. Board View (`BoardView.jsx`)
- **Entry Point**: `src/board_view.js` → `public/board_view.html`
- **Purpose**: Full board management interface
- **Location**: Monday.com board view
- **Size**: Full width, 800px height (auto-adjusting)

## Build Commands

```bash
# Build both features
npm run build

# Build individual features
npm run build:dashboard
npm run build:boardview

# Development server
npm run dev

# Deploy to Monday.com
npm run deploy
```

## Deployment Steps

### 1. Build the App
```bash
cd monday-app-v2
npm install
npm run build
```

### 2. Deploy Package
```bash
npm run deploy
```

This creates `deploy.zip` with the following structure:
```
deploy.zip
├── manifest.json
└── app/
    ├── index.html          # Dashboard Widget
    ├── index.bundle.js
    ├── board_view.html     # Board View
    └── board_view.bundle.js
```

### 3. Upload to Monday.com Developer Console

1. Go to [Monday.com Developer Console](https://monday.com/developers/apps)
2. Create a new app or update existing app
3. Upload the `deploy.zip` file
4. Configure the app settings:
   - **Dashboard Widget**: Point to `app/index.html`
   - **Board View**: Point to `app/board_view.html`

## Manifest Configuration

The `manifest.json` file configures both features:

```json
{
  "features": [
    {
      "type": "board-view",
      "name": "Storage Billing",
      "url": "https://your-domain.com/board_view.html"
    },
    {
      "type": "dashboard-widget",
      "name": "Billing Summary",
      "url": "https://your-domain.com/index.html"
    }
  ]
}
```

## Development

### Local Development
```bash
npm run dev
```

The development server runs on `https://localhost:8301` with:
- Dashboard Widget: `https://localhost:8301/index.html`
- Board View: `https://localhost:8301/board_view.html`

### Testing with ngrok
```bash
npm run tunnel
```

Use the ngrok URL in your Monday.com app configuration for testing.

## Key Features Implemented

✅ **SDK Import Fix**: Fixed `mondaySdk` import in BoardView.jsx
✅ **SDK Initialization**: Added `monday.init()` to both components
✅ **Multiple Entry Points**: Separate entry points for each feature
✅ **HTML Files**: Dedicated HTML files for each feature
✅ **HTTPS Support**: Development server uses HTTPS
✅ **Auto-height Adjustment**: Both components auto-adjust height
✅ **Webpack Configuration**: Multi-entry point build setup
✅ **Deployment Ready**: Proper file structure for Monday.com

## Troubleshooting

### Common Issues

1. **SDK Not Initialized**: Ensure `monday.init()` is called before any `monday.listen()` calls
2. **Height Issues**: Both components include auto-height adjustment
3. **Build Errors**: Check that all entry points are properly configured in webpack
4. **Deployment Issues**: Verify the zip file structure matches Monday.com requirements

### Debug Mode

Enable debug logging by adding to your components:
```javascript
monday.setApiVersion('2024-01');
monday.execute('debug', { enabled: true });
```

## Support

For issues with Monday.com integration, refer to:
- [Monday.com App Development Documentation](https://monday.com/developers/apps)
- [Monday.com SDK Documentation](https://monday.com/developers/v2/tools/sdk-js)
