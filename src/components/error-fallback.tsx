'use client';

import { TRPCClientError } from '@trpc/client';
import type { AppRouter } from '~/server/api/root';

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const isTRPCError = error instanceof TRPCClientError;

  let title = 'Something went wrong';
  let description = 'An unexpected error occurred. Please try again.';
  let showRetry = true;

  if (isTRPCError) {
    const trpcError = error as TRPCClientError<AppRouter>;

    switch (trpcError.data?.code) {
      case 'UNAUTHORIZED':
        title = 'Authentication required';
        description = 'Please sign in to access this content.';
        showRetry = false;
        break;
      case 'FORBIDDEN':
        title = 'Access denied';
        description = "You don't have permission to access this resource.";
        showRetry = false;
        break;
      case 'NOT_FOUND':
        title = 'Not found';
        description = 'The requested resource could not be found.';
        showRetry = false;
        break;
      case 'TOO_MANY_REQUESTS':
        title = 'Rate limit exceeded';
        description = 'Too many requests. Please wait a moment and try again.';
        break;
      case 'INTERNAL_SERVER_ERROR':
        title = 'Server error';
        description = 'A server error occurred. Please try again later.';
        break;
      case 'TIMEOUT':
        title = 'Request timeout';
        description =
          'The request took too long. Please check your connection and try again.';
        break;
      default:
        title = 'Request failed';
        description =
          trpcError.message ||
          'An error occurred while processing your request.';
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
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
            <h2 className="mt-4 text-lg font-medium text-gray-900">{title}</h2>
            <p className="mt-2 text-sm text-gray-600">{description}</p>
            <div className="mt-6 space-y-3">
              {showRetry && (
                <button
                  type="button"
                  onClick={resetError}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Try again
                </button>
              )}
              <button
                type="button"
                onClick={() => (window.location.href = '/')}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go home
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-left">
                <summary className="text-sm font-medium text-gray-900 cursor-pointer">
                  Error details (development only)
                </summary>
                <pre className="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-auto">
                  {error.stack}
                </pre>
                {isTRPCError && (
                  <pre className="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(
                      (error as TRPCClientError<AppRouter>).data,
                      null,
                      2
                    )}
                  </pre>
                )}
              </details>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
