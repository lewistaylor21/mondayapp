const mondaySdk = require('monday-sdk-js');
const moment = require('moment');

// Initialize Monday.com SDK
const monday = mondaySdk();

// Set API token
monday.setToken(process.env.MONDAY_API_TOKEN);

class MondayService {
    constructor() {
        this.api = monday.api;
    }

    // Create a standardized storage billing board
    async createStandardizedBoard(boardName, workspaceId = null) {
        try {
            console.log(`🏗️ Creating standardized board: ${boardName}`);
            
            // Create the board
            const createBoardQuery = `
                mutation CreateBoard($boardName: String!, $boardKind: BoardKind!, $workspaceId: ID) {
                    create_board(
                        board_name: $boardName,
                        board_kind: $boardKind,
                        workspace_id: $workspaceId
                    ) {
                        id
                        name
                        workspace_id
                    }
                }
            `;
            
            const boardResult = await this.api(createBoardQuery, {
                boardName: `${boardName} - Storage Billing`,
                boardKind: 'private',
                workspaceId
            });
            
            const boardId = boardResult.data.create_board.id;
            console.log(`✅ Board created with ID: ${boardId}`);
            
            // Add standardized columns
            await this.addStandardColumns(boardId);
            
            // Add monthly billing columns for next 12 months
            await this.addMonthlyBillingColumns(boardId);
            
            // Add action buttons
            await this.addBillingActionButtons(boardId);
            
            return boardResult.data.create_board;
            
        } catch (error) {
            console.error('❌ Error creating standardized board:', error);
            throw error;
        }
    }

    // Add standard columns to the board
    async addStandardColumns(boardId) {
        const standardColumns = [
            { title: 'Customer Name', type: 'name', required: true },
            { title: 'Date Received', type: 'date', required: true },
            { title: 'Free Days', type: 'numeric', default: 0 },
            { title: 'CBM', type: 'numbers', required: true },
            { title: 'Rate per CBM/Day', type: 'numeric', required: true },
            { title: 'Date Out', type: 'date' },
            { title: 'Status', type: 'status', options: ['Active', 'Scanned Out'] },
            { title: 'Customer Email', type: 'email' },
            { title: 'Bill Date', type: 'date' }, // NEW: Bill Date column
            { title: 'Billing Start Date', type: 'formula' },
            { title: 'Total Billable Days', type: 'formula' },
            { title: 'Current Month Billing', type: 'formula' }
        ];

        console.log(`📊 Adding ${standardColumns.length} standard columns to board ${boardId}`);
        
        for (const column of standardColumns) {
            await this.createColumn(boardId, column);
        }
    }

    // Add monthly billing columns for next 12 months
    async addMonthlyBillingColumns(boardId) {
        console.log(`📅 Adding monthly billing columns for next 12 months`);
        
        for (let i = 0; i < 12; i++) {
            const futureDate = moment().add(i, 'months');
            const monthName = futureDate.format('MMMM');
            const year = futureDate.format('YYYY');
            const monthNumber = futureDate.month();
            
            const columnTitle = `${monthName} ${year} Billing`;
            const columnId = `billing_${year}_${(monthNumber + 1).toString().padStart(2, '0')}`;
            
            const column = {
                title: columnTitle,
                type: 'numeric',
                settings: {
                    currency: 'GBP',
                    precision: 2
                }
            };
            
            await this.createColumn(boardId, column);
            console.log(`✅ Added column: ${columnTitle}`);
        }
    }

    // Add billing action buttons
    async addBillingActionButtons(boardId) {
        console.log(`🔘 Adding billing action buttons to board ${boardId}`);
        
        const buttonColumn = {
            title: 'Billing Actions',
            type: 'buttons',
            settings: {
                buttons: [
                    {
                        label: 'Calculate Current Month',
                        action: 'calculate_current_month',
                        parameters: {}
                    },
                    {
                        label: 'Calculate Last Month',
                        action: 'calculate_last_month',
                        parameters: {}
                    },
                    {
                        label: 'Select Month & Calculate',
                        action: 'calculate_specific_month',
                        parameters: {}
                    },
                    {
                        label: 'Generate Invoice',
                        action: 'generate_invoice',
                        parameters: {}
                    },
                    {
                        label: 'Recalculate All',
                        action: 'recalculate_all',
                        parameters: {}
                    }
                ]
            }
        };
        
        await this.createColumn(boardId, buttonColumn);
    }

