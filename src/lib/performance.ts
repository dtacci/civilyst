import { getCLS, getFID, getLCP, getTTFB, getFCP, type Metric } from 'web-vitals';
import * as Sentry from '@sentry/nextjs';
import { getCacheMetrics, getRedisClient, isRedisAvailable } from '~/lib/cache';
import { db } from '~/lib/db'; // Assuming Prisma client is available

// ----------------------------------------------------------------------------
// Types and Interfaces
// ----------------------------------------------------------------------------

/**
 * Custom application-specific performance metrics
 */
export interface CustomMetric {
  name: string;
  value: number;
  unit?: string;
  tags?: Record<string, string>;
}

/**
 * Performance monitoring options
 */
export interface PerformanceMonitoringOptions {
  /**
   * Whether to enable performance monitoring
   * @default true
   */
  enabled?: boolean;
  /**
   * Whether to send Core Web Vitals to Sentry
   * @default true
   */
  sendWebVitalsToSentry?: boolean;
  /**
   * Whether to send custom metrics to Sentry
   * @default true
   */
  sendCustomMetricsToSentry?: boolean;
  /**
   * Whether to monitor database query performance
   * @default true
   */
  monitorDatabaseQueries?: boolean;
  /**
   * Whether to monitor cache performance
   * @default true
   */
  monitorCachePerformance?: boolean;
  /**
   * Whether to monitor API response times
   * @default true
   */
  monitorApiResponses?: boolean;
  /**
   * Whether to monitor user interactions
   * @default true
   */
  monitorUserInteractions?: boolean;
  /**
   * Interval for reporting periodic metrics (e.g., cache metrics) in milliseconds
   * @default 60000 (1 minute)
   */
  periodicReportInterval?: number;
}

// ----------------------------------------------------------------------------
// Global State and Configuration
// ----------------------------------------------------------------------------

let isInitialized = false;
let options: PerformanceMonitoringOptions = {
  enabled: true,
  sendWebVitalsToSentry: true,
  sendCustomMetricsToSentry: true,
  monitorDatabaseQueries: true,
  monitorCachePerformance: true,
  monitorApiResponses: true,
  monitorUserInteractions: true,
  periodicReportInterval: 60000,
};

const customMetrics: Map<string, CustomMetric> = new Map();
let periodicReportIntervalId: NodeJS.Timeout | null = null;

// ----------------------------------------------------------------------------
// Core Web Vitals Tracking
// ----------------------------------------------------------------------------

/**
 * Reports Core Web Vitals metrics to Sentry.
 */
function reportWebVitalsToSentry(metric: Metric) {
  if (!options.sendWebVitalsToSentry) return;

  Sentry.captureEvent({
    message: `Web Vitals: ${metric.name}`,
    level: 'info',
    tags: {
      metric_name: metric.name,
      metric_id: metric.id,
      metric_value: metric.value,
      is_delta: metric.isDelta,
      navigation_type: metric.navigationType,
    },
    extra: {
      metric_entries: metric.entries,
    },
    // Use a transaction for performance metrics if Sentry is configured for it
    // Sentry.startSpan is more appropriate for custom operations
  });

  // For performance monitoring, Sentry's SDK automatically captures these if `tracesSampleRate` is set.
  // This manual captureEvent is more for logging/debugging specific metric values.
  // For actual performance tracing, ensure Sentry's BrowserTracing integration is active.
}

/**
 * Initializes Core Web Vitals tracking.
 */
function initializeWebVitalsTracking() {
  if (!options.enabled || !options.sendWebVitalsToSentry) return;

  try {
    getCLS(reportWebVitalsToSentry);
    getFID(reportWebVitalsToSentry);
    getLCP(reportWebVitalsToSentry);
    getTTFB(reportWebVitalsToSentry);
    getFCP(reportWebVitalsToSentry);
    console.log('Core Web Vitals tracking initialized.');
  } catch (error) {
    console.error('Failed to initialize Web Vitals tracking:', error);
    Sentry.captureException(error, { tags: { feature: 'web_vitals_init' } });
  }
}

// ----------------------------------------------------------------------------
// Custom Metrics
// ----------------------------------------------------------------------------

/**
 * Records a custom application-specific metric.
 */
export function recordCustomMetric(metric: CustomMetric) {
  if (!options.enabled) return;

  customMetrics.set(metric.name, metric);

  if (options.sendCustomMetricsToSentry) {
    Sentry.captureEvent({
      message: `Custom Metric: ${metric.name}`,
      level: 'info',
      tags: {
        metric_name: metric.name,
        metric_value: metric.value,
        metric_unit: metric.unit || 'unitless',
        ...metric.tags,
      },
    });
  }
}

