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

  // Enhanced column value helper with debugging
  const getColumnValue = (item, columnTitle) => {
    if (!boardData?.columns || !item.column_values) {
      console.log(`getColumnValue: Missing data for ${columnTitle}`);
      return '';
    }
    
    const column = boardData.columns.find(col => col.title === columnTitle);
    if (!column) {
      // Log available columns for debugging
      console.log(`Column "${columnTitle}" not found. Available columns:`, 
        boardData.columns.map(c => c.title));
      return '';
    }
    
    const columnValue = item.column_values.find(cv => cv.id === column.id);
    const result = columnValue ? (columnValue.text || columnValue.value || '') : '';
    
    console.log(`getColumnValue(${item.name}, ${columnTitle}):`, {
      found: !!column,
      columnId: column.id,
      rawValue: columnValue,
      result: result
    });
    
    return result;
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

  // Calculate live price to date (total from bill start to current day)
  const calculateLivePriceToDate = (item) => {
    const billStartDate = calculateBillStartDate(item);
    const rate = getRateValue(item);
    const cbm = parseFloat(getColumnValue(item, 'CBM') || 0);
    
    console.log(`Calculating Live Price for ${item.name}:`, {
      billStartDate,
      rate,
      cbm
    });
    
    if (!billStartDate || !rate || !cbm) {
      console.log(`Missing data for Live Price calculation: billStartDate=${billStartDate}, rate=${rate}, cbm=${cbm}`);
      return 0;
    }
    
    try {
      const startDate = new Date(billStartDate);
      const today = new Date();
      const timeDiff = today.getTime() - startDate.getTime();
      const daysDiff = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
      
      const livePrice = daysDiff * rate * cbm;
      console.log(`Live Price calculation for ${item.name}: ${daysDiff} days × £${rate} × ${cbm} CBM = £${livePrice.toFixed(2)}`);
      
      return livePrice;
    } catch (error) {
      console.error(`Error calculating live price for ${item.name}:`, error);
      return 0;
    }
  };

  // Calculate current month price to date (from start of current month to today)
  const calculateCurrentMonthPriceToDate = (item) => {
    const billStartDate = calculateBillStartDate(item);
    const rate = getRateValue(item);
    const cbm = parseFloat(getColumnValue(item, 'CBM') || 0);
    
    console.log(`Calculating Current Month Price for ${item.name}:`, {
      billStartDate,
      rate,
      cbm
    });
    
    if (!billStartDate || !rate || !cbm) {
      console.log(`Missing data for Current Month calculation: billStartDate=${billStartDate}, rate=${rate}, cbm=${cbm}`);
      return 0;
    }
    
    try {
      const startDate = new Date(billStartDate);
      const today = new Date();
      const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      
      // Use the later of bill start date or current month start
      const effectiveStartDate = startDate > currentMonthStart ? startDate : currentMonthStart;
      
      const timeDiff = today.getTime() - effectiveStartDate.getTime();
      const daysDiff = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
      
      const currentMonthPrice = daysDiff * rate * cbm;
      console.log(`Current Month calculation for ${item.name}: ${daysDiff} days × £${rate} × ${cbm} CBM = £${currentMonthPrice.toFixed(2)}`);
      
      return currentMonthPrice;
    } catch (error) {
      console.error(`Error calculating current month price for ${item.name}:`, error);
      return 0;
    }
  };

  // Get monthly column value
  const getMonthlyColumnValue = (item, monthYear) => {
    const columnTitle = `${monthYear} Billing`;
    const value = getColumnValue(item, columnTitle);
    return value ? parseFloat(value) : 0;
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
                  <Text size="small">{formatDate(getColumnValue(item, 'Billing Start Date'))}</Text>
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