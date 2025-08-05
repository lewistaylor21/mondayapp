const mondayService = require('./mondayService');
const moment = require('moment');

class BillingService {
    constructor() {
        this.columnMappings = {
            CUSTOMER_NAME: 'Customer Name',
            DATE_RECEIVED: 'Date Received',
            FREE_DAYS: 'Free Days',
            CBM: 'CBM',
            RATE: 'Rate per CBM/Day',
            DATE_OUT: 'Date Out',
            STATUS: 'Status',
            CUSTOMER_EMAIL: 'Customer Email',
            BILL_DATE: 'Bill Date',
            BILLING_START_DATE: 'Billing Start Date',
            TOTAL_BILLABLE_DAYS: 'Total Billable Days',
            CURRENT_MONTH_BILLING: 'Current Month Billing'
        };
    }

    // Calculate billing start date using formula: date received + free days
    calculateBillingStartDate(dateReceived, freeDays) {
        // Validate inputs
        if (!dateReceived) {
            console.log('⚠️ Cannot calculate billing start date: missing date received');
            return null;
        }
        
        if (freeDays === null || freeDays === undefined) {
            console.log('⚠️ Cannot calculate billing start date: free days is null or undefined');
            return null;
        }
        
        // Convert freeDays to number if it's a string
        const freeDaysNumber = typeof freeDays === 'string' ? parseFloat(freeDays) : freeDays;
        
        if (isNaN(freeDaysNumber)) {
            console.log(`⚠️ Cannot calculate billing start date: invalid free days value: ${freeDays}`);
            return null;
        }
        
        // Calculate billing start date
        const billingStart = moment(dateReceived);
        billingStart.add(freeDaysNumber, 'days');
        
        // Validate the calculated date
        if (!billingStart.isValid()) {
            console.error(`❌ Invalid billing start date calculated: ${billingStart.toDate()}`);
            return null;
        }
        
        return billingStart.toDate();
    }

    // Calculate billable days for a specific month
    calculateBillableDaysForMonth(billingStartDate, scanOutDate, targetMonth, targetYear) {
        if (!billingStartDate) return 0;
        
        const monthStart = moment([targetYear, targetMonth, 1]);
        const monthEnd = moment([targetYear, targetMonth + 1, 0]);
        
        // Determine effective start date (later of billing start or month start)
        const effectiveStart = moment.max(moment(billingStartDate), monthStart);
        
        // Determine effective end date (earlier of scan out date, month end, or today)
        let effectiveEnd = monthEnd;
        if (scanOutDate && moment(scanOutDate).isSameOrBefore(monthEnd)) {
            effectiveEnd = moment(scanOutDate);
        } else if (targetMonth === moment().month() && targetYear === moment().year()) {
            // If it's current month, use today as end date
            effectiveEnd = moment();
        }
        
        // Calculate billable days
        const diffDays = effectiveEnd.diff(effectiveStart, 'days') + 1; // +1 to include both start and end days
        
        return Math.max(0, diffDays);
    }

    // Calculate storage billing for a specific month
    calculateStorageBillingForMonth(billingStartDate, scanOutDate, cbm, rate, targetMonth, targetYear) {
        if (!billingStartDate || !cbm || !rate) return 0;
        
        const billableDays = this.calculateBillableDaysForMonth(billingStartDate, scanOutDate, targetMonth, targetYear);
        return billableDays * cbm * rate;
    }

    // Extract data from Monday.com column values
    extractItemData(item) {
        const columnValues = {};
        
        item.column_values.forEach(col => {
            columnValues[col.id] = {
                value: col.value,
                text: col.text
            };
        });
        
        return {
            id: item.id,
            name: item.name,
            columnValues
        };
    }

    // Get column value by title
    getColumnValueByTitle(itemData, columnTitle) {
        // This would need to be implemented with actual column ID mapping
        // For now, we'll use a simplified approach
        return null;
    }

    // Parse date from Monday.com column value
    parseDateFromColumn(columnValue) {
        if (!columnValue || !columnValue.value) return null;
        
        try {
            const parsed = JSON.parse(columnValue.value);
            return parsed.date ? moment(parsed.date).toDate() : null;
        } catch (error) {
            return null;
        }
    }

    // Parse number from Monday.com column value
    parseNumberFromColumn(columnValue) {
        if (!columnValue || !columnValue.value) return 0;
        
        try {
            const parsed = JSON.parse(columnValue.value);
            return parsed.number || parseFloat(columnValue.text) || 0;
        } catch (error) {
            return parseFloat(columnValue.text) || 0;
        }
    }

