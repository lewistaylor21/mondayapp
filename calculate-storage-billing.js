const moment = require('moment');

// Item 2085289698 data from Monday.com API
const itemData = {
    id: "2085289698",
    name: "Test Storage Item 2",
    boardId: "1953505209",
    cbm: 1.8,
    rate: 1, // per day
    freeDays: 7,
    dateReceived: "2025-07-01",
    dateOut: null // still in storage
};

function calculateStorageBilling(item, endDate) {
    console.log('🧮 Calculating Storage Billing for End of Month');
    console.log('=' .repeat(50));
    
    const receivedDate = moment(item.dateReceived);
    const endOfMonth = moment(endDate).endOf('month');
    const freeDays = item.freeDays || 0;
    const rate = item.rate || 0;
    const cbm = item.cbm || 0;
    
    console.log(`📦 Item: ${item.name} (ID: ${item.id})`);
    console.log(`📅 Date Received: ${receivedDate.format('YYYY-MM-DD')}`);
    console.log(`📅 End of Month: ${endOfMonth.format('YYYY-MM-DD')}`);
    console.log(`📊 CBM: ${cbm}`);
    console.log(`💰 Rate: £${rate} per day`);
    console.log(`🎁 Free Days: ${freeDays}`);
    console.log('');
    
    // Calculate total days in storage until end of month
    const totalDays = endOfMonth.diff(receivedDate, 'days') + 1;
    console.log(`📈 Total Days in Storage: ${totalDays} days`);
    
    // Calculate billable days (total days - free days)
    const billableDays = Math.max(0, totalDays - freeDays);
    console.log(`💳 Billable Days: ${billableDays} days`);
    
    // Calculate total billing
    const totalBilling = billableDays * rate * cbm;
    console.log(`💷 Total Billing: £${totalBilling.toFixed(2)}`);
    
    // Calculate billing start date
    const billingStartDate = receivedDate.add(freeDays, 'days');
    console.log(`📅 Billing Start Date: ${billingStartDate.format('YYYY-MM-DD')}`);
    
    console.log('');
    console.log('📋 Summary:');
    console.log(`   - Item: ${item.name}`);
    console.log(`   - CBM: ${cbm}`);
    console.log(`   - Rate: £${rate}/day`);
    console.log(`   - Free Days: ${freeDays}`);
    console.log(`   - Billable Days: ${billableDays}`);
    console.log(`   - Total Billing (End of Month): £${totalBilling.toFixed(2)}`);
    
    return {
        itemId: item.id,
        itemName: item.name,
        cbm: cbm,
        rate: rate,
        freeDays: freeDays,
        totalDays: totalDays,
        billableDays: billableDays,
        totalBilling: totalBilling,
        billingStartDate: billingStartDate.format('YYYY-MM-DD'),
        endOfMonth: endOfMonth.format('YYYY-MM-DD')
    };
}

// Calculate for current month (August 2025)
const currentMonth = moment().format('YYYY-MM');
console.log(`📅 Calculating for: ${currentMonth}`);
console.log('');

const result = calculateStorageBilling(itemData, moment());

console.log('');
console.log('🎯 Final Result:');
console.log(`Total Storage Billing for Item 2085289698 at end of ${currentMonth}: £${result.totalBilling.toFixed(2)}`);
