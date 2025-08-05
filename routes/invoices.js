const express = require('express');
const router = express.Router();
const invoiceService = require('../services/invoiceService');
const billingService = require('../services/billingService');
const mondayService = require('../services/mondayService');

// Generate invoice for a specific customer
router.post('/generate-customer', async (req, res) => {
    try {
        const { boardId, customerId, month, year } = req.body;
        
        if (!boardId || !customerId) {
            return res.status(400).json({ error: 'Board ID and Customer ID are required' });
        }
        
        const targetMonth = month !== undefined ? parseInt(month) : new Date().getMonth();
        const targetYear = year !== undefined ? parseInt(year) : new Date().getFullYear();
        
        console.log(`🧾 Generating invoice for customer ${customerId} - ${targetMonth}/${targetYear}`);
        
        const result = await invoiceService.generateInvoiceForCustomer(boardId, customerId, targetMonth, targetYear);
        
        res.json({
            success: true,
            message: 'Invoice generated successfully',
            result
        });
        
    } catch (error) {
        console.error('❌ Error generating customer invoice:', error);
        res.status(500).json({
            error: 'Failed to generate invoice',
            message: error.message
        });
    }
});

// Generate invoices for all customers on a board for a specific month
router.post('/generate-monthly', async (req, res) => {
    try {
        const { boardId, month, year } = req.body;
        
        if (!boardId) {
            return res.status(400).json({ error: 'Board ID is required' });
        }
        
        const targetMonth = month !== undefined ? parseInt(month) : new Date().getMonth();
        const targetYear = year !== undefined ? parseInt(year) : new Date().getFullYear();
        
        console.log(`🧾 Generating monthly invoices for board ${boardId} - ${targetMonth}/${targetYear}`);
        
        const results = await invoiceService.generateMonthlyInvoices(boardId, targetMonth, targetYear);
        
        res.json({
            success: true,
            message: 'Monthly invoices generated successfully',
            results,
            count: results.length
        });
        
    } catch (error) {
        console.error('❌ Error generating monthly invoices:', error);
        res.status(500).json({
            error: 'Failed to generate monthly invoices',
            message: error.message
        });
    }
});

// Generate invoice for current month
router.post('/generate-current-month', async (req, res) => {
    try {
        const { boardId } = req.body;
        
        if (!boardId) {
            return res.status(400).json({ error: 'Board ID is required' });
        }
        
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        console.log(`🧾 Generating current month invoices for board ${boardId}`);
        
        const results = await invoiceService.generateMonthlyInvoices(boardId, currentMonth, currentYear);
        
        res.json({
            success: true,
            message: 'Current month invoices generated successfully',
            results,
            count: results.length
        });
        
    } catch (error) {
        console.error('❌ Error generating current month invoices:', error);
        res.status(500).json({
            error: 'Failed to generate current month invoices',
            message: error.message
        });
    }
});

// Generate invoice for last month
router.post('/generate-last-month', async (req, res) => {
    try {
        const { boardId } = req.body;
        
        if (!boardId) {
            return res.status(400).json({ error: 'Board ID is required' });
        }
        
        const lastMonth = new Date().getMonth() - 1;
        const lastMonthYear = lastMonth < 0 ? new Date().getFullYear() - 1 : new Date().getFullYear();
        const adjustedLastMonth = lastMonth < 0 ? 11 : lastMonth;
        
        console.log(`🧾 Generating last month invoices for board ${boardId}`);
        
        const results = await invoiceService.generateMonthlyInvoices(boardId, adjustedLastMonth, lastMonthYear);
        
        res.json({
            success: true,
            message: 'Last month invoices generated successfully',
            results,
            count: results.length
        });
        
    } catch (error) {
        console.error('❌ Error generating last month invoices:', error);
        res.status(500).json({
            error: 'Failed to generate last month invoices',
            message: error.message
        });
    }
});

// Get invoice preview (without generating PDF)
router.post('/preview', async (req, res) => {
    try {
        const { boardId, customerId, month, year } = req.body;
        
        if (!boardId || !customerId) {
            return res.status(400).json({ error: 'Board ID and Customer ID are required' });
        }
        
        const targetMonth = month !== undefined ? parseInt(month) : new Date().getMonth();
        const targetYear = year !== undefined ? parseInt(year) : new Date().getFullYear();
        
        // Get customer's billing data
        const billingData = await invoiceService.getCustomerBillingData(boardId, customerId, targetMonth, targetYear);
        
        if (!billingData || billingData.items.length === 0) {
            return res.status(404).json({ error: 'No billing data found for customer' });
        }
        
        // Calculate totals
        const subtotal = billingData.items.reduce((sum, item) => sum + item.billingAmount, 0);
        const vat = subtotal * 0.20; // 20% VAT
        const total = subtotal + vat;
        
        // Create invoice preview data
        const invoicePreview = {
            invoiceNumber: invoiceService.generateInvoiceNumber(),
            invoiceDate: new Date(),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            billingPeriod: `${new Date(targetYear, targetMonth).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`,
            customer: billingData.customer,
            items: billingData.items,
            subtotal,
            vat,
            total
        };
        
        res.json({
            success: true,
            message: 'Invoice preview generated successfully',
            invoicePreview
        });
        
    } catch (error) {
        console.error('❌ Error generating invoice preview:', error);
        res.status(500).json({
            error: 'Failed to generate invoice preview',
            message: error.message
        });
    }
});

