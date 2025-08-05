# Monday.com Storage Billing App

A comprehensive Monday.com application for automated storage billing with dynamic monthly columns, invoice generation, and webhook automation.

## 🚀 Features

### ✅ **Standardized Board Creation**
- Create boards with predefined columns that can't be easily modified
- Automatic column setup for storage billing workflows
- Dynamic monthly billing columns for the next 12 months

### ✅ **Automated Billing Calculations**
- Formula-based billing start date calculation (Date Received + Free Days)
- Monthly billing calculations with automatic column updates
- Support for multiple billing scenarios (active items, scanned out items)

### ✅ **On-Demand Billing Actions**
- Action buttons for manual billing calculations
- Current month, last month, and recalculate all options
- Real-time billing updates

### ✅ **Invoice Generation**
- PDF invoice generation with professional formatting
- Automatic invoice numbering and tracking
- Customer-specific invoice creation
- Monthly invoice batch processing

### ✅ **Webhook Automation**
- Real-time billing updates when data changes
- Automatic monthly billing runs
- Configurable webhook endpoints

### ✅ **API Integration**
- RESTful API for all operations
- Monday.com SDK integration
- Comprehensive error handling

## 📋 Prerequisites

- Node.js 16.0.0 or higher
- Monday.com account with API access
- Monday.com API token

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd monday-storage-billing-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   MONDAY_API_TOKEN=your_monday_api_token_here
   MONDAY_API_URL=https://api.monday.com/v2
   PORT=3000
   NODE_ENV=development
   ```

4. **Start the application**
   ```bash
   npm start
   ```

## 🏗️ Quick Start

### 1. Create a Standardized Board

```bash
# Create a board with default name
npm run create-board

# Create a board with custom name
npm run create-board -- --name "My Storage Company"

# Create a board in specific workspace
npm run create-board -- --name "My Storage Company" --workspace-id "12345"
```

### 2. Add Storage Items

Add items to your board with the following required data:
- **Customer Name**: The customer's name
- **Date Received**: When the item was received
- **Free Days**: Number of free days before billing starts
- **CBM**: Cubic meters of the item
- **Rate per CBM/Day**: Daily rate per cubic meter

### 3. Calculate Billing

Use the API or action buttons to calculate billing:

```bash
# Calculate current month billing
curl -X POST http://localhost:3000/api/billing/calculate-current-month \
  -H "Content-Type: application/json" \
  -d '{"boardId": "your_board_id"}'
```

### 4. Generate Invoices

```bash
# Generate invoices for current month
curl -X POST http://localhost:3000/api/invoices/generate-current-month \
  -H "Content-Type: application/json" \
  -d '{"boardId": "your_board_id"}'
```

## 📊 Board Structure

The standardized board includes the following columns:

### Core Data Columns
- **Customer Name** (name column)
- **Date Received** (date column)
- **Free Days** (numeric column)
- **CBM** (numbers column)
- **Rate per CBM/Day** (numeric column)
- **Date Out** (date column)
- **Status** (status column)
- **Customer Email** (email column)

### Calculated Columns
- **Billing Start Date** (formula column)
- **Total Billable Days** (formula column)
- **Current Month Billing** (formula column)

### Monthly Billing Columns
- **January 2025 Billing** (numeric column)
- **February 2025 Billing** (numeric column)
- ... (12 months total)

### Action Columns
- **Billing Actions** (buttons column)
- **Invoice Status** (status column)
- **Invoice Number** (text column)
- **Invoice PDF** (file column)

## 🔧 API Endpoints

### Boards
- `POST /api/boards/create` - Create standardized board
- `GET /api/boards/:boardId` - Get board information
- `GET /api/boards/:boardId/columns` - Get board columns
- `GET /api/boards/:boardId/items` - Get board items

### Billing
- `POST /api/billing/calculate-monthly` - Calculate monthly billing
- `POST /api/billing/update-monthly-column` - Update monthly billing column
- `POST /api/billing/calculate-current-month` - Calculate current month
- `POST /api/billing/calculate-last-month` - Calculate last month
- `POST /api/billing/recalculate-all` - Recalculate all billing
- `POST /api/billing/validate-board` - Validate board configuration

### Invoices
- `POST /api/invoices/generate-customer` - Generate customer invoice
- `POST /api/invoices/generate-monthly` - Generate monthly invoices
- `POST /api/invoices/preview` - Preview invoice
- `GET /api/invoices/statistics/:boardId` - Get invoice statistics
- `GET /api/invoices/download/:invoiceNumber` - Download invoice PDF

### Webhooks
- `POST /webhooks/monday` - Monday.com webhook endpoint
- `POST /webhooks/trigger-monthly-billing` - Manual billing trigger
- `POST /webhooks/trigger-invoice-generation` - Manual invoice trigger

## 🔄 Automation

### Monthly Billing Automation
The app automatically runs monthly billing calculations on the 1st of each month at 9 AM.

### Webhook Automation
When items are created, updated, or deleted, the app automatically:
- Recalculates billing for affected items
- Updates monthly billing columns
- Triggers invoice generation when needed

### Manual Triggers
```bash
# Trigger monthly billing manually
curl -X POST http://localhost:3000/webhooks/trigger-monthly-billing \
  -H "Content-Type: application/json" \
  -d '{"boardId": "your_board_id"}'

