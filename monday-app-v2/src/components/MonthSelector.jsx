import React, { useState, useEffect } from 'react';
import {
  Dropdown,
  Button,
  Flex,
  Text,
  Box,
  Calendar,
  Modal,
  ModalHeader,
  ModalContent,
  ModalFooter
} from 'monday-ui-react-core';
import {
  Calendar as CalendarIcon,
  DropdownChevronDown
} from 'monday-ui-react-core/icons';

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
    <Box className="month-selector">
      <Flex gap={Flex.gaps.SMALL} align={Flex.align.CENTER}>
        <Button
          onClick={() => setIsModalOpen(true)}
          kind={Button.kinds.SECONDARY}
          size={Button.sizes.MEDIUM}
          leftIcon={CalendarIcon}
          rightIcon={DropdownChevronDown}
          disabled={disabled || loadingMonths}
        >
          {getCurrentMonthLabel()}
        </Button>
        
        <Button
          onClick={handleCalculateForMonth}
          kind={Button.kinds.PRIMARY}
          size={Button.sizes.MEDIUM}
          loading={loading}
          disabled={disabled || currentSelection.month === undefined}
        >
          Calculate Selected Month
        </Button>
      </Flex>

      <Modal
        show={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        width="600px"
        title="Select Month for Billing Calculation"
      >
        <ModalHeader title="Select Month for Billing Calculation" />
        <ModalContent>
          <Box padding={Box.paddings.MEDIUM}>
            <Text type={Text.types.TEXT2} color={Text.colors.SECONDARY}>
              Choose a month to calculate billing for all items on the board
            </Text>
            
            <Box marginTop={Box.margins.LARGE}>
              <div className="month-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                marginTop: '16px'
              }}>
                {generateMonthGrid().map((monthData, index) => (
                  <Button
                    key={`${monthData.year}-${monthData.month}`}
                    onClick={() => handleMonthSelect(monthData.month, monthData.year)}
                    kind={
                      currentSelection.month === monthData.month && 
                      currentSelection.year === monthData.year 
                        ? Button.kinds.PRIMARY 
                        : Button.kinds.TERTIARY
                    }
                    size={Button.sizes.SMALL}
                    className={`month-button ${monthData.isPast ? 'past' : ''} ${monthData.isCurrent ? 'current' : ''} ${monthData.isFuture ? 'future' : ''}`}
                    style={{
                      justifyContent: 'flex-start',
                      padding: '12px',
                      height: 'auto',
                      backgroundColor: monthData.isCurrent ? '#4285f4' : 
                                     monthData.isPast ? '#f8f9fa' : '#ffffff',
                      color: monthData.isCurrent ? '#ffffff' : 
                             monthData.isPast ? '#5f6368' : '#202124'
                    }}
                  >
                    <Flex direction={Flex.directions.COLUMN} align={Flex.align.START}>
                      <Text size={Text.sizes.MEDIUM} weight={Text.weights.MEDIUM}>
                        {monthData.label}
                      </Text>
                      <Text size={Text.sizes.SMALL} color={Text.colors.SECONDARY}>
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
                marginTop={Box.margins.LARGE} 
                padding={Box.paddings.SMALL}
                backgroundColor="var(--primary-background-hover-color)"
                style={{ borderRadius: '8px' }}
              >
                <Text>
                  <strong>Selected:</strong> {getCurrentMonthLabel()}
                </Text>
              </Box>
            )}
          </Box>
        </ModalContent>
        <ModalFooter>
          <Button
            onClick={() => setIsModalOpen(false)}
            kind={Button.kinds.TERTIARY}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCalculateForMonth}
            kind={Button.kinds.PRIMARY}
            disabled={currentSelection.month === undefined}
          >
            Calculate This Month
          </Button>
        </ModalFooter>
      </Modal>
    </Box>
  );
};

export default MonthSelector;