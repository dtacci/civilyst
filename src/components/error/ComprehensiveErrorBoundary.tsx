'use client';

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { TRPCClientError } from '@trpc/client';
import { Button } from '~/components/ui/button';
import type { AppRouter } from '~/server/api/root';

// Enhanced error logging (integrate with Sentry if available)
const logError = (error: Error, errorInfo?: ErrorInfo) => {
  console.error('ErrorBoundary caught an error:', error, errorInfo);

  // Check if Sentry is available and capture the error
  if (
    typeof window !== 'undefined' &&
    (window as unknown as { Sentry?: unknown }).Sentry
  ) {
    const Sentry = (
      window as unknown as {
        Sentry: {
          withScope: (
            callback: (scope: {
              setTag: (key: string, value: string) => void;
              setLevel: (level: string) => void;
              setContext: (key: string, context: unknown) => void;
            }) => void
          ) => void;
          captureException: (error: Error) => void;
        };
      }
    ).Sentry;
    Sentry.withScope((scope) => {
      scope.setTag('component', 'ErrorBoundary');
      scope.setLevel('error');
      if (errorInfo) {
        scope.setContext('errorInfo', errorInfo);
      }
      Sentry.captureException(error);
    });
  }

  // Additional logging for development
  if (process.env.NODE_ENV === 'development') {
    console.group('🚨 Error Boundary Details');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Stack Trace:', error.stack);
    console.groupEnd();
  }
};

// Error classification
const getErrorType = (error: Error) => {
  if (error instanceof TRPCClientError) {
    return 'TRPC_ERROR';
  }

  if (
    error.name === 'ChunkLoadError' ||
    error.message.includes('Loading chunk')
  ) {
    return 'CHUNK_LOAD_ERROR';
  }

  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return 'NETWORK_ERROR';
  }

  if (error.name === 'ReferenceError') {
    return 'REFERENCE_ERROR';
  }

  return 'UNKNOWN_ERROR';
};

