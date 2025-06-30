/**
 * Background Cache Management Service
 *
 * This service handles automatic cache refreshing, cleanup, and optimization
 * to ensure optimal performance and data freshness across the application.
 */

import { QueryClient } from '@tanstack/react-query';
import { cacheConfig } from './simple-cache-invalidation';

export class BackgroundCacheManager {
  private queryClient: QueryClient;
  private intervals: Set<NodeJS.Timeout> = new Set();
  private isRunning = false;

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  /**
   * Start background cache management
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Set up automatic cache cleanup every 5 minutes
    const cleanupInterval = setInterval(
      () => {
        this.performCacheCleanup();
      },
      5 * 60 * 1000
    );
    this.intervals.add(cleanupInterval);

    // Set up periodic background refresh for critical data every 2 minutes
    const refreshInterval = setInterval(
      () => {
        this.performBackgroundRefresh();
      },
      2 * 60 * 1000
    );
    this.intervals.add(refreshInterval);

    // Set up stale data detection every minute
    const staleCheckInterval = setInterval(() => {
      this.checkAndRefreshStaleData();
    }, 60 * 1000);
    this.intervals.add(staleCheckInterval);

    console.log('[BackgroundCache] Started background cache management');
  }

  /**
   * Stop background cache management
   */
  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;

    // Clear all intervals
    this.intervals.forEach((interval) => {
      clearInterval(interval);
    });
    this.intervals.clear();

    console.log('[BackgroundCache] Stopped background cache management');
  }

  /**
   * Perform cache cleanup to remove expired entries
   */
  private performCacheCleanup() {
    const cache = this.queryClient.getQueryCache();
    const queries = cache.getAll();
    let cleanedCount = 0;

    queries.forEach((query) => {
      const timeSinceLastFetch = Date.now() - (query.state.dataUpdatedAt || 0);
      const cacheTime = this.getCacheTimeForQuery(query.queryKey);

      // Remove queries that exceed their cache time and are not being observed
      if (timeSinceLastFetch > cacheTime && query.getObserversCount() === 0) {
        cache.remove(query);
        cleanedCount++;
      }
    });

    if (cleanedCount > 0) {
      console.log(
        `[BackgroundCache] Cleaned up ${cleanedCount} expired cache entries`
      );
    }
  }

  /**
   * Perform background refresh for active queries
   */
  private performBackgroundRefresh() {
    const cache = this.queryClient.getQueryCache();
    const queries = cache.getAll();
    let refreshedCount = 0;

    queries.forEach((query) => {
      // Only refresh queries that are being actively observed
      if (query.getObserversCount() > 0) {
        const timeSinceLastFetch =
          Date.now() - (query.state.dataUpdatedAt || 0);
        const staleTime = this.getStaleTimeForQuery(query.queryKey);

        // Refresh queries that are stale but still being observed
        if (timeSinceLastFetch > staleTime) {
          query.fetch();
          refreshedCount++;
        }
      }
    });

    if (refreshedCount > 0) {
      console.log(
        `[BackgroundCache] Background refreshed ${refreshedCount} stale queries`
      );
    }
  }

  /**
   * Check for stale data and refresh if necessary
   */
  private checkAndRefreshStaleData() {
    // Check for critical queries that should always be fresh
    const criticalQueries = [
      ['campaigns', 'search'],
      ['campaigns', 'getMyCampaigns'],
    ];

    criticalQueries.forEach((queryKey) => {
      const query = this.queryClient.getQueryCache().find({ queryKey });
      if (query && query.getObserversCount() > 0) {
        const timeSinceLastFetch =
          Date.now() - (query.state.dataUpdatedAt || 0);

        // Refresh critical queries if they're older than 30 seconds and being observed
        if (timeSinceLastFetch > 30 * 1000) {
          query.fetch();
        }
      }
    });
  }

  /**
   * Get appropriate stale time for a query based on its type
   */
  private getStaleTimeForQuery(queryKey: readonly unknown[]): number {
    const key = Array.isArray(queryKey) ? (queryKey[1] as string) : '';

    switch (key) {
      case 'search':
      case 'findNearby':
      case 'findInBounds':
        return cacheConfig.staleTime.campaigns;
      case 'getById':
        return cacheConfig.staleTime.campaigns;
      case 'getMyCampaigns':
        return cacheConfig.staleTime.campaigns;
      case 'getCityStats':
        return cacheConfig.staleTime.geographic;
      default:
        return cacheConfig.staleTime.campaigns;
    }
  }

  /**
   * Get appropriate cache time for a query based on its type
   */
  private getCacheTimeForQuery(queryKey: readonly unknown[]): number {
    const key = Array.isArray(queryKey) ? (queryKey[1] as string) : '';

    switch (key) {
      case 'search':
      case 'findNearby':
      case 'findInBounds':
        return cacheConfig.gcTime.campaigns;
      case 'getById':
        return cacheConfig.gcTime.campaigns;
      case 'getMyCampaigns':
        return cacheConfig.gcTime.campaigns;
      case 'getCityStats':
        return cacheConfig.gcTime.geographic;
      default:
        return cacheConfig.gcTime.campaigns;
    }
  }

  /**
   * Force refresh all active queries
   */
  forceRefreshAll() {
    const cache = this.queryClient.getQueryCache();
    const queries = cache.getAll();
    let refreshedCount = 0;

    queries.forEach((query) => {
      if (query.getObserversCount() > 0) {
        query.fetch();
        refreshedCount++;
      }
    });

    console.log(
      `[BackgroundCache] Force refreshed ${refreshedCount} active queries`
    );
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const cache = this.queryClient.getQueryCache();
    const queries = cache.getAll();

    const stats = {
      totalQueries: queries.length,
      activeQueries: queries.filter((q) => q.getObserversCount() > 0).length,
      staleQueries: queries.filter((q) => {
        const timeSinceLastFetch = Date.now() - (q.state.dataUpdatedAt || 0);
        const staleTime = this.getStaleTimeForQuery(q.queryKey);
        return timeSinceLastFetch > staleTime;
      }).length,
      errorQueries: queries.filter((q) => q.state.status === 'error').length,
      loadingQueries: queries.filter((q) => q.state.status === 'pending')
        .length,
    };

    return stats;
  }

  /**
   * Prefetch commonly accessed data
   */
  async prefetchCommonData() {
    try {
      // Prefetch active campaigns
      await this.queryClient.prefetchQuery({
        queryKey: ['campaigns', 'search', { status: 'ACTIVE' }],
        staleTime: cacheConfig.staleTime.campaigns,
      });

      console.log('[BackgroundCache] Prefetched common data');
    } catch (error) {
      console.warn('[BackgroundCache] Prefetch failed:', error);
    }
  }
}

