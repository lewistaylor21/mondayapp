const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cron = require('node-cron');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import route modules
const boardRoutes = require('./routes/boards');
const billingRoutes = require('./routes/billing');
const invoiceRoutes = require('./routes/invoices');
const webhookRoutes = require('./routes/webhooks');

// Routes
app.use('/api/boards', boardRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/webhooks', webhookRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'Monday.com Storage Billing App',
        description: 'Automated storage billing with dynamic monthly columns and invoice generation',
        version: '1.0.0',
        endpoints: {
            boards: '/api/boards',
            billing: '/api/billing',
            invoices: '/api/invoices',
            webhooks: '/webhooks'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Schedule monthly billing automation (runs on 1st of each month at 9 AM)
cron.schedule('0 9 1 * *', async () => {
    console.log('🕐 Running scheduled monthly billing automation...');
    try {
        const { runMonthlyBilling } = require('./services/billingService');
        await runMonthlyBilling();
        console.log('✅ Monthly billing automation completed successfully');
    } catch (error) {
        console.error('❌ Monthly billing automation failed:', error);
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Monday.com Storage Billing App running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📅 Monthly billing scheduled for 1st of each month at 9 AM`);
});

module.exports = app; 