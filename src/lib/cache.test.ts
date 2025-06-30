import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Redis } from '@upstash/redis';
import {
  getRedisClient,
  isRedisAvailable,
  getCache,
  setCache,
  existsInCache,
  deleteFromCache,
  deleteMultiFromCache,
  deleteByPattern,
  geoQueryCacheKey,
  searchQueryCacheKey,
  userProfileCacheKey,
  campaignCacheKey,
  getCacheMetrics,
  resetCacheMetrics,
  getCacheWithFallback,
  GEO_PRECISION,
  CACHE_PREFIX,
  invalidateCampaignCache,
  invalidateUserCache,
  getMultiFromCache,
  setMultiInCache,
  setRefreshingCache,
  getRefreshingCache,
  clearAllCache,
  warmCache,
} from '~/lib/cache';
import { env } from '~/env';

// Mock the Redis client
vi.mock('@upstash/redis', () => {
  const mockRedis = {
    get: vi.fn(),
    set: vi.fn(),
    exists: vi.fn(),
    del: vi.fn(),
    mget: vi.fn(),
    scan: vi.fn(),
    pipeline: vi.fn(),
    ping: vi.fn(),
    flushall: vi.fn(),
  };

  mockRedis.pipeline.mockReturnValue({
    set: vi.fn(),
    exec: vi.fn(),
  });

  return {
    Redis: vi.fn(() => mockRedis),
  };
});

// Mock environment variables
vi.mock('~/env', () => ({
  env: {
    UPSTASH_REDIS_REST_URL: 'https://mock-redis-url.upstash.io',
    UPSTASH_REDIS_REST_TOKEN: 'mock-redis-token',
  },
  isServiceConfigured: {
    redis: () => true,
  },
}));

