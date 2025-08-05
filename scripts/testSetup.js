#!/usr/bin/env node

/**
 * Test script to verify Monday.com Storage Billing App setup
 */

require('dotenv').config();

async function testSetup() {
    console.log('🧪 Testing Monday.com Storage Billing App Setup\n');
    
    // Test 1: Environment Variables
    console.log('1️⃣ Testing Environment Variables...');
    const requiredEnvVars = ['MONDAY_API_TOKEN'];
    const missingVars = [];
    
    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            missingVars.push(envVar);
        }
    }
    
    if (missingVars.length > 0) {
        console.log(`❌ Missing environment variables: ${missingVars.join(', ')}`);
        console.log('💡 Please set these in your .env file');
        return false;
    } else {
        console.log('✅ All required environment variables are set');
    }
    
    // Test 2: Dependencies
    console.log('\n2️⃣ Testing Dependencies...');
    try {
        const mondaySdk = require('monday-sdk-js');
        const express = require('express');
        const moment = require('moment');
        const PDFDocument = require('pdfkit');
        console.log('✅ All required dependencies are installed');
    } catch (error) {
        console.log(`❌ Missing dependency: ${error.message}`);
        console.log('💡 Run: npm install');
        return false;
    }
    
    // Test 3: Services
    console.log('\n3️⃣ Testing Services...');
    try {
        const mondayService = require('../services/mondayService');
        const billingService = require('../services/billingService');
        const invoiceService = require('../services/invoiceService');
        console.log('✅ All services are properly configured');
    } catch (error) {
        console.log(`❌ Service error: ${error.message}`);
        return false;
    }
    
    // Test 4: Routes
    console.log('\n4️⃣ Testing Routes...');
    try {
        const boardRoutes = require('../routes/boards');
        const billingRoutes = require('../routes/billing');
        const invoiceRoutes = require('../routes/invoices');
        const webhookRoutes = require('../routes/webhooks');
        console.log('✅ All routes are properly configured');
    } catch (error) {
        console.log(`❌ Route error: ${error.message}`);
        return false;
    }
    
    // Test 5: Monday.com API Connection (if token is set)
    console.log('\n5️⃣ Testing Monday.com API Connection...');
    if (process.env.MONDAY_API_TOKEN && process.env.MONDAY_API_TOKEN !== 'your_monday_api_token_here') {
        try {
            const mondaySdk = require('monday-sdk-js');
            const monday = mondaySdk();
            monday.setToken(process.env.MONDAY_API_TOKEN);
            
            // Test a simple API call
            const query = `
                query {
                    me {
                        name
                        email
                    }
                }
            `;
            
            const result = await monday.api(query);
            console.log('✅ Monday.com API connection successful');
            console.log(`   Connected as: ${result.data.me.name} (${result.data.me.email})`);
        } catch (error) {
            console.log(`❌ Monday.com API connection failed: ${error.message}`);
            console.log('💡 Please check your API token');
            return false;
        }
    } else {
        console.log('⚠️ Monday.com API token not configured - skipping API test');
        console.log('💡 Set MONDAY_API_TOKEN in your .env file to test API connection');
    }
    
    // Test 6: File System
    console.log('\n6️⃣ Testing File System...');
    try {
        const fs = require('fs');
        const path = require('path');
        
        // Test invoice directory creation
        const invoiceDir = path.join(__dirname, '..', 'invoices');
        if (!fs.existsSync(invoiceDir)) {
            fs.mkdirSync(invoiceDir, { recursive: true });
        }
        
        // Test write permissions
        const testFile = path.join(invoiceDir, 'test.txt');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        
        console.log('✅ File system permissions are correct');
    } catch (error) {
        console.log(`❌ File system error: ${error.message}`);
        return false;
    }
    
    // Test 7: Billing Calculations
    console.log('\n7️⃣ Testing Billing Calculations...');
    try {
        const billingService = require('../services/billingService');
        
        // Test billing start date calculation
        const dateReceived = new Date('2025-07-01');
        const freeDays = 7;
        const billingStartDate = billingService.calculateBillingStartDate(dateReceived, freeDays);
        
        if (billingStartDate && billingStartDate.getDate() === 8) {
            console.log('✅ Billing calculations are working correctly');
        } else {
            console.log('❌ Billing calculation test failed');
            return false;
        }
    } catch (error) {
        console.log(`❌ Billing calculation error: ${error.message}`);
        return false;
    }
    
    console.log('\n🎉 All tests passed! Your Monday.com Storage Billing App is ready to use.');
    console.log('\n📋 Next Steps:');
    console.log('   1. Create a standardized board: npm run create-board');
    console.log('   2. Start the application: npm start');
    console.log('   3. Add storage items to your board');
    console.log('   4. Use the API to calculate billing and generate invoices');
    
    return true;
}

// Run the test
if (require.main === module) {
    testSetup().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('❌ Test failed with error:', error);
        process.exit(1);
    });
}

module.exports = { testSetup }; 