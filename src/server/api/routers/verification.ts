import { z } from 'zod';
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from '~/server/api/trpc';
import { TRPCError } from '@trpc/server';
import {
  VerificationStatus,
  EndorsementStrength,
  PortfolioType,
  VerificationRequestType,
  VerificationRequestStatus,
  VerificationDecision,
  NotificationType,
} from '@prisma/client';

export const verificationRouter = createTRPCRouter({
  // ==========================================
  // Skill Endorsement Procedures
  // ==========================================

  createEndorsement: protectedProcedure
    .input(
      z.object({
        userSkillId: z.string(),
        message: z.string().optional(),
        strength: z
          .nativeEnum(EndorsementStrength)
          .default(EndorsementStrength.GOOD),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userSkillId, message, strength } = input;
      const endorserId = ctx.session.user.id;

      // Check if the user skill exists and get the owner
      const userSkill = await ctx.db.userSkill.findUnique({
        where: { id: userSkillId },
        include: { user: true, skill: true },
      });

      if (!userSkill) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User skill not found',
        });
      }

      // Prevent self-endorsement
      if (userSkill.userId === endorserId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You cannot endorse your own skills',
        });
      }

      // Check if endorsement already exists
      const existingEndorsement = await ctx.db.skillEndorsement.findUnique({
        where: {
          endorserId_userSkillId: {
            endorserId,
            userSkillId,
          },
        },
      });

      if (existingEndorsement) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'You have already endorsed this skill',
        });
      }

      // Create the endorsement
      const endorsement = await ctx.db.skillEndorsement.create({
        data: {
          endorserId,
          userSkillId,
          message,
          strength,
        },
        include: {
          endorser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              imageUrl: true,
            },
          },
        },
      });

      // Update endorsement count on UserSkill
      await ctx.db.userSkill.update({
        where: { id: userSkillId },
        data: {
          endorsements: {
            increment: 1,
          },
        },
      });

      // Create notification for skill owner
      await ctx.db.verificationNotification.create({
        data: {
          verificationRequestId: '', // We'll handle this differently for endorsements
          recipientId: userSkill.userId,
          notificationType: NotificationType.ENDORSEMENT_GIVEN,
          title: 'New Skill Endorsement',
          message: `${ctx.session.user.firstName || 'Someone'} endorsed your ${userSkill.skill.name} skill`,
          actionUrl: `/profile/${userSkill.userId}?tab=skills`,
        },
      });

      return endorsement;
    }),

  getEndorsementsByUserSkill: publicProcedure
    .input(z.object({ userSkillId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.skillEndorsement.findMany({
        where: { userSkillId: input.userSkillId },
        include: {
          endorser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              imageUrl: true,
              trustScore: true,
              isVerified: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }),

  removeEndorsement: protectedProcedure
    .input(z.object({ endorsementId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const endorsement = await ctx.db.skillEndorsement.findUnique({
        where: { id: input.endorsementId },
        include: { userSkill: true },
      });

      if (!endorsement) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Endorsement not found',
        });
      }

      // Only the endorser can remove their endorsement
      if (endorsement.endorserId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only remove your own endorsements',
        });
      }

      // Remove the endorsement
      await ctx.db.skillEndorsement.delete({
        where: { id: input.endorsementId },
      });

      // Update endorsement count
      await ctx.db.userSkill.update({
        where: { id: endorsement.userSkillId },
        data: {
          endorsements: {
            decrement: 1,
          },
        },
      });

      return { success: true };
    }),

  // ==========================================
  // Portfolio Management Procedures
  // ==========================================

  createPortfolioItem: protectedProcedure
    .input(
      z.object({
        userSkillId: z.string(),
        title: z.string(),
        description: z.string().optional(),
        url: z.string().url().optional(),
        fileUrl: z.string().optional(),
        type: z.nativeEnum(PortfolioType),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userSkillId, title, description, url, fileUrl, type } = input;

      // Verify the user owns this skill
      const userSkill = await ctx.db.userSkill.findUnique({
        where: { id: userSkillId },
      });

      if (!userSkill || userSkill.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only add portfolio items to your own skills',
        });
      }

      // Validate URL or file is provided based on type
      if (type === PortfolioType.LINK && !url) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'URL is required for link portfolio items',
        });
      }

      if (type === PortfolioType.FILE && !fileUrl) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'File URL is required for file portfolio items',
        });
      }

      return ctx.db.skillPortfolio.create({
        data: {
          userSkillId,
          title,
          description,
          url,
          fileUrl,
          type,
        },
      });
    }),

  getPortfolioByUserSkill: publicProcedure
    .input(z.object({ userSkillId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.skillPortfolio.findMany({
        where: { userSkillId: input.userSkillId },
        orderBy: { createdAt: 'desc' },
      });
    }),

  updatePortfolioItem: protectedProcedure
    .input(
      z.object({
        portfolioId: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        url: z.string().url().optional(),
        fileUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { portfolioId, ...updateData } = input;

      // Verify ownership
      const portfolio = await ctx.db.skillPortfolio.findUnique({
        where: { id: portfolioId },
        include: { userSkill: true },
      });

      if (!portfolio || portfolio.userSkill.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only update your own portfolio items',
        });
      }

      return ctx.db.skillPortfolio.update({
        where: { id: portfolioId },
        data: updateData,
      });
    }),

  deletePortfolioItem: protectedProcedure
    .input(z.object({ portfolioId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const portfolio = await ctx.db.skillPortfolio.findUnique({
        where: { id: input.portfolioId },
        include: { userSkill: true },
      });

      if (!portfolio || portfolio.userSkill.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only delete your own portfolio items',
        });
      }

      await ctx.db.skillPortfolio.delete({
        where: { id: input.portfolioId },
      });

      return { success: true };
    }),

  // ==========================================
  // Verification Request Procedures
  // ==========================================

  requestVerification: protectedProcedure
    .input(
      z.object({
        userSkillId: z.string(),
        requestType: z
          .nativeEnum(VerificationRequestType)
          .default(VerificationRequestType.SELF_VERIFICATION),
        message: z.string().optional(),
        evidence: z.any().optional(), // JSON object with evidence links/files
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userSkillId, requestType, message, evidence } = input;

      // Verify the user owns this skill
      const userSkill = await ctx.db.userSkill.findUnique({
        where: { id: userSkillId },
        include: { skill: true },
      });

      if (!userSkill || userSkill.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only request verification for your own skills',
        });
      }

      // Check if there's already a pending request
      const existingRequest = await ctx.db.skillVerificationRequest.findFirst({
        where: {
          userSkillId,
          status: {
            in: [
              VerificationRequestStatus.PENDING,
              VerificationRequestStatus.IN_REVIEW,
            ],
          },
        },
      });

      if (existingRequest) {
        throw new TRPCError({
          code: 'CONFLICT',
          message:
            'There is already a pending verification request for this skill',
        });
      }

      const request = await ctx.db.skillVerificationRequest.create({
        data: {
          userSkillId,
          requestedBy: ctx.session.user.id,
          requestType,
          message,
          evidence,
        },
      });

      // Update user skill status
      await ctx.db.userSkill.update({
        where: { id: userSkillId },
        data: {
          verificationStatus: VerificationStatus.PENDING_REVIEW,
        },
      });

      // Create notification for admins (simplified - in real implementation, you'd have admin role checks)
      // For now, we'll create a generic notification
      await ctx.db.verificationNotification.create({
        data: {
          verificationRequestId: request.id,
          recipientId: ctx.session.user.id, // Placeholder - should be admin
          notificationType: NotificationType.REQUEST_RECEIVED,
          title: 'Verification Request Submitted',
          message: `Your verification request for ${userSkill.skill.name} has been submitted for review`,
          actionUrl: `/verification/requests/${request.id}`,
        },
      });

      return request;
    }),

  getVerificationRequests: protectedProcedure
    .input(
      z.object({
        status: z.nativeEnum(VerificationRequestStatus).optional(),
        userId: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const { status, userId, limit, offset } = input;

      const where: any = {};

      if (status) {
        where.status = status;
      }

      if (userId) {
        where.requestedBy = userId;
      } else {
        // If no specific user, only show current user's requests (unless admin)
        where.requestedBy = ctx.session.user.id;
      }

      return ctx.db.skillVerificationRequest.findMany({
        where,
        include: {
          userSkill: {
            include: {
              skill: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  imageUrl: true,
                },
              },
            },
          },
          requester: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              imageUrl: true,
            },
          },
          adminAssigned: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });
    }),

  getVerificationRequestById: protectedProcedure
    .input(z.object({ requestId: z.string() }))
    .query(async ({ ctx, input }) => {
      const request = await ctx.db.skillVerificationRequest.findUnique({
        where: { id: input.requestId },
        include: {
          userSkill: {
            include: {
              skill: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  imageUrl: true,
                },
              },
              skillEndorsements: {
                include: {
                  endorser: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      imageUrl: true,
                      trustScore: true,
                    },
                  },
                },
              },
              skillPortfolios: true,
            },
          },
          requester: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              imageUrl: true,
            },
          },
          adminAssigned: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!request) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Verification request not found',
        });
      }

      // Check if user has permission to view this request
      if (
        request.requestedBy !== ctx.session.user.id &&
        request.adminAssignedTo !== ctx.session.user.id
        // Add admin role check here in real implementation
      ) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message:
            "You don't have permission to view this verification request",
        });
      }

      return request;
    }),

  // Admin procedures (simplified - in real implementation, add role-based auth)
  reviewVerificationRequest: protectedProcedure
    .input(
      z.object({
        requestId: z.string(),
        decision: z.nativeEnum(VerificationDecision),
        decisionReason: z.string().optional(),
        reviewNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { requestId, decision, decisionReason, reviewNotes } = input;

      // In a real implementation, check if user has admin role
      // For now, we'll allow the operation

      const request = await ctx.db.skillVerificationRequest.findUnique({
        where: { id: requestId },
        include: { userSkill: { include: { skill: true, user: true } } },
      });

      if (!request) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Verification request not found',
        });
      }

      // Update the request
      const updatedRequest = await ctx.db.skillVerificationRequest.update({
        where: { id: requestId },
        data: {
          status: VerificationRequestStatus.COMPLETED,
          decision,
          decisionReason,
          reviewNotes,
          reviewedAt: new Date(),
          adminAssignedTo: ctx.session.user.id,
        },
      });

      // Update the user skill based on decision
      let verificationStatus: VerificationStatus;
      let isVerified = false;

      if (decision === VerificationDecision.APPROVED) {
        verificationStatus = VerificationStatus.VERIFIED;
        isVerified = true;
      } else if (decision === VerificationDecision.REJECTED) {
        verificationStatus = VerificationStatus.REJECTED;
      } else {
        verificationStatus = VerificationStatus.PENDING_REVIEW;
      }

      await ctx.db.userSkill.update({
        where: { id: request.userSkillId },
        data: {
          verificationStatus,
          isVerified,
          verifiedAt: isVerified ? new Date() : null,
          verifiedBy: isVerified ? ctx.session.user.id : null,
        },
      });

      // Create notification for the requester
      const notificationType =
        decision === VerificationDecision.APPROVED
          ? NotificationType.VERIFICATION_APPROVED
          : NotificationType.VERIFICATION_REJECTED;

      await ctx.db.verificationNotification.create({
        data: {
          verificationRequestId: requestId,
          recipientId: request.requestedBy,
          notificationType,
          title:
            decision === VerificationDecision.APPROVED
              ? 'Skill Verification Approved'
              : 'Skill Verification Update',
          message:
            decision === VerificationDecision.APPROVED
              ? `Your ${request.userSkill.skill.name} skill has been verified!`
              : `Your verification request for ${request.userSkill.skill.name} needs attention`,
          actionUrl: `/profile/${request.userSkill.userId}?tab=skills`,
        },
      });

      return updatedRequest;
    }),

  // ==========================================
  // Notification Procedures
  // ==========================================

  getNotifications: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
        unreadOnly: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, offset, unreadOnly } = input;

      const where: any = {
        recipientId: ctx.session.user.id,
      };

      if (unreadOnly) {
        where.isRead = false;
      }

      return ctx.db.verificationNotification.findMany({
        where,
        include: {
          verificationRequest: {
            include: {
              userSkill: {
                include: {
                  skill: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });
    }),

  markNotificationAsRead: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const notification = await ctx.db.verificationNotification.findUnique({
        where: { id: input.notificationId },
      });

      if (!notification || notification.recipientId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only mark your own notifications as read',
        });
      }

      return ctx.db.verificationNotification.update({
        where: { id: input.notificationId },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    }),

  markAllNotificationsAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    return ctx.db.verificationNotification.updateMany({
      where: {
        recipientId: ctx.session.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }),

  // ==========================================
  // Stats and Analytics
  // ==========================================

  getVerificationStats: protectedProcedure
    .input(z.object({ userId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const userId = input.userId || ctx.session.user.id;

      // Get verification stats for the user
      const userSkills = await ctx.db.userSkill.findMany({
        where: { userId },
        include: {
          skillEndorsements: true,
          skillPortfolios: true,
        },
      });

      const totalSkills = userSkills.length;
      const verifiedSkills = userSkills.filter(
        (skill) => skill.isVerified
      ).length;
      const pendingVerification = userSkills.filter(
        (skill) =>
          skill.verificationStatus === VerificationStatus.PENDING_REVIEW
      ).length;
      const totalEndorsements = userSkills.reduce(
        (sum, skill) => sum + skill.skillEndorsements.length,
        0
      );
      const totalPortfolioItems = userSkills.reduce(
        (sum, skill) => sum + skill.skillPortfolios.length,
        0
      );

      return {
        totalSkills,
        verifiedSkills,
        pendingVerification,
        totalEndorsements,
        totalPortfolioItems,
        verificationRate:
          totalSkills > 0 ? (verifiedSkills / totalSkills) * 100 : 0,
      };
    }),
});
