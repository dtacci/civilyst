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
} from '~/generated/prisma';

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
        orderBy: [
          { responseCount: 'desc' },
          { createdAt: 'desc' },
        ],
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
        timeContext: z.nativeEnum(WonderTimeContext).default(WonderTimeContext.ANYTIME),
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
    const responseDates = recentResponses.map(r => {
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
        orderBy: [
          { confidence: 'desc' },
          { supportCount: 'desc' },
        ],
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
}); 