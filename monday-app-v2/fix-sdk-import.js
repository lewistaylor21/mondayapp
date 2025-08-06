const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing React components to use CDN-loaded Monday.com SDK...');

// Fix BoardView.jsx
const boardViewPath = path.join(__dirname, 'src/BoardView.jsx');
let boardViewContent = fs.readFileSync(boardViewPath, 'utf8');

// Replace the import with CDN access
boardViewContent = boardViewContent.replace(
  "import mondaySdk from 'monday-sdk-js';",
  "// Monday.com SDK loaded via CDN"
);

boardViewContent = boardViewContent.replace(
  "const monday = mondaySdk();",
  "const monday = window.mondaySdk();"
);

fs.writeFileSync(boardViewPath, boardViewContent);
console.log('✅ Fixed BoardView.jsx');

// Fix App.jsx
const appPath = path.join(__dirname, 'src/App.jsx');
let appContent = fs.readFileSync(appPath, 'utf8');

// Replace the import with CDN access
appContent = appContent.replace(
  "import mondaySdk from 'monday-sdk-js';",
  "// Monday.com SDK loaded via CDN"
);

appContent = appContent.replace(
  "const monday = mondaySdk();",
  "const monday = window.mondaySdk();"
);

fs.writeFileSync(appPath, appContent);
console.log('✅ Fixed App.jsx');

console.log('\n🎉 React components updated to use CDN SDK!');
console.log('📋 Next steps:');
console.log('1. Rebuild the app: npm run build');
console.log('2. Redeploy: npm run deploy');
console.log('3. Test in Monday.com - SDK should now work properly');
