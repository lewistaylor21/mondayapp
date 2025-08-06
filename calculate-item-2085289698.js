const moment = require('moment');

// Item 2085289698 data from Monday.com API (actual data)
const itemData = {
    id: "2085289698",
    name: "Test Storage Item 2",
    boardId: "1953505209",
    cbm: 1.8,
    rate: 1, // per day
    freeDays: 7, // from the actual data
    dateReceived: "2025-07-01",
    dateOut: null // still in storage
};

function calculateAugustStorageBilling(item) {
    console.log('🧮 Calculating AUGUST 2025 Storage Billing for Item 2085289698');
    console.log('=' .repeat(60));
    
    const receivedDate = moment(item.dateReceived);
    const augustStart = moment('2025-08-01');
    const augustEnd = moment('2025-08-31');
    const rate = item.rate || 0;
    const cbm = item.cbm || 0;
    const freeDays = item.freeDays || 0;
    
    console.log(`📦 Item: ${item.name} (ID: ${item.id})`);
    console.log(`📅 Date Received: ${receivedDate.format('YYYY-MM-DD')}`);
    console.log(`📅 August Start: ${augustStart.format('YYYY-MM-DD')}`);
    console.log(`📅 August End: ${augustEnd.format('YYYY-MM-DD')}`);
    console.log(`📊 CBM: ${cbm}`);
    console.log(`💰 Rate: £${rate} per day`);
    console.log(`🎁 Free Days: ${freeDays} (from original data)`);
    console.log('');
    
    // Calculate billing start date (date received + free days)
    const billingStartDate = moment(receivedDate).add(freeDays, 'days');
    console.log(`📅 Billing Start Date: ${billingStartDate.format('YYYY-MM-DD')}`);
    
    // For August 2025, we need to calculate billable days
    // If billing start date is before August, then full August is billable
    // If billing start date is in August, then only partial August is billable
    
    let augustBillableDays = 0;
    
    if (billingStartDate.isBefore(augustStart)) {
        // Billing started before August, so full August is billable
        augustBillableDays = augustEnd.diff(augustStart, 'days') + 1; // 31 days
        console.log(`📈 August Billable Days: ${augustBillableDays} days (full month)`);
    } else if (billingStartDate.isSameOrBefore(augustEnd)) {
        // Billing started in August, so partial month is billable
        augustBillableDays = augustEnd.diff(billingStartDate, 'days') + 1;
        console.log(`📈 August Billable Days: ${augustBillableDays} days (partial month)`);
    } else {
        // Billing starts after August, so no August billing
        augustBillableDays = 0;
        console.log(`📈 August Billable Days: 0 days (billing starts after August)`);
    }
    
    // Calculate total billing for August
    const totalBilling = augustBillableDays * rate * cbm;
    console.log(`💷 Total August Billing: £${totalBilling.toFixed(2)}`);
    
    console.log('');
    console.log('📋 August 2025 Summary:');
    console.log(`   - Item: ${item.name}`);
    console.log(`   - CBM: ${cbm}`);
    console.log(`   - Rate: £${rate}/day`);
    console.log(`   - Free Days: ${freeDays}`);
    console.log(`   - Billing Start: ${billingStartDate.format('YYYY-MM-DD')}`);
    console.log(`   - August Billable Days: ${augustBillableDays} days`);
    console.log(`   - Total August Billing: £${totalBilling.toFixed(2)}`);
    
    return {
        itemId: item.id,
        itemName: item.name,
        cbm: cbm,
        rate: rate,
        freeDays: freeDays,
        billingStartDate: billingStartDate.format('YYYY-MM-DD'),
        augustBillableDays: augustBillableDays,
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
console.log(`This covers ${result.augustBillableDays} billable days in August.`);
