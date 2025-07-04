import { db } from '~/lib/db';
import {
  setCache,
  getCache,
  geoQueryCacheKey,
  searchQueryCacheKey,
  campaignCacheKey,
  userProfileCacheKey,
  CACHE_TTL,
  GEO_PRECISION,
  CACHE_PREFIX,
  isRedisAvailable,
  getCacheMetrics,
} from '~/lib/cache';
import {
  findCampaignsWithinRadius,
  getCityGeographicStats,
  type GeographicPoint,
} from '~/lib/spatial';
import { CampaignStatus } from '~/generated/prisma';

// -----------------------------------------------------------------------------
// Constants and Configuration
// -----------------------------------------------------------------------------

/**
 * Major California cities for geographic cache warming
 */
export const MAJOR_CA_CITIES = [
  { name: 'San Francisco', latitude: 37.7749, longitude: -122.4194 },
  { name: 'Los Angeles', latitude: 34.0522, longitude: -118.2437 },
  { name: 'San Diego', latitude: 32.7157, longitude: -117.1611 },
  { name: 'Sacramento', latitude: 38.5816, longitude: -121.4944 },
  { name: 'Oakland', latitude: 37.8044, longitude: -122.2711 },
  { name: 'San Jose', latitude: 37.3382, longitude: -121.8863 },
  { name: 'Berkeley', latitude: 37.8715, longitude: -122.273 },
  { name: 'Palo Alto', latitude: 37.4419, longitude: -122.143 },
  { name: 'Santa Monica', latitude: 34.0195, longitude: -118.4912 },
  { name: 'Fresno', latitude: 36.7378, longitude: -119.7871 },
] as const;

/**
 * Popular search terms for warming search caches
 */
export const POPULAR_SEARCH_TERMS = [
  'park',
  'community garden',
  'bike lane',
  'playground',
  'recycling',
  'traffic',
  'safety',
  'housing',
  'cleanup',
  'education',
] as const;

/**
 * Campaign statuses to include in warming
 */
export const WARMING_CAMPAIGN_STATUSES = [
  CampaignStatus.ACTIVE,
  CampaignStatus.DRAFT,
] as const;

/**
 * Radius options in kilometers for geographic warming
 */
export const GEO_WARMING_RADII = [1, 5, 10, 25] as const;

/**
 * Warming intervals in milliseconds
 */
export const WARMING_INTERVALS = {
  GEOGRAPHIC: 15 * 60 * 1000, // 15 minutes
  SEARCH: 30 * 60 * 1000, // 30 minutes
  CAMPAIGNS: 10 * 60 * 1000, // 10 minutes
  USERS: 60 * 60 * 1000, // 60 minutes
  CITY_STATS: 2 * 60 * 60 * 1000, // 2 hours
} as const;

/**
 * Retry configuration
 */
export const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  INITIAL_DELAY: 1000, // 1 second
  BACKOFF_FACTOR: 2, // Exponential backoff
} as const;

/**
 * Cache warming metrics
 */
export interface CacheWarmingMetrics {
  /** Total warming operations attempted */
  totalOperations: number;
  /** Successful warming operations */
  successCount: number;
  /** Failed warming operations */
  failureCount: number;
  /** Success rate percentage */
  successRate: number;
  /** Average latency in milliseconds */
  avgLatencyMs: number;
  /** Last warming run timestamp */
  lastRun: Date | null;
  /** Next scheduled warming timestamp */
  nextScheduledRun: Date | null;
  /** Warming operations by type */
  byType: {
    geographic: number;
    search: number;
    campaigns: number;
    users: number;
    cityStats: number;
  };
  /** Coverage metrics */
  coverage: {
    citiesCovered: number;
    totalCities: number;
    searchTermsCovered: number;
    totalSearchTerms: number;
    campaignsCovered: number;
  };
}

/**
 * Cache warming result
 */
export interface WarmingResult {
  /** Success status */
  success: boolean;
  /** Type of warming operation */
  type: keyof CacheWarmingMetrics['byType'];
  /** Number of items warmed */
  itemsWarmed: number;
  /** Time taken in milliseconds */
  latencyMs: number;
  /** Error if failed */
  error?: Error;
}

