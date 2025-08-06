const moment = require('moment');

// Item 2085289698 data from Monday.com API
const itemData = {
    id: "2085289698",
    name: "Test Storage Item 2",
    boardId: "1953505209",
    cbm: 1.8,
    rate: 1, // per day
    freeDays: 0, // NO FREE DAYS in August
    dateReceived: "2025-07-01",
    dateOut: null // still in storage
};

function calculateAugustStorageBilling(item) {
    console.log('🧮 Calculating AUGUST 2025 Storage Billing');
    console.log('=' .repeat(50));
    
    const receivedDate = moment(item.dateReceived);
    const augustStart = moment('2025-08-01');
    const augustEnd = moment('2025-08-31');
    const rate = item.rate || 0;
    const cbm = item.cbm || 0;
    
    console.log(`📦 Item: ${item.name} (ID: ${item.id})`);
    console.log(`📅 Date Received: ${receivedDate.format('YYYY-MM-DD')}`);
    console.log(`📅 August Start: ${augustStart.format('YYYY-MM-DD')}`);
    console.log(`📅 August End: ${augustEnd.format('YYYY-MM-DD')}`);
    console.log(`📊 CBM: ${cbm}`);
    console.log(`💰 Rate: £${rate} per day`);
    console.log(`🎁 Free Days: 0 (NO FREE DAYS in August)`);
    console.log('');
    
    // Calculate August storage days (full month)
    const augustDays = augustEnd.diff(augustStart, 'days') + 1; // 31 days
    console.log(`📈 August Days: ${augustDays} days (full month)`);
    
    // Calculate total billing for August
    const totalBilling = augustDays * rate * cbm;
    console.log(`💷 Total August Billing: £${totalBilling.toFixed(2)}`);
    
    console.log('');
    console.log('📋 August 2025 Summary:');
    console.log(`   - Item: ${item.name}`);
    console.log(`   - CBM: ${cbm}`);
    console.log(`   - Rate: £${rate}/day`);
    console.log(`   - August Days: ${augustDays} days`);
    console.log(`   - Free Days: 0`);
    console.log(`   - Total August Billing: £${totalBilling.toFixed(2)}`);
    
    return {
        itemId: item.id,
        itemName: item.name,
        cbm: cbm,
        rate: rate,
        augustDays: augustDays,
        totalBilling: totalBilling,
        month: 'August 2025'
    };
}

// Calculate for August 2025
console.log(`📅 Calculating for: August 2025`);
console.log('');

const result = calculateAugustStorageBilling(itemData);

console.log('');
console.log('🎯 Final Result:');
console.log(`Total Storage Billing for Item 2085289698 for August 2025: £${result.totalBilling.toFixed(2)}`);
console.log(`This covers the full 31 days of August with no free days.`);
