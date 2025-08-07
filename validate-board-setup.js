const mondayService = require('./services/mondayService');
const moment = require('moment');

const BOARD_ID = '1953505209';

class BoardValidator {
    constructor() {
        this.boardId = BOARD_ID;
    }

    // Comprehensive board validation
    async validateBoardSetup() {
        try {
            console.log('🔍 Validating Monday.com Board Setup');
            console.log('=' .repeat(60));
            console.log(`📋 Board ID: ${this.boardId}`);
            
            // Get board columns and items
            const [columns, items] = await Promise.all([
                mondayService.getBoardColumns(this.boardId),
                mondayService.getBoardItems(this.boardId)
            ]);
            
            console.log(`📊 Found ${columns.length} columns and ${items.length} items`);
            
            // Validate required columns
            const validationResults = {
                columns: this.validateRequiredColumns(columns),
                items: this.validateItemData(items),
                billing: this.validateBillingColumns(columns)
            };
            
            this.printValidationReport(validationResults);
            
            return validationResults;
            
        } catch (error) {
            console.error('❌ Board validation failed:', error);
            throw error;
        }
    }

    // Validate required columns exist
    validateRequiredColumns(columns) {
        const requiredColumns = [
            { title: 'Date Received', type: 'date', id: 'date__1' },
            { title: 'Free Days', type: 'numbers', id: 'numeric_mkqfs7n9' },
            { title: 'CBM', type: 'numbers', id: 'numbers5__1' },
            { title: 'Rate', type: 'numbers', id: 'numeric_mkqfs5t6' },
            { title: 'Date Out', type: 'date', id: 'date0__1' }
        ];
        
        const results = [];
        
        requiredColumns.forEach(required => {
            const found = columns.find(col => 
                col.id === required.id || col.title === required.title
            );
            
            results.push({
                name: required.title,
                required: true,
                found: !!found,
                type: found ? found.type : 'missing',
                id: found ? found.id : 'missing'
            });
        });
        
        return results;
    }

    // Validate billing-specific columns
    validateBillingColumns(columns) {
        const billingColumns = columns.filter(col => 
            col.title.toLowerCase().includes('billing') ||
            col.title.toLowerCase().includes('formula')
        );
        
        const monthlyBillingColumns = columns.filter(col => 
            col.title.includes('2025') && col.title.includes('Billing')
        );
        
        // Check for 2025 monthly columns
        const months2025 = [];
        for (let i = 1; i <= 12; i++) {
            const monthName = moment().month(i - 1).format('MMMM');
            const columnTitle = `${monthName} 2025 Billing`;
            const found = columns.find(col => col.title === columnTitle);
            
            months2025.push({
                month: monthName,
                title: columnTitle,
                found: !!found,
                id: found ? found.id : null
            });
        }
        
        return {
            totalBillingColumns: billingColumns.length,
            monthlyBillingColumns: monthlyBillingColumns.length,
            billingColumns,
            months2025
        };
    }

    // Validate item data completeness
    validateItemData(items) {
        const results = {
            totalItems: items.length,
            itemsWithData: 0,
            itemsReady: 0,
            dataCompleteness: []
        };
        
        items.forEach(item => {
            const itemData = mondayService.extractItemData(item);
            
            const dateReceived = mondayService.parseDateFromColumn(itemData.columnValues['date__1']);
            const freeDays = mondayService.parseNumberFromColumn(itemData.columnValues['numeric_mkqfs7n9']);
            const cbm = mondayService.parseNumberFromColumn(itemData.columnValues['numbers5__1']);
            const rate = mondayService.parseNumberFromColumn(itemData.columnValues['numeric_mkqfs5t6']);
            
            const hasData = !!(dateReceived || cbm || rate !== null);
            const isReady = !!(dateReceived && cbm && rate !== null);
            
            if (hasData) results.itemsWithData++;
            if (isReady) results.itemsReady++;
            
            results.dataCompleteness.push({
                id: item.id,
                name: item.name,
                dateReceived: !!dateReceived,
                freeDays: freeDays !== null,
                cbm: !!cbm,
                rate: rate !== null,
                isReady
            });
        });
        
        return results;
    }

