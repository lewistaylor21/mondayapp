// Script to calculate storage billing for a single item
// Uses formula logic: billing start date = date received + free days

// Item data from MCP (Test Storage Item 2 - ID: 2085289698)
const itemData = {
    id: "2085289698",
    name: "Test Storage Item 2",
    column_values: {
        "date__1": { "date": "2025-07-01" },           // Date Received
        "date0__1": null,                              // Scan Out Date (null = active)
        "numbers5__1": { "number": 1.8 },              // CBM
        "numeric_mkqfs5t6": { "number": 1 },           // Rate per CBM per day
        "numeric_mkqfs7n9": { "number": 7 }            // Free Days
    }
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

// Calculate billing start date using formula: date received + free days
function calculateBillingStartDate(dateReceived, freeDays) {
    if (!dateReceived || freeDays === null) return null;
    const billingStart = new Date(dateReceived);
    billingStart.setDate(billingStart.getDate() + freeDays);
    return billingStart;
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

// Format currency in pounds
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP'
    }).format(amount);
}

// Main calculation function
function calculateItemBilling() {
    try {
        console.log('🧮 Calculating Storage Billing for Single Item\n');
        console.log(`📦 Item: ${itemData.name} (ID: ${itemData.id})\n`);
        
        // Extract data
        const dateReceived = getDateFromColumn(itemData.column_values.date__1);
        const scanOutDate = getDateFromColumn(itemData.column_values.date0__1);
        const cbm = getNumberFromColumn(itemData.column_values.numbers5__1);
        const rate = getNumberFromColumn(itemData.column_values.numeric_mkqfs5t6);
        const freeDays = getNumberFromColumn(itemData.column_values.numeric_mkqfs7n9);
        
        // Calculate billing start date using formula
        const billingStartDate = calculateBillingStartDate(dateReceived, freeDays);
        
        console.log('📊 Item Details:');
        console.log(`   Date Received: ${dateReceived ? dateReceived.toISOString().split('T')[0] : 'N/A'}`);
        console.log(`   Free Days: ${freeDays}`);
        console.log(`   Billing Start Date: ${billingStartDate ? billingStartDate.toISOString().split('T')[0] : 'N/A'}`);
        console.log(`   Scan Out Date: ${scanOutDate ? scanOutDate.toISOString().split('T')[0] : 'Active'}`);
        console.log(`   CBM: ${cbm}`);
        console.log(`   Rate: £${rate} per CBM per day\n`);
        
        // Calculate August 2025 billing (month 7, year 2025)
        const augustBillableDays = calculateBillableDaysForMonth(billingStartDate, scanOutDate, 7, 2025);
        const augustBilling = calculateStorageBillingForMonth(billingStartDate, scanOutDate, cbm, rate, 7, 2025);
        
        console.log('📅 August 2025 Billing:');
        console.log(`   Billable Days: ${augustBillableDays}`);
        console.log(`   Daily Rate: £${rate} × ${cbm} CBM = £${rate * cbm} per day`);
        console.log(`   Total: £${rate * cbm} × ${augustBillableDays} days = ${formatCurrency(augustBilling)}\n`);
        
        // Show calculation breakdown
        console.log('🧮 Calculation Breakdown:');
        console.log(`   Formula: Rate × CBM × Billable Days`);
        console.log(`   Formula: £${rate} × ${cbm} × ${augustBillableDays}`);
        console.log(`   Result: ${formatCurrency(augustBilling)}\n`);
        
        console.log('✅ Single item billing calculation completed!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Run the calculation
calculateItemBilling(); 