/**
 * Create and configure background cache manager
 */
export function createBackgroundCacheManager(queryClient: QueryClient) {
  return new BackgroundCacheManager(queryClient);
}

/**
 * Cache performance monitoring
 */
export class CachePerformanceMonitor {
  private metrics: {
    hitCount: number;
    missCount: number;
    errorCount: number;
    totalFetchTime: number;
    fetchCount: number;
  } = {
    hitCount: 0,
    missCount: 0,
    errorCount: 0,
    totalFetchTime: 0,
    fetchCount: 0,
  };

  constructor(private queryClient: QueryClient) {
    this.setupMonitoring();
  }

  private setupMonitoring() {
    const cache = this.queryClient.getQueryCache();

    // Monitor query events
    cache.subscribe((event) => {
      switch (event.type) {
        case 'added':
          this.metrics.missCount++;
          break;
        case 'removed':
          // Cache cleanup
          break;
        case 'updated':
          if (event.query.state.status === 'success') {
            this.metrics.hitCount++;
          } else if (event.query.state.status === 'error') {
            this.metrics.errorCount++;
          }
          break;
      }
    });
  }

  getMetrics() {
    const hitRate =
      this.metrics.hitCount /
        (this.metrics.hitCount + this.metrics.missCount) || 0;
    const errorRate = this.metrics.errorCount / this.metrics.fetchCount || 0;
    const avgFetchTime =
      this.metrics.totalFetchTime / this.metrics.fetchCount || 0;

    return {
      ...this.metrics,
      hitRate: Math.round(hitRate * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      avgFetchTime: Math.round(avgFetchTime),
    };
  }

  reset() {
    this.metrics = {
      hitCount: 0,
      missCount: 0,
      errorCount: 0,
      totalFetchTime: 0,
      fetchCount: 0,
    };
  }
}