    // Calculate billing for a single item
    calculateItemBilling(itemData, targetMonth, targetYear) {
        try {
            // Extract data from item
            const dateReceived = this.parseDateFromColumn(itemData.columnValues['date__1']);
            const scanOutDate = this.parseDateFromColumn(itemData.columnValues['date0__1']);
            const cbm = this.parseNumberFromColumn(itemData.columnValues['numbers5__1']);
            const rate = this.parseNumberFromColumn(itemData.columnValues['numeric_mkqfs5t6']);
            const freeDays = this.parseNumberFromColumn(itemData.columnValues['numeric_mkqfs7n9']);
            
            // Calculate billing start date
            const billingStartDate = this.calculateBillingStartDate(dateReceived, freeDays);
            
            // Calculate billing for target month
            const billableDays = this.calculateBillableDaysForMonth(billingStartDate, scanOutDate, targetMonth, targetYear);
            const billingAmount = this.calculateStorageBillingForMonth(billingStartDate, scanOutDate, cbm, rate, targetMonth, targetYear);
            
            return {
                itemId: itemData.id,
                itemName: itemData.name,
                dateReceived: dateReceived ? moment(dateReceived).format('YYYY-MM-DD') : 'N/A',
                billingStartDate: billingStartDate ? moment(billingStartDate).format('YYYY-MM-DD') : 'N/A',
                scanOutDate: scanOutDate ? moment(scanOutDate).format('YYYY-MM-DD') : 'Active',
                cbm,
                rate,
                freeDays,
                billableDays,
                billingAmount,
                targetMonth,
                targetYear
            };
            
        } catch (error) {
            console.error(`❌ Error calculating billing for item ${itemData.id}:`, error);
            return null;
        }
    }

    // Calculate billing for all items on a board for a specific month
    async calculateBoardBillingForMonth(boardId, targetMonth, targetYear) {
        try {
            console.log(`🧮 Calculating billing for board ${boardId} - ${moment().month(targetMonth).format('MMMM')} ${targetYear}`);
            
            // Get all items from the board
            const items = await mondayService.getBoardItems(boardId);
            
            const results = [];
            let totalBilling = 0;
            
            for (const item of items) {
                const itemData = this.extractItemData(item);
                const billingResult = this.calculateItemBilling(itemData, targetMonth, targetYear);
                
                if (billingResult) {
                    results.push(billingResult);
                    totalBilling += billingResult.billingAmount;
                }
            }
            
            console.log(`✅ Calculated billing for ${results.length} items. Total: £${totalBilling.toFixed(2)}`);
            
            return {
                boardId,
                targetMonth,
                targetYear,
                results,
                totalBilling,
                itemCount: results.length
            };
            
        } catch (error) {
            console.error('❌ Error calculating board billing:', error);
            throw error;
        }
    }

    // Update monthly billing column on Monday.com board
    async updateMonthlyBillingColumn(boardId, targetMonth, targetYear) {
        try {
            console.log(`📊 Updating monthly billing column for ${moment().month(targetMonth).format('MMMM')} ${targetYear}`);
            
            // Calculate billing for the month
            const billingResults = await this.calculateBoardBillingForMonth(boardId, targetMonth, targetYear);
            
            // Get the monthly billing column ID
            const columnId = await mondayService.getMonthlyBillingColumnId(boardId, targetMonth, targetYear);
            
            if (!columnId) {
                console.warn(`⚠️ Monthly billing column not found for ${moment().month(targetMonth).format('MMMM')} ${targetYear}`);
                return;
            }
            
            // Update each item's monthly billing column
            for (const result of billingResults.results) {
                await mondayService.updateItemColumnValue(
                    result.itemId,
                    columnId,
                    { number: result.billingAmount }
                );
            }
            
            console.log(`✅ Updated monthly billing column for ${billingResults.itemCount} items`);
            
            return billingResults;
            
        } catch (error) {
            console.error('❌ Error updating monthly billing column:', error);
            throw error;
        }
    }

    // Run monthly billing automation for all configured boards
    async runMonthlyBilling() {
        try {
            console.log('🕐 Starting monthly billing automation...');
            
            // Get current month and year
            const currentMonth = moment().month();
            const currentYear = moment().year();
            
            // Get all configured boards (this would come from a database in production)
            const configuredBoards = await this.getConfiguredBoards();
            
            for (const board of configuredBoards) {
                console.log(`📊 Processing board: ${board.name} (ID: ${board.id})`);
                
                try {
                    await this.updateMonthlyBillingColumn(board.id, currentMonth, currentYear);
                } catch (error) {
                    console.error(`❌ Error processing board ${board.id}:`, error);
                }
            }
            
            console.log('✅ Monthly billing automation completed');
            
        } catch (error) {
            console.error('❌ Error in monthly billing automation:', error);
            throw error;
        }
    }

    // Get configured boards (placeholder - would come from database)
    async getConfiguredBoards() {
        // In production, this would query a database
        // For now, return an empty array
        return [];
    }

    // Calculate billing for current month
    async calculateCurrentMonthBilling(boardId) {
        const currentMonth = moment().month();
        const currentYear = moment().year();
        return await this.calculateBoardBillingForMonth(boardId, currentMonth, currentYear);
    }

    // Calculate billing for last month
    async calculateLastMonthBilling(boardId) {
        const lastMonth = moment().subtract(1, 'month').month();
        const lastMonthYear = moment().subtract(1, 'month').year();
        return await this.calculateBoardBillingForMonth(boardId, lastMonth, lastMonthYear);
    }

    // Recalculate all billing for a board
    async recalculateAllBilling(boardId) {
        try {
            console.log(`🔄 Recalculating all billing for board ${boardId}`);
            
            const results = [];
            
            // Calculate for current year (all months)
            for (let month = 0; month < 12; month++) {
                const year = moment().year();
                const result = await this.updateMonthlyBillingColumn(boardId, month, year);
                if (result) {
                    results.push(result);
                }
            }
            
            console.log(`✅ Recalculated billing for ${results.length} months`);
            return results;
            
        } catch (error) {
            console.error('❌ Error recalculating all billing:', error);
            throw error;
        }
    }
}

module.exports = new BillingService(); 