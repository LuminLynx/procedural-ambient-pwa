import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReload = () => {
    // Clear service worker cache and reload
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => registration.unregister());
      });
    }
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg, #0b1220)',
          color: 'var(--fg, #e5e7eb)',
          fontFamily: 'system-ui, sans-serif',
          padding: '20px'
        }}>
          <div style={{
            maxWidth: '600px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '32px',
            textAlign: 'center'
          }}>
            <h1 style={{ margin: '0 0 16px', fontSize: '24px', color: '#ef4444' }}>
              ⚠️ Something went wrong
            </h1>
            <p style={{ margin: '0 0 24px', color: '#94a3b8' }}>
              The app encountered an error and couldn't load properly.
            </p>
            
            {this.state.error && (
              <details style={{
                marginBottom: '24px',
                textAlign: 'left',
                background: 'rgba(0,0,0,0.3)',
                padding: '16px',
                borderRadius: '8px',
                fontSize: '14px'
              }}>
                <summary style={{ cursor: 'pointer', marginBottom: '8px', fontWeight: '600' }}>
                  Error Details
                </summary>
                <pre style={{
                  margin: 0,
                  overflow: 'auto',
                  fontSize: '12px',
                  color: '#ef4444'
                }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={this.handleReload}
                style={{
                  padding: '12px 24px',
                  background: '#a78bfa',
                  color: '#0b1220',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Clear Cache & Reload
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '12px 24px',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#e5e7eb',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Try Again
              </button>
            </div>

            <p style={{ marginTop: '24px', fontSize: '14px', color: '#64748b' }}>
              If this problem persists, try updating your browser or clearing your browser data.
              <br />
              <strong>Android users:</strong> Ensure you're using Chrome 89+ or Firefox 88+
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
