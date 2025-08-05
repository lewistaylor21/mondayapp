const { spawn } = require('child_process');

// Configuration - Change this to your board ID
const BOARD_ID = 123456; // Replace with your actual board ID

// Column IDs - You may need to adjust these based on your actual column IDs
const COLUMN_IDS = {
    DATE_RECEIVED: 'date_received', // Replace with actual column ID
    FREE_DAYS: 'free_days',         // Replace with actual column ID
    DATE_OUT: 'date_out',           // Replace with actual column ID
    RATE: 'rate'                    // Replace with actual column ID
};

// Helper function to get date from column value
function getDateFromColumn(columnValue) {
    if (!columnValue || !columnValue.date) return null;
    return new Date(columnValue.date);
}

// Helper function to get number from column value
function getNumberFromColumn(columnValue) {
    if (!columnValue || columnValue.number === undefined || columnValue.number === null) return 0;
    return parseFloat(columnValue.number);
}

// Calculate total billable days
function calculateTotalBillableDays(dateReceived, freeDays, dateOut) {
    if (!dateReceived) return 0;
    
    const startDate = new Date(dateReceived);
    startDate.setDate(startDate.getDate() + freeDays); // Add free days
    
    const endDate = dateOut || new Date(); // Use today if no date out
    
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
}

// Calculate current month price
function calculateCurrentMonthPrice(dateReceived, freeDays, dateOut, rate) {
    if (!dateReceived || !rate) return 0;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const startDate = new Date(dateReceived);
    startDate.setDate(startDate.getDate() + freeDays); // Add free days
    
    const endDate = dateOut || now;
    
    // If the project ends before current month, no billable days
    if (endDate.getMonth() < currentMonth || endDate.getFullYear() < currentYear) {
        return 0;
    }
    
    // If the project starts after current month, no billable days
    if (startDate.getMonth() > currentMonth || startDate.getFullYear() > currentYear) {
        return 0;
    }
    
    // Calculate billable days in current month
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0);
    
    const effectiveStart = startDate > monthStart ? startDate : monthStart;
    const effectiveEnd = endDate < monthEnd ? endDate : monthEnd;
    
    const diffTime = Math.abs(effectiveEnd - effectiveStart);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
    
    return Math.max(0, diffDays) * rate;
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Display results in a table
function displayResults(results) {
    console.log('\n📊 Billing Calculator Results\n');
    console.log('='.repeat(80));
    console.log('| Item Name'.padEnd(30) + ' | Total Billable Days'.padEnd(20) + ' | Current Month Price'.padEnd(20) + ' |');
    console.log('='.repeat(80));
    
    results.forEach(item => {
        const name = item.name.length > 28 ? item.name.substring(0, 25) + '...' : item.name;
        const totalDays = item.totalBillableDays.toString();
        const monthPrice = formatCurrency(item.currentMonthPrice);
        
        console.log(
            '| ' + name.padEnd(28) + 
            ' | ' + totalDays.padEnd(18) + 
            ' | ' + monthPrice.padEnd(18) + ' |'
        );
    });
    
    console.log('='.repeat(80));
    
    // Summary
    const totalBillableDays = results.reduce((sum, item) => sum + item.totalBillableDays, 0);
    const totalMonthPrice = results.reduce((sum, item) => sum + item.currentMonthPrice, 0);
    
    console.log(`\n📈 Summary:`);
    console.log(`Total Billable Days: ${totalBillableDays}`);
    console.log(`Total Current Month Price: ${formatCurrency(totalMonthPrice)}`);
}

// Main function
async function main() {
    try {
        console.log(`🔍 Fetching items from board ID: ${BOARD_ID}`);
        
        // This script is designed to be run in an environment with MCP tools
        // The actual MCP tool calls will be handled by the MCP client
        
        console.log('⚠️  This script requires MCP tools to be available.');
        console.log('Please run this in an environment with MCP support (like Cursor with MCP enabled).');
        console.log('The script will use the following MCP tool: mcp_monday-api-mcp-hosted_get_board_items_by_name');
        
        // For demonstration purposes, showing what the MCP call would look like:
        console.log('\n📋 MCP Tool Call Example:');
        console.log(`Tool: mcp_monday-api-mcp-hosted_get_board_items_by_name`);
        console.log(`Parameters: { boardId: ${BOARD_ID}, term: "" }`);
        
        console.log('\n🔧 To use this script:');
        console.log('1. Update the BOARD_ID constant with your actual board ID');
        console.log('2. Update the COLUMN_IDS object with your actual column IDs');
        console.log('3. Run this script in an MCP-enabled environment');
        
        // Placeholder for actual implementation
        console.log('\n📊 Sample Output (when MCP tools are connected):');
        console.log('='.repeat(80));
        console.log('| Item Name'.padEnd(30) + ' | Total Billable Days'.padEnd(20) + ' | Current Month Price'.padEnd(20) + ' |');
        console.log('='.repeat(80));
        console.log('| Sample Project 1'.padEnd(28) + ' | 15'.padEnd(18) + ' | $7,500.00'.padEnd(18) + ' |');
        console.log('| Sample Project 2'.padEnd(28) + ' | 8'.padEnd(18) + ' | $4,000.00'.padEnd(18) + ' |');
        console.log('='.repeat(80));
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = {
    calculateTotalBillableDays,
    calculateCurrentMonthPrice,
    formatCurrency
}; 