import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f111a] text-white p-4">
          <div className="max-w-md w-full bg-white/5 border border-red-500/30 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-red-400 mb-4">Something went wrong</h2>
            <p className="text-white/70 mb-4 text-sm">
              An unexpected error occurred. Please try clearing your browser data or refreshing the page.
            </p>
            <div className="bg-black/40 rounded-lg p-3 overflow-auto max-h-48 mb-6">
              <pre className="text-xs text-red-300 font-mono whitespace-pre-wrap">
                {this.state.error?.message || 'Unknown error'}
              </pre>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  try {
                    localStorage.clear();
                  } catch (e) {
                    console.error('Failed to clear localStorage', e);
                  }
                  window.location.href = '/';
                }}
                className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 py-2 rounded-xl text-sm font-medium transition-colors"
              >
                Clear Data & Reload
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-xl text-sm font-medium transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