    // Create a column on the board
    async createColumn(boardId, columnConfig) {
        try {
            const createColumnQuery = `
                mutation CreateColumn($boardId: ID!, $columnType: ColumnType!, $title: String!, $settings: JSON) {
                    create_column(
                        board_id: $boardId,
                        column_type: $columnType,
                        title: $title,
                        settings: $settings
                    ) {
                        id
                        title
                        type
                    }
                }
            `;
            
            const result = await this.api(createColumnQuery, {
                boardId,
                columnType: columnConfig.type.toUpperCase(),
                title: columnConfig.title,
                settings: columnConfig.settings ? JSON.stringify(columnConfig.settings) : null
            });
            
            console.log(`✅ Column created: ${columnConfig.title} (ID: ${result.data.create_column.id})`);
            return result.data.create_column;
            
        } catch (error) {
            console.error(`❌ Error creating column ${columnConfig.title}:`, error);
            throw error;
        }
    }

    // Get board columns
    async getBoardColumns(boardId) {
        try {
            const query = `
                query GetBoard($boardId: ID!) {
                    boards(ids: [$boardId]) {
                        columns {
                            id
                            title
                            type
                            settings_str
                        }
                    }
                }
            `;
            
            const result = await this.api(query, { boardId });
            return result.data.boards[0].columns;
            
        } catch (error) {
            console.error('❌ Error getting board columns:', error);
            throw error;
        }
    }

    // Get items from board
    async getBoardItems(boardId) {
        try {
            const query = `
                query GetBoardItems($boardId: ID!) {
                    boards(ids: [$boardId]) {
                        items {
                            id
                            name
                            column_values {
                                id
                                value
                                text
                            }
                        }
                    }
                }
            `;
            
            const result = await this.api(query, { boardId });
            return result.data.boards[0].items;
            
        } catch (error) {
            console.error('❌ Error getting board items:', error);
            throw error;
        }
    }

    // Update item column value
    async updateItemColumnValue(itemId, columnId, value) {
        try {
            const mutation = `
                mutation ChangeColumnValue($itemId: ID!, $columnId: String!, $value: JSON!) {
                    change_column_value(
                        item_id: $itemId,
                        column_id: $columnId,
                        value: $value
                    ) {
                        id
                        name
                    }
                }
            `;
            
            const result = await this.api(mutation, {
                itemId,
                columnId,
                value: JSON.stringify(value)
            });
            
            return result.data.change_column_value;
            
        } catch (error) {
            console.error('❌ Error updating item column value:', error);
            throw error;
        }
    }

    // Create webhook for board
    async createWebhook(boardId, webhookUrl) {
        try {
            const mutation = `
                mutation CreateWebhook($boardId: ID!, $url: String!, $event: WebhookEventType!) {
                    create_webhook(
                        board_id: $boardId,
                        url: $url,
                        event: $event
                    ) {
                        id
                        board_id
                        url
                        event
                    }
                }
            `;
            
            const result = await this.api(mutation, {
                boardId,
                url: webhookUrl,
                event: 'UPDATE_COLUMN_VALUE'
            });
            
            console.log(`✅ Webhook created for board ${boardId}`);
            return result.data.create_webhook;
            
        } catch (error) {
            console.error('❌ Error creating webhook:', error);
            throw error;
        }
    }

    // Get column ID by title
    async getColumnIdByTitle(boardId, columnTitle) {
        try {
            const columns = await this.getBoardColumns(boardId);
            const column = columns.find(col => col.title === columnTitle);
            return column ? column.id : null;
        } catch (error) {
            console.error('❌ Error getting column ID by title:', error);
            throw error;
        }
    }

    // Get monthly billing column ID
    async getMonthlyBillingColumnId(boardId, month, year) {
        const monthName = moment().month(month).format('MMMM');
        const columnTitle = `${monthName} ${year} Billing`;
        return await this.getColumnIdByTitle(boardId, columnTitle);
    }

