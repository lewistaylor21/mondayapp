const express = require('express');
const router = express.Router();
const billingService = require('../services/billingService');
const mondayService = require('../services/mondayService');

// Calculate billing for a specific month
router.post('/calculate-monthly', async (req, res) => {
    try {
        const { boardId, month, year } = req.body;
        
        if (!boardId) {
            return res.status(400).json({ error: 'Board ID is required' });
        }
        
        const targetMonth = month !== undefined ? parseInt(month) : new Date().getMonth();
        const targetYear = year !== undefined ? parseInt(year) : new Date().getFullYear();
        
        console.log(`🧮 Calculating billing for board ${boardId} - ${targetMonth}/${targetYear}`);
        
        const billingResults = await billingService.calculateBoardBillingForMonth(boardId, targetMonth, targetYear);
        
        res.json({
            success: true,
            message: 'Billing calculation completed',
            billingResults
        });
        
    } catch (error) {
        console.error('❌ Error calculating monthly billing:', error);
        res.status(500).json({
            error: 'Failed to calculate billing',
            message: error.message
        });
    }
});

// Update monthly billing column on board
router.post('/update-monthly-column', async (req, res) => {
    try {
        const { boardId, month, year } = req.body;
        
        if (!boardId) {
            return res.status(400).json({ error: 'Board ID is required' });
        }
        
        const targetMonth = month !== undefined ? parseInt(month) : new Date().getMonth();
        const targetYear = year !== undefined ? parseInt(year) : new Date().getFullYear();
        
        console.log(`📊 Updating monthly billing column for board ${boardId} - ${targetMonth}/${targetYear}`);
        
        const results = await billingService.updateMonthlyBillingColumn(boardId, targetMonth, targetYear);
        
        res.json({
            success: true,
            message: 'Monthly billing column updated successfully',
            results
        });
        
    } catch (error) {
        console.error('❌ Error updating monthly billing column:', error);
        res.status(500).json({
            error: 'Failed to update monthly billing column',
            message: error.message
        });
    }
});

// Calculate current month billing
router.post('/calculate-current-month', async (req, res) => {
    try {
        const { boardId } = req.body;
        
        if (!boardId) {
            return res.status(400).json({ error: 'Board ID is required' });
        }
        
        console.log(`🧮 Calculating current month billing for board ${boardId}`);
        
        const billingResults = await billingService.calculateCurrentMonthBilling(boardId);
        
        res.json({
            success: true,
            message: 'Current month billing calculation completed',
            billingResults
        });
        
    } catch (error) {
        console.error('❌ Error calculating current month billing:', error);
        res.status(500).json({
            error: 'Failed to calculate current month billing',
            message: error.message
        });
    }
});

// Calculate last month billing
router.post('/calculate-last-month', async (req, res) => {
    try {
        const { boardId } = req.body;
        
        if (!boardId) {
            return res.status(400).json({ error: 'Board ID is required' });
        }
        
        console.log(`🧮 Calculating last month billing for board ${boardId}`);
        
        const billingResults = await billingService.calculateLastMonthBilling(boardId);
        
        res.json({
            success: true,
            message: 'Last month billing calculation completed',
            billingResults
        });
        
    } catch (error) {
        console.error('❌ Error calculating last month billing:', error);
        res.status(500).json({
            error: 'Failed to calculate last month billing',
            message: error.message
        });
    }
});

// Recalculate all billing for a board
router.post('/recalculate-all', async (req, res) => {
    try {
        const { boardId } = req.body;
        
        if (!boardId) {
            return res.status(400).json({ error: 'Board ID is required' });
        }
        
        console.log(`🔄 Recalculating all billing for board ${boardId}`);
        
        const results = await billingService.recalculateAllBilling(boardId);
        
        res.json({
            success: true,
            message: 'All billing recalculated successfully',
            results
        });
        
    } catch (error) {
        console.error('❌ Error recalculating all billing:', error);
        res.status(500).json({
            error: 'Failed to recalculate all billing',
            message: error.message
        });
    }
});

// Run monthly billing automation manually
router.post('/run-monthly-automation', async (req, res) => {
    try {
        console.log('🕐 Running monthly billing automation manually');
        
        await billingService.runMonthlyBilling();
        
        res.json({
            success: true,
            message: 'Monthly billing automation completed successfully'
        });
        
    } catch (error) {
        console.error('❌ Error running monthly billing automation:', error);
        res.status(500).json({
            error: 'Failed to run monthly billing automation',
            message: error.message
        });
    }
});

