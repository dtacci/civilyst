'use client';

import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ComponentErrorBoundary } from './ComprehensiveErrorBoundary';
import type { ReactNode } from 'react';

interface QueryErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error) => void;
}

/**
 * Error boundary specifically designed for React Query operations.
 * Automatically handles query error resets and provides retry functionality.
 */
export function QueryErrorBoundary({
  children,
  fallback,
  onError,
}: QueryErrorBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ComponentErrorBoundary
          fallback={fallback}
          onReset={reset}
          onError={(error, errorInfo) => {
            onError?.(error);
            console.error('Query error boundary triggered:', error, errorInfo);
          }}
        >
          {children}
        </ComponentErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
