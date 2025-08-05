# Monday.com Storage Billing Calculator

A Node.js script that calculates storage billing from your Monday.com board using MCP tools. Perfect for warehouse and storage facilities that need to bill customers based on cubic meters (CBM) and storage duration.

## 🎯 Features

- **CBM-based billing**: Calculate storage charges using `Rate × CBM × Billable Days`
- **Monthly billing**: Generate invoices for specific months
- **On-demand billing**: Calculate total billing for any customer
- **Multi-month support**: Handles items stored across multiple months
- **Flexible date handling**: Supports billing start dates and scan out dates
- **Clean output**: Professional table format with summaries

## 📋 Prerequisites

- Node.js (version 14 or higher)
- Access to Monday.com with the appropriate board
- MCP tools enabled in your environment (like Cursor with MCP support)

## 🔧 Setup

1. **Update the configuration in `storageBillingCalculator.js`:**
   - Set `BOARD_ID` to your actual Monday.com board ID
   - Update `COLUMN_IDS` with your actual column IDs

### Required Monday.com Columns

You need these columns in your board:
- **Billing Start Date** (date column) - When billing begins
- **Scan Out Date** (date column) - When item is removed (optional)
- **CBM** (number column) - Cubic meters of storage used
- **Rate** (number column) - Daily rate per CBM
- **Customer Name** (text column) - Customer identifier

### Finding Your Board ID

1. Open your Monday.com board in a web browser
2. Look at the URL: `https://monday.com/boards/123456`
3. The number after `/boards/` is your board ID

### Finding Your Column IDs

1. Open your board in Monday.com
2. Right-click on a column header
3. Select "Inspect" or "Inspect Element"
4. Look for `data-column-id` attribute in the HTML

## 🚀 Usage

### Basic Usage

Run the script using:

```bash
node storageBillingCalculator.js
```

Or using npm:

```bash
npm run storage
```

### With MCP Tools

The script is designed to work with MCP tools. Here's how to use it:

```javascript
// 1. Get board items using MCP tool
const mcpResponse = await mcp_monday_api_mcp_hosted_get_board_items_by_name({
    boardId: YOUR_BOARD_ID,
    term: ''
});

// 2. For monthly billing (e.g., current month)
const currentDate = new Date();
const monthlyResults = processItemsForMonth(
    mcpResponse.data.items, 
    currentDate.getMonth(), 
    currentDate.getFullYear()
);
displayMonthlyBillingResults(monthlyResults, currentDate.getMonth(), currentDate.getFullYear());

// 3. For total billing (all time)
const totalResults = processItemsForTotalBilling(mcpResponse.data.items);
displayTotalBillingResults(totalResults);
```

## 📊 Billing Logic

### Formula
```
Storage Billing = Rate × CBM × Billable Days
```

### Billable Days Calculation
- **Start**: Billing start date OR start of month (whichever is later)
- **End**: Scan out date OR end of month OR today (whichever is earlier)
- **Current month**: Uses today's date if no scan out date
- **Past months**: Uses end of month if no scan out date

### Examples

#### Example 1: Item stored for 15 days in January
- Billing Start: January 15, 2024
- Scan Out: January 30, 2024
- CBM: 2.5
- Rate: $10/day
- Billable Days: 15
- **Total**: $10 × 2.5 × 15 = $375.00

#### Example 2: Item spanning multiple months
- Billing Start: January 15, 2024
- Scan Out: February 20, 2024
- CBM: 2.5
- Rate: $10/day
- **January**: $10 × 2.5 × 16 = $400.00 (Jan 15-31)
- **February**: $10 × 2.5 × 20 = $500.00 (Feb 1-20)
- **Total**: $900.00

## 📈 Output Examples

