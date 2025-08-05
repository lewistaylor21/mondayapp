#!/usr/bin/env node

/**
 * Script to update bill dates for all items on a board
 * Usage: npm run update-bill-dates -- --board-id "12345"
 */

require('dotenv').config();
const mondayService = require('../services/mondayService');

async function updateBillDates() {
    try {
        // Parse command line arguments
        const args = process.argv.slice(2);
        let boardId = null;
        
        for (let i = 0; i < args.length; i++) {
            if (args[i] === '--board-id' && args[i + 1]) {
                boardId = args[i + 1];
            }
        }
        
        if (!boardId) {
            console.error('❌ Error: --board-id is required');
            console.log('💡 Usage: npm run update-bill-dates -- --board-id "12345"');
            process.exit(1);
        }
        
        console.log('📅 Updating bill dates for all items...');
        console.log(`📋 Board ID: ${boardId}`);
        console.log('');
        
        // Check if Monday.com API token is configured
        if (!process.env.MONDAY_API_TOKEN) {
            console.error('❌ Error: MONDAY_API_TOKEN environment variable is required');
            console.log('💡 Please set your Monday.com API token in the .env file');
            process.exit(1);
        }
        
        // Update bill dates
        const updatedCount = await mondayService.updateAllBillDates(boardId);
        
        console.log('');
        console.log(`✅ Successfully updated bill dates for ${updatedCount} items!`);
        console.log('');
        console.log('📊 What was updated:');
        console.log('   • Bill Date = Date Received + Free Days');
        console.log('   • All items now show when billing actually starts');
        console.log('');
        console.log('🎉 Bill dates are now automatically calculated and displayed!');
        
    } catch (error) {
        console.error('❌ Error updating bill dates:', error.message);
        
        if (error.message.includes('API')) {
            console.log('');
            console.log('💡 Troubleshooting:');
            console.log('   1. Check your Monday.com API token is correct');
            console.log('   2. Ensure you have permission to update the board');
            console.log('   3. Verify the board ID is correct');
        }
        
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    updateBillDates();
} 