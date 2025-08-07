import React, { useState, useEffect } from 'react';
// Monday.com SDK loaded via CDN
import './BoardView.css';
import MonthSelector from './components/MonthSelector';
import MonthlyBillingTable from './components/MonthlyBillingTable';
import CalculateActionsPanel from './components/CalculateActionsPanel';

// Initialize Monday.com SDK
const monday = window.mondaySdk();

const BoardView = () => {
  // Initialize Monday.com SDK
  const monday = window.mondaySdk();
  const [context, setContext] = useState(null);
  const [boardId, setBoardId] = useState(null);
  const [boardData, setBoardData] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sdkStatus, setSdkStatus] = useState('Initializing...');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthSelectorOpen, setMonthSelectorOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    scannedOut: 0,
    totalBilling: 0
  });

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
            columns {
              id
              title
              type
              settings_str
            }
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
        setBoardData(board);
        setItems(boardItems);
        calculateStats(boardItems);
        
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

  // Calculate statistics
  const calculateStats = (items) => {
    const newStats = {
      total: items.length,
      active: 0,
      scannedOut: 0,
      totalBilling: 0
    };

    items.forEach(item => {
      const status = getColumnValue(item, 'Status');
      const billing = parseFloat(getColumnValue(item, 'Current Month Billing') || 0);
      
      if (status === 'Active') newStats.active++;
      if (status === 'Scanned Out') newStats.scannedOut++;
      newStats.totalBilling += billing;
    });

    setStats(newStats);
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

  // Calculate specific month billing
  const calculateSpecificMonthBilling = async (month, year) => {
    if (!boardId) {
      showMessage('No board selected', 'error');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('https://b4869-service-17505803-baada5af.us.monday.app/api/billing/calculate-specific-month', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          boardId: boardId,
          month: month,
          year: year
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        showMessage(`Billing calculated successfully for ${result.monthName} ${result.year}!`, 'success');
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

  // Calculate last month billing
  const calculateLastMonthBilling = async () => {
    if (!boardId) {
      showMessage('No board selected', 'error');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('https://b4869-service-17505803-baada5af.us.monday.app/api/billing/calculate-last-month', {
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
        showMessage('Last month billing calculated successfully!', 'success');
        // Refresh board data to show updated billing
        loadRealBoardData(boardId);
      } else {
        showMessage('Error calculating last month billing: ' + result.error, 'error');
      }
    } catch (error) {
      showMessage('Error calculating last month billing: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle month selection change
  const handleMonthChange = (month, year) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  // Handle month selector calculate
  const handleMonthSelectorCalculate = async (month, year) => {
    await calculateSpecificMonthBilling(month, year);
  };

  // Handle refresh data
  const handleRefreshData = () => {
    if (boardId) {
      loadRealBoardData(boardId);
    }
  };

  // Open month selector
  const openMonthSelector = () => {
    setMonthSelectorOpen(true);
  };

  // Get column value by title
  const getColumnValue = (item, columnTitle) => {
    const column = item.column_values.find(col => col.title === columnTitle);
    return column ? column.text : '';
  };

  return (
    <div className="monday-board-view">
      {/* Header Section */}
      <div className="board-header" style={{ padding: '20px', borderBottom: '1px solid #e1e5e9' }}>
        <h1 style={{ margin: '0 0 10px 0', color: '#323338', fontSize: '24px' }}>
          🏢 Monthly Storage Billing Dashboard
        </h1>
        <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: '#676879' }}>
          <span>SDK Status: <strong>{sdkStatus}</strong></span>
          <span>Authentication: {isAuthenticated ? '✅ Connected' : '❌ Not Connected'}</span>
          <span>Board ID: {boardId || 'Loading...'}</span>
          {boardData && <span>Board: <strong>{boardData.name}</strong></span>}
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`message ${messageType}`} style={{
          padding: '12px 20px',
          margin: '0',
          backgroundColor: messageType === 'success' ? '#00c875' : 
                           messageType === 'error' ? '#e2445c' : '#579bfc',
          color: 'white',
          fontSize: '14px'
        }}>
          {message}
        </div>
      )}

      <div style={{ padding: '20px' }}>
        {/* Month Selector Section */}
        <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#323338' }}>
            📅 Month Selection & Quick Actions
          </h3>
          <MonthSelector
            boardId={boardId}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onMonthChange={handleMonthChange}
            onCalculate={handleMonthSelectorCalculate}
            loading={loading}
            disabled={!isAuthenticated}
          />
        </div>

        {/* Calculate Actions Panel */}
        <div style={{ marginBottom: '30px' }}>
          <CalculateActionsPanel
            boardId={boardId}
            onCalculateCurrentMonth={calculateCurrentMonthBilling}
            onCalculateLastMonth={calculateLastMonthBilling}
            onCalculateSpecificMonth={openMonthSelector}
            onGenerateInvoices={generateInvoices}
            onUpdateBillDates={updateBillDates}
            onRefreshData={handleRefreshData}
            loading={loading}
            disabled={!isAuthenticated}
            stats={stats}
          />
        </div>

        {/* Monthly Billing Table */}
        <div style={{ marginBottom: '30px' }}>
          <MonthlyBillingTable
            items={items}
            boardData={boardData}
            loading={loading}
            onRefresh={handleRefreshData}
            showMonthlyColumns={true}
          />
        </div>

        {/* Quick Stats Section */}
        {items.length > 0 && (
          <div style={{ 
            marginTop: '30px',
            padding: '20px',
            backgroundColor: '#ffffff',
            border: '1px solid #e1e5e9',
            borderRadius: '8px'
          }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#323338' }}>
              📊 Quick Statistics
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '15px'
            }}>
              <div style={{ textAlign: 'center', padding: '10px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4285f4' }}>
                  {stats.total}
                </div>
                <div style={{ fontSize: '14px', color: '#676879' }}>Total Items</div>
              </div>
              <div style={{ textAlign: 'center', padding: '10px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00c875' }}>
                  {stats.active}
                </div>
                <div style={{ fontSize: '14px', color: '#676879' }}>Active Items</div>
              </div>
              <div style={{ textAlign: 'center', padding: '10px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e2445c' }}>
                  {stats.scannedOut}
                </div>
                <div style={{ fontSize: '14px', color: '#676879' }}>Scanned Out</div>
              </div>
              <div style={{ textAlign: 'center', padding: '10px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#323338' }}>
                  £{stats.totalBilling.toFixed(2)}
                </div>
                <div style={{ fontSize: '14px', color: '#676879' }}>Current Month Total</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BoardView; 