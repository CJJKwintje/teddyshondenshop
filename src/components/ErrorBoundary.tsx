import React, { Component, ErrorInfo, ReactNode } from 'react';
import SEO from './SEO';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <SEO
            title="Er is een fout opgetreden"
            description="Er is helaas iets misgegaan. Probeer de pagina te verversen of kom later terug."
            noindex={true}
          />
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Er is iets misgegaan
            </h1>
            <p className="text-gray-600 mb-6">
              Onze excuses voor het ongemak. Probeer de pagina te verversen of kom later terug.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Pagina verversen
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;