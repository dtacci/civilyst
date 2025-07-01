# Comprehensive Error Boundary System

This directory contains a complete error handling solution for React applications, providing different types of error boundaries for various use cases.

## Components Overview

### 1. ComprehensiveErrorBoundary

The main error boundary component with advanced features:

- Automatic error classification (TRPC, network, chunk loading, etc.)
- User-friendly error messages with actionable suggestions
- Retry logic with attempt limits
- Development mode error details
- Integration with error tracking services (Sentry)

### 2. Specialized Error Boundaries

#### PageErrorBoundary

- Use at the top level of pages
- Full-screen error UI
- Includes bug reporting functionality
- Best for critical application-level errors

#### SectionErrorBoundary

- Use around major sections of content
- Contained error UI that doesn't break the entire page
- Good for feature sections that can fail independently

#### ComponentErrorBoundary

- Use around individual components
- Minimal error UI for small component failures
- Allows the rest of the page to continue functioning

#### QueryErrorBoundary

- Specialized for React Query operations
- Automatically handles query error resets
- Integrates with React Query's error handling

#### AsyncBoundary

- Combines Suspense (loading) and ErrorBoundary (errors)
- Perfect for async components with loading states
- Unified handling of loading and error states

### 3. Higher-Order Components

#### withErrorBoundary

HOC for wrapping components with error boundaries:

```tsx
const SafeComponent = withErrorBoundary(MyComponent, {
  level: 'component',
  fallback: <div>Error in component</div>,
});
```

## Usage Examples

### Basic Page Setup

```tsx
import { PageErrorBoundary } from '~/components/error';

export default function MyPage() {
  return (
    <PageErrorBoundary>
      <MyPageContent />
    </PageErrorBoundary>
  );
}
```

### Section-Level Error Handling

```tsx
import { SectionErrorBoundary } from '~/components/error';

function Dashboard() {
  return (
    <div>
      <SectionErrorBoundary>
        <UserProfile />
      </SectionErrorBoundary>

      <SectionErrorBoundary>
        <ActivityFeed />
      </SectionErrorBoundary>
    </div>
  );
}
```

### Async Operations

```tsx
import { AsyncBoundary } from '~/components/error';

function MyAsyncComponent() {
  return (
    <AsyncBoundary
      loadingFallback={<Spinner />}
      errorFallback={<ErrorMessage />}
    >
      <SuspendingComponent />
    </AsyncBoundary>
  );
}
```

### React Query Integration

```tsx
import { QueryErrorBoundary } from '~/components/error';

function DataComponent() {
  return (
    <QueryErrorBoundary>
      <ComponentThatUsesQuery />
    </QueryErrorBoundary>
  );
}
```

### Component-Level Protection

```tsx
import { ComponentErrorBoundary } from '~/components/error';

function FeatureList() {
  return (
    <div>
      {features.map((feature) => (
        <ComponentErrorBoundary
          key={feature.id}
          fallback={<div>Feature unavailable</div>}
        >
          <FeatureCard feature={feature} />
        </ComponentErrorBoundary>
      ))}
    </div>
  );
}
```

## Error Classification

The system automatically classifies errors and provides appropriate handling:

### TRPC Errors

- UNAUTHORIZED → "Authentication Required"
- FORBIDDEN → "Access Denied"
- NOT_FOUND → "Not Found"
- TOO_MANY_REQUESTS → "Rate Limit Exceeded"
- TIMEOUT → "Request Timeout"
- INTERNAL_SERVER_ERROR → "Server Error"

### Network Errors

- Fetch failures → "Network Error"
- Connection timeouts → "Connection Timeout"

### Application Errors

- Chunk loading failures → "App Update Available"
- Reference errors → "Application Error"
- Type errors → "Technical Error"

## Integration with Error Tracking

The error boundaries automatically integrate with Sentry if available:

```tsx
// Sentry integration is automatic if Sentry is loaded
// Errors are captured with relevant context and metadata
```

## Best Practices

### 1. Layered Error Boundaries

Use multiple layers of error boundaries:

```
App Level (PageErrorBoundary)
├── Section Level (SectionErrorBoundary)
│   ├── Component Level (ComponentErrorBoundary)
│   └── Component Level (ComponentErrorBoundary)
└── Section Level (SectionErrorBoundary)
    └── Component Level (ComponentErrorBoundary)
```

### 2. Fallback Design

Provide meaningful fallbacks:

- Keep the same layout structure
- Explain what went wrong
- Provide actionable next steps
- Maintain brand consistency

### 3. Error Prevention

- Use TypeScript for compile-time error catching
- Implement proper input validation
- Handle async operations properly
- Test error scenarios

### 4. Development vs Production

- Show detailed errors in development
- Use user-friendly messages in production
- Enable error reporting in production
- Monitor error rates and patterns

## Configuration

### Environment Variables

```env
# Enable Sentry error tracking
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_DSN=your_sentry_dsn

# Error reporting settings
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
```

### Application Setup

The error boundaries are already integrated into the app through the providers:

```tsx
// In providers.tsx
return (
  <PageErrorBoundary showReportDialog={true}>
    {/* App content */}
  </PageErrorBoundary>
);
```

## Monitoring and Debugging

### Development Mode

- Detailed error information in console
- Component stack traces
- Error classification details
- Retry attempt tracking

### Production Mode

- User-friendly error messages
- Automatic error reporting to Sentry
- Error context preservation
- User action tracking

### Error Analytics

Monitor these metrics:

- Error boundary activation rate
- Error types and frequencies
- User retry behavior
- Recovery success rates

## Customization

### Custom Error Messages

```tsx
<ComprehensiveErrorBoundary
  fallback={<CustomErrorComponent />}
  onError={(error, errorInfo) => {
    // Custom error handling
  }}
/>
```

### Custom Error Classification

Extend the error classification system by modifying `getErrorType()` and `getErrorMessage()` functions.

### Theme Integration

Error boundaries use Tailwind CSS classes and can be customized to match your design system.

## Testing Error Boundaries

### Manual Testing

```tsx
// Component that throws an error for testing
function ErrorThrower() {
  throw new Error('Test error');
}

// Wrap with error boundary to test
<ComponentErrorBoundary>
  <ErrorThrower />
</ComponentErrorBoundary>;
```

### Automated Testing

```tsx
import { render, screen } from '@testing-library/react';
import { ComprehensiveErrorBoundary } from './ComprehensiveErrorBoundary';

test('displays error message when child component throws', () => {
  const ThrowError = () => {
    throw new Error('Test error');
  };

  render(
    <ComprehensiveErrorBoundary>
      <ThrowError />
    </ComprehensiveErrorBoundary>
  );

  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
});
```

## Performance Considerations

- Error boundaries don't catch errors during event handlers
- Use try-catch for async operations in event handlers
- Error boundaries add minimal performance overhead
- Consider error boundary placement to minimize re-render scope

## Migration Guide

### From Legacy Error Boundaries

The system is backward compatible with existing error boundaries:

```tsx
// Old
import { ErrorBoundary } from './error-boundary';

// New (backward compatible)
import { ErrorBoundary } from './error';
```

### Gradual Adoption

1. Start with PageErrorBoundary at the app level
2. Add SectionErrorBoundary around major features
3. Add ComponentErrorBoundary for critical components
4. Use AsyncBoundary for loading-heavy sections