// Initialize metrics
let warmingMetrics: CacheWarmingMetrics = {
  totalOperations: 0,
  successCount: 0,
  failureCount: 0,
  successRate: 0,
  avgLatencyMs: 0,
  lastRun: null,
  nextScheduledRun: null,
  byType: {
    geographic: 0,
    search: 0,
    campaigns: 0,
    users: 0,
    cityStats: 0,
  },
  coverage: {
    citiesCovered: 0,
    totalCities: MAJOR_CA_CITIES.length,
    searchTermsCovered: 0,
    totalSearchTerms: POPULAR_SEARCH_TERMS.length,
    campaignsCovered: 0,
  },
};

// Interval IDs for scheduled warming
const warmingIntervals: Record<string, NodeJS.Timeout | null> = {
  geographic: null,
  search: null,
  campaigns: null,
  users: null,
  cityStats: null,
};

// -----------------------------------------------------------------------------
// Metrics Management
// -----------------------------------------------------------------------------

/**
 * Get current cache warming metrics
 */
export function getCacheWarmingMetrics(): CacheWarmingMetrics {
  return { ...warmingMetrics };
}

/**
 * Reset cache warming metrics
 */
export function resetCacheWarmingMetrics(): CacheWarmingMetrics {
  const oldMetrics = { ...warmingMetrics };

  warmingMetrics = {
    totalOperations: 0,
    successCount: 0,
    failureCount: 0,
    successRate: 0,
    avgLatencyMs: 0,
    lastRun: null,
    nextScheduledRun: null,
    byType: {
      geographic: 0,
      search: 0,
      campaigns: 0,
      users: 0,
      cityStats: 0,
    },
    coverage: {
      citiesCovered: 0,
      totalCities: MAJOR_CA_CITIES.length,
      searchTermsCovered: 0,
      totalSearchTerms: POPULAR_SEARCH_TERMS.length,
      campaignsCovered: 0,
    },
  };

  return oldMetrics;
}

/**
 * Update warming metrics with operation result
 */
function updateWarmingMetrics(result: WarmingResult): void {
  warmingMetrics.totalOperations += 1;

  if (result.success) {
    warmingMetrics.successCount += 1;
  } else {
    warmingMetrics.failureCount += 1;
  }

  // Update success rate
  warmingMetrics.successRate =
    warmingMetrics.successCount / warmingMetrics.totalOperations;

  // Update average latency using rolling average
  warmingMetrics.avgLatencyMs =
    (warmingMetrics.avgLatencyMs * (warmingMetrics.totalOperations - 1) +
      result.latencyMs) /
    warmingMetrics.totalOperations;

  // Update last run timestamp
  warmingMetrics.lastRun = new Date();

  // Update type-specific count
  warmingMetrics.byType[result.type] += 1;
}

// -----------------------------------------------------------------------------
// Retry Logic
// -----------------------------------------------------------------------------

/**
 * Retry a function with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = RETRY_CONFIG.MAX_ATTEMPTS,
  initialDelay = RETRY_CONFIG.INITIAL_DELAY,
  backoffFactor = RETRY_CONFIG.BACKOFF_FACTOR
): Promise<T> {
  let attempt = 0;
  let delay = initialDelay;

  while (attempt < maxAttempts) {
    try {
      return await fn();
    } catch (error) {
      attempt += 1;

      if (attempt >= maxAttempts) {
        throw error;
      }

      // Wait with exponential backoff before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= backoffFactor;
    }
  }

  throw new Error('Max retry attempts reached');
}

// -----------------------------------------------------------------------------
// Core Warming Functions
// -----------------------------------------------------------------------------

/**
 * Warm geographic caches for a specific city
 */