// Get billing calculation for a single item
router.post('/calculate-item', async (req, res) => {
    try {
        const { boardId, itemId, month, year } = req.body;
        
        if (!boardId || !itemId) {
            return res.status(400).json({ error: 'Board ID and Item ID are required' });
        }
        
        const targetMonth = month !== undefined ? parseInt(month) : new Date().getMonth();
        const targetYear = year !== undefined ? parseInt(year) : new Date().getFullYear();
        
        // Get the specific item
        const items = await mondayService.getBoardItems(boardId);
        const item = items.find(i => i.id === itemId);
        
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        const itemData = billingService.extractItemData(item);
        const billingResult = billingService.calculateItemBilling(itemData, targetMonth, targetYear);
        
        res.json({
            success: true,
            message: 'Item billing calculation completed',
            billingResult
        });
        
    } catch (error) {
        console.error('❌ Error calculating item billing:', error);
        res.status(500).json({
            error: 'Failed to calculate item billing',
            message: error.message
        });
    }
});

// Get billing summary for multiple months
router.post('/summary-multiple-months', async (req, res) => {
    try {
        const { boardId, months } = req.body;
        
        if (!boardId || !months || !Array.isArray(months)) {
            return res.status(400).json({ error: 'Board ID and months array are required' });
        }
        
        const results = [];
        
        for (const monthData of months) {
            const { month, year } = monthData;
            const billingResults = await billingService.calculateBoardBillingForMonth(boardId, month, year);
            results.push(billingResults);
        }
        
        // Calculate totals across all months
        const totalBilling = results.reduce((sum, result) => sum + result.totalBilling, 0);
        const totalItems = results.reduce((sum, result) => sum + result.itemCount, 0);
        
        res.json({
            success: true,
            message: 'Multi-month billing summary completed',
            results,
            summary: {
                totalBilling,
                totalItems,
                monthCount: results.length
            }
        });
        
    } catch (error) {
        console.error('❌ Error calculating multi-month billing summary:', error);
        res.status(500).json({
            error: 'Failed to calculate multi-month billing summary',
            message: error.message
        });
    }
});

// Validate board configuration for billing
router.post('/validate-board', async (req, res) => {
    try {
        const { boardId } = req.body;
        
        if (!boardId) {
            return res.status(400).json({ error: 'Board ID is required' });
        }
        
        console.log(`🔍 Validating board configuration for billing: ${boardId}`);
        
        // Get board columns
        const columns = await mondayService.getBoardColumns(boardId);
        
        // Check for required columns
        const requiredColumns = [
            'Customer Name',
            'Date Received',
            'CBM',
            'Rate per CBM/Day'
        ];
        
        const missingColumns = [];
        const foundColumns = [];
        
        for (const requiredColumn of requiredColumns) {
            const found = columns.find(col => col.title === requiredColumn);
            if (found) {
                foundColumns.push({
                    title: requiredColumn,
                    id: found.id,
                    type: found.type
                });
            } else {
                missingColumns.push(requiredColumn);
            }
        }
        
        // Check for monthly billing columns
        const monthlyColumns = columns.filter(col => 
            col.title.includes('Billing') && col.title.includes('202')
        );
        
        const validation = {
            boardId,
            isValid: missingColumns.length === 0,
            foundColumns,
            missingColumns,
            monthlyColumns: monthlyColumns.map(col => ({
                title: col.title,
                id: col.id
            })),
            totalColumns: columns.length,
            recommendations: []
        };
        
        // Add recommendations
        if (missingColumns.length > 0) {
            validation.recommendations.push(`Add missing columns: ${missingColumns.join(', ')}`);
        }
        
        if (monthlyColumns.length < 12) {
            validation.recommendations.push('Add more monthly billing columns for future months');
        }
        
        res.json({
            success: true,
            message: 'Board validation completed',
            validation
        });
        
    } catch (error) {
        console.error('❌ Error validating board:', error);
        res.status(500).json({
            error: 'Failed to validate board',
            message: error.message
        });
    }
});

// Update bill dates for all items on a board
router.post('/update-bill-dates', async (req, res) => {
    try {
        const { boardId } = req.body;
        
        if (!boardId) {
            return res.status(400).json({ error: 'Board ID is required' });
        }
        
        console.log(`📅 Updating bill dates for board ${boardId}`);
        
        const updatedCount = await mondayService.updateAllBillDates(boardId);
        
        res.json({
            success: true,
            message: `Bill dates updated for ${updatedCount} items`,
            updatedCount
        });
        
    } catch (error) {
        console.error('❌ Error updating bill dates:', error);
        res.status(500).json({
            error: 'Failed to update bill dates',
            message: error.message
        });
    }
});

// Update bill date for a specific item
router.post('/update-item-bill-date', async (req, res) => {
    try {
        const { boardId, itemId, dateReceived, freeDays } = req.body;
        
        if (!boardId || !itemId) {
            return res.status(400).json({ error: 'Board ID and Item ID are required' });
        }
        
        console.log(`📅 Updating bill date for item ${itemId} on board ${boardId}`);
        
        await mondayService.updateBillDateForItem(boardId, itemId, dateReceived, freeDays);
        
        res.json({
            success: true,
            message: 'Item bill date updated successfully'
        });
        
    } catch (error) {
        console.error('❌ Error updating item bill date:', error);
        res.status(500).json({
            error: 'Failed to update item bill date',
            message: error.message
        });
    }
});

module.exports = router; 