// Get user-friendly error messages
const getErrorMessage = (error: Error) => {
  const errorType = getErrorType(error);

  switch (errorType) {
    case 'TRPC_ERROR': {
      const trpcError = error as TRPCClientError<AppRouter>;
      switch (trpcError.data?.code) {
        case 'UNAUTHORIZED':
          return {
            title: 'Authentication Required',
            description: 'Please sign in to access this content.',
            canRetry: false,
            suggestion: 'Use the sign-in button below to continue.',
          };
        case 'FORBIDDEN':
          return {
            title: 'Access Denied',
            description: "You don't have permission to access this resource.",
            canRetry: false,
            suggestion:
              'Contact an administrator if you believe this is an error.',
          };
        case 'NOT_FOUND':
          return {
            title: 'Not Found',
            description: 'The requested resource could not be found.',
            canRetry: false,
            suggestion: 'Check the URL or go back to the previous page.',
          };
        case 'TOO_MANY_REQUESTS':
          return {
            title: 'Rate Limit Exceeded',
            description:
              'Too many requests. Please wait a moment and try again.',
            canRetry: true,
            suggestion: 'Wait a few seconds before trying again.',
          };
        case 'TIMEOUT':
          return {
            title: 'Request Timeout',
            description: 'The request took too long to complete.',
            canRetry: true,
            suggestion: 'Check your internet connection and try again.',
          };
        case 'INTERNAL_SERVER_ERROR':
          return {
            title: 'Server Error',
            description: 'A server error occurred. Our team has been notified.',
            canRetry: true,
            suggestion: 'Please try again in a few minutes.',
          };
        default:
          return {
            title: 'Request Failed',
            description:
              trpcError.message ||
              'An error occurred while processing your request.',
            canRetry: true,
            suggestion:
              'Please try again or contact support if the problem persists.',
          };
      }
    }

    case 'CHUNK_LOAD_ERROR':
      return {
        title: 'App Update Available',
        description: 'A new version of the app is available.',
        canRetry: false,
        suggestion: 'Please refresh the page to load the latest version.',
      };

    case 'NETWORK_ERROR':
      return {
        title: 'Network Error',
        description: 'Unable to connect to the server.',
        canRetry: true,
        suggestion: 'Check your internet connection and try again.',
      };

    case 'REFERENCE_ERROR':
      return {
        title: 'Application Error',
        description: 'A technical error occurred.',
        canRetry: true,
        suggestion: 'Please try refreshing the page.',
      };

    default:
      return {
        title: 'Something Went Wrong',
        description: 'An unexpected error occurred.',
        canRetry: true,
        suggestion:
          'Please try again or contact support if the problem persists.',
      };
  }
};

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
  showReportDialog?: boolean;
  level?: 'page' | 'section' | 'component';
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class ComprehensiveErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logError(error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call the optional onError callback
    this.props.onError?.(error, errorInfo);
  }

  private handleRetry = () => {
    const { retryCount } = this.state;

    // Prevent infinite retry loops
    if (retryCount >= 3) {
      console.warn('Maximum retry attempts reached');
      return;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: retryCount + 1,
    });

    // Call the optional onReset callback
    this.props.onReset?.();
  };

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  private handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  private handleGoBack = () => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  private handleReportBug = () => {
    const { error } = this.state;

    // Try to use Sentry's report dialog if available
    if (
      typeof window !== 'undefined' &&
      (
        window as unknown as {
          Sentry?: { showReportDialog?: unknown; lastEventId?: () => string };
        }
      ).Sentry
    ) {
      const Sentry = (
        window as unknown as {
          Sentry: {
            showReportDialog: (options: Record<string, unknown>) => void;
            lastEventId: () => string;
          };
        }
      ).Sentry;
      if (Sentry.showReportDialog) {
        Sentry.showReportDialog({
          eventId: Sentry.lastEventId(),
          title: 'Report a Bug',
          subtitle: 'Help us improve by reporting this error.',
          labelComments: 'What were you trying to do when this error occurred?',
        });
        return;
      }
    }

    // Fallback: copy error details to clipboard
    if (error && navigator.clipboard) {
      const errorReport = `Error Report:
Timestamp: ${new Date().toISOString()}
Error: ${error.message}
Stack: ${error.stack}
User Agent: ${navigator.userAgent}
URL: ${window.location.href}`;

      navigator.clipboard.writeText(errorReport).then(() => {
        alert(
          'Error details copied to clipboard. Please paste this in your bug report.'
        );
      });
    } else {
      alert(
        'Please describe what you were doing when this error occurred and contact support.'
      );
    }
  };

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  render() {
    const { hasError, error, retryCount } = this.state;
    const {
      children,
      fallback,
      level = 'section',
      showReportDialog = false,
    } = this.props;

    if (!hasError || !error) {
      return children;
    }

    // Use custom fallback if provided
    if (fallback) {
      return fallback;
    }

    const errorMessage = getErrorMessage(error);
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isChunkError = getErrorType(error) === 'CHUNK_LOAD_ERROR';

    // Different layouts based on error boundary level
    const containerClass =
      level === 'page'
        ? 'min-h-screen bg-gray-50 flex items-center justify-center p-4'
        : level === 'section'
          ? 'bg-gray-50 rounded-lg p-8 text-center'
          : 'bg-red-50 border border-red-200 rounded-md p-4 text-center';

    const cardClass =
      level === 'page'
        ? 'bg-white rounded-lg shadow-lg p-8 max-w-md w-full'
        : '';

    return (
      <div className={containerClass} role="alert" aria-live="assertive">
        <div className={cardClass}>
          {/* Error Icon */}
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          {/* Error Title */}
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {errorMessage.title}
          </h2>

          {/* Error Description */}
          <p className="text-gray-600 mb-4">{errorMessage.description}</p>

          {/* Suggestion */}
          <p className="text-sm text-gray-500 mb-6">
            {errorMessage.suggestion}
          </p>

          {/* Retry Count Warning */}
          {retryCount > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                Retry attempt {retryCount} of 3
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Primary Actions */}
            {isChunkError ? (
              <Button onClick={this.handleReload} className="w-full">
                Refresh Page
              </Button>
            ) : errorMessage.canRetry && retryCount < 3 ? (
              <Button onClick={this.handleRetry} className="w-full">
                Try Again
              </Button>
            ) : null}

            {/* Secondary Actions */}
            <div className="grid grid-cols-2 gap-2">
              {level === 'page' ? (
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="w-full"
                >
                  Go Home
                </Button>
              ) : (
                <Button
                  onClick={this.handleGoBack}
                  variant="outline"
                  className="w-full"
                >
                  Go Back
                </Button>
              )}

              <Button
                onClick={this.handleReload}
                variant="outline"
                className="w-full"
              >
                Reload
              </Button>
            </div>

            {/* Report Bug Button */}
            {showReportDialog && (
              <Button
                onClick={this.handleReportBug}
                variant="secondary"
                className="w-full"
              >
                Report Bug
              </Button>
            )}
          </div>

          {/* Development Error Details */}
          {isDevelopment && (
            <details className="mt-6 text-left">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                🔧 Error Details (Development Only)
              </summary>
              <div className="mt-2 space-y-2">
                <div className="text-xs bg-gray-100 p-3 rounded border">
                  <strong>Error Type:</strong> {getErrorType(error)}
                </div>
                <pre className="text-xs bg-gray-100 p-3 rounded border overflow-auto">
                  <strong>Message:</strong> {error.message}
                </pre>
                <pre className="text-xs bg-gray-100 p-3 rounded border overflow-auto max-h-32">
                  <strong>Stack Trace:</strong>
                  {error.stack}
                </pre>
                {error instanceof TRPCClientError && (
                  <pre className="text-xs bg-gray-100 p-3 rounded border overflow-auto">
                    <strong>TRPC Data:</strong>
                    {JSON.stringify(error.data, null, 2)}
                  </pre>
                )}
              </div>
            </details>
          )}
        </div>
      </div>
    );
  }
}

// Export convenience components for different levels
export const PageErrorBoundary = (props: Omit<ErrorBoundaryProps, 'level'>) => (
  <ComprehensiveErrorBoundary {...props} level="page" showReportDialog />
);

export const SectionErrorBoundary = (
  props: Omit<ErrorBoundaryProps, 'level'>
) => <ComprehensiveErrorBoundary {...props} level="section" />;

export const ComponentErrorBoundary = (
  props: Omit<ErrorBoundaryProps, 'level'>
) => <ComprehensiveErrorBoundary {...props} level="component" />;

// Alias for backward compatibility
export const ErrorBoundary = ComprehensiveErrorBoundary;
