import { Redis } from '@upstash/redis';
import { env } from '~/env';

// Initialize Redis client
let redis: Redis | null = null;

export function getRedisClient(): Redis | null {
  // Helper to determine if value looks like a placeholder
  const isPlaceholder = (val?: string) =>
    !val ||
    val.trim() === '' ||
    val.startsWith('your_') || // e.g. 'your_upstash_redis_url_here'
    val.includes('your_upstash');

  const { UPSTASH_REDIS_REST_URL: url, UPSTASH_REDIS_REST_TOKEN: token } = env;

  // Fail fast if credentials are missing or obviously placeholders
  if (isPlaceholder(url) || isPlaceholder(token) || !url || !token) {
    console.warn(
      'Upstash Redis credentials are not configured (using placeholders or empty). Caching disabled.'
    );
    return null;
  }

  // Upstash requires an https URL – guard against common mistakes
  if (!url.startsWith('https://')) {
    console.warn(
      `Upstash Redis URL must start with "https://". Received: "${url}". Caching disabled.`
    );
    return null;
  }

  if (!redis) {
    try {
      redis = new Redis({ url, token });
    } catch (err) {
      console.error('Failed to initialise Upstash Redis client:', err);
      return null;
    }
  }

  return redis;
}

// Cache keys for different data types
export const CacheKeys = {
  geocode: (query: string) => `geocode:${query.toLowerCase().trim()}`,
  reverseGeocode: (lat: number, lng: number) =>
    `reverse:${lat.toFixed(6)},${lng.toFixed(6)}`,
  locationSearch: (lat: number, lng: number, radius: number) =>
    `location_search:${lat.toFixed(4)},${lng.toFixed(4)},${radius}`,
  userLocation: (userId: string) => `user_location:${userId}`,
  popularAreas: () => 'popular_areas',
} as const;

// Cache TTL constants (in seconds)
export const CacheTTL = {
  GEOCODE: 24 * 60 * 60, // 24 hours
  REVERSE_GEOCODE: 24 * 60 * 60, // 24 hours
  LOCATION_SEARCH: 5 * 60, // 5 minutes
  USER_LOCATION: 60, // 1 minute
  POPULAR_AREAS: 10 * 60, // 10 minutes
  STATIC_CONTENT: 60 * 60, // 1 hour
} as const;

// Generic cache utilities
export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client) return null;

  try {
    const result = await client.get(key);
    return result as T;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

export async function cacheSet<T>(
  key: string,
  value: T,
  ttl: number
): Promise<void> {
  const client = getRedisClient();
  if (!client) return;

  try {
    await client.set(key, value, { ex: ttl });
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

export async function cacheDelete(key: string): Promise<void> {
  const client = getRedisClient();
  if (!client) return;

  try {
    await client.del(key);
  } catch (error) {
    console.error('Cache delete error:', error);
  }
}

export async function cacheExists(key: string): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    const result = await client.exists(key);
    return result === 1;
  } catch (error) {
    console.error('Cache exists error:', error);
    return false;
  }
}
