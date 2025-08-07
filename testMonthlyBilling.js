const axios = require('axios');
require('dotenv').config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_BOARD_ID = process.env.TEST_BOARD_ID || '7667639837'; // Replace with your test board ID

/**
 * Test script for the new monthly billing features
 * This script demonstrates:
 * 1. Getting available months for calculation
 * 2. Calculating billing for specific months
 * 3. Testing the month selector functionality
 */

async function testMonthlyBillingFeatures() {
    console.log('🧪 Testing Monthly Billing Features');
    console.log('=====================================\n');

    try {
        // Test 1: Get available months for calculation
        console.log('📅 Test 1: Getting available months for calculation');
        const monthsResponse = await axios.get(`${BASE_URL}/api/billing/available-months/${TEST_BOARD_ID}`);
        
        if (monthsResponse.data.success) {
            console.log('✅ Successfully retrieved available months');
            console.log(`📊 Current Month: ${monthsResponse.data.currentMonth.label}`);
            console.log(`📊 Total Available Months: ${monthsResponse.data.months.length}`);
            
            // Show past, current, and future months
            const pastMonths = monthsResponse.data.months.filter(m => m.isPast);
            const currentMonth = monthsResponse.data.months.find(m => m.isCurrent);
            const futureMonths = monthsResponse.data.months.filter(m => m.isFuture);
            
            console.log(`   📈 Past Months: ${pastMonths.length}`);
            console.log(`   📍 Current Month: ${currentMonth.label}`);
            console.log(`   📅 Future Months: ${futureMonths.length}`);
        } else {
            console.log('❌ Failed to get available months');
            console.log(monthsResponse.data);
        }

        console.log('\n' + '-'.repeat(50) + '\n');

        // Test 2: Calculate billing for current month
        console.log('🧮 Test 2: Calculate billing for current month');
        const currentMonthResponse = await axios.post(`${BASE_URL}/api/billing/calculate-current-month`, {
            boardId: TEST_BOARD_ID
        });
        
        if (currentMonthResponse.data.success) {
            console.log('✅ Successfully calculated current month billing');
            console.log(`📊 Total Billing: £${currentMonthResponse.data.billingResults.totalBilling.toFixed(2)}`);
            console.log(`📋 Items Processed: ${currentMonthResponse.data.billingResults.itemCount}`);
        } else {
            console.log('❌ Failed to calculate current month billing');
            console.log(currentMonthResponse.data);
        }

        console.log('\n' + '-'.repeat(50) + '\n');

        // Test 3: Calculate billing for a specific month (last month)
        console.log('🎯 Test 3: Calculate billing for specific month (last month)');
        const lastMonth = new Date().getMonth() - 1;
        const lastMonthYear = lastMonth < 0 ? new Date().getFullYear() - 1 : new Date().getFullYear();
        const adjustedLastMonth = lastMonth < 0 ? 11 : lastMonth;
        
        const specificMonthResponse = await axios.post(`${BASE_URL}/api/billing/calculate-specific-month`, {
            boardId: TEST_BOARD_ID,
            month: adjustedLastMonth,
            year: lastMonthYear
        });
        
        if (specificMonthResponse.data.success) {
            console.log('✅ Successfully calculated specific month billing');
            console.log(`📅 Month: ${specificMonthResponse.data.monthName} ${specificMonthResponse.data.year}`);
            console.log(`📊 Total Billing: £${specificMonthResponse.data.billingResults.totalBilling.toFixed(2)}`);
            console.log(`📋 Items Processed: ${specificMonthResponse.data.billingResults.itemCount}`);
        } else {
            console.log('❌ Failed to calculate specific month billing');
            console.log(specificMonthResponse.data);
        }

        console.log('\n' + '-'.repeat(50) + '\n');

        // Test 4: Test webhook endpoint for month selector (without parameters)
        console.log('🔘 Test 4: Test month selector webhook endpoint');
        const monthSelectorResponse = await axios.post(`${BASE_URL}/webhooks/calculate-specific-month`, {
            boardId: TEST_BOARD_ID
        });
        
        if (monthSelectorResponse.data.success) {
            console.log('✅ Successfully got month selector options');
            console.log(`📅 Available Months: ${monthSelectorResponse.data.availableMonths.length}`);
            console.log(`📝 Message: ${monthSelectorResponse.data.message}`);
            
            // Show first 3 available months as example
            console.log('📋 First 3 available months:');
            monthSelectorResponse.data.availableMonths.slice(0, 3).forEach((month, index) => {
                console.log(`   ${index + 1}. ${month.label} (Month: ${month.month}, Year: ${month.year})`);
            });
        } else {
            console.log('❌ Failed to get month selector options');
            console.log(monthSelectorResponse.data);
        }

        console.log('\n' + '-'.repeat(50) + '\n');

        // Test 5: Test board validation
        console.log('🔍 Test 5: Validate board configuration');
        const validationResponse = await axios.post(`${BASE_URL}/api/billing/validate-board`, {
            boardId: TEST_BOARD_ID
        });
        
        if (validationResponse.data.success) {
            const validation = validationResponse.data.validation;
            console.log('✅ Successfully validated board configuration');
            console.log(`📊 Board Valid: ${validation.isValid ? '✅ Yes' : '❌ No'}`);
            console.log(`📋 Found Columns: ${validation.foundColumns.length}`);
            console.log(`❌ Missing Columns: ${validation.missingColumns.length}`);
            console.log(`📅 Monthly Columns: ${validation.monthlyColumns.length}`);
            
            if (validation.recommendations.length > 0) {
                console.log('📝 Recommendations:');
                validation.recommendations.forEach((rec, index) => {
                    console.log(`   ${index + 1}. ${rec}`);
                });
            }
        } else {
            console.log('❌ Failed to validate board configuration');
            console.log(validationResponse.data);
        }

        console.log('\n🎉 All tests completed!\n');
        console.log('💡 Usage Tips:');
        console.log('   • Use GET /api/billing/available-months/:boardId to get month options');
        console.log('   • Use POST /api/billing/calculate-specific-month with month & year');
        console.log('   • Use POST /webhooks/calculate-specific-month for button handling');
        console.log('   • Monthly columns show individual item charges per month');
        console.log('   • Each item gets its own billing amount in each monthly column\n');

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        if (error.response) {
            console.error('📄 Response:', error.response.data);
        }
    }
}

// Run the tests
if (require.main === module) {
    testMonthlyBilling();
}

async function testMonthlyBilling() {
    console.log('🚀 Starting Monthly Billing Test Suite...\n');
    await testMonthlyBillingFeatures();
}

module.exports = {
    testMonthlyBillingFeatures
};