import React from 'react';

class AutoSaveErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service
    console.error('AutoSave Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="error-boundary">
          <h2>Something went wrong with auto-save.</h2>
          <p>Please save your work manually.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AutoSaveErrorBoundary;
