/**
 * Comprehensive Error Boundary System
 *
 * This module provides a complete error handling solution for React applications,
 * including different types of error boundaries for various use cases.
 */

// Main error boundary components
export {
  ComprehensiveErrorBoundary,
  PageErrorBoundary,
  SectionErrorBoundary,
  ComponentErrorBoundary,
  ErrorBoundary, // alias for backward compatibility
} from './ComprehensiveErrorBoundary';

// Specialized error boundaries
export { QueryErrorBoundary } from './QueryErrorBoundary';
export { AsyncBoundary } from './AsyncBoundary';

// Higher-order components and decorators
export { withErrorBoundary, errorBoundary } from './withErrorBoundary';

// Re-export legacy components for backward compatibility
export { ErrorFallback } from '../error-fallback';

/**
 * Quick usage guide:
 *
 * 1. PageErrorBoundary - Use at the top level of pages
 * 2. SectionErrorBoundary - Use around major sections of content
 * 3. ComponentErrorBoundary - Use around individual components
 * 4. QueryErrorBoundary - Use around React Query operations
 * 5. AsyncBoundary - Use for components with loading states
 * 6. withErrorBoundary - HOC for wrapping components
 *
 * @example Basic usage:
 * ```tsx
 * import { PageErrorBoundary } from '~/components/error';
 *
 * export default function MyPage() {
 *   return (
 *     <PageErrorBoundary>
 *       <MyPageContent />
 *     </PageErrorBoundary>
 *   );
 * }
 * ```
 *
 * @example HOC usage:
 * ```tsx
 * import { withErrorBoundary } from '~/components/error';
 *
 * const SafeComponent = withErrorBoundary(MyComponent, {
 *   level: 'component',
 *   fallback: <div>Error in component</div>
 * });
 * ```
 *
 * @example Async operations:
 * ```tsx
 * import { AsyncBoundary } from '~/components/error';
 *
 * function MyAsyncComponent() {
 *   return (
 *     <AsyncBoundary
 *       loadingFallback={<Spinner />}
 *       errorFallback={<ErrorMessage />}
 *     >
 *       <SuspendingComponent />
 *     </AsyncBoundary>
 *   );
 * }
 * ```
 */
