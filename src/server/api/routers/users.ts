import { z } from 'zod';
import { createTRPCRouter, rateLimitedProcedure } from '~/server/api/trpc';
import { TRPCError } from '@trpc/server';
import { db } from '~/lib/db';

export const usersRouter = createTRPCRouter({
  // Get user statistics
  getStats: rateLimitedProcedure.query(async ({ ctx }) => {
    if (!ctx.userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    const userId = ctx.userId;

    // Get campaign count and votes received
    const campaignStats = await db.campaign.aggregate({
      where: { creatorId: userId },
      _count: {
        id: true,
      },
    });

    const activeCampaignCount = await db.campaign.count({
      where: {
        creatorId: userId,
        status: 'ACTIVE',
      },
    });

    // Get votes cast by user
    const voteCount = await db.vote.count({
      where: { userId },
    });

    // Get comments made by user
    const commentCount = await db.comment.count({
      where: { authorId: userId },
    });

    // Get wonder responses count
    const wonderResponseCount = await db.wonderResponse.count({
      where: { userId },
    });

    // Calculate engagement streak (simplified - count unique days with activity in last week)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Get distinct activity dates from the last week
    const recentCampaignDates = await db.campaign.findMany({
      where: {
        creatorId: userId,
        createdAt: { gte: oneWeekAgo },
      },
      select: { createdAt: true },
    });

    const recentVoteDates = await db.vote.findMany({
      where: {
        userId,
        createdAt: { gte: oneWeekAgo },
      },
      select: { createdAt: true },
    });

    const recentCommentDates = await db.comment.findMany({
      where: {
        authorId: userId,
        createdAt: { gte: oneWeekAgo },
      },
      select: { createdAt: true },
    });

    // Count unique days with activity
    const allDates = [
      ...recentCampaignDates.map((c) => c.createdAt.toDateString()),
      ...recentVoteDates.map((v) => v.createdAt.toDateString()),
      ...recentCommentDates.map((c) => c.createdAt.toDateString()),
    ];
    const uniqueDays = new Set(allDates);
    const engagementStreak = uniqueDays.size;

    // Calculate impact score (simplified algorithm)
    const impactScore =
      campaignStats._count.id * 10 +
      voteCount * 2 +
      commentCount * 1 +
      wonderResponseCount * 3;

    // Determine engagement level
    let engagementLevel = 'Getting Started';
    if (impactScore > 100) engagementLevel = 'Community Leader';
    else if (impactScore > 50) engagementLevel = 'Active Citizen';
    else if (impactScore > 20) engagementLevel = 'Engaged Member';

    return {
      campaignCount: campaignStats._count.id,
      activeCampaignCount,
      voteCount,
      commentCount,
      wonderResponseCount,
      engagementStreak,
      impactScore,
      engagementLevel,
    };
  }),

  // Get recent activity
  getRecentActivity: rateLimitedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(20).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }
      const userId = ctx.userId;

      // Get recent campaigns
      const recentCampaigns = await db.campaign.findMany({
        where: { creatorId: userId },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
        select: {
          id: true,
          title: true,
          createdAt: true,
        },
      });

      // Get recent votes
      const recentVotes = await db.vote.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
        select: {
          id: true,
          type: true,
          createdAt: true,
          campaign: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      // Get recent comments
      const recentComments = await db.comment.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
        select: {
          id: true,
          content: true,
          createdAt: true,
          campaign: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      // Combine and format activities
      const activities = [
        ...recentCampaigns.map((campaign) => ({
          type: 'campaign' as const,
          description: `Created campaign "${campaign.title}"`,
          createdAt: campaign.createdAt,
          linkId: campaign.id,
        })),
        ...recentVotes.map((vote) => ({
          type: 'vote' as const,
          description: `${vote.type === 'SUPPORT' ? 'Supported' : 'Opposed'} "${vote.campaign.title}"`,
          createdAt: vote.createdAt,
          linkId: vote.campaign.id,
        })),
        ...recentComments.map((comment) => ({
          type: 'comment' as const,
          description: `Commented on "${comment.campaign.title}"`,
          createdAt: comment.createdAt,
          linkId: comment.campaign.id,
        })),
      ];

      // Sort by date and take the most recent
      return activities
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, input.limit);
    }),

  // Get user profile info (extended from Clerk data)
  getProfile: rateLimitedProcedure.query(async ({ ctx }) => {
    if (!ctx.userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    const userId = ctx.userId;

    // Get user from database
    const dbUser = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        imageUrl: true,
        bio: true,
        location: true,
        isPublic: true,
        showStats: true,
        showActivity: true,
        allowMentions: true,
        showLocation: true,
        defaultLocation: true,
        autoDetectLocation: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      id: dbUser?.id || userId,
      firstName: dbUser?.firstName,
      lastName: dbUser?.lastName,
      fullName: `${dbUser?.firstName || ''} ${dbUser?.lastName || ''}`.trim(),
      email: dbUser?.email,
      imageUrl: dbUser?.imageUrl,
      bio: dbUser?.bio,
      location: dbUser?.location,
      isPublic: dbUser?.isPublic ?? true,
      showStats: dbUser?.showStats ?? true,
      showActivity: dbUser?.showActivity ?? true,
      allowMentions: dbUser?.allowMentions ?? true,
      showLocation: dbUser?.showLocation ?? false,
      defaultLocation: dbUser?.defaultLocation,
      autoDetectLocation: dbUser?.autoDetectLocation ?? false,
      createdAt: dbUser?.createdAt,
      updatedAt: dbUser?.updatedAt,
    };
  }),

  // Update user profile
  updateProfile: rateLimitedProcedure
    .input(
      z.object({
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        bio: z.string().max(500).optional(),
        location: z.string().max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }
      const userId = ctx.userId;

      // Update user in database
      const updatedUser = await db.user.upsert({
        where: { id: userId },
        create: {
          id: userId,
          email: '', // Will be updated with actual email from Clerk
          firstName: input.firstName,
          lastName: input.lastName,
          bio: input.bio,
          location: input.location,
        },
        update: {
          firstName: input.firstName,
          lastName: input.lastName,
          bio: input.bio,
          location: input.location,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          bio: true,
          location: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return updatedUser;
    }),

  // Update privacy settings
  updatePrivacySettings: rateLimitedProcedure
    .input(
      z.object({
        isPublic: z.boolean().optional(),
        showStats: z.boolean().optional(),
        showActivity: z.boolean().optional(),
        allowMentions: z.boolean().optional(),
        showLocation: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }
      const userId = ctx.userId;

      // Update privacy settings
      const updatedUser = await db.user.upsert({
        where: { id: userId },
        create: {
          id: userId,
          email: '', // Will be updated with actual email from Clerk
          isPublic: input.isPublic,
          showStats: input.showStats,
          showActivity: input.showActivity,
          allowMentions: input.allowMentions,
          showLocation: input.showLocation,
        },
        update: {
          isPublic: input.isPublic,
          showStats: input.showStats,
          showActivity: input.showActivity,
          allowMentions: input.allowMentions,
          showLocation: input.showLocation,
        },
        select: {
          id: true,
          isPublic: true,
          showStats: true,
          showActivity: true,
          allowMentions: true,
          showLocation: true,
        },
      });

      return updatedUser;
    }),

  // Update location settings
  updateLocationSettings: rateLimitedProcedure
    .input(
      z.object({
        defaultLocation: z.string().max(100).optional(),
        autoDetectLocation: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }
      const userId = ctx.userId;

      // Update location settings
      const updatedUser = await db.user.upsert({
        where: { id: userId },
        create: {
          id: userId,
          email: '', // Will be updated with actual email from Clerk
          defaultLocation: input.defaultLocation,
          autoDetectLocation: input.autoDetectLocation,
        },
        update: {
          defaultLocation: input.defaultLocation,
          autoDetectLocation: input.autoDetectLocation,
        },
        select: {
          id: true,
          defaultLocation: true,
          autoDetectLocation: true,
        },
      });

      return updatedUser;
    }),
});
