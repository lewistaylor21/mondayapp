const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing SDK initialization to prevent loading errors...');

// Fix BoardView.jsx
const boardViewPath = path.join(__dirname, 'src/BoardView.jsx');
let boardViewContent = fs.readFileSync(boardViewPath, 'utf8');

// Remove the module-level SDK initialization
boardViewContent = boardViewContent.replace(
  "// Monday.com SDK loaded via CDN\n\n// Initialize Monday.com SDK\nconst monday = window.mondaySdk();",
  "// Monday.com SDK loaded via CDN"
);

// Move SDK initialization inside the component
boardViewContent = boardViewContent.replace(
  "const BoardView = () => {",
  "const BoardView = () => {\n  // Initialize Monday.com SDK\n  const monday = window.mondaySdk();"
);

fs.writeFileSync(boardViewPath, boardViewContent);
console.log('✅ Fixed BoardView.jsx');

// Fix App.jsx
const appPath = path.join(__dirname, 'src/App.jsx');
let appContent = fs.readFileSync(appPath, 'utf8');

// Remove the module-level SDK initialization
appContent = appContent.replace(
  "// Monday.com SDK loaded via CDN\n\n// Initialize Monday SDK\nconst monday = mondaySdk();",
  "// Monday.com SDK loaded via CDN"
);

// Move SDK initialization inside the component
appContent = appContent.replace(
  "const App = () => {",
  "const App = () => {\n  // Initialize Monday SDK\n  const monday = window.mondaySdk();"
);

fs.writeFileSync(appPath, appContent);
console.log('✅ Fixed App.jsx');

console.log('\n🎉 SDK initialization fixed!');
console.log('📋 Next steps:');
console.log('1. Rebuild the app: npm run build');
console.log('2. Redeploy: npm run deploy');
console.log('3. Test in Monday.com - app should load properly now');
