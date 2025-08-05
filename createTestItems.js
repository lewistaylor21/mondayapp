// Script to create test items in Monday.com board using MCP tools
// This script will create 50 test storage items with varied data

const BOARD_ID = 1953505209;

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
        // Generate random billing start date
        const billingStartDate = getRandomDate(startDate, endDate);
        
        // Generate random scan out date (50% chance of having one)
        const hasScanOut = Math.random() > 0.5;
        const scanOutDate = hasScanOut ? getRandomDate(billingStartDate, endDate) : null;
        
        // Generate random CBM and rate
        const cbm = CBM_VALUES[Math.floor(Math.random() * CBM_VALUES.length)];
        const rate = RATE_VALUES[Math.floor(Math.random() * RATE_VALUES.length)];
        
        // Generate random customer name
        const customerName = CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)];
        
        items.push({
            itemName: `Test Storage Item ${i}`,
            columnValues: {
                'billing_start_date': { 'date': formatDate(billingStartDate) },
                'scan_out_date': scanOutDate ? { 'date': formatDate(scanOutDate) } : null,
                'cbm': { 'number': cbm },
                'rate': { 'number': rate },
                'customer_name': { 'text': customerName }
            }
        });
    }
    
    return items;
}

// Main function to create test items
async function createTestItems() {
    try {
        console.log('🚀 Creating 50 Test Storage Items in Monday.com Board\n');
        console.log(`Board ID: ${BOARD_ID}`);
        console.log('This will create test items with varied data for testing the storage billing calculator.\n');
        
        // Generate test items
        const testItems = generateTestItems(50);
        
        console.log('📋 Test Items to be Created:');
        testItems.forEach((item, index) => {
            console.log(`${index + 1}. ${item.itemName}`);
            console.log(`   Customer: ${item.columnValues.customer_name.text}`);
            console.log(`   Billing Start: ${item.columnValues.billing_start_date.date}`);
            console.log(`   Scan Out: ${item.columnValues.scan_out_date ? item.columnValues.scan_out_date.date : 'Active'}`);
            console.log(`   CBM: ${item.columnValues.cbm.number}`);
            console.log(`   Rate: $${item.columnValues.rate.number}/day`);
            console.log('');
        });
        
        console.log('🔧 MCP Tool Calls:');
        console.log('Copy and paste these calls into your MCP-enabled environment:\n');
        
        testItems.forEach((item, index) => {
            console.log(`// Create item ${index + 1}: ${item.itemName}`);
            console.log(`await mcp_monday_api_mcp_hosted_create_item({`);
            console.log(`  boardId: ${BOARD_ID},`);
            console.log(`  itemName: "${item.itemName}",`);
            console.log(`  columnValues: JSON.stringify(${JSON.stringify(item.columnValues, null, 2)})`);
            console.log(`});`);
            console.log('');
        });
        
        console.log('✅ Test items generation complete!');
        console.log('\n📝 Next Steps:');
        console.log('1. Copy the MCP tool calls above');
        console.log('2. Paste them into your MCP-enabled environment (like Cursor with MCP)');
        console.log('3. Execute the calls to create the test items');
        console.log('4. Test the storage billing calculator with the generated data');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Export functions
module.exports = {
    generateTestItems,
    createTestItems
};

// Run the script if called directly
if (require.main === module) {
    createTestItems();
} 