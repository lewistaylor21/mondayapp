import React, { useState, useEffect } from 'react';
// Monday.com SDK loaded via CDN
import './BoardView.css';

// Initialize Monday.com SDK
const monday = window.mondaySdk();

const BoardView = () => {
  // Initialize Monday.com SDK
  const monday = window.mondaySdk();
  const [context, setContext] = useState(null);
  const [boardId, setBoardId] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sdkStatus, setSdkStatus] = useState('Initializing...');

  useEffect(() => {
    // Initialize Monday.com app
    initializeMondayApp();
  }, []);

  const initializeMondayApp = () => {
    try {
      setSdkStatus('Initializing Monday.com SDK...');
      
      // Initialize the Monday.com SDK
      monday.init();
      
      // Listen for context (board ID, authentication, etc.)
      monday.listen('context', (res) => {
        console.log('Monday.com context received:', res.data);
        const contextData = res.data;
        
        setContext(contextData);
        setSdkStatus('Connected to Monday.com');
        
        // Check for board ID and authentication
        if (contextData.boardId) {
          setBoardId(contextData.boardId);
          setIsAuthenticated(true);
          console.log(`Loading data for board ID: ${contextData.boardId}`);
          loadRealBoardData(contextData.boardId);
        } else {
          showMessage('No board context found. Please ensure the app is installed on a board.', 'error');
          setSdkStatus('No board context');
        }
      });

      // Listen for authentication changes
      monday.listen('auth', (res) => {
        console.log('Monday.com auth received:', res.data);
        setIsAuthenticated(true);
        setSdkStatus('Authenticated with Monday.com');
      });

      showMessage('Monday.com SDK initialized successfully!', 'success');
      
      // Auto-adjust height for board view
      const adjustHeight = () => {
        const height = document.body.scrollHeight;
        monday.execute('setHeight', { height });
      };
      
      // Adjust height on content changes
      const resizeObserver = new ResizeObserver(adjustHeight);
      resizeObserver.observe(document.body);
      
      // Initial height adjustment
      setTimeout(adjustHeight, 100);
    } catch (error) {
      console.error('Error initializing Monday.com SDK:', error);
      setSdkStatus('SDK Error: ' + error.message);
      showMessage('Error initializing Monday.com SDK: ' + error.message, 'error');
      // No fallback - force live data only
    }
  };

  const loadRealBoardData = async (boardId) => {
    try {
      setLoading(true);
      showMessage('Loading live board data...', 'info');
      
      // Enhanced query with better error handling and more board info
      const query = `
        query ($boardId: ID!) {
          boards(ids: [$boardId]) {
            id
            name
            description
            items_page(limit: 500) {
              cursor
              items {
                id
                name
                column_values {
                  id
                  title
                  type
                  value
                  text
                  ... on MirrorValue {
                    display_value
                  }
                  ... on StatusValue {
                    index
                    label
                  }
                  ... on NumbersValue {
                    number
                  }
                  ... on DateValue {
                    date
                    time
                  }
                }
              }
            }
          }
        }
      `;
      
      const response = await monday.api(query, { variables: { boardId: parseInt(boardId) } });
      
      console.log('Monday.com API response:', response);
      
      if (response.errors) {
        throw new Error(`GraphQL Error: ${response.errors[0].message}`);
      }
      
      if (response.error_code) {
        throw new Error(`Monday.com API Error [${response.error_code}]: ${response.error_message}`);
      }
      
      if (response.data && response.data.boards && response.data.boards[0]) {
        const board = response.data.boards[0];
        const boardItems = board.items_page.items;
        
        console.log(`Board: ${board.name}, Items found:`, boardItems.length);
        setItems(boardItems);
        
        if (boardItems.length > 0) {
          showMessage(`Loaded ${boardItems.length} items from "${board.name}"`, 'success');
        } else {
          showMessage(`Board "${board.name}" has no items. Add storage items to get started.`, 'info');
        }
      } else {
        throw new Error('Board not found or access denied');
      }
    } catch (error) {
      console.error('Error loading board data:', error);
      setItems([]);
      showMessage(`Failed to load board data: ${error.message}. Check console for details.`, 'error');
    } finally {
      setLoading(false);
    }
  };


  const showMessage = (text, type = 'info') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  // Real billing functions that call your backend
  const calculateCurrentMonthBilling = async () => {
    if (!boardId) {
      showMessage('No board selected', 'error');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('https://b4869-service-17505803-baada5af.us.monday.app/api/billing/calculate-current-month', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          boardId: boardId
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        showMessage('Current month billing calculated successfully!', 'success');
        // Refresh board data to show updated billing
        loadRealBoardData(boardId);
      } else {
        showMessage('Error calculating billing: ' + result.error, 'error');
      }
    } catch (error) {
      showMessage('Error calculating billing: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const generateInvoices = async () => {
    if (!boardId) {
      showMessage('No board selected', 'error');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('https://b4869-service-17505803-baada5af.us.monday.app/api/invoices/generate-current-month', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          boardId: boardId
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        showMessage('Invoices generated successfully!', 'success');
      } else {
        showMessage('Error generating invoices: ' + result.error, 'error');
      }
    } catch (error) {
      showMessage('Error generating invoices: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateBillDates = async () => {
    if (!boardId) {
      showMessage('No board selected', 'error');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('https://b4869-service-17505803-baada5af.us.monday.app/api/billing/update-bill-dates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          boardId: boardId
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        showMessage('Bill dates updated successfully!', 'success');
        // Refresh board data to show updated bill dates
        loadRealBoardData(boardId);
      } else {
        showMessage('Error updating bill dates: ' + result.error, 'error');
      }
    } catch (error) {
      showMessage('Error updating bill dates: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Get column value by title
  const getColumnValue = (item, columnTitle) => {
    const column = item.column_values.find(col => col.title === columnTitle);
    return column ? column.text : '';
  };

  return (
    <div className="monday-board-view">
      <div className="board-header">
        <h1>🏢 Storage Billing Dashboard</h1>
        <p>SDK Status: {sdkStatus}</p>
        <p>Authentication: {isAuthenticated ? '✅ Connected' : '❌ Not Connected'}</p>
        <p>Board ID: {boardId || 'Loading...'}</p>
      </div>

      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}

      <div className="action-buttons">
        <button 
          className="monday-button primary" 
          onClick={calculateCurrentMonthBilling}
          disabled={loading || !isAuthenticated}
        >
          {loading ? 'Calculating...' : 'Calculate Current Month Billing'}
        </button>

        <button 
          className="monday-button primary" 
          onClick={generateInvoices}
          disabled={loading || !isAuthenticated}
        >
          {loading ? 'Generating...' : 'Generate Invoices'}
        </button>

        <button 
          className="monday-button secondary" 
          onClick={updateBillDates}
          disabled={loading || !isAuthenticated}
        >
          {loading ? 'Updating...' : 'Update Bill Dates'}
        </button>
      </div>

      <div className="board-stats">
        <div className="stat-card">
          <h3>Total Items</h3>
          <p>{items.length}</p>
        </div>
        <div className="stat-card">
          <h3>Active Items</h3>
          <p>{items.filter(item => getColumnValue(item, 'Status') === 'Active').length}</p>
        </div>
        <div className="stat-card">
          <h3>Scanned Out</h3>
          <p>{items.filter(item => getColumnValue(item, 'Status') === 'Scanned Out').length}</p>
        </div>
        <div className="stat-card">
          <h3>Total Monthly Billing</h3>
          <p>£{items.reduce((total, item) => {
            const billing = parseFloat(getColumnValue(item, 'Current Month Billing')) || 0;
            return total + billing;
          }, 0).toFixed(2)}</p>
        </div>
      </div>

      <div className="items-list">
        <h2>Storage Items</h2>
        {loading ? (
          <div className="loading">Loading items...</div>
        ) : items.length > 0 ? (
          <div className="items-grid">
            {items.map(item => (
              <div key={item.id} className="item-card">
                <h4>{item.name}</h4>
                <div className="item-details">
                  <p><strong>Status:</strong> {getColumnValue(item, 'Status')}</p>
                  <p><strong>CBM:</strong> {getColumnValue(item, 'CBM')}</p>
                  <p><strong>Rate:</strong> £{getColumnValue(item, 'Rate per CBM/Day')}/day</p>
                  <p><strong>Date Received:</strong> {getColumnValue(item, 'Date Received')}</p>
                  <p><strong>Bill Date:</strong> {getColumnValue(item, 'Bill Date')}</p>
                  <p><strong>Current Month Billing:</strong> £{getColumnValue(item, 'Current Month Billing')}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-items">
            <p>No items found on this board.</p>
            <p>Add storage items to get started with billing calculations.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BoardView; 