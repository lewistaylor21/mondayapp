const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const mondayService = require('./mondayService');
const billingService = require('./billingService');

class InvoiceService {
    constructor() {
        this.invoiceStoragePath = process.env.STORAGE_PATH || './invoices';
        this.ensureInvoiceDirectory();
    }

    // Ensure invoice directory exists
    ensureInvoiceDirectory() {
        if (!fs.existsSync(this.invoiceStoragePath)) {
            fs.mkdirSync(this.invoiceStoragePath, { recursive: true });
        }
    }

    // Generate invoice number
    generateInvoiceNumber() {
        const timestamp = moment().format('YYYYMMDDHHmmss');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `INV-${timestamp}-${random}`;
    }

    // Generate PDF invoice
    async generateInvoicePDF(invoiceData) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                const filename = `invoice_${invoiceData.invoiceNumber}.pdf`;
                const filepath = path.join(this.invoiceStoragePath, filename);
                
                const stream = fs.createWriteStream(filepath);
                doc.pipe(stream);

                // Add company header
                this.addCompanyHeader(doc);
                
                // Add invoice details
                this.addInvoiceDetails(doc, invoiceData);
                
                // Add customer information
                this.addCustomerInfo(doc, invoiceData.customer);
                
                // Add billing items
                this.addBillingItems(doc, invoiceData.items);
                
                // Add totals
                this.addTotals(doc, invoiceData);
                
                // Add footer
                this.addFooter(doc);

                doc.end();

                stream.on('finish', () => {
                    resolve({
                        filename,
                        filepath,
                        invoiceNumber: invoiceData.invoiceNumber
                    });
                });