/**
 * Retrieves a recorded custom metric.
 */
export function getCustomMetric(name: string): CustomMetric | undefined {
  return customMetrics.get(name);
}

// ----------------------------------------------------------------------------
// Database Query Performance Monitoring (Prisma)
// ----------------------------------------------------------------------------

/**
 * Initializes database query performance monitoring.
 * This function assumes Prisma's `$on` method is available for logging queries.
 */
function initializeDatabaseQueryMonitoring() {
  if (!options.enabled || !options.monitorDatabaseQueries || !db) return;

  try {
    // Prisma's $on method can be used to listen for query events
    // Note: This might require specific Prisma client configuration (e.g., log: ['query'])
    // and might not be available in all environments (e.g., Edge functions).
    // For more robust monitoring, consider Sentry's Prisma integration or custom middleware.
    (db as any).$on('query', (event: any) => {
      Sentry.startSpan(
        {
          name: 'db.query',
          op: 'db.query',
          description: event.query,
          data: {
            params: event.params,
            duration: event.duration, // duration in ms
            target: event.target,
          },
          tags: {
            db_provider: 'postgresql', // Assuming PostgreSQL for Supabase
            db_operation: event.query.split(' ')[0].toLowerCase(), // e.g., select, insert, update
          },
        },
        (span) => {
          span.end();
        }
      );
      recordCustomMetric({
        name: 'db_query_duration',
        value: event.duration,
        unit: 'ms',
        tags: { operation: event.query.split(' ')[0].toLowerCase() },
      });
    });
    console.log('Database query monitoring initialized.');
  } catch (error) {
    console.warn('Failed to initialize database query monitoring (Prisma $on might not be available or configured):', error);
    // Sentry.captureException(error, { tags: { feature: 'db_monitoring_init' } });
  }
}

// ----------------------------------------------------------------------------
// Cache Performance Monitoring (Redis)
// ----------------------------------------------------------------------------

/**
 * Reports cache performance metrics.
 */
async function reportCachePerformance() {
  if (!options.enabled || !options.monitorCachePerformance) return;

  try {
    const redisAvailable = await isRedisAvailable();
    const metrics = getCacheMetrics();

    Sentry.captureEvent({
      message: 'Cache Performance Metrics',
      level: 'info',
      tags: {
        cache_hits: metrics.hits,
        cache_misses: metrics.misses,
        cache_requests: metrics.requests,
        cache_hit_rate: metrics.hitRate.toFixed(2),
        cache_avg_latency: metrics.avgLatencyMs.toFixed(2),
        redis_available: redisAvailable,
      },
      extra: {
        cache_details: metrics,
      },
    });
    recordCustomMetric({ name: 'cache_hit_rate', value: metrics.hitRate, unit: '%' });
    recordCustomMetric({ name: 'cache_avg_latency', value: metrics.avgLatencyMs, unit: 'ms' });
  } catch (error) {
    console.error('Failed to report cache performance:', error);
    Sentry.captureException(error, { tags: { feature: 'cache_monitoring' } });
  }
}

// ----------------------------------------------------------------------------
// API Response Time Tracking (tRPC)
// ----------------------------------------------------------------------------

/**
 * This is largely handled by Sentry's Next.js SDK and tRPC integration.
 * Ensure `tracesSampleRate` is configured in `sentry.client.config.ts` and `sentry.server.config.ts`.
 * Custom spans can be added around specific tRPC procedures if more granular timing is needed.
 *
 * Example of custom span in a tRPC procedure (conceptual):
 *
 * import * as Sentry from '@sentry/nextjs';
 *
 * export const myProcedure = publicProcedure
 *   .input(...)
 *   .query(async ({ ctx, input }) => {
 *     return Sentry.startSpan({ name: 'myProcedure.execution', op: 'trpc.query' }, async (span) => {
 *       // Your procedure logic here
 *       const result = await someLongRunningOperation();
 *       span.setAttribute('result_size', result.length);
 *       return result;
 *     });
 *   });
 */
function initializeApiResponseMonitoring() {
  if (!options.enabled || !options.monitorApiResponses) return;
  console.log('API response time monitoring relies on Sentry Next.js SDK configuration.');
}

// ----------------------------------------------------------------------------
// User Experience Metrics (Interactions, Page Load)
// ----------------------------------------------------------------------------

/**
 * Monitors user interactions (e.g., clicks, form submissions).
 * This is a basic example; more advanced tracking might involve specific event listeners.
 */