# Trigger invoice generation manually
curl -X POST http://localhost:3000/webhooks/trigger-invoice-generation \
  -H "Content-Type: application/json" \
  -d '{"boardId": "your_board_id", "month": 6, "year": 2025}'
```

## 🧮 Billing Formula

The app uses the following billing formula:

```
Billing Start Date = Date Received + Free Days
Billable Days = Days from Billing Start Date to End Date (month end or scan out date)
Billing Amount = Rate × CBM × Billable Days
```

### Example Calculation
- **Date Received**: July 1, 2025
- **Free Days**: 7
- **Billing Start Date**: July 8, 2025
- **CBM**: 1.8
- **Rate**: £1 per CBM per day
- **July 2025 Billable Days**: 24 (July 8-31)
- **July 2025 Billing**: £1 × 1.8 × 24 = £43.20

## 📄 Invoice Generation

### Invoice Features
- Professional PDF formatting
- Company branding and contact information
- Itemized billing details
- VAT calculations (20%)
- Payment terms and bank details
- Automatic invoice numbering

### Invoice Structure
1. **Company Header** - Company name and contact details
2. **Invoice Details** - Invoice number, date, due date, billing period
3. **Customer Information** - Customer name and email
4. **Billing Items** - Itemized list with CBM, days, rate, and amount
5. **Totals** - Subtotal, VAT, and total amount
6. **Footer** - Payment terms and bank details

## 🔐 Security

### Environment Variables
- `MONDAY_API_TOKEN` - Your Monday.com API token
- `WEBHOOK_SECRET` - Secret for webhook verification
- `NODE_ENV` - Environment (development/production)

### API Security
- Input validation on all endpoints
- Error handling with appropriate HTTP status codes
- CORS configuration for cross-origin requests
- Helmet.js for security headers

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production Deployment
1. Set `NODE_ENV=production`
2. Configure production database
3. Set up SSL certificates
4. Configure reverse proxy (nginx)
5. Set up process manager (PM2)

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 📝 Scripts

### Available NPM Scripts
- `npm start` - Start the application
- `npm run dev` - Start in development mode with nodemon
- `npm run create-board` - Create standardized board
- `npm run setup-webhooks` - Setup webhooks for automation
- `npm run monthly-billing` - Run monthly billing automation
- `npm run generate-invoice` - Generate invoices
- `npm run test-billing` - Test billing calculations

## 🐛 Troubleshooting

### Common Issues

1. **API Token Issues**
   - Verify your Monday.com API token is correct
   - Ensure you have the necessary permissions
   - Check if your Monday.com account is active

2. **Column Creation Errors**
   - Verify board permissions
   - Check column name conflicts
   - Ensure workspace access

3. **Webhook Issues**
   - Verify webhook URL is accessible
   - Check webhook secret configuration
   - Monitor webhook logs

4. **Billing Calculation Errors**
   - Verify required columns exist
   - Check data format (dates, numbers)
   - Validate column mappings

### Debug Mode
Enable debug logging by setting:
```env
NODE_ENV=development
DEBUG=monday-app:*
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

## 🔄 Version History

- **v1.0.0** - Initial release with core billing functionality
- **v1.1.0** - Added invoice generation and PDF creation
- **v1.2.0** - Added webhook automation and real-time updates
- **v1.3.0** - Added monthly billing automation and scheduling

---

**Built with ❤️ for Monday.com users** 