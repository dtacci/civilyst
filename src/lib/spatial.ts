import { db } from './db';
import { CampaignStatus } from '~/generated/prisma';

// PostGIS spatial query utilities for Civilyst
// Provides geographic search and spatial analysis capabilities

export interface GeographicPoint {
  latitude: number;
  longitude: number;
}

export interface SpatialSearchOptions {
  point: GeographicPoint;
  radiusMeters: number;
  limit?: number;
  offset?: number;
}

export interface CampaignWithDistance {
  id: string;
  title: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  city: string | null;
  state: string | null;
  distanceMeters: number;
  createdAt: Date;
  status: CampaignStatus;
}

/**
 * Convert lat/lng coordinates to PostGIS POINT geometry
 * Uses SRID 4326 (WGS84) which is standard for GPS coordinates
 */
export function createPostGISPoint(lat: number, lng: number): string {
  return `ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`;
}

/**
 * Find campaigns within a radius using PostGIS ST_DWithin
 * This is the core geographic search function for campaign discovery
 */
export async function findCampaignsWithinRadius(
  options: SpatialSearchOptions
): Promise<CampaignWithDistance[]> {
  const { point, radiusMeters, limit = 50, offset = 0 } = options;

  try {
    // Raw SQL query using PostGIS spatial functions
    const campaigns = await db.$queryRaw<CampaignWithDistance[]>`
      SELECT 
        c.id,
        c.title,
        c.description,
        c.latitude,
        c.longitude,
        c.address,
        c.city,
        c.state,
        c.status,
        c."createdAt",
        ST_Distance(
          ST_SetSRID(ST_MakePoint(c.longitude, c.latitude), 4326)::geography,
          ST_SetSRID(ST_MakePoint(${point.longitude}, ${point.latitude}), 4326)::geography
        ) as "distanceMeters"
      FROM campaigns c
      WHERE 
        c.latitude IS NOT NULL 
        AND c.longitude IS NOT NULL
        AND c.status = 'ACTIVE'
        AND ST_DWithin(
          ST_SetSRID(ST_MakePoint(c.longitude, c.latitude), 4326)::geography,
          ST_SetSRID(ST_MakePoint(${point.longitude}, ${point.latitude}), 4326)::geography,
          ${radiusMeters}
        )
      ORDER BY 
        ST_SetSRID(ST_MakePoint(c.longitude, c.latitude), 4326)::geography 
        <-> 
        ST_SetSRID(ST_MakePoint(${point.longitude}, ${point.latitude}), 4326)::geography
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    return campaigns;
  } catch (error) {
    console.error('PostGIS radius search error:', error);
    throw new Error('Failed to search campaigns by location');
  }
}

/**
 * Find the nearest campaigns to a point, regardless of radius
 * Useful for "campaigns near me" functionality
 */
export async function findNearestCampaigns(
  point: GeographicPoint,
  limit = 10
): Promise<CampaignWithDistance[]> {
  try {
    const campaigns = await db.$queryRaw<CampaignWithDistance[]>`
      SELECT 
        c.id,
        c.title,
        c.description,
        c.latitude,
        c.longitude,
        c.address,
        c.city,
        c.state,
        c.status,
        c."createdAt",
        ST_Distance(
          ST_SetSRID(ST_MakePoint(c.longitude, c.latitude), 4326)::geography,
          ST_SetSRID(ST_MakePoint(${point.longitude}, ${point.latitude}), 4326)::geography
        ) as "distanceMeters"
      FROM campaigns c
      WHERE 
        c.latitude IS NOT NULL 
        AND c.longitude IS NOT NULL
        AND c.status = 'ACTIVE'
      ORDER BY 
        ST_SetSRID(ST_MakePoint(c.longitude, c.latitude), 4326)::geography 
        <-> 
        ST_SetSRID(ST_MakePoint(${point.longitude}, ${point.latitude}), 4326)::geography
      LIMIT ${limit}
    `;

    return campaigns;
  } catch (error) {
    console.error('PostGIS nearest campaigns error:', error);
    throw new Error('Failed to find nearest campaigns');
  }
}

/**
 * Calculate distance between two geographic points using PostGIS
 * Returns distance in meters
 */
export async function calculateDistance(
  point1: GeographicPoint,
  point2: GeographicPoint
): Promise<number> {
  try {
    const result = await db.$queryRaw<[{ distance: number }]>`
      SELECT ST_Distance(
        ST_SetSRID(ST_MakePoint(${point1.longitude}, ${point1.latitude}), 4326)::geography,
        ST_SetSRID(ST_MakePoint(${point2.longitude}, ${point2.latitude}), 4326)::geography
      ) as distance
    `;

    return result[0]?.distance ?? 0;
  } catch (error) {
    console.error('PostGIS distance calculation error:', error);
    return 0;
  }
}

/**
 * Get geographic statistics for campaigns in a city
 * Returns count, center point, and radius coverage
 */
export async function getCityGeographicStats(city: string) {
  try {
    const stats = await db.$queryRaw<
      [
        {
          campaign_count: number;
          center_lat: number;
          center_lng: number;
          coverage_radius_meters: number;
        },
      ]
    >`
      SELECT 
        COUNT(*) as campaign_count,
        ST_Y(ST_Centroid(ST_Collect(ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)))) as center_lat,
        ST_X(ST_Centroid(ST_Collect(ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)))) as center_lng,
        GREATEST(
          ST_Distance(
            ST_Centroid(ST_Collect(ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)))::geography,
            ST_SetSRID(ST_MakePoint(
              ST_X(ST_Envelope(ST_Collect(ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)))),
              ST_Y(ST_Envelope(ST_Collect(ST_SetSRID(ST_MakePoint(longitude, latitude), 4326))))
            ), 4326)::geography
          ), 1000
        ) as coverage_radius_meters
      FROM campaigns 
      WHERE 
        city ILIKE ${`%${city}%`}
        AND latitude IS NOT NULL 
        AND longitude IS NOT NULL
        AND status = 'ACTIVE'
    `;

    return (
      stats[0] || {
        campaign_count: 0,
        center_lat: 0,
        center_lng: 0,
        coverage_radius_meters: 0,
      }
    );
  } catch (error) {
    console.error('PostGIS city stats error:', error);
    throw new Error('Failed to calculate city geographic statistics');
  }
}

/**
 * Find campaigns that intersect with a bounding box
 * Useful for map viewport-based searches
 */
export interface BoundingBox {
  north: number; // max latitude
  south: number; // min latitude
  east: number; // max longitude
  west: number; // min longitude
}

export async function findCampaignsInBounds(
  bounds: BoundingBox,
  limit = 100
): Promise<CampaignWithDistance[]> {
  try {
    const campaigns = await db.$queryRaw<CampaignWithDistance[]>`
      SELECT 
        c.id,
        c.title,
        c.description,
        c.latitude,
        c.longitude,
        c.address,
        c.city,
        c.state,
        c.status,
        c."createdAt",
        0 as "distanceMeters"
      FROM campaigns c
      WHERE 
        c.latitude IS NOT NULL 
        AND c.longitude IS NOT NULL
        AND c.status = 'ACTIVE'
        AND c.latitude BETWEEN ${bounds.south} AND ${bounds.north}
        AND c.longitude BETWEEN ${bounds.west} AND ${bounds.east}
      ORDER BY c."createdAt" DESC
      LIMIT ${limit}
    `;

    return campaigns;
  } catch (error) {
    console.error('PostGIS bounds search error:', error);
    throw new Error('Failed to search campaigns in bounds');
  }
}

/**
 * Update campaign location using PostGIS geometry
 * This function maintains both lat/lng fields and PostGIS geometry
 */
export async function updateCampaignLocation(
  campaignId: string,
  point: GeographicPoint
): Promise<void> {
  try {
    await db.$executeRaw`
      UPDATE campaigns 
      SET 
        latitude = ${point.latitude},
        longitude = ${point.longitude},
        location = ST_SetSRID(ST_MakePoint(${point.longitude}, ${point.latitude}), 4326)
      WHERE id = ${campaignId}
    `;
  } catch (error) {
    console.error('PostGIS location update error:', error);
    throw new Error('Failed to update campaign location');
  }
}

/**
 * Geographic utility constants
 */
export const GEOGRAPHIC_CONSTANTS = {
  // Common search radii in meters
  RADIUS: {
    WALKING: 800, // ~0.5 miles - walkable distance
    NEIGHBORHOOD: 1600, // ~1 mile - local neighborhood
    DISTRICT: 8000, // ~5 miles - city district
    CITY: 32000, // ~20 miles - metropolitan area
  },

  // SRID for GPS coordinates (WGS84)
  GPS_SRID: 4326,

  // Default limits for queries
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 500,
} as const;
