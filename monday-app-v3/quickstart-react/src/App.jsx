import React from "react";
import { useState, useEffect } from "react";
import "./App.css";
import mondaySdk from "monday-sdk-js";
import "@vibe/core/tokens";
import { 
  AttentionBox, 
  Loader, 
  Text, 
  Button, 
  Flex, 
  Box 
} from "@vibe/core";
import ComprehensiveBillingTable from "./components/ComprehensiveBillingTable";
import EnhancedMonthSelector from "./components/EnhancedMonthSelector";

// Usage of mondaySDK example, for more information visit here: https://developer.monday.com/apps/docs/introduction-to-the-sdk/
const monday = mondaySdk();

const App = () => {
  const [context, setContext] = useState();
  const [boardData, setBoardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    scannedOut: 0,
    totalBilling: 0
  });

  useEffect(() => {
    // Initialize Monday.com app
    monday.execute("valueCreatedForUser");

    // Listen for context (board ID, user info, etc.)
    monday.listen("context", (res) => {
      console.log("Monday.com context received:", res.data);
      setContext(res.data);
      
      if (res.data.boardId) {
        loadBoardData(res.data.boardId);
      }
    });
  }, []);

  const loadBoardData = async (boardId) => {
    setLoading(true);
    setError(null);
    
    try {
      const query = `
        query ($boardId: [ID!]!) {
          boards(ids: $boardId) {
            id
            name
            columns {
              id
              title
              type
              settings_str
            }
            items_page(limit: 50) {
              items {
                id
                name
                column_values {
                  id
                  type
                  value
                  text
                }
              }
            }
          }
        }
      `;

      const response = await monday.api(query, { 
        variables: { boardId: [parseInt(boardId)] } 
      });

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      if (response.data && response.data.boards && response.data.boards[0]) {
        const board = response.data.boards[0];
        setBoardData(board);
        calculateStats(board.items_page.items, board.columns);
      } else {
        throw new Error("Board not found");
      }
    } catch (err) {
      console.error("Error loading board data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (items, columns) => {
    const newStats = {
      total: items.length,
      active: 0,
      scannedOut: 0,
      totalBilling: 0
    };

    const getColumnValue = (item, columnTitle) => {
      const column = columns?.find(col => col.title === columnTitle);
      if (!column) return '';
      const columnValue = item.column_values?.find(cv => cv.id === column.id);
      return columnValue ? (columnValue.text || columnValue.value || '') : '';
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

  // Calculate billing for current month using direct Monday SDK
  const calculateCurrentMonthBilling = async () => {
    if (!context?.boardId || !boardData) {
      setError("No board data available");
      return;
    }
    
    setLoading(true);
    setError(null);
    console.log('🔄 Calculating current month billing for board:', context.boardId);
    
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth(); // 0-11
      const currentYear = currentDate.getFullYear();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentMonthName = monthNames[currentMonth];
      
      // Find the current month's billing column
      const monthColumnTitle = `${currentMonthName} ${currentYear} Billing`;
      const monthColumn = boardData.columns.find(col => col.title === monthColumnTitle);
      
      if (!monthColumn) {
        setError(`Column "${monthColumnTitle}" not found. Please ensure monthly columns exist.`);
        return;
      }
      
      console.log(`📊 Found current month column: ${monthColumn.title} (${monthColumn.id})`);
      
      // Calculate billing for each item
      const updates = [];
      const skipped = [];
      
      for (const item of boardData.items_page.items) {
        console.log(`\n--- Processing: ${item.name} ---`);
        
        // Helper functions to parse data
        const parseDate = (value) => {
          if (!value || value === '' || value === '""' || value === 'null') return null;
          const cleanValue = value.replace(/"/g, '');
          const date = new Date(cleanValue);
          return isNaN(date.getTime()) ? null : date;
        };
        
        const parseNumber = (value) => {
          if (!value || value === '' || value === '""' || value === 'null') return null;
          const cleanValue = value.replace(/"/g, '');
          const num = parseFloat(cleanValue);
          return isNaN(num) ? null : num;
        };
        
        // Get required data
        const dateReceived = parseDate(getColumnValue(item, 'Date Received'));
        const freeDays = parseNumber(getColumnValue(item, 'Free Days')) || 0;
        const rate = parseNumber(getColumnValue(item, 'Rate'));
        const cbm = parseNumber(getColumnValue(item, 'CBM'));
        const scanOutDate = parseDate(getColumnValue(item, 'Date Out'));
        
        console.log(`${item.name} data:`, { dateReceived, freeDays, rate, cbm, scanOutDate });
        
        if (!dateReceived || !rate || !cbm) {
          console.log('⚠️ Skipping - missing required data');
          skipped.push(item.name);
          continue;
        }
        
        // Calculate bill start date
        const billStartDate = new Date(dateReceived);
        billStartDate.setDate(billStartDate.getDate() + freeDays);
        
        // Current month period
        const monthStart = new Date(currentYear, currentMonth, 1);
        const monthEnd = new Date(currentYear, currentMonth + 1, 0); // Last day of current month
        
        // Calculate effective period
        let effectiveStart = billStartDate > monthStart ? billStartDate : monthStart;
        let effectiveEnd = monthEnd;
        
        // Check scan out date
        if (scanOutDate && scanOutDate < monthEnd) {
          effectiveEnd = scanOutDate;
          console.log(`📤 Item scanned out: ${scanOutDate.toDateString()}`);
        }
        
        // Skip if not active in current month
        if (effectiveStart > monthEnd) {
          console.log('⏭️ Skipping - started after current month');
          skipped.push(item.name);
          continue;
        }
        
        if (scanOutDate && scanOutDate < monthStart) {
          console.log('⏭️ Skipping - scanned out before current month');
          skipped.push(item.name);
          continue;
        }
        
        // Calculate billing
        const daysDiff = Math.max(0, Math.ceil((effectiveEnd - effectiveStart) / (1000 * 3600 * 24)) + 1);
        const monthlyBilling = daysDiff * rate * cbm;
        
        console.log(`💰 ${currentMonthName} billing: ${daysDiff} days × £${rate} × ${cbm} CBM = £${monthlyBilling.toFixed(2)}`);
        
        updates.push({
          itemId: item.id,
          itemName: item.name,
          amount: monthlyBilling.toFixed(2)
        });
      }
      
      console.log(`\n📊 Summary: ${updates.length} items to update, ${skipped.length} skipped`);
      
      if (updates.length === 0) {
        setError('No items to update for current month');
        return;
      }
      
      // Update Monday.com columns
      console.log('\n🔄 Updating Monday.com board...');
      let successCount = 0;
      let failCount = 0;
      
      for (const update of updates) {
        try {
          const mutation = `
            mutation ChangeColumnValue($boardId: ID!, $itemId: ID!, $columnId: String!, $value: JSON!) {
              change_column_value(
                board_id: $boardId,
                item_id: $itemId,
                column_id: $columnId,
                value: $value
              ) {
                id
              }
            }
          `;
          
          await monday.api(mutation, {
            variables: {
              boardId: context.boardId,
              itemId: update.itemId,
              columnId: monthColumn.id,
              value: update.amount
            }
          });
          
          console.log(`✅ Updated ${update.itemName}: £${update.amount}`);
          successCount++;
        } catch (error) {
          console.error(`❌ Failed to update ${update.itemName}:`, error.message);
          failCount++;
        }
      }
      
      const message = `${currentMonthName} ${currentYear}: Updated ${successCount} items${failCount > 0 ? `, ${failCount} failed` : ''}${skipped.length > 0 ? `, ${skipped.length} skipped` : ''}`;
      setError(message);
      console.log(`✅ ${message}`);
      
      // Refresh board data
      setTimeout(() => loadBoardData(context.boardId), 1000);
      
    } catch (error) {
      console.error('❌ Error calculating current month billing:', error);
      setError("Error calculating current month billing: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateLastMonthBilling = async () => {
    if (!context?.boardId) return;
    
    setLoading(true);
    try {
      const response = await fetch('https://b4869-service-17505803-baada5af.us.monday.app/api/billing/calculate-last-month', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boardId: context.boardId })
      });

      if (response.ok) {
        loadBoardData(context.boardId);
      } else {
        const result = await response.json();
        setError("Error calculating last month billing: " + result.error);
      }
    } catch (err) {
      setError("Error calculating last month billing: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate billing for any selected month using direct Monday SDK
  const calculateSpecificMonthBilling = async (month, year) => {
    if (!context?.boardId || !boardData) {
      setError("No board data available");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = monthNames[month];
    console.log(`🔄 Calculating ${monthName} ${year} billing for board:`, context.boardId);
    
    try {
      // Find the month's billing column
      const monthColumnTitle = `${monthName} ${year} Billing`;
      const monthColumn = boardData.columns.find(col => col.title === monthColumnTitle);
      
      if (!monthColumn) {
        setError(`Column "${monthColumnTitle}" not found. Please ensure monthly columns exist.`);
        return;
      }
      
      console.log(`📊 Found month column: ${monthColumn.title} (${monthColumn.id})`);
      
      // Calculate billing for each item
      const updates = [];
      const skipped = [];
      
      for (const item of boardData.items_page.items) {
        console.log(`\n--- Processing: ${item.name} ---`);
        
        // Helper functions to parse data
        const parseDate = (value) => {
          if (!value || value === '' || value === '""' || value === 'null') return null;
          const cleanValue = value.replace(/"/g, '');
          const date = new Date(cleanValue);
          return isNaN(date.getTime()) ? null : date;
        };
        
        const parseNumber = (value) => {
          if (!value || value === '' || value === '""' || value === 'null') return null;
          const cleanValue = value.replace(/"/g, '');
          const num = parseFloat(cleanValue);
          return isNaN(num) ? null : num;
        };
        
        // Get required data
        const dateReceived = parseDate(getColumnValue(item, 'Date Received'));
        const freeDays = parseNumber(getColumnValue(item, 'Free Days')) || 0;
        const rate = parseNumber(getColumnValue(item, 'Rate'));
        const cbm = parseNumber(getColumnValue(item, 'CBM'));
        const scanOutDate = parseDate(getColumnValue(item, 'Date Out'));
        
        console.log(`${item.name} data:`, { dateReceived, freeDays, rate, cbm, scanOutDate });
        
        if (!dateReceived || !rate || !cbm) {
          console.log('⚠️ Skipping - missing required data');
          skipped.push(item.name);
          continue;
        }
        
        // Calculate bill start date
        const billStartDate = new Date(dateReceived);
        billStartDate.setDate(billStartDate.getDate() + freeDays);
        
        // Selected month period
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0); // Last day of selected month
        
        // Calculate effective period
        let effectiveStart = billStartDate > monthStart ? billStartDate : monthStart;
        let effectiveEnd = monthEnd;
        
        // Check scan out date
        if (scanOutDate && scanOutDate < monthEnd) {
          effectiveEnd = scanOutDate;
          console.log(`📤 Item scanned out: ${scanOutDate.toDateString()}`);
        }
        
        // Skip if not active in selected month
        if (effectiveStart > monthEnd) {
          console.log('⏭️ Skipping - started after selected month');
          skipped.push(item.name);
          continue;
        }
        
        if (scanOutDate && scanOutDate < monthStart) {
          console.log('⏭️ Skipping - scanned out before selected month');
          skipped.push(item.name);
          continue;
        }
        
        // Calculate billing
        const daysDiff = Math.max(0, Math.ceil((effectiveEnd - effectiveStart) / (1000 * 3600 * 24)) + 1);
        const monthlyBilling = daysDiff * rate * cbm;
        
        console.log(`💰 ${monthName} billing: ${daysDiff} days × £${rate} × ${cbm} CBM = £${monthlyBilling.toFixed(2)}`);
        
        updates.push({
          itemId: item.id,
          itemName: item.name,
          amount: monthlyBilling.toFixed(2)
        });
      }
      
      console.log(`\n📊 Summary: ${updates.length} items to update, ${skipped.length} skipped`);
      
      if (updates.length === 0) {
        setError(`No items to update for ${monthName} ${year}`);
        return;
      }
      
      // Update Monday.com columns
      console.log('\n🔄 Updating Monday.com board...');
      let successCount = 0;
      let failCount = 0;
      
      for (const update of updates) {
        try {
          const mutation = `
            mutation ChangeColumnValue($boardId: ID!, $itemId: ID!, $columnId: String!, $value: JSON!) {
              change_column_value(
                board_id: $boardId,
                item_id: $itemId,
                column_id: $columnId,
                value: $value
              ) {
                id
              }
            }
          `;
          
          await monday.api(mutation, {
            variables: {
              boardId: context.boardId,
              itemId: update.itemId,
              columnId: monthColumn.id,
              value: update.amount
            }
          });
          
          console.log(`✅ Updated ${update.itemName}: £${update.amount}`);
          successCount++;
        } catch (error) {
          console.error(`❌ Failed to update ${update.itemName}:`, error.message);
          failCount++;
        }
      }
      
      const message = `${monthName} ${year}: Updated ${successCount} items${failCount > 0 ? `, ${failCount} failed` : ''}${skipped.length > 0 ? `, ${skipped.length} skipped` : ''}`;
      setError(message);
      console.log(`✅ ${message}`);
      
      // Refresh board data
      setTimeout(() => loadBoardData(context.boardId), 1000);
      
    } catch (error) {
      console.error(`❌ Error calculating ${monthName} ${year} billing:`, error);
      setError(`Error calculating ${monthName} ${year} billing: ` + error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateInvoices = async () => {
    if (!context?.boardId) return;
    
    setLoading(true);
    try {
      const response = await fetch('https://b4869-service-17505803-baada5af.us.monday.app/api/invoices/generate-current-month', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boardId: context.boardId })
      });

      if (response.ok) {
        console.log("Invoices generated successfully");
      } else {
        const result = await response.json();
        setError("Error generating invoices: " + result.error);
      }
    } catch (err) {
      setError("Error generating invoices: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateBillDates = async () => {
    if (!context?.boardId) return;
    
    setLoading(true);
    try {
      const response = await fetch('https://b4869-service-17505803-baada5af.us.monday.app/api/billing/update-bill-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boardId: context.boardId })
      });

      if (response.ok) {
        loadBoardData(context.boardId);
      } else {
        const result = await response.json();
        setError("Error updating bill dates: " + result.error);
      }
    } catch (err) {
      setError("Error updating bill dates: " + err.message);
    } finally {
      setLoading(false);
    }
  };


  // Handle month selection change
  const handleMonthChange = (month, year) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  // Handle refresh data
  const handleRefreshData = () => {
    if (context?.boardId) {
      loadBoardData(context.boardId);
    }
  };



  // Helper function to get column value
  const getColumnValue = (item, columnTitle) => {
    const column = boardData?.columns?.find(col => col.title === columnTitle);
    if (!column) return '';
    const columnValue = item.column_values?.find(cv => cv.id === column.id);
    return columnValue ? (columnValue.text || columnValue.value || '') : '';
  };

  if (loading) {
    return (
      <Box padding="large">
        <Flex justify="center" align="center" style={{ minHeight: "200px" }}>
          <Loader size="large" />
        </Flex>
      </Box>
    );
  }

  return (
    <div className="App">
      <Box padding="medium" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
        <Text type="h1" size="large" weight="bold" color="primary">
          🏢 Monthly Storage Billing Dashboard
        </Text>
        
        {error && (
          <AttentionBox
            title="Error"
            text={error}
            type="danger"
            style={{ margin: "16px 0" }}
            onClose={() => setError(null)}
          />
        )}

        {context && (
          <Box marginTop="medium" marginBottom="medium">
            <Text type="text1" weight="medium">
              Board: {boardData?.name || context.boardId} | User: {context.user?.name || context.user?.id}
            </Text>
          </Box>
        )}

        {boardData && (
          <Box style={{ width: '100%' }}>
            {/* Enhanced Month Selector */}
            <Box marginBottom="large">
              <EnhancedMonthSelector
                boardId={context?.boardId}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                onCalculateCurrentMonth={calculateCurrentMonthBilling}
                onCalculateSelectedMonth={calculateSpecificMonthBilling}
                loading={loading}
                disabled={!context?.boardId}
              />
            </Box>

            {/* Quick Stats - Streamlined */}
            <Box marginBottom="large">
              <Text type="h2" size="medium" weight="medium" style={{ marginBottom: "12px" }}>
                📊 Quick Stats
              </Text>
              <Box 
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '12px',
                  padding: '12px',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #e1e5e9',
                  borderRadius: '6px'
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <Text type="h1" size="medium" weight="bold" color="primary">
                    {stats.total}
                  </Text>
                  <Text type="text2" size="small">Total Items</Text>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <Text type="h1" size="medium" weight="bold" style={{ color: '#00c875' }}>
                    {stats.active}
                  </Text>
                  <Text type="text2" size="small">Active Items</Text>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <Text type="h1" size="medium" weight="bold" color="primary">
                    £{stats.totalBilling.toFixed(2)}
                  </Text>
                  <Text type="text2" size="small">Current Total</Text>
                </div>
              </Box>
            </Box>

            {/* Comprehensive Billing Table */}
            <ComprehensiveBillingTable
              items={boardData.items_page.items}
              boardData={boardData}
              loading={loading}
              onRefresh={handleRefreshData}
            />

            {/* Additional Actions */}
            <Box marginTop="medium">
              <Flex gap="medium" wrap>
                <Button 
                  onClick={generateInvoices}
                  loading={loading}
                  disabled={!context?.boardId}
                  kind="secondary"
                  size="small"
                >
                  📄 Generate Invoices
                </Button>
                <Button 
                  onClick={updateBillDates}
                  loading={loading}
                  disabled={!context?.boardId}
                  kind="tertiary"
                  size="small"
                >
                  🔄 Update Bill Dates
                </Button>
                <Button 
                  onClick={handleRefreshData}
                  loading={loading}
                  disabled={!context?.boardId}
                  kind="tertiary"
                  size="small"
                >
                  🔃 Refresh Data
                </Button>
              </Flex>
            </Box>
          </Box>
        )}

        {!context && (
          <AttentionBox
            title="Initializing..."
            text="Loading Monday.com context and board data..."
            type="info"
          />
        )}
      </Box>
    </div>
  );
};

export default App;
