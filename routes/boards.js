const express = require('express');
const router = express.Router();
const mondayService = require('../services/mondayService');
const billingService = require('../services/billingService');

// Create a new standardized storage billing board
router.post('/create', async (req, res) => {
    try {
        const { boardName, workspaceId } = req.body;
        
        if (!boardName) {
            return res.status(400).json({ error: 'Board name is required' });
        }
        
        console.log(`🏗️ Creating new standardized board: ${boardName}`);
        
        const board = await mondayService.createStandardizedBoard(boardName, workspaceId);
        
        res.json({
            success: true,
            message: 'Standardized storage billing board created successfully',
            board
        });
        
    } catch (error) {
        console.error('❌ Error creating board:', error);
        res.status(500).json({
            error: 'Failed to create board',
            message: error.message
        });
    }
});

// Get board information
router.get('/:boardId', async (req, res) => {
    try {
        const { boardId } = req.params;
        
        const columns = await mondayService.getBoardColumns(boardId);
        const items = await mondayService.getBoardItems(boardId);
        
        res.json({
            boardId,
            columns,
            items: items.map(item => ({
                id: item.id,
                name: item.name,
                columnCount: item.column_values.length
            })),
            itemCount: items.length,
            columnCount: columns.length
        });
        
    } catch (error) {
        console.error('❌ Error getting board info:', error);
        res.status(500).json({
            error: 'Failed to get board information',
            message: error.message
        });
    }
});

// Get board columns
router.get('/:boardId/columns', async (req, res) => {
    try {
        const { boardId } = req.params;
        
        const columns = await mondayService.getBoardColumns(boardId);
        
        res.json({
            boardId,
            columns
        });
        
    } catch (error) {
        console.error('❌ Error getting board columns:', error);
        res.status(500).json({
            error: 'Failed to get board columns',
            message: error.message
        });
    }
});

// Get board items
router.get('/:boardId/items', async (req, res) => {
    try {
        const { boardId } = req.params;
        
        const items = await mondayService.getBoardItems(boardId);
        
        res.json({
            boardId,
            items,
            count: items.length
        });
        
    } catch (error) {
        console.error('❌ Error getting board items:', error);
        res.status(500).json({
            error: 'Failed to get board items',
            message: error.message
        });
    }
});

// Add monthly billing columns to existing board
router.post('/:boardId/add-monthly-columns', async (req, res) => {
    try {
        const { boardId } = req.params;
        const { months = 12 } = req.body;
        
        console.log(`📅 Adding ${months} monthly billing columns to board ${boardId}`);
        
        // Add monthly billing columns
        await mondayService.addMonthlyBillingColumns(boardId);
        
        res.json({
            success: true,
            message: `Added ${months} monthly billing columns to board`,
            boardId
        });
        
    } catch (error) {
        console.error('❌ Error adding monthly columns:', error);
        res.status(500).json({
            error: 'Failed to add monthly columns',
            message: error.message
        });
    }
});

// Add billing action buttons to board
router.post('/:boardId/add-action-buttons', async (req, res) => {
    try {
        const { boardId } = req.params;
        
        console.log(`🔘 Adding billing action buttons to board ${boardId}`);
        
        await mondayService.addBillingActionButtons(boardId);
        
        res.json({
            success: true,
            message: 'Billing action buttons added to board',
            boardId
        });
        
    } catch (error) {
        console.error('❌ Error adding action buttons:', error);
        res.status(500).json({
            error: 'Failed to add action buttons',
            message: error.message
        });
    }
});

// Setup webhook for board
router.post('/:boardId/setup-webhook', async (req, res) => {
    try {
        const { boardId } = req.params;
        const { webhookUrl } = req.body;
        
        if (!webhookUrl) {
            return res.status(400).json({ error: 'Webhook URL is required' });
        }
        
        console.log(`🔗 Setting up webhook for board ${boardId}`);
        
        const webhook = await mondayService.createWebhook(boardId, webhookUrl);
        
        res.json({
            success: true,
            message: 'Webhook setup successfully',
            webhook
        });
        
    } catch (error) {
        console.error('❌ Error setting up webhook:', error);
        res.status(500).json({
            error: 'Failed to setup webhook',
            message: error.message
        });
    }
});

// Get column ID by title
router.get('/:boardId/columns/:columnTitle', async (req, res) => {
    try {
        const { boardId, columnTitle } = req.params;
        
        const columnId = await mondayService.getColumnIdByTitle(boardId, columnTitle);
        
        if (!columnId) {
            return res.status(404).json({
                error: 'Column not found',
                columnTitle
            });
        }
        
        res.json({
            boardId,
            columnTitle,
            columnId
        });
        
    } catch (error) {
        console.error('❌ Error getting column ID:', error);
        res.status(500).json({
            error: 'Failed to get column ID',
            message: error.message
        });
    }
});

// Update item column value
router.put('/:boardId/items/:itemId/columns/:columnId', async (req, res) => {
    try {
        const { boardId, itemId, columnId } = req.params;
        const { value } = req.body;
        
        if (!value) {
            return res.status(400).json({ error: 'Value is required' });
        }
        
        const result = await mondayService.updateItemColumnValue(itemId, columnId, value);
        
        res.json({
            success: true,
            message: 'Column value updated successfully',
            result
        });
        
    } catch (error) {
        console.error('❌ Error updating column value:', error);
        res.status(500).json({
            error: 'Failed to update column value',
            message: error.message
        });
    }
});

// Get board billing summary
router.get('/:boardId/billing-summary', async (req, res) => {
    try {
        const { boardId } = req.params;
        const { month, year } = req.query;
        
        const targetMonth = month ? parseInt(month) : new Date().getMonth();
        const targetYear = year ? parseInt(year) : new Date().getFullYear();
        
        const billingSummary = await billingService.calculateBoardBillingForMonth(boardId, targetMonth, targetYear);
        
        res.json({
            boardId,
            targetMonth,
            targetYear,
            billingSummary
        });
        
    } catch (error) {
        console.error('❌ Error getting billing summary:', error);
        res.status(500).json({
            error: 'Failed to get billing summary',
            message: error.message
        });
    }
});

module.exports = router; 