function initializeUserInteractionMonitoring() {
  if (!options.enabled || !options.monitorUserInteractions || typeof document === 'undefined') return;

  // Example: Track clicks on interactive elements
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('[role="button"]')) {
      Sentry.addBreadcrumb({
        category: 'ui.interaction',
        message: `Clicked on: ${target.tagName} ${target.innerText || target.getAttribute('aria-label') || target.id || ''}`,
        data: {
          element: target.tagName,
          id: target.id,
          class: target.className,
          text: target.innerText,
        },
        level: 'info',
      });
    }
  });
  console.log('User interaction monitoring initialized.');
}

// ----------------------------------------------------------------------------
// Performance Budget Monitoring (Conceptual)
// ----------------------------------------------------------------------------

/**
 * Performance budget monitoring is typically done at build time or with specialized tools.
 * This function serves as a placeholder for where such checks might be integrated
 * if runtime metrics were available (e.g., reporting bundle size from a global variable).
 */
function initializePerformanceBudgetMonitoring() {
  // This is more of a build-time concern.
  // For runtime, you might report on initial load times (covered by Web Vitals)
  // or resource loading failures.
  console.log('Performance budget monitoring is primarily a build-time concern.');
}

// ----------------------------------------------------------------------------
// Memory Usage and Resource Monitoring (Client-side)
// ----------------------------------------------------------------------------

/**
 * Monitors client-side memory usage.
 * Note: `performance.memory` is a non-standard API and only available in Chrome.
 */
function initializeMemoryMonitoring() {
  if (!options.enabled || typeof window === 'undefined') return;

  if ('performance' in window && 'memory' in (window.performance as any)) {
    const memoryInfo = (window.performance as any).memory;
    recordCustomMetric({
      name: 'js_heap_size_limit',
      value: memoryInfo.jsHeapSizeLimit,
      unit: 'bytes',
      tags: { type: 'limit' },
    });
    recordCustomMetric({
      name: 'total_js_heap_size',
      value: memoryInfo.totalJSHeapSize,
      unit: 'bytes',
      tags: { type: 'total' },
    });
    recordCustomMetric({
      name: 'used_js_heap_size',
      value: memoryInfo.usedJSHeapSize,
      unit: 'bytes',
      tags: { type: 'used' },
    });
    console.log('Client-side memory monitoring initialized.');
  } else {
    console.warn('Client-side memory monitoring (performance.memory) not supported in this browser.');
  }
}

// ----------------------------------------------------------------------------
// Initialization and Cleanup
// ----------------------------------------------------------------------------

/**
 * Initializes the comprehensive performance monitoring system.
 * Should be called once at application startup.
 */
export function initializePerformanceMonitoring(opts?: Partial<PerformanceMonitoringOptions>) {
  if (isInitialized) {
    console.warn('Performance monitoring already initialized.');
    return;
  }

  options = { ...options, ...opts };

  if (!options.enabled) {
    console.log('Performance monitoring is disabled.');
    return;
  }

  console.log('Initializing comprehensive performance monitoring...');

  // Initialize all sub-components
  initializeWebVitalsTracking();
  initializeCustomMetricsReporting();
  initializeDatabaseQueryMonitoring();
  initializeApiResponseMonitoring();
  initializeUserInteractionMonitoring();
  initializePerformanceBudgetMonitoring();
  initializeMemoryMonitoring();

  // Start periodic reporting
  if (options.periodicReportInterval && options.periodicReportInterval > 0) {
    periodicReportIntervalId = setInterval(async () => {
      await reportCachePerformance();
      // Add other periodic reports here if needed
    }, options.periodicReportInterval);
  }

  isInitialized = true;
  console.log('Performance monitoring initialized successfully.');
}

/**
 * Stops performance monitoring and cleans up resources.
 */
export function stopPerformanceMonitoring() {
  if (!isInitialized) {
    console.warn('Performance monitoring not initialized.');
    return;
  }

  if (periodicReportIntervalId) {
    clearInterval(periodicReportIntervalId);
    periodicReportIntervalId = null;
  }

  customMetrics.clear();
  isInitialized = false;
  console.log('Performance monitoring stopped.');
}

/**
 * Initializes reporting of custom metrics.
 */
function initializeCustomMetricsReporting() {
  if (!options.enabled || !options.sendCustomMetricsToSentry) return;
  console.log('Custom metrics reporting initialized.');
}

// ----------------------------------------------------------------------------
// Performance Dashboard Data Collection (Conceptual)
// ----------------------------------------------------------------------------

/**
 * This function would be responsible for collecting and potentially aggregating
 * data for a performance dashboard. In a real application, this might involve
 * sending data to a dedicated analytics service or a custom backend endpoint.
 * For now, Sentry serves as the primary reporting mechanism.
 */
