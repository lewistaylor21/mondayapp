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

// Process items and calculate billing
function processItems(items) {
    const results = [];
    
    for (const item of items) {
        const columnValues = item.column_values;
        
        // Extract column values
        const dateReceived = getDateFromColumn(columnValues[COLUMN_IDS.DATE_RECEIVED]);
        const freeDays = getNumberFromColumn(columnValues[COLUMN_IDS.FREE_DAYS]);
        const dateOut = getDateFromColumn(columnValues[COLUMN_IDS.DATE_OUT]);
        const rate = getNumberFromColumn(columnValues[COLUMN_IDS.RATE]);
        
        // Calculate billing
        const totalBillableDays = calculateTotalBillableDays(dateReceived, freeDays, dateOut);
        const currentMonthPrice = calculateCurrentMonthPrice(dateReceived, freeDays, dateOut, rate);
        
        results.push({
            name: item.name,
            totalBillableDays,
            currentMonthPrice,
            dateReceived: dateReceived ? dateReceived.toISOString().split('T')[0] : 'N/A',
            freeDays,
            dateOut: dateOut ? dateOut.toISOString().split('T')[0] : 'Ongoing',
            rate
        });
    }
    
    return results;
}

// Main function
async function main() {
    try {
        console.log(`🔍 Ready to fetch items from board ID: ${BOARD_ID}`);
        console.log('📋 This script is designed to work with MCP tools.');
        console.log('💡 To use with actual MCP tools, you can:');
        console.log('   1. Copy the processItems() function to use with MCP data');
        console.log('   2. Call the MCP tool: mcp_monday-api-mcp-hosted_get_board_items_by_name');
        console.log('   3. Pass the results to processItems() function');
        console.log('   4. Display the results with displayResults() function');
        
        // Example of how to use with MCP tools:
        console.log('\n📝 Example usage with MCP tools:');
        console.log(`
// 1. Call MCP tool to get board items
const mcpResponse = await callMCPTool('mcp_monday-api-mcp-hosted_get_board_items_by_name', {
    boardId: ${BOARD_ID},
    term: ''
});

// 2. Process the items
const results = processItems(mcpResponse.data.items);

// 3. Display results
displayResults(results);
        `);
        
        // Show sample data structure
        console.log('\n📊 Expected data structure from MCP:');
        console.log(`
{
  "data": {
    "items": [
      {
        "id": 123,
        "name": "Project Name",
        "column_values": {
          "${COLUMN_IDS.DATE_RECEIVED}": { "date": "2024-01-15" },
          "${COLUMN_IDS.FREE_DAYS}": { "number": 5 },
          "${COLUMN_IDS.DATE_OUT}": { "date": "2024-02-20" },
          "${COLUMN_IDS.RATE}": { "number": 500 }
        }
      }
    ]
  }
}
        `);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Export functions for use with MCP tools
module.exports = {
    processItems,
    displayResults,
    calculateTotalBillableDays,
    calculateCurrentMonthPrice,
    formatCurrency,
    COLUMN_IDS
};

// Run the script if called directly
if (require.main === module) {
    main();
} 