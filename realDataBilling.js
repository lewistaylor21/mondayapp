// Script to process real data from Monday.com board and calculate storage billing for July 2025
const { processItemsForMonth, processItemsForTotalBilling, displayMonthlyBillingResults, displayTotalBillingResults } = require('./storageBillingCalculator');

// Real data from Monday.com board (fetched via MCP)
const realMCPResponse = {
    data: {
        items: [
            {
                id: "2085289698",
                name: "Test Storage Item 2",
                column_values: {
                    "name": { "text": "Test Storage Item 2" },
                    "date__1": { "date": "2025-07-01" },
                    "date0__1": null,
                    "numbers5__1": { "number": 1.8 },
                    "numeric_mkqfs5t6": { "number": 1 },
                    "numeric_mkqfs7n9": { "number": 7 },
                    "status5__1": null
                }
            },
            {
                id: "2085289974",
                name: "Test Storage Item 5",
                column_values: {
                    "name": { "text": "Test Storage Item 5" },
                    "date__1": { "date": "2025-07-01" },
                    "date0__1": null,
                    "numbers5__1": { "number": 5.5 },
                    "numeric_mkqfs5t6": { "number": 1 },
                    "numeric_mkqfs7n9": { "number": 7 },
                    "status5__1": null
                }
            },
            {
                id: "2085290085",
                name: "Test Storage Item 7",
                column_values: {
                    "name": { "text": "Test Storage Item 7" },
                    "date__1": { "date": "2025-07-01" },
                    "date0__1": null,
                    "numbers5__1": { "number": 6.8 },
                    "numeric_mkqfs5t6": { "number": 1 },
                    "numeric_mkqfs7n9": { "number": 7 },
                    "status5__1": null
                }
            },
            {
                id: "2085290730",
                name: "Test Storage Item 9",
                column_values: {
                    "name": { "text": "Test Storage Item 9" },
                    "date__1": { "date": "2025-07-01" },
                    "date0__1": null,
                    "numbers5__1": { "number": 8.0 },
                    "numeric_mkqfs5t6": { "number": 1 },
                    "numeric_mkqfs7n9": { "number": 7 },
                    "status5__1": null
                }
            },
            {
                id: "2085290932",
                name: "Test Storage Item 11",
                column_values: {
                    "name": { "text": "Test Storage Item 11" },
                    "date__1": { "date": "2025-07-01" },
                    "date0__1": null,
                    "numbers5__1": { "number": 7.2 },
                    "numeric_mkqfs5t6": { "number": 1 },
                    "numeric_mkqfs7n9": { "number": 7 },
                    "status5__1": null
                }
            },
            {
                id: "2085291175",
                name: "Test Storage Item 13",
                column_values: {
                    "name": { "text": "Test Storage Item 13" },
                    "date__1": { "date": "2025-07-01" },
                    "date0__1": null,
                    "numbers5__1": { "number": 9.5 },
                    "numeric_mkqfs5t6": { "number": 1 },
                    "numeric_mkqfs7n9": { "number": 7 },
                    "status5__1": null
                }
            },
            {
                id: "2085291322",
                name: "Test Storage Item 15",
                column_values: {
                    "name": { "text": "Test Storage Item 15" },
                    "date__1": { "date": "2025-07-01" },
                    "date0__1": null,
                    "numbers5__1": { "number": 6.0 },
                    "numeric_mkqfs5t6": { "number": 1 },
                    "numeric_mkqfs7n9": { "number": 7 },
                    "status5__1": null
                }
            },
            {
                id: "2085291459",
                name: "Test Storage Item 17",
                column_values: {
                    "name": { "text": "Test Storage Item 17" },
                    "date__1": { "date": "2025-07-01" },
                    "date0__1": null,
                    "numbers5__1": { "number": 1.2 },
                    "numeric_mkqfs5t6": { "number": 1 },
                    "numeric_mkqfs7n9": { "number": 7 },
                    "status5__1": null
                }
            },
            {
                id: "2085291584",
                name: "Test Storage Item 19",
                column_values: {
                    "name": { "text": "Test Storage Item 19" },
                    "date__1": { "date": "2025-07-01" },
                    "date0__1": null,
                    "numbers5__1": { "number": 3.3 },
                    "numeric_mkqfs5t6": { "number": 1 },
                    "numeric_mkqfs7n9": { "number": 7 },
                    "status5__1": null
                }
            },
            {
                id: "2085293598",
                name: "Test Storage Item 21",
                column_values: {
                    "name": { "text": "Test Storage Item 21" },
                    "date__1": { "date": "2025-07-01" },
                    "date0__1": null,
                    "numbers5__1": { "number": 2.2 },
                    "numeric_mkqfs5t6": { "number": 1 },
                    "numeric_mkqfs7n9": { "number": 7 },
                    "status5__1": null
                }
            },
            {
                id: "2085293925",
                name: "Test Storage Item 23",
                column_values: {
                    "name": { "text": "Test Storage Item 23" },
                    "date__1": { "date": "2025-07-01" },
                    "date0__1": null,
                    "numbers5__1": { "number": 6.8 },
                    "numeric_mkqfs5t6": { "number": 1 },
                    "numeric_mkqfs7n9": { "number": 7 },
                    "status5__1": null
                }
            },
            {
                id: "2085290022",
                name: "Test Storage Item 6",
                column_values: {
                    "name": { "text": "Test Storage Item 6" },
                    "date__1": { "date": "2025-07-01" },
                    "date0__1": { "date": "2025-08-04" },
                    "numbers5__1": { "number": 2.0 },
                    "numeric_mkqfs5t6": { "number": 11 },
                    "numeric_mkqfs7n9": { "number": 7 },
                    "status5__1": { "label": "SCANNED OUT" }
                }
            },
            {
                id: "2085289634",
                name: "Test Storage Item 1",
                column_values: {
                    "name": { "text": "Test Storage Item 1" },
                    "date__1": { "date": "2025-07-01" },
                    "date0__1": { "date": "2025-08-04" },
                    "numbers5__1": { "number": 2.5 },
                    "numeric_mkqfs5t6": { "number": 10 },
                    "numeric_mkqfs7n9": { "number": 7 },
                    "status5__1": { "label": "SCANNED OUT" }
                }
            },
            {
                id: "2085289789",
                name: "Test Storage Item 3",
                column_values: {
                    "name": { "text": "Test Storage Item 3" },
                    "date__1": { "date": "2025-07-01" },
                    "date0__1": { "date": "2025-08-04" },
                    "numbers5__1": { "number": 4.2 },
                    "numeric_mkqfs5t6": { "number": 8.5 },
                    "numeric_mkqfs7n9": { "number": 7 },
                    "status5__1": null
                }
            },
            {
                id: "2085293680",
                name: "Test Storage Item 22",
                column_values: {
                    "name": { "text": "Test Storage Item 22" },
                    "date__1": { "date": "2025-07-01" },
                    "date0__1": { "date": "2025-08-04" },
                    "numbers5__1": { "number": 3.7 },
                    "numeric_mkqfs5t6": { "number": 13 },
                    "numeric_mkqfs7n9": { "number": 7 },
                    "status5__1": { "label": "SCANNED OUT" }
                }
            },
            {
                id: "2085290874",
                name: "Test Storage Item 10",
                column_values: {
                    "name": { "text": "Test Storage Item 10" },
                    "date__1": { "date": "2025-07-01" },
                    "date0__1": { "date": "2025-08-04" },
                    "numbers5__1": { "number": 4.5 },
                    "numeric_mkqfs5t6": { "number": 13 },
                    "numeric_mkqfs7n9": { "number": 7 },
                    "status5__1": { "label": "SCANNED OUT" }
                }
            },
            {
                id: "2085290168",
                name: "Test Storage Item 8",
                column_values: {
                    "name": { "text": "Test Storage Item 8" },
                    "date__1": { "date": "2025-07-01" },
                    "date0__1": { "date": "2025-08-04" },
                    "numbers5__1": { "number": 1.5 },
                    "numeric_mkqfs5t6": { "number": 16 },
                    "numeric_mkqfs7n9": { "number": 7 },
                    "status5__1": { "label": "SCANNED OUT" }
                }
            },
            {
                id: "2085291257",
                name: "Test Storage Item 14",
                column_values: {
                    "name": { "text": "Test Storage Item 14" },
                    "date__1": { "date": "2025-07-01" },
                    "date0__1": { "date": "2025-08-04" },
                    "numbers5__1": { "number": 2.8 },
                    "numeric_mkqfs5t6": { "number": 12 },
                    "numeric_mkqfs7n9": { "number": 7 },
                    "status5__1": { "label": "SCANNED OUT" }
                }
            },
            {
                id: "2085289903",
                name: "Test Storage Item 4",
                column_values: {
                    "name": { "text": "Test Storage Item 4" },
                    "date__1": { "date": "2025-07-01" },
                    "date0__1": { "date": "2025-08-04" },
                    "numbers5__1": { "number": 3.0 },
                    "numeric_mkqfs5t6": { "number": 15 },
                    "numeric_mkqfs7n9": { "number": 7 },
                    "status5__1": { "label": "SCANNED OUT" }
                }
            },
            {
                id: "2085291106",
                name: "Test Storage Item 12",
                column_values: {
                    "name": { "text": "Test Storage Item 12" },
                    "date__1": { "date": "2025-07-01" },
                    "date0__1": { "date": "2025-08-04" },
                    "numbers5__1": { "number": 3.8 },
                    "numeric_mkqfs5t6": { "number": 9 },
                    "numeric_mkqfs7n9": { "number": 7 },
                    "status5__1": { "label": "SCANNED OUT" }
                }
            },
            {
                id: "2085291390",
                name: "Test Storage Item 16",
                column_values: {
                    "name": { "text": "Test Storage Item 16" },
                    "date__1": { "date": "2025-07-01" },
                    "date0__1": { "date": "2025-08-04" },
                    "numbers5__1": { "number": 4.0 },
                    "numeric_mkqfs5t6": { "number": 11 },
                    "numeric_mkqfs7n9": { "number": 7 },
                    "status5__1": { "label": "SCANNED OUT" }
                }
            },
            {
                id: "2085291525",
                name: "Test Storage Item 18",
                column_values: {
                    "name": { "text": "Test Storage Item 18" },
                    "date__1": { "date": "2025-07-01" },
                    "date0__1": { "date": "2025-08-04" },
                    "numbers5__1": { "number": 5.8 },
                    "numeric_mkqfs5t6": { "number": 16 },
                    "numeric_mkqfs7n9": { "number": 7 },
                    "status5__1": { "label": "SCANNED OUT" }
                }
            },
            {
                id: "2085291675",
                name: "Test Storage Item 20",
                column_values: {
                    "name": { "text": "Test Storage Item 20" },
                    "date__1": { "date": "2025-07-01" },
                    "date0__1": { "date": "2025-08-04" },
                    "numbers5__1": { "number": 7.5 },
                    "numeric_mkqfs5t6": { "number": 18 },
                    "numeric_mkqfs7n9": { "number": 7 },
                    "status5__1": { "label": "SCANNED OUT" }
                }
            }
        ]
    }
};

async function calculateRealDataBilling() {
    try {
        console.log('🧪 Calculating Storage Billing for July 2025 with Real Data\n');
        console.log('📊 Data Source: Monday.com Board ID 1953505209');
        console.log('📅 Target Month: July 2025\n');
        
        // Calculate billing for July 2025 (month 6, year 2025)
        console.log('📅 Calculating Monthly Billing for July 2025:');
        const julyResults = processItemsForMonth(realMCPResponse.data.items, 6, 2025); // July = 6
        displayMonthlyBillingResults(julyResults, 6, 2025);
        
        // Calculate total billing (all time)
        console.log('\n📊 Calculating Total Billing (All Time):');
        const totalResults = processItemsForTotalBilling(realMCPResponse.data.items);
        displayTotalBillingResults(totalResults);
        
        console.log('\n✅ Real data billing calculation completed successfully!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Run the calculation
calculateRealDataBilling(); 