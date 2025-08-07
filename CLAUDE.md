# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Application Management
- `npm start` - Start the Express.js server in production mode
- `npm run dev` - Start server with nodemon for development (auto-restart on changes)
- `npm test` - Run test setup script (scripts/testSetup.js)

### Board Management  
- `npm run create-board` - Create standardized Monday.com board with predefined columns
- `npm run create-board -- --name "Custom Name" --workspace-id "12345"` - Create board with custom parameters
- `npm run setup-webhooks` - Setup webhooks for automation (scripts/setupWebhooks.js)

### Billing Operations
- `npm run test-billing` - Test billing calculations (scripts/testBillingCalculation.js)
- `npm run test-monthly` - Test new monthly billing features with month selector (testMonthlyBilling.js)
- `npm run update-bill-dates` - Update bill dates for existing boards (scripts/updateBillDates.js)
- `npm run test-bill-date` - Test bill date calculations (scripts/testBillDate.js)
- `npm run single-item` - Run single item billing calculation (singleItemBilling.js)
- `npm run storage` - Run storage billing calculator (storageBillingCalculator.js)
- `npm run monthly-billing` - Run monthly billing automation (scripts/monthlyBillingAutomation.js)

### Invoice Generation
- `npm run generate-invoice` - Generate invoices (scripts/generateInvoice.js)

### Data Management
- `npm run generate-test` - Generate test data for development (generateTestData.js)
- `npm run create-test` - Create test items on Monday.com boards (createTestItems.js)

## Architecture Overview

### Core Application Structure
This is a Node.js/Express.js application that integrates with Monday.com's API to provide automated storage billing functionality. The application follows a modular architecture with clear separation of concerns.

**Main Application (`app.js`):**
- Express server with CORS, Helmet security, and JSON middleware
- Route mounting for boards, billing, invoices, and webhooks
- Health check and root endpoints
- Cron job scheduling for automated monthly billing

**Route Structure:**
- `/api/boards` - Board creation and management operations
- `/api/billing` - Billing calculations and monthly column updates
- `/api/invoices` - Invoice generation, preview, and download
- `/webhooks` - Monday.com webhook handling and manual triggers

**Service Layer Architecture:**
- `services/mondayService.js` - Monday.com API interactions and GraphQL queries
- `services/billingService.js` - Core billing logic and calculations
- `services/invoiceService.js` - PDF generation and invoice management

### Key Business Logic

**Billing Formula:**
```
Bill Date = Date Received + Free Days
Billable Days = Days from Bill Date to End Date (month end or scan out date)
Monthly Billing = Rate × CBM × Billable Days
```

**Monday.com Board Structure:**
- Standardized boards with predefined columns that prevent easy modification
- Dynamic monthly billing columns (12 months forward from current date)
- Formula columns for automatic calculations
- Action buttons for manual billing operations
- File columns for invoice PDF storage

**Automation Features:**
- Cron-scheduled monthly billing runs (1st of each month at 9 AM)
- Webhook-triggered real-time updates when Monday.com data changes
- Automatic bill date recalculation when Date Received or Free Days change
- Dynamic monthly column creation and management (12 months forward)
- On-demand billing calculations for any specific month
- Month selector functionality for flexible billing calculations

### Environment Configuration
Required environment variables in `.env`:
- `MONDAY_API_TOKEN` - Monday.com API access token
- `MONDAY_API_URL` - Monday.com API endpoint (https://api.monday.com/v2)
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (development/production)
- `WEBHOOK_SECRET` - Secret for webhook verification

### Monday.com Integration Patterns
- Uses monday-sdk-js for API interactions
- GraphQL queries for complex board operations
- Mutation-based updates for column values
- File upload handling for invoice PDFs
- Webhook subscription management

### Frontend Integration
The application includes a separate frontend React app located in `monday-app-v2/` with:
- Webpack bundling for Monday.com app deployment (`webpack.config.js`)
- Board view component for storage billing interface (`src/BoardView.jsx`)
- Monday.com SDK integration for seamless app experience
- CDN deployment scripts for Monday.com hosting (`deploy.js`)
- Production build outputs to `deploy/` directory

### Testing and Development Utilities
- Board validation scripts to ensure proper column setup
- Billing calculation test scripts with real data scenarios
- Invoice generation testing with PDF output validation
- Webhook testing utilities for development
- Multiple standalone calculators for testing specific scenarios

## Key Development Notes

### Monthly Billing System
- **Monthly Columns**: Each item gets individual billing amounts in monthly columns (Jan 2025, Feb 2025, etc.)
- **Spreadsheet View**: The board displays like a spreadsheet with columns showing charges per item per month
- **Month Selection**: Calculate button now has "Select Month & Calculate" option for on-demand calculations
- **Available Months**: System provides past 12 months + current + next 12 months for selection
- **Individual Item Billing**: Each row shows the specific charge for that item in each monthly column

### New API Endpoints
- `POST /api/billing/calculate-specific-month` - Calculate billing for any specific month
- `GET /api/billing/available-months/:boardId` - Get available months for calculation
- `POST /webhooks/calculate-specific-month` - Handle month selector button clicks

### Environment Setup
- Requires `MONDAY_API_TOKEN` in `.env` file (see `env.example`)
- Server runs on port 3000 by default (configurable via `PORT` env var)
- Uses Monday.com GraphQL API via `monday-sdk-js`

### Data Validation
- Always validate Monday.com board structure before performing operations
- Use the billing validation endpoint (`POST /api/billing/validate-board`) before running calculations
- Test webhook endpoints locally using ngrok or similar tools

### File Storage
- Invoice PDFs are stored both locally and uploaded to Monday.com file columns
- Monthly billing columns are dynamically created based on current date (12 months forward)
- Bill dates are automatically calculated but can be manually updated via API

### Debugging
- Enable detailed logging in development mode via `NODE_ENV=development`
- Health check available at `/health` endpoint
- Use `npm run test-monthly` to test new monthly billing features
- Use standalone calculator scripts for testing individual billing scenarios