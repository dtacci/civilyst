import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';
import { aiClient } from '~/lib/ai/client';

export const aiJobsRouter = createTRPCRouter({
  // Generate summaries for all active campaigns
  generateActiveCampaignSummaries: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        includeComments: z.boolean().default(true),
        includeVotes: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get active campaigns that either don't have summaries or have old summaries
      const activeCampaigns = await ctx.db.campaign.findMany({
        where: {
          status: 'ACTIVE',
          OR: [
            { summary: null },
            {
              summary: {
                lastGenerated: {
                  lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Older than 24 hours
                },
              },
            },
          ],
        },
        take: input.limit,
        select: {
          id: true,
          title: true,
          description: true,
        },
      });

      const results = {
        successful: [] as string[],
        failed: [] as { campaignId: string; error: string }[],
      };

      // Process each campaign
      for (const campaign of activeCampaigns) {
        try {
          // Fetch additional data if needed
          const campaignWithData = await ctx.db.campaign.findUnique({
            where: { id: campaign.id },
            include: {
              comments: input.includeComments
                ? {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    select: { content: true },
                  }
                : false,
              votes: input.includeVotes
                ? {
                    select: { type: true },
                  }
                : false,
            },
          });

          if (!campaignWithData) continue;

          // Calculate vote counts
          const voteCount = campaignWithData.votes
            ? {
                support: campaignWithData.votes.filter(
                  (v) => v.type === 'SUPPORT'
                ).length,
                oppose: campaignWithData.votes.filter(
                  (v) => v.type === 'OPPOSE'
                ).length,
              }
            : undefined;

          // Generate summary using AI
          const summary = await aiClient.generateCampaignSummary({
            title: campaignWithData.title,
            description: campaignWithData.description,
            comments: campaignWithData.comments?.map((c) => c.content),
            voteCount,
          });

          // Save or update summary
          await ctx.db.campaignSummary.upsert({
            where: { campaignId: campaign.id },
            create: {
              campaignId: campaign.id,
              shortSummary: summary.shortSummary,
              fullSummary: summary.fullSummary,
              keyPoints: summary.keyPoints,
            },
            update: {
              shortSummary: summary.shortSummary,
              fullSummary: summary.fullSummary,
              keyPoints: summary.keyPoints,
              lastGenerated: new Date(),
            },
          });

          results.successful.push(campaign.id);
        } catch (_error) {
          results.failed.push({
            campaignId: campaign.id,
            error: _error instanceof Error ? _error.message : 'Unknown error',
          });
        }
      }

      return results;
    }),

  // Analyze sentiment for recent comments
  analyzeRecentCommentSentiment: protectedProcedure
    .input(
      z.object({
        hoursBack: z.number().min(1).max(168).default(24), // Max 1 week
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const cutoffDate = new Date(
        Date.now() - input.hoursBack * 60 * 60 * 1000
      );

      // Get recent comments without sentiment analysis
      const recentComments = await ctx.db.comment.findMany({
        where: {
          createdAt: { gte: cutoffDate },
          sentimentAnalysis: null,
        },
        take: input.limit,
        select: {
          id: true,
          content: true,
        },
      });

      const results = {
        successful: 0,
        failed: 0,
      };

      // Analyze each comment
      for (const comment of recentComments) {
        try {
          const analysis = await aiClient.analyzeSentiment(comment.content);

          await ctx.db.sentimentAnalysis.create({
            data: {
              contentId: comment.id,
              contentType: 'comment',
              sentiment: analysis.sentiment,
              emotions: analysis.emotions,
              keywords: analysis.keywords,
            },
          });

          results.successful++;
        } catch (_error) {
          results.failed++;
        }
      }

      return results;
    }),

  // Get job statistics
  getJobStatistics: protectedProcedure.query(async ({ ctx }) => {
    const [
      totalCampaigns,
      campaignsWithSummaries,
      recentSummaries,
      totalComments,
      analyzedComments,
      recentAnalyses,
    ] = await Promise.all([
      ctx.db.campaign.count({ where: { status: 'ACTIVE' } }),
      ctx.db.campaignSummary.count(),
      ctx.db.campaignSummary.count({
        where: {
          lastGenerated: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
      ctx.db.comment.count(),
      ctx.db.sentimentAnalysis.count({
        where: { contentType: 'comment' },
      }),
      ctx.db.sentimentAnalysis.count({
        where: {
          contentType: 'comment',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      campaigns: {
        total: totalCampaigns,
        withSummaries: campaignsWithSummaries,
        recentSummaries,
        needingSummaries: totalCampaigns - campaignsWithSummaries,
      },
      comments: {
        total: totalComments,
        analyzed: analyzedComments,
        recentAnalyses,
        needingAnalysis: totalComments - analyzedComments,
      },
    };
  }),

  // Moderate pending content
  moderatePendingContent: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        contentType: z.enum(['campaign', 'comment', 'all']).default('all'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get content that hasn't been moderated
      const contentToModerate: Array<{
        id: string;
        type: 'campaign' | 'comment';
        content: string;
      }> = [];

      if (input.contentType === 'campaign' || input.contentType === 'all') {
        const campaigns = await ctx.db.campaign.findMany({
          where: {
            moderation: null,
          },
          take: input.limit,
          select: {
            id: true,
            title: true,
            description: true,
          },
        });

        contentToModerate.push(
          ...campaigns.map((c) => ({
            id: c.id,
            type: 'campaign' as const,
            content: `${c.title}\n\n${c.description}`,
          }))
        );
      }

      if (input.contentType === 'comment' || input.contentType === 'all') {
        const remainingLimit = input.limit - contentToModerate.length;
        if (remainingLimit > 0) {
          const comments = await ctx.db.comment.findMany({
            where: {
              moderation: null,
            },
            take: remainingLimit,
            select: {
              id: true,
              content: true,
            },
          });

          contentToModerate.push(
            ...comments.map((c) => ({
              id: c.id,
              type: 'comment' as const,
              content: c.content,
            }))
          );
        }
      }

      const results = {
        successful: 0,
        failed: 0,
        flagged: 0,
      };

      // Moderate each piece of content
      for (const item of contentToModerate) {
        try {
          const moderation = await aiClient.moderateContent(item.content);

          let moderationStatus: 'approved' | 'rejected' | 'manual_review';
          if (
            moderation.safetyScore < 0.5 ||
            moderation.flaggedIssues.length > 0
          ) {
            moderationStatus = 'rejected';
            results.flagged++;
          } else if (
            moderation.safetyScore < 0.8 ||
            moderation.qualityScore < 0.6
          ) {
            moderationStatus = 'manual_review';
            results.flagged++;
          } else {
            moderationStatus = 'approved';
          }

          await ctx.db.contentModeration.create({
            data: {
              contentId: item.id,
              contentType: item.type,
              safetyScore: moderation.safetyScore,
              qualityScore: moderation.qualityScore,
              flaggedIssues: moderation.flaggedIssues,
              moderationStatus,
            },
          });

          results.successful++;
        } catch (_error) {
          results.failed++;
        }
      }

      return results;
    }),
});
