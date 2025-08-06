// Script to manually update board view with live data fixes
const fs = require('fs');
const path = require('path');

console.log('🔧 Updating board view with live data fixes...');

// Read the current board_view.html
const boardViewPath = path.join(__dirname, 'deploy', 'board_view.html');
let boardViewHtml = fs.readFileSync(boardViewPath, 'utf8');

console.log('📝 Applying live data fixes to board_view.html...');

// Update the board view HTML to remove sample data references and improve error handling
const updatedBoardViewHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Storage Billing - Board View</title>
    <style>
        /* Monday.com Board View Styles */
        .monday-board-view {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px;
            background: #f6f7fb;
            min-height: 100vh;
        }

        .board-header {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .board-header h1 {
            margin: 0 0 8px 0;
            font-size: 24px;
            font-weight: 600;
            color: #323338;
        }

        .board-header p {
            margin: 0;
            color: #676879;
            font-size: 14px;
        }

        .message {
            padding: 12px 16px;
            border-radius: 6px;
            margin-bottom: 16px;
            font-size: 14px;
            font-weight: 500;
            border-left: 4px solid;
        }

        .message.success {
            background: #d4edda;
            color: #155724;
            border-left-color: #28a745;
        }

        .message.error {
            background: #f8d7da;
            color: #721c24;
            border-left-color: #dc3545;
        }

        .message.info {
            background: #d1ecf1;
            color: #0c5460;
            border-left-color: #17a2b8;
        }

        .action-buttons {
            display: flex;
            gap: 12px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }

        .monday-button {
            padding: 8px 16px;
            border-radius: 6px;
            border: none;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 32px;
        }

        .monday-button.primary {
            background: #0073ea;
            color: white;
        }

        .monday-button.primary:hover:not(:disabled) {
            background: #0056b3;
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .monday-button:disabled {
            background: #c3c6d4;
            color: #676879;
            cursor: not-allowed;
        }

        .loading {
            text-align: center;
            padding: 40px;
            color: #676879;
            font-size: 14px;
        }

        .no-items {
            text-align: center;
            padding: 40px;
            color: #676879;
        }

        .items-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 16px;
        }

        .item-card {
            border: 1px solid #e1e5e9;
            border-radius: 6px;
            padding: 16px;
            background: #fafbfc;
        }
    </style>
</head>
<body>
    <div id="root">
        <div class="monday-board-view">
            <div class="board-header">
                <h1>🏢 Storage Billing Dashboard</h1>
                <p>Connecting to Monday.com...</p>
            </div>
            <div class="loading">Loading board data...</div>
        </div>
    </div>

    <!-- Monday.com SDK -->
    <script src="https://cdn.monday.com/sdk/2.0.0/monday.js"></script>
    
    <script>
        console.log('🚀 Starting Monday.com Board View App');
        
        // Initialize Monday SDK
        const monday = mondaySdk();
        
        let boardId = null;
        let isAuthenticated = false;
        
        // Initialize the app
        function initializeApp() {
            try {
                console.log('Initializing Monday.com SDK...');
                monday.init();
                
                // Listen for context
                monday.listen('context', (res) => {
                    console.log('Monday.com context received:', res.data);
                    boardId = res.data.boardId;
                    isAuthenticated = true;
                    
                    updateHeader('Connected to Monday.com', \`Board ID: \${boardId}\`);
                    
                    if (boardId) {
                        loadLiveBoardData(boardId);
                    } else {
                        showError('No board context found. Please ensure the app is installed on a board.');
                    }
                });
                
                // Listen for auth
                monday.listen('auth', (res) => {
                    console.log('Monday.com auth received:', res.data);
                    isAuthenticated = true;
                });
                
                // Auto-adjust height
                const adjustHeight = () => {
                    const height = document.body.scrollHeight;
                    monday.execute('setHeight', { height });
                };
                
                new ResizeObserver(adjustHeight).observe(document.body);
                setTimeout(adjustHeight, 100);
                
            } catch (error) {
                console.error('Error initializing Monday.com SDK:', error);
                showError('Failed to initialize Monday.com SDK: ' + error.message);
            }
        }
        
        // Load live board data
        async function loadLiveBoardData(boardId) {
            try {
                showLoading('Loading live board data...');
                
                const query = \`
                    query ($boardId: ID!) {
                        boards(ids: [$boardId]) {
                            id
                            name
                            description
                            items_page(limit: 500) {
                                items {
                                    id
                                    name
                                    column_values {
                                        id
                                        title
                                        type
                                        value
                                        text
                                    }
                                }
                            }
                        }
                    }
                \`;
                
                const response = await monday.api(query, { variables: { boardId: parseInt(boardId) } });
                
                console.log('Monday.com API response:', response);
                
                if (response.errors) {
                    throw new Error(\`GraphQL Error: \${response.errors[0].message}\`);
                }
                
                if (response.error_code) {
                    throw new Error(\`Monday.com API Error [\${response.error_code}]: \${response.error_message}\`);
                }
                
                if (response.data && response.data.boards && response.data.boards[0]) {
                    const board = response.data.boards[0];
                    const items = board.items_page.items;
                    
                    console.log(\`Board: \${board.name}, Items found:\`, items.length);
                    
                    if (items.length > 0) {
                        showItems(items, board.name);
                    } else {
                        showNoItems(board.name);
                    }
                } else {
                    throw new Error('Board not found or access denied');
                }
            } catch (error) {
                console.error('Error loading board data:', error);
                showError(\`Failed to load board data: \${error.message}\`);
            }
        }
        
        // UI Helper functions
        function updateHeader(status, boardInfo) {
            document.querySelector('.board-header p').textContent = \`\${status} | \${boardInfo}\`;
        }
        
        function showLoading(message) {
            document.querySelector('#root').innerHTML = \`
                <div class="monday-board-view">
                    <div class="board-header">
                        <h1>🏢 Storage Billing Dashboard</h1>
                        <p>Connected to Monday.com | Board ID: \${boardId}</p>
                    </div>
                    <div class="loading">\${message}</div>
                </div>
            \`;
        }
        
        function showError(message) {
            document.querySelector('#root').innerHTML = \`
                <div class="monday-board-view">
                    <div class="board-header">
                        <h1>🏢 Storage Billing Dashboard</h1>
                        <p>Error occurred</p>
                    </div>
                    <div class="message error">\${message}</div>
                    <div class="no-items">
                        <p>Please check the console for more details.</p>
                        <p>Make sure the app is properly installed on a Monday.com board with storage items.</p>
                    </div>
                </div>
            \`;
        }
        
        function showNoItems(boardName) {
            document.querySelector('#root').innerHTML = \`
                <div class="monday-board-view">
                    <div class="board-header">
                        <h1>🏢 Storage Billing Dashboard</h1>
                        <p>Connected to Board: \${boardName}</p>
                    </div>
                    <div class="no-items">
                        <h3>No storage items found</h3>
                        <p>This board doesn't have any items yet.</p>
                        <p>Add storage items with the required columns (Customer Name, CBM, Rate, etc.) to get started.</p>
                    </div>
                </div>
            \`;
        }
        
        function showItems(items, boardName) {
            const getColumnValue = (item, columnTitle) => {
                const column = item.column_values.find(col => col.title === columnTitle);
                return column ? column.text || column.value || '' : '';
            };
            
            const itemsHtml = items.map(item => \`
                <div class="item-card">
                    <h4>\${item.name}</h4>
                    <div class="item-details">
                        <p><strong>Status:</strong> \${getColumnValue(item, 'Status')}</p>
                        <p><strong>CBM:</strong> \${getColumnValue(item, 'CBM')}</p>
                        <p><strong>Rate:</strong> £\${getColumnValue(item, 'Rate per CBM/Day')}/day</p>
                        <p><strong>Date Received:</strong> \${getColumnValue(item, 'Date Received')}</p>
                        <p><strong>Bill Date:</strong> \${getColumnValue(item, 'Bill Date')}</p>
                        <p><strong>Current Month Billing:</strong> £\${getColumnValue(item, 'Current Month Billing')}</p>
                    </div>
                </div>
            \`).join('');
            
            document.querySelector('#root').innerHTML = \`
                <div class="monday-board-view">
                    <div class="board-header">
                        <h1>🏢 Storage Billing Dashboard</h1>
                        <p>Connected to Board: \${boardName} | \${items.length} items loaded</p>
                    </div>
                    
                    <div class="action-buttons">
                        <button class="monday-button primary" onclick="calculateBilling()">
                            Calculate Current Month Billing
                        </button>
                        <button class="monday-button primary" onclick="generateInvoices()">
                            Generate Invoices
                        </button>
                    </div>
                    
                    <div class="items-list">
                        <h2>Storage Items (\${items.length} total)</h2>
                        <div class="items-grid">
                            \${itemsHtml}
                        </div>
                    </div>
                </div>
            \`;
        }
        
        // Action functions
        async function calculateBilling() {
            if (!boardId) return;
            
            try {
                showLoading('Calculating billing...');
                
                const response = await fetch('https://b4869-service-17505803-baada5af.us.monday.app/api/billing/calculate-current-month', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        boardId: boardId
                    })
                });
                
                if (response.ok) {
                    // Reload the board data to show updated billing
                    loadLiveBoardData(boardId);
                } else {
                    const error = await response.json();
                    showError('Error calculating billing: ' + error.message);
                }
            } catch (error) {
                showError('Error calculating billing: ' + error.message);
            }
        }
        
        async function generateInvoices() {
            if (!boardId) return;
            
            try {
                showLoading('Generating invoices...');
                
                const response = await fetch('https://b4869-service-17505803-baada5af.us.monday.app/api/invoices/generate-current-month', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        boardId: boardId
                    })
                });
                
                if (response.ok) {
                    alert('Invoices generated successfully!');
                } else {
                    const error = await response.json();
                    showError('Error generating invoices: ' + error.message);
                }
            } catch (error) {
                showError('Error generating invoices: ' + error.message);
            }
        }
        
        // Start the app
        initializeApp();
    </script>
</body>
</html>`;

// Write the updated board view HTML
fs.writeFileSync(boardViewPath, updatedBoardViewHtml);

console.log('✅ Board view updated successfully!');
console.log('🔗 The updated board view will:');
console.log('   - Show ONLY live data from your Monday.com board');
console.log('   - Remove all sample/demo data');
console.log('   - Provide better error messages');
console.log('   - Work with your actual board structure');
console.log('');
console.log('📝 Next steps:');
console.log('   1. Deploy the updated files to Monday.com');
console.log('   2. Test the board view in your Monday.com app');
console.log('   3. Check that live data loads properly');