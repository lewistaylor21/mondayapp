import React, { useState, useMemo } from "react";
import {
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  Text,
  Box,
  Flex,
  Button,
  Loader,
  AttentionBox
} from "@vibe/core";

const MonthlyBillingTable = ({ 
  items = [], 
  boardData = null, 
  loading = false,
  onRefresh 
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Extract monthly billing columns from board data
  const monthlyColumns = useMemo(() => {
    if (!boardData?.columns) return [];
    
    return boardData.columns
      .filter(col => col.title && col.title.includes('Billing') && col.title.includes('202'))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [boardData]);

  // Get column value helper
  const getColumnValue = (item, columnTitle) => {
    if (!item.column_values) return '';
    const column = item.column_values.find(col => {
      // Find by matching column ID with board columns
      const boardCol = boardData?.columns?.find(bc => bc.id === col.id);
      return boardCol?.title === columnTitle;
    });
    return column ? (column.text || column.value || '') : '';
  };

  // Get monthly column value
  const getMonthlyColumnValue = (item, columnId) => {
    if (!item.column_values) return 0;
    const column = item.column_values.find(col => col.id === columnId);
    if (column && column.text && column.text !== '') {
      const value = parseFloat(column.text);
      return isNaN(value) ? 0 : value;
    }
    return 0;
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `£${Number(amount).toFixed(2)}`;
  };

  // Calculate row totals
  const calculateRowTotal = (item) => {
    return monthlyColumns.reduce((total, col) => {
      return total + getMonthlyColumnValue(item, col.id);
    }, 0);
  };

  // Calculate column totals
  const calculateColumnTotal = (columnId) => {
    return items.reduce((total, item) => {
      return total + getMonthlyColumnValue(item, columnId);
    }, 0);
  };

  // Calculate grand total
  const grandTotal = monthlyColumns.reduce((total, col) => {
    return total + calculateColumnTotal(col.id);
  }, 0);

  // Sort items
  const sortedItems = useMemo(() => {
    if (!sortConfig.key) return items;

    return [...items].sort((a, b) => {
      let aValue, bValue;

      if (sortConfig.key === 'name') {
        aValue = a.name;
        bValue = b.name;
      } else if (sortConfig.key === 'total') {
        aValue = calculateRowTotal(a);
        bValue = calculateRowTotal(b);
      } else if (sortConfig.key.startsWith('monthly_')) {
        const columnId = sortConfig.key.replace('monthly_', '');
        aValue = getMonthlyColumnValue(a, columnId);
        bValue = getMonthlyColumnValue(b, columnId);
      } else {
        aValue = getColumnValue(a, sortConfig.key);
        bValue = getColumnValue(b, sortConfig.key);
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [items, sortConfig, monthlyColumns]);

  // Handle sort
  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
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

  if (!items.length) {
    return (
      <AttentionBox
        title="No storage items found"
        text="Add items to your Monday.com board to see monthly billing calculations."
        type="info"
      />
    );
  }

  return (
    <Box>
      {/* Table Header Controls */}
      <Flex justify="space-between" align="center" marginBottom="medium">
        <Text type="h2" size="medium" weight="bold">
          Monthly Billing Overview
        </Text>
        <Flex gap="small">
          {onRefresh && (
            <Button onClick={onRefresh} size="small" kind="tertiary">
              Refresh Data
            </Button>
          )}
        </Flex>
      </Flex>

      {/* Summary Statistics */}
      <Box 
        marginBottom="medium" 
        padding="medium"
        style={{ 
          backgroundColor: "var(--color-snow)",
          border: "1px solid var(--color-ui-border-color)",
          borderRadius: "4px"
        }}
      >
        <Flex gap="large">
          <Text size="small">
            <strong>Total Items:</strong> {items.length}
          </Text>
          <Text size="small">
            <strong>Grand Total:</strong> {formatCurrency(grandTotal)}
          </Text>
          <Text size="small">
            <strong>Monthly Columns:</strong> {monthlyColumns.length}
          </Text>
        </Flex>
      </Box>

      {/* Monthly Billing Table */}
      <Box style={{ overflowX: 'auto' }}>
        <Table>
          <TableHeader>
            <TableHeaderCell onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
              Item Name
            </TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>CBM</TableHeaderCell>
            <TableHeaderCell>Rate/Day</TableHeaderCell>
            
            {/* Monthly Columns */}
            {monthlyColumns.map(col => (
              <TableHeaderCell 
                key={col.id}
                onClick={() => handleSort(`monthly_${col.id}`)}
                style={{ cursor: 'pointer', minWidth: '120px' }}
              >
                {col.title.replace(' Billing', '')}
              </TableHeaderCell>
            ))}
            
            <TableHeaderCell 
              onClick={() => handleSort('total')}
              style={{ 
                cursor: 'pointer',
                backgroundColor: 'var(--color-primary-selected)',
                fontWeight: 'bold'
              }}
            >
              Total
            </TableHeaderCell>
          </TableHeader>
          
          <TableBody>
            {sortedItems.map((item, index) => (
              <TableRow key={item.id}>
                <TableCell style={{ fontWeight: 'bold' }}>
                  {item.name}
                </TableCell>
                
                <TableCell>
                  <Box 
                    style={{
                      backgroundColor: getColumnValue(item, 'Status') === 'Active' ? '#00C875' : 
                                     getColumnValue(item, 'Status') === 'Scanned Out' ? '#E2445C' : '#FDAB3D',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      minWidth: '80px'
                    }}
                  >
                    {getColumnValue(item, 'Status') || 'Unknown'}
                  </Box>
                </TableCell>
                
                <TableCell>
                  {getColumnValue(item, 'CBM')}
                </TableCell>
                
                <TableCell>
                  {formatCurrency(getColumnValue(item, 'Rate per CBM/Day') || 0)}
                </TableCell>

                {/* Monthly Columns */}
                {monthlyColumns.map(col => {
                  const value = getMonthlyColumnValue(item, col.id);
                  return (
                    <TableCell 
                      key={col.id}
                      style={{ 
                        textAlign: 'right',
                        backgroundColor: value > 0 ? 'var(--color-success-selected)' : 'transparent'
                      }}
                    >
                      {value > 0 ? formatCurrency(value) : '-'}
                    </TableCell>
                  );
                })}
                
                {/* Row Total */}
                <TableCell 
                  style={{ 
                    textAlign: 'right',
                    backgroundColor: 'var(--color-primary-selected)',
                    fontWeight: 'bold',
                    color: 'var(--color-primary)'
                  }}
                >
                  {formatCurrency(calculateRowTotal(item))}
                </TableCell>
              </TableRow>
            ))}
            
            {/* Footer with column totals */}
            <TableRow style={{ backgroundColor: 'var(--color-snow)', fontWeight: 'bold' }}>
              <TableCell colSpan="4" style={{ textAlign: 'right' }}>
                Column Totals:
              </TableCell>
              
              {monthlyColumns.map(col => {
                const total = calculateColumnTotal(col.id);
                return (
                  <TableCell 
                    key={col.id}
                    style={{ 
                      textAlign: 'right',
                      fontWeight: 'bold',
                      backgroundColor: total > 0 ? 'var(--color-success-selected)' : 'var(--color-snow)'
                    }}
                  >
                    {total > 0 ? formatCurrency(total) : '-'}
                  </TableCell>
                );
              })}
              
              <TableCell 
                style={{ 
                  textAlign: 'right',
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}
              >
                {formatCurrency(grandTotal)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Box>
    </Box>
  );
};

export default MonthlyBillingTable;