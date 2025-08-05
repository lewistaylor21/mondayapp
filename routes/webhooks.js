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
        
        // Calculate initial billing for the current month
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

// Health check for webhooks
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        webhooks: {
            monday: '/webhooks/monday',
            monthlyBilling: '/webhooks/trigger-monthly-billing',
            invoiceGeneration: '/webhooks/trigger-invoice-generation'
        }
    });
});

module.exports = router; 