    // NEW: Calculate and update bill date for an item
    async updateBillDateForItem(boardId, itemId, dateReceived, freeDays) {
        try {
            // Validate inputs
            if (!dateReceived) {
                console.log(`⚠️ Cannot calculate bill date for item ${itemId}: missing date received`);
                return;
            }
            
            if (freeDays === null || freeDays === undefined) {
                console.log(`⚠️ Cannot calculate bill date for item ${itemId}: free days is null or undefined`);
                return;
            }
            
            // Convert freeDays to number if it's a string
            const freeDaysNumber = typeof freeDays === 'string' ? parseFloat(freeDays) : freeDays;
            
            if (isNaN(freeDaysNumber)) {
                console.log(`⚠️ Cannot calculate bill date for item ${itemId}: invalid free days value: ${freeDays}`);
                return;
            }

            // Calculate bill date (date received + free days)
            const billDate = moment(dateReceived).add(freeDaysNumber, 'days').toDate();
            
            // Validate the calculated bill date
            if (!moment(billDate).isValid()) {
                console.error(`❌ Invalid bill date calculated for item ${itemId}: ${billDate}`);
                return;
            }
            
            // Get the Bill Date column ID
            const billDateColumnId = await this.getColumnIdByTitle(boardId, 'Bill Date');
            
            if (!billDateColumnId) {
                console.error(`❌ Bill Date column not found on board ${boardId}`);
                return;
            }

            // Update the Bill Date column
            await this.updateItemColumnValue(itemId, billDateColumnId, billDate);
            
            // Log the calculation details
            const dateReceivedFormatted = moment(dateReceived).format('YYYY-MM-DD');
            const billDateFormatted = moment(billDate).format('YYYY-MM-DD');
            
            if (freeDaysNumber === 0) {
                console.log(`✅ Updated Bill Date for item ${itemId}: ${billDateFormatted} (same as Date Received: ${dateReceivedFormatted})`);
            } else if (freeDaysNumber > 0) {
                console.log(`✅ Updated Bill Date for item ${itemId}: ${billDateFormatted} (${dateReceivedFormatted} + ${freeDaysNumber} days)`);
            } else {
                console.log(`✅ Updated Bill Date for item ${itemId}: ${billDateFormatted} (${dateReceivedFormatted} + ${freeDaysNumber} days = ${Math.abs(freeDaysNumber)} days before)`);
            }
            
        } catch (error) {
            console.error(`❌ Error updating bill date for item ${itemId}:`, error);
        }
    }

    // NEW: Update bill dates for all items on a board
    async updateAllBillDates(boardId) {
        try {
            console.log(`🔄 Updating bill dates for all items on board ${boardId}`);
            
            const items = await this.getBoardItems(boardId);
            let updatedCount = 0;
            
            for (const item of items) {
                const itemData = this.extractItemData(item);
                
                // Extract date received and free days
                const dateReceived = this.parseDateFromColumn(itemData.columnValues['date__1']);
                const freeDays = this.parseNumberFromColumn(itemData.columnValues['numeric_mkqfs7n9']);
                
                if (dateReceived && freeDays !== null) {
                    await this.updateBillDateForItem(boardId, item.id, dateReceived, freeDays);
                    updatedCount++;
                }
            }
            
            console.log(`✅ Updated bill dates for ${updatedCount} items on board ${boardId}`);
            return updatedCount;
            
        } catch (error) {
            console.error(`❌ Error updating bill dates for board ${boardId}:`, error);
            throw error;
        }
    }

    // Helper method to parse date from column value
    parseDateFromColumn(columnValue) {
        if (!columnValue || !columnValue.value) return null;
        
        try {
            const parsed = JSON.parse(columnValue.value);
            return parsed.date ? moment(parsed.date).toDate() : null;
        } catch (error) {
            return null;
        }
    }

    // Helper method to parse number from column value
    parseNumberFromColumn(columnValue) {
        if (!columnValue || !columnValue.value) return 0;
        
        try {
            const parsed = JSON.parse(columnValue.value);
            return parsed.number || parseFloat(columnValue.text) || 0;
        } catch (error) {
            return parseFloat(columnValue.text) || 0;
        }
    }

    // Helper method to extract item data
    extractItemData(item) {
        const columnValues = {};
        
        item.column_values.forEach(col => {
            columnValues[col.id] = {
                value: col.value,
                text: col.text
            };
        });
        
        return {
            id: item.id,
            name: item.name,
            columnValues
        };
    }
}

module.exports = new MondayService(); 