    // Print comprehensive validation report
    printValidationReport(results) {
        console.log('\n📋 BOARD VALIDATION REPORT');
        console.log('=' .repeat(60));
        
        // Required Columns Report
        console.log('\n📊 Required Columns:');
        results.columns.forEach(col => {
            const status = col.found ? '✅' : '❌';
            console.log(`   ${status} ${col.name} (${col.type}) - ID: ${col.id}`);
        });
        
        const missingRequired = results.columns.filter(col => !col.found);
        if (missingRequired.length > 0) {
            console.log(`\n⚠️ Missing ${missingRequired.length} required columns!`);
        } else {
            console.log('\n✅ All required columns found');
        }
        
        // Billing Columns Report
        console.log('\n💰 Billing Columns:');
        console.log(`   📊 Total billing columns: ${results.billing.totalBillingColumns}`);
        console.log(`   📅 Monthly 2025 columns: ${results.billing.monthlyBillingColumns}`);
        
        console.log('\n📅 2025 Monthly Billing Columns:');
        results.billing.months2025.forEach(month => {
            const status = month.found ? '✅' : '❌';
            console.log(`   ${status} ${month.title} ${month.id ? `(${month.id})` : ''}`);
        });
        
        const missing2025 = results.billing.months2025.filter(m => !m.found);
        if (missing2025.length > 0) {
            console.log(`\n⚠️ Missing ${missing2025.length} monthly 2025 billing columns`);
        } else {
            console.log('\n✅ All 12 monthly 2025 billing columns found');
        }
        
        // Item Data Report
        console.log('\n📋 Item Data Completeness:');
        console.log(`   📊 Total items: ${results.items.totalItems}`);
        console.log(`   📝 Items with data: ${results.items.itemsWithData}`);
        console.log(`   ✅ Items ready for billing: ${results.items.itemsReady}`);
        
        if (results.items.totalItems > 0) {
            const completenessPercent = (results.items.itemsReady / results.items.totalItems * 100).toFixed(1);
            console.log(`   📈 Readiness: ${completenessPercent}%`);
        }
        
        // Detailed Item Analysis
        console.log('\n📋 Individual Item Status:');
        results.items.dataCompleteness.forEach(item => {
            const status = item.isReady ? '✅' : '⚠️';
            const missing = [];
            if (!item.dateReceived) missing.push('Date Received');
            if (!item.cbm) missing.push('CBM');
            if (!item.rate) missing.push('Rate');
            
            const missingStr = missing.length > 0 ? ` (Missing: ${missing.join(', ')})` : '';
            console.log(`   ${status} ${item.name}${missingStr}`);
        });
        
        // Overall Status
        console.log('\n🎯 OVERALL STATUS');
        console.log('=' .repeat(60));
        
        const allRequired = results.columns.every(col => col.found);
        const allMonthly = results.billing.months2025.every(m => m.found);
        const hasItems = results.items.itemsReady > 0;
        
        if (allRequired && allMonthly && hasItems) {
            console.log('✅ BOARD IS READY FOR BILLING OPERATIONS');
        } else {
            console.log('⚠️ BOARD NEEDS SETUP:');
            if (!allRequired) console.log('   • Missing required columns');
            if (!allMonthly) console.log('   • Missing 2025 monthly billing columns');
            if (!hasItems) console.log('   • No items ready for billing');
        }
    }

    // Quick board structure summary
    async getQuickSummary() {
        try {
            const [columns, items] = await Promise.all([
                mondayService.getBoardColumns(this.boardId),
                mondayService.getBoardItems(this.boardId)
            ]);
            
            const billingColumns = columns.filter(col => 
                col.title.includes('2025') && col.title.includes('Billing')
            );
            
            const readyItems = items.filter(item => {
                const itemData = mondayService.extractItemData(item);
                const dateReceived = mondayService.parseDateFromColumn(itemData.columnValues['date__1']);
                const cbm = mondayService.parseNumberFromColumn(itemData.columnValues['numbers5__1']);
                const rate = mondayService.parseNumberFromColumn(itemData.columnValues['numeric_mkqfs5t6']);
                return dateReceived && cbm && rate !== null;
            });
            
            return {
                boardId: this.boardId,
                totalColumns: columns.length,
                billingColumns: billingColumns.length,
                totalItems: items.length,
                readyItems: readyItems.length,
                readyForBilling: billingColumns.length === 12 && readyItems.length > 0
            };
            
        } catch (error) {
            console.error('❌ Error getting board summary:', error);
            throw error;
        }
    }
}

// Execute if run directly
if (require.main === module) {
    const validator = new BoardValidator();
    validator.validateBoardSetup()
        .then(() => {
            console.log('\n✅ Board validation complete');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Board validation failed:', error);
            process.exit(1);
        });
}

module.exports = BoardValidator;