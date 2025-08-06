# Monday.com App Deployment Instructions

## Files to Upload to Monday.com

Upload these files to your Monday.com app in the developer platform:

### Root Level Files:
- manifest.json

### App Directory Files:
- app/index.html (Dashboard Widget)
- app/index.bundle.js
- app/board_view.html (Board View)
- app/board_view.bundle.js
- app/monday.bundle.js
- app/vendors.bundle.js

## Upload Steps:

1. Go to [Monday.com Developers](https://developers.monday.com/)
2. Open your app or create a new one
3. Go to the "Files" section
4. Upload each file to the correct location:
   - Upload manifest.json to the root
   - Upload all app/* files to the app directory
5. Save and publish your app

## File Sizes:
- Main app bundles: ~19KB each (✅ Good for Monday.com)
- Shared libraries: ~559KB (Monday.com SDK + UI components)
- Total package: ~0.6MB (✅ Within Monday.com limits)

## Testing:
1. Install the app on your Monday.com board
2. Add the "Storage Billing" view to your board
3. Test the dashboard widget
4. Verify all functionality works correctly

## Troubleshooting:
- If upload fails, check file sizes (should be under 500KB per file)
- Ensure all bundle files are uploaded
- Verify manifest.json structure is correct
- Check Monday.com app permissions
