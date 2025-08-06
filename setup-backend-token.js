const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up Backend API Token...');
console.log('=' .repeat(50));

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env.example');

if (!fs.existsSync(envPath)) {
    console.log('📝 Creating .env file from env.example...');
    
    if (fs.existsSync(envExamplePath)) {
        const envExample = fs.readFileSync(envExamplePath, 'utf8');
        fs.writeFileSync(envPath, envExample);
        console.log('✅ Created .env file');
    } else {
        console.log('⚠️  env.example not found, creating basic .env file...');
        const basicEnv = `# Monday.com API Configuration
MONDAY_API_TOKEN=your_monday_api_token_here

# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration (if needed)
# DATABASE_URL=your_database_url_here
`;
        fs.writeFileSync(envPath, basicEnv);
        console.log('✅ Created basic .env file');
    }
} else {
    console.log('✅ .env file already exists');
}

console.log('');
console.log('📋 Next Steps:');
console.log('1. Edit the .env file and add your Monday.com API token');
console.log('2. Restart the backend server: npm start');
console.log('3. Test the billing calculation API');
console.log('');
console.log('🔑 To get your Monday.com API token:');
console.log('   - Go to Monday.com');
console.log('   - Click your profile picture → Admin → API');
console.log('   - Generate a new token with read/write permissions');
console.log('');
console.log('💡 For testing, you can also use the MCP API directly');
console.log('   which doesn\'t require setting up the backend token.');
