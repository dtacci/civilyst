import { z } from 'zod';
import { createTRPCRouter, loggedProcedure } from '~/server/api/trpc';
import { TRPCError } from '@trpc/server';
import { db } from '~/lib/db';

export const rateLimitRouter = createTRPCRouter({
  // Create a new rate limit rule (admin only)
  createRule: loggedProcedure
    .input(
      z.object({
        actionType: z.string().min(1).max(100),
        timeWindow: z.number().min(1).max(86400), // Max 24 hours in seconds
        maxActions: z.number().min(1).max(10000),
        blockDuration: z.number().min(1).max(86400), // Max 24 hours in seconds
        isActive: z.boolean().default(true),
        priority: z.number().min(1).max(1000).default(100),
        description: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // TODO: Add admin role check when roles are implemented
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      try {
        const rule = await db.rateLimitRule.create({
          data: {
            actionType: input.actionType,
            timeWindow: input.timeWindow,
            maxActions: input.maxActions,
            blockDuration: input.blockDuration,
            isActive: input.isActive,
            priority: input.priority,
            description: input.description,
          },
        });

        return rule;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create rate limit rule',
          cause: error,
        });
      }
    }),

  // Update an existing rate limit rule (admin only)
  updateRule: loggedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        actionType: z.string().min(1).max(100).optional(),
        timeWindow: z.number().min(1).max(86400).optional(),
        maxActions: z.number().min(1).max(10000).optional(),
        blockDuration: z.number().min(1).max(86400).optional(),
        isActive: z.boolean().optional(),
        priority: z.number().min(1).max(1000).optional(),
        description: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // TODO: Add admin role check when roles are implemented
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      try {
        const { id, ...updateData } = input;

        // Remove undefined values
        const cleanUpdateData = Object.fromEntries(
          Object.entries(updateData).filter(([_, value]) => value !== undefined)
        );

        const rule = await db.rateLimitRule.update({
          where: { id },
          data: cleanUpdateData,
        });

        return rule;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update rate limit rule',
          cause: error,
        });
      }
    }),

  // Delete a rate limit rule (admin only)
  deleteRule: loggedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // TODO: Add admin role check when roles are implemented
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      try {
        await db.rateLimitRule.delete({
          where: { id: input.id },
        });

        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete rate limit rule',
          cause: error,
        });
      }
    }),

  // Get all rate limit rules (admin only)
  listRules: loggedProcedure
    .input(
      z.object({
        actionType: z.string().optional(),
        isActive: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      // TODO: Add admin role check when roles are implemented
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      const whereClause: Record<string, unknown> = {};

      if (input.actionType) {
        whereClause.actionType = input.actionType;
      }

      if (input.isActive !== undefined) {
        whereClause.isActive = input.isActive;
      }

      const rules = await db.rateLimitRule.findMany({
        where: whereClause,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        take: input.limit,
        skip: input.offset,
      });

      const total = await db.rateLimitRule.count({
        where: whereClause,
      });

      return {
        rules,
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),

  // Get a specific rate limit rule (admin only)
  getRule: loggedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
      })
    )
    .query(async ({ input, ctx }) => {
      // TODO: Add admin role check when roles are implemented
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      const rule = await db.rateLimitRule.findUnique({
        where: { id: input.id },
      });

      if (!rule) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Rate limit rule not found',
        });
      }

      return rule;
    }),

  // Get rules for a specific action type (used by middleware)
  getRulesForAction: loggedProcedure
    .input(
      z.object({
        actionType: z.string().min(1).max(100),
      })
    )
    .query(async ({ input }) => {
      const rules = await db.rateLimitRule.findMany({
        where: {
          actionType: input.actionType,
          isActive: true,
        },
        orderBy: {
          priority: 'desc',
        },
      });

      return rules;
    }),

  // Bulk toggle rules (admin only)
  bulkToggleRules: loggedProcedure
    .input(
      z.object({
        ruleIds: z.array(z.string().cuid()).max(50),
        isActive: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // TODO: Add admin role check when roles are implemented
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      try {
        const result = await db.rateLimitRule.updateMany({
          where: {
            id: {
              in: input.ruleIds,
            },
          },
          data: {
            isActive: input.isActive,
          },
        });

        return {
          updated: result.count,
          success: true,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to bulk update rate limit rules',
          cause: error,
        });
      }
    }),

  // Get rate limit statistics (admin only)
  getStatistics: loggedProcedure
    .input(
      z.object({
        timeframe: z.enum(['hour', 'day', 'week', 'month']).default('day'),
        actionType: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      // TODO: Add admin role check when roles are implemented
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      const now = new Date();
      let startDate: Date;

      switch (input.timeframe) {
        case 'hour':
          startDate = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }

      const whereClause: Record<string, unknown> = {
        createdAt: {
          gte: startDate,
        },
      };

      if (input.actionType) {
        whereClause.actionType = input.actionType;
      }

      const [
        totalBlocks,
        uniqueDevicesBlocked,
        topBlockedActions,
        blocksByHour,
      ] = await Promise.all([
        // Total blocks in timeframe
        db.securityLog.count({
          where: {
            ...whereClause,
            isBlocked: true,
          },
        }),

        // Unique devices blocked
        db.securityLog.findMany({
          where: {
            ...whereClause,
            isBlocked: true,
            deviceId: {
              not: null,
            },
          },
          select: {
            deviceId: true,
          },
          distinct: ['deviceId'],
        }),

        // Top blocked action types
        db.securityLog.groupBy({
          by: ['actionType'],
          where: {
            ...whereClause,
            isBlocked: true,
          },
          _count: {
            actionType: true,
          },
          orderBy: {
            _count: {
              actionType: 'desc',
            },
          },
          take: 10,
        }),

        // Blocks by hour (for trending)
        input.timeframe === 'day'
          ? db.$queryRaw<Array<{ hour: number; blocks: number }>>`
            SELECT 
              EXTRACT(HOUR FROM created_at) as hour,
              COUNT(*) as blocks
            FROM security_logs 
            WHERE created_at >= ${startDate}
              AND is_blocked = true
              ${input.actionType ? `AND action_type = ${input.actionType}` : ''}
            GROUP BY hour
            ORDER BY hour
          `
          : null,
      ]);

      return {
        timeframe: input.timeframe,
        period: {
          start: startDate,
          end: now,
        },
        summary: {
          totalBlocks,
          uniqueDevicesBlocked: uniqueDevicesBlocked.length,
        },
        topBlockedActions: topBlockedActions.map((item) => ({
          actionType: item.actionType,
          count: item._count.actionType,
        })),
        hourlyTrend: blocksByHour || [],
      };
    }),

  // Test rate limit rules with sample data (admin only)
  testRules: loggedProcedure
    .input(
      z.object({
        actionType: z.string().min(1).max(100),
        deviceId: z.string().min(32).max(64),
        simulatedRequests: z.number().min(1).max(100),
        timeSpread: z.number().min(1).max(3600).default(60), // Seconds to spread requests over
      })
    )
    .mutation(async ({ input, ctx }) => {
      // TODO: Add admin role check when roles are implemented
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      try {
        // Get active rules for the action type
        const rules = await db.rateLimitRule.findMany({
          where: {
            actionType: input.actionType,
            isActive: true,
          },
          orderBy: {
            priority: 'desc',
          },
        });

        if (rules.length === 0) {
          return {
            message: 'No active rules found for this action type',
            rulesFound: 0,
            simulationResults: [],
          };
        }

        // Simulate requests
        const simulationResults = [];
        const now = Date.now();

        for (let i = 0; i < input.simulatedRequests; i++) {
          const requestTime =
            now + (i * (input.timeSpread * 1000)) / input.simulatedRequests;
          const triggeringRules = [];

          for (const rule of rules) {
            // Simplified check - in real implementation this would check actual request history
            const requestsInWindow = Math.floor(
              i / (rule.timeWindow / input.timeSpread)
            );

            if (requestsInWindow >= rule.maxActions) {
              triggeringRules.push({
                ruleId: rule.id,
                actionType: rule.actionType,
                violated: true,
                requestsInWindow,
                maxAllowed: rule.maxActions,
                blockDuration: rule.blockDuration,
              });
            }
          }

          simulationResults.push({
            requestNumber: i + 1,
            timestamp: new Date(requestTime),
            wouldBeBlocked: triggeringRules.length > 0,
            triggeringRules,
          });
        }

        const blockedRequests = simulationResults.filter(
          (r) => r.wouldBeBlocked
        );

        return {
          message: `Simulation completed for ${input.simulatedRequests} requests`,
          rulesFound: rules.length,
          activeRules: rules.map((r) => ({
            id: r.id,
            actionType: r.actionType,
            maxActions: r.maxActions,
            timeWindow: r.timeWindow,
            priority: r.priority,
          })),
          simulationResults,
          summary: {
            totalRequests: input.simulatedRequests,
            blockedRequests: blockedRequests.length,
            blockRate: blockedRequests.length / input.simulatedRequests,
            firstBlockAt:
              blockedRequests.length > 0
                ? blockedRequests[0]?.requestNumber
                : null,
          },
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to test rate limit rules',
          cause: error,
        });
      }
    }),
});
