import React, { useState, useEffect, useCallback } from 'react';
// Monday.com SDK loaded via CDN
import {
  Button,
  Flex,
  Heading,
  Text,
  Box,
  Toast,
  Loader,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  TabList,
  Tab,
  TabPanel,
  TabPanels,
  TabsContext,
  IconButton,
  MenuButton,
  Menu,
  MenuItem,
  MenuTitle,
  Divider,
  Counter,
  AttentionBox
} from 'monday-ui-react-core';
import {
  Chart,
  CreditCard,
  Update,
  Item,
  Board,
  Status,
  Calendar,
  Info
} from 'monday-ui-react-core/icons';
import './App.css';

// Initialize Monday SDK
const monday = window.mondaySdk();

const App = () => {
  // Initialize Monday SDK
  const monday = window.mondaySdk();
  const [context, setContext] = useState({});
  const [boardData, setBoardData] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [toastMessage, setToastMessage] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [sdkStatus, setSdkStatus] = useState('Initializing...');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    scannedOut: 0,
    totalBilling: 0
  });

  // Initialize Monday context
  useEffect(() => {
    initializeMondayApp();
  }, []);

  const initializeMondayApp = async () => {
    try {
      setSdkStatus('Initializing Monday.com SDK...');
      
      // Initialize Monday SDK
      monday.init();
      
      // Listen for context
      monday.listen('context', (res) => {
        console.log('Monday.com context received:', res.data);
        setContext(res.data);
        setSdkStatus('Connected to Monday.com');
        
        if (res.data.boardId) {
          loadBoardData(res.data.boardId);
        }
      });

      // Listen for authentication
      monday.listen('auth', (res) => {
        console.log('Monday.com auth received:', res.data);
        setIsAuthenticated(true);
        setSdkStatus('Authenticated with Monday.com');
      });

      // Listen for board changes
      monday.listen('itemIds', (res) => {
        setSelectedItems(res.data);
      });

      // Set app frame height
      monday.execute('valueCreatedForUser');
      
      // Auto-adjust height for dashboard widget
      const adjustHeight = () => {
        const height = document.body.scrollHeight;
        monday.execute('setHeight', { height });
      };
      
      // Adjust height on content changes
      const resizeObserver = new ResizeObserver(adjustHeight);
      resizeObserver.observe(document.body);
      
      // Initial height adjustment
      setTimeout(adjustHeight, 100);
      
      showToast('Monday.com SDK initialized successfully!', 'positive');
    } catch (error) {
      console.error('Error initializing Monday.com SDK:', error);
      setSdkStatus('SDK Error: ' + error.message);
      showToast('Error initializing Monday.com SDK: ' + error.message, 'negative');
    }
  };

  // Load board data
  const loadBoardData = useCallback(async (boardId) => {
    if (!boardId) {
      showToast('No board ID available', 'negative');
      return;
    }

    setLoading(true);
    try {
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
              items {
                id
                name
                group {
                  id
                  title
                }
                column_values {
                  id
                  title
                  type
                  value
                  text
                }
              }
            }
          }
        }
      `;

      const response = await monday.api(query, { variables: { boardId } });
      
      if (response.error_code) {
        throw new Error(`Monday.com API Error: ${response.error_message}`);
      }
      
      const board = response.data.boards[0];
      
      if (!board) {
        throw new Error('Board not found');
      }
      
      setBoardData(board);
      setItems(board.items_page.items);
      calculateStats(board.items_page.items);
      showToast(`Loaded ${board.items_page.items.length} items from board`, 'positive');
    } catch (error) {
      showToast('Error loading board data: ' + error.message, 'negative');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate statistics
  const calculateStats = (items) => {
    const stats = {
      total: items.length,
      active: 0,
      scannedOut: 0,
      totalBilling: 0
    };

    items.forEach(item => {
      const status = getColumnValue(item, 'Status');
      const billing = parseFloat(getColumnValue(item, 'Current Month Billing') || 0);
      
      if (status === 'Active') stats.active++;
      if (status === 'Scanned Out') stats.scannedOut++;
      stats.totalBilling += billing;
    });

    setStats(stats);
  };

  // Get column value helper
  const getColumnValue = (item, columnTitle) => {
    const column = item.column_values.find(col => col.title === columnTitle);
    return column ? column.text || column.value : '';
  };

  // Show toast notification
  const showToast = (message, type = 'normal') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Calculate billing
  const handleCalculateBilling = async () => {
    if (!context.boardId) {
      showToast('No board selected', 'negative');
      return;
    }

    setLoading(true);
    try {
      await monday.execute('notice', {
        message: 'Calculating billing for current month...',
        type: 'info',
        timeout: 3000
      });

      // Call backend API with correct URL
      const response = await fetch('https://b4869-service-17505803-baada5af.us.monday.app/api/billing/calculate-current-month', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          boardId: context.boardId
        })
      });

      if (response.ok) {
        showToast('Billing calculated successfully!', 'positive');
        loadBoardData(context.boardId);
      } else {
        const error = await response.json();
        showToast('Error calculating billing: ' + error.message, 'negative');
      }
    } catch (error) {
      showToast('Error calculating billing: ' + error.message, 'negative');
    } finally {
      setLoading(false);
    }
  };

  // Generate invoices
  const handleGenerateInvoices = async () => {
    if (!context.boardId) {
      showToast('No board selected', 'negative');
      return;
    }

    setLoading(true);
    try {
      await monday.execute('notice', {
        message: 'Generating invoices...',
        type: 'info',
        timeout: 3000
      });

      // Call backend API with correct URL
      const response = await fetch('https://b4869-service-17505803-baada5af.us.monday.app/api/invoices/generate-current-month', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          boardId: context.boardId
        })
      });

      if (response.ok) {
        showToast('Invoices generated successfully!', 'positive');
      } else {
        const error = await response.json();
        showToast('Error generating invoices: ' + error.message, 'negative');
      }
    } catch (error) {
      showToast('Error generating invoices: ' + error.message, 'negative');
    } finally {
      setLoading(false);
    }
  };

  // Update bill dates
  const handleUpdateBillDates = async () => {
    if (!context.boardId) {
      showToast('No board selected', 'negative');
      return;
    }

    setLoading(true);
    try {
      await monday.execute('notice', {
        message: 'Updating bill dates...',
        type: 'info',
        timeout: 3000
      });

      // Call backend API with correct URL
      const response = await fetch('https://b4869-service-17505803-baada5af.us.monday.app/api/billing/update-bill-dates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          boardId: context.boardId
        })
      });

      if (response.ok) {
        showToast('Bill dates updated successfully!', 'positive');
        loadBoardData(context.boardId);
      } else {
        const error = await response.json();
        showToast('Error updating bill dates: ' + error.message, 'negative');
      }
    } catch (error) {
      showToast('Error updating bill dates: ' + error.message, 'negative');
    } finally {
      setLoading(false);
    }
  };

  // Render status indicator
  const renderStatus = (status) => {
    const statusColors = {
      'Active': 'positive',
      'Scanned Out': 'negative',
      'Pending': 'primary'
    };

    return (
      <Box className={`status-indicator ${statusColors[status] || 'primary'}`}>
        {status}
      </Box>
    );
  };

  return (
    <div className="monday-app">
      <Box className="app-header" padding={Box.paddings.LARGE}>
        <Flex direction={Flex.directions.ROW} justify={Flex.justify.SPACE_BETWEEN} align={Flex.align.CENTER}>
          <div>
            <Heading type={Heading.types.h1} value="Storage Billing Manager" />
            <Text type={Text.types.TEXT2} color={Text.colors.SECONDARY}>
              SDK Status: {sdkStatus}
            </Text>
            {boardData && (
              <Text type={Text.types.TEXT2} color={Text.colors.SECONDARY}>
                Board: {boardData.name}
              </Text>
            )}
          </div>
          <Flex gap={Flex.gaps.SMALL}>
            <Counter count={stats.total} kind={Counter.kinds.LINE} prefix="Items:" />
            <Counter count={stats.active} kind={Counter.kinds.LINE} color={Counter.colors.POSITIVE} prefix="Active:" />
          </Flex>
        </Flex>
      </Box>

      <Box padding={Box.paddings.LARGE}>
        <Flex direction={Flex.directions.COLUMN} gap={Flex.gaps.LARGE}>
          {/* Action Buttons */}
          <Flex gap={Flex.gaps.SMALL}>
            <Button
              onClick={handleCalculateBilling}
              leftIcon={Chart}
              loading={loading}
              kind={Button.kinds.PRIMARY}
              size={Button.sizes.MEDIUM}
              disabled={!isAuthenticated}
            >
              Calculate Current Month
            </Button>
            <Button
              onClick={handleGenerateInvoices}
              leftIcon={CreditCard}
              loading={loading}
              kind={Button.kinds.PRIMARY}
              size={Button.sizes.MEDIUM}
              disabled={!isAuthenticated}
            >
              Generate Invoices
            </Button>
            <Button
              onClick={handleUpdateBillDates}
              leftIcon={Update}
              loading={loading}
              kind={Button.kinds.SECONDARY}
              size={Button.sizes.MEDIUM}
              disabled={!isAuthenticated}
            >
              Update Bill Dates
            </Button>
          </Flex>

          {/* Statistics Cards */}
          <Flex gap={Flex.gaps.MEDIUM}>
            <Box className="stat-card">
              <Text type={Text.types.TEXT2} color={Text.colors.SECONDARY}>Total Items</Text>
              <Heading type={Heading.types.h2} value={stats.total.toString()} />
            </Box>
            <Box className="stat-card">
              <Text type={Text.types.TEXT2} color={Text.colors.SECONDARY}>Active Items</Text>
              <Heading type={Heading.types.h2} value={stats.active.toString()} color="positive" />
            </Box>
            <Box className="stat-card">
              <Text type={Text.types.TEXT2} color={Text.colors.SECONDARY}>Total Billing</Text>
              <Heading type={Heading.types.h2} value={`£${stats.totalBilling.toFixed(2)}`} />
            </Box>
          </Flex>

          {/* Main Content Tabs */}
          <TabsContext activeTabId={activeTab} className="main-tabs">
            <TabList>
              <Tab onClick={() => setActiveTab(0)}>All Items</Tab>
              <Tab onClick={() => setActiveTab(1)}>Active Only</Tab>
              <Tab onClick={() => setActiveTab(2)}>Billing Summary</Tab>
            </TabList>
            <TabPanels animationDirection={TabPanels.animationDirections.LTR}>
              <TabPanel className="items-panel">
                {loading ? (
                  <Flex justify={Flex.justify.CENTER} align={Flex.align.CENTER} style={{ minHeight: '200px' }}>
                    <Loader />
                  </Flex>
                ) : items.length > 0 ? (
                  <Table columns={[
                    { id: 'name', title: 'Item Name', width: 200 },
                    { id: 'status', title: 'Status', width: 120 },
                    { id: 'cbm', title: 'CBM', width: 80 },
                    { id: 'rate', title: 'Rate/Day', width: 100 },
                    { id: 'dateReceived', title: 'Date Received', width: 120 },
                    { id: 'billDate', title: 'Bill Date', width: 120 },
                    { id: 'billing', title: 'Current Billing', width: 120 }
                  ]}>
                    <TableHeader>
                      <TableHeaderCell title="Item Name" />
                      <TableHeaderCell title="Status" />
                      <TableHeaderCell title="CBM" />
                      <TableHeaderCell title="Rate/Day" />
                      <TableHeaderCell title="Date Received" />
                      <TableHeaderCell title="Bill Date" />
                      <TableHeaderCell title="Current Billing" />
                    </TableHeader>
                    <TableBody>
                      {items.map(item => (
                        <TableRow key={item.id}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{renderStatus(getColumnValue(item, 'Status'))}</TableCell>
                          <TableCell>{getColumnValue(item, 'CBM')}</TableCell>
                          <TableCell>£{getColumnValue(item, 'Rate per CBM/Day')}</TableCell>
                          <TableCell>{getColumnValue(item, 'Date Received')}</TableCell>
                          <TableCell>{getColumnValue(item, 'Bill Date')}</TableCell>
                          <TableCell>£{getColumnValue(item, 'Current Month Billing')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <AttentionBox
                    title="No items found"
                    text="Add storage items to your board to start calculating billing."
                    type={AttentionBox.types.EMPTY}
                  />
                )}
              </TabPanel>
              
              <TabPanel className="items-panel">
                {/* Active items only */}
                <Table>
                  <TableHeader>
                    <TableHeaderCell title="Item Name" />
                    <TableHeaderCell title="CBM" />
                    <TableHeaderCell title="Days Stored" />
                    <TableHeaderCell title="Current Billing" />
                  </TableHeader>
                  <TableBody>
                    {items.filter(item => getColumnValue(item, 'Status') === 'Active').map(item => (
                      <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{getColumnValue(item, 'CBM')}</TableCell>
                        <TableCell>{/* Calculate days */}30</TableCell>
                        <TableCell>£{getColumnValue(item, 'Current Month Billing')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabPanel>
              
              <TabPanel className="summary-panel">
                <Flex direction={Flex.directions.COLUMN} gap={Flex.gaps.MEDIUM}>
                  <AttentionBox
                    title="Billing Summary"
                    text={`Total billing for current month: £${stats.totalBilling.toFixed(2)}`}
                    type={AttentionBox.types.SUCCESS}
                  />
                  <Box className="summary-details">
                    <Text>Active items: {stats.active}</Text>
                    <Text>Average billing per item: £{stats.active > 0 ? (stats.totalBilling / stats.active).toFixed(2) : '0.00'}</Text>
                  </Box>
                </Flex>
              </TabPanel>
            </TabPanels>
          </TabsContext>
        </Flex>
      </Box>

      {/* Toast Notifications */}
      {toastMessage && (
        <Toast
          open
          type={toastMessage.type === 'positive' ? Toast.types.POSITIVE : 
                toastMessage.type === 'negative' ? Toast.types.NEGATIVE : 
                Toast.types.NORMAL}
          autoHideDuration={3000}
          onClose={() => setToastMessage(null)}
        >
          {toastMessage.message}
        </Toast>
      )}
    </div>
  );
};

export default App;
