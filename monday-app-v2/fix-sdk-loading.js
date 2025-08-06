const fs = require('fs');
const path = require('path');

const deployDir = path.join(__dirname, 'deploy');
const CDN_URL = 'https://v6ed24208ea9ab1b3.cdn2.monday.app';

console.log('🔧 Fixing HTML files to include Monday.com SDK...');

// Monday.com SDK CDN script
const mondaySDKScript = '<script src="https://cdn.jsdelivr.net/npm/monday-sdk-js/dist/main.js"></script>';

// Fix board_view.html
const boardViewPath = path.join(deployDir, 'board_view.html');
let boardViewContent = fs.readFileSync(boardViewPath, 'utf8');

// Add SDK script before the bundle scripts
boardViewContent = boardViewContent.replace(
  '<script defer="defer" src="monday.bundle.js"></script>',
  `${mondaySDKScript}\n    <script defer="defer" src="${CDN_URL}/monday.bundle.js"></script>`
);

// Fix other bundle paths to use absolute CDN URLs
boardViewContent = boardViewContent.replace(
  'src="vendors.bundle.js"',
  `src="${CDN_URL}/vendors.bundle.js"`
);
boardViewContent = boardViewContent.replace(
  'src="board_view.bundle.js"',
  `src="${CDN_URL}/board_view.bundle.js"`
);

fs.writeFileSync(boardViewPath, boardViewContent);
console.log('✅ Fixed board_view.html');

// Fix index.html
const indexPath = path.join(deployDir, 'index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Add SDK script before the bundle scripts
indexContent = indexContent.replace(
  '<script defer="defer" src="monday.bundle.js"></script>',
  `${mondaySDKScript}\n    <script defer="defer" src="${CDN_URL}/monday.bundle.js"></script>`
);

// Fix other bundle paths to use absolute CDN URLs
indexContent = indexContent.replace(
  'src="vendors.bundle.js"',
  `src="${CDN_URL}/vendors.bundle.js"`
);
indexContent = indexContent.replace(
  'src="index.bundle.js"',
  `src="${CDN_URL}/index.bundle.js"`
);

fs.writeFileSync(indexPath, indexContent);
console.log('✅ Fixed index.html');

console.log('\n🎉 HTML files updated with Monday.com SDK!');
console.log('📋 Next steps:');
console.log('1. Deploy the updated files: mapps code:push --client-side -i 10992776');
console.log('2. Test in Monday.com - SDK should now initialize properly');
console.log('3. Real board data should load instead of demo data');
