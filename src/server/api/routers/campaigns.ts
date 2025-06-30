import { z } from 'zod';
import {
  createTRPCRouter,
  rateLimitedProcedure,
  loggedProcedure,
} from '~/server/api/trpc';
import { TRPCError } from '@trpc/server';
import { db } from '~/lib/db';
import {
  findCampaignsWithinRadius,
  findNearestCampaigns,
  findCampaignsInBounds,
  getCityGeographicStats,
  type GeographicPoint,
  type BoundingBox,
} from '~/lib/spatial';

// Campaign status enum matching Prisma schema
const CampaignStatus = z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED']);

// Vote type enum matching Prisma schema
const VoteType = z.enum(['SUPPORT', 'OPPOSE']);

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
  status: CampaignStatus.default('DRAFT'),
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
  status: CampaignStatus.optional(),
});

const CampaignSearchInput = z.object({
  query: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radius: z.number().min(0.1).max(50).default(10), // radius in kilometers
  status: CampaignStatus.optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  cursor: z.string().optional(), // for pagination
});

export const campaignsRouter = createTRPCRouter({
  // Create a new campaign
  create: loggedProcedure
    .input(CreateCampaignInput)
    .mutation(async ({ input }) => {
      // TODO: Get userId from Clerk when auth is connected
      // const userId = ctx.auth?.userId;
      // if (!userId) {
      //   throw new TRPCError({ code: 'UNAUTHORIZED' });
      // }

      // Mock implementation for now
      const mockCampaign = {
        id: `campaign_${Date.now()}`,
        ...input,
        creatorId: 'mock_user_id',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log('Mock campaign created:', mockCampaign);
      return mockCampaign;

      // Real implementation (uncomment when database is connected):
      // return await prisma.campaign.create({
      //   data: {
      //     ...input,
      //     creatorId: userId,
      //   },
      //   include: {
      //     creator: {
      //       select: {
      //         id: true,
      //         firstName: true,
      //         lastName: true,
      //         imageUrl: true,
      //       },
      //     },
      //     _count: {
      //       select: {
      //         votes: true,
      //         comments: true,
      //       },
      //     },
      //   },
      // });
    }),

  // Get campaign by ID
  getById: rateLimitedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ input }) => {
      // Mock implementation
      const mockCampaign = {
        id: input.id,
        title: 'Mock Campaign',
        description: 'This is a mock campaign for development',
        status: 'ACTIVE' as const,
        latitude: 37.7749,
        longitude: -122.4194,
        address: 'San Francisco, CA',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
        creatorId: 'mock_user_id',
        createdAt: new Date(),
        updatedAt: new Date(),
        creator: {
          id: 'mock_user_id',
          firstName: 'John',
          lastName: 'Doe',
          imageUrl: null,
        },
        _count: {
          votes: 42,
          comments: 8,
        },
      };

      return mockCampaign;

      // Real implementation:
      // const campaign = await prisma.campaign.findUnique({
      //   where: { id: input.id },
      //   include: {
      //     creator: {
      //       select: {
      //         id: true,
      //         firstName: true,
      //         lastName: true,
      //         imageUrl: true,
      //       },
      //     },
      //     _count: {
      //       select: {
      //         votes: true,
      //         comments: true,
      //       },
      //     },
      //   },
      // });

      // if (!campaign) {
      //   throw new TRPCError({ code: 'NOT_FOUND', message: 'Campaign not found' });
      // }

      // return campaign;
    }),

  // Search campaigns with geographic and text filters using PostGIS
  search: rateLimitedProcedure
    .input(CampaignSearchInput)
    .query(async ({ input }) => {
      try {
        // If geographic search is requested, use PostGIS spatial queries
        if (input.latitude && input.longitude) {
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
        const whereClause: Record<string, unknown> = {
          status: 'ACTIVE', // Only show active campaigns
        };

        // Text search
        if (input.query) {
          whereClause.OR = [
            { title: { contains: input.query, mode: 'insensitive' } },
            { description: { contains: input.query, mode: 'insensitive' } },
          ];
        }

        // Location filters
        if (input.city) {
          whereClause.city = { equals: input.city, mode: 'insensitive' };
        }
        if (input.status) {
          whereClause.status = input.status;
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
          creator: { firstName: 'User', lastName: 'Name' },
          _count: { votes: 0, comments: 0 },
        }));

        return {
          campaigns: formattedCampaigns,
          hasMore,
          nextCursor,
          searchType: 'database' as const,
        };
      } catch (error) {
        console.error('Campaign search error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to search campaigns',
        });
      }

      // Real implementation with PostGIS spatial queries:
      // const whereClause: any = {};

      // // Text search
      // if (input.query) {
      //   whereClause.OR = [
      //     { title: { contains: input.query, mode: 'insensitive' } },
      //     { description: { contains: input.query, mode: 'insensitive' } },
      //   ];
      // }

      // // Status filter
      // if (input.status) {
      //   whereClause.status = input.status;
      // }

      // // Location filters
      // if (input.city) {
      //   whereClause.city = { equals: input.city, mode: 'insensitive' };
      // }
      // if (input.state) {
      //   whereClause.state = { equals: input.state, mode: 'insensitive' };
      // }

      // // Geographic radius search using PostGIS
      // if (input.latitude && input.longitude) {
      //   const radiusInMeters = input.radius * 1000;
      //   whereClause.AND = [
      //     {
      //       latitude: { not: null },
      //       longitude: { not: null },
      //     },
      //   ];
      //   // Add PostGIS ST_DWithin query here
      // }

      // const campaigns = await prisma.campaign.findMany({
      //   where: whereClause,
      //   include: {
      //     creator: {
      //       select: {
      //         firstName: true,
      //         lastName: true,
      //         imageUrl: true,
      //       },
      //     },
      //     _count: {
      //       select: {
      //         votes: true,
      //         comments: true,
      //       },
      //     },
      //   },
      //   orderBy: { createdAt: 'desc' },
      //   take: input.limit + 1,
      //   cursor: input.cursor ? { id: input.cursor } : undefined,
      // });

      // const hasMore = campaigns.length > input.limit;
      // const results = hasMore ? campaigns.slice(0, -1) : campaigns;
      // const nextCursor = hasMore ? results[results.length - 1]?.id : null;

      // return {
      //   campaigns: results,
      //   hasMore,
      //   nextCursor,
      // };
    }),

  // Update campaign
  update: loggedProcedure
    .input(UpdateCampaignInput)
    .mutation(async ({ input }) => {
      // TODO: Check ownership and permissions
      // const userId = ctx.auth?.userId;
      // if (!userId) {
      //   throw new TRPCError({ code: 'UNAUTHORIZED' });
      // }

      const { id, ...updateData } = input;

      // Mock implementation
      const mockUpdatedCampaign = {
        id,
        ...updateData,
        updatedAt: new Date(),
      };

      console.log('Mock campaign updated:', mockUpdatedCampaign);
      return mockUpdatedCampaign;

      // Real implementation:
      // const existingCampaign = await prisma.campaign.findUnique({
      //   where: { id },
      //   select: { creatorId: true },
      // });

      // if (!existingCampaign) {
      //   throw new TRPCError({ code: 'NOT_FOUND' });
      // }

      // if (existingCampaign.creatorId !== userId) {
      //   throw new TRPCError({ code: 'FORBIDDEN' });
      // }

      // return await prisma.campaign.update({
      //   where: { id },
      //   data: updateData,
      //   include: {
      //     creator: {
      //       select: {
      //         id: true,
      //         firstName: true,
      //         lastName: true,
      //         imageUrl: true,
      //       },
      //     },
      //     _count: {
      //       select: {
      //         votes: true,
      //         comments: true,
      //       },
      //     },
      //   },
      // });
    }),

  // Delete campaign
  delete: loggedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ input }) => {
      // TODO: Check ownership
      // const userId = ctx.auth?.userId;
      // if (!userId) {
      //   throw new TRPCError({ code: 'UNAUTHORIZED' });
      // }

      console.log('Mock campaign deleted:', input.id);
      return { success: true };

      // Real implementation:
      // const campaign = await prisma.campaign.findUnique({
      //   where: { id: input.id },
      //   select: { creatorId: true },
      // });

      // if (!campaign) {
      //   throw new TRPCError({ code: 'NOT_FOUND' });
      // }

      // if (campaign.creatorId !== userId) {
      //   throw new TRPCError({ code: 'FORBIDDEN' });
      // }

      // await prisma.campaign.delete({
      //   where: { id: input.id },
      // });

      // return { success: true };
    }),

  // Vote on a campaign
  vote: loggedProcedure
    .input(
      z.object({
        campaignId: z.string().cuid(),
        voteType: VoteType,
      })
    )
    .mutation(async ({ input }) => {
      // TODO: Get userId from auth
      // const userId = ctx.auth?.userId;
      // if (!userId) {
      //   throw new TRPCError({ code: 'UNAUTHORIZED' });
      // }

      console.log('Mock vote cast:', input);
      return { success: true, voteType: input.voteType };

      // Real implementation:
      // await prisma.vote.upsert({
      //   where: {
      //     campaignId_userId: {
      //       campaignId: input.campaignId,
      //       userId,
      //     },
      //   },
      //   update: {
      //     type: input.voteType,
      //   },
      //   create: {
      //     campaignId: input.campaignId,
      //     userId,
      //     type: input.voteType,
      //   },
      // });

      // return { success: true, voteType: input.voteType };
    }),

  // Get user's campaigns
  getMyCampaigns: loggedProcedure
    .input(
      z.object({
        status: CampaignStatus.optional(),
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async () => {
      // TODO: Get userId from auth
      // const userId = ctx.auth?.userId;
      // if (!userId) {
      //   throw new TRPCError({ code: 'UNAUTHORIZED' });
      // }

      // Mock implementation
      return {
        campaigns: [],
        hasMore: false,
        nextCursor: null,
      };

      // Real implementation:
      // const whereClause: any = { creatorId: userId };
      // if (input.status) {
      //   whereClause.status = input.status;
      // }

      // const campaigns = await prisma.campaign.findMany({
      //   where: whereClause,
      //   include: {
      //     _count: {
      //       select: {
      //         votes: true,
      //         comments: true,
      //       },
      //     },
      //   },
      //   orderBy: { createdAt: 'desc' },
      //   take: input.limit + 1,
      //   cursor: input.cursor ? { id: input.cursor } : undefined,
      // });

      // const hasMore = campaigns.length > input.limit;
      // const results = hasMore ? campaigns.slice(0, -1) : campaigns;
      // const nextCursor = hasMore ? results[results.length - 1]?.id : null;

      // return {
      //   campaigns: results,
      //   hasMore,
      //   nextCursor,
      // };
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
        const bounds: BoundingBox = {
          north: input.north,
          south: input.south,
          east: input.east,
          west: input.west,
        };

        const boundsResults = await findCampaignsInBounds(bounds, input.limit);

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
      } catch (error) {
        console.error('Get city stats error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get city statistics',
        });
      }
    }),
});
