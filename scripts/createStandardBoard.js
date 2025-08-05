#!/usr/bin/env node

/**
 * Script to create a standardized storage billing board
 * Usage: npm run create-board -- --name "My Storage Board" --workspace-id "12345"
 */

require('dotenv').config();
const mondayService = require('../services/mondayService');

async function createStandardBoard() {
    try {
        // Parse command line arguments
        const args = process.argv.slice(2);
        let boardName = 'Storage Billing Board';
        let workspaceId = null;
        
        for (let i = 0; i < args.length; i++) {
            if (args[i] === '--name' && args[i + 1]) {
                boardName = args[i + 1];
            } else if (args[i] === '--workspace-id' && args[i + 1]) {
                workspaceId = args[i + 1];
            }
        }
        
        console.log('🏗️ Creating standardized storage billing board...');
        console.log(`📋 Board Name: ${boardName}`);
        console.log(`🏢 Workspace ID: ${workspaceId || 'Default workspace'}`);
        console.log('');
        
        // Check if Monday.com API token is configured
        if (!process.env.MONDAY_API_TOKEN) {
            console.error('❌ Error: MONDAY_API_TOKEN environment variable is required');
            console.log('💡 Please set your Monday.com API token in the .env file');
            process.exit(1);
        }
        
        // Create the standardized board
        const board = await mondayService.createStandardizedBoard(boardName, workspaceId);
        
        console.log('');
        console.log('✅ Standardized storage billing board created successfully!');
        console.log('');
        console.log('📊 Board Details:');
        console.log(`   ID: ${board.id}`);
        console.log(`   Name: ${board.name}`);
        console.log(`   Workspace ID: ${board.workspace_id}`);
        console.log('');
        
        console.log('📋 Board Structure:');
        console.log('   ✅ Customer Name (name column)');
        console.log('   ✅ Date Received (date column)');
        console.log('   ✅ Free Days (numeric column)');
        console.log('   ✅ CBM (numbers column)');
        console.log('   ✅ Rate per CBM/Day (numeric column)');
        console.log('   ✅ Date Out (date column)');
        console.log('   ✅ Status (status column)');
        console.log('   ✅ Customer Email (email column)');
        console.log('   ✅ Billing Start Date (formula column)');
        console.log('   ✅ Total Billable Days (formula column)');
        console.log('   ✅ Current Month Billing (formula column)');
        console.log('   ✅ Monthly Billing Columns (12 months)');
        console.log('   ✅ Billing Action Buttons');
        console.log('');
        
        console.log('🔗 Next Steps:');
        console.log('   1. Add your storage items to the board');
        console.log('   2. Fill in the required data (Customer Name, Date Received, CBM, Rate)');
        console.log('   3. Use the billing action buttons to calculate billing');
        console.log('   4. Set up webhooks for automation (optional)');
        console.log('');
        
        console.log('📚 API Endpoints:');
        console.log(`   GET /api/boards/${board.id} - Get board information`);
        console.log(`   POST /api/billing/calculate-current-month - Calculate current month billing`);
        console.log(`   POST /api/invoices/generate-current-month - Generate current month invoices`);
        console.log('');
        
        console.log('🎉 Your storage billing board is ready to use!');
        
    } catch (error) {
        console.error('❌ Error creating standardized board:', error.message);
        
        if (error.message.includes('API')) {
            console.log('');
            console.log('💡 Troubleshooting:');
            console.log('   1. Check your Monday.com API token is correct');
            console.log('   2. Ensure you have permission to create boards');
            console.log('   3. Verify your Monday.com account is active');
        }
        
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    createStandardBoard();
}

module.exports = { createStandardBoard }; 