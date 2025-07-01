import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Button } from '~/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode; // Optional custom fallback UI
  onReset?: () => void; // Callback to reset state in parent component
  showReportDialog?: boolean; // Whether to show Sentry's report dialog
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  // This static method is called after an error has been thrown by a descendant component.
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  // This method is called after an error has been thrown.
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Capture the exception with Sentry
    Sentry.captureException(error, { extra: { errorInfo } });

    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoBack = () => {
    window.history.back();
  };

  private handleReportBug = () => {
    if (this.props.showReportDialog && Sentry.showReportDialog) {
      Sentry.showReportDialog({
        eventId: Sentry.lastEventId(),
        user: { email: 'user@example.com' }, // Pre-fill with user's email if available
        lang: 'en',
        title: 'It looks like something went wrong!',
        subtitle:
          "Our team has been notified. If you'd like to help, tell us what happened below.",
        subtitle2: 'Your feedback is valuable.',
        labelName: 'Name',
        labelEmail: 'Email',
        labelComments: 'What happened?',
        labelClose: 'Close',
        labelSubmit: 'Submit Feedback',
        successMessage: 'Thank you for your feedback!',
      });
    } else {
      // Fallback for when Sentry dialog is not enabled or available
      alert(
        'An error occurred. Our team has been notified. Please try again later.'
      );
    }
  };

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      const { fallback, onReset } = this.props;
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 text-center"
        >
          {fallback || (
            <div className="max-w-md rounded-lg bg-white p-8 shadow-lg">
              <h2 className="mb-4 text-2xl font-bold text-red-600">
                Oops! Something went wrong.
              </h2>
              <p className="mb-6 text-gray-700">
                We&apos;re sorry for the inconvenience. Our team has been
                notified. Please try one of the options below.
              </p>

              <div className="space-y-3">
                {onReset && (
                  <Button onClick={onReset} className="w-full">
                    Try Again
                  </Button>
                )}
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="w-full"
                >
                  Reload Page
                </Button>
                <Button
                  onClick={this.handleGoBack}
                  variant="outline"
                  className="w-full"
                >
                  Go Back
                </Button>
                {this.props.showReportDialog && (
                  <Button
                    onClick={this.handleReportBug}
                    variant="secondary"
                    className="w-full"
                  >
                    Report Bug
                  </Button>
                )}
              </div>

              {isDevelopment && this.state.error && (
                <div className="mt-8 rounded-md bg-gray-100 p-4 text-left text-sm text-gray-800">
                  <h3 className="mb-2 font-semibold">
                    Error Details (Development Only):
                  </h3>
                  <pre className="whitespace-pre-wrap break-all font-mono text-xs">
                    <code>{this.state.error.toString()}</code>
                    {this.state.errorInfo?.componentStack && (
                      <>
                        <br />
                        <br />
                        <strong>Component Stack:</strong>
                        <br />
                        <code>{this.state.errorInfo.componentStack}</code>
                      </>
                    )}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