export function collectPerformanceDashboardData() {
  if (!options.enabled) return;

  const dashboardData = {
    timestamp: new Date().toISOString(),
    webVitals: {
      // These would be the latest values reported by web-vitals,
      // potentially stored in a global state or derived from Sentry.
      // For simplicity, we're not storing them directly in this file.
    },
    customMetrics: Array.from(customMetrics.values()),
    cacheMetrics: getCacheMetrics(),
    // Add other aggregated metrics here
  };

  console.log('Collected performance dashboard data:', dashboardData);
  // In a real scenario, you might send this to an analytics endpoint:
  // sendToAnalyticsService('/api/performance-data', dashboardData);
}

// ----------------------------------------------------------------------------
// Utility for measuring function execution time
// ----------------------------------------------------------------------------

/**
 * Measures the execution time of an async function and records it as a custom metric.
 */
export async function measurePerformance<T>(
  name: string,
  func: () => Promise<T>,
  tags?: Record<string, string>
): Promise<T> {
  if (!options.enabled) {
    return func(); // Execute function without measuring if monitoring is disabled
  }

  const startTime = performance.now();
  let result: T;
  let error: Error | undefined;

  try {
    result = await func();
  } catch (e) {
    error = e instanceof Error ? e : new Error(String(e));
    Sentry.captureException(error, { tags: { operation: name, ...tags } });
    throw error; // Re-throw the error after capturing
  } finally {
    const duration = performance.now() - startTime;
    recordCustomMetric({
      name: `${name}_duration`,
      value: duration,
      unit: 'ms',
      tags: { ...tags, status: error ? 'failed' : 'success' },
    });

    Sentry.startSpan(
      {
        name: name,
        op: 'custom_operation',
        description: `Execution of ${name}`,
        data: {
          duration_ms: duration,
          status: error ? 'failed' : 'success',
          ...tags,
        },
      },
      (span) => {
        span.end();
      }
    );
  }
  return result;
}

// ----------------------------------------------------------------------------
// Real-time Performance Alerts
// ----------------------------------------------------------------------------

/**
 * Threshold configuration for real-time performance alerts
 */
export interface PerformanceAlertThresholds {
  apiResponseTimeMs?: number; // Alert if API responses exceed this time
  cacheHitRate?: number; // Alert if cache hit rate falls below this percentage
  memoryUsagePercentage?: number; // Alert if memory usage exceeds this percentage of limit
  errorRate?: number; // Alert if error rate exceeds this percentage
  slowPageLoadTimeMs?: number; // Alert if page load time exceeds this threshold
}

const defaultAlertThresholds: PerformanceAlertThresholds = {
  apiResponseTimeMs: 1000, // 1 second
  cacheHitRate: 50, // 50%
  memoryUsagePercentage: 90, // 90%
  errorRate: 5, // 5%
  slowPageLoadTimeMs: 3000, // 3 seconds
};

/**
 * Checks metrics against thresholds and triggers alerts if needed
 */
export function checkPerformanceAlerts(thresholds: PerformanceAlertThresholds = defaultAlertThresholds) {
  if (!options.enabled) return;

  try {
    // Check cache hit rate
    const cacheMetrics = getCacheMetrics();
    if (thresholds.cacheHitRate && cacheMetrics.hitRate < thresholds.cacheHitRate) {
      triggerPerformanceAlert('Cache hit rate below threshold', {
        current: cacheMetrics.hitRate,
        threshold: thresholds.cacheHitRate,
        unit: '%',
      });
    }

    // Check memory usage (client-side only)
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (window.performance as any)) {
      const memoryInfo = (window.performance as any).memory;
      const memoryUsagePercentage = (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100;
      
      if (thresholds.memoryUsagePercentage && memoryUsagePercentage > thresholds.memoryUsagePercentage) {
        triggerPerformanceAlert('Memory usage above threshold', {
          current: memoryUsagePercentage,
          threshold: thresholds.memoryUsagePercentage,
          unit: '%',
        });
      }
    }

    // Other checks could be added here based on collected metrics
  } catch (error) {
    console.error('Error checking performance alerts:', error);
    Sentry.captureException(error, { tags: { feature: 'performance_alerts' } });
  }
}

/**
 * Triggers a performance alert through Sentry and potentially other channels
 */
function triggerPerformanceAlert(message: string, data: Record<string, any>) {
  // Send to Sentry as a high-priority event
  Sentry.captureMessage(message, {
    level: 'warning',
    tags: {
      alert_type: 'performance',
      current_value: data.current,
      threshold: data.threshold,
      unit: data.unit,
    },
    extra: data,
  });

  // Log to console for development visibility
  console.warn(`Performance Alert: ${message}`, data);

  // In a real application, you might also:
  // 1. Send to a dedicated alerting service
  // 2. Trigger in-app notifications
  // 3. Send emails to operations team
  // 4. Update a status dashboard
}
