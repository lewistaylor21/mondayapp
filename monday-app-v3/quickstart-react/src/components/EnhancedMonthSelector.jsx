import React, { useState } from "react";
import {
  Button,
  Flex,
  Text,
  Box
} from "@vibe/core";

const EnhancedMonthSelector = ({ 
  boardId, 
  selectedMonth, 
  selectedYear, 
  onCalculateCurrentMonth,
  onCalculateSelectedMonth,
  loading = false,
  calculating = false,
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSelection, setCurrentSelection] = useState({
    month: selectedMonth || new Date().getMonth(),
    year: selectedYear || new Date().getFullYear()
  });

  const formatMonthLabel = (month, year) => {
    const date = new Date(year, month, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const generateFutureMonths = () => {
    const currentDate = new Date();
    const months = [];
    
    // Generate current month + next 11 months for projections
    for (let i = 0; i <= 11; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      months.push({
        month: date.getMonth(),
        year: date.getFullYear(),
        label: formatMonthLabel(date.getMonth(), date.getFullYear()),
        isCurrent: i === 0,
        isFuture: i > 0
      });
    }
    
    return months;
  };

  const handleMonthSelect = (month, year) => {
    setCurrentSelection({ month, year });
    setIsOpen(false);
    // Auto-run calculation immediately to avoid second click
    if (onCalculateSelectedMonth) {
      onCalculateSelectedMonth(month, year);
    }
  };

  const handleCalculateSelected = async () => {
    if (onCalculateSelectedMonth && currentSelection.month !== undefined && currentSelection.year !== undefined) {
      await onCalculateSelectedMonth(currentSelection.month, currentSelection.year);
    }
  };

  const getCurrentMonthLabel = () => {
    return formatMonthLabel(currentSelection.month, currentSelection.year);
  };

  return (
    <Box>
      <Text type="h2" size="medium" weight="medium" style={{ marginBottom: "16px" }}>
        📅 Billing Calculations
      </Text>
      
      {/* Main Action Buttons */}
      <Flex gap="medium" wrap style={{ marginBottom: "16px" }}>
        <Button 
          type="button"
          onClick={(e) => { e.preventDefault(); setIsOpen(true); }}
          loading={loading || calculating}
          disabled={disabled || !boardId || calculating}
          kind="primary"
          size="medium"
        >
          📊 Calculate Month
        </Button>
        
        <Button 
          type="button"
          onClick={(e) => { e.preventDefault(); handleCalculateSelected(); }}
          loading={loading || calculating}
          disabled={disabled || !boardId || currentSelection.month === undefined || calculating}
          kind="tertiary"
          size="medium"
        >
          🔮 Calculate: {getCurrentMonthLabel()}
        </Button>
      </Flex>

      {/* Month Selection Dropdown */}
      {isOpen && (
        <Box 
          style={{
            position: 'relative',
            zIndex: 10,
            backgroundColor: 'white',
            border: '1px solid #e1e5e9',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Text type="text1" weight="medium" style={{ marginBottom: "12px" }}>
            Select Month for Future Projection:
          </Text>
          
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '8px'
            }}
          >
            {generateFutureMonths().map((monthData, index) => (
              <Button
                key={`${monthData.year}-${monthData.month}`}
                onClick={() => handleMonthSelect(monthData.month, monthData.year)}
                kind={
                  currentSelection.month === monthData.month && 
                  currentSelection.year === monthData.year 
                    ? "primary" 
                    : "tertiary"
                }
                size="small"
                style={{
                  justifyContent: 'flex-start',
                  padding: '8px 12px',
                  backgroundColor: monthData.isCurrent ? '#e8f4fd' : 
                                 monthData.isFuture ? '#f8f9fa' : 'white',
                  border: monthData.isCurrent ? '2px solid #4285f4' : '1px solid #e1e5e9'
                }}
              >
                <Flex direction="column" align="start">
                  <Text size="small" weight="medium">
                    {monthData.label}
                  </Text>
                  <Text size="small" style={{ fontSize: '10px', color: '#6c757d' }}>
                    {monthData.isCurrent ? 'Current Month' : 'Projection'}
                  </Text>
                </Flex>
              </Button>
            ))}
          </div>
          
          <Flex justify="space-between" align="center" marginTop="medium">
            <Text type="text2" color="secondary" style={{ fontSize: '11px' }}>
              💡 Future month calculations help estimate storage costs for customers
            </Text>
            <Button onClick={() => setIsOpen(false)} size="small" kind="tertiary">
              Close
            </Button>
          </Flex>
        </Box>
      )}
      
      {/* Current Selection Display */}
      {currentSelection.month !== undefined && (
        <Box 
          style={{
            padding: '8px 12px',
            backgroundColor: '#e8f4fd',
            borderRadius: '4px',
            border: '1px solid #4285f4'
          }}
        >
          <Text size="small">
            <strong>Selected for calculation:</strong> {getCurrentMonthLabel()}
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default EnhancedMonthSelector;