// Get customer billing data for invoice generation
router.post('/customer-billing-data', async (req, res) => {
    try {
        const { boardId, customerId, month, year } = req.body;
        
        if (!boardId || !customerId) {
            return res.status(400).json({ error: 'Board ID and Customer ID are required' });
        }
        
        const targetMonth = month !== undefined ? parseInt(month) : new Date().getMonth();
        const targetYear = year !== undefined ? parseInt(year) : new Date().getFullYear();
        
        const billingData = await invoiceService.getCustomerBillingData(boardId, customerId, targetMonth, targetYear);
        
        if (!billingData) {
            return res.status(404).json({ error: 'No billing data found for customer' });
        }
        
        res.json({
            success: true,
            message: 'Customer billing data retrieved successfully',
            billingData
        });
        
    } catch (error) {
        console.error('❌ Error getting customer billing data:', error);
        res.status(500).json({
            error: 'Failed to get customer billing data',
            message: error.message
        });
    }
});

// Get invoice statistics for a board
router.get('/statistics/:boardId', async (req, res) => {
    try {
        const { boardId } = req.params;
        const { month, year } = req.query;
        
        const targetMonth = month ? parseInt(month) : new Date().getMonth();
        const targetYear = year ? parseInt(year) : new Date().getFullYear();
        
        // Get all items from the board
        const items = await mondayService.getBoardItems(boardId);
        
        // Group items by customer
        const customerGroups = invoiceService.groupItemsByCustomer(items);
        
        const statistics = {
            boardId,
            targetMonth,
            targetYear,
            totalCustomers: Object.keys(customerGroups).length,
            totalItems: items.length,
            customers: []
        };
        
        // Calculate statistics for each customer
        for (const [customerId, customerItems] of Object.entries(customerGroups)) {
            try {
                const billingData = await invoiceService.getCustomerBillingData(boardId, customerId, targetMonth, targetYear);
                
                if (billingData && billingData.items.length > 0) {
                    const subtotal = billingData.items.reduce((sum, item) => sum + item.billingAmount, 0);
                    const vat = subtotal * 0.20;
                    const total = subtotal + vat;
                    
                    statistics.customers.push({
                        customerId,
                        customerName: billingData.customer.name,
                        itemCount: billingData.items.length,
                        subtotal,
                        vat,
                        total
                    });
                }
            } catch (error) {
                console.error(`❌ Error calculating statistics for customer ${customerId}:`, error);
            }
        }
        
        // Calculate totals
        statistics.totalSubtotal = statistics.customers.reduce((sum, customer) => sum + customer.subtotal, 0);
        statistics.totalVat = statistics.customers.reduce((sum, customer) => sum + customer.vat, 0);
        statistics.totalAmount = statistics.customers.reduce((sum, customer) => sum + customer.total, 0);
        
        res.json({
            success: true,
            message: 'Invoice statistics retrieved successfully',
            statistics
        });
        
    } catch (error) {
        console.error('❌ Error getting invoice statistics:', error);
        res.status(500).json({
            error: 'Failed to get invoice statistics',
            message: error.message
        });
    }
});

// Download generated invoice PDF
router.get('/download/:invoiceNumber', (req, res) => {
    try {
        const { invoiceNumber } = req.params;
        const filepath = require('path').join(invoiceService.invoiceStoragePath, `invoice_${invoiceNumber}.pdf`);
        
        if (!require('fs').existsSync(filepath)) {
            return res.status(404).json({ error: 'Invoice PDF not found' });
        }
        
        res.download(filepath, `invoice_${invoiceNumber}.pdf`);
        
    } catch (error) {
        console.error('❌ Error downloading invoice:', error);
        res.status(500).json({
            error: 'Failed to download invoice',
            message: error.message
        });
    }
});

// List all generated invoices
router.get('/list', (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        
        const invoiceFiles = fs.readdirSync(invoiceService.invoiceStoragePath)
            .filter(file => file.startsWith('invoice_') && file.endsWith('.pdf'))
            .map(file => {
                const stats = fs.statSync(path.join(invoiceService.invoiceStoragePath, file));
                return {
                    filename: file,
                    invoiceNumber: file.replace('invoice_', '').replace('.pdf', ''),
                    size: stats.size,
                    created: stats.birthtime,
                    modified: stats.mtime
                };
            })
            .sort((a, b) => b.modified - a.modified);
        
        res.json({
            success: true,
            message: 'Invoice list retrieved successfully',
            invoices: invoiceFiles,
            count: invoiceFiles.length
        });
        
    } catch (error) {
        console.error('❌ Error listing invoices:', error);
        res.status(500).json({
            error: 'Failed to list invoices',
            message: error.message
        });
    }
});

module.exports = router; 