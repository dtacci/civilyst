'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { httpBatchLink, loggerLink } from '@trpc/client';
import { useState, useEffect, type ReactNode } from 'react';
import superjson from 'superjson';
import { api } from '~/lib/trpc';
import { PageErrorBoundary } from './error';
import {
  createBackgroundCacheManager,
  CachePerformanceMonitor,
} from '~/lib/background-cache';
import { ToastProvider, Toaster } from '~/components/ui/toast';
import { initializeServiceMonitoring } from '~/lib/service-integrations';

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

// Enhanced QueryClient configuration with advanced cache management
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 60 * 1000, // 1 minute default
        gcTime: 5 * 60 * 1000, // 5 minutes default (formerly cacheTime)
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: (failureCount, error: unknown) => {
          // Don't retry on 4xx errors
          if (error && typeof error === 'object' && 'data' in error) {
            const trpcError = error as {
              data?: { httpStatus?: number; code?: string };
            };

            // Don't retry on client errors (4xx)
            if (
              trpcError.data?.httpStatus &&
              trpcError.data.httpStatus >= 400 &&
              trpcError.data.httpStatus < 500
            ) {
              return false;
            }

            // Don't retry on specific tRPC error codes
            if (trpcError.data?.code) {
              const nonRetryableCodes = [
                'NOT_FOUND',
                'UNAUTHORIZED',
                'FORBIDDEN',
                'BAD_REQUEST',
              ];
              if (nonRetryableCodes.includes(trpcError.data.code)) {
                return false;
              }
            }
          }

          // Retry up to 3 times for other errors
          return failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      },
      mutations: {
        retry: false, // Don't retry mutations by default
        // Set a timeout for mutations to prevent hanging
        networkMode: 'online',
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

  // Set up background cache management and service monitoring
  useEffect(() => {
    // Initialize service monitoring in development
    initializeServiceMonitoring();

    const cacheManager = createBackgroundCacheManager(queryClient);
    const performanceMonitor = new CachePerformanceMonitor(queryClient);

    // Start background cache management
    cacheManager.start();

    // Prefetch common data on mount
    cacheManager.prefetchCommonData();

    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      const logInterval = setInterval(() => {
        const stats = cacheManager.getCacheStats();
        const perfMetrics = performanceMonitor.getMetrics();
        console.log('[Cache Stats]', stats);
        console.log('[Performance Metrics]', perfMetrics);
      }, 60000); // Log every minute

      return () => {
        cacheManager.stop();
        clearInterval(logInterval);
      };
    }

    return () => {
      cacheManager.stop();
    };
  }, [queryClient]);

  return (
    <PageErrorBoundary
      showReportDialog={true}
      onError={(error, errorInfo) => {
        console.error('Application-level error:', error, errorInfo);
      }}
    >
      <api.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            {children}
            <Toaster />
            {/* Add React Query DevTools in development */}
            {process.env.NODE_ENV === 'development' && (
              <ReactQueryDevtools initialIsOpen={false} />
            )}
          </ToastProvider>
        </QueryClientProvider>
      </api.Provider>
    </PageErrorBoundary>
  );
}
