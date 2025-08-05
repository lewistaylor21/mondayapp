// Test script to fetch data from Monday.com board and run storage billing calculations
const { processItemsForMonth, processItemsForTotalBilling, displayMonthlyBillingResults, displayTotalBillingResults } = require('./storageBillingCalculator');

// Sample data structure based on the actual board columns
const sampleMCPResponse = {
    data: {
        items: [
            {
                id: 2085289634,
                name: "Test Storage Item 1",
                column_values: {
                    "name": { "text": "ABC Company" },
                    "date__1": { "date": "2024-01-15" },
                    "date0__1": { "date": "2024-02-20" },
                    "numbers5__1": { "number": 2.5 },
                    "numeric_mkqfs5t6": { "number": 10 },
                    "numeric_mkqfs7n9": { "number": 3 },
                    "status5__1": { "label": "SCANNED OUT" }
                }
            },
            {
                id: 2085289698,
                name: "Test Storage Item 2",
                column_values: {
                    "name": { "text": "XYZ Corp" },
                    "date__1": { "date": "2024-02-01" },
                    "date0__1": null,
                    "numbers5__1": { "number": 1.8 },
                    "numeric_mkqfs5t6": { "number": 12 },
                    "numeric_mkqfs7n9": { "number": 5 },
                    "status5__1": null
                }
            },
            {
                id: 2085289789,
                name: "Test Storage Item 3",
                column_values: {
                    "name": { "text": "Storage Solutions Inc" },
                    "date__1": { "date": "2024-01-01" },
                    "date0__1": { "date": "2024-03-15" },
                    "numbers5__1": { "number": 4.2 },
                    "numeric_mkqfs5t6": { "number": 8.5 },
                    "numeric_mkqfs7n9": { "number": 0 },
                    "status5__1": { "label": "SCANNED OUT" }
                }
            },
            {
                id: 2085289903,
                name: "Test Storage Item 4",
                column_values: {
                    "name": { "text": "Warehouse Pro" },
                    "date__1": { "date": "2024-03-10" },
                    "date0__1": { "date": "2024-05-20" },
                    "numbers5__1": { "number": 3.0 },
                    "numeric_mkqfs5t6": { "number": 15 },
                    "numeric_mkqfs7n9": { "number": 7 },
                    "status5__1": { "label": "SCANNED OUT" }
                }
            },
            {
                id: 2085289974,
                name: "Test Storage Item 5",
                column_values: {
                    "name": { "text": "Logistics Plus" },
                    "date__1": { "date": "2024-04-15" },
                    "date0__1": null,
                    "numbers5__1": { "number": 5.5 },
                    "numeric_mkqfs5t6": { "number": 18 },
                    "numeric_mkqfs7n9": { "number": 2 },
                    "status5__1": null
                }
            }
        ]
    }
};

async function testStorageBilling() {
    try {
        console.log('🧪 Testing Storage Billing Calculator with Sample Data\n');
        
        // Test monthly billing for January 2024
        console.log('📅 Testing Monthly Billing for January 2024:');
        const januaryResults = processItemsForMonth(sampleMCPResponse.data.items, 0, 2024); // January = 0
        displayMonthlyBillingResults(januaryResults, 0, 2024);
        
        // Test monthly billing for February 2024
        console.log('\n📅 Testing Monthly Billing for February 2024:');
        const februaryResults = processItemsForMonth(sampleMCPResponse.data.items, 1, 2024); // February = 1
        displayMonthlyBillingResults(februaryResults, 1, 2024);
        
        // Test total billing (all time)
        console.log('\n📊 Testing Total Billing (All Time):');
        const totalResults = processItemsForTotalBilling(sampleMCPResponse.data.items);
        displayTotalBillingResults(totalResults);
        
        console.log('\n✅ Storage billing calculator test completed successfully!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Run the test
testStorageBilling(); 