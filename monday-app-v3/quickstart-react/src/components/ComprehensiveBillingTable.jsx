import React, { useState, useMemo } from "react";
import {
  Text,
  Box,
  Flex,
  Button
} from "@vibe/core";

const ComprehensiveBillingTable = ({ 
  items = [], 
  boardData = null, 
  loading = false,
  onRefresh 
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Enhanced column value helper - simplified for better performance
  const getColumnValue = (item, columnTitle) => {
    if (!boardData?.columns || !item.column_values) {
      return '';
    }
    
    const column = boardData.columns.find(col => col.title === columnTitle);
    if (!column) {
      return '';
    }
    
    const columnValue = item.column_values.find(cv => cv.id === column.id);
    const result = columnValue ? (columnValue.text || columnValue.value || '') : '';
    
    // Only log for important values or debugging
    if (columnTitle.includes('Jul 2025') && result && result !== '0' && result !== '') {
      console.log(`✅ Found ${columnTitle} for ${item.name}: ${result}`);
    }
    
    return result;
  };

  // Special function to debug Bill Start Date formula column
  const getBillStartDate = (item) => {
    console.log(`=== DEBUGGING BILL START DATE for ${item.name} ===`);
    
    // Try different possible column names
    const possibleNames = [
      'Billing start date',
      'Bill start date', 
      'Bill Start Date',
      'Billing Start Date'
    ];
    
    possibleNames.forEach(name => {
      const value = getColumnValue(item, name);
      console.log(`Tried "${name}": "${value}"`);
    });
    
    // Try to find any column with "bill" or "start" in the name
    if (boardData?.columns) {
      const billColumns = boardData.columns.filter(col => 
        col.title.toLowerCase().includes('bill') || 
        col.title.toLowerCase().includes('start')
      );
      console.log('Columns containing "bill" or "start":', billColumns.map(c => ({
        title: c.title,
        type: c.type,
        id: c.id
      })));
      
      // Check the raw data for these columns
      billColumns.forEach(col => {
        const columnValue = item.column_values.find(cv => cv.id === col.id);
        console.log(`Raw data for "${col.title}" (${col.type}):`, columnValue);
      });
    }
    
    // If formula column doesn't work, calculate it ourselves
    const calculatedDate = calculateBillStartDate(item);
    console.log('Fallback calculated date:', calculatedDate);
    
    console.log(`=== END DEBUGGING for ${item.name} ===`);
    
    // For now, return our calculated version
    return calculatedDate;
  };

  // Calculate Bill Start Date (Date Received + Free Days)
  const calculateBillStartDate = (item) => {
    const dateReceived = getColumnValue(item, 'Date Received');
    const freeDays = getColumnValue(item, 'Free Days');
    
    if (!dateReceived) {
      console.log(`No Date Received for item: ${item.name}`);
      return '';
    }
    
    try {
      const receivedDate = new Date(dateReceived);
      const freeDaysNum = parseInt(freeDays) || 0;
      
      console.log(`Calculating Bill Start Date for ${item.name}:`, {
        dateReceived,
        freeDays: freeDaysNum,
        receivedDate: receivedDate.toISOString()
      });
      
      // Add free days to received date
      const billStartDate = new Date(receivedDate);
      billStartDate.setDate(billStartDate.getDate() + freeDaysNum);
      
      return billStartDate.toISOString().split('T')[0]; // Return YYYY-MM-DD format
    } catch (error) {
      console.error(`Error calculating bill start date for ${item.name}:`, error);
      return '';
    }
  };

  // Get rate from the 'Rate' column
  const getRateValue = (item) => {
    const value = getColumnValue(item, 'Rate');
    if (value && value !== '') {
      const rate = parseFloat(value);
      if (!isNaN(rate)) {
        console.log(`Found rate for ${item.name}: ${rate}`);
        return rate;
      }
    }
    
    console.log(`No rate found for ${item.name} in 'Rate' column. Value:`, value);
    return 0;
  };

  // Calculate live price to date (total from bill start to current day OR scan out date)
  const calculateLivePriceToDate = (item) => {
    const billStartDate = calculateBillStartDate(item);
    const rate = getRateValue(item);
    const cbm = parseFloat(getColumnValue(item, 'CBM') || 0);
    const scanOutDate = getColumnValue(item, 'Date Out');
    
    console.log(`Calculating Live Price for ${item.name}:`, {
      billStartDate,
      rate,
      cbm,
      scanOutDate
    });
    
    if (!billStartDate || !rate || !cbm) {
      console.log(`Missing data for Live Price calculation: billStartDate=${billStartDate}, rate=${rate}, cbm=${cbm}`);
      return 0;
    }
    
    try {
      const startDate = new Date(billStartDate);
      const today = new Date();
      
      // Determine end date: if scanned out, use scan out date, otherwise use today
      let endDate = today;
      if (scanOutDate && scanOutDate !== '' && scanOutDate !== '-') {
        const parsedScanOutDate = new Date(scanOutDate);
        if (!isNaN(parsedScanOutDate.getTime())) {
          endDate = parsedScanOutDate;
          console.log(`Item ${item.name} scanned out on ${scanOutDate}, using as end date`);
        }
      }
      
      const timeDiff = endDate.getTime() - startDate.getTime();
      const daysDiff = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
      
      const livePrice = daysDiff * rate * cbm;
      console.log(`Live Price calculation for ${item.name}: ${daysDiff} days × £${rate} × ${cbm} CBM = £${livePrice.toFixed(2)} (End: ${endDate.toDateString()})`);
      
      return livePrice;
    } catch (error) {
      console.error(`Error calculating live price for ${item.name}:`, error);
      return 0;
    }
  };

  // Calculate current month price to date (from start of current month to today OR scan out date)
  const calculateCurrentMonthPriceToDate = (item) => {
    const billStartDate = calculateBillStartDate(item);
    const rate = getRateValue(item);
    const cbm = parseFloat(getColumnValue(item, 'CBM') || 0);
    const scanOutDate = getColumnValue(item, 'Date Out');
    
    console.log(`Calculating Current Month Price for ${item.name}:`, {
      billStartDate,
      rate,
      cbm,
      scanOutDate
    });
    
    if (!billStartDate || !rate || !cbm) {
      console.log(`Missing data for Current Month calculation: billStartDate=${billStartDate}, rate=${rate}, cbm=${cbm}`);
      return 0;
    }
    
    try {
      const startDate = new Date(billStartDate);
      const today = new Date();
      const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      // Use the later of bill start date or current month start
      const effectiveStartDate = startDate > currentMonthStart ? startDate : currentMonthStart;
      
      // Determine end date for current month calculation
      let effectiveEndDate = today;
      
      // If item is scanned out
      if (scanOutDate && scanOutDate !== '' && scanOutDate !== '-') {
        const parsedScanOutDate = new Date(scanOutDate);
        if (!isNaN(parsedScanOutDate.getTime())) {
          // Check if scan out date is in current month
          if (parsedScanOutDate >= currentMonthStart && parsedScanOutDate <= currentMonthEnd) {
            // Scan out is in current month - calculate to scan out date
            effectiveEndDate = parsedScanOutDate;
            console.log(`Item ${item.name} scanned out in current month (${scanOutDate}), calculating to scan out date`);
          } else if (parsedScanOutDate < currentMonthStart) {
            // Scan out was before current month - no current month billing
            console.log(`Item ${item.name} scanned out before current month (${scanOutDate}), no current month billing`);
            return 0;
          }
          // If scan out is after current month, use today as normal
        }
      }
      
      const timeDiff = effectiveEndDate.getTime() - effectiveStartDate.getTime();
      const daysDiff = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
      
      const currentMonthPrice = daysDiff * rate * cbm;
      console.log(`Current Month calculation for ${item.name}: ${daysDiff} days × £${rate} × ${cbm} CBM = £${currentMonthPrice.toFixed(2)} (Start: ${effectiveStartDate.toDateString()}, End: ${effectiveEndDate.toDateString()})`);
      
      return currentMonthPrice;
    } catch (error) {
      console.error(`Error calculating current month price for ${item.name}:`, error);
      return 0;
    }
  };

  // Enhanced function to show ALL available columns for debugging
  const debugAllColumns = () => {
    if (boardData?.columns) {
      console.log('=== ALL MONDAY.COM BOARD COLUMNS ===');
      boardData.columns.forEach((col, index) => {
        console.log(`${index + 1}. "${col.title}" (Type: ${col.type}, ID: ${col.id})`);
      });
      console.log('=== END COLUMN LIST ===');
    }
  };

  // Get monthly column value with simplified and accurate column matching
  const getMonthlyColumnValue = (item, monthYear) => {
    // Try exact column name format first (this is the most likely format)
    const exactColumnName = `${monthYear} Billing`;  // e.g., "Jul 2025 Billing"
    
    // First try the exact match
    let value = getColumnValue(item, exactColumnName);
    if (value && value !== '' && value !== '-' && value !== 'null') {
      const parsed = parseFloat(value);
      if (!isNaN(parsed) && parsed >= 0) {  // Allow zero values
        return parsed;
      }
    }
    
    // If exact match fails, try alternative formats
    const alternativeColumnNames = [
      monthYear,                         // "Jul 2025"
      `${monthYear}`,                   // "Jul 2025"
      `${monthYear.replace(' ', '')}`,  // "Jul2025"
    ];
    
    for (const columnName of alternativeColumnNames) {
      value = getColumnValue(item, columnName);
      if (value && value !== '' && value !== '-' && value !== 'null') {
        const parsed = parseFloat(value);
        if (!isNaN(parsed) && parsed >= 0) {  // Allow zero values
          return parsed;
        }
      }
    }
    
    // Debug for the first item to understand what columns exist
    if (item === sortedItems[0] && monthYear === 'Jul 2025') {
      console.log(`🔍 Looking for July 2025 data. Tried: "${exactColumnName}"`);
      console.log('📋 Available monthly billing columns:');
      if (boardData?.columns) {
        const monthlyColumns = boardData.columns.filter(col => 
          col.title.toLowerCase().includes('billing') ||
          col.title.includes('2025')
        );
        monthlyColumns.forEach(col => {
          console.log(`   - "${col.title}" (ID: ${col.id})`);
        });
      }
    }
    
    return 0;
  };

  // Generate monthly columns for current year
  const generateMonthlyColumns = () => {
    const currentYear = new Date().getFullYear();
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    return months.map(month => ({
      key: `${month} ${currentYear}`,
      label: `${month} ${currentYear}`,
      columnTitle: `${month} ${currentYear} Billing`
    }));
  };

  const monthlyColumns = generateMonthlyColumns();

  // Format currency
  const formatCurrency = (amount) => {
    return `£${Number(amount).toFixed(2)}`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB');
    } catch (error) {
      return dateString;
    }
  };

  // Handle sort
  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Sort items
  const sortedItems = useMemo(() => {
    if (!sortConfig.key) return items;

    return [...items].sort((a, b) => {
      let aValue, bValue;

      switch (sortConfig.key) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'liveTotal':
          aValue = calculateLivePriceToDate(a);
          bValue = calculateLivePriceToDate(b);
          break;
        case 'currentMonth':
          aValue = calculateCurrentMonthPriceToDate(a);
          bValue = calculateCurrentMonthPriceToDate(b);
          break;
        default:
          if (sortConfig.key.startsWith('monthly_')) {
            const monthYear = sortConfig.key.replace('monthly_', '');
            aValue = getMonthlyColumnValue(a, monthYear);
            bValue = getMonthlyColumnValue(b, monthYear);
          } else {
            aValue = getColumnValue(a, sortConfig.key);
            bValue = getColumnValue(b, sortConfig.key);
          }
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [items, sortConfig]);

  if (!items.length) {
    return (
      <Box padding="large" style={{ textAlign: 'center' }}>
        <Text type="h2">No storage items found</Text>
        <Text type="text2" color="secondary">Add items to your Monday.com board to see billing calculations.</Text>
      </Box>
    );
  }

  return (
    <Box className="comprehensive-billing-table">
      {/* Header */}
      <Flex justify="space-between" align="center" marginBottom="medium">
        <Text type="h2" size="medium" weight="bold">
          📊 Comprehensive Billing Overview
        </Text>
        {onRefresh && (
          <Button onClick={onRefresh} size="small" kind="tertiary">
            🔄 Refresh
          </Button>
        )}
      </Flex>

      {/* Table Container with full width and proper scrolling */}
      <Box 
        className="comprehensive-billing-table-container"
        style={{ 
          width: '100%', 
          overflowX: 'auto',
          overflowY: 'visible',
          border: '1px solid #e1e5e9', 
          borderRadius: '8px',
          backgroundColor: 'white',
          maxHeight: 'none',
          height: 'auto',
          position: 'relative'
        }}>
        <table style={{ 
          width: '100%', 
          minWidth: '1400px', // Ensure minimum width for all columns
          borderCollapse: 'collapse', 
          fontSize: '12px',
          tableLayout: 'fixed'
        }}>
          {/* Table Header - Adjust sticky positioning */}
          <thead style={{ 
            backgroundColor: '#f8f9fa', 
            position: 'sticky', 
            top: 0, 
            zIndex: 2,
            // Ensure header doesn't overlap content
            borderBottom: '2px solid #e1e5e9'
          }}>
            <tr>
              {/* Fixed Information Columns */}
              <th 
                style={{ 
                  position: 'sticky', left: 0, backgroundColor: '#f8f9fa', 
                  padding: '12px 8px', textAlign: 'left', borderRight: '2px solid #e1e5e9',
                  width: '180px', cursor: 'pointer', zIndex: 3
                }}
                onClick={() => handleSort('name')}
              >
                <Text size="small" weight="bold">Item Name</Text>
              </th>
              
              <th style={{ padding: '8px 6px', textAlign: 'center', width: '90px' }}>
                <Text size="small" weight="bold">Date Received</Text>
              </th>
              
              <th style={{ padding: '8px 6px', textAlign: 'center', width: '90px' }}>
                <Text size="small" weight="bold">Bill Start Date</Text>
              </th>
              
              <th style={{ padding: '8px 6px', textAlign: 'right', width: '60px' }}>
                <Text size="small" weight="bold">CBM</Text>
              </th>
              
              <th style={{ padding: '8px 6px', textAlign: 'right', width: '70px' }}>
                <Text size="small" weight="bold">Rate/Day</Text>
              </th>
              
              <th style={{ padding: '8px 6px', textAlign: 'center', width: '90px' }}>
                <Text size="small" weight="bold">Scan Out Date</Text>
              </th>
              
              {/* Calculated Columns */}
              <th 
                style={{ 
                  padding: '8px 6px', textAlign: 'right', width: '100px',
                  backgroundColor: '#e8f4fd', cursor: 'pointer'
                }}
                onClick={() => handleSort('liveTotal')}
              >
                <Text size="small" weight="bold" color="primary">Live Price Total</Text>
              </th>
              
              <th 
                style={{ 
                  padding: '8px 6px', textAlign: 'right', width: '100px',
                  backgroundColor: '#fff3cd', cursor: 'pointer'
                }}
                onClick={() => handleSort('currentMonth')}
              >
                <Text size="small" weight="bold" style={{ color: '#856404' }}>Current Month</Text>
              </th>
              
              {/* Monthly Columns */}
              {monthlyColumns.map(col => (
                <th 
                  key={col.key}
                  style={{ 
                    padding: '8px 6px', textAlign: 'right', width: '80px',
                    borderLeft: '1px solid #e1e5e9', cursor: 'pointer'
                  }}
                  onClick={() => handleSort(`monthly_${col.key}`)}
                >
                  <Text size="small" weight="bold">{col.label}</Text>
                </th>
              ))}
            </tr>
          </thead>
          
          {/* Table Body */}
          <tbody>
            {sortedItems.map((item, index) => (
              <tr 
                key={item.id}
                style={{ 
                  borderBottom: '1px solid #e1e5e9',
                  backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafbfc'
                }}
              >
                {/* Fixed Information Columns */}
                <td 
                  style={{ 
                    position: 'sticky', left: 0, 
                    backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafbfc',
                    padding: '10px 8px', borderRight: '2px solid #e1e5e9',
                    fontWeight: 'bold', zIndex: 1
                  }}
                >
                  <Text size="small" weight="medium">{item.name}</Text>
                </td>
                
                <td style={{ padding: '10px 6px', textAlign: 'center' }}>
                  <Text size="small">{formatDate(getColumnValue(item, 'Date Received'))}</Text>
                </td>
                
                <td style={{ padding: '10px 6px', textAlign: 'center' }}>
                  <Text size="small">{formatDate(getBillStartDate(item))}</Text>
                </td>
                
                <td style={{ padding: '10px 6px', textAlign: 'right' }}>
                  <Text size="small">{getColumnValue(item, 'CBM')}</Text>
                </td>
                
                <td style={{ padding: '10px 6px', textAlign: 'right' }}>
                  <Text size="small">{formatCurrency(getRateValue(item))}</Text>
                </td>
                
                <td style={{ padding: '10px 6px', textAlign: 'center' }}>
                  <Text size="small">{formatDate(getColumnValue(item, 'Date Out'))}</Text>
                </td>
                
                {/* Calculated Columns */}
                <td style={{ 
                  padding: '10px 6px', textAlign: 'right',
                  backgroundColor: '#e8f4fd', fontWeight: 'bold'
                }}>
                  <Text size="small" weight="bold" color="primary">
                    {formatCurrency(calculateLivePriceToDate(item))}
                  </Text>
                </td>
                
                <td style={{ 
                  padding: '10px 6px', textAlign: 'right',
                  backgroundColor: '#fff3cd', fontWeight: 'bold'
                }}>
                  <Text size="small" weight="bold" style={{ color: '#856404' }}>
                    {formatCurrency(calculateCurrentMonthPriceToDate(item))}
                  </Text>
                </td>
                
                {/* Monthly Columns */}
                {monthlyColumns.map(col => {
                  const value = getMonthlyColumnValue(item, col.key);
                  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                  const isCurrentMonth = col.key === currentMonth;
                  
                  return (
                    <td 
                      key={col.key}
                      style={{ 
                        padding: '10px 6px', textAlign: 'right',
                        borderLeft: '1px solid #e1e5e9',
                        backgroundColor: isCurrentMonth ? '#d4edda' : 
                                       value > 0 ? '#f0f8ff' : 'transparent'
                      }}
                    >
                      <Text size="small" weight={isCurrentMonth ? 'bold' : 'normal'}>
                        {value > 0 ? formatCurrency(value) : '-'}
                      </Text>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          
          {/* Footer with totals */}
          <tfoot style={{ backgroundColor: '#f8f9fa', borderTop: '2px solid #4285f4' }}>
            <tr>
              <td 
                colSpan="6" 
                style={{ 
                  padding: '12px 8px', fontWeight: 'bold', textAlign: 'right',
                  position: 'sticky', left: 0, backgroundColor: '#f8f9fa',
                  borderRight: '2px solid #e1e5e9'
                }}
              >
                <Text weight="bold">TOTALS:</Text>
              </td>
              
              {/* Live Total Column */}
              <td style={{ 
                padding: '12px 6px', textAlign: 'right', fontWeight: 'bold',
                backgroundColor: '#4285f4', color: 'white'
              }}>
                <Text size="small" weight="bold">
                  {formatCurrency(sortedItems.reduce((sum, item) => sum + calculateLivePriceToDate(item), 0))}
                </Text>
              </td>
              
              {/* Current Month Total */}
              <td style={{ 
                padding: '12px 6px', textAlign: 'right', fontWeight: 'bold',
                backgroundColor: '#ffc107', color: '#212529'
              }}>
                <Text size="small" weight="bold">
                  {formatCurrency(sortedItems.reduce((sum, item) => sum + calculateCurrentMonthPriceToDate(item), 0))}
                </Text>
              </td>
              
              {/* Monthly Totals */}
              {monthlyColumns.map(col => {
                const total = sortedItems.reduce((sum, item) => sum + getMonthlyColumnValue(item, col.key), 0);
                return (
                  <td 
                    key={col.key}
                    style={{ 
                      padding: '12px 6px', textAlign: 'right', fontWeight: 'bold',
                      borderLeft: '1px solid #e1e5e9',
                      backgroundColor: total > 0 ? '#28a745' : '#f8f9fa',
                      color: total > 0 ? 'white' : '#6c757d'
                    }}
                  >
                    <Text size="small" weight="bold">
                      {total > 0 ? formatCurrency(total) : '-'}
                    </Text>
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </Box>
      
      {/* Summary Info */}
      <Box marginTop="medium">
        <Text type="text2" color="secondary" style={{ fontSize: '11px' }}>
          • Live Price Total: Running total from bill start date to current day
          • Current Month: Running total for {new Date().toLocaleDateString('en-US', { month: 'long' })} 1st to today
          • Monthly columns show end-of-month totals when available
        </Text>
      </Box>
    </Box>
  );
};

export default ComprehensiveBillingTable;