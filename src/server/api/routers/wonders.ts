import { z } from 'zod';
import {
  createTRPCRouter,
  publicProcedure,
  loggedProcedure,
} from '~/server/api/trpc';
import { TRPCError } from '@trpc/server';
import { db } from '~/lib/db';
import {
  WonderCategory,
  WonderTimeContext,
  WonderStatus,
  TrustSignalType,
} from '~/generated/prisma';
import {
  getLocationFromIP,
  areLocationsConsistent,
} from '~/lib/location/ipGeolocation';
import { calculateLocationTrustBonus } from '~/lib/location/communityBoundaries';
import { reverseGeocode } from '~/lib/geocoding';

export const wondersRouter = createTRPCRouter({
  // Get active wonder for homepage
  getActiveWonder: publicProcedure.query(async () => {
    // Get today's featured wonder or most recent active wonder
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeWonder = await db.wonder.findFirst({
      where: {
        status: WonderStatus.ACTIVE,
        createdAt: {
          gte: today,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
            imageUrl: true,
          },
        },
        _count: {
          select: {
            responses: true,
          },
        },
      },
    });

    return activeWonder;
  }),

  // Get trending wonders
  getTrendingWonders: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(20).default(5),
        category: z.nativeEnum(WonderCategory).optional(),
      })
    )
    .query(async ({ input }) => {
      const wonders = await db.wonder.findMany({
        where: {
          status: WonderStatus.ACTIVE,
          category: input.category,
        },
        orderBy: [{ responseCount: 'desc' }, { createdAt: 'desc' }],
        take: input.limit,
        include: {
          author: {
            select: {
              firstName: true,
              lastName: true,
              imageUrl: true,
            },
          },
          _count: {
            select: {
              responses: true,
              patterns: true,
            },
          },
        },
      });

      return wonders;
    }),

  // Create a new wonder
  createWonder: loggedProcedure
    .input(
      z.object({
        question: z.string().min(10).max(500),
        category: z.nativeEnum(WonderCategory).default(WonderCategory.GENERAL),
        timeContext: z
          .nativeEnum(WonderTimeContext)
          .default(WonderTimeContext.ANYTIME),
        locationContext: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Require authentication
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      // Ensure we have an internal user record
      const internalUser = await db.user.upsert({
        where: { id: ctx.userId },
        update: {},
        create: {
          id: ctx.userId,
          email: `${ctx.userId}@temp.local`,
        },
        select: { id: true },
      });

      const wonder = await db.wonder.create({
        data: {
          question: input.question,
          category: input.category,
          timeContext: input.timeContext,
          locationContext: input.locationContext,
          authorId: internalUser.id,
        },
        include: {
          author: {
            select: {
              firstName: true,
              lastName: true,
              imageUrl: true,
            },
          },
        },
      });

      return wonder;
    }),

  // Answer a wonder (voice or text)
  answerWonder: loggedProcedure
    .input(
      z.object({
        wonderId: z.string().cuid(),
        audioUrl: z.string().url().optional(),
        textResponse: z.string().min(1).max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Require authentication
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      // Ensure we have an internal user record
      const internalUser = await db.user.upsert({
        where: { id: ctx.userId },
        update: {},
        create: {
          id: ctx.userId,
          email: `${ctx.userId}@temp.local`,
        },
        select: { id: true },
      });

      // Check if user already responded
      const existingResponse = await db.wonderResponse.findUnique({
        where: {
          wonderId_userId: {
            wonderId: input.wonderId,
            userId: internalUser.id,
          },
        },
      });

      if (existingResponse) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'You have already responded to this wonder',
        });
      }

      // Create response
      const response = await db.wonderResponse.create({
        data: {
          wonderId: input.wonderId,
          userId: internalUser.id,
          audioUrl: input.audioUrl,
          textResponse: input.textResponse,
          isProcessed: false, // Will be processed by background job
        },
      });

      // Update wonder response count
      await db.wonder.update({
        where: { id: input.wonderId },
        data: {
          responseCount: {
            increment: 1,
          },
        },
      });

      return response;
    }),

  // Get responses for a wonder (for heat map visualization)
  getWonderResponses: publicProcedure
    .input(
      z.object({
        wonderId: z.string().cuid(),
        includeLocation: z.boolean().default(true),
      })
    )
    .query(async ({ input }) => {
      const responses = await db.wonderResponse.findMany({
        where: {
          wonderId: input.wonderId,
          isProcessed: true,
        },
        select: {
          id: true,
          parsedLocation: true,
          parsedNeed: true,
          parsedSentiment: true,
          latitude: input.includeLocation ? true : false,
          longitude: input.includeLocation ? true : false,
          city: true,
          createdAt: true,
          user: {
            select: {
              firstName: true,
              imageUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return responses;
    }),

  // Get user's wonder streak and stats
  getUserWonderStats: loggedProcedure.query(async ({ ctx }) => {
    // Require authentication
    if (!ctx.userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    const userId = ctx.userId;

    // Calculate streak (consecutive days with responses)
    const recentResponses = await db.wonderResponse.findMany({
      where: {
        userId,
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 30, // Check last 30 days
    });

    // Calculate streak logic
    let streak = 0;
    const today = new Date();
    const responseDates = recentResponses.map((r) => {
      const date = new Date(r.createdAt);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    });

    // Check consecutive days from today backwards
    const uniqueDates = [...new Set(responseDates)].sort((a, b) => b - a);

    for (let i = 0; i < uniqueDates.length; i++) {
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      expectedDate.setHours(0, 0, 0, 0);

      if (uniqueDates[i] === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    // Total stats
    const totalResponses = await db.wonderResponse.count({
      where: { userId },
    });

    const totalWonders = await db.wonder.count({
      where: { authorId: userId },
    });

    return {
      streak,
      totalResponses,
      totalWonders,
      canAskWonders: streak >= 3, // Unlock after 3-day streak
      canSeePatterns: streak >= 7, // Unlock after 7-day streak
    };
  }),

  // Get wonder patterns (for magic moments)
  getWonderPatterns: loggedProcedure
    .input(
      z.object({
        wonderId: z.string().cuid(),
        minConfidence: z.number().min(0).max(1).default(0.7),
      })
    )
    .query(async ({ ctx, input }) => {
      // Require authentication
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      const patterns = await db.wonderPattern.findMany({
        where: {
          wonderId: input.wonderId,
          confidence: {
            gte: input.minConfidence,
          },
        },
        orderBy: [{ confidence: 'desc' }, { supportCount: 'desc' }],
        include: {
          campaign: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
      });

      return patterns;
    }),

  // Create anonymous wonder without authentication
  createAnonymous: publicProcedure
    .input(
      z.object({
        deviceId: z.string().min(32).max(64),
        content: z.string().min(10).max(500),
        voiceUrl: z.string().url().optional(),
        location: z
          .object({
            type: z.literal('Point'),
            coordinates: z.tuple([z.number(), z.number()]),
          })
          .optional(),
        category: z.nativeEnum(WonderCategory).default(WonderCategory.GENERAL),
        timeContext: z
          .nativeEnum(WonderTimeContext)
          .default(WonderTimeContext.ANYTIME),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Enhanced location verification process
      let locationMetadata: Record<string, unknown> = {};
      let locationTrustBonus = 0;

      if (input.location) {
        const [lng, lat] = input.location.coordinates;

        // Get IP-based location for verification
        const ipLocation = await getLocationFromIP(
          ctx.req?.headers['x-forwarded-for'] as string
        );

        // Reverse geocode GPS location for city name
        const gpsLocation = await reverseGeocode(lat, lng);

        // Check location consistency
        let isLocationConsistent = false;
        if (ipLocation) {
          isLocationConsistent = areLocationsConsistent(
            lat,
            lng,
            ipLocation.lat,
            ipLocation.lng
          );
        }

        // Calculate trust bonus based on community boundaries
        const trustBonusInfo = calculateLocationTrustBonus(lat, lng);
        locationTrustBonus = trustBonusInfo.bonus;

        // Build location metadata
        locationMetadata = {
          locationCity: gpsLocation?.city || 'Unknown',
          locationAddress: gpsLocation?.formattedAddress || null,
          ipLocation: ipLocation
            ? {
                city: ipLocation.city,
                lat: ipLocation.lat,
                lng: ipLocation.lng,
              }
            : null,
          locationConsistent: isLocationConsistent,
          trustBonusReason: trustBonusInfo.reason,
          communityBoundary: trustBonusInfo.reason !== 'Location verified',
        } as Record<string, unknown>;
      }

      // Create anonymous wonder
      const anonymousWonder = await db.anonymousWonder.create({
        data: {
          deviceId: input.deviceId,
          content: input.content,
          voiceUrl: input.voiceUrl,
          location: input.location,
          category: input.category,
          timeContext: input.timeContext,
          trustScore: 0, // Initial trust score
          isVerified: false,
          metadata:
            Object.keys(locationMetadata).length > 0
              ? (locationMetadata as Record<string, unknown>)
              : undefined,
        },
      });

      // Track initial trust signal for creation
      await db.trustSignal.create({
        data: {
          deviceId: input.deviceId,
          signalType: TrustSignalType.CONTENT_QUALITY,
          signalValue: 0.1, // Base value for creating content
          metadata: {
            wonderId: anonymousWonder.id,
            action: 'created_anonymous_wonder',
          },
        },
      });

      // Enhanced location verification trust signal
      if (input.location) {
        await db.trustSignal.create({
          data: {
            deviceId: input.deviceId,
            signalType: TrustSignalType.LOCATION_VERIFIED,
            signalValue: 0.2 + locationTrustBonus, // Base + community bonus
            metadata: {
              wonderId: anonymousWonder.id,
              coordinates: input.location.coordinates,
              locationCity: locationMetadata.locationCity as string,
              locationConsistent:
                locationMetadata.locationConsistent as boolean,
              trustBonusReason: locationMetadata.trustBonusReason as string,
            },
          },
        });
      }

      return anonymousWonder;
    }),

  // Get anonymous wonders for a device
  getAnonymousWonders: publicProcedure
    .input(
      z.object({
        deviceId: z.string().min(32).max(64),
      })
    )
    .query(async ({ input }) => {
      const wonders = await db.anonymousWonder.findMany({
        where: {
          deviceId: input.deviceId,
          claimedBy: null, // Only unclaimed wonders
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Calculate total trust score for this device
      const trustSignals = await db.trustSignal.findMany({
        where: {
          deviceId: input.deviceId,
        },
        select: {
          signalValue: true,
        },
      });

      const totalTrustScore = trustSignals.reduce(
        (sum, signal) => sum + signal.signalValue,
        0
      );

      return {
        wonders,
        trustScore: Math.min(totalTrustScore, 1), // Cap at 1.0
      };
    }),

  // Claim anonymous wonders when user signs up
  claimAnonymousWonders: loggedProcedure
    .input(
      z.object({
        deviceId: z.string().min(32).max(64),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      // Find all unclaimed wonders for this device
      const anonymousWonders = await db.anonymousWonder.findMany({
        where: {
          deviceId: input.deviceId,
          claimedBy: null,
        },
      });

      if (anonymousWonders.length === 0) {
        return { claimed: 0 };
      }

      // Ensure we have an internal user record
      const internalUser = await db.user.upsert({
        where: { id: ctx.userId },
        update: {},
        create: {
          id: ctx.userId,
          email: `${ctx.userId}@temp.local`,
        },
        select: { id: true },
      });

      // Convert anonymous wonders to real wonders
      const createdWonders = await Promise.all(
        anonymousWonders.map(async (anonWonder) => {
          const wonder = await db.wonder.create({
            data: {
              question: anonWonder.content,
              category: anonWonder.category,
              timeContext: anonWonder.timeContext,
              authorId: internalUser.id,
              status: WonderStatus.ACTIVE,
            },
          });

          // Update anonymous wonder with claim info
          await db.anonymousWonder.update({
            where: { id: anonWonder.id },
            data: {
              claimedBy: internalUser.id,
              claimedAt: new Date(),
              convertedToWonderId: wonder.id,
            },
          });

          return wonder;
        })
      );

      // Transfer trust signals to user
      await db.trustSignal.updateMany({
        where: {
          deviceId: input.deviceId,
          userId: null,
        },
        data: {
          userId: internalUser.id,
        },
      });

      // Create profile completion trust signal
      await db.trustSignal.create({
        data: {
          userId: internalUser.id,
          signalType: TrustSignalType.PROFILE_COMPLETION,
          signalValue: 0.3,
          metadata: {
            action: 'claimed_anonymous_wonders',
            count: createdWonders.length,
          },
        },
      });

      return {
        claimed: createdWonders.length,
        wonders: createdWonders,
      };
    }),
});
