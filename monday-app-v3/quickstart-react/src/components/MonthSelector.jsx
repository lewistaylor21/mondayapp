import React, { useState, useEffect } from "react";
import {
  Button,
  Flex,
  Text,
  Box,
  Modal,
  ModalContent,
  ModalHeader,
  ModalFooterButtons
} from "@vibe/core";

const MonthSelector = ({ 
  boardId, 
  selectedMonth, 
  selectedYear, 
  onMonthChange, 
  onCalculate,
  loading = false,
  disabled = false 
}) => {
  const [availableMonths, setAvailableMonths] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingMonths, setLoadingMonths] = useState(false);
  const [currentSelection, setCurrentSelection] = useState({
    month: selectedMonth,
    year: selectedYear
  });

  useEffect(() => {
    if (boardId) {
      loadAvailableMonths();
    }
  }, [boardId]);

  const loadAvailableMonths = async () => {
    setLoadingMonths(true);
    try {
      const response = await fetch(`https://b4869-service-17505803-baada5af.us.monday.app/api/billing/available-months/${boardId}`);
      const data = await response.json();
      
      if (data.success) {
        setAvailableMonths(data.months);
      }
    } catch (error) {
      console.error('Error loading available months:', error);
    } finally {
      setLoadingMonths(false);
    }
  };

  const handleMonthSelect = (month, year) => {
    setCurrentSelection({ month, year });
    if (onMonthChange) {
      onMonthChange(month, year);
    }
  };

  const handleCalculateForMonth = async () => {
    if (onCalculate && currentSelection.month !== undefined && currentSelection.year !== undefined) {
      await onCalculate(currentSelection.month, currentSelection.year);
    }
    setIsModalOpen(false);
  };

  const formatMonthLabel = (month, year) => {
    const date = new Date(year, month, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getCurrentMonthLabel = () => {
    if (currentSelection.month !== undefined && currentSelection.year !== undefined) {
      return formatMonthLabel(currentSelection.month, currentSelection.year);
    }
    const now = new Date();
    return formatMonthLabel(now.getMonth(), now.getFullYear());
  };

  const generateMonthGrid = () => {
    const currentDate = new Date();
    const months = [];
    
    // Generate past 6 months, current, and next 6 months
    for (let i = -6; i <= 6; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      months.push({
        month: date.getMonth(),
        year: date.getFullYear(),
        label: formatMonthLabel(date.getMonth(), date.getFullYear()),
        isPast: i < 0,
        isCurrent: i === 0,
        isFuture: i > 0
      });
    }
    
    return months;
  };

  return (
    <Box>
      <Flex gap="small" align="center">
        <Button
          onClick={() => setIsModalOpen(true)}
          kind="secondary"
          size="medium"
          disabled={disabled || loadingMonths}
        >
          📅 {getCurrentMonthLabel()}
        </Button>
        
        <Button
          onClick={handleCalculateForMonth}
          kind="primary"
          size="medium"
          loading={loading}
          disabled={disabled || currentSelection.month === undefined}
        >
          Calculate Selected Month
        </Button>
      </Flex>

      <Modal
        show={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="medium"
      >
        <ModalHeader title="Select Month for Billing Calculation" />
        <ModalContent>
          <Box padding="medium">
            <Text type="text2" color="secondary">
              Choose a month to calculate billing for all items on the board
            </Text>
            
            <Box marginTop="large">
              <div 
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px',
                  marginTop: '16px'
                }}
              >
                {generateMonthGrid().map((monthData, index) => (
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
                      padding: '12px',
                      height: 'auto',
                      backgroundColor: monthData.isCurrent ? 'var(--color-primary)' : 
                                     monthData.isPast ? 'var(--color-snow)' : 'var(--color-surface)',
                      color: monthData.isCurrent ? 'white' : 
                             monthData.isPast ? 'var(--color-text-color-secondary)' : 'var(--color-text-color)'
                    }}
                  >
                    <Flex direction="column" align="start">
                      <Text size="medium" weight="medium">
                        {monthData.label}
                      </Text>
                      <Text size="small" color="secondary">
                        {monthData.isPast ? 'Past Month' : 
                         monthData.isCurrent ? 'Current Month' : 
                         'Future Month'}
                      </Text>
                    </Flex>
                  </Button>
                ))}
              </div>
            </Box>
            
            {currentSelection.month !== undefined && (
              <Box 
                marginTop="large" 
                padding="small"
                style={{ 
                  backgroundColor: "var(--color-primary-selected)",
                  borderRadius: '4px'
                }}
              >
                <Text>
                  <strong>Selected:</strong> {getCurrentMonthLabel()}
                </Text>
              </Box>
            )}
          </Box>
        </ModalContent>
        <ModalFooterButtons
          primaryButtonText="Calculate This Month"
          secondaryButtonText="Cancel"
          onPrimaryButtonClick={handleCalculateForMonth}
          onSecondaryButtonClick={() => setIsModalOpen(false)}
          primaryButtonProps={{
            disabled: currentSelection.month === undefined
          }}
        />
      </Modal>
    </Box>
  );
};

export default MonthSelector;