export async function warmGeographicCacheForCity(
  city: (typeof MAJOR_CA_CITIES)[number]
): Promise<WarmingResult> {
  const startTime = performance.now();
  let itemsWarmed = 0;

  try {
    // Check if Redis is available
    if (!(await isRedisAvailable())) {
      return {
        success: false,
        type: 'geographic',
        itemsWarmed: 0,
        latencyMs: performance.now() - startTime,
        error: new Error('Redis is not available'),
      };
    }

    // Warm caches for different radius options
    await Promise.all(
      GEO_WARMING_RADII.map(async (radiusKm) => {
        const point: GeographicPoint = {
          latitude: city.latitude,
          longitude: city.longitude,
        };

        // Generate cache key
        const cacheKey = geoQueryCacheKey(
          city.latitude,
          city.longitude,
          radiusKm,
          GEO_PRECISION.CITY
        );

        // Check if already cached
        const existing = await getCache(cacheKey);
        if (existing.hit) {
          // Already cached, skip
          return;
        }

        // Fetch campaigns within radius
        const radiusMeters = radiusKm * 1000;
        const campaigns = await findCampaignsWithinRadius({
          point,
          radiusMeters,
          limit: 50,
          offset: 0,
        });

        // Format results
        const formattedCampaigns = campaigns.map((campaign) => ({
          id: campaign.id,
          title: campaign.title,
          description: campaign.description,
          status: campaign.status,
          latitude: campaign.latitude,
          longitude: campaign.longitude,
          address: campaign.address,
          city: campaign.city,
          state: campaign.state,
          createdAt: campaign.createdAt,
          distanceMeters: campaign.distanceMeters,
          // TODO: Add creator and vote count from joins when auth is ready
          creator: { firstName: 'User', lastName: 'Name' },
          _count: { votes: 0, comments: 0 },
        }));

        // Cache results
        await setCache(
          cacheKey,
          {
            campaigns: formattedCampaigns,
            hasMore: false,
            nextCursor: null,
            searchType: 'spatial' as const,
            centerPoint: point,
            radiusMeters,
          },
          CACHE_TTL.GEO_QUERY
        );

        itemsWarmed += 1;
      })
    );

    // Update coverage metrics
    warmingMetrics.coverage.citiesCovered += 1;

    return {
      success: true,
      type: 'geographic',
      itemsWarmed,
      latencyMs: performance.now() - startTime,
    };
  } catch (error) {
    console.error(`Error warming geographic cache for ${city.name}:`, error);
    return {
      success: false,
      type: 'geographic',
      itemsWarmed,
      latencyMs: performance.now() - startTime,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Warm all geographic caches for major cities
 */
export async function warmAllGeographicCaches(): Promise<WarmingResult> {
  const startTime = performance.now();
  let itemsWarmed = 0;
  const errors: Error[] = [];

  try {
    // Reset city coverage count
    warmingMetrics.coverage.citiesCovered = 0;

    // Warm caches for each major city
    const results = await Promise.allSettled(
      MAJOR_CA_CITIES.map((city) =>
        withRetry(() => warmGeographicCacheForCity(city))
      )
    );

    // Count successful operations
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        itemsWarmed += result.value.itemsWarmed;
      } else {
        errors.push(result.reason);
      }
    });

    const success = errors.length === 0;

    const result: WarmingResult = {
      success,
      type: 'geographic',
      itemsWarmed,
      latencyMs: performance.now() - startTime,
    };

    if (!success) {
      result.error = new AggregateError(
        errors,
        'Some geographic cache warming operations failed'
      );
    }

    // Update metrics
    updateWarmingMetrics(result);

    return result;
  } catch (error) {
    console.error('Error warming all geographic caches:', error);

    const result: WarmingResult = {
      success: false,
      type: 'geographic',
      itemsWarmed,
      latencyMs: performance.now() - startTime,
      error: error instanceof Error ? error : new Error(String(error)),
    };

    // Update metrics
    updateWarmingMetrics(result);

    return result;
  }
}

/**
 * Warm search cache for a specific term
 */
