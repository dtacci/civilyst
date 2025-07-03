import { Redis } from '@upstash/redis';
import { env } from '~/env';

/**
 * TTL (Time-To-Live) configuration for different data types in seconds
 */
export const CACHE_TTL = {
  /** Geographic queries cache duration: 15 minutes */
  GEO_QUERY: 60 * 15,
  /** User profile cache duration: 5 minutes */
  USER_PROFILE: 60 * 5,
  /** Campaign details cache duration: 10 minutes */
  CAMPAIGN_DETAIL: 60 * 10,
  /** Search results cache duration: 5 minutes */
  SEARCH_RESULTS: 60 * 5,
  /** Default cache duration: 5 minutes */
  DEFAULT: 60 * 5,
} as const;

/**
 * Cache key prefixes for different data types
 */
export const CACHE_PREFIX = {
  /** Geographic query cache key prefix */
  GEO: 'geo',
  /** User profile cache key prefix */
  USER: 'user',
  /** Campaign cache key prefix */
  CAMPAIGN: 'campaign',
  /** Search results cache key prefix */
  SEARCH: 'search',
} as const;

/**
 * Precision for rounding geographic coordinates in cache keys
 * 3 decimal places ≈ 111 meters precision
 * 4 decimal places ≈ 11 meters precision
 */
export const GEO_PRECISION = {
  /** City-level precision (about 111 meters) */
  CITY: 3,
  /** Street-level precision (about 11 meters) */
  STREET: 4,
} as const;

/**
 * Cache operation result with metadata
 */
export interface CacheResult<T> {
  /** The data retrieved from cache */
  data: T | null;
  /** Whether the data was found in cache */
  hit: boolean;
  /** Time taken for the cache operation in milliseconds */
  latencyMs: number;
  /** Error if one occurred */
  error?: Error;
}

/**
 * Cache metrics for monitoring
 */
export interface CacheMetrics {
  /** Number of cache hits */
  hits: number;
  /** Number of cache misses */
  misses: number;
  /** Total number of requests */
  requests: number;
  /** Hit rate percentage */
  hitRate: number;
  /** Average latency in milliseconds */
  avgLatencyMs: number;
  /** Cache operations since last reset */
  operationsSinceReset: number;
  /** Last reset timestamp */
  lastReset: Date;
}

// Redis client instance (singleton)
let redisClient: Redis | null = null;

/**
 * Cache metrics tracking
 */
const metrics: CacheMetrics = {
  hits: 0,
  misses: 0,
  requests: 0,
  hitRate: 0,
  avgLatencyMs: 0,
  operationsSinceReset: 0,
  lastReset: new Date(),
};

/**
 * Get the Redis client instance, creating it if necessary
 */
export function getRedisClient(): Redis | null {
  // In development, gracefully handle missing Redis
  if (process.env.NODE_ENV === 'development') {
    if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
      if (process.env.NODE_ENV === 'development') {
        console.info(
          '[Cache] Redis not configured for development - using in-memory fallback'
        );
      }
      return null;
    }
  }

  if (!redisClient) {
    try {
      redisClient = new Redis({
        url: env.UPSTASH_REDIS_REST_URL,
        token: env.UPSTASH_REDIS_REST_TOKEN,
      });
    } catch (error) {
      console.error('[Cache] Failed to initialize Redis client:', error);
      if (process.env.NODE_ENV === 'development') {
        if (process.env.NODE_ENV === 'development') {
          console.info('[Cache] Development mode: continuing without Redis');
        }
        return null;
      }
      throw new Error('Redis client initialization failed');
    }
  }
  return redisClient;
}

/**
 * Check if Redis is available
 */
export async function isRedisAvailable(): Promise<boolean> {
  try {
    const redis = getRedisClient();
    if (!redis) {
      return false;
    }
    await redis.ping();
    return true;
  } catch (error) {
    console.error('[Cache] Redis is not available:', error);
    return false;
  }
}

/**
 * Update cache metrics with operation result
 */
function updateMetrics(hit: boolean, latencyMs: number): void {
  metrics.requests += 1;
  metrics.operationsSinceReset += 1;

  if (hit) {
    metrics.hits += 1;
  } else {
    metrics.misses += 1;
  }

  metrics.hitRate = metrics.hits / metrics.requests;

  // Update average latency using rolling average
  metrics.avgLatencyMs =
    (metrics.avgLatencyMs * (metrics.operationsSinceReset - 1) + latencyMs) /
    metrics.operationsSinceReset;
}

/**
 * Reset cache metrics
 */
