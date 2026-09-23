import React from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // In production, an error monitoring service (e.g. Sentry) can be invoked here
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;

      return (
        <div className="min-h-screen bg-paper text-ink flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="max-w-xl w-full bg-white dark:bg-paper-card border border-paper-border rounded-2xl p-6 sm:p-8 shadow-sm text-center">
            {/* Editorial Warning Icon */}
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center justify-center mb-5 shadow-2xs">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <span className="text-xs font-bold uppercase tracking-widest text-rfblue">
              Research Factors — System Resilience
            </span>

            <h1 className="text-2xl sm:text-3xl font-bold text-ink-darkest mt-2 mb-3">
              Something Unexpected Occurred
            </h1>

            <p className="text-sm text-ink-muted leading-relaxed mb-6 max-w-md mx-auto">
              Our reading engine encountered an unexpected runtime exception while rendering this view.
              You can reload the page or return to the research archive.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rfblue hover:bg-rfblue-700 transition-colors shadow-2xs cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Page</span>
              </button>

              <a
                href={import.meta.env.BASE_URL || '/'}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold text-ink-darkest bg-paper hover:bg-paper-light border border-paper-border transition-colors shadow-2xs"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Return to Homepage</span>
              </a>
            </div>

            {/* Technical Details (Expandable in DEV or on toggle) */}
            {isDev && this.state.error && (
              <div className="text-left mt-6 pt-4 border-t border-paper-border">
                <button
                  type="button"
                  onClick={this.toggleDetails}
                  className="flex items-center justify-between w-full text-xs font-semibold text-ink-muted hover:text-ink-darkest"
                >
                  <span>Technical Diagnostics (Development Only)</span>
                  {this.state.showDetails ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {this.state.showDetails && (
                  <pre className="mt-3 p-3 bg-slate-900 text-red-300 text-xs rounded-lg overflow-x-auto font-mono whitespace-pre-wrap leading-relaxed max-h-60">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
