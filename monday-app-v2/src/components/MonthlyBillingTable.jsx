import React, { useState, useEffect, useMemo } from 'react';
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
  Loader,
  AttentionBox,
  Tooltip,
  Button,
  IconButton
} from 'monday-ui-react-core';
import {
  Info,
  Download,
  Replay,
  Sort
} from 'monday-ui-react-core/icons';

const MonthlyBillingTable = ({ 
  items = [], 
  boardData = null, 
  loading = false,
  onRefresh,
  showMonthlyColumns = true 
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [monthlyColumns, setMonthlyColumns] = useState([]);

  // Extract monthly billing columns from board data
  useEffect(() => {
    if (boardData && Array.isArray(boardData.columns)) {
      const monthlyBillingCols = boardData.columns
        .filter(col => typeof col?.title === 'string' && col.title.includes('Billing') && col.title.match(/20\d{2}/))
        .sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      setMonthlyColumns(monthlyBillingCols);
    } else {
      setMonthlyColumns([]);
    }
  }, [boardData]);

  // Get column value helper
  const getColumnValue = (item, columnTitle) => {
    const column = item.column_values?.find(col => col.title === columnTitle);
    return column ? column.text || column.value : '';
  };

  // Get monthly column value
  const getMonthlyColumnValue = (item, columnId) => {
    const column = item.column_values?.find(col => col.id === columnId);
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

  // Render status indicator
  const renderStatus = (status) => {
    const statusColors = {
      'Active': '#00C875',
      'Scanned Out': '#E2445C',
      'Pending': '#FDAB3D'
    };

    return (
      <Box 
        style={{
          backgroundColor: statusColors[status] || '#C4C4C4',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 'bold',
          textAlign: 'center',
          minWidth: '80px'
        }}
      >
        {status || 'Unknown'}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box className="billing-table-loading" padding={Box.paddings.LARGE}>
        <Flex justify={Flex.justify.CENTER} align={Flex.align.CENTER} style={{ minHeight: '200px' }}>
          <Loader />
        </Flex>
      </Box>
    );
  }

  if (!items.length) {
    return (
      <AttentionBox
        title="No storage items found"
        text="Add items to your Monday.com board to see monthly billing calculations."
        type={AttentionBox.types.EMPTY}
      />
    );
  }

  // Calculate grand total
  const grandTotal = monthlyColumns.reduce((total, col) => {
    return total + calculateColumnTotal(col.id);
  }, 0);

  return (
    <Box className="monthly-billing-table">
      {/* Table Header Controls */}
      <Flex justify={Flex.justify.SPACE_BETWEEN} align={Flex.align.CENTER} marginBottom={Flex.gaps.MEDIUM}>
        <Text type={Text.types.TEXT1} weight={Text.weights.BOLD}>
          Monthly Billing Overview
        </Text>
        <Flex gap={Flex.gaps.SMALL}>
          <Tooltip content="Refresh data">
            <IconButton
              icon={Replay}
              onClick={onRefresh}
              size={IconButton.sizes.SMALL}
              kind={IconButton.kinds.SECONDARY}
            />
          </Tooltip>
          <Tooltip content="Export to CSV">
            <IconButton
              icon={Download}
              size={IconButton.sizes.SMALL}
              kind={IconButton.kinds.SECONDARY}
            />
          </Tooltip>
        </Flex>
      </Flex>

      {/* Summary Statistics */}
      <Box 
        marginBottom={Box.margins.MEDIUM} 
        padding={Box.paddings.SMALL}
        backgroundColor="var(--primary-background-hover-color)"
        style={{ borderRadius: '8px' }}
      >
        <Flex gap={Flex.gaps.LARGE}>
          <Text size={Text.sizes.SMALL}>
            <strong>Total Items:</strong> {items.length}
          </Text>
          <Text size={Text.sizes.SMALL}>
            <strong>Grand Total:</strong> {formatCurrency(grandTotal)}
          </Text>
          <Text size={Text.sizes.SMALL}>
            <strong>Monthly Columns:</strong> {monthlyColumns.length}
          </Text>
        </Flex>
      </Box>

      {/* Scrollable Table Container */}
      <Box style={{ overflowX: 'auto', maxHeight: '600px', border: '1px solid var(--ui-border-color)', borderRadius: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead style={{ backgroundColor: '#f8f9fa', position: 'sticky', top: 0, zIndex: 1 }}>
            <tr>
              {/* Fixed Columns */}
              <th 
                style={{ 
                  position: 'sticky', 
                  left: 0, 
                  backgroundColor: '#f8f9fa',
                  padding: '12px 8px',
                  textAlign: 'left',
                  borderRight: '2px solid #e1e5e9',
                  minWidth: '200px',
                  cursor: 'pointer',
                  zIndex: 2
                }}
                onClick={() => handleSort('name')}
              >
                <Flex align={Flex.align.CENTER} gap={Flex.gaps.XS}>
                  <Text size={Text.sizes.SMALL} weight={Text.weights.BOLD}>Item Name</Text>
                  <Sort size="16" />
                </Flex>
              </th>
              
              <th style={{ padding: '12px 8px', textAlign: 'center', minWidth: '100px' }}>
                <Text size={Text.sizes.SMALL} weight={Text.weights.BOLD}>Status</Text>
              </th>
              
              <th style={{ padding: '12px 8px', textAlign: 'right', minWidth: '80px' }}>
                <Text size={Text.sizes.SMALL} weight={Text.weights.BOLD}>CBM</Text>
              </th>
              
              <th style={{ padding: '12px 8px', textAlign: 'right', minWidth: '100px' }}>
                <Text size={Text.sizes.SMALL} weight={Text.weights.BOLD}>Rate/Day</Text>
              </th>

              {/* Monthly Columns */}
              {showMonthlyColumns && monthlyColumns.map(col => (
                <th 
                  key={col.id}
                  style={{ 
                    padding: '12px 8px', 
                    textAlign: 'right', 
                    minWidth: '120px',
                    cursor: 'pointer',
                    borderLeft: '1px solid #e1e5e9'
                  }}
                  onClick={() => handleSort(`monthly_${col.id}`)}
                >
                  <Flex align={Flex.align.CENTER} justify={Flex.justify.END} gap={Flex.gaps.XS}>
                    <Text size={Text.sizes.SMALL} weight={Text.weights.BOLD}>
                      {col.title.replace(' Billing', '')}
                    </Text>
                    <Sort size="14" />
                  </Flex>
                </th>
              ))}
              
              {/* Row Total Column */}
              <th 
                style={{ 
                  padding: '12px 8px', 
                  textAlign: 'right', 
                  minWidth: '120px',
                  backgroundColor: '#e8f4fd',
                  borderLeft: '2px solid #4285f4',
                  cursor: 'pointer'
                }}
                onClick={() => handleSort('total')}
              >
                <Flex align={Flex.align.CENTER} justify={Flex.justify.END} gap={Flex.gaps.XS}>
                  <Text size={Text.sizes.SMALL} weight={Text.weights.BOLD} color="primary">
                    Total
                  </Text>
                  <Sort size="14" />
                </Flex>
              </th>
            </tr>
          </thead>
          
          <tbody>
            {sortedItems.map((item, index) => (
              <tr 
                key={item.id} 
                style={{ 
                  borderBottom: '1px solid #e1e5e9',
                  backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafbfc'
                }}
              >
                {/* Fixed Columns */}
                <td 
                  style={{ 
                    position: 'sticky', 
                    left: 0, 
                    backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafbfc',
                    padding: '12px 8px',
                    borderRight: '2px solid #e1e5e9',
                    fontWeight: 'bold',
                    zIndex: 1
                  }}
                >
                  {item.name}
                </td>
                
                <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                  {renderStatus(getColumnValue(item, 'Status'))}
                </td>
                
                <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                  {getColumnValue(item, 'CBM')}
                </td>
                
                <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                  {formatCurrency(getColumnValue(item, 'Rate per CBM/Day'))}
                </td>

                {/* Monthly Columns */}
                {showMonthlyColumns && monthlyColumns.map(col => {
                  const value = getMonthlyColumnValue(item, col.id);
                  return (
                    <td 
                      key={col.id}
                      style={{ 
                        padding: '12px 8px', 
                        textAlign: 'right',
                        borderLeft: '1px solid #e1e5e9',
                        backgroundColor: value > 0 ? '#f0f8ff' : 'transparent'
                      }}
                    >
                      {value > 0 ? formatCurrency(value) : '-'}
                    </td>
                  );
                })}
                
                {/* Row Total */}
                <td 
                  style={{ 
                    padding: '12px 8px', 
                    textAlign: 'right',
                    backgroundColor: '#e8f4fd',
                    borderLeft: '2px solid #4285f4',
                    fontWeight: 'bold',
                    color: '#4285f4'
                  }}
                >
                  {formatCurrency(calculateRowTotal(item))}
                </td>
              </tr>
            ))}
          </tbody>
          
          {/* Footer with column totals */}
          <tfoot style={{ backgroundColor: '#f8f9fa', borderTop: '2px solid #4285f4' }}>
            <tr>
              <td 
                colSpan={4} 
                style={{ 
                  padding: '12px 8px', 
                  fontWeight: 'bold',
                  textAlign: 'right',
                  position: 'sticky',
                  left: 0,
                  backgroundColor: '#f8f9fa',
                  borderRight: '2px solid #e1e5e9'
                }}
              >
                Column Totals:
              </td>
              
              {showMonthlyColumns && monthlyColumns.map(col => {
                const total = calculateColumnTotal(col.id);
                return (
                  <td 
                    key={col.id}
                    style={{ 
                      padding: '12px 8px', 
                      textAlign: 'right',
                      fontWeight: 'bold',
                      backgroundColor: total > 0 ? '#e8f4fd' : '#f8f9fa',
                      borderLeft: '1px solid #e1e5e9'
                    }}
                  >
                    {total > 0 ? formatCurrency(total) : '-'}
                  </td>
                );
              })}
              
              <td 
                style={{ 
                  padding: '12px 8px', 
                  textAlign: 'right',
                  backgroundColor: '#4285f4',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  borderLeft: '2px solid #4285f4'
                }}
              >
                {formatCurrency(grandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </Box>
    </Box>
  );
};

export default MonthlyBillingTable;