export function resetCacheMetrics(): CacheMetrics {
  const oldMetrics = { ...metrics };

  metrics.hits = 0;
  metrics.misses = 0;
  metrics.requests = 0;
  metrics.hitRate = 0;
  metrics.avgLatencyMs = 0;
  metrics.operationsSinceReset = 0;
  metrics.lastReset = new Date();

  return oldMetrics;
}

/**
 * Get current cache metrics
 */
export function getCacheMetrics(): CacheMetrics {
  return { ...metrics };
}

/**
 * Generate a cache key for geographic queries
 */
export function geoQueryCacheKey(
  latitude: number,
  longitude: number,
  radiusKm: number,
  precision = GEO_PRECISION.CITY,
  additionalParams: Record<string, string | number | boolean> = {}
): string {
  // Round coordinates to specified precision
  const lat = parseFloat(latitude.toFixed(precision));
  const lng = parseFloat(longitude.toFixed(precision));

  // Create base key
  let key = `${CACHE_PREFIX.GEO}:${lat}:${lng}:${radiusKm}`;

  // Add additional parameters if provided
  if (Object.keys(additionalParams).length > 0) {
    const paramString = Object.entries(additionalParams)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB)) // Sort for consistency
      .map(([k, v]) => `${k}:${v}`)
      .join(':');
    key += `:${paramString}`;
  }

  return key;
}

/**
 * Generate a cache key for search queries
 */
export function searchQueryCacheKey(
  query: string,
  filters: Record<string, string | number | boolean> = {}
): string {
  // Normalize query
  const normalizedQuery = query.trim().toLowerCase();

  // Create base key
  let key = `${CACHE_PREFIX.SEARCH}:${normalizedQuery}`;

  // Add filters if provided
  if (Object.keys(filters).length > 0) {
    const filterString = Object.entries(filters)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB)) // Sort for consistency
      .map(([k, v]) => `${k}:${v}`)
      .join(':');
    key += `:${filterString}`;
  }

  return key;
}

/**
 * Generate a cache key for a user profile
 */
export function userProfileCacheKey(userId: string): string {
  return `${CACHE_PREFIX.USER}:${userId}`;
}

/**
 * Generate a cache key for campaign details
 */
export function campaignCacheKey(campaignId: string): string {
  return `${CACHE_PREFIX.CAMPAIGN}:${campaignId}`;
}

/**
 * Get data from cache
 */
export async function getCache<T>(key: string): Promise<CacheResult<T>> {
  const startTime = performance.now();
  let hit = false;
  let error: Error | undefined;
  let data: T | null = null;

  try {
    // Check if Redis is available, otherwise return cache miss
    if (!(await isRedisAvailable())) {
      return {
        data: null,
        hit: false,
        latencyMs: performance.now() - startTime,
        error: new Error('Redis is not available'),
      };
    }

    const redis = getRedisClient();
    if (!redis) {
      return {
        data: null,
        hit: false,
        latencyMs: performance.now() - startTime,
        error: new Error('Redis is not available'),
      };
    }

    data = await redis.get<T>(key);
    hit = data !== null;
  } catch (e) {
    error = e instanceof Error ? e : new Error(String(e));
    console.error(`[Cache] Cache get error for key ${key}:`, error);
  }

  const latencyMs = performance.now() - startTime;
  updateMetrics(hit, latencyMs);

  return {
    data,
    hit,
    latencyMs,
    error,
  };
}

/**
 * Set data in cache with TTL
 */
export async function setCache<T>(
  key: string,
  data: T,
  ttlSeconds = CACHE_TTL.DEFAULT
): Promise<boolean> {
  try {
    const redis = getRedisClient();
    if (!redis) {
      // In development without Redis, just return true (no-op)
      return true;
    }

    await redis.set(key, data, { ex: ttlSeconds });
    return true;
  } catch (error) {
    console.error(`[Cache] Cache set error for key ${key}:`, error);
    return false;
  }
}

/**
 * Check if a key exists in cache
 */
export async function existsInCache(key: string): Promise<boolean> {
  try {
    // Check if Redis is available
    if (!(await isRedisAvailable())) {
      return false;
    }

    const redis = getRedisClient();
    if (!redis) {
      return false;
    }
    return (await redis.exists(key)) > 0;
  } catch (error) {
    console.error(`[Cache] Cache exists error for key ${key}:`, error);
    return false;
  }
}

/**
 * Delete data from cache
 */
export async function deleteFromCache(key: string): Promise<boolean> {
  try {
    // Check if Redis is available
    if (!(await isRedisAvailable())) {
      return false;
    }

    const redis = getRedisClient();
    if (!redis) {
      return false;
    }
    await redis.del(key);
    return true;
  } catch (error) {
    console.error(`[Cache] Cache delete error for key ${key}:`, error);
    return false;
  }
}

