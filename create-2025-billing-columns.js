const mondayService = require('./services/mondayService');
const moment = require('moment');

const BOARD_ID = '1953505209';

class MonthlyBillingColumnCreator {
    constructor() {
        this.boardId = BOARD_ID;
    }

    // Create all 12 monthly billing columns for 2025
    async createMonthlyBillingColumns2025() {
        try {
            console.log(`📅 Creating monthly billing columns for 2025 on board ${this.boardId}`);
            
            const createdColumns = [];
            
            for (let month = 0; month < 12; month++) {
                const date = moment('2025-01-01').add(month, 'months');
                const monthName = date.format('MMMM');
                const year = date.format('YYYY');
                
                const columnTitle = `${monthName} ${year} Billing`;
                const columnId = `billing_${year}_${(month + 1).toString().padStart(2, '0')}`;
                
                console.log(`📊 Creating column: ${columnTitle}`);
                
                try {
                    const column = {
                        title: columnTitle,
                        type: 'numbers',
                        settings: {
                            currency: 'GBP',
                            precision: 2,
                            symbol: '£'
                        }
                    };
                    
                    const createdColumn = await mondayService.createColumn(this.boardId, column);
                    createdColumns.push({
                        title: columnTitle,
                        id: createdColumn.id,
                        month: month + 1,
                        year: 2025
                    });
                    
                    console.log(`✅ Created column: ${columnTitle} (ID: ${createdColumn.id})`);
                    
                    // Small delay to avoid API rate limits
                    await this.delay(500);
                    
                } catch (error) {
                    console.error(`❌ Error creating column ${columnTitle}:`, error.message);
                    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
                        console.log(`ℹ️ Column ${columnTitle} already exists, skipping...`);
                    }
                }
            }
            
            console.log(`\n✅ Created ${createdColumns.length} billing columns for 2025:`);
            createdColumns.forEach(col => {
                console.log(`   • ${col.title} (ID: ${col.id})`);
            });
            
            return createdColumns;
            
        } catch (error) {
            console.error('❌ Error creating 2025 billing columns:', error);
            throw error;
        }
    }

    // Get current board structure to verify existing columns
    async analyzeBoardStructure() {
        try {
            console.log(`🔍 Analyzing board structure for board ${this.boardId}`);
            
            const columns = await mondayService.getBoardColumns(this.boardId);
            
            console.log(`\n📋 Current Board Structure (${columns.length} columns):`);
            console.log('=' .repeat(60));
            
            // Group columns by type
            const columnsByType = {};
            columns.forEach(col => {
                if (!columnsByType[col.type]) {
                    columnsByType[col.type] = [];
                }
                columnsByType[col.type].push(col);
            });
            
            // Display columns by type
            Object.keys(columnsByType).forEach(type => {
                console.log(`\n📊 ${type.toUpperCase()} columns (${columnsByType[type].length}):`);
                columnsByType[type].forEach(col => {
                    console.log(`   • ${col.title} (ID: ${col.id})`);
                });
            });
            
            // Check for existing billing columns
            const existingBillingColumns = columns.filter(col => 
                col.title.toLowerCase().includes('billing') && 
                col.title.includes('2025')
            );
            
            console.log(`\n💰 Existing 2025 Billing Columns (${existingBillingColumns.length}):`);
            if (existingBillingColumns.length > 0) {
                existingBillingColumns.forEach(col => {
                    console.log(`   • ${col.title} (ID: ${col.id})`);
                });
            } else {
                console.log('   None found - ready to create new billing columns');
            }
            
            return {
                totalColumns: columns.length,
                columnsByType,
                existingBillingColumns
            };
            
        } catch (error) {
            console.error('❌ Error analyzing board structure:', error);
            throw error;
        }
    }

    // Populate July 2025 billing data for existing items
    async populateJuly2025BillingData() {
        try {
            console.log(`💰 Populating July 2025 billing data for board ${this.boardId}`);
            
            // Get July 2025 billing column ID
            const julyColumnId = await mondayService.getColumnIdByTitle(this.boardId, 'July 2025 Billing');
            
            if (!julyColumnId) {
                console.error('❌ July 2025 Billing column not found. Please create monthly columns first.');
                return;
            }
            
            console.log(`📊 Found July 2025 Billing column (ID: ${julyColumnId})`);
            
            // Get all board items
            const items = await mondayService.getBoardItems(this.boardId);
            console.log(`📋 Found ${items.length} items to process`);
            
            let updatedCount = 0;
            let totalBilling = 0;
            
            for (const item of items) {
                try {
                    const itemData = mondayService.extractItemData(item);
                    
                    // Extract required data for billing calculation
                    const dateReceived = mondayService.parseDateFromColumn(itemData.columnValues['date__1']);
                    const freeDays = mondayService.parseNumberFromColumn(itemData.columnValues['numeric_mkqfs7n9']);
                    const cbm = mondayService.parseNumberFromColumn(itemData.columnValues['numbers5__1']);
                    const rate = mondayService.parseNumberFromColumn(itemData.columnValues['numeric_mkqfs5t6']);
                    
                    if (dateReceived && cbm && rate !== null) {
                        // Calculate July 2025 billing
                        const july2025Billing = this.calculateJuly2025Billing(dateReceived, freeDays, cbm, rate);
                        
                        if (july2025Billing > 0) {
                            // Update the July 2025 Billing column
                            await mondayService.updateItemColumnValue(item.id, julyColumnId, july2025Billing);
                            
                            console.log(`✅ Updated ${item.name}: £${july2025Billing.toFixed(2)}`);
                            updatedCount++;
                            totalBilling += july2025Billing;
                        } else {
                            console.log(`ℹ️ ${item.name}: No billing for July 2025 (£0.00)`);
                        }
                    } else {
                        console.log(`⚠️ Skipping ${item.name}: Missing required data`);
                    }
                    
                    // Small delay to avoid API rate limits
                    await this.delay(200);
                    
                } catch (error) {
                    console.error(`❌ Error processing item ${item.name}:`, error.message);
                }
            }
            
            console.log(`\n✅ July 2025 Billing Summary:`);
            console.log(`   • Items updated: ${updatedCount}`);
            console.log(`   • Total July 2025 billing: £${totalBilling.toFixed(2)}`);
            
            return {
                itemsUpdated: updatedCount,
                totalBilling: totalBilling
            };
            
        } catch (error) {
            console.error('❌ Error populating July 2025 billing data:', error);
            throw error;
        }
    }

    // Calculate July 2025 billing for a single item
    calculateJuly2025Billing(dateReceived, freeDays = 0, cbm, rate) {
        try {
            // Convert date received to moment
            const receivedDate = moment(dateReceived);
            
            // Calculate bill date (date received + free days)
            const billDate = receivedDate.clone().add(freeDays, 'days');
            
            // July 2025 period
            const julyStart = moment('2025-07-01');
            const julyEnd = moment('2025-07-31');
            
            // Determine billing start date (later of bill date or July 1)
            const billingStart = moment.max(billDate, julyStart);
            
            // If billing starts after July ends, no billing for July
            if (billingStart.isAfter(julyEnd)) {
                return 0;
            }
            
            // Calculate billable days in July
            const billableDays = julyEnd.diff(billingStart, 'days') + 1;
            
            // Calculate July billing
            const julyBilling = rate * cbm * billableDays;
            
            console.log(`📊 ${dateReceived.toISOString().split('T')[0]} + ${freeDays} days = ${billDate.format('YYYY-MM-DD')} | July billable days: ${billableDays} | £${rate} × ${cbm} × ${billableDays} = £${julyBilling.toFixed(2)}`);
            
            return julyBilling;
            
        } catch (error) {
            console.error('❌ Error calculating July 2025 billing:', error);
            return 0;
        }
    }

    // Utility function for delays
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Main execution function
    async run() {
        try {
            console.log('🚀 Starting 2025 Monthly Billing Column Setup');
            console.log('=' .repeat(60));
            
            // Step 1: Analyze current board structure
            console.log('\n📋 Step 1: Analyzing board structure...');
            const boardAnalysis = await this.analyzeBoardStructure();
            
            // Step 2: Create 2025 billing columns if they don't exist
            console.log('\n📅 Step 2: Creating 2025 monthly billing columns...');
            const createdColumns = await this.createMonthlyBillingColumns2025();
            
            // Step 3: Populate July 2025 data
            console.log('\n💰 Step 3: Populating July 2025 billing data...');
            const julyResults = await this.populateJuly2025BillingData();
            
            console.log('\n🎉 Setup Complete!');
            console.log('=' .repeat(60));
            console.log(`✅ Board ${this.boardId} is now ready with 2025 billing columns`);
            console.log(`✅ July 2025 historical data populated: £${julyResults.totalBilling.toFixed(2)}`);
            
        } catch (error) {
            console.error('❌ Setup failed:', error);
            process.exit(1);
        }
    }
}

// Execute if run directly
if (require.main === module) {
    const creator = new MonthlyBillingColumnCreator();
    creator.run();
}

module.exports = MonthlyBillingColumnCreator;