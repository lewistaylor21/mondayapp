const billingService = require('./services/billingService');

async function testBackendBilling() {
    try {
        console.log('🧪 Testing Backend Billing Calculation...');
        console.log('=' .repeat(50));
        
        const boardId = "1953505209";
        console.log(`📋 Board ID: ${boardId}`);
        
        // Test current month billing (August 2025)
        console.log('📅 Testing Current Month Billing (August 2025)...');
        
        const result = await billingService.calculateCurrentMonthBilling(boardId);
        
        console.log('✅ Backend Calculation Result:');
        console.log(JSON.stringify(result, null, 2));
        
    } catch (error) {
        console.error('❌ Backend Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

testBackendBilling();