                stream.on('error', reject);

            } catch (error) {
                reject(error);
            }
        });
    }

    // Add company header to PDF
    addCompanyHeader(doc) {
        doc.fontSize(24)
           .font('Helvetica-Bold')
           .text('STORAGE BILLING COMPANY', { align: 'center' });
        
        doc.fontSize(12)
           .font('Helvetica')
           .text('123 Storage Way, Business District', { align: 'center' })
           .text('London, UK L1 2AB', { align: 'center' })
           .text('Phone: +44 20 1234 5678 | Email: billing@storagecompany.com', { align: 'center' });
        
        doc.moveDown(2);
    }

    // Add invoice details to PDF
    addInvoiceDetails(doc, invoiceData) {
        doc.fontSize(18)
           .font('Helvetica-Bold')
           .text('INVOICE', { align: 'right' });
        
        doc.fontSize(12)
           .font('Helvetica')
           .text(`Invoice Number: ${invoiceData.invoiceNumber}`, { align: 'right' })
           .text(`Date: ${moment(invoiceData.invoiceDate).format('DD/MM/YYYY')}`, { align: 'right' })
           .text(`Due Date: ${moment(invoiceData.dueDate).format('DD/MM/YYYY')}`, { align: 'right' })
           .text(`Billing Period: ${invoiceData.billingPeriod}`, { align: 'right' });
        
        doc.moveDown(2);
    }

    // Add customer information to PDF
    addCustomerInfo(doc, customer) {
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('Bill To:');
        
        doc.fontSize(12)
           .font('Helvetica')
           .text(customer.name)
           .text(customer.email || '');
        
        doc.moveDown(2);
    }

    // Add billing items to PDF
    addBillingItems(doc, items) {
        // Table header
        doc.fontSize(12)
           .font('Helvetica-Bold');
        
        const tableTop = doc.y;
        const itemCodeX = 50;
        const descriptionX = 150;
        const quantityX = 350;
        const rateX = 420;
        const amountX = 500;

        doc.text('Item', itemCodeX, tableTop)
           .text('Description', descriptionX, tableTop)
           .text('Days', quantityX, tableTop)
           .text('Rate/Day', rateX, tableTop)
           .text('Amount', amountX, tableTop);

        doc.moveDown(1);

        // Table content
        let yPosition = doc.y;
        
        items.forEach((item, index) => {
            doc.fontSize(10)
               .font('Helvetica');
            
            doc.text(item.itemName, itemCodeX, yPosition)
               .text(`CBM: ${item.cbm}`, descriptionX, yPosition)
               .text(item.billableDays.toString(), quantityX, yPosition)
               .text(`£${item.rate.toFixed(2)}`, rateX, yPosition)
               .text(`£${item.billingAmount.toFixed(2)}`, amountX, yPosition);
            
            yPosition += 20;
            
            if (index < items.length - 1) {
                doc.moveDown(0.5);
            }
        });

        doc.moveDown(2);
    }

    // Add totals to PDF
    addTotals(doc, invoiceData) {
        const totalsX = 400;
        let yPosition = doc.y;

        doc.fontSize(12)
           .font('Helvetica-Bold');

        doc.text('Subtotal:', totalsX, yPosition)
           .text(`£${invoiceData.subtotal.toFixed(2)}`, totalsX + 100, yPosition);
        
        yPosition += 20;
        
        doc.text('VAT (20%):', totalsX, yPosition)
           .text(`£${invoiceData.vat.toFixed(2)}`, totalsX + 100, yPosition);
        
        yPosition += 20;
        
        doc.fontSize(14)
           .text('Total:', totalsX, yPosition)
           .text(`£${invoiceData.total.toFixed(2)}`, totalsX + 100, yPosition);
        
        doc.moveDown(2);
    }

    // Add footer to PDF
    addFooter(doc) {
        doc.fontSize(10)
           .font('Helvetica')
           .text('Payment Terms: Net 30 days', { align: 'center' })
           .text('Please include invoice number with payment', { align: 'center' })
           .text('Bank: Storage Bank | Sort Code: 12-34-56 | Account: 12345678', { align: 'center' });
    }

    // Generate invoice for a customer
    async generateInvoiceForCustomer(boardId, customerId, month, year) {
        try {
            console.log(`🧾 Generating invoice for customer ${customerId} - ${moment().month(month).format('MMMM')} ${year}`);
            
            // Get customer's billing data
            const billingData = await this.getCustomerBillingData(boardId, customerId, month, year);
            
            if (!billingData || billingData.items.length === 0) {
                throw new Error('No billing data found for customer');
            }
            
            // Calculate totals
            const subtotal = billingData.items.reduce((sum, item) => sum + item.billingAmount, 0);
            const vat = subtotal * 0.20; // 20% VAT
            const total = subtotal + vat;
            
            // Create invoice data
            const invoiceData = {
                invoiceNumber: this.generateInvoiceNumber(),
                invoiceDate: new Date(),
                dueDate: moment().add(30, 'days').toDate(),
                billingPeriod: `${moment().month(month).format('MMMM')} ${year}`,
                customer: billingData.customer,
                items: billingData.items,
                subtotal,
                vat,
                total
            };
            
            // Generate PDF
            const pdfResult = await this.generateInvoicePDF(invoiceData);
            
            // Update Monday.com board with invoice information
            await this.updateInvoiceOnBoard(boardId, customerId, invoiceData, pdfResult);
            
            console.log(`✅ Invoice generated: ${pdfResult.filename}`);
            
            return {
                invoiceData,
                pdfResult
            };
            
        } catch (error) {
            console.error('❌ Error generating invoice:', error);
            throw error;
        }
    }

    // Get customer billing data
    async getCustomerBillingData(boardId, customerId, month, year) {
        try {
            // Get all items from the board
            const items = await mondayService.getBoardItems(boardId);
            
            // Filter items for the specific customer
            const customerItems = items.filter(item => {
                // This would need to be implemented based on actual column structure
                // For now, we'll use a simplified approach
                return item.name.includes(customerId) || item.id === customerId;
            });
            
            if (customerItems.length === 0) {
                return null;
            }
            
            // Calculate billing for each item
            const billingItems = [];
            let customer = null;
            
            for (const item of customerItems) {
                const itemData = billingService.extractItemData(item);
                const billingResult = billingService.calculateItemBilling(itemData, month, year);
                
                if (billingResult && billingResult.billingAmount > 0) {
                    billingItems.push(billingResult);
                    
                    // Set customer info from first item
                    if (!customer) {
                        customer = {
                            name: billingResult.itemName,
                            email: this.getCustomerEmail(item)
                        };
                    }
                }
            }
            
            return {
                customer,
                items: billingItems
            };
            
        } catch (error) {
            console.error('❌ Error getting customer billing data:', error);
            throw error;
        }
    }

    // Get customer email from item
    getCustomerEmail(item) {
        // This would need to be implemented based on actual column structure
        // For now, return a placeholder
        return 'customer@example.com';
    }

    // Update invoice information on Monday.com board
    async updateInvoiceOnBoard(boardId, customerId, invoiceData, pdfResult) {
        try {
            // Get invoice columns
            const invoiceNumberColumnId = await mondayService.getColumnIdByTitle(boardId, 'Invoice Number');
            const invoiceDateColumnId = await mondayService.getColumnIdByTitle(boardId, 'Invoice Date');
            const invoiceStatusColumnId = await mondayService.getColumnIdByTitle(boardId, 'Invoice Status');
            const invoiceAmountColumnId = await mondayService.getColumnIdByTitle(boardId, 'Invoice Amount');
            
            // Update customer's invoice information
            if (invoiceNumberColumnId) {
                await mondayService.updateItemColumnValue(customerId, invoiceNumberColumnId, { text: invoiceData.invoiceNumber });
            }
            
            if (invoiceDateColumnId) {
                await mondayService.updateItemColumnValue(customerId, invoiceDateColumnId, { date: moment(invoiceData.invoiceDate).format('YYYY-MM-DD') });
            }
            
            if (invoiceStatusColumnId) {
                await mondayService.updateItemColumnValue(customerId, invoiceStatusColumnId, { label: 'Generated' });
            }
            
            if (invoiceAmountColumnId) {
                await mondayService.updateItemColumnValue(customerId, invoiceAmountColumnId, { number: invoiceData.total });
            }
            
            console.log(`✅ Updated invoice information on board for customer ${customerId}`);
            
        } catch (error) {
            console.error('❌ Error updating invoice on board:', error);
            throw error;
        }
    }

    // Generate invoices for all customers on a board for a specific month
    async generateMonthlyInvoices(boardId, month, year) {
        try {
            console.log(`🧾 Generating monthly invoices for board ${boardId} - ${moment().month(month).format('MMMM')} ${year}`);
            
            // Get all items from the board
            const items = await mondayService.getBoardItems(boardId);
            
            const results = [];
            
            // Group items by customer (simplified approach)
            const customerGroups = this.groupItemsByCustomer(items);
            
            for (const [customerId, customerItems] of Object.entries(customerGroups)) {
                try {
                    const result = await this.generateInvoiceForCustomer(boardId, customerId, month, year);
                    results.push(result);
                } catch (error) {
                    console.error(`❌ Error generating invoice for customer ${customerId}:`, error);
                }
            }
            
            console.log(`✅ Generated ${results.length} invoices`);
            return results;
            
        } catch (error) {
            console.error('❌ Error generating monthly invoices:', error);
            throw error;
        }
    }

    // Group items by customer (simplified implementation)
    groupItemsByCustomer(items) {
        const groups = {};
        
        items.forEach(item => {
            // This is a simplified grouping - in production, you'd use actual customer ID columns
            const customerId = item.id; // Using item ID as customer ID for now
            if (!groups[customerId]) {
                groups[customerId] = [];
            }
            groups[customerId].push(item);
        });
        
        return groups;
    }
}

module.exports = new InvoiceService(); 