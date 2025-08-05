// Configuration - Change this to your board ID
const BOARD_ID = 1953505209; // Your actual board ID

// Column IDs - Updated to match actual board columns
const COLUMN_IDS = {
    BILLING_START_DATE: 'formula_mkthkh5k',    // Billing start date (formula column)
    SCAN_OUT_DATE: 'date0__1',                 // Date Out (date column)
    CBM: 'numbers5__1',                        // CBM (numbers column)
    RATE: 'numeric_mkqfs5t6',                  // Rate (numbers column)
    CUSTOMER_NAME: 'name',                     // Name (name column)
    DATE_RECEIVED: 'date__1',                  // Date Received (date column)
    FREE_DAYS: 'numeric_mkqfs7n9',             // Free Days (numbers column)
    SCAN_OUT_STATUS: 'status5__1'              // SCAN OUT (status column)
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

// Helper function to get text from column value
function getTextFromColumn(columnValue) {
    if (!columnValue || !columnValue.text) return '';
    return columnValue.text;
}

// Calculate billable days for a specific month
function calculateBillableDaysForMonth(billingStartDate, scanOutDate, targetMonth, targetYear) {
    if (!billingStartDate) return 0;
    
    const monthStart = new Date(targetYear, targetMonth, 1);
    const monthEnd = new Date(targetYear, targetMonth + 1, 0);
    
    // Determine effective start date (later of billing start or month start)
    const effectiveStart = billingStartDate > monthStart ? billingStartDate : monthStart;
    
    // Determine effective end date (earlier of scan out date, month end, or today)
    let effectiveEnd = monthEnd;
    if (scanOutDate && scanOutDate <= monthEnd) {
        effectiveEnd = scanOutDate;
    } else if (targetMonth === new Date().getMonth() && targetYear === new Date().getFullYear()) {
        // If it's current month, use today as end date
        effectiveEnd = new Date();
    }
    
    // Calculate billable days
    const diffTime = Math.abs(effectiveEnd - effectiveStart);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
    
    return Math.max(0, diffDays);
}

// Calculate storage billing for a specific month
function calculateStorageBillingForMonth(billingStartDate, scanOutDate, cbm, rate, targetMonth, targetYear) {
    if (!billingStartDate || !cbm || !rate) return 0;
    
    const billableDays = calculateBillableDaysForMonth(billingStartDate, scanOutDate, targetMonth, targetYear);
    return billableDays * cbm * rate;
}

// Calculate total storage billing (all months)
function calculateTotalStorageBilling(billingStartDate, scanOutDate, cbm, rate) {
    if (!billingStartDate || !cbm || !rate) return 0;
    
    const endDate = scanOutDate || new Date();
    const startDate = new Date(billingStartDate);
    
    let totalBilling = 0;
    let currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    
    while (currentDate <= endDate) {
        const monthBilling = calculateStorageBillingForMonth(
            billingStartDate, 
            scanOutDate, 
            cbm, 
            rate, 
            currentDate.getMonth(), 
            currentDate.getFullYear()
        );
        totalBilling += monthBilling;
        
        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return totalBilling;
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Display monthly billing results
function displayMonthlyBillingResults(results, targetMonth, targetYear) {
    const monthName = new Date(targetYear, targetMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    console.log(`\n📦 Storage Billing Results for ${monthName}\n`);
    console.log('='.repeat(100));
    console.log('| Customer Name'.padEnd(25) + ' | CBM'.padEnd(8) + ' | Rate/Day'.padEnd(12) + ' | Billable Days'.padEnd(15) + ' | Monthly Total'.padEnd(15) + ' |');
    console.log('='.repeat(100));
    
    results.forEach(item => {
        const customerName = item.customerName.length > 23 ? item.customerName.substring(0, 20) + '...' : item.customerName;
        const cbm = item.cbm.toString();
        const ratePerDay = formatCurrency(item.rate);
        const billableDays = item.billableDays.toString();
        const monthlyTotal = formatCurrency(item.monthlyBilling);
        
        console.log(
            '| ' + customerName.padEnd(23) + 
            ' | ' + cbm.padEnd(6) + 
            ' | ' + ratePerDay.padEnd(10) + 
            ' | ' + billableDays.padEnd(13) + 
            ' | ' + monthlyTotal.padEnd(13) + ' |'
        );
    });
    
    console.log('='.repeat(100));
    
    // Summary
    const totalCBM = results.reduce((sum, item) => sum + item.cbm, 0);
    const totalBillableDays = results.reduce((sum, item) => sum + item.billableDays, 0);
    const totalMonthlyBilling = results.reduce((sum, item) => sum + item.monthlyBilling, 0);
    
    console.log(`\n📈 Summary for ${monthName}:`);
    console.log(`Total CBM: ${totalCBM.toFixed(2)}`);
    console.log(`Total Billable Days: ${totalBillableDays}`);
    console.log(`Total Monthly Billing: ${formatCurrency(totalMonthlyBilling)}`);
}

// Display total billing results (all time)
function displayTotalBillingResults(results) {
    console.log('\n📦 Total Storage Billing Results (All Time)\n');
    console.log('='.repeat(100));
    console.log('| Customer Name'.padEnd(25) + ' | CBM'.padEnd(8) + ' | Rate/Day'.padEnd(12) + ' | Total Days'.padEnd(15) + ' | Total Billing'.padEnd(15) + ' |');
    console.log('='.repeat(100));
    
    results.forEach(item => {
        const customerName = item.customerName.length > 23 ? item.customerName.substring(0, 20) + '...' : item.customerName;
        const cbm = item.cbm.toString();
        const ratePerDay = formatCurrency(item.rate);
        const totalDays = item.totalBillableDays.toString();
        const totalBilling = formatCurrency(item.totalBilling);
        
        console.log(
            '| ' + customerName.padEnd(23) + 
            ' | ' + cbm.padEnd(6) + 
            ' | ' + ratePerDay.padEnd(10) + 
            ' | ' + totalDays.padEnd(13) + 
            ' | ' + totalBilling.padEnd(13) + ' |'
        );
    });
    
    console.log('='.repeat(100));
    
    // Summary
    const totalCBM = results.reduce((sum, item) => sum + item.cbm, 0);
    const totalBillableDays = results.reduce((sum, item) => sum + item.totalBillableDays, 0);
    const totalBilling = results.reduce((sum, item) => sum + item.totalBilling, 0);
    
    console.log(`\n📈 Summary (All Time):`);
    console.log(`Total CBM: ${totalCBM.toFixed(2)}`);
    console.log(`Total Billable Days: ${totalBillableDays}`);
    console.log(`Total Billing: ${formatCurrency(totalBilling)}`);
}

// Process items for monthly billing
function processItemsForMonth(items, targetMonth, targetYear) {
    const results = [];
    
    for (const item of items) {
        const columnValues = item.column_values;
        
        // Extract column values
        const dateReceived = getDateFromColumn(columnValues[COLUMN_IDS.DATE_RECEIVED]);
        const scanOutDate = getDateFromColumn(columnValues[COLUMN_IDS.SCAN_OUT_DATE]);
        const cbm = getNumberFromColumn(columnValues[COLUMN_IDS.CBM]);
        const rate = getNumberFromColumn(columnValues[COLUMN_IDS.RATE]);
        const freeDays = getNumberFromColumn(columnValues[COLUMN_IDS.FREE_DAYS]);
        const customerName = getTextFromColumn(columnValues[COLUMN_IDS.CUSTOMER_NAME]) || item.name;
        
        // Calculate billing start date (date received + free days)
        let billingStartDate = null;
        if (dateReceived && freeDays !== null) {
            billingStartDate = new Date(dateReceived);
            billingStartDate.setDate(billingStartDate.getDate() + freeDays);
        }
        
        // Calculate billing for the specific month
        const billableDays = calculateBillableDaysForMonth(billingStartDate, scanOutDate, targetMonth, targetYear);
        const monthlyBilling = calculateStorageBillingForMonth(billingStartDate, scanOutDate, cbm, rate, targetMonth, targetYear);
        
        if (billableDays > 0) {
            results.push({
                customerName,
                cbm,
                rate,
                billableDays,
                monthlyBilling,
                dateReceived: dateReceived ? dateReceived.toISOString().split('T')[0] : 'N/A',
                billingStartDate: billingStartDate ? billingStartDate.toISOString().split('T')[0] : 'N/A',
                scanOutDate: scanOutDate ? scanOutDate.toISOString().split('T')[0] : 'Active',
                freeDays
            });
        }
    }
    
    return results;
}

// Process items for total billing (all time)
function processItemsForTotalBilling(items) {
    const results = [];
    
    for (const item of items) {
        const columnValues = item.column_values;
        
        // Extract column values
        const dateReceived = getDateFromColumn(columnValues[COLUMN_IDS.DATE_RECEIVED]);
        const scanOutDate = getDateFromColumn(columnValues[COLUMN_IDS.SCAN_OUT_DATE]);
        const cbm = getNumberFromColumn(columnValues[COLUMN_IDS.CBM]);
        const rate = getNumberFromColumn(columnValues[COLUMN_IDS.RATE]);
        const freeDays = getNumberFromColumn(columnValues[COLUMN_IDS.FREE_DAYS]);
        const customerName = getTextFromColumn(columnValues[COLUMN_IDS.CUSTOMER_NAME]) || item.name;
        
        // Calculate billing start date (date received + free days)
        let billingStartDate = null;
        if (dateReceived && freeDays !== null) {
            billingStartDate = new Date(dateReceived);
            billingStartDate.setDate(billingStartDate.getDate() + freeDays);
        }
        
        // Calculate total billing
        const totalBillableDays = calculateTotalStorageBilling(billingStartDate, scanOutDate, cbm, rate) / (cbm * rate);
        const totalBilling = calculateTotalStorageBilling(billingStartDate, scanOutDate, cbm, rate);
        
        if (totalBillableDays > 0) {
            results.push({
                customerName,
                cbm,
                rate,
                totalBillableDays: Math.round(totalBillableDays),
                totalBilling,
                dateReceived: dateReceived ? dateReceived.toISOString().split('T')[0] : 'N/A',
                billingStartDate: billingStartDate ? billingStartDate.toISOString().split('T')[0] : 'N/A',
                scanOutDate: scanOutDate ? scanOutDate.toISOString().split('T')[0] : 'Active',
                freeDays
            });
        }
    }
    
    return results;
}

// Main function
async function main() {
    try {
        console.log(`🔍 Storage Billing Calculator for Board ID: ${BOARD_ID}`);
        console.log('📋 This script calculates storage billing based on CBM × Rate × Billable Days');
        console.log('💡 To use with actual MCP tools:');
        console.log('   1. Call the MCP tool: mcp_monday-api-mcp-hosted_get_board_items_by_name');
        console.log('   2. Pass the results to processItemsForMonth() or processItemsForTotalBilling()');
        console.log('   3. Display the results with displayMonthlyBillingResults() or displayTotalBillingResults()');
        
        // Show the exact MCP tool call you need to make
        console.log('\n🔧 Exact MCP Tool Call:');
        console.log(`Tool: mcp_monday-api-mcp-hosted_get_board_items_by_name`);
        console.log(`Parameters: { boardId: ${BOARD_ID}, term: "" }`);
        
        // Show usage examples
        console.log('\n📝 Usage Examples:');
        console.log(`
// For monthly billing (e.g., current month)
const currentDate = new Date();
const monthlyResults = processItemsForMonth(mcpResponse.data.items, currentDate.getMonth(), currentDate.getFullYear());
displayMonthlyBillingResults(monthlyResults, currentDate.getMonth(), currentDate.getFullYear());

// For total billing (all time)
const totalResults = processItemsForTotalBilling(mcpResponse.data.items);
displayTotalBillingResults(totalResults);
        `);
        
        // Show expected data structure
        console.log('\n📊 Expected MCP Response Structure:');
        console.log(`
{
  "data": {
    "items": [
      {
        "id": 123,
        "name": "Item Name",
        "column_values": {
          "${COLUMN_IDS.BILLING_START_DATE}": { "date": "2024-01-15" },
          "${COLUMN_IDS.SCAN_OUT_DATE}": { "date": "2024-02-20" },
          "${COLUMN_IDS.CBM}": { "number": 2.5 },
          "${COLUMN_IDS.RATE}": { "number": 10.00 },
          "${COLUMN_IDS.CUSTOMER_NAME}": { "text": "Customer Name" }
        }
      }
    ]
  }
}
        `);
        
        console.log('\n✅ Script ready! Use the exported functions with your MCP tools.');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Export functions for use with MCP tools
module.exports = {
    processItemsForMonth,
    processItemsForTotalBilling,
    displayMonthlyBillingResults,
    displayTotalBillingResults,
    calculateBillableDaysForMonth,
    calculateStorageBillingForMonth,
    calculateTotalStorageBilling,
    formatCurrency,
    COLUMN_IDS,
    BOARD_ID
};

// Run the script if called directly
if (require.main === module) {
    main();
} 