### Monthly Billing Output
```
📦 Storage Billing Results for January 2024

====================================================================================================
| Customer Name           | CBM     | Rate/Day    | Billable Days | Monthly Total |
====================================================================================================
| ABC Company            | 2.5     | $10.00      | 15           | $375.00       |
| XYZ Corp               | 1.8     | $12.00      | 31           | $669.60       |
| Storage Solutions Inc  | 4.2     | $8.50       | 28           | $999.60       |
====================================================================================================

📈 Summary for January 2024:
Total CBM: 8.50
Total Billable Days: 74
Total Monthly Billing: $2,044.20
```

### Total Billing Output
```
📦 Total Storage Billing Results (All Time)

====================================================================================================
| Customer Name           | CBM     | Rate/Day    | Total Days   | Total Billing |
====================================================================================================
| ABC Company            | 2.5     | $10.00      | 45           | $1,125.00     |
| XYZ Corp               | 1.8     | $12.00      | 90           | $1,944.00     |
| Storage Solutions Inc  | 4.2     | $8.50       | 120          | $4,284.00     |
====================================================================================================

📈 Summary (All Time):
Total CBM: 8.50
Total Billable Days: 255
Total Billing: $7,353.00
```

## 🔄 Use Cases

### Monthly Invoicing
Run this script monthly to generate invoices for all customers:

```javascript
// Generate invoice for current month
const currentDate = new Date();
const monthlyResults = processItemsForMonth(
    items, 
    currentDate.getMonth(), 
    currentDate.getFullYear()
);
displayMonthlyBillingResults(monthlyResults, currentDate.getMonth(), currentDate.getFullYear());
```

### Customer On-Demand Billing
When a customer requests their bill early:

```javascript
// Calculate total billing for a specific customer
const customerResults = processItemsForTotalBilling(items)
    .filter(item => item.customerName === 'Customer Name');
displayTotalBillingResults(customerResults);
```

### Historical Analysis
Generate billing reports for any past month:

```javascript
// Generate report for December 2023
const decemberResults = processItemsForMonth(items, 11, 2023); // Month is 0-indexed
displayMonthlyBillingResults(decemberResults, 11, 2023);
```

## 🛠️ Customization

### Change Currency Format
```javascript
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP'
    }).format(amount);
}
```

### Add Customer Filtering
```javascript
function processItemsForCustomer(items, customerName) {
    return processItemsForTotalBilling(items)
        .filter(item => item.customerName === customerName);
}
```

### Export to CSV
```javascript
function exportToCSV(results, filename) {
    const csv = results.map(item => 
        `${item.customerName},${item.cbm},${item.rate},${item.billableDays},${item.monthlyBilling}`
    ).join('\n');
    
    const fs = require('fs');
    fs.writeFileSync(filename, csv);
}
```

## 🚨 Troubleshooting

### MCP Tools Not Available
- Ensure you're running in an MCP-enabled environment
- Check that the Monday.com MCP tool is properly configured
- Verify you have the necessary permissions

### Column ID Issues
- Verify your column IDs are correct
- Check that the columns exist in your board
- Ensure the column types match (date, number, text)

### Calculation Issues
- Verify billing start dates are set correctly
- Check that CBM and rate values are positive numbers
- Ensure scan out dates are after billing start dates

### Board Access Issues
- Verify your Monday.com permissions
- Check that the board ID is correct
- Ensure you have read access to the board

## 📝 Data Structure

Your Monday.com board should have items with this structure:

```json
{
  "id": 123,
  "name": "Storage Item Name",
  "column_values": {
    "billing_start_date": { "date": "2024-01-15" },
    "scan_out_date": { "date": "2024-02-20" },
    "cbm": { "number": 2.5 },
    "rate": { "number": 10.00 },
    "customer_name": { "text": "Customer Name" }
  }
}
```

## 📄 License

MIT License - feel free to modify and use as needed.

## 🤝 Support

If you need help with:
- Setting up the script
- Configuring MCP tools
- Customizing calculations
- Troubleshooting issues

Check the main README.md file or refer to the Monday.com API documentation. 