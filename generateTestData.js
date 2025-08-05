// Test Data Generator for Monday.com Storage Billing Calculator
// This script generates 50 test items with varied data

const BOARD_ID = 1953505209; // Your actual board ID

// Sample customer names
const CUSTOMER_NAMES = [
    'ABC Company', 'XYZ Corp', 'Storage Solutions Inc', 'Warehouse Pro', 'Logistics Plus',
    'Global Storage', 'Quick Store', 'Safe Storage Co', 'Premium Warehousing', 'Express Storage',
    'Mega Storage', 'City Storage', 'Industrial Storage', 'Commercial Storage', 'Retail Storage',
    'Office Storage', 'Home Storage', 'Business Storage', 'Professional Storage', 'Enterprise Storage'
];

// Sample CBM values (cubic meters)
const CBM_VALUES = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0];

// Sample daily rates per CBM
const RATE_VALUES = [8.00, 9.00, 10.00, 11.00, 12.00, 13.00, 14.00, 15.00, 16.00, 17.00, 18.00, 19.00, 20.00];

// Sample free days
const FREE_DAYS_VALUES = [0, 1, 2, 3, 5, 7, 10, 14];

// Generate random date between start and end
function getRandomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Format date as YYYY-MM-DD
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

// Generate test items
function generateTestItems(count = 50) {
    const items = [];
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-12-31');
    
    for (let i = 1; i <= count; i++) {
        // Generate random date received
        const dateReceived = getRandomDate(startDate, endDate);
        
        // Generate random free days
        const freeDays = FREE_DAYS_VALUES[Math.floor(Math.random() * FREE_DAYS_VALUES.length)];
        
        // Generate random scan out date (50% chance of having one)
        const hasScanOut = Math.random() > 0.5;
        const scanOutDate = hasScanOut ? getRandomDate(dateReceived, endDate) : null;
        
        // Generate random CBM and rate
        const cbm = CBM_VALUES[Math.floor(Math.random() * CBM_VALUES.length)];
        const rate = RATE_VALUES[Math.floor(Math.random() * RATE_VALUES.length)];
        
        // Generate random customer name
        const customerName = CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)];
        
        items.push({
            itemName: `Test Storage Item ${i}`,
            columnValues: {
                'name': customerName,
                'date__1': { 'date': formatDate(dateReceived) },
                'date0__1': scanOutDate ? { 'date': formatDate(scanOutDate) } : null,
                'numbers5__1': { 'number': cbm },
                'numeric_mkqfs5t6': { 'number': rate },
                'numeric_mkqfs7n9': { 'number': freeDays },
                'status5__1': hasScanOut ? { 'label': 'SCANNED OUT' } : null
            }
        });
    }
    
    return items;
}

// Display test items
function displayTestItems(items) {
    console.log(`📦 Generated ${items.length} Test Storage Items for Board ID: ${BOARD_ID}\n`);
    
    items.forEach((item, index) => {
        console.log(`${index + 1}. ${item.itemName}`);
        console.log(`   Customer: ${item.columnValues.name}`);
        console.log(`   Date Received: ${item.columnValues.date__1.date}`);
        console.log(`   Scan Out: ${item.columnValues.date0__1 ? item.columnValues.date0__1.date : 'Active'}`);
        console.log(`   CBM: ${item.columnValues.numbers5__1.number}`);
        console.log(`   Rate: $${item.columnValues.numeric_mkqfs5t6.number}/day`);
        console.log(`   Free Days: ${item.columnValues.numeric_mkqfs7n9.number}`);
        console.log(`   Status: ${item.columnValues.status5__1 ? item.columnValues.status5__1.label : 'Active'}`);
        console.log('');
    });
}

// Generate MCP tool calls
function generateMCPCalls(items) {
    console.log('🔧 MCP Tool Calls to Create Test Items:\n');
    
    items.forEach((item, index) => {
        console.log(`// Create item ${index + 1}: ${item.itemName}`);
        console.log(`await mcp_monday_api_mcp_hosted_create_item({`);
        console.log(`  boardId: ${BOARD_ID},`);
        console.log(`  itemName: "${item.itemName}",`);
        console.log(`  columnValues: JSON.stringify(${JSON.stringify(item.columnValues, null, 2)})`);
        console.log(`});`);
        console.log('');
    });
}

// Generate sample data for testing
function generateSampleData() {
    console.log('📊 Sample Test Data for Storage Billing Calculator\n');
    
    const sampleItems = [
        {
            id: 1,
            name: "Test Storage Item 1",
            column_values: {
                "billing_start_date": { "date": "2024-01-15" },
                "scan_out_date": { "date": "2024-02-20" },
                "cbm": { "number": 2.5 },
                "rate": { "number": 10.00 },
                "customer_name": { "text": "ABC Company" }
            }
        },
        {
            id: 2,
            name: "Test Storage Item 2",
            column_values: {
                "billing_start_date": { "date": "2024-02-01" },
                "scan_out_date": null,
                "cbm": { "number": 1.8 },
                "rate": { "number": 12.00 },
                "customer_name": { "text": "XYZ Corp" }
            }
        },
        {
            id: 3,
            name: "Test Storage Item 3",
            column_values: {
                "billing_start_date": { "date": "2024-01-01" },
                "scan_out_date": { "date": "2024-03-15" },
                "cbm": { "number": 4.2 },
                "rate": { "number": 8.50 },
                "customer_name": { "text": "Storage Solutions Inc" }
            }
        }
    ];
    
    console.log('Sample MCP Response Structure:');
    console.log(JSON.stringify({ data: { items: sampleItems } }, null, 2));
}

// Main function
function main() {
    try {
        console.log('🚀 Monday.com Storage Billing Test Data Generator\n');
        console.log(`Board ID: ${BOARD_ID}`);
        console.log('Generating 50 test items with varied data...\n');
        
        // Generate test items
        const testItems = generateTestItems(50);
        
        // Display test items
        displayTestItems(testItems);
        
        // Generate MCP calls
        generateMCPCalls(testItems);
        
        // Generate sample data
        generateSampleData();
        
        console.log('✅ Test data generation complete!');
        console.log('\n📝 Next Steps:');
        console.log('1. Use the MCP tool calls above to create items in your Monday.com board');
        console.log('2. Update the BOARD_ID in storageBillingCalculator.js to match your board');
        console.log('3. Update the COLUMN_IDS to match your actual column IDs');
        console.log('4. Test the storage billing calculator with the generated data');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Export functions
module.exports = {
    generateTestItems,
    displayTestItems,
    generateMCPCalls,
    generateSampleData
};

// Run the script if called directly
if (require.main === module) {
    main();
} 