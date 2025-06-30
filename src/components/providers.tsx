'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { httpBatchLink, loggerLink } from '@trpc/client';
import { useState, type ReactNode } from 'react';
import superjson from 'superjson';
import { api } from '~/lib/trpc';
import { ErrorBoundary } from './error-boundary';

function getBaseUrl() {
  if (typeof window !== 'undefined') {
    // Browser should use relative URL
    return '';
  }

  // SSR should use absolute URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // Fallback for local development
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

// Improved QueryClient configuration
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 60 * 1000, // 1 minute
        retry: (failureCount, error: unknown) => {
          // Don't retry on 4xx errors
          if (error && typeof error === 'object' && 'data' in error) {
            const trpcError = error as { data?: { httpStatus?: number } };
            if (
              trpcError.data?.httpStatus &&
              trpcError.data.httpStatus >= 400 &&
              trpcError.data.httpStatus < 500
            ) {
              return false;
            }
          }
          // Retry up to 3 times for other errors
          return failureCount < 3;
        },
      },
      mutations: {
        retry: false, // Don't retry mutations by default
      },
    },
  });
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());
  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        // Add logger in development
        ...(process.env.NODE_ENV === 'development'
          ? [
              loggerLink({
                enabled: (opts) =>
                  process.env.NODE_ENV === 'development' ||
                  (opts.direction === 'down' && opts.result instanceof Error),
              }),
            ]
          : []),
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
          // Add headers for better error tracking
          headers() {
            return {
              'x-trpc-source': 'client',
            };
          },
        }),
      ],
    })
  );

  return (
    <ErrorBoundary>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          {children}
          {/* Add React Query DevTools in development */}
          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </QueryClientProvider>
      </api.Provider>
    </ErrorBoundary>
  );
}
