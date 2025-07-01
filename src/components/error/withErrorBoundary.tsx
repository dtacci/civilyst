'use client';

import { ComponentType, ReactNode, type ErrorInfo } from 'react';
import { ComprehensiveErrorBoundary } from './ComprehensiveErrorBoundary';

interface ErrorBoundaryOptions {
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'page' | 'section' | 'component';
  showReportDialog?: boolean;
}

/**
 * Higher-order component that wraps a component with an error boundary.
 *
 * @example
 * ```tsx
 * const SafeComponent = withErrorBoundary(MyComponent, {
 *   fallback: <div>Something went wrong</div>,
 *   level: 'component'
 * });
 * ```
 */
export function withErrorBoundary<P extends Record<string, unknown>>(
  Component: ComponentType<P>,
  options: ErrorBoundaryOptions = {}
) {
  const WrappedComponent = (props: P) => {
    return (
      <ComprehensiveErrorBoundary
        level={options.level || 'component'}
        fallback={options.fallback}
        onError={options.onError}
        showReportDialog={options.showReportDialog}
      >
        <Component {...props} />
      </ComprehensiveErrorBoundary>
    );
  };

  // Preserve the original component name for better debugging
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * Decorator function for class components
 */
export function errorBoundary(options: ErrorBoundaryOptions = {}) {
  return function <T extends ComponentType<Record<string, unknown>>>(
    target: T
  ): T {
    return withErrorBoundary(target, options) as T;
  };
}
