import { calculateDistance } from './ipGeolocation';

interface CommunityBoundary {
  id: string;
  name: string;
  centerLat: number;
  centerLng: number;
  radiusMiles: number;
  type: 'city' | 'neighborhood' | 'region';
}

// Sample community boundaries (in production, these would come from database)
export const COMMUNITY_BOUNDARIES: CommunityBoundary[] = [
  {
    id: 'sf-bay-area',
    name: 'San Francisco Bay Area',
    centerLat: 37.7749,
    centerLng: -122.4194,
    radiusMiles: 50,
    type: 'region',
  },
  {
    id: 'downtown-sf',
    name: 'Downtown San Francisco',
    centerLat: 37.7875,
    centerLng: -122.4085,
    radiusMiles: 2,
    type: 'neighborhood',
  },
  {
    id: 'oakland',
    name: 'Oakland',
    centerLat: 37.8044,
    centerLng: -122.2712,
    radiusMiles: 10,
    type: 'city',
  },
  {
    id: 'san-jose',
    name: 'San Jose',
    centerLat: 37.3382,
    centerLng: -121.8863,
    radiusMiles: 15,
    type: 'city',
  },
];

/**
 * Check if a location is within any community boundary
 * Prioritizes smaller boundaries over larger ones
 */
export function isWithinCommunityBoundary(
  lat: number,
  lng: number
): { isWithin: boolean; community?: CommunityBoundary; distance?: number } {
  let bestMatch: { community: CommunityBoundary; distance: number } | null = null;

  for (const boundary of COMMUNITY_BOUNDARIES) {
    const distance = calculateDistance(
      lat,
      lng,
      boundary.centerLat,
      boundary.centerLng
    );

    if (distance <= boundary.radiusMiles) {
      // If this is the first match or a smaller boundary, use it
      if (!bestMatch || boundary.radiusMiles < bestMatch.community.radiusMiles) {
        bestMatch = {
          community: boundary,
          distance,
        };
      }
    }
  }

  if (bestMatch) {
    return {
      isWithin: true,
      community: bestMatch.community,
      distance: bestMatch.distance,
    };
  }

  return { isWithin: false };
}

/**
 * Get the closest community to a location
 */
export function getClosestCommunity(
  lat: number,
  lng: number
): { community: CommunityBoundary; distance: number } | null {
  let closest: { community: CommunityBoundary; distance: number } | null = null;

  for (const boundary of COMMUNITY_BOUNDARIES) {
    const distance = calculateDistance(
      lat,
      lng,
      boundary.centerLat,
      boundary.centerLng
    );

    if (!closest || distance < closest.distance) {
      closest = { community: boundary, distance };
    }
  }

  return closest;
}

/**
 * Calculate trust bonus based on location verification
 * - Within community boundary: +0.3
 * - Near community (within 2x radius): +0.2
 * - Outside community: +0.1
 */
export function calculateLocationTrustBonus(
  lat: number,
  lng: number
): { bonus: number; reason: string } {
  const boundaryCheck = isWithinCommunityBoundary(lat, lng);

  if (boundaryCheck.isWithin) {
    return {
      bonus: 0.3,
      reason: `Within ${boundaryCheck.community!.name} community`,
    };
  }

  // Check if near any community (within 2x radius)
  const closest = getClosestCommunity(lat, lng);
  if (closest && closest.distance <= closest.community.radiusMiles * 2) {
    return {
      bonus: 0.2,
      reason: `Near ${closest.community.name} (${Math.round(closest.distance)} miles)`,
    };
  }

  return {
    bonus: 0.1,
    reason: 'Location verified',
  };
}
