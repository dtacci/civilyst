import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';
import { TRPCError } from '@trpc/server';
import { aiClient } from '~/lib/ai/client';
import {
  generateSuggestionRequestSchema,
  moderateContentRequestSchema,
  generateSummaryRequestSchema,
  analyzeImageRequestSchema,
  translateContentRequestSchema,
  analyzeSentimentRequestSchema,
  batchModerationRequestSchema,
} from '~/lib/ai/types';

export const aiRouter = createTRPCRouter({
  // Generate content suggestions for a campaign
  generateSuggestion: protectedProcedure
    .input(generateSuggestionRequestSchema)
    .mutation(async ({ ctx, input }) => {
      // Fetch campaign data
      const campaign = await ctx.db.campaign.findUnique({
        where: { id: input.campaignId },
        select: {
          id: true,
          title: true,
          description: true,
          city: true,
          state: true,
          address: true,
        },
      });

      if (!campaign) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Campaign not found',
        });
      }

      // Generate suggestion using AI
      const suggestion = await aiClient.generateContentSuggestion(
        {
          title: campaign.title,
          description: campaign.description,
          location: [campaign.address, campaign.city, campaign.state]
            .filter(Boolean)
            .join(', '),
        },
        input.suggestionType
      );

      // Save suggestion to database
      const savedSuggestion = await ctx.db.contentSuggestion.create({
        data: {
          campaignId: input.campaignId,
          suggestionType: input.suggestionType,
          content: suggestion.suggestion,
          confidence: suggestion.confidence,
        },
      });

      return savedSuggestion;
    }),

  // Get suggestions for a campaign
  getSuggestions: protectedProcedure
    .input(z.object({ campaignId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.contentSuggestion.findMany({
        where: { campaignId: input.campaignId },
        orderBy: [{ confidence: 'desc' }, { createdAt: 'desc' }],
      });
    }),

  // Apply a suggestion to a campaign
  applySuggestion: protectedProcedure
    .input(z.object({ suggestionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.contentSuggestion.update({
        where: { id: input.suggestionId },
        data: { isApplied: true },
      });
    }),

  // Moderate content
  moderateContent: protectedProcedure
    .input(moderateContentRequestSchema)
    .mutation(async ({ ctx, input }) => {
      // Perform AI moderation
      const moderation = await aiClient.moderateContent(input.content);

      // Determine moderation status
      let moderationStatus: 'approved' | 'rejected' | 'manual_review';
      if (moderation.safetyScore < 0.5 || moderation.flaggedIssues.length > 0) {
        moderationStatus = 'rejected';
      } else if (
        moderation.safetyScore < 0.8 ||
        moderation.qualityScore < 0.6
      ) {
        moderationStatus = 'manual_review';
      } else {
        moderationStatus = 'approved';
      }

      // Save moderation result
      const savedModeration = await ctx.db.contentModeration.create({
        data: {
          contentId: input.contentId,
          contentType: input.contentType,
          safetyScore: moderation.safetyScore,
          qualityScore: moderation.qualityScore,
          flaggedIssues: moderation.flaggedIssues,
          moderationStatus,
        },
      });

      return savedModeration;
    }),

  // Batch moderate content
  batchModerateContent: protectedProcedure
    .input(batchModerationRequestSchema)
    .mutation(async ({ ctx, input }) => {
      const results = await Promise.allSettled(
        input.items.map((item) =>
          aiClient.moderateContent(item.content).then((moderation) => ({
            ...item,
            moderation,
          }))
        )
      );

      const successful = [];
      const failed = [];

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const item = input.items[i];

        if (result.status === 'fulfilled') {
          const moderation = result.value.moderation;
          let moderationStatus: 'approved' | 'rejected' | 'manual_review';

          if (
            moderation.safetyScore < 0.5 ||
            moderation.flaggedIssues.length > 0
          ) {
            moderationStatus = 'rejected';
          } else if (
            moderation.safetyScore < 0.8 ||
            moderation.qualityScore < 0.6
          ) {
            moderationStatus = 'manual_review';
          } else {
            moderationStatus = 'approved';
          }

          const saved = await ctx.db.contentModeration.create({
            data: {
              contentId: item!.contentId,
              contentType: item!.contentType,
              safetyScore: moderation.safetyScore,
              qualityScore: moderation.qualityScore,
              flaggedIssues: moderation.flaggedIssues,
              moderationStatus,
            },
          });

          successful.push(saved);
        } else {
          failed.push({
            input: item,
            error: result.reason?.message || 'Unknown error',
          });
        }
      }

      return {
        successful,
        failed,
        totalProcessingTime: 0, // Would track actual time in production
      };
    }),

  // Generate campaign summary
  generateSummary: protectedProcedure
    .input(generateSummaryRequestSchema)
    .mutation(async ({ ctx, input }) => {
      // Fetch campaign data with related content
      const campaign = await ctx.db.campaign.findUnique({
        where: { id: input.campaignId },
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

      if (!campaign) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Campaign not found',
        });
      }

      // Calculate vote counts
      const voteCount = campaign.votes
        ? {
            support: campaign.votes.filter((v) => v.type === 'SUPPORT').length,
            oppose: campaign.votes.filter((v) => v.type === 'OPPOSE').length,
          }
        : undefined;

      // Generate summary using AI
      const summary = await aiClient.generateCampaignSummary({
        title: campaign.title,
        description: campaign.description,
        comments: campaign.comments?.map((c) => c.content),
        voteCount,
      });

      // Save or update summary
      const savedSummary = await ctx.db.campaignSummary.upsert({
        where: { campaignId: input.campaignId },
        create: {
          campaignId: input.campaignId,
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

      return savedSummary;
    }),

  // Get campaign summary
  getSummary: protectedProcedure
    .input(z.object({ campaignId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.campaignSummary.findUnique({
        where: { campaignId: input.campaignId },
      });
    }),

  // Analyze image for accessibility
  analyzeImage: protectedProcedure
    .input(analyzeImageRequestSchema)
    .mutation(async ({ ctx, input }) => {
      // Analyze image using AI
      const analysis = await aiClient.analyzeImage(input.imageUrl);

      // Check if content is appropriate
      if (analysis.hasInappropriateContent) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Image contains inappropriate content',
        });
      }

      // Save accessibility enhancement
      const enhancement = await ctx.db.accessibilityEnhancement.create({
        data: {
          contentId: input.contentId,
          contentType: 'image',
          altText: analysis.altText,
        },
      });

      return enhancement;
    }),

  // Translate content
  translateContent: protectedProcedure
    .input(translateContentRequestSchema)
    .mutation(async ({ ctx, input }) => {
      // Get original content based on type
      let originalText = '';

      if (input.contentType === 'campaign') {
        const campaign = await ctx.db.campaign.findUnique({
          where: { id: input.contentId },
          select: { title: true, description: true },
        });
        if (campaign) {
          originalText = `${campaign.title}\n\n${campaign.description}`;
        }
      } else if (input.contentType === 'comment') {
        const comment = await ctx.db.comment.findUnique({
          where: { id: input.contentId },
          select: { content: true },
        });
        if (comment) {
          originalText = comment.content;
        }
      }

      if (!originalText) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Content not found',
        });
      }

      // Translate using AI
      const translatedText = await aiClient.translateText(
        originalText,
        input.targetLanguage,
        input.sourceLanguage
      );

      // Save translation
      const translation = await ctx.db.translation.create({
        data: {
          contentId: input.contentId,
          contentType: input.contentType,
          sourceLanguage: input.sourceLanguage || 'en',
          targetLanguage: input.targetLanguage,
          originalText,
          translatedText,
        },
      });

      return translation;
    }),

  // Get translations for content
  getTranslations: protectedProcedure
    .input(
      z.object({
        contentId: z.string(),
        contentType: z.enum(['campaign', 'comment', 'update']),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.translation.findMany({
        where: {
          contentId: input.contentId,
          contentType: input.contentType,
        },
        orderBy: { createdAt: 'desc' },
      });
    }),

  // Analyze sentiment
  analyzeSentiment: protectedProcedure
    .input(analyzeSentimentRequestSchema)
    .mutation(async ({ ctx, input }) => {
      // Analyze sentiment using AI
      const analysis = await aiClient.analyzeSentiment(input.content);

      // Save sentiment analysis
      const sentiment = await ctx.db.sentimentAnalysis.create({
        data: {
          contentId: input.contentId,
          contentType: input.contentType,
          sentiment: analysis.sentiment,
          emotions: analysis.emotions,
          keywords: analysis.keywords,
        },
      });

      return sentiment;
    }),

  // Get sentiment analysis
  getSentimentAnalysis: protectedProcedure
    .input(
      z.object({
        contentId: z.string(),
        contentType: z.enum(['campaign', 'comment', 'update']),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.sentimentAnalysis.findFirst({
        where: {
          contentId: input.contentId,
          contentType: input.contentType,
        },
        orderBy: { createdAt: 'desc' },
      });
    }),

  // Get AI enhancement stats for a campaign
  getEnhancementStats: protectedProcedure
    .input(z.object({ campaignId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [suggestions, summary, moderations, translations, sentiments] =
        await Promise.all([
          ctx.db.contentSuggestion.count({
            where: { campaignId: input.campaignId },
          }),
          ctx.db.campaignSummary.findUnique({
            where: { campaignId: input.campaignId },
          }),
          ctx.db.contentModeration.count({
            where: {
              contentId: input.campaignId,
              contentType: 'campaign',
            },
          }),
          ctx.db.translation.count({
            where: {
              contentId: input.campaignId,
              contentType: 'campaign',
            },
          }),
          ctx.db.sentimentAnalysis.findFirst({
            where: {
              contentId: input.campaignId,
              contentType: 'campaign',
            },
            orderBy: { createdAt: 'desc' },
          }),
        ]);

      return {
        suggestionsCount: suggestions,
        hasSummary: !!summary,
        moderationsCount: moderations,
        translationsCount: translations,
        latestSentiment: sentiments?.sentiment,
      };
    }),

  // Get moderation queue for admin review
  getModerationQueue: protectedProcedure
    .input(
      z.object({
        status: z.enum(['manual_review', 'rejected', 'all']).optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const whereClause =
        input.status && input.status !== 'all'
          ? { moderationStatus: input.status }
          : {};

      const items = await ctx.db.contentModeration.findMany({
        where: whereClause,
        take: input.limit,
        skip: input.offset,
        orderBy: { createdAt: 'desc' },
        include: {
          // We'll need to add a way to get the actual content
          // This would require conditional joins based on contentType
        },
      });

      // For each item, fetch the actual content based on contentType
      const itemsWithContent = await Promise.all(
        items.map(async (item) => {
          let content = null;

          if (item.contentType === 'campaign') {
            const campaign = await ctx.db.campaign.findUnique({
              where: { id: item.contentId },
              select: {
                title: true,
                description: true,
                creator: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            });
            if (campaign) {
              content = {
                title: campaign.title,
                description: campaign.description,
                author:
                  `${campaign.creator.firstName || ''} ${campaign.creator.lastName || ''}`.trim() ||
                  'Anonymous',
              };
            }
          } else if (item.contentType === 'comment') {
            const comment = await ctx.db.comment.findUnique({
              where: { id: item.contentId },
              select: {
                content: true,
                author: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            });
            if (comment) {
              content = {
                description: comment.content,
                author:
                  `${comment.author.firstName || ''} ${comment.author.lastName || ''}`.trim() ||
                  'Anonymous',
              };
            }
          }

          return {
            ...item,
            content,
          };
        })
      );

      const total = await ctx.db.contentModeration.count({
        where: whereClause,
      });

      return {
        items: itemsWithContent,
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),

  // Update moderation status
  updateModerationStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(['approved', 'rejected', 'manual_review']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.contentModeration.update({
        where: { id: input.id },
        data: { moderationStatus: input.status },
      });
    }),
});
