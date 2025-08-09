import React, { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Text,
  Divider,
  ButtonGroup,
  MenuButton,
  Menu,
  MenuItem,
  MenuTitle,
  IconButton,
  Tooltip,
  Counter,
  AttentionBox
} from 'monday-ui-react-core';
import {
  Chart,
  CreditCard,
  Update,
  Calendar,
  Replay,
  Time,
  Graph,
  Settings,
  Download
} from 'monday-ui-react-core/icons';

const CalculateActionsPanel = ({ 
  boardId,
  onCalculateCurrentMonth,
  onCalculateLastMonth,
  onCalculateSpecificMonth,
  onGenerateInvoices,
  onUpdateBillDates,
  onRefreshData,
  loading = false,
  disabled = false,
  stats = {},
  onOpenMonthSelector
}) => {
  const [quickActionLoading, setQuickActionLoading] = useState(null);

  const handleQuickAction = async (action, actionFunction) => {
    setQuickActionLoading(action);
    try {
      await actionFunction();
    } finally {
      setQuickActionLoading(null);
    }
  };

  const quickMonthOptions = [
    {
      label: 'Current Month',
      action: 'current',
      icon: Calendar,
      description: 'Calculate billing for the current month',
      color: 'primary'
    },
    {
      label: 'Last Month',
      action: 'last',
      icon: Time,
      description: 'Calculate billing for the previous month',
      color: 'secondary'
    },
    {
      label: 'Last 3 Months',
      action: 'last3',
      icon: Graph,
      description: 'Calculate billing for the last 3 months',
      color: 'tertiary'
    }
  ];

  const adminActions = [
    {
      label: 'Update Bill Dates',
      action: onUpdateBillDates,
      icon: Update,
      description: 'Recalculate bill start dates for all items',
      color: 'secondary'
    },
    {
      label: 'Refresh Data',
      action: onRefreshData,
      icon: Replay,
      description: 'Reload all board data from Monday.com',
      color: 'tertiary'
    }
  ];

  return (
    <Box className="calculate-actions-panel" padding={Box.paddings.MEDIUM}>
      {/* Header */}
      <Flex justify={Flex.justify.SPACE_BETWEEN} align={Flex.align.CENTER} marginBottom={Box.margins.MEDIUM}>
        <div>
          <Text type={Text.types.TEXT1} weight={Text.weights.BOLD}>
            Billing Actions
          </Text>
          <Text type={Text.types.TEXT2} color={Text.colors.SECONDARY}>
            Calculate billing for different time periods or manage billing data
          </Text>
        </div>
        <Flex gap={Flex.gaps.SMALL}>
          {stats.total && <Counter count={stats.total} kind={Counter.kinds.LINE} prefix="Items:" />}
          {stats.active && <Counter count={stats.active} kind={Counter.kinds.LINE} color={Counter.colors.POSITIVE} prefix="Active:" />}
        </Flex>
      </Flex>

      {!boardId && (
        <AttentionBox
          title="No board selected"
          text="Please ensure the app is properly installed on a Monday.com board"
          type={AttentionBox.types.WARNING}
          marginBottom={Box.margins.MEDIUM}
        />
      )}

      {/* Primary Actions */}
      <Box marginBottom={Box.margins.LARGE}>
        <Text type={Text.types.TEXT2} weight={Text.weights.MEDIUM} marginBottom={Box.margins.SMALL}>
          Quick Calculations
        </Text>
        
        <Flex gap={Flex.gaps.MEDIUM} wrap>
          <Button
            onClick={onOpenMonthSelector}
            leftIcon={Calendar}
            kind={Button.kinds.PRIMARY}
            size={Button.sizes.MEDIUM}
            loading={quickActionLoading === 'current' || loading}
            disabled={disabled || !boardId}
            style={{ minWidth: '200px' }}
          >
            Calculate Month
          </Button>

          <Button
            onClick={() => handleQuickAction('last', onCalculateLastMonth)}
            leftIcon={Time}
            kind={Button.kinds.SECONDARY}
            size={Button.sizes.MEDIUM}
            loading={quickActionLoading === 'last' || loading}
            disabled={disabled || !boardId}
            style={{ minWidth: '200px' }}
          >
            Calculate Last Month
          </Button>

          {/* Removed separate select month button; main button opens selector */}
        </Flex>
      </Box>

      <Divider />

      {/* Invoice Actions */}
      <Box marginTop={Box.margins.LARGE} marginBottom={Box.margins.LARGE}>
        <Text type={Text.types.TEXT2} weight={Text.weights.MEDIUM} marginBottom={Box.margins.SMALL}>
          Invoice Management
        </Text>
        
        <Flex gap={Flex.gaps.MEDIUM}>
          <Button
            onClick={() => handleQuickAction('invoices', onGenerateInvoices)}
            leftIcon={CreditCard}
            kind={Button.kinds.PRIMARY}
            size={Button.sizes.MEDIUM}
            loading={quickActionLoading === 'invoices' || loading}
            disabled={disabled || !boardId}
          >
            Generate Invoices
          </Button>

          <MenuButton component={Button}>
            <Menu>
              <MenuTitle caption="Invoice Options" />
              <MenuItem 
                title="Current Month Invoices" 
                onClick={() => onGenerateInvoices('current')}
                iconName={Calendar}
              />
              <MenuItem 
                title="Last Month Invoices" 
                onClick={() => onGenerateInvoices('last')}
                iconName={Time}
              />
              <MenuItem 
                title="Custom Date Range" 
                onClick={() => onGenerateInvoices('custom')}
                iconName={Settings}
              />
            </Menu>
            Invoice Options
          </MenuButton>
        </Flex>
      </Box>

      <Divider />

      {/* Administrative Actions */}
      <Box marginTop={Box.margins.LARGE}>
        <Text type={Text.types.TEXT2} weight={Text.weights.MEDIUM} marginBottom={Box.margins.SMALL}>
          Data Management
        </Text>
        
        <Flex gap={Flex.gaps.SMALL}>
          <Button
            onClick={() => handleQuickAction('billDates', onUpdateBillDates)}
            leftIcon={Update}
            kind={Button.kinds.SECONDARY}
            size={Button.sizes.SMALL}
            loading={quickActionLoading === 'billDates' || loading}
            disabled={disabled || !boardId}
          >
            Update Bill Dates
          </Button>

          <Button
            onClick={() => handleQuickAction('refresh', onRefreshData)}
            leftIcon={Replay}
            kind={Button.kinds.TERTIARY}
            size={Button.sizes.SMALL}
            loading={quickActionLoading === 'refresh' || loading}
            disabled={disabled}
          >
            Refresh Data
          </Button>

          <Tooltip content="Export billing data">
            <IconButton
              icon={Download}
              kind={IconButton.kinds.SECONDARY}
              size={IconButton.sizes.SMALL}
              disabled={disabled || !boardId}
            />
          </Tooltip>
        </Flex>
      </Box>

      {/* Status Information */}
      {stats.totalBilling !== undefined && (
        <Box 
          marginTop={Box.margins.LARGE}
          padding={Box.paddings.SMALL}
          backgroundColor="var(--primary-background-hover-color)"
          style={{ borderRadius: '8px' }}
        >
          <Flex justify={Flex.justify.SPACE_BETWEEN} align={Flex.align.CENTER}>
            <div>
              <Text type={Text.types.TEXT2} color={Text.colors.SECONDARY}>
                Current Month Total
              </Text>
              <Text type={Text.types.TEXT1} weight={Text.weights.BOLD}>
                £{Number(stats.totalBilling || 0).toFixed(2)}
              </Text>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Text type={Text.types.TEXT2} color={Text.colors.SECONDARY}>
                Average per Item
              </Text>
              <Text type={Text.types.TEXT1} weight={Text.weights.MEDIUM}>
                £{stats.total > 0 ? (stats.totalBilling / stats.total).toFixed(2) : '0.00'}
              </Text>
            </div>
          </Flex>
        </Box>
      )}

      {/* Quick Help */}
      <Box marginTop={Box.margins.MEDIUM}>
        <AttentionBox
          title="💡 Quick Tip"
          text="Use 'Select Month & Calculate' to calculate billing for any specific month - past, present, or future planning."
          type={AttentionBox.types.SUCCESS}
          compact
        />
      </Box>
    </Box>
  );
};

export default CalculateActionsPanel;