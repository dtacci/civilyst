import { z } from 'zod';
import {
  createTRPCRouter,
  rateLimitedProcedure,
  loggedProcedure,
} from '~/server/api/trpc';
import { TRPCError } from '@trpc/server';
import { db } from '~/lib/db';
import {
  CampaignStatus,
  VoteType as PrismaVoteType,
  type Prisma, // Prisma namespace for advanced payload typing
} from '~/generated/prisma';
import {
  findCampaignsWithinRadius,
  findNearestCampaigns,
  findCampaignsInBounds,
  getCityGeographicStats,
  type GeographicPoint,
  type BoundingBox,
} from '~/lib/spatial';
// Import caching utilities
import {
  getCacheWithFallback,
  geoQueryCacheKey,
  searchQueryCacheKey,
  campaignCacheKey,
  invalidateCampaignCache,
  invalidateUserCache,
  CACHE_TTL,
  GEO_PRECISION,
  deleteByPattern,
  CACHE_PREFIX,
} from '~/lib/cache';

// Use Prisma enums directly with Zod
const CampaignStatusSchema = z.nativeEnum(CampaignStatus);
const VoteTypeSchema = z.nativeEnum(PrismaVoteType);

// Input validation schemas
const CreateCampaignInput = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description too long'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  zipCode: z.string().max(20).optional(),
  status: CampaignStatusSchema.default('DRAFT'),
});