export async function warmSearchCacheForTerm(
  term: string,
  filters: Record<string, string | number | boolean> = {}
): Promise<WarmingResult> {
  const startTime = performance.now();
  let itemsWarmed = 0;

  try {
    // Check if Redis is available
    if (!(await isRedisAvailable())) {
      return {
        success: false,
        type: 'search',
        itemsWarmed: 0,
        latencyMs: performance.now() - startTime,
        error: new Error('Redis is not available'),
      };
    }

    // Generate cache key
    const cacheKey = searchQueryCacheKey(term, filters);

    // Check if already cached
    const existing = await getCache(cacheKey);
    if (existing.hit) {
      // Already cached, skip
      return {
        success: true,
        type: 'search',
        itemsWarmed: 0, // Nothing new warmed
        latencyMs: performance.now() - startTime,
      };
    }

    // Build where clause
    const whereClause: Record<string, unknown> = {};

    // Text search
    if (term) {
      whereClause.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
      ];
    }

    // Apply filters
    if (filters.city) {
      whereClause.city = { equals: String(filters.city), mode: 'insensitive' };
    }

    if (filters.status) {
      whereClause.status = filters.status;
    } else {
      whereClause.status = 'ACTIVE';
    }

    // Execute search query
    const limit = Number(filters.limit) || 20;
    const campaigns = await db.campaign.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        latitude: true,
        longitude: true,
        address: true,
        city: true,
        state: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    });

    // Format results
    const hasMore = campaigns.length > limit;
    const results = hasMore ? campaigns.slice(0, -1) : campaigns;
    const nextCursor = hasMore ? results[results.length - 1]?.id : null;

    const formattedCampaigns = results.map((campaign) => ({
      ...campaign,
      status: campaign.status,
      creator: { firstName: 'User', lastName: 'Name' },
      _count: { votes: 0, comments: 0 },
    }));

    // Cache results
    await setCache(
      cacheKey,
      {
        campaigns: formattedCampaigns,
        hasMore,
        nextCursor,
        searchType: 'database' as const,
      },
      CACHE_TTL.SEARCH_RESULTS
    );

    itemsWarmed += 1;

    return {
      success: true,
      type: 'search',
      itemsWarmed,
      latencyMs: performance.now() - startTime,
    };
  } catch (error) {
    console.error(`Error warming search cache for term "${term}":`, error);
    return {
      success: false,
      type: 'search',
      itemsWarmed,
      latencyMs: performance.now() - startTime,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Warm all search caches for popular terms
 */
export async function warmAllSearchCaches(): Promise<WarmingResult> {
  const startTime = performance.now();
  let itemsWarmed = 0;
  const errors: Error[] = [];

  try {
    // Reset search term coverage count
    warmingMetrics.coverage.searchTermsCovered = 0;

    // Warm caches for each popular search term
    const results = await Promise.allSettled(
      POPULAR_SEARCH_TERMS.map((term) =>
        withRetry(() => warmSearchCacheForTerm(term))
      )
    );

    // Count successful operations
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        itemsWarmed += result.value.itemsWarmed;
        if (result.value.itemsWarmed > 0) {
          warmingMetrics.coverage.searchTermsCovered += 1;
        }
      } else {
        errors.push(result.reason);
      }
    });

    // Warm caches for popular terms with city filters
    for (const city of MAJOR_CA_CITIES) {
      for (const term of POPULAR_SEARCH_TERMS) {
        try {
          const result = await warmSearchCacheForTerm(term, {
            city: city.name,
          });
          if (result.success) {
            itemsWarmed += result.itemsWarmed;
          }
        } catch (error) {
          errors.push(
            error instanceof Error ? error : new Error(String(error))
          );
        }
      }
    }

    const success = errors.length === 0;

    const result: WarmingResult = {
      success,
      type: 'search',
      itemsWarmed,
      latencyMs: performance.now() - startTime,
    };

    if (!success) {
      result.error = new AggregateError(
        errors,
        'Some search cache warming operations failed'
      );
    }

    // Update metrics
    updateWarmingMetrics(result);

    return result;
  } catch (error) {
    console.error('Error warming all search caches:', error);

    const result: WarmingResult = {
      success: false,
      type: 'search',
      itemsWarmed,
      latencyMs: performance.now() - startTime,
      error: error instanceof Error ? error : new Error(String(error)),
    };

    // Update metrics
    updateWarmingMetrics(result);

    return result;
  }
}

