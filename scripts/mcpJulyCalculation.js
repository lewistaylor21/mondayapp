require('dotenv').config();
const mondaySdk = require('monday-sdk-js');

const BOARD_ID = '1953505209';
const monday = mondaySdk();
monday.setToken(process.env.MONDAY_API_TOKEN);

async function calculateJuly2025UsingMCP() {
    console.log('🔄 Starting July 2025 billing calculation using MCP...');
    console.log('=' .repeat(60));
    console.log(`📋 Board ID: ${BOARD_ID}`);
    
    try {
        // Get board data directly
        console.log('📊 Fetching board data...');
        console.log('🔑 API Token:', process.env.MONDAY_API_TOKEN ? 'Set' : 'Missing');
        
        const query = `
            query GetBoardData($boardId: [ID!]!) {
                boards(ids: $boardId) {
                    id
                    name
                    columns {
                        id
                        title
                        type
                    }
                    items_page(limit: 100) {
                        items {
                            id
                            name
                            column_values {
                                id
                                value
                                text
                                type
                            }
                        }
                    }
                }
            }
        `;
        
        const response = await monday.api(query, { 
            variables: { boardId: [BOARD_ID] }
        });
        
        // console.log('📦 API Response:', JSON.stringify(response, null, 2));
        
        if (response.errors) {
            console.error('❌ GraphQL Errors:', response.errors);
            throw new Error(response.errors[0].message);
        }
        
        if (!response.data || !response.data.boards || !response.data.boards[0]) {
            console.error('❌ No board data received');
            throw new Error('Board not found');
        }
        
        const board = response.data.boards[0];
        const columns = board.columns;
        const items = board.items_page.items;
        
        console.log(`✅ Found ${columns.length} columns and ${items.length} items`);
        
        // Find July 2025 column
        const julyColumn = columns.find(col => 
            col.title === 'Jul 2025 Billing' || 
            col.title === 'July 2025 Billing'
        );
        
        if (!julyColumn) {
            console.error('❌ July 2025 Billing column not found');
            console.log('Available billing columns:');
            columns.filter(c => c.title.includes('Billing')).forEach(c => 
                console.log(`   - ${c.title} (${c.id})`)
            );
            return;
        }
        
        console.log(`✅ Found July column: ${julyColumn.title} (${julyColumn.id})`);
        
        // Process each item
        const updates = [];
        const skipped = [];
        
        for (const item of items) {
            console.log(`\n--- Processing: ${item.name} ---`);
            
            // Helper function to get column value
            const getColumnValue = (columnId) => {
                const columnValue = item.column_values?.find(cv => cv.id === columnId);
                return columnValue ? (columnValue.text || columnValue.value || '') : '';
            };
            
            // Helper function to parse date from column value
            const parseDate = (value) => {
                if (!value || value === '' || value === '""' || value === 'null') return null;
                const cleanValue = value.replace(/"/g, '');
                const date = new Date(cleanValue);
                return isNaN(date.getTime()) ? null : date;
            };
            
            // Helper function to parse number from column value
            const parseNumber = (value) => {
                if (!value || value === '' || value === '""' || value === 'null') return null;
                const cleanValue = value.replace(/"/g, '');
                const num = parseFloat(cleanValue);
                return isNaN(num) ? null : num;
            };
            
            // Get required data
            const dateReceived = parseDate(getColumnValue('date__1'));
            const freeDays = parseNumber(getColumnValue('numeric_mkqfs7n9')) || 0;
            const rate = parseNumber(getColumnValue('numeric_mkqfs5t6'));
            const cbm = parseNumber(getColumnValue('numbers5__1'));
            const scanOutDate = parseDate(getColumnValue('date0__1'));
            
            console.log(`Data: Date=${dateReceived}, Free=${freeDays}, Rate=${rate}, CBM=${cbm}, ScanOut=${scanOutDate}`);
            
            if (!dateReceived || !rate || !cbm) {
                console.log('⚠️ Skipping - missing required data');
                skipped.push(item.name);
                continue;
            }
            
            // Calculate bill start date
            const billStartDate = new Date(dateReceived);
            billStartDate.setDate(billStartDate.getDate() + freeDays);
            
            // July 2025 period
            const julyStart = new Date(2025, 6, 1); // July 1, 2025
            const julyEnd = new Date(2025, 6, 31);   // July 31, 2025
            
            // Calculate effective period
            let effectiveStart = billStartDate > julyStart ? billStartDate : julyStart;
            let effectiveEnd = julyEnd;
            
            // Check scan out date
            if (scanOutDate && scanOutDate < julyEnd) {
                effectiveEnd = scanOutDate;
                console.log(`📤 Item scanned out: ${scanOutDate.toDateString()}`);
            }
            
            // Skip if not active in July
            if (effectiveStart > julyEnd) {
                console.log('⏭️ Skipping - started after July');
                skipped.push(item.name);
                continue;
            }
            
            if (scanOutDate && scanOutDate < julyStart) {
                console.log('⏭️ Skipping - scanned out before July');
                skipped.push(item.name);
                continue;
            }
            
            // Calculate billing
            const daysDiff = Math.max(0, Math.ceil((effectiveEnd - effectiveStart) / (1000 * 3600 * 24)) + 1);
            const julyBilling = daysDiff * rate * cbm;
            
            console.log(`💰 July billing: ${daysDiff} days × £${rate} × ${cbm} CBM = £${julyBilling.toFixed(2)}`);
            
            updates.push({
                itemId: item.id,
                itemName: item.name,
                amount: julyBilling.toFixed(2)
            });
        }
        
        console.log('\n' + '=' .repeat(60));
        console.log(`📊 Summary: ${updates.length} items to update, ${skipped.length} skipped`);
        
        if (updates.length === 0) {
            console.log('⚠️ No items to update');
            return;
        }
        
        // Update Monday.com columns
        console.log('\n🔄 Updating Monday.com board...');
        
        for (const update of updates) {
            try {
                const mutation = `
                    mutation ChangeColumnValue($boardId: ID!, $itemId: ID!, $columnId: String!, $value: JSON!) {
                        change_column_value(
                            board_id: $boardId,
                            item_id: $itemId,
                            column_id: $columnId,
                            value: $value
                        ) {
                            id
                        }
                    }
                `;
                
                await monday.api(mutation, {
                    variables: {
                        boardId: BOARD_ID,
                        itemId: update.itemId,
                        columnId: julyColumn.id,
                        value: update.amount
                    }
                });
                
                console.log(`✅ Updated ${update.itemName}: £${update.amount}`);
            } catch (error) {
                console.error(`❌ Failed to update ${update.itemName}:`, error.message);
            }
        }
        
        console.log('\n✅ July 2025 calculation complete!');
        
    } catch (error) {
        console.error('❌ Error calculating July 2025 billing:', error);
        throw error;
    }
}

// Run if executed directly
if (require.main === module) {
    calculateJuly2025UsingMCP()
        .then(() => {
            console.log('\n🎉 MCP July calculation finished successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 MCP July calculation failed:', error);
            process.exit(1);
        });
}

module.exports = { calculateJuly2025UsingMCP };