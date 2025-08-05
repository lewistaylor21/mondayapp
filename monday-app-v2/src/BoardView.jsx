import React, { useState, useEffect } from 'react';
import { mondaySdk } from 'monday-sdk-js';
import './BoardView.css';

// Initialize Monday.com SDK
const monday = mondaySdk();

const BoardView = () => {
  const [context, setContext] = useState(null);
  const [boardId, setBoardId] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');

  // Backend API URL
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000';

  useEffect(() => {
    // Initialize Monday.com app
    monday.init();
    
    // Get app context (board ID, item ID, etc.)
    monday.listen('context', (res) => {
      setContext(res.data);
      setBoardId(res.data.boardId);
      
      // Load board items when context is available
      if (res.data.boardId) {
        loadBoardItems(res.data.boardId);
      }
    });

    // Listen for board changes
    monday.listen('board', (res) => {
      if (res.data.boardId) {
        setBoardId(res.data.boardId);
        loadBoardItems(res.data.boardId);
      }
    });

  }, []);

  const loadBoardItems = async (boardId) => {
    try {
      setLoading(true);
      const response = await monday.api(`query {
        boards(ids: [${boardId}]) {
          items {
            id
            name
            column_values {
              id
              title
              value
              text
            }
          }
        }
      }`);
      
      if (response.data.boards[0]) {
        setItems(response.data.boards[0].items);
      }
    } catch (error) {
      showMessage('Error loading board items: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'info') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  // Calculate billing for current month
  const calculateCurrentMonthBilling = async () => {
    if (!boardId) {
      showMessage('No board selected', 'error');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`${BACKEND_URL}/api/billing/calculate-current-month`, {
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
        // Refresh board items to show updated billing
        loadBoardItems(boardId);
      } else {
        showMessage('Error calculating billing: ' + result.error, 'error');
      }
    } catch (error) {
      showMessage('Error calculating billing: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Generate invoices for current month
  const generateInvoices = async () => {
    if (!boardId) {
      showMessage('No board selected', 'error');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`${BACKEND_URL}/api/invoices/generate-current-month`, {
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

  // Update bill dates for all items
  const updateBillDates = async () => {
    if (!boardId) {
      showMessage('No board selected', 'error');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`${BACKEND_URL}/api/billing/update-bill-dates`, {
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
        // Refresh board items to show updated bill dates
        loadBoardItems(boardId);
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
          disabled={loading || !boardId}
        >
          {loading ? 'Calculating...' : 'Calculate Current Month Billing'}
        </button>

        <button 
          className="monday-button primary" 
          onClick={generateInvoices}
          disabled={loading || !boardId}
        >
          {loading ? 'Generating...' : 'Generate Invoices'}
        </button>

        <button 
          className="monday-button secondary" 
          onClick={updateBillDates}
          disabled={loading || !boardId}
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