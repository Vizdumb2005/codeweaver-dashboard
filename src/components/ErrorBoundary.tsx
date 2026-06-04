import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  tabId?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// Log error to monitoring service (Sentry placeholder)
const logErrorToSentry = (error: Error, errorInfo: ErrorInfo, tabId?: string) => {
  console.error('[Sentry Monitoring Log]', {
    message: error.message,
    stack: error.stack,
    tabId,
    componentStack: errorInfo.componentStack,
    timestamp: new Date().toISOString(),
  });
  // Placeholder for real Sentry/monitoring initialization:
  // if (window.Sentry) {
  //   window.Sentry.captureException(error, { extra: { tabId, ...errorInfo } });
  // }
};

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logErrorToSentry(error, errorInfo, this.props.tabId);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div 
          className="cns-tab-error-boundary glass-card" 
          style={{
            padding: '40px',
            textAlign: 'center',
            maxWidth: '500px',
            margin: '40px auto',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '12px',
            backgroundColor: '#0c0a08',
            color: '#fff',
            fontFamily: 'Outfit, sans-serif'
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ef4444', marginBottom: '10px' }}>
            Stealth Thread Interrupted
          </h3>
          <p style={{ fontSize: '0.9rem', color: '#8a8a9a', lineHeight: 1.6, marginBottom: '20px' }}>
            A critical error occurred while executing this section. The ninja swarm has logged this incident.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button 
              className="btn btn-outline btn-sm" 
              onClick={this.handleReload}
              style={{ padding: '8px 16px', cursor: 'pointer' }}
            >
              Reload Section
            </button>
            <a 
              href={`mailto:support@coninja.io?subject=Swarm%20Error%20Report&body=Error%20in%20tab%20${this.props.tabId || 'unknown'}`} 
              className="btn btn-primary btn-sm" 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                textDecoration: 'none', 
                padding: '8px 16px', 
                color: '#fff', 
                backgroundColor: '#ff7300', 
                border: 'none',
                borderRadius: '4px' 
              }}
            >
              Contact Support
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
