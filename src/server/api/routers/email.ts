import { z } from 'zod';
import {
  createTRPCRouter,
  rateLimitedProcedure,
  publicProcedure,
} from '~/server/api/trpc';
import { EmailService } from '~/lib/email/service';
import { TRPCError } from '@trpc/server';
import { db } from '~/lib/db';

export const emailRouter = createTRPCRouter({
  // Send test email (development only)
  sendTestEmail: rateLimitedProcedure
    .input(
      z.object({
        template: z.enum([
          'welcome',
          'verification',
          'password-reset',
          'campaign-update',
        ]),
        to: z.string().email().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      if (process.env.NODE_ENV === 'production') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Test emails are only available in development',
        });
      }

      const userEmail = input.to;
      if (!userEmail) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No email address provided',
        });
      }

      const firstName = 'Test User';

      try {
        let result;
        switch (input.template) {
          case 'welcome':
            result = await EmailService.sendWelcomeEmail({
              to: userEmail,
              firstName,
              city: 'Test City',
              verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=test`,
            });
            break;
          case 'verification':
            result = await EmailService.sendVerificationEmail({
              to: userEmail,
              firstName,
              verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=test`,
            });
            break;
          case 'password-reset':
            result = await EmailService.sendPasswordResetEmail({
              to: userEmail,
              firstName,
              resetUrl: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=test`,
              ipAddress: '127.0.0.1',
              userAgent: 'Test Browser',
            });
            break;
          case 'campaign-update':
            result = await EmailService.sendCampaignUpdateEmail({
              to: userEmail,
              firstName,
              campaignTitle: 'Test Campaign',
              updateType: 'milestone',
              updateMessage: 'Your campaign reached 100 votes!',
              campaignUrl: `${process.env.NEXT_PUBLIC_APP_URL}/campaigns/test`,
              voteCount: 100,
              supportPercentage: 75,
              unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?token=test`,
            });
            break;
        }

        return {
          success: true,
          emailId: result?.data?.id,
          message: `Test ${input.template} email sent to ${userEmail}`,
        };
      } catch (error) {
        console.error('Failed to send test email:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send test email',
        });
      }
    }),

  // Get email preferences
  getEmailPreferences: rateLimitedProcedure.query(async ({ ctx }) => {
    if (!ctx.userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    const userId = ctx.userId;

    // Check if user has email preferences in database
    const preferences = await db.userPreferences.findUnique({
      where: { userId },
      select: {
        emailNotifications: true,
        campaignUpdates: true,
        weeklyDigest: true,
        marketingEmails: true,
      },
    });

    // Return defaults if no preferences found
    return (
      preferences || {
        emailNotifications: true,
        campaignUpdates: true,
        weeklyDigest: false,
        marketingEmails: false,
      }
    );
  }),

  // Update email preferences
  updateEmailPreferences: rateLimitedProcedure
    .input(
      z.object({
        emailNotifications: z.boolean().optional(),
        campaignUpdates: z.boolean().optional(),
        weeklyDigest: z.boolean().optional(),
        marketingEmails: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }
      const userId = ctx.userId;

      const preferences = await db.userPreferences.upsert({
        where: { userId },
        update: input,
        create: {
          userId,
          ...input,
        },
      });

      return preferences;
    }),

  // Unsubscribe from emails
  unsubscribe: publicProcedure
    .input(
      z.object({
        token: z.string(),
        type: z.enum(['all', 'campaign', 'marketing', 'digest']).optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Decode and verify unsubscribe token
      // In production, this should verify a JWT or lookup a secure token
      try {
        // For now, we'll use a simple base64 encoded userId
        const decoded = Buffer.from(input.token, 'base64').toString('utf-8');
        const userId = decoded.split(':')[0];

        if (!userId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid unsubscribe token',
          });
        }

        const updateData: Record<string, boolean> = {};
        switch (input.type) {
          case 'campaign':
            updateData.campaignUpdates = false;
            break;
          case 'marketing':
            updateData.marketingEmails = false;
            break;
          case 'digest':
            updateData.weeklyDigest = false;
            break;
          case 'all':
          default:
            updateData.emailNotifications = false;
            updateData.campaignUpdates = false;
            updateData.weeklyDigest = false;
            updateData.marketingEmails = false;
            break;
        }

        await db.userPreferences.upsert({
          where: { userId },
          update: updateData,
          create: {
            userId,
            ...updateData,
          },
        });

        return {
          success: true,
          message:
            input.type === 'all'
              ? 'You have been unsubscribed from all emails'
              : `You have been unsubscribed from ${input.type} emails`,
        };
      } catch (_error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid or expired unsubscribe token',
        });
      }
    }),

  // Send campaign notification emails (internal use)
  sendCampaignNotification: rateLimitedProcedure
    .input(
      z.object({
        campaignId: z.string(),
        updateType: z.enum([
          'status_change',
          'new_vote',
          'comment',
          'milestone',
        ]),
        message: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      // This would be called by other parts of the app when campaign events occur
      // For now, we'll just validate the user has permission
      const campaign = await db.campaign.findUnique({
        where: { id: input.campaignId },
        include: {
          creator: true,
          votes: {
            include: {
              user: true,
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

      // Check if user is creator or admin
      if (campaign.creatorId !== ctx.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only campaign creators can send notifications',
        });
      }

      // Calculate vote statistics
      const voteCount = campaign.votes.length;
      const supportVotes = campaign.votes.filter(
        (v) => v.type === 'SUPPORT'
      ).length;
      const supportPercentage =
        voteCount > 0 ? Math.round((supportVotes / voteCount) * 100) : 0;

      // Get unique users who voted (they are following the campaign)
      const voters = campaign.votes.map((v) => v.user);
      const uniqueVoters = voters.filter(
        (voter, index, self) =>
          index === self.findIndex((v) => v.id === voter.id)
      );

      // Get email preferences for voters
      const votersWithPreferences = await Promise.all(
        uniqueVoters.map(async (voter) => {
          const preferences = await db.userPreferences.findUnique({
            where: { userId: voter.id },
          });
          return {
            ...voter,
            emailPreferences: preferences || {
              emailNotifications: true,
              campaignUpdates: true,
            },
          };
        })
      );

      // Send emails to all voters with email notifications enabled
      const emailPromises = votersWithPreferences
        .filter(
          (voter) =>
            voter.emailPreferences.emailNotifications &&
            voter.emailPreferences.campaignUpdates
        )
        .map((voter) => {
          const unsubscribeToken = Buffer.from(
            `${voter.id}:${Date.now()}`,
            'utf-8'
          ).toString('base64');

          return EmailService.sendCampaignUpdateEmail({
            to: voter.email,
            firstName: voter.firstName || 'there',
            campaignTitle: campaign.title,
            updateType: input.updateType,
            updateMessage: input.message,
            campaignUrl: `${process.env.NEXT_PUBLIC_APP_URL}/campaigns/${campaign.id}`,
            voteCount,
            supportPercentage,
            unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?token=${unsubscribeToken}`,
            tags: [
              { name: 'type', value: 'campaign-update' },
              { name: 'campaignId', value: campaign.id },
              { name: 'updateType', value: input.updateType },
            ],
          });
        });

      const results = await Promise.allSettled(emailPromises);
      const successful = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      return {
        success: true,
        sent: successful,
        failed,
        message: `Sent ${successful} emails${failed > 0 ? `, ${failed} failed` : ''}`,
      };
    }),
});
