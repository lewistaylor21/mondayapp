const fs = require('fs');
const path = require('path');

// Paths
const deployDir = path.join(__dirname, 'deploy');
const appDir = path.join(deployDir, 'app');

console.log('🔧 Fixing deploy structure for Monday.com CLI...');

// Files to move from app/ to root of deploy/
const filesToMove = [
  'index.html',
  'index.bundle.js',
  'board_view.html',
  'board_view.bundle.js',
  'monday.bundle.js',
  'vendors.bundle.js'
];

// Move each file
filesToMove.forEach(file => {
  const source = path.join(appDir, file);
  const dest = path.join(deployDir, file);
  
  if (fs.existsSync(source)) {
    fs.copyFileSync(source, dest);
    console.log(`✅ Moved ${file} to deploy root`);
  } else {
    console.log(`⚠️  File not found: ${file}`);
  }
});

// Keep the app directory for reference but rename it
const appBackupDir = path.join(deployDir, 'app_backup');
if (fs.existsSync(appDir)) {
  fs.renameSync(appDir, appBackupDir);
  console.log('📁 Renamed app/ to app_backup/ for reference');
}

console.log('\n🎉 Deploy structure fixed!');
console.log('📁 New structure:');
console.log('   ├── manifest.json');
console.log('   ├── index.html');
console.log('   ├── index.bundle.js');
console.log('   ├── board_view.html');
console.log('   ├── board_view.bundle.js');
console.log('   ├── monday.bundle.js');
console.log('   ├── vendors.bundle.js');
console.log('   └── app_backup/ (original structure)');
console.log('\n🚀 Ready for: mapps code:push --client-side -i 10992776');