/**
 * Warm cache for popular campaigns
 */
export async function warmPopularCampaigns(): Promise<WarmingResult> {
  const startTime = performance.now();
  let itemsWarmed = 0;

  try {
    // Check if Redis is available
    if (!(await isRedisAvailable())) {
      return {
        success: false,
        type: 'campaigns',
        itemsWarmed: 0,
        latencyMs: performance.now() - startTime,
        error: new Error('Redis is not available'),
      };
    }

    // Find popular campaigns (most votes or comments)
    const popularCampaigns = await db.campaign.findMany({
      where: {
        status: 'ACTIVE',
      },
      select: {
        id: true,
        _count: {
          select: {
            votes: true,
            comments: true,
          },
        },
      },
      orderBy: [
        { votes: { _count: 'desc' } },
        { comments: { _count: 'desc' } },
      ],
      take: 50,
    });

    // Warm cache for each popular campaign
    await Promise.all(
      popularCampaigns.map(async ({ id }) => {
        const cacheKey = campaignCacheKey(id);

        // Check if already cached
        const existing = await getCache(cacheKey);
        if (existing.hit) {
          // Already cached, skip
          return;
        }

        // Fetch campaign details
        const campaign = await db.campaign.findUnique({
          where: { id },
        });

        if (campaign) {
          // Cache campaign details
          await setCache(cacheKey, campaign, CACHE_TTL.CAMPAIGN_DETAIL);
          itemsWarmed += 1;
        }
      })
    );

    // Update campaign coverage metrics
    warmingMetrics.coverage.campaignsCovered = itemsWarmed;

    return {
      success: true,
      type: 'campaigns',
      itemsWarmed,
      latencyMs: performance.now() - startTime,
    };
  } catch (error) {
    console.error('Error warming popular campaigns cache:', error);
    return {
      success: false,
      type: 'campaigns',
      itemsWarmed,
      latencyMs: performance.now() - startTime,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Warm cache for active user profiles
 */
export async function warmActiveUserProfiles(): Promise<WarmingResult> {
  const startTime = performance.now();
  let itemsWarmed = 0;

  try {
    // Check if Redis is available
    if (!(await isRedisAvailable())) {
      return {
        success: false,
        type: 'users',
        itemsWarmed: 0,
        latencyMs: performance.now() - startTime,
        error: new Error('Redis is not available'),
      };
    }

    // Find active users (created campaigns or comments recently)
    const activeUsers = await db.user.findMany({
      where: {
        OR: [
          {
            campaigns: {
              some: {
                createdAt: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
                },
              },
            },
          },
          {
            comments: {
              some: {
                createdAt: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
      },
      take: 100,
    });

    // Warm cache for each active user
    await Promise.all(
      activeUsers.map(async ({ id }) => {
        const cacheKey = userProfileCacheKey(id);

        // Check if already cached
        const existing = await getCache(cacheKey);
        if (existing.hit) {
          // Already cached, skip
          return;
        }

        // Fetch user details
        const user = await db.user.findUnique({
          where: { id },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            imageUrl: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        if (user) {
          // Cache user details
          await setCache(cacheKey, user, CACHE_TTL.USER_PROFILE);
          itemsWarmed += 1;
        }
      })
    );

    return {
      success: true,
      type: 'users',
      itemsWarmed,
      latencyMs: performance.now() - startTime,
    };
  } catch (error) {
    console.error('Error warming active user profiles cache:', error);
    return {
      success: false,
      type: 'users',
      itemsWarmed,
      latencyMs: performance.now() - startTime,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Warm cache for city statistics
 */
export async function warmCityStatistics(): Promise<WarmingResult> {
  const startTime = performance.now();
  let itemsWarmed = 0;

  try {
    // Check if Redis is available
    if (!(await isRedisAvailable())) {
      return {
        success: false,
        type: 'cityStats',
        itemsWarmed: 0,
        latencyMs: performance.now() - startTime,
        error: new Error('Redis is not available'),
      };
    }

    // Warm stats for each major city
    await Promise.all(
      MAJOR_CA_CITIES.map(async (city) => {
        const cacheKey = `${CACHE_PREFIX.GEO}:city:${city.name.toLowerCase()}:stats`;

        // Check if already cached
        const existing = await getCache(cacheKey);
        if (existing.hit) {
          // Already cached, skip
          return;
        }

        try {
          // Fetch city stats
          const stats = await getCityGeographicStats(city.name);

          // Cache city stats
          await setCache(
            cacheKey,
            {
              city: city.name,
              campaignCount: stats.campaign_count,
              centerPoint: {
                latitude: stats.center_lat,
                longitude: stats.center_lng,
              },
              coverageRadiusMeters: stats.coverage_radius_meters,
              coverageRadiusKm: stats.coverage_radius_meters / 1000,
            },
            CACHE_TTL.GEO_QUERY
          );

          itemsWarmed += 1;
        } catch (error) {
          console.error(`Error warming stats for city ${city.name}:`, error);
        }
      })
    );

    return {
      success: true,
      type: 'cityStats',
      itemsWarmed,
      latencyMs: performance.now() - startTime,
    };
  } catch (error) {
    console.error('Error warming city statistics cache:', error);
    return {
      success: false,
      type: 'cityStats',
      itemsWarmed,
      latencyMs: performance.now() - startTime,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Warm all caches (comprehensive warming)
 */
export async function warmAllCaches(): Promise<WarmingResult[]> {
  console.warn('Starting comprehensive cache warming...');

  const results: WarmingResult[] = [];

  try {
    // Warm geographic caches
    results.push(await warmAllGeographicCaches());

    // Warm search caches
    results.push(await warmAllSearchCaches());

    // Warm popular campaigns
    results.push(await warmPopularCampaigns());

    // Warm active user profiles
    results.push(await warmActiveUserProfiles());

    // Warm city statistics
    results.push(await warmCityStatistics());

    console.warn('Comprehensive cache warming completed successfully');
  } catch (error) {
    console.error('Error during comprehensive cache warming:', error);
  }

  return results;
}

// -----------------------------------------------------------------------------
// Scheduling and Orchestration
// -----------------------------------------------------------------------------

/**
 * Start scheduled cache warming
 */
export function startScheduledCacheWarming(): void {
  // Stop any existing warming intervals
  stopScheduledCacheWarming();

  // Schedule geographic cache warming
  warmingIntervals.geographic = setInterval(() => {
    void warmAllGeographicCaches();
    warmingMetrics.nextScheduledRun = new Date(
      Date.now() + WARMING_INTERVALS.GEOGRAPHIC
    );
  }, WARMING_INTERVALS.GEOGRAPHIC);

  // Schedule search cache warming
  warmingIntervals.search = setInterval(() => {
    void warmAllSearchCaches();
    warmingMetrics.nextScheduledRun = new Date(
      Date.now() + WARMING_INTERVALS.SEARCH
    );
  }, WARMING_INTERVALS.SEARCH);

  // Schedule campaign cache warming
  warmingIntervals.campaigns = setInterval(() => {
    void warmPopularCampaigns();
    warmingMetrics.nextScheduledRun = new Date(
      Date.now() + WARMING_INTERVALS.CAMPAIGNS
    );
  }, WARMING_INTERVALS.CAMPAIGNS);

  // Schedule user profile cache warming
  warmingIntervals.users = setInterval(() => {
    void warmActiveUserProfiles();
    warmingMetrics.nextScheduledRun = new Date(
      Date.now() + WARMING_INTERVALS.USERS
    );
  }, WARMING_INTERVALS.USERS);

  // Schedule city statistics cache warming
  warmingIntervals.cityStats = setInterval(() => {
    void warmCityStatistics();
    warmingMetrics.nextScheduledRun = new Date(
      Date.now() + WARMING_INTERVALS.CITY_STATS
    );
  }, WARMING_INTERVALS.CITY_STATS);

  // Set initial next scheduled run
  warmingMetrics.nextScheduledRun = new Date(
    Date.now() +
      Math.min(
        WARMING_INTERVALS.GEOGRAPHIC,
        WARMING_INTERVALS.SEARCH,
        WARMING_INTERVALS.CAMPAIGNS,
        WARMING_INTERVALS.USERS,
        WARMING_INTERVALS.CITY_STATS
      )
  );

  console.warn('Scheduled cache warming started');
}

/**
 * Stop scheduled cache warming
 */
export function stopScheduledCacheWarming(): void {
  // Clear all intervals
  Object.entries(warmingIntervals).forEach(([key, interval]) => {
    if (interval) {
      clearInterval(interval);
      warmingIntervals[key] = null;
    }
  });

  warmingMetrics.nextScheduledRun = null;
  console.warn('Scheduled cache warming stopped');
}

/**
 * Run intelligent cache warming based on usage patterns
 * This uses cache metrics to determine what to warm
 */
export async function runIntelligentCacheWarming(): Promise<WarmingResult[]> {
  const results: WarmingResult[] = [];
  const cacheMetrics = getCacheMetrics();

  // If hit rate is low, warm everything
  if (cacheMetrics.hitRate < 0.5) {
    return warmAllCaches();
  }

  // Otherwise, be selective based on metrics
  try {
    // Always warm geographic caches (most performance critical)
    results.push(await warmAllGeographicCaches());

    // If search requests are frequent, warm search caches
    if (cacheMetrics.requests > 100) {
      results.push(await warmAllSearchCaches());
    }

    // If many cache misses, warm popular campaigns
    if (cacheMetrics.misses > 50) {
      results.push(await warmPopularCampaigns());
    }

    // Only warm user profiles if hit rate for them is low
    // (This would require more detailed metrics per cache type)

    // Always warm city statistics (low volume, high value)
    results.push(await warmCityStatistics());
  } catch (error) {
    console.error('Error during intelligent cache warming:', error);
  }

  return results;
}

// -----------------------------------------------------------------------------
// Health Checks and Monitoring
// -----------------------------------------------------------------------------

/**
 * Check cache warming health
 */
export async function checkCacheWarmingHealth(): Promise<{
  healthy: boolean;
  status: string;
  metrics: CacheWarmingMetrics;
  cacheMetrics: ReturnType<typeof getCacheMetrics>;
  redisAvailable: boolean;
}> {
  const redisAvailable = await isRedisAvailable();
  const metrics = getCacheWarmingMetrics();
  const cacheMetrics = getCacheMetrics();

  // Determine health based on metrics
  const healthy =
    redisAvailable &&
    (metrics.successRate > 0.9 || // Either high success rate
      metrics.totalOperations === 0); // Or no operations attempted yet

  const status = healthy ? 'healthy' : 'unhealthy';

  return {
    healthy,
    status,
    metrics,
    cacheMetrics,
    redisAvailable,
  };
}

/**
 * Initialize cache warming system
 * This should be called during application startup
 */
export async function initCacheWarming(
  options: {
    runInitialWarming?: boolean;
    startScheduledWarming?: boolean;
  } = {}
): Promise<void> {
  const { runInitialWarming = true, startScheduledWarming = true } = options;

  try {
    // Check if Redis is available
    const redisAvailable = await isRedisAvailable();
    if (!redisAvailable) {
      console.warn('Redis is not available. Cache warming will be disabled.');
      return;
    }

    // Reset metrics
    resetCacheWarmingMetrics();

    // Run initial warming if requested
    if (runInitialWarming) {
      console.warn('Running initial cache warming...');
      await warmAllCaches();
    }

    // Start scheduled warming if requested
    if (startScheduledWarming) {
      startScheduledCacheWarming();
    }

    console.warn('Cache warming system initialized successfully');
  } catch (error) {
    console.error('Error initializing cache warming system:', error);
  }
}

// Export default initialization function for easy importing
export default initCacheWarming;
