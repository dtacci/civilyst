'use client';

import { Suspense, type ReactNode } from 'react';
import { QueryErrorBoundary } from './QueryErrorBoundary';

interface AsyncBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  errorFallback?: ReactNode;
  loadingFallback?: ReactNode;
  onError?: (error: Error) => void;
}

/**
 * Loading spinner component
 */
const DefaultLoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <div className="flex items-center space-x-2">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
      <span className="text-sm text-gray-600">Loading...</span>
    </div>
  </div>
);

/**
 * Combined loading and error boundary for async operations.
 * Handles both loading states (via Suspense) and errors (via ErrorBoundary).
 */
export function AsyncBoundary({
  children,
  errorFallback,
  loadingFallback = <DefaultLoadingFallback />,
  onError,
}: AsyncBoundaryProps) {
  return (
    <QueryErrorBoundary fallback={errorFallback} onError={onError}>
      <Suspense fallback={loadingFallback}>{children}</Suspense>
    </QueryErrorBoundary>
  );
}
