import { env } from '~/env';
import { cacheGet, cacheSet, CacheKeys, CacheTTL } from './redis';

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  /**
   * Optional radius (in kilometres) selected by the user when
   * picking a location.  Used for radius-based campaign searches.
   */
  radiusKm?: number;
  country?: string;
}

export interface ReverseGeocodeResult {
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

// Mapbox Geocoding API
export async function geocodeWithMapbox(
  query: string
): Promise<GeocodeResult | null> {
  // Skip Mapbox if no token is provided
  if (
    !env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ||
    env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN === 'your_mapbox_token_here'
  ) {
    return null;
  }

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        query
      )}.json?access_token=${env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}&limit=1`
    );

    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      return null;
    }

    const feature = data.features[0];
    const [longitude, latitude] = feature.center;

    // Extract address components
    const address = feature.place_name;
    let city, state, zipCode, country;

    feature.context?.forEach((ctx: { id: string; text: string }) => {
      if (ctx.id.includes('place')) city = ctx.text;
      if (ctx.id.includes('region')) state = ctx.text;
      if (ctx.id.includes('postcode')) zipCode = ctx.text;
      if (ctx.id.includes('country')) country = ctx.text;
    });

    return {
      latitude,
      longitude,
      address,
      city,
      state,
      zipCode,
      country,
    };
  } catch (error) {
    console.error('[Geocoding] Mapbox geocoding error:', error);
    return null;
  }
}

// OpenStreetMap Nominatim as fallback (free tier)
export async function geocodeWithNominatim(
  query: string
): Promise<GeocodeResult | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&limit=1&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'Civilyst App (civic engagement platform)',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return null;
    }

    const result = data[0];
    const latitude = parseFloat(result.lat);
    const longitude = parseFloat(result.lon);

    const address = result.display_name;
    const city = result.address?.city || result.address?.town;
    const state = result.address?.state;
    const zipCode = result.address?.postcode;
    const country = result.address?.country;

    return {
      latitude,
      longitude,
      address,
      city,
      state,
      zipCode,
      country,
    };
  } catch (error) {
    console.error('[Geocoding] Nominatim geocoding error:', error);
    return null;
  }
}

// Main geocoding function with caching and fallback
export async function geocodeAddress(
  query: string
): Promise<GeocodeResult | null> {
  const cacheKey = CacheKeys.geocode(query);

  // Try cache first
  const cached = await cacheGet<GeocodeResult>(cacheKey);
  if (cached) {
    // Log cache hit in development only
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Geocoding] Cache hit for:', query);
    }
    return cached;
  }

  // Try Mapbox first (50K requests/month free)
  let result = await geocodeWithMapbox(query);

  // Fallback to OpenStreetMap Nominatim if Mapbox fails
  if (!result) {
    // Log fallback in development only
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Geocoding] Mapbox failed, trying Nominatim fallback');
    }
    result = await geocodeWithNominatim(query);
  }

  // Cache the result if successful
  if (result) {
    await cacheSet(cacheKey, result, CacheTTL.GEOCODE);
    // Log caching in development only
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Geocoding] Result cached for:', query);
    }
  }

  return result;
}

// Reverse geocoding with caching
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult | null> {
  const cacheKey = CacheKeys.reverseGeocode(latitude, longitude);

  // Try cache first
  const cached = await cacheGet<ReverseGeocodeResult>(cacheKey);
  if (cached) {
    // Log cache hit in development only
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Geocoding] Reverse geocoding cache hit');
    }
    return cached;
  }

  // Skip Mapbox if no token is provided
  if (
    !env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ||
    env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN === 'your_mapbox_token_here'
  ) {
    return null;
  }

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}&limit=1`
    );

    if (!response.ok) {
      throw new Error(`Mapbox reverse geocoding error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      return null;
    }

    const feature = data.features[0];
    const address = feature.place_name;

    let city, state, zipCode, country;
    feature.context?.forEach((ctx: { id: string; text: string }) => {
      if (ctx.id.includes('place')) city = ctx.text;
      if (ctx.id.includes('region')) state = ctx.text;
      if (ctx.id.includes('postcode')) zipCode = ctx.text;
      if (ctx.id.includes('country')) country = ctx.text;
    });

    const result = {
      address,
      city,
      state,
      zipCode,
      country,
    };

    // Cache the result
    await cacheSet(cacheKey, result, CacheTTL.REVERSE_GEOCODE);
    // Log caching in development only
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Geocoding] Reverse geocoding result cached');
    }

    return result;
  } catch (error) {
    console.error('[Geocoding] Reverse geocoding error:', error);
    return null;
  }
}