/**
 * Delete multiple keys from cache
 */
export async function deleteMultiFromCache(keys: string[]): Promise<number> {
  if (keys.length === 0) return 0;

  try {
    // Check if Redis is available
    if (!(await isRedisAvailable())) {
      return 0;
    }

    const redis = getRedisClient();
    if (!redis) {
      return 0;
    }
    return await redis.del(...keys);
  } catch (error) {
    console.error(`[Cache] Cache multi-delete error:`, error);
    return 0;
  }
}

/**
 * Delete keys by pattern
 * Note: This uses SCAN which is safer than KEYS for production
 */
export async function deleteByPattern(pattern: string): Promise<number> {
  try {
    // Check if Redis is available
    if (!(await isRedisAvailable())) {
      return 0;
    }

    const redis = getRedisClient();
    if (!redis) {
      return 0;
    }
    let cursor = 0;
    let deletedCount = 0;

    do {
      // Scan for keys matching pattern
      const result: [string, string[]] = await redis.scan(cursor, {
        match: pattern,
        count: 100,
      });

      cursor = parseInt(result[0], 10);
      const keys = result[1];

      if (keys.length > 0) {
        // Delete found keys
        const deleted = await redis.del(...keys);
        deletedCount += deleted;
      }
    } while (cursor !== 0);

    return deletedCount;
  } catch (error) {
    console.error(
      `[Cache] Cache pattern delete error for pattern ${pattern}:`,
      error
    );
    return 0;
  }
}

/**
 * Get multiple values from cache
 */
export async function getMultiFromCache<T>(
  keys: string[]
): Promise<Map<string, T | null>> {
  if (keys.length === 0) return new Map();

  try {
    // Check if Redis is available
    if (!(await isRedisAvailable())) {
      return new Map(keys.map((key) => [key, null]));
    }

    const redis = getRedisClient();
    if (!redis) {
      return new Map(keys.map((key) => [key, null]));
    }
    const values = await redis.mget<T[]>(...keys);

    // Create a map of key to value
    const resultMap = new Map<string, T | null>();
    keys.forEach((key, index) => {
      resultMap.set(key, values[index]);
    });

    return resultMap;
  } catch (error) {
    console.error(`[Cache] Cache multi-get error:`, error);
    return new Map(keys.map((key) => [key, null]));
  }
}

/**
 * Set multiple values in cache with the same TTL
 */
export async function setMultiInCache<T>(
  entries: Array<[string, T]>,
  ttlSeconds = CACHE_TTL.DEFAULT
): Promise<boolean> {
  if (entries.length === 0) return true;

  try {
    // Check if Redis is available
    if (!(await isRedisAvailable())) {
      return false;
    }

    const redis = getRedisClient();
    if (!redis) {
      return false;
    }
    const pipeline = redis.pipeline();

    for (const [key, value] of entries) {
      pipeline.set(key, value, { ex: ttlSeconds });
    }

    await pipeline.exec();
    return true;
  } catch (error) {
    console.error(`[Cache] Cache multi-set error:`, error);
    return false;
  }
}

/**
 * Invalidate all cache entries for a specific campaign
 */
export async function invalidateCampaignCache(
  campaignId: string
): Promise<number> {
  // Delete the campaign detail cache
  const campaignKey = campaignCacheKey(campaignId);
  await deleteFromCache(campaignKey);

  // Delete any search or geo queries that might include this campaign
  const searchPattern = `${CACHE_PREFIX.SEARCH}:*`;
  const geoPattern = `${CACHE_PREFIX.GEO}:*`;

  const searchDeleted = await deleteByPattern(searchPattern);
  const geoDeleted = await deleteByPattern(geoPattern);

  return 1 + searchDeleted + geoDeleted;
}

/**
 * Invalidate all cache entries for a specific user
 */
export async function invalidateUserCache(userId: string): Promise<number> {
  // Delete the user profile cache
  const userKey = userProfileCacheKey(userId);
  await deleteFromCache(userKey);

  // Delete any search results that might be affected by this user's actions
  const searchPattern = `${CACHE_PREFIX.SEARCH}:*`;
  const searchDeleted = await deleteByPattern(searchPattern);

  return 1 + searchDeleted;
}

/**
 * Warm up cache with frequently accessed data
 */
