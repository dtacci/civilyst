import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from '~/server/api/trpc';
import { db } from '~/server/db';
import { EscrowStatus } from '~/generated/prisma';

// TODO: Replace with actual escrow service integration
// This is a mock implementation for development
class MockEscrowService {
  async createTransaction(
    _amount: number,
    _reference: string
  ): Promise<{ transactionId: string; releaseCode: string }> {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      transactionId: `escrow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      releaseCode: Math.random().toString(36).substr(2, 8).toUpperCase(),
    };
  }

  async releaseTransaction(
    transactionId: string,
    releaseCode: string
  ): Promise<boolean> {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Mock validation - in real implementation would verify with escrow service
    return transactionId.startsWith('escrow_') && releaseCode.length === 8;
  }

  async refundTransaction(transactionId: string): Promise<boolean> {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Mock validation
    return transactionId.startsWith('escrow_');
  }

  async getTransactionStatus(
    _transactionId: string
  ): Promise<{ status: EscrowStatus; amount: number }> {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Mock response
    return {
      status: 'HELD',
      amount: 1000, // Mock amount
    };
  }
}

const escrowService = new MockEscrowService();

// Input validation schemas
const initiateEscrowSchema = z.object({
  pledgeId: z.string().cuid(),
});

const releaseEscrowSchema = z.object({
  milestoneId: z.string().cuid(),
  releaseCode: z.string().min(6),
});

const refundEscrowSchema = z.object({
  transactionId: z.string(),
  reason: z.string().min(10).max(500),
});

export const escrowRouter = createTRPCRouter({
  // Initiate escrow transaction for a pledge
  initiate: protectedProcedure
    .input(initiateEscrowSchema)
    .mutation(async ({ input }) => {
      // Get pledge details
      const pledge = await db.pledge.findUnique({
        where: { id: input.pledgeId },
        select: {
          id: true,
          amount: true,
          status: true,
          userId: true,
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

      if (pledge.status !== 'PENDING') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only pending pledges can be escrowed',
        });
      }

      if (pledge.escrowRef) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Pledge already has an escrow transaction',
        });
      }

      // Create escrow transaction with external service
      const escrowResult = await escrowService.createTransaction(
        pledge.amount,
        pledge.id
      );

      // Create escrow transaction record
      const escrowTransaction = await db.escrowTransaction.create({
        data: {
          pledgeId: pledge.id,
          amount: pledge.amount,
          status: 'PROCESSING',
          escrowTransactionId: escrowResult.transactionId,
          releaseCode: escrowResult.releaseCode,
        },
      });

      // Update pledge with escrow reference
      await db.pledge.update({
        where: { id: pledge.id },
        data: {
          escrowRef: escrowResult.transactionId,
          status: 'COMPLETED', // Mark as completed once in escrow
          completedAt: new Date(),
        },
      });

      // Update escrow transaction status
      await db.escrowTransaction.update({
        where: { id: escrowTransaction.id },
        data: {
          status: 'HELD',
          processedAt: new Date(),
        },
      });

      return {
        escrowTransaction,
        message: 'Funds successfully placed in escrow',
      };
    }),

  // Release escrow funds for a milestone
  release: protectedProcedure
    .input(releaseEscrowSchema)
    .mutation(async ({ ctx, input }) => {
      // Get milestone details
      const milestone = await db.projectMilestone.findUnique({
        where: { id: input.milestoneId },
        include: {
          project: {
            select: {
              id: true,
              creatorId: true,
              status: true,
            },
          },
        },
      });

      if (!milestone) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Milestone not found',
        });
      }

      // Only admins can release funds
      if (!ctx.isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only administrators can release escrow funds',
        });
      }

      if (milestone.status !== 'VERIFIED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only verified milestones can trigger fund release',
        });
      }

      // Get all escrow transactions for this project
      const escrowTransactions = await db.escrowTransaction.findMany({
        where: {
          pledge: {
            projectId: milestone.project.id,
          },
          status: 'HELD',
          milestoneId: null, // Not yet assigned to a milestone
        },
        orderBy: { createdAt: 'asc' },
      });

      if (escrowTransactions.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No available escrow funds for this milestone',
        });
      }

      // Calculate how much to release
      let remainingAmount = milestone.fundingAmount;
      const transactionsToRelease = [];

      for (const transaction of escrowTransactions) {
        if (remainingAmount <= 0) break;

        const releaseAmount = Math.min(transaction.amount, remainingAmount);
        transactionsToRelease.push({
          ...transaction,
          releaseAmount,
        });
        remainingAmount -= releaseAmount;
      }

      // Release funds with escrow service
      const releaseResults = await Promise.all(
        transactionsToRelease.map(async (transaction) => {
          const success = await escrowService.releaseTransaction(
            transaction.escrowTransactionId!,
            input.releaseCode
          );

          if (!success) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: `Failed to release escrow transaction ${transaction.id}`,
            });
          }

          // Update transaction status
          return db.escrowTransaction.update({
            where: { id: transaction.id },
            data: {
              status: 'RELEASED',
              milestoneId: milestone.id,
              updatedAt: new Date(),
            },
          });
        })
      );

      // Update milestone status
      await db.projectMilestone.update({
        where: { id: milestone.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // Check if project is fully completed
      const remainingMilestones = await db.projectMilestone.count({
        where: {
          projectId: milestone.project.id,
          status: { notIn: ['COMPLETED', 'DISPUTED'] },
        },
      });

      if (remainingMilestones === 0) {
        await db.project.update({
          where: { id: milestone.project.id },
          data: { status: 'COMPLETED' },
        });
      }

      return {
        releasedTransactions: releaseResults,
        totalReleased: transactionsToRelease.reduce(
          (sum, t) => sum + t.releaseAmount,
          0
        ),
        message: `Successfully released $${milestone.fundingAmount} for milestone completion`,
      };
    }),

  // Refund escrow transaction
  refund: protectedProcedure
    .input(refundEscrowSchema)
    .mutation(async ({ ctx, input }) => {
      // Only admins can process refunds
      if (!ctx.isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only administrators can process escrow refunds',
        });
      }

      // Get escrow transaction
      const escrowTransaction = await db.escrowTransaction.findFirst({
        where: {
          escrowTransactionId: input.transactionId,
          status: 'HELD',
        },
        include: {
          pledge: {
            select: {
              id: true,
              userId: true,
              projectId: true,
            },
          },
        },
      });

      if (!escrowTransaction) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Escrow transaction not found or not in HELD status',
        });
      }

      // Process refund with escrow service
      const refundSuccess = await escrowService.refundTransaction(
        input.transactionId
      );

      if (!refundSuccess) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to process escrow refund',
        });
      }

      // Update escrow transaction
      await db.escrowTransaction.update({
        where: { id: escrowTransaction.id },
        data: {
          status: 'REFUNDED',
          updatedAt: new Date(),
        },
      });

      // Update pledge status
      await db.pledge.update({
        where: { id: escrowTransaction.pledge.id },
        data: {
          status: 'REFUNDED',
          refundedAt: new Date(),
        },
      });

      // TODO: Send refund notification email
      // await sendRefundNotification(escrowTransaction.pledge.userId, input.reason);

      return {
        message: 'Escrow funds successfully refunded',
        transaction: escrowTransaction,
      };
    }),

  // Get escrow transaction status
  getStatus: publicProcedure
    .input(
      z.object({
        transactionId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const escrowTransaction = await db.escrowTransaction.findFirst({
        where: {
          escrowTransactionId: input.transactionId,
        },
        include: {
          pledge: {
            select: {
              id: true,
              amount: true,
              project: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
          milestone: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
      });

      if (!escrowTransaction) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Escrow transaction not found',
        });
      }

      // Get status from escrow service
      const serviceStatus = await escrowService.getTransactionStatus(
        input.transactionId
      );

      return {
        transaction: escrowTransaction,
        serviceStatus,
      };
    }),

  // Get escrow summary for a project
  getProjectSummary: publicProcedure
    .input(
      z.object({
        projectId: z.string().cuid(),
      })
    )
    .query(async ({ input }) => {
      const escrowSummary = await db.escrowTransaction.groupBy({
        by: ['status'],
        where: {
          pledge: {
            projectId: input.projectId,
          },
        },
        _sum: {
          amount: true,
        },
        _count: true,
      });

      const totalByStatus = escrowSummary.reduce(
        (acc: Record<string, { amount: number; count: number }>, curr) => ({
          ...acc,
          [curr.status]: {
            amount: curr._sum.amount || 0,
            count: curr._count,
          },
        }),
        {} as Record<EscrowStatus, { amount: number; count: number }>
      );

      const milestones = await db.projectMilestone.findMany({
        where: { projectId: input.projectId },
        select: {
          id: true,
          title: true,
          fundingAmount: true,
          status: true,
          transactions: {
            where: { status: 'RELEASED' },
            select: { amount: true },
          },
        },
        orderBy: { orderIndex: 'asc' },
      });

      const milestonesWithRelease = milestones.map((milestone) => ({
        ...milestone,
        releasedAmount: milestone.transactions.reduce(
          (sum, t) => sum + t.amount,
          0
        ),
      }));

      return {
        totalByStatus,
        milestones: milestonesWithRelease,
        totalInEscrow: totalByStatus.HELD?.amount || 0,
        totalReleased: totalByStatus.RELEASED?.amount || 0,
        totalRefunded: totalByStatus.REFUNDED?.amount || 0,
      };
    }),
});
