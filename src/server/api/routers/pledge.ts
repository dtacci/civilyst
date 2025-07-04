import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  rateLimitedProcedure,
} from '~/server/api/trpc';
import { db } from '~/server/db';
import { PledgeStatus } from '~/generated/prisma';

// Input validation schemas
const createPledgeSchema = z.object({
  projectId: z.string().cuid(),
  amount: z.number().min(100).max(5000),
  paymentMethod: z.string().optional(),
});

const updatePledgeStatusSchema = z.object({
  pledgeId: z.string().cuid(),
  status: z.nativeEnum(PledgeStatus),
  paymentIntentId: z.string().optional(),
  escrowRef: z.string().optional(),
});

const refundPledgeSchema = z.object({
  pledgeId: z.string().cuid(),
  reason: z.string().optional(),
});

export const pledgeRouter = createTRPCRouter({
  // Create a new pledge
  create: rateLimitedProcedure
    .input(createPledgeSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      // Verify project exists and is active
      const project = await db.project.findUnique({
        where: { id: input.projectId },
        select: {
          id: true,
          status: true,
          fundingDeadline: true,
          fundingGoal: true,
          pledges: {
            where: { status: 'COMPLETED' },
            select: { amount: true },
          },
        },
      });

      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      if (project.status !== 'ACTIVE') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Project is not accepting pledges',
        });
      }

      if (new Date() > project.fundingDeadline) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Project funding deadline has passed',
        });
      }

      // Calculate current funding
      const currentFunding = project.pledges.reduce(
        (sum, pledge) => sum + pledge.amount,
        0
      );

      if (currentFunding + input.amount > project.fundingGoal) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Pledge amount would exceed funding goal. Maximum pledge allowed: $${
            project.fundingGoal - currentFunding
          }`,
        });
      }

      // Create the pledge
      const pledge = await db.pledge.create({
        data: {
          userId: ctx.userId,
          projectId: input.projectId,
          amount: input.amount,
          paymentMethod: input.paymentMethod,
          status: 'PENDING',
        },
        include: {
          project: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      return pledge;
    }),

  // Get pledges by user
  getByUser: protectedProcedure
    .input(
      z.object({
        userId: z.string().cuid().optional(),
        status: z.nativeEnum(PledgeStatus).optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = input.userId || ctx.userId;

      // Users can only view their own pledges unless they're admins
      if (userId !== ctx.userId && !ctx.isAdmin) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const [pledges, total] = await Promise.all([
        db.pledge.findMany({
          where: {
            userId,
            ...(input.status && { status: input.status }),
          },
          include: {
            project: {
              select: {
                id: true,
                title: true,
                status: true,
                fundingGoal: true,
                fundingDeadline: true,
                campaign: {
                  select: {
                    id: true,
                    imageUrl: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: input.limit,
          skip: input.offset,
        }),
        db.pledge.count({
          where: {
            userId,
            ...(input.status && { status: input.status }),
          },
        }),
      ]);

      return {
        pledges,
        total,
        hasMore: input.offset + pledges.length < total,
      };
    }),

  // Get pledges by project
  getByProject: publicProcedure
    .input(
      z.object({
        projectId: z.string().cuid(),
        status: z.nativeEnum(PledgeStatus).optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const [pledges, total, summary] = await Promise.all([
        db.pledge.findMany({
          where: {
            projectId: input.projectId,
            ...(input.status && { status: input.status }),
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                imageUrl: true,
                isPublic: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: input.limit,
          skip: input.offset,
        }),
        db.pledge.count({
          where: {
            projectId: input.projectId,
            ...(input.status && { status: input.status }),
          },
        }),
        db.pledge.aggregate({
          where: {
            projectId: input.projectId,
            status: 'COMPLETED',
          },
          _sum: {
            amount: true,
          },
          _count: true,
        }),
      ]);

      // Anonymize non-public users
      const sanitizedPledges = pledges.map((pledge) => ({
        ...pledge,
        user: pledge.user.isPublic
          ? pledge.user
          : {
              id: pledge.user.id,
              firstName: 'Anonymous',
              lastName: 'Backer',
              imageUrl: null,
              isPublic: false,
            },
      }));

      return {
        pledges: sanitizedPledges,
        total,
        totalFunded: summary._sum.amount || 0,
        backerCount: summary._count,
        hasMore: input.offset + pledges.length < total,
      };
    }),

  // Update pledge status (admin or payment webhook)
  updateStatus: protectedProcedure
    .input(updatePledgeStatusSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify the pledge exists and user has permission
      const pledge = await db.pledge.findUnique({
        where: { id: input.pledgeId },
        select: {
          id: true,
          userId: true,
          status: true,
          amount: true,
          projectId: true,
        },
      });

      if (!pledge) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Pledge not found',
        });
      }

      // Only the pledge owner or admins can update status
      if (pledge.userId !== ctx.userId && !ctx.isAdmin) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      // Validate status transitions
      const validTransitions: Record<PledgeStatus, PledgeStatus[]> = {
        PENDING: ['COMPLETED', 'FAILED', 'CANCELLED'],
        COMPLETED: ['REFUNDED'],
        FAILED: ['PENDING'],
        REFUNDED: [],
        CANCELLED: [],
      };

      if (!validTransitions[pledge.status].includes(input.status)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Invalid status transition from ${pledge.status} to ${input.status}`,
        });
      }

      // Update the pledge
      const updatedPledge = await db.pledge.update({
        where: { id: input.pledgeId },
        data: {
          status: input.status,
          ...(input.paymentIntentId && {
            paymentIntentId: input.paymentIntentId,
          }),
          ...(input.escrowRef && { escrowRef: input.escrowRef }),
          ...(input.status === 'COMPLETED' && { completedAt: new Date() }),
          ...(input.status === 'REFUNDED' && { refundedAt: new Date() }),
        },
        include: {
          project: {
            select: {
              id: true,
              title: true,
              fundingGoal: true,
            },
          },
        },
      });

      // Check if project is fully funded after this pledge completion
      if (input.status === 'COMPLETED') {
        const fundingStatus = await db.pledge.aggregate({
          where: {
            projectId: pledge.projectId,
            status: 'COMPLETED',
          },
          _sum: {
            amount: true,
          },
        });

        const totalFunded = fundingStatus._sum.amount || 0;
        if (totalFunded >= updatedPledge.project.fundingGoal) {
          // Update project status to FUNDED
          await db.project.update({
            where: { id: pledge.projectId },
            data: { status: 'FUNDED' },
          });
        }
      }

      return updatedPledge;
    }),

  // Refund a pledge
  refund: protectedProcedure
    .input(refundPledgeSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify the pledge exists and can be refunded
      const pledge = await db.pledge.findUnique({
        where: { id: input.pledgeId },
        select: {
          id: true,
          userId: true,
          status: true,
          amount: true,
          projectId: true,
          escrowRef: true,
        },
      });

      if (!pledge) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Pledge not found',
        });
      }

      // Only admins can process refunds
      if (!ctx.isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only administrators can process refunds',
        });
      }

      if (pledge.status !== 'COMPLETED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only completed pledges can be refunded',
        });
      }

      // TODO: Initiate refund with payment provider
      // This would typically involve calling the payment provider's API
      // For now, we'll just update the status

      const refundedPledge = await db.pledge.update({
        where: { id: input.pledgeId },
        data: {
          status: 'REFUNDED',
          refundedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          project: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      // TODO: Send refund confirmation email
      // await sendRefundEmail(refundedPledge.user.email, refundedPledge);

      return refundedPledge;
    }),

  // Get pledge statistics
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const stats = await db.pledge.aggregate({
      where: { userId: ctx.userId },
      _sum: {
        amount: true,
      },
      _count: {
        _all: true,
      },
    });

    const statusCounts = await db.pledge.groupBy({
      by: ['status'],
      where: { userId: ctx.userId },
      _count: true,
    });

    return {
      totalPledged: stats._sum.amount || 0,
      totalPledges: stats._count._all,
      pledgesByStatus: statusCounts.reduce(
        (acc, curr) => ({
          ...acc,
          [curr.status]: curr._count,
        }),
        {} as Record<PledgeStatus, number>
      ),
    };
  }),
});
