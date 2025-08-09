import React from 'react';
import { AttentionBox, Box } from 'monday-ui-react-core';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // eslint-disable-next-line no-console
    console.error('UI error captured:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box marginTop={Box.margins.MEDIUM}>
          <AttentionBox
            type={AttentionBox.types.DANGER}
            title="Something went wrong"
            text={this.props.fallbackText || 'An error occurred while rendering this section. Try refreshing data.'}
          />
        </Box>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;