const UpdateCampaignInput = z.object({
  id: z.string().cuid(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(10).max(5000).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  zipCode: z.string().max(20).optional(),
  status: CampaignStatusSchema.optional(),
});

const CampaignSearchInput = z.object({
  query: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radius: z.number().min(0.1).max(50).default(10), // radius in kilometers
  status: CampaignStatusSchema.optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  cursor: z.string().optional(), // for pagination
});

export const campaignsRouter = createTRPCRouter({
  // Create a new campaign
  create: loggedProcedure
    .input(CreateCampaignInput)
    .mutation(async ({ ctx, input }) => {
      // Require authentication
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      /**
       * Ensure user exists in our database
       * This is a safeguard for cases where Clerk creates a user but our webhook hasn't fired yet
       */
      const internalUser = await db.user.upsert({
        where: { id: ctx.userId },
        update: {},
        create: {
          id: ctx.userId,
          email: `${ctx.userId}@temp.local`, // Temporary email until webhook provides real data
        },
      });

      const campaign = await db.campaign.create({
        data: {
          ...input,
          creatorId: internalUser.id,
        },
      });

      // Invalidate all search and geo caches since a new campaign was created
      // This ensures users will see the new campaign in search results
      await Promise.all([
        deleteByPattern(`${CACHE_PREFIX.SEARCH}:*`),
        deleteByPattern(`${CACHE_PREFIX.GEO}:*`),
      ]);

      return campaign;
    }),

  // Get campaign by ID
  getById: rateLimitedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ input }) => {
      /**
       * Campaign detail payload including creator info and engagement counts.
       * This mirrors what the frontend expects (`creator` & `_count`).
       */
      type CampaignDetail = Prisma.CampaignGetPayload<{
        include: {
          creator: {
            select: {
              firstName: true;
              lastName: true;
              imageUrl: true;
            };
          };
          _count: {
            select: {
              votes: true;
              comments: true;
            };
          };
        };
      }>;

      // Generate cache key for this campaign
      const cacheKey = campaignCacheKey(input.id);

      // Try to get from cache first, with fallback to database
      const result = await getCacheWithFallback<CampaignDetail>(
        cacheKey,
        async () => {
          const campaign = await db.campaign.findUnique({
            where: { id: input.id },
            include: {
              creator: {
                select: {
                  firstName: true,
                  lastName: true,
                  imageUrl: true,
                },
              },
              _count: {
                select: {
                  votes: true,
                  comments: true,
                },
              },
            },
          });

          if (!campaign) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Campaign not found',
            });
          }

          return campaign;
        },
        CACHE_TTL.CAMPAIGN_DETAIL
      );

      // If there was an error in the cache operation, throw it
      if (result.error) throw result.error;

      // Return the campaign data
      return result.data;
    }),

  // Search campaigns with geographic and text filters using PostGIS
  search: rateLimitedProcedure
    .input(CampaignSearchInput)
    .query(async ({ input }) => {
      try {
        // Generate cache key based on search parameters
        const searchParams: Record<string, string | number | boolean> = {};
        if (input.query) searchParams.q = input.query;
        if (input.city) searchParams.city = input.city;
        if (input.state) searchParams.state = input.state;
        if (input.status) searchParams.status = input.status;
        if (input.cursor) searchParams.cursor = input.cursor;
        searchParams.limit = input.limit;

        let cacheKey: string;

        // If geographic search is requested, use geo cache key
        if (input.latitude !== undefined && input.longitude !== undefined) {
          cacheKey = geoQueryCacheKey(
            input.latitude,
            input.longitude,
            input.radius,
            GEO_PRECISION.CITY,
            searchParams
          );
        } else {
          // Otherwise use regular search cache key
          cacheKey = searchQueryCacheKey(input.query || '', searchParams);
        }

        // Try to get from cache first, with fallback to database query
        const cacheResult = await getCacheWithFallback(
          cacheKey,
          async () => {
            // ------------------------------------------------------------------
            // TEMPORARY: Disable PostGIS-powered spatial search until the DB
            // extension is fully configured in Supabase.  We fall back to the
            // regular Prisma text/location filtering for all requests.
            // ------------------------------------------------------------------
            const enableSpatial = true; // PostGIS is configured – enable spatial search

            // If geographic search is requested *and* spatial search enabled,
            // attempt PostGIS query branch, otherwise skip to fallback.
            if (
              enableSpatial &&
              input.latitude !== undefined &&
              input.longitude !== undefined
            ) {
              const searchPoint: GeographicPoint = {
                latitude: input.latitude,
                longitude: input.longitude,
              };

              const radiusMeters = input.radius * 1000; // Convert km to meters

              // Use PostGIS spatial search
              const spatialResults = await findCampaignsWithinRadius({
                point: searchPoint,
                radiusMeters,
                limit: input.limit,
                offset: 0,
              });

              // Convert spatial results to expected format
              const campaigns = spatialResults.map((campaign) => ({
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

              return {
                campaigns,
                hasMore: campaigns.length === input.limit,
                nextCursor:
                  campaigns.length === input.limit
                    ? campaigns[campaigns.length - 1]?.id
                    : null,
                searchType: 'spatial' as const,
                centerPoint: searchPoint,
                radiusMeters,
              };
            }

            // Fallback to regular database search without spatial queries
            // Start with an empty filter and add status logic below.
            const whereClause: Record<string, unknown> = {};

            // Text search
            if (input.query) {
              whereClause.OR = [
                { title: { contains: input.query, mode: 'insensitive' } },
                { description: { contains: input.query, mode: 'insensitive' } },
              ];
            }

            // Location and status filters
            if (input.city) {
              whereClause.city = { equals: input.city, mode: 'insensitive' };
            }

            // Apply status filter only when provided; otherwise default to ACTIVE
            if (input.status) {
              whereClause.status = input.status;
            } else {
              whereClause.status = 'ACTIVE';
            }

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
                // TODO: Add creator and vote count when auth is ready
              },
              orderBy: { createdAt: 'desc' },
              take: input.limit + 1,
              cursor: input.cursor ? { id: input.cursor } : undefined,
            });

            const hasMore = campaigns.length > input.limit;
            const results = hasMore ? campaigns.slice(0, -1) : campaigns;
            const nextCursor = hasMore ? results[results.length - 1]?.id : null;

            // Format results
            const formattedCampaigns = results.map((campaign) => ({
              ...campaign,
              status: campaign.status,
              creator: { firstName: 'User', lastName: 'Name' },
              _count: { votes: 0, comments: 0 },
            }));

            return {
              campaigns: formattedCampaigns,
              hasMore,
              nextCursor,
              searchType: 'database' as const,
            };
          },
          CACHE_TTL.SEARCH_RESULTS
        );

        // If there was an error in the cache operation, throw it
        if (cacheResult.error) throw cacheResult.error;

        return cacheResult.data;
      } catch (error) {
        console.error('Campaign search error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to search campaigns',
        });
      }
    }),

  // Update campaign
  update: loggedProcedure
    .input(UpdateCampaignInput)
    .mutation(async ({ ctx, input }) => {
      // 1. Require authentication
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      // 2. Ensure campaign exists and ownership matches
      const existingCampaign = await db.campaign.findUnique({
        where: { id: input.id },
        select: { creatorId: true },
      });

      if (!existingCampaign) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Campaign not found',
        });
      }

      if (existingCampaign.creatorId !== ctx.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not campaign owner',
        });
      }

      // 4. Update campaign
      const updated = await db.campaign.update({
        where: { id: input.id },
        data: {
          ...input,
          updatedAt: new Date(),
        },
      });

      // 5. Invalidate caches for this campaign
      await invalidateCampaignCache(input.id);

      return updated;
    }),

  // Delete campaign
  delete: loggedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      // 1. Require authentication
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      // 2. Ensure campaign exists and is owned by current user
      const campaign = await db.campaign.findUnique({
        where: { id: input.id },
        select: { creatorId: true },
      });

      if (!campaign) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Campaign not found',
        });
      }

      if (campaign.creatorId !== ctx.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not campaign owner',
        });
      }

      // 4. Delete campaign
      await db.campaign.delete({ where: { id: input.id } });

      // 5. Invalidate caches
      await invalidateCampaignCache(input.id);

      return { success: true };
    }),

  // Vote on a campaign
  vote: loggedProcedure
    .input(
      z.object({
        campaignId: z.string().cuid(),
        voteType: VoteTypeSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Require authentication
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      // 2. Ensure we have an internal user record
      const internalUser = await db.user.upsert({
        where: { id: ctx.userId },
        update: {},
        create: {
          id: ctx.userId,
          email: `${ctx.userId}@temp.local`, // Temporary email until webhook provides real data
        },
        select: { id: true },
      });

      // 3. Upsert vote (create new or update existing)
      await db.vote.upsert({
        where: {
          campaignId_userId: {
            campaignId: input.campaignId,
            userId: internalUser.id,
          },
        },
        update: {
          type: input.voteType,
        },
        create: {
          campaignId: input.campaignId,
          userId: internalUser.id,
          type: input.voteType,
        },
      });

      // 4. Invalidate campaign cache since vote count changed
      await invalidateCampaignCache(input.campaignId);

      // 5. Invalidate user cache since their votes changed
      await invalidateUserCache(internalUser.id);

      return { success: true, voteType: input.voteType };
    }),

  // Get user's campaigns
  getMyCampaigns: loggedProcedure
    .input(
      z.object({
        status: CampaignStatusSchema.optional(),
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // 1. Require authentication
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      // Generate cache key for user's campaigns
      const cacheKey = `${CACHE_PREFIX.USER}:${ctx.userId}:campaigns:${input.status || 'all'}:${input.limit}:${input.cursor || 'start'}`;

      // Try to get from cache first, with fallback to database
      const result = await getCacheWithFallback(
        cacheKey,
        async () => {
          // 3. Build where-clause
          const whereClause: Record<string, unknown> = {
            creatorId: ctx.userId,
          };
          if (input.status) {
            whereClause.status = input.status;
          }

          // 4. Query with pagination
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
              _count: {
                select: { votes: true, comments: true },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: input.limit + 1,
            cursor: input.cursor ? { id: input.cursor } : undefined,
          });

          const hasMore = campaigns.length > input.limit;
          const results = hasMore ? campaigns.slice(0, -1) : campaigns;
          const nextCursor = hasMore ? results[results.length - 1]?.id : null;

          return {
            campaigns: results,
            hasMore,
            nextCursor,
          };
        },
        CACHE_TTL.USER_PROFILE
      );

      // If there was an error in the cache operation, throw it
      if (result.error) throw result.error;

      return result.data;
    }),

  // Find nearest campaigns to a location (PostGIS powered)
  findNearby: rateLimitedProcedure
    .input(
      z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ input }) => {
      try {
        // Generate cache key for this geographic query
        const cacheKey = geoQueryCacheKey(
          input.latitude,
          input.longitude,
          10, // Default radius in km
          GEO_PRECISION.CITY,
          { limit: input.limit }
        );

        // Try to get from cache first, with fallback to database
        const result = await getCacheWithFallback(
          cacheKey,
          async () => {
            const searchPoint: GeographicPoint = {
              latitude: input.latitude,
              longitude: input.longitude,
            };

            const nearestCampaigns = await findNearestCampaigns(
              searchPoint,
              input.limit
            );

            const campaigns = nearestCampaigns.map((campaign) => ({
              id: campaign.id,
              title: campaign.title,
              description: campaign.description,
              latitude: campaign.latitude,
              longitude: campaign.longitude,
              address: campaign.address,
              city: campaign.city,
              state: campaign.state,
              distanceMeters: campaign.distanceMeters,
              distanceKm: campaign.distanceMeters / 1000,
              createdAt: campaign.createdAt,
              status: campaign.status,
              creator: { firstName: 'User', lastName: 'Name' },
              _count: { votes: 0, comments: 0 },
            }));

            return {
              campaigns,
              searchPoint,
              totalFound: campaigns.length,
            };
          },
          CACHE_TTL.GEO_QUERY
        );

        // If there was an error in the cache operation, throw it
        if (result.error) throw result.error;

        return result.data;
      } catch (error) {
        console.error('Find nearby campaigns error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to find nearby campaigns',
        });
      }
    }),

  // Find campaigns in a map viewport bounds (PostGIS powered)
  findInBounds: rateLimitedProcedure
    .input(
      z.object({
        north: z.number().min(-90).max(90),
        south: z.number().min(-90).max(90),
        east: z.number().min(-180).max(180),
        west: z.number().min(-180).max(180),
        limit: z.number().min(1).max(500).default(100),
      })
    )
    .query(async ({ input }) => {
      try {
        // Generate cache key for this bounds query
        const cacheKey = `${CACHE_PREFIX.GEO}:bounds:${input.north.toFixed(2)}:${input.south.toFixed(2)}:${input.east.toFixed(2)}:${input.west.toFixed(2)}:${input.limit}`;

        // Try to get from cache first, with fallback to database
        const result = await getCacheWithFallback(
          cacheKey,
          async () => {
            const bounds: BoundingBox = {
              north: input.north,
              south: input.south,
              east: input.east,
              west: input.west,
            };

            const boundsResults = await findCampaignsInBounds(
              bounds,
              input.limit
            );

            const campaigns = boundsResults.map((campaign) => ({
              id: campaign.id,
              title: campaign.title,
              description: campaign.description,
              latitude: campaign.latitude,
              longitude: campaign.longitude,
              address: campaign.address,
              city: campaign.city,
              state: campaign.state,
              createdAt: campaign.createdAt,
              status: campaign.status,
              creator: { firstName: 'User', lastName: 'Name' },
              _count: { votes: 0, comments: 0 },
            }));

            return {
              campaigns,
              bounds,
              totalFound: campaigns.length,
            };
          },
          CACHE_TTL.GEO_QUERY
        );

        // If there was an error in the cache operation, throw it
        if (result.error) throw result.error;

        return result.data;
      } catch (error) {
        console.error('Find campaigns in bounds error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to find campaigns in bounds',
        });
      }
    }),

  // Get geographic statistics for a city (PostGIS powered)
  getCityStats: rateLimitedProcedure
    .input(
      z.object({
        city: z.string().min(1).max(100),
      })
    )
    .query(async ({ input }) => {
      try {
        // Generate cache key for city stats
        const cacheKey = `${CACHE_PREFIX.GEO}:city:${input.city.toLowerCase()}:stats`;

        // Try to get from cache first, with fallback to database
        const result = await getCacheWithFallback(
          cacheKey,
          async () => {
            const stats = await getCityGeographicStats(input.city);

            return {
              city: input.city,
              campaignCount: stats.campaign_count,
              centerPoint: {
                latitude: stats.center_lat,
                longitude: stats.center_lng,
              },
              coverageRadiusMeters: stats.coverage_radius_meters,
              coverageRadiusKm: stats.coverage_radius_meters / 1000,
            };
          },
          CACHE_TTL.GEO_QUERY
        );

        // If there was an error in the cache operation, throw it
        if (result.error) throw result.error;

        return result.data;
      } catch (error) {
        console.error('Get city stats error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get city statistics',
        });
      }
    }),
});