export async function warmCache<T>(
  key: string,
  fetchData: () => Promise<T>,
  ttlSeconds = CACHE_TTL.DEFAULT
): Promise<boolean> {
  try {
    const data = await fetchData();
    return await setCache(key, data, ttlSeconds);
  } catch (error) {
    console.error(`[Cache] Cache warming error for key ${key}:`, error);
    return false;
  }
}

/**
 * Get data from cache with fallback to fetch function
 */
export async function getCacheWithFallback<T>(
  key: string,
  fetchData: () => Promise<T>,
  ttlSeconds = CACHE_TTL.DEFAULT
): Promise<CacheResult<T>> {
  // Try to get from cache first
  const cacheResult = await getCache<T>(key);

  // If cache hit, return the data
  if (cacheResult.hit && cacheResult.data !== null) {
    return cacheResult;
  }

  // If cache miss or error, fetch fresh data
  try {
    const startTime = performance.now();
    const freshData = await fetchData();

    // Store in cache for future requests
    await setCache(key, freshData, ttlSeconds);

    return {
      data: freshData,
      hit: false,
      latencyMs: performance.now() - startTime,
    };
  } catch (error) {
    const e = error instanceof Error ? error : new Error(String(error));
    console.error(`[Cache] Data fetch error for key ${key}:`, e);

    return {
      data: null,
      hit: false,
      latencyMs: 0,
      error: e,
    };
  }
}

/**
 * Clear entire cache (use with caution!)
 */
export async function clearAllCache(): Promise<boolean> {
  try {
    // Check if Redis is available
    if (!(await isRedisAvailable())) {
      return false;
    }

    const redis = getRedisClient();
    if (!redis) {
      return false;
    }
    await redis.flushall();
    return true;
  } catch (error) {
    console.error('[Cache] Clear all cache error:', error);
    return false;
  }
}

/**
 * Set cache entry with automatic expiration and refresh
 * This is useful for data that needs to be kept fresh but can tolerate some staleness
 */
export async function setRefreshingCache<T>(
  key: string,
  data: T,
  ttlSeconds = CACHE_TTL.DEFAULT,
  refreshThresholdSeconds = Math.floor(ttlSeconds * 0.75) // Default: refresh at 75% of TTL
): Promise<boolean> {
  try {
    // Check if Redis is available
    if (!(await isRedisAvailable())) {
      return false;
    }

    const redis = getRedisClient();
    if (!redis) {
      return false;
    }

    // Store the data with metadata including timestamp
    const entry = {
      data,
      createdAt: Date.now(),
      ttlSeconds,
      refreshThresholdSeconds,
    };

    await redis.set(key, entry, { ex: ttlSeconds });
    return true;
  } catch (error) {
    console.error(`[Cache] Refreshing cache set error for key ${key}:`, error);
    return false;
  }
}

/**
 * Get data from refreshing cache, triggering refresh if approaching expiration
 */
export async function getRefreshingCache<T>(
  key: string,
  refreshCallback: () => Promise<T>
): Promise<CacheResult<T>> {
  const startTime = performance.now();
  let hit = false;
  let error: Error | undefined;
  let data: T | null = null;

  try {
    // Check if Redis is available
    if (!(await isRedisAvailable())) {
      return {
        data: null,
        hit: false,
        latencyMs: performance.now() - startTime,
        error: new Error('Redis is not available'),
      };
    }

    const redis = getRedisClient();
    if (!redis) {
      return {
        data: null,
        hit: false,
        latencyMs: performance.now() - startTime,
        error: new Error('Redis is not available'),
      };
    }
    const entry = await redis.get<{
      data: T;
      createdAt: number;
      ttlSeconds: number;
      refreshThresholdSeconds: number;
    }>(key);

    if (entry) {
      hit = true;
      data = entry.data;

      // Check if we need to refresh the data
      const ageSeconds = (Date.now() - entry.createdAt) / 1000;
      if (ageSeconds >= entry.refreshThresholdSeconds) {
        // Schedule refresh without blocking the current request
        void (async () => {
          try {
            const freshData = await refreshCallback();
            await setRefreshingCache(
              key,
              freshData,
              entry.ttlSeconds,
              entry.refreshThresholdSeconds
            );
          } catch (refreshError) {
            console.error(
              `[Cache] Background refresh error for key ${key}:`,
              refreshError
            );
          }
        })();
      }
    }
  } catch (e) {
    error = e instanceof Error ? e : new Error(String(e));
    console.error(`[Cache] Refreshing cache get error for key ${key}:`, error);
  }

  const latencyMs = performance.now() - startTime;
  updateMetrics(hit, latencyMs);

  return {
    data,
    hit,
    latencyMs,
    error,
  };
}
