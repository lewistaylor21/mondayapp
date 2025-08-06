import React, { useState, useEffect } from 'react';
// import { mondaySdk } from 'monday-sdk-js';
import './App.css';

// Initialize Monday.com SDK
// const monday = mondaySdk();

const App = () => {
  const [context, setContext] = useState(null);
  const [boards, setBoards] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [isMondayEnvironment, setIsMondayEnvironment] = useState(false);

  // Backend API URL - update this to your deployed backend
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://b4869-service-17505803-baada5af.us.monday.app';

  useEffect(() => {
    // Check if we're in Monday.com environment
    const checkMondayEnvironment = () => {
      try {
        // Check if Monday.com SDK is available
        if (window.mondaySdk) {
          setIsMondayEnvironment(true);
          // Initialize Monday.com app
          // const monday = window.mondaySdk();
          // monday.init();
          
          // Get app context
          // monday.listen('context', (res) => {
          //   setContext(res.data);
          // });

          // Load boards
          // loadBoards();
        } else {
          setIsMondayEnvironment(false);
          showMessage('Running in standalone mode (not in Monday.com environment)', 'info');
        }
      } catch (error) {
        setIsMondayEnvironment(false);
        showMessage('Running in standalone mode - Monday.com SDK not available', 'info');
      }
    };

    checkMondayEnvironment();
  }, []);

  const loadBoards = async () => {
    try {
      setLoading(true);
      if (isMondayEnvironment) {
        // const response = await monday.api(`query {
        //   boards {
        //     id
        //     name
        //     workspace_id
        //   }
        // }`);
        // setBoards(response.data.boards);
      } else {
        // Mock data for standalone mode
        setBoards([
          { id: '1', name: 'Storage Billing Board 1' },
          { id: '2', name: 'Storage Billing Board 2' }
        ]);
      }
    } catch (error) {
      showMessage('Error loading boards: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'info') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  // Create a new storage billing board
  const createBillingBoard = async () => {
    try {
      setLoading(true);
      
      if (isMondayEnvironment) {
        // Call your existing backend API
        const response = await fetch(`${BACKEND_URL}/api/boards/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'Storage Billing Board',
            workspaceId: context?.workspaceId
          })
        });

        const result = await response.json();
        
        if (response.ok) {
          showMessage('Storage billing board created successfully!', 'success');
          loadBoards(); // Refresh boards list
        } else {
          showMessage('Error creating board: ' + result.error, 'error');
        }
      } else {
        // Mock response for standalone mode
        showMessage('Board creation simulated (not in Monday.com environment)', 'success');
        loadBoards();
      }
    } catch (error) {
      showMessage('Error creating board: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Calculate billing for current month
  const calculateCurrentMonthBilling = async () => {
    if (!selectedBoard) {
      showMessage('Please select a board first', 'error');
      return;
    }

    try {
      setLoading(true);
      
      if (isMondayEnvironment) {
        const response = await fetch(`${BACKEND_URL}/api/billing/calculate-current-month`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            boardId: selectedBoard
          })
        });

        const result = await response.json();
        
        if (response.ok) {
          showMessage('Current month billing calculated successfully!', 'success');
        } else {
          showMessage('Error calculating billing: ' + result.error, 'error');
        }
      } else {
        showMessage('Billing calculation simulated (not in Monday.com environment)', 'success');
      }
    } catch (error) {
      showMessage('Error calculating billing: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Generate invoices for current month
  const generateInvoices = async () => {
    if (!selectedBoard) {
      showMessage('Please select a board first', 'error');
      return;
    }

    try {
      setLoading(true);
      
      if (isMondayEnvironment) {
        const response = await fetch(`${BACKEND_URL}/api/invoices/generate-current-month`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            boardId: selectedBoard
          })
        });

        const result = await response.json();
        
        if (response.ok) {
          showMessage('Invoices generated successfully!', 'success');
        } else {
          showMessage('Error generating invoices: ' + result.error, 'error');
        }
      } else {
        showMessage('Invoice generation simulated (not in Monday.com environment)', 'success');
      }
    } catch (error) {
      showMessage('Error generating invoices: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Update bill dates for all items
  const updateBillDates = async () => {
    if (!selectedBoard) {
      showMessage('Please select a board first', 'error');
      return;
    }

    try {
      setLoading(true);
      
      if (isMondayEnvironment) {
        const response = await fetch(`${BACKEND_URL}/api/billing/update-bill-dates`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            boardId: selectedBoard
          })
        });

        const result = await response.json();
        
        if (response.ok) {
          showMessage('Bill dates updated successfully!', 'success');
        } else {
          showMessage('Error updating bill dates: ' + result.error, 'error');
        }
      } else {
        showMessage('Bill date updates simulated (not in Monday.com environment)', 'success');
      }
    } catch (error) {
      showMessage('Error updating bill dates: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="app-header">
        <h1>🏢 Storage Billing App</h1>
        <p>Automated storage billing with dynamic monthly columns and invoice generation</p>
        {!isMondayEnvironment && (
          <div style={{ marginTop: '10px', fontSize: '14px', opacity: 0.9 }}>
            📝 <strong>Standalone Mode:</strong> This app is designed to work within Monday.com
          </div>
        )}
      </div>

      <div className="app-content">
        {message && (
          <div className={`status ${messageType}`}>
            {message}
          </div>
        )}

        <div className="card">
          <h2>📋 Board Management</h2>
          
          <button 
            className="button" 
            onClick={createBillingBoard}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Storage Billing Board'}
          </button>

          <div style={{ marginTop: '20px' }}>
            <h3>Select a Board:</h3>
            <select 
              value={selectedBoard || ''} 
              onChange={(e) => setSelectedBoard(e.target.value)}
              style={{ padding: '8px', marginRight: '10px', minWidth: '200px' }}
            >
              <option value="">Choose a board...</option>
              {boards.map(board => (
                <option key={board.id} value={board.id}>
                  {board.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedBoard && (
          <div className="card">
            <h2>🧮 Billing Operations</h2>
            
            <button 
              className="button" 
              onClick={calculateCurrentMonthBilling}
              disabled={loading}
            >
              {loading ? 'Calculating...' : 'Calculate Current Month Billing'}
            </button>

            <button 
              className="button" 
              onClick={generateInvoices}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate Invoices'}
            </button>

            <button 
              className="button secondary" 
              onClick={updateBillDates}
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Bill Dates'}
            </button>
          </div>
        )}

        <div className="card">
          <h2>📊 Board Information</h2>
          <p><strong>Total Boards:</strong> {boards.length}</p>
          {selectedBoard && (
            <p><strong>Selected Board:</strong> {boards.find(b => b.id === selectedBoard)?.name}</p>
          )}
          {context && (
            <p><strong>Workspace ID:</strong> {context.workspaceId}</p>
          )}
          <p><strong>Environment:</strong> {isMondayEnvironment ? 'Monday.com' : 'Standalone'}</p>
        </div>

        <div className="card">
          <h2>🔗 API Endpoints</h2>
          <p><strong>Backend URL:</strong> {BACKEND_URL}</p>
          <p><strong>Health Check:</strong> <a href={`${BACKEND_URL}/health`} target="_blank" rel="noopener noreferrer">Check Backend Status</a></p>
        </div>

        {!isMondayEnvironment && (
          <div className="card">
            <h2>🚀 Next Steps for Monday.com Integration</h2>
            <p>To use this app in Monday.com:</p>
            <ol>
              <li>Deploy your backend to a cloud service (Heroku, Vercel, etc.)</li>
              <li>Deploy this frontend to a static hosting service</li>
              <li>Register your app in the Monday.com Developer Portal</li>
              <li>Configure the app URL and webhook endpoints</li>
              <li>Install the app in your Monday.com workspace</li>
            </ol>
            <p><strong>Current Mode:</strong> This is a preview of the app interface. In Monday.com, it will have full functionality.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App; 