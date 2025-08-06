# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Application Management
- `npm start` - Start the Express.js server in production mode
- `npm run dev` - Start server with nodemon for development (auto-restart on changes)
- `npm test` - Run test setup script (scripts/testSetup.js)

### Board Management
- `npm run create-board` - Create standardized Monday.com board with predefined columns
- `npm run create-board -- --name "Custom Name" --workspace-id "12345"` - Create board with custom parameters

### Billing Operations
- `npm run test-billing` - Test billing calculations (scripts/testBillingCalculation.js)
- `npm run update-bill-dates` - Update bill dates for existing boards
- `npm run test-bill-date` - Test bill date calculations
- `npm run single-item` - Run single item billing calculation
- `npm run storage` - Run storage billing calculator

### Invoice Generation
- `npm run generate-invoice` - Generate invoices (scripts/generateInvoice.js)
- `npm run monthly-billing` - Run monthly billing automation

### Data Management
- `npm run generate-test` - Generate test data for development
- `npm run create-test` - Create test items on Monday.com boards

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
- Dynamic monthly column creation and management

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
- Webpack bundling for Monday.com app deployment
- Board view component for storage billing interface
- Monday.com SDK integration for seamless app experience
- CDN deployment scripts for Monday.com hosting

### Testing and Validation
- Board validation scripts to ensure proper column setup
- Billing calculation test scripts with real data scenarios
- Invoice generation testing with PDF output validation
- Webhook testing utilities for development

## Important Notes for Development

- Always validate Monday.com board structure before performing operations
- Use the billing validation endpoint before running calculations
- Test webhook endpoints locally using ngrok or similar tools
- Invoice PDFs are stored both locally and uploaded to Monday.com file columns
- Monthly billing columns are dynamically created based on current date
- Bill dates are automatically calculated but can be manually updated via API