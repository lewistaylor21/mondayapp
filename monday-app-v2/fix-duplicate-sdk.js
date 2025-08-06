const fs = require('fs');
const path = require('path');

console.log('🔧 Removing duplicate SDK initialization...');

// Fix BoardView.jsx
const boardViewPath = path.join(__dirname, 'src/BoardView.jsx');
let boardViewContent = fs.readFileSync(boardViewPath, 'utf8');

// Remove the module-level SDK initialization completely
boardViewContent = boardViewContent.replace(
  "// Monday.com SDK loaded via CDN\n\n// Initialize Monday.com SDK\nconst monday = window.mondaySdk();\n",
  "// Monday.com SDK loaded via CDN\n"
);

fs.writeFileSync(boardViewPath, boardViewContent);
console.log('✅ Fixed BoardView.jsx');

// Fix App.jsx
const appPath = path.join(__dirname, 'src/App.jsx');
let appContent = fs.readFileSync(appPath, 'utf8');

// Remove the module-level SDK initialization completely
appContent = appContent.replace(
  "// Monday.com SDK loaded via CDN\n\n// Initialize Monday SDK\nconst monday = mondaySdk();\n",
  "// Monday.com SDK loaded via CDN\n"
);

fs.writeFileSync(appPath, appContent);
console.log('✅ Fixed App.jsx');

console.log('\n🎉 Duplicate SDK initialization removed!');
console.log('📋 Next steps:');
console.log('1. Rebuild the app: npm run build');
console.log('2. Redeploy: npm run deploy');
console.log('3. Test in Monday.com - app should load properly now');
