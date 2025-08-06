const fs = require('fs');
const path = require('path');

// Create deployment directory
const deployDir = path.join(__dirname, 'deploy');
if (!fs.existsSync(deployDir)) {
  fs.mkdirSync(deployDir);
}

// Create the proper Monday.com app structure
const appDir = path.join(deployDir, 'app');
if (!fs.existsSync(appDir)) {
  fs.mkdirSync(appDir);
}

// Copy built files to app directory
const distDir = path.join(__dirname, 'dist');
const files = [
  'index.bundle.js', 
  'index.bundle.js.LICENSE.txt', 
  'index.html',
  'board_view.bundle.js',
  'board_view.bundle.js.LICENSE.txt',
  'board_view.html',
  'monday.bundle.js',
  'monday.bundle.js.LICENSE.txt',
  'vendors.bundle.js',
  'vendors.bundle.js.LICENSE.txt'
];

console.log('📁 Copying files to deploy directory...');

files.forEach(file => {
  const source = path.join(distDir, file);
  const dest = path.join(appDir, file);
  if (fs.existsSync(source)) {
    fs.copyFileSync(source, dest);
    console.log(`✅ Copied ${file} to app directory`);
  } else {
    console.log(`⚠️  File not found: ${file}`);
  }
});

// Copy manifest.json to root of deploy directory
const manifestSource = path.join(__dirname, 'manifest.json');
const manifestDest = path.join(deployDir, 'manifest.json');
if (fs.existsSync(manifestSource)) {
  fs.copyFileSync(manifestSource, manifestDest);
  console.log('✅ Copied manifest.json to deploy directory');
}

// Create deployment instructions
const instructions = `# Monday.com App Deployment Instructions

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
`;

fs.writeFileSync(path.join(deployDir, 'DEPLOYMENT_INSTRUCTIONS.md'), instructions);

console.log('\n🎉 Deployment files ready!');
console.log('📁 App structure:');
console.log('   ├── manifest.json');
console.log('   └── app/');
console.log('       ├── index.html (Dashboard Widget)');
console.log('       ├── index.bundle.js');
console.log('       ├── board_view.html (Board View)');
console.log('       ├── board_view.bundle.js');
console.log('       ├── monday.bundle.js');
console.log('       └── vendors.bundle.js');
console.log('\n📋 Next steps:');
console.log('1. Go to Monday.com Developers platform');
console.log('2. Upload manifest.json to root');
console.log('3. Upload all app/* files to app directory');
console.log('4. Save and publish your app');
console.log('\n📖 See DEPLOYMENT_INSTRUCTIONS.md for detailed steps');
