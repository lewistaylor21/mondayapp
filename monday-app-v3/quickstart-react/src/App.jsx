import React, { useRef } from "react";
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
    const appRootRef = useRef(null);
  const [context, setContext] = useState();
  const [boardData, setBoardData] = useState(null);
    const [loading, setLoading] = useState(false); // data loading only
    const [calculating, setCalculating] = useState(false); // long-running billing ops
    const [calcProgress, setCalcProgress] = useState(null); // { total, done, label }
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

  // Ensure iframe gets focus immediately so first click isn't swallowed
  useEffect(() => {
    // Avoid forcing focus; rely on Monday container
  }, []);

  // Removed focus-based auto-refresh to avoid unexpected reload on click/focus

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

  // Calculate statistics (running current-month-to-date and active-in-stock)
  const calculateStats = (items, columns) => {
    const getColumnValue = (item, columnTitle) => {
      const column = columns?.find(col => col.title === columnTitle);
      if (!column) return '';
      const columnValue = item.column_values?.find(cv => cv.id === column.id);
      return columnValue ? (columnValue.text || columnValue.value || '') : '';
    };

    const parseDate = (value) => {
      if (!value || value === '' || value === '""' || value === 'null') return null;
      const clean = String(value).replace(/"/g, '');
      const d = new Date(clean);
      return isNaN(d.getTime()) ? null : d;
    };

    const parseNumber = (value) => {
      if (value === 0) return 0;
      if (!value && value !== 0) return null;
      const clean = String(value).replace(/"/g, '');
      const n = parseFloat(clean);
      return isNaN(n) ? null : n;
    };

    const today = new Date();
    const DAY_MS = 24 * 60 * 60 * 1000;
    const inclusiveDays = (startDate, endDate) => {
      if (!startDate || !endDate) return 0;
      const startUtc = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const endUtc = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      const diff = Math.floor((endUtc - startUtc) / DAY_MS) + 1; // inclusive of both ends
      return Math.max(0, diff);
    };
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    let totalBillingToDate = 0;
    let activeInStock = 0;

    items.forEach(item => {
      const dateReceived = parseDate(getColumnValue(item, 'Date Received'));
      const freeDays = parseNumber(getColumnValue(item, 'Free Days')) || 0;
      const rate = parseNumber(getColumnValue(item, 'Rate'))
        ?? parseNumber(getColumnValue(item, 'Rate per CBM/Day'));
      const cbm = parseNumber(getColumnValue(item, 'CBM'));
      const scanOutDate = parseDate(getColumnValue(item, 'Date Out'));

      // Active-in-stock this month: overlap with current month window
      const inStockThisMonth = (dateReceived && dateReceived <= today) && (!scanOutDate || scanOutDate >= monthStart);
      if (inStockThisMonth) activeInStock++;

      if (!dateReceived || !rate || !cbm) {
        return;
      }

      // Bill start date
      const billStartDate = new Date(dateReceived);
      billStartDate.setDate(billStartDate.getDate() + freeDays);

      // Calculate effective period in current month up to today
      const effectiveStart = billStartDate > monthStart ? billStartDate : monthStart;
      let effectiveEnd = today;

      if (scanOutDate) {
        if (scanOutDate < monthStart) {
          // Scanned out before this month → no current-month billing
          return;
        }
        if (scanOutDate < effectiveEnd) {
          effectiveEnd = scanOutDate;
        }
      }

      if (effectiveStart > monthEnd) {
        // Started after current month
        return;
      }

      const daysDiff = inclusiveDays(effectiveStart, effectiveEnd);
      const currentMonthToDate = daysDiff * rate * cbm;
      totalBillingToDate += currentMonthToDate;
    });

    setStats({
      total: items.length,
      active: activeInStock,
      scannedOut: (items.length - activeInStock),
      totalBilling: totalBillingToDate
    });
  };

  // Calculate billing for current month using direct Monday SDK
  const calculateCurrentMonthBilling = async () => {
    if (!context?.boardId || !boardData) {
      setError("No board data available");
      return;
    }
    
    setCalculating(true);
    setError(null);
    console.log('🔄 Calculating current month billing for board:', context.boardId);
    
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth(); // 0-11
      const currentYear = currentDate.getFullYear();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentMonthName = monthNames[currentMonth];
      
      // Resolve the current month's billing column (robust title matching)
      const monthColumnTitlePrimary = `${currentMonthName} ${currentYear} Billing`;
      const candidateTitles = [
        monthColumnTitlePrimary,
        `${currentMonthName} ${currentYear}`,
        `${currentMonthName}${currentYear}`
      ];
      const monthColumn = boardData.columns.find(col =>
        candidateTitles.some(t => col.title?.toLowerCase() === t.toLowerCase()) ||
        (col.title?.includes(currentMonthName) && col.title?.includes(String(currentYear)))
      );
      
      if (!monthColumn) {
        setError(`Column "${monthColumnTitle}" not found. Please ensure monthly columns exist.`);
        return;
      }
      
      console.log(`📊 Found current month column: ${monthColumn.title} (${monthColumn.id})`);
      
      // Calculate billing for each item
      const updates = [];
      
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
          // Missing data → ensure month column is zeroed out
          updates.push({ itemId: item.id, itemName: item.name, amount: '0' });
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
          // Started after current month → set to zero
          updates.push({ itemId: item.id, itemName: item.name, amount: '0' });
          continue;
        }
        
        if (scanOutDate && scanOutDate < monthStart) {
          // Scanned out before month → set to zero
          updates.push({ itemId: item.id, itemName: item.name, amount: '0' });
          continue;
        }
        
        // Calculate billing (inclusive of both dates, date-normalized)
        const DAY_MS = 24 * 60 * 60 * 1000;
        const toUTCDate = (d) => new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        const startUtc = toUTCDate(effectiveStart);
        const endUtc = toUTCDate(effectiveEnd);
        const daysDiff = Math.max(0, Math.floor((endUtc - startUtc) / DAY_MS) + 1);
        const monthlyBilling = daysDiff * rate * cbm;
        
        console.log(`💰 ${currentMonthName} billing: ${daysDiff} days × £${rate} × ${cbm} CBM = £${monthlyBilling.toFixed(2)}`);
        
        updates.push({
          itemId: item.id,
          itemName: item.name,
          amount: monthlyBilling.toFixed(2)
        });
      }
      
      console.log(`\n📊 Summary: ${updates.length} items to update`);
      setCalcProgress({ total: updates.length, done: 0, label: `${currentMonthName} ${currentYear}` });
      
      // Update Monday.com columns
      console.log('\n🔄 Updating Monday.com board...');
      let successCount = 0;
      let failCount = 0;
      
      // Helper: prefer change_column_value with numbers payload, fallback to change_multiple
      const upsertValue = async (itemId, amount) => {
        const payload = JSON.stringify({ number: String(amount) });
        const mutation = `
          mutation ChangeColumnValue($boardId: ID!, $itemId: ID!, $columnId: String!, $value: JSON!) {
            change_column_value(board_id: $boardId, item_id: $itemId, column_id: $columnId, value: $value) { id }
          }
        `;
        try {
          await monday.api(mutation, {
            variables: {
              boardId: context.boardId,
              itemId,
              columnId: monthColumn.id,
              value: payload
            }
          });
        } catch (err) {
          const mutationMulti = `
            mutation ChangeMultiple($boardId: ID!, $itemId: ID!, $columnValues: JSON!) {
              change_multiple_column_values(board_id: $boardId, item_id: $itemId, column_values: $columnValues) { id }
            }
          `;
          const mapping = { [monthColumn.id]: String(amount) };
          await monday.api(mutationMulti, {
            variables: {
              boardId: context.boardId,
              itemId,
              columnValues: JSON.stringify(mapping)
            }
          });
        }
      };

      // Process updates in small parallel chunks
      const concurrency = 10;
      for (let i = 0; i < updates.length; i += concurrency) {
        const batch = updates.slice(i, i + concurrency);
        await Promise.all(batch.map(async (update) => {
          try {
            await upsertValue(update.itemId, update.amount);
            console.log(`✅ Updated ${update.itemName}: £${update.amount}`);
            successCount++;
          } catch (error) {
            console.error(`❌ Failed to update ${update.itemName}:`, error.message);
            failCount++;
          } finally {
            setCalcProgress((p) => (p ? { ...p, done: Math.min(p.done + 1, p.total) } : p));
          }
        }));
      }
      
      const message = `${currentMonthName} ${currentYear}: Updated ${successCount} items${failCount > 0 ? `, ${failCount} failed` : ''}`;
      setError(message);
      console.log(`✅ ${message}`);
      
      // Refresh board data
      setTimeout(() => loadBoardData(context.boardId), 1000);
      
    } catch (error) {
      console.error('❌ Error calculating current month billing:', error);
      setError("Error calculating current month billing: " + error.message);
    } finally {
      setCalculating(false);
    }
  };

  const calculateLastMonthBilling = async () => {
    if (!context?.boardId) return;
    
    setCalculating(true);
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
      setCalculating(false);
    }
  };

  // Calculate billing for any selected month using direct Monday SDK
  const calculateSpecificMonthBilling = async (month, year) => {
    if (!context?.boardId || !boardData) {
      setError("No board data available");
      return;
    }
    
    setCalculating(true);
    setError(null);
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = monthNames[month];
    console.log(`🔄 Calculating ${monthName} ${year} billing for board:`, context.boardId);
    
    try {
      // Resolve the month's billing column (robust title matching)
      const candidateTitles = [
        `${monthName} ${year} Billing`,
        `${monthName} ${year}`,
        `${monthName}${year}`
      ];
      const monthColumn = boardData.columns.find(col =>
        candidateTitles.some(t => col.title?.toLowerCase() === t.toLowerCase()) ||
        (col.title?.includes(monthName) && col.title?.includes(String(year)))
      );
      
      if (!monthColumn) {
        setError(`Column "${monthColumnTitle}" not found. Please ensure monthly columns exist.`);
        return;
      }
      
      console.log(`📊 Found month column: ${monthColumn.title} (${monthColumn.id})`);
      
      // Calculate billing for each item
      const updates = [];
      
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
          updates.push({ itemId: item.id, itemName: item.name, amount: '0' });
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
          updates.push({ itemId: item.id, itemName: item.name, amount: '0' });
          continue;
        }
        
        if (scanOutDate && scanOutDate < monthStart) {
          updates.push({ itemId: item.id, itemName: item.name, amount: '0' });
          continue;
        }
        
        // Calculate billing (inclusive of both dates, date-normalized)
        const DAY_MS = 24 * 60 * 60 * 1000;
        const toUTCDate = (d) => new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        const startUtc = toUTCDate(effectiveStart);
        const endUtc = toUTCDate(effectiveEnd);
        const daysDiff = Math.max(0, Math.floor((endUtc - startUtc) / DAY_MS) + 1);
        const monthlyBilling = daysDiff * rate * cbm;
        
        console.log(`💰 ${monthName} billing: ${daysDiff} days × £${rate} × ${cbm} CBM = £${monthlyBilling.toFixed(2)}`);
        
        updates.push({
          itemId: item.id,
          itemName: item.name,
          amount: monthlyBilling.toFixed(2)
        });
      }
      
      console.log(`\n📊 Summary: ${updates.length} items to update`);
      setCalcProgress({ total: updates.length, done: 0, label: `${monthName} ${year}` });
      
      if (updates.length === 0) {
        setError(`No items to update for ${monthName} ${year}`);
        return;
      }
      
      // Update Monday.com columns
      console.log('\n🔄 Updating Monday.com board...');
      let successCount = 0;
      let failCount = 0;
      
      // Helper: prefer change_column_value with numbers payload, fallback to change_multiple
      const upsertValue = async (itemId, amount) => {
        const payload = JSON.stringify({ number: String(amount) });
        const mutation = `
          mutation ChangeColumnValue($boardId: ID!, $itemId: ID!, $columnId: String!, $value: JSON!) {
            change_column_value(board_id: $boardId, item_id: $itemId, column_id: $columnId, value: $value) { id }
          }
        `;
        try {
          await monday.api(mutation, {
            variables: {
              boardId: context.boardId,
              itemId,
              columnId: monthColumn.id,
              value: payload
            }
          });
        } catch (err) {
          const mutationMulti = `
            mutation ChangeMultiple($boardId: ID!, $itemId: ID!, $columnValues: JSON!) {
              change_multiple_column_values(board_id: $boardId, item_id: $itemId, column_values: $columnValues) { id }
            }
          `;
          const mapping = { [monthColumn.id]: String(amount) };
          await monday.api(mutationMulti, {
            variables: {
              boardId: context.boardId,
              itemId,
              columnValues: JSON.stringify(mapping)
            }
          });
        }
      };

      const concurrency2 = 10;
      for (let i = 0; i < updates.length; i += concurrency2) {
        const batch = updates.slice(i, i + concurrency2);
        await Promise.all(batch.map(async (update) => {
          try {
            await upsertValue(update.itemId, update.amount);
            console.log(`✅ Updated ${update.itemName}: £${update.amount}`);
            successCount++;
          } catch (error) {
            console.error(`❌ Failed to update ${update.itemName}:`, error.message);
            failCount++;
          } finally {
            setCalcProgress((p) => (p ? { ...p, done: Math.min(p.done + 1, p.total) } : p));
          }
        }));
      }
      
      const message = `${monthName} ${year}: Updated ${successCount} items${failCount > 0 ? `, ${failCount} failed` : ''}`;
      setError(message);
      console.log(`✅ ${message}`);
      
      // Refresh board data
      setTimeout(() => loadBoardData(context.boardId), 1000);
      
    } catch (error) {
      console.error(`❌ Error calculating ${monthName} ${year} billing:`, error);
      setError(`Error calculating ${monthName} ${year} billing: ` + error.message);
    } finally {
      setCalculating(false);
      setTimeout(() => setCalcProgress(null), 600);
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

  // Clear a specific month column values across all items
  const clearMonthColumn = async (monthYear) => {
    if (!context?.boardId || !boardData) return;
    setLoading(true);
    setError(null);
    try {
      // Find column by exact title e.g., "Jan 2025 Billing"
      const columnTitle = `${monthYear} Billing`;
      const monthColumn = boardData.columns.find(col => col.title === columnTitle);
      if (!monthColumn) {
        setError(`Column "${columnTitle}" not found.`);
        return;
      }

      // Prepare clear payload based on column type
      const buildClearValue = (column) => {
        const type = column.type || '';
        // For numbers, reliably clear by setting to 0 (empty often rejected)
        if (type === 'numbers' || type === 'numeric') {
          return "0"; // SDK expects JSON string for numbers
        }
        if (type === 'text' || type === 'long_text') {
          return "";
        }
        // Fallback
        return "";
      };

      const clearValue = buildClearValue(monthColumn);

      const mutation = `
        mutation ChangeColumnValue($boardId: ID!, $itemId: ID!, $columnId: String!, $value: JSON!) {
          change_column_value(
            board_id: $boardId,
            item_id: $itemId,
            column_id: $columnId,
            value: $value
          ) { id }
        }
      `;

      let success = 0; let failed = 0;
      for (const item of boardData.items_page.items) {
        try {
          // Only clear if currently has a value
          const cv = item.column_values?.find(cv => cv.id === monthColumn.id);
          const hasValue = cv && (cv.text || cv.value) && (cv.text !== '-' && cv.text !== '0');
          // If already 0 for numbers, skip; otherwise attempt clear

          try {
            await monday.api(mutation, {
              variables: {
                boardId: context.boardId,
                itemId: item.id,
                columnId: monthColumn.id,
                value: clearValue
              }
            });
          } catch (primaryErr) {
            // Fallback: change_multiple_column_values mapping
            const mutationMulti = `
              mutation ChangeMultiple($boardId: ID!, $itemId: ID!, $columnValues: JSON!) {
                change_multiple_column_values(board_id: $boardId, item_id: $itemId, column_values: $columnValues) { id }
              }
            `;
            const mapping = { [monthColumn.id]: (buildClearValue(monthColumn)) };
            await monday.api(mutationMulti, {
              variables: {
                boardId: context.boardId,
                itemId: item.id,
                columnValues: JSON.stringify(mapping)
              }
            });
          }
          success++;
        } catch (e) {
          console.error('Failed to clear value for item', item.id, e);
          failed++;
        }
      }

      setError(`Cleared ${success} items for ${monthYear}${failed ? `, ${failed} failed` : ''}`);
      // Refresh board data
      await loadBoardData(context.boardId);
    } catch (err) {
      setError('Error clearing month values: ' + err.message);
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
      {calculating && calcProgress && (
        <div style={{ position: 'sticky', top: 0, zIndex: 5, width: '100%', background: 'rgba(0,0,0,0.03)' }}>
          <div style={{ padding: '6px 12px', fontSize: 12, color: '#6b6f76', display: 'flex', justifyContent: 'space-between' }}>
            <span>Calculating {calcProgress.label}</span>
            <span>{calcProgress.done}/{calcProgress.total}</span>
          </div>
          <div style={{ height: 3, background: '#e6e9ef', width: '100%' }}>
            <div style={{ height: '100%', width: `${calcProgress.total ? (100 * calcProgress.done / calcProgress.total) : 0}%`, background: '#0073ea', transition: 'width 200ms linear' }} />
          </div>
        </div>
      )}
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
                calculating={calculating}
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
              onClearMonth={clearMonthColumn}
            />

            {/* Additional Actions */}
            <Box marginTop="medium">
              <Flex gap="medium" wrap>
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
