const express = require('express');
const router = express.Router();
const billingService = require('../services/billingService');
const invoiceService = require('../services/invoiceService');
const mondayService = require('../services/mondayService');

// Monday.com webhook endpoint
router.post('/monday', async (req, res) => {
    try {
        const { type, boardId, itemId, columnId, value, previousValue } = req.body;
        
        console.log(`🔗 Monday.com webhook received: ${type} for board ${boardId}`);
        
        // Verify webhook secret (if configured)
        const webhookSecret = process.env.WEBHOOK_SECRET;
        if (webhookSecret) {
            const signature = req.headers['x-monday-signature'];
            if (!signature || signature !== webhookSecret) {
                console.warn('⚠️ Invalid webhook signature');
                return res.status(401).json({ error: 'Invalid signature' });
            }
        }
        
        // Handle different webhook event types
        switch (type) {
            case 'UPDATE_COLUMN_VALUE':
                await handleColumnValueUpdate(boardId, itemId, columnId, value, previousValue);
                break;
                
            case 'CREATE_ITEM':
                await handleItemCreated(boardId, itemId);
                break;
                
            case 'UPDATE_ITEM':
                await handleItemUpdated(boardId, itemId);
                break;
                
            case 'DELETE_ITEM':
                await handleItemDeleted(boardId, itemId);
                break;
                
            default:
                console.log(`📝 Unhandled webhook type: ${type}`);
        }
        
        res.json({ success: true, message: 'Webhook processed successfully' });
        
    } catch (error) {
        console.error('❌ Error processing Monday.com webhook:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

// Handle column value updates
async function handleColumnValueUpdate(boardId, itemId, columnId, value, previousValue) {
    try {
        console.log(`📊 Column value updated: board ${boardId}, item ${itemId}, column ${columnId}`);
        
        // Get the updated item
        const items = await mondayService.getBoardItems(boardId);
        const item = items.find(i => i.id === itemId);
        
        if (!item) {
            console.warn(`⚠️ Item ${itemId} not found`);
            return;
        }
        
        // Check if this is a Date Received or Free Days column update
        const isDateReceivedColumn = columnId === 'date__1'; // Date Received column
        const isFreeDaysColumn = columnId === 'numeric_mkqfs7n9'; // Free Days column
        
        if (isDateReceivedColumn || isFreeDaysColumn) {
            console.log(`📅 Date Received or Free Days updated for item ${itemId}, updating bill date...`);
            
            // Extract the current values from the item
            const itemData = mondayService.extractItemData(item);
            const dateReceived = mondayService.parseDateFromColumn(itemData.columnValues['date__1']);
            const freeDays = mondayService.parseNumberFromColumn(itemData.columnValues['numeric_mkqfs7n9']);
            
            // Update the bill date
            await mondayService.updateBillDateForItem(boardId, itemId, dateReceived, freeDays);
        }
        
        // Check if this is a billing-related column update
        const isBillingColumn = await isBillingRelatedColumn(boardId, columnId);
        
        if (isBillingColumn) {
            console.log(`🧮 Billing-related column updated, recalculating billing for item ${itemId}`);
            
            // Recalculate billing for the current month
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            
            const itemData = billingService.extractItemData(item);
            const billingResult = billingService.calculateItemBilling(itemData, currentMonth, currentYear);
            
            if (billingResult) {
                // Update the current month billing column
                const monthlyColumnId = await mondayService.getMonthlyBillingColumnId(boardId, currentMonth, currentYear);
                
                if (monthlyColumnId) {
                    await mondayService.updateItemColumnValue(
                        itemId,
                        monthlyColumnId,
                        { number: billingResult.billingAmount }
                    );
                    
                    console.log(`✅ Updated monthly billing for item ${itemId}: £${billingResult.billingAmount.toFixed(2)}`);
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Error handling column value update:', error);
    }
}

// Handle item creation
async function handleItemCreated(boardId, itemId) {
    try {
        console.log(`➕ Item created: board ${boardId}, item ${itemId}`);
        
        // Get the new item
        const items = await mondayService.getBoardItems(boardId);
        const item = items.find(i => i.id === itemId);
        
        if (!item) {
            console.warn(`⚠️ Item ${itemId} not found`);
            return;
        }
        
        // Calculate and set bill date for the new item
        const itemData = mondayService.extractItemData(item);
        const dateReceived = mondayService.parseDateFromColumn(itemData.columnValues['date__1']);
        const freeDays = mondayService.parseNumberFromColumn(itemData.columnValues['numeric_mkqfs7n9']);
        
        if (dateReceived && freeDays !== null) {
            await mondayService.updateBillDateForItem(boardId, itemId, dateReceived, freeDays);
            console.log(`📅 Set bill date for new item ${itemId}`);
        }
        
        // Calculate initial billing for the current month
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const billingResult = billingService.calculateItemBilling(itemData, currentMonth, currentYear);
        
        if (billingResult) {
            // Update the current month billing column
            const monthlyColumnId = await mondayService.getMonthlyBillingColumnId(boardId, currentMonth, currentYear);
            
            if (monthlyColumnId) {
                await mondayService.updateItemColumnValue(
                    itemId,
                    monthlyColumnId,
                    { number: billingResult.billingAmount }
                );
                
                console.log(`✅ Calculated initial billing for new item ${itemId}: £${billingResult.billingAmount.toFixed(2)}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Error handling item creation:', error);
    }
}

// Handle item updates
async function handleItemUpdated(boardId, itemId) {
    try {
        console.log(`✏️ Item updated: board ${boardId}, item ${itemId}`);
        
        // Recalculate billing for the current month
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const items = await mondayService.getBoardItems(boardId);
        const item = items.find(i => i.id === itemId);
        
        if (item) {
            const itemData = billingService.extractItemData(item);
            const billingResult = billingService.calculateItemBilling(itemData, currentMonth, currentYear);
            
            if (billingResult) {
                // Update the current month billing column
                const monthlyColumnId = await mondayService.getMonthlyBillingColumnId(boardId, currentMonth, currentYear);
                
                if (monthlyColumnId) {
                    await mondayService.updateItemColumnValue(
                        itemId,
                        monthlyColumnId,
                        { number: billingResult.billingAmount }
                    );
                    
                    console.log(`✅ Recalculated billing for updated item ${itemId}: £${billingResult.billingAmount.toFixed(2)}`);
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Error handling item update:', error);
    }
}

// Handle item deletion
async function handleItemDeleted(boardId, itemId) {
    try {
        console.log(`🗑️ Item deleted: board ${boardId}, item ${itemId}`);
        
        // Log the deletion for audit purposes
        console.log(`📝 Item ${itemId} deleted from board ${boardId} at ${new Date().toISOString()}`);
        
    } catch (error) {
        console.error('❌ Error handling item deletion:', error);
    }
}

// Check if a column is billing-related
async function isBillingRelatedColumn(boardId, columnId) {
    try {
        const columns = await mondayService.getBoardColumns(boardId);
        const column = columns.find(col => col.id === columnId);
        
        if (!column) {
            return false;
        }
        
        // Define billing-related column titles
        const billingColumns = [
            'Date Received',
            'Free Days',
            'CBM',
            'Rate per CBM/Day',
            'Date Out',
            'Status'
        ];
        
        return billingColumns.includes(column.title);
        
    } catch (error) {
        console.error('❌ Error checking if column is billing-related:', error);
        return false;
    }
}

// Manual trigger for monthly billing automation
router.post('/trigger-monthly-billing', async (req, res) => {
    try {
        const { boardId } = req.body;
        
        console.log('🕐 Manual trigger for monthly billing automation');
        
        if (boardId) {
            // Run billing for specific board
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            
            await billingService.updateMonthlyBillingColumn(boardId, currentMonth, currentYear);
            
            res.json({
                success: true,
                message: `Monthly billing automation completed for board ${boardId}`,
                boardId,
                month: currentMonth,
                year: currentYear
            });
        } else {
            // Run billing for all configured boards
            await billingService.runMonthlyBilling();
            
            res.json({
                success: true,
                message: 'Monthly billing automation completed for all boards'
            });
        }
        
    } catch (error) {
        console.error('❌ Error in manual monthly billing trigger:', error);
        res.status(500).json({
            error: 'Failed to trigger monthly billing',
            message: error.message
        });
    }
});

// Manual trigger for invoice generation
router.post('/trigger-invoice-generation', async (req, res) => {
    try {
        const { boardId, month, year } = req.body;
        
        console.log('🧾 Manual trigger for invoice generation');
        
        const targetMonth = month !== undefined ? parseInt(month) : new Date().getMonth();
        const targetYear = year !== undefined ? parseInt(year) : new Date().getFullYear();
        
        if (boardId) {
            const results = await invoiceService.generateMonthlyInvoices(boardId, targetMonth, targetYear);
            
            res.json({
                success: true,
                message: `Invoice generation completed for board ${boardId}`,
                boardId,
                month: targetMonth,
                year: targetYear,
                results,
                count: results.length
            });
        } else {
            res.status(400).json({
                error: 'Board ID is required for invoice generation'
            });
        }
        
    } catch (error) {
        console.error('❌ Error in manual invoice generation trigger:', error);
        res.status(500).json({
            error: 'Failed to trigger invoice generation',
            message: error.message
        });
    }
});

// Handle button click for specific month calculation
router.post('/calculate-specific-month', async (req, res) => {
    try {
        const { boardId, itemId, month, year } = req.body;
        
        console.log(`🔘 Button clicked: Calculate Specific Month for board ${boardId}`);
        
        if (!boardId) {
            return res.status(400).json({ error: 'Board ID is required' });
        }
        
        // If month and year are provided, calculate for that specific month
        if (month !== undefined && year !== undefined) {
            const targetMonth = parseInt(month);
            const targetYear = parseInt(year);
            
            console.log(`🧮 Calculating billing for ${targetMonth + 1}/${targetYear}`);
            
            const billingResults = await billingService.updateMonthlyBillingColumn(boardId, targetMonth, targetYear);
            
            res.json({
                success: true,
                message: `Billing calculation completed for ${new Date(targetYear, targetMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}`,
                billingResults,
                month: targetMonth,
                year: targetYear
            });
        } else {
            // Return available months for selection
            const months = [];
            const currentDate = new Date();
            
            // Add past 6 months
            for (let i = 6; i >= 1; i--) {
                const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
                months.push({
                    month: date.getMonth(),
                    year: date.getFullYear(),
                    label: date.toLocaleString('default', { month: 'long', year: 'numeric' }),
                    isPast: true
                });
            }
            
            // Add current month
            months.push({
                month: currentDate.getMonth(),
                year: currentDate.getFullYear(),
                label: currentDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
                isCurrent: true
            });
            
            // Add next 6 months
            for (let i = 1; i <= 6; i++) {
                const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
                months.push({
                    month: date.getMonth(),
                    year: date.getFullYear(),
                    label: date.toLocaleString('default', { month: 'long', year: 'numeric' }),
                    isFuture: true
                });
            }
            
            res.json({
                success: true,
                message: 'Please select a month for billing calculation',
                availableMonths: months,
                instructions: 'Send a POST request to this endpoint with month and year parameters to calculate billing for that specific month.'
            });
        }
        
    } catch (error) {
        console.error('❌ Error handling specific month calculation:', error);
        res.status(500).json({
            error: 'Failed to handle specific month calculation',
            message: error.message
        });
    }
});

// Health check for webhooks
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        webhooks: {
            monday: '/webhooks/monday',
            monthlyBilling: '/webhooks/trigger-monthly-billing',
            invoiceGeneration: '/webhooks/trigger-invoice-generation',
            specificMonth: '/webhooks/calculate-specific-month'
        }
    });
});

module.exports = router; 