describe('Redis Cache Utilities', () => {
  // More precise type for the mocked Redis client
  let mockRedis: Record<string, vi.Mock>;

  beforeEach(() => {
    // Reset all mocks before each test
    vi.resetAllMocks();

    // Retrieve the mocked Redis instance produced by vi.fn()
    const instance =
      (Redis as unknown as ReturnType<typeof vi.fn>).mock.results[0]?.value ??
      // Fallback: create a fresh mocked instance (typed, no `any`)
      new (Redis as unknown as { new (): Record<string, vi.Mock> })();

    mockRedis = instance;

    // Reset metrics
    resetCacheMetrics();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Redis Connection', () => {
    it('should create a Redis client with correct configuration', () => {
      getRedisClient();

      expect(Redis).toHaveBeenCalledWith({
        url: env.UPSTASH_REDIS_REST_URL,
        token: env.UPSTASH_REDIS_REST_TOKEN,
      });
    });

    it('should return the same Redis client instance on multiple calls', () => {
      const client1 = getRedisClient();
      const client2 = getRedisClient();

      expect(Redis).toHaveBeenCalledTimes(1);
      expect(client1).toBe(client2);
    });

    it('should check if Redis is available', async () => {
      mockRedis.ping.mockResolvedValue('PONG');

      const available = await isRedisAvailable();

      expect(mockRedis.ping).toHaveBeenCalled();
      expect(available).toBe(true);
    });

    it('should handle Redis unavailability', async () => {
      mockRedis.ping.mockRejectedValue(new Error('Connection failed'));

      const available = await isRedisAvailable();

      expect(mockRedis.ping).toHaveBeenCalled();
      expect(available).toBe(false);
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate correct geographic query cache keys', () => {
      const latitude = 37.7749;
      const longitude = -122.4194;
      const radiusKm = 10;

      // Test with city-level precision
      const cityKey = geoQueryCacheKey(
        latitude,
        longitude,
        radiusKm,
        GEO_PRECISION.CITY
      );
      expect(cityKey).toBe(`${CACHE_PREFIX.GEO}:37.775:-122.419:10`);

      // Test with street-level precision
      const streetKey = geoQueryCacheKey(
        latitude,
        longitude,
        radiusKm,
        GEO_PRECISION.STREET
      );
      expect(streetKey).toBe(`${CACHE_PREFIX.GEO}:37.7749:-122.4194:10`);

      // Test with additional parameters
      const keyWithParams = geoQueryCacheKey(
        latitude,
        longitude,
        radiusKm,
        GEO_PRECISION.CITY,
        { status: 'ACTIVE', limit: 20 }
      );
      expect(keyWithParams).toBe(
        `${CACHE_PREFIX.GEO}:37.775:-122.419:10:limit:20:status:ACTIVE`
      );
    });

    it('should generate correct search query cache keys', () => {
      // Simple search query
      const simpleKey = searchQueryCacheKey('parks');
      expect(simpleKey).toBe(`${CACHE_PREFIX.SEARCH}:parks`);

      // Search query with filters
      const keyWithFilters = searchQueryCacheKey('parks', {
        city: 'San Francisco',
        status: 'ACTIVE',
        limit: 20,
      });
      expect(keyWithFilters).toBe(
        `${CACHE_PREFIX.SEARCH}:parks:city:San Francisco:limit:20:status:ACTIVE`
      );

      // Normalized query (trimmed and lowercase)
      const normalizedKey = searchQueryCacheKey('  Parks  ');
      expect(normalizedKey).toBe(`${CACHE_PREFIX.SEARCH}:parks`);
    });

    it('should generate correct user profile cache keys', () => {
      const userId = 'user_123';
      const key = userProfileCacheKey(userId);
      expect(key).toBe(`${CACHE_PREFIX.USER}:user_123`);
    });

    it('should generate correct campaign cache keys', () => {
      const campaignId = 'campaign_456';
      const key = campaignCacheKey(campaignId);
      expect(key).toBe(`${CACHE_PREFIX.CAMPAIGN}:campaign_456`);
    });
  });

  describe('Basic Cache Operations', () => {
    it('should set data in cache with TTL', async () => {
      mockRedis.set.mockResolvedValue('OK');

      const key = 'test:key';
      const data = { foo: 'bar' };
      const ttl = 300;

      const result = await setCache(key, data, ttl);

      expect(mockRedis.set).toHaveBeenCalledWith(key, data, { ex: ttl });
      expect(result).toBe(true);
    });

    it('should get data from cache', async () => {
      const cachedData = { foo: 'bar' };
      mockRedis.get.mockResolvedValue(cachedData);

      const key = 'test:key';
      const result = await getCache(key);

      expect(mockRedis.get).toHaveBeenCalledWith(key);
      expect(result.data).toEqual(cachedData);
      expect(result.hit).toBe(true);
    });

    it('should handle cache miss', async () => {
      mockRedis.get.mockResolvedValue(null);

      const key = 'test:key';
      const result = await getCache(key);

      expect(mockRedis.get).toHaveBeenCalledWith(key);
      expect(result.data).toBeNull();
      expect(result.hit).toBe(false);
    });

    it('should check if key exists in cache', async () => {
      mockRedis.exists.mockResolvedValue(1);

      const key = 'test:key';
      const exists = await existsInCache(key);

      expect(mockRedis.exists).toHaveBeenCalledWith(key);
      expect(exists).toBe(true);
    });

    it('should delete data from cache', async () => {
      mockRedis.del.mockResolvedValue(1);

      const key = 'test:key';
      const result = await deleteFromCache(key);

      expect(mockRedis.del).toHaveBeenCalledWith(key);
      expect(result).toBe(true);
    });
  });

  describe('Cache Invalidation Patterns', () => {
    it('should invalidate campaign cache', async () => {
      // Setup mocks
      mockRedis.del.mockResolvedValue(1);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      mockRedis.scan.mockImplementation((cursor, _options) => {
        if (cursor === 0) {
          return [
            '0',
            [
              `${CACHE_PREFIX.SEARCH}:parks`,
              `${CACHE_PREFIX.GEO}:37.775:-122.419:10`,
            ],
          ];
        }
        return ['0', []];
      });

      const campaignId = 'campaign_123';
      const result = await invalidateCampaignCache(campaignId);

      // Should delete campaign key
      expect(mockRedis.del).toHaveBeenCalledWith(
        `${CACHE_PREFIX.CAMPAIGN}:${campaignId}`
      );

      // Should scan and delete pattern matches
      expect(mockRedis.scan).toHaveBeenCalledWith(0, {
        match: `${CACHE_PREFIX.SEARCH}:*`,
        count: 100,
      });
      expect(mockRedis.scan).toHaveBeenCalledWith(0, {
        match: `${CACHE_PREFIX.GEO}:*`,
        count: 100,
      });

      // Should have deleted the found keys
      expect(mockRedis.del).toHaveBeenCalledWith(
        `${CACHE_PREFIX.SEARCH}:parks`,
        `${CACHE_PREFIX.GEO}:37.775:-122.419:10`
      );

      // Should return total count of deleted keys
      expect(result).toBeGreaterThan(0);
    });

    it('should invalidate user cache', async () => {
      // Setup mocks
      mockRedis.del.mockResolvedValue(1);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      mockRedis.scan.mockImplementation((cursor, _options) => {
        if (cursor === 0) {
          return ['0', [`${CACHE_PREFIX.SEARCH}:parks`]];
        }
        return ['0', []];
      });

      const userId = 'user_123';
      const result = await invalidateUserCache(userId);

      // Should delete user key
      expect(mockRedis.del).toHaveBeenCalledWith(
        `${CACHE_PREFIX.USER}:${userId}`
      );

      // Should scan and delete search pattern matches
      expect(mockRedis.scan).toHaveBeenCalledWith(0, {
        match: `${CACHE_PREFIX.SEARCH}:*`,
        count: 100,
      });

      // Should have deleted the found keys
      expect(mockRedis.del).toHaveBeenCalledWith(
        `${CACHE_PREFIX.SEARCH}:parks`
      );

      // Should return total count of deleted keys
      expect(result).toBeGreaterThan(0);
    });

    it('should delete keys by pattern', async () => {
      // Setup mocks for multi-page scan results
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      mockRedis.scan.mockImplementation((cursor, _options) => {
        if (cursor === 0) {
          return ['1', ['key1', 'key2']]; // Return cursor 1 to indicate more results
        } else {
          return ['0', ['key3', 'key4']]; // Return cursor 0 to indicate end
        }
      });
      mockRedis.del.mockResolvedValue(2); // Each del call deletes 2 keys

      const pattern = `${CACHE_PREFIX.GEO}:*`;
      const result = await deleteByPattern(pattern);

      // Should have scanned twice
      expect(mockRedis.scan).toHaveBeenCalledTimes(2);
      expect(mockRedis.scan).toHaveBeenCalledWith(0, {
        match: pattern,
        count: 100,
      });
      expect(mockRedis.scan).toHaveBeenCalledWith(1, {
        match: pattern,
        count: 100,
      });

      // Should have deleted keys in batches
      expect(mockRedis.del).toHaveBeenCalledWith('key1', 'key2');
      expect(mockRedis.del).toHaveBeenCalledWith('key3', 'key4');

      // Should return total count of deleted keys (2 batches of 2)
      expect(result).toBe(4);
    });
  });

  describe('Cache Metrics Tracking', () => {
    it('should track cache hits and misses', async () => {
      // Setup cache hit
      mockRedis.get.mockResolvedValueOnce({ data: 'hit' });
      await getCache('hit-key');

      // Setup cache miss
      mockRedis.get.mockResolvedValueOnce(null);
      await getCache('miss-key');

      // Get metrics
      const metrics = getCacheMetrics();

      // Should have tracked hit, miss, and requests
      expect(metrics.hits).toBe(1);
      expect(metrics.misses).toBe(1);
      expect(metrics.requests).toBe(2);
      expect(metrics.hitRate).toBe(0.5); // 1 hit out of 2 requests
    });

    it('should reset metrics', async () => {
      // Setup some cache operations
      mockRedis.get.mockResolvedValue({ data: 'value' });
      await getCache('key1');
      await getCache('key2');

      // Reset metrics
      const oldMetrics = resetCacheMetrics();

      // Old metrics should have 2 hits
      expect(oldMetrics.hits).toBe(2);
      expect(oldMetrics.requests).toBe(2);

      // New metrics should be reset
      const newMetrics = getCacheMetrics();
      expect(newMetrics.hits).toBe(0);
      expect(newMetrics.requests).toBe(0);
      expect(newMetrics.hitRate).toBe(0);
    });
  });

  describe('Fallback Behavior', () => {
    it('should handle Redis unavailability in getCache', async () => {
      // Make Redis unavailable
      mockRedis.ping.mockRejectedValue(new Error('Connection failed'));

      const result = await getCache('test-key');

      expect(result.data).toBeNull();
      expect(result.hit).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Redis is not available');
    });

    it('should handle Redis unavailability in setCache', async () => {
      // Make Redis unavailable
      mockRedis.ping.mockRejectedValue(new Error('Connection failed'));

      const result = await setCache('test-key', { data: 'value' });

      expect(result).toBe(false);
    });

    it('should use fallback function when cache misses', async () => {
      // Setup cache miss
      mockRedis.get.mockResolvedValue(null);
      mockRedis.set.mockResolvedValue('OK');

      const fallbackData = { foo: 'fallback-data' };
      const fallbackFn = vi.fn().mockResolvedValue(fallbackData);

      const result = await getCacheWithFallback('test-key', fallbackFn, 300);

      // Should have called fallback function
      expect(fallbackFn).toHaveBeenCalled();

      // Should have stored fallback result in cache
      expect(mockRedis.set).toHaveBeenCalledWith('test-key', fallbackData, {
        ex: 300,
      });

      // Should return fallback data
      expect(result.data).toEqual(fallbackData);
      expect(result.hit).toBe(false);
    });

    it('should handle errors in fallback function', async () => {
      // Setup cache miss
      mockRedis.get.mockResolvedValue(null);

      // Setup fallback function that throws
      const fallbackError = new Error('Fallback failed');
      const fallbackFn = vi.fn().mockRejectedValue(fallbackError);

      const result = await getCacheWithFallback('test-key', fallbackFn);

      // Should have called fallback function
      expect(fallbackFn).toHaveBeenCalled();

      // Should return error
      expect(result.data).toBeNull();
      expect(result.hit).toBe(false);
      expect(result.error).toBe(fallbackError);
    });
  });

  describe('Batch Operations', () => {
    it('should get multiple values from cache', async () => {
      // Setup mock response
      mockRedis.mget.mockResolvedValue([
        { id: 1, name: 'Item 1' },
        null,
        { id: 3, name: 'Item 3' },
      ]);

      const keys = ['key1', 'key2', 'key3'];
      const result = await getMultiFromCache(keys);

      expect(mockRedis.mget).toHaveBeenCalledWith(...keys);

      // Should return a map with all keys
      expect(result.size).toBe(3);
      expect(result.get('key1')).toEqual({ id: 1, name: 'Item 1' });
      expect(result.get('key2')).toBeNull();
      expect(result.get('key3')).toEqual({ id: 3, name: 'Item 3' });
    });

    it('should set multiple values in cache', async () => {
      // Setup mock pipeline
      const mockPipeline = {
        set: vi.fn(),
        exec: vi.fn().mockResolvedValue([]),
      };
      mockRedis.pipeline.mockReturnValue(mockPipeline);

      const entries = [
        ['key1', { id: 1, name: 'Item 1' }],
        ['key2', { id: 2, name: 'Item 2' }],
      ];
      const ttl = 600;

      const result = await setMultiInCache(entries, ttl);

      // Should have used pipeline
      expect(mockRedis.pipeline).toHaveBeenCalled();

      // Should have called set for each entry
      expect(mockPipeline.set).toHaveBeenCalledTimes(2);
      expect(mockPipeline.set).toHaveBeenCalledWith(
        'key1',
        { id: 1, name: 'Item 1' },
        { ex: ttl }
      );
      expect(mockPipeline.set).toHaveBeenCalledWith(
        'key2',
        { id: 2, name: 'Item 2' },
        { ex: ttl }
      );

      // Should have executed pipeline
      expect(mockPipeline.exec).toHaveBeenCalled();

      // Should return success
      expect(result).toBe(true);
    });

    it('should delete multiple keys from cache', async () => {
      mockRedis.del.mockResolvedValue(2);

      const keys = ['key1', 'key2'];
      const result = await deleteMultiFromCache(keys);

      expect(mockRedis.del).toHaveBeenCalledWith(...keys);
      expect(result).toBe(2);
    });

    it('should handle empty arrays in batch operations', async () => {
      const emptyGetResult = await getMultiFromCache([]);
      expect(emptyGetResult.size).toBe(0);
      expect(mockRedis.mget).not.toHaveBeenCalled();

      const emptySetResult = await setMultiInCache([]);
      expect(emptySetResult).toBe(true);
      expect(mockRedis.pipeline).not.toHaveBeenCalled();

      const emptyDeleteResult = await deleteMultiFromCache([]);
      expect(emptyDeleteResult).toBe(0);
      expect(mockRedis.del).not.toHaveBeenCalled();
    });
  });

  describe('Advanced Caching Features', () => {
    it('should warm cache with data', async () => {
      mockRedis.set.mockResolvedValue('OK');

      const key = 'warm-key';
      const data = { foo: 'warm-data' };
      const fetchData = vi.fn().mockResolvedValue(data);
      const ttl = 300;

      const result = await warmCache(key, fetchData, ttl);

      // Should have called fetch function
      expect(fetchData).toHaveBeenCalled();

      // Should have stored data in cache
      expect(mockRedis.set).toHaveBeenCalledWith(key, data, { ex: ttl });

      // Should return success
      expect(result).toBe(true);
    });

    it('should handle errors in warm cache', async () => {
      const fetchError = new Error('Fetch failed');
      const fetchData = vi.fn().mockRejectedValue(fetchError);

      const result = await warmCache('warm-key', fetchData);

      // Should have called fetch function
      expect(fetchData).toHaveBeenCalled();

      // Should not have called set
      expect(mockRedis.set).not.toHaveBeenCalled();

      // Should return failure
      expect(result).toBe(false);
    });

    it('should set refreshing cache with metadata', async () => {
      mockRedis.set.mockResolvedValue('OK');

      const key = 'refresh-key';
      const data = { foo: 'refresh-data' };
      const ttl = 300;
      const refreshThreshold = 200;

      const result = await setRefreshingCache(key, data, ttl, refreshThreshold);

      // Should have stored data with metadata
      expect(mockRedis.set).toHaveBeenCalledWith(
        key,
        {
          data,
          createdAt: expect.any(Number),
          ttlSeconds: ttl,
          refreshThresholdSeconds: refreshThreshold,
        },
        { ex: ttl }
      );

      // Should return success
      expect(result).toBe(true);
    });

    it('should get from refreshing cache and trigger refresh when approaching expiration', async () => {
      // Setup cache hit with data approaching expiration
      const now = Date.now();
      const data = { foo: 'stale-data' };
      const ttl = 300;
      const refreshThreshold = 200;
      const ageInSeconds = 250; // > refreshThreshold

      mockRedis.get.mockResolvedValue({
        data,
        createdAt: now - ageInSeconds * 1000, // Created in the past
        ttlSeconds: ttl,
        refreshThresholdSeconds: refreshThreshold,
      });

      // Setup refresh callback
      const freshData = { foo: 'fresh-data' };
      const refreshCallback = vi.fn().mockResolvedValue(freshData);

      const result = await getRefreshingCache('refresh-key', refreshCallback);

      // Should have returned cached data
      expect(result.data).toEqual(data);
      expect(result.hit).toBe(true);

      // Should have triggered refresh in background
      // We need to wait for the background promise to resolve
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(refreshCallback).toHaveBeenCalled();
      expect(mockRedis.set).toHaveBeenCalled();
    });

    it('should clear all cache', async () => {
      mockRedis.flushall.mockResolvedValue('OK');

      const result = await clearAllCache();

      expect(mockRedis.flushall).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });
});
