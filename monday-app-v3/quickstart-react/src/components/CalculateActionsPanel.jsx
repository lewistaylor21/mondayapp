import React, { useState } from "react";
import {
  Box,
  Button,
  Flex,
  Text,
  Divider,
  Counter,
  AttentionBox
} from "@vibe/core";

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
  stats = {}
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

  return (
    <Box padding="medium">
      {/* Header */}
      <Flex justify="space-between" align="center" marginBottom="medium">
        <div>
          <Text type="h2" size="medium" weight="bold">
            Billing Actions
          </Text>
          <Text type="text2" color="secondary">
            Calculate billing for different time periods or manage billing data
          </Text>
        </div>
        <Flex gap="small">
          {stats.total && <Counter count={stats.total} prefix="Items:" />}
          {stats.active && <Counter count={stats.active} color="positive" prefix="Active:" />}
        </Flex>
      </Flex>

      {!boardId && (
        <AttentionBox
          title="No board selected"
          text="Please ensure the app is properly installed on a Monday.com board"
          type="warning"
          style={{ marginBottom: "16px" }}
        />
      )}

      {/* Primary Actions */}
      <Box marginBottom="large">
        <Text type="text2" weight="medium" style={{ marginBottom: "8px" }}>
          Quick Calculations
        </Text>
        
        <Flex gap="medium" wrap>
          <Button
            onClick={() => handleQuickAction('current', onCalculateCurrentMonth)}
            kind="primary"
            size="medium"
            loading={quickActionLoading === 'current' || loading}
            disabled={disabled || !boardId}
            style={{ minWidth: '200px' }}
          >
            📅 Calculate Current Month
          </Button>

          <Button
            onClick={() => handleQuickAction('last', onCalculateLastMonth)}
            kind="secondary"
            size="medium"
            loading={quickActionLoading === 'last' || loading}
            disabled={disabled || !boardId}
            style={{ minWidth: '200px' }}
          >
            ⏰ Calculate Last Month
          </Button>

          <Button
            onClick={onCalculateSpecificMonth}
            kind="tertiary"
            size="medium"
            disabled={disabled || !boardId}
            style={{ minWidth: '200px' }}
          >
            📊 Select Month & Calculate
          </Button>
        </Flex>
      </Box>

      <Divider />

      {/* Invoice Actions */}
      <Box marginTop="large" marginBottom="large">
        <Text type="text2" weight="medium" style={{ marginBottom: "8px" }}>
          Invoice Management
        </Text>
        
        <Flex gap="medium">
          <Button
            onClick={() => handleQuickAction('invoices', onGenerateInvoices)}
            kind="primary"
            size="medium"
            loading={quickActionLoading === 'invoices' || loading}
            disabled={disabled || !boardId}
          >
            💳 Generate Invoices
          </Button>
        </Flex>
      </Box>

      <Divider />

      {/* Administrative Actions */}
      <Box marginTop="large">
        <Text type="text2" weight="medium" style={{ marginBottom: "8px" }}>
          Data Management
        </Text>
        
        <Flex gap="small">
          <Button
            onClick={() => handleQuickAction('billDates', onUpdateBillDates)}
            kind="secondary"
            size="small"
            loading={quickActionLoading === 'billDates' || loading}
            disabled={disabled || !boardId}
          >
            🔄 Update Bill Dates
          </Button>

          <Button
            onClick={() => handleQuickAction('refresh', onRefreshData)}
            kind="tertiary"
            size="small"
            loading={quickActionLoading === 'refresh' || loading}
            disabled={disabled}
          >
            🔁 Refresh Data
          </Button>
        </Flex>
      </Box>

      {/* Status Information */}
      {stats.totalBilling !== undefined && (
        <Box 
          marginTop="large"
          padding="small"
          style={{ 
            backgroundColor: "var(--color-primary-selected)",
            borderRadius: '4px'
          }}
        >
          <Flex justify="space-between" align="center">
            <div>
              <Text type="text2" color="secondary">
                Current Month Total
              </Text>
              <Text type="text1" weight="bold">
                £{Number(stats.totalBilling || 0).toFixed(2)}
              </Text>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Text type="text2" color="secondary">
                Average per Item
              </Text>
              <Text type="text1" weight="medium">
                £{stats.total > 0 ? (stats.totalBilling / stats.total).toFixed(2) : '0.00'}
              </Text>
            </div>
          </Flex>
        </Box>
      )}

      {/* Quick Help */}
      <Box marginTop="medium">
        <AttentionBox
          title="💡 Quick Tip"
          text="Use 'Select Month & Calculate' to calculate billing for any specific month - past, present, or future planning."
          type="success"
          compact
        />
      </Box>
    </Box>
  );
};

export default CalculateActionsPanel;