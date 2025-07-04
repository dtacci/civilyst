import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';
import { db } from '~/server/db';
import { TRPCError } from '@trpc/server';

export const userSkillRouter = createTRPCRouter({
  // Add a skill to a user
  add: protectedProcedure
    .input(
      z.object({
        skillId: z.string(),
        proficiencyLevel: z.number().min(1).max(5),
        portfolioUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { userId } = ctx.session.user;

      // Check if skill exists
      const skill = await db.skill.findUnique({
        where: { id: input.skillId },
        select: { id: true, name: true },
      });

      if (!skill) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Skill not found',
        });
      }

      // Check if user already has this skill
      const existingUserSkill = await db.userSkill.findUnique({
        where: {
          userId_skillId: {
            userId,
            skillId: input.skillId,
          },
        },
      });

      if (existingUserSkill) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'You already have this skill. Use update to modify it.',
        });
      }

      const userSkill = await db.userSkill.create({
        data: {
          userId,
          skillId: input.skillId,
          proficiencyLevel: input.proficiencyLevel,
          portfolioUrl: input.portfolioUrl,
        },
        include: {
          skill: {
            select: {
              id: true,
              name: true,
              category: true,
              description: true,
            },
          },
        },
      });

      return userSkill;
    }),

  // Remove a skill from a user
  remove: protectedProcedure
    .input(
      z.object({
        skillId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { userId } = ctx.session.user;

      const userSkill = await db.userSkill.findUnique({
        where: {
          userId_skillId: {
            userId,
            skillId: input.skillId,
          },
        },
      });

      if (!userSkill) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User skill not found',
        });
      }

      await db.userSkill.delete({
        where: {
          userId_skillId: {
            userId,
            skillId: input.skillId,
          },
        },
      });

      return { success: true };
    }),

  // Update a user skill
  update: protectedProcedure
    .input(
      z.object({
        skillId: z.string(),
        proficiencyLevel: z.number().min(1).max(5).optional(),
        portfolioUrl: z.string().url().optional().nullable(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { userId } = ctx.session.user;
      const { skillId, ...updateData } = input;

      const existingUserSkill = await db.userSkill.findUnique({
        where: {
          userId_skillId: {
            userId,
            skillId,
          },
        },
      });

      if (!existingUserSkill) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User skill not found',
        });
      }

      const userSkill = await db.userSkill.update({
        where: {
          userId_skillId: {
            userId,
            skillId,
          },
        },
        data: updateData,
        include: {
          skill: {
            select: {
              id: true,
              name: true,
              category: true,
              description: true,
            },
          },
        },
      });

      return userSkill;
    }),

  // Verify a user skill (placeholder for endorsement system)
  verify: protectedProcedure
    .input(
      z.object({
        userSkillId: z.string(),
        isVerified: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // TODO: Implement proper authorization check for who can verify skills
      // For now, only allow users to verify their own skills
      const { userId } = ctx.session.user;

      const userSkill = await db.userSkill.findUnique({
        where: { id: input.userSkillId },
        include: {
          skill: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!userSkill) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User skill not found',
        });
      }

      if (userSkill.userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only verify your own skills',
        });
      }

      const updatedUserSkill = await db.userSkill.update({
        where: { id: input.userSkillId },
        data: { isVerified: input.isVerified },
        include: {
          skill: {
            select: {
              id: true,
              name: true,
              category: true,
              description: true,
            },
          },
        },
      });

      return updatedUserSkill;
    }),

  // Get user's skills
  getByUser: protectedProcedure
    .input(
      z.object({
        userId: z.string().optional(), // If not provided, use current user
        includeUnverified: z.boolean().default(true),
      })
    )
    .query(async ({ input, ctx }) => {
      const targetUserId = input.userId || ctx.session.user.userId;

      // If requesting another user's skills, only show verified ones unless it's the current user
      const showUnverified =
        targetUserId === ctx.session.user.userId || input.includeUnverified;

      const userSkills = await db.userSkill.findMany({
        where: {
          userId: targetUserId,
          ...(showUnverified ? {} : { isVerified: true }),
        },
        include: {
          skill: {
            select: {
              id: true,
              name: true,
              category: true,
              description: true,
            },
          },
        },
        orderBy: [
          { isVerified: 'desc' },
          { proficiencyLevel: 'desc' },
          { skill: { name: 'asc' } },
        ],
      });

      return userSkills;
    }),

  // Get skills by category for a user
  getByUserAndCategory: protectedProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        category: z.string(),
        includeUnverified: z.boolean().default(true),
      })
    )
    .query(async ({ input, ctx }) => {
      const targetUserId = input.userId || ctx.session.user.userId;
      const showUnverified =
        targetUserId === ctx.session.user.userId || input.includeUnverified;

      const userSkills = await db.userSkill.findMany({
        where: {
          userId: targetUserId,
          ...(showUnverified ? {} : { isVerified: true }),
          skill: {
            category: {
              contains: input.category,
              mode: 'insensitive',
            },
          },
        },
        include: {
          skill: {
            select: {
              id: true,
              name: true,
              category: true,
              description: true,
            },
          },
        },
        orderBy: [
          { isVerified: 'desc' },
          { proficiencyLevel: 'desc' },
          { skill: { name: 'asc' } },
        ],
      });

      return userSkills;
    }),

  // Get skill statistics for current user
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const { userId } = ctx.session.user;

    const [total, verified, byCategory] = await Promise.all([
      db.userSkill.count({
        where: { userId },
      }),
      db.userSkill.count({
        where: { userId, isVerified: true },
      }),
      db.userSkill.groupBy({
        by: ['skill'],
        where: { userId },
        _count: {
          id: true,
        },
        include: {
          skill: {
            select: {
              category: true,
            },
          },
        },
      }),
    ]);

    // Group by category
    const categoryStats: Record<string, number> = {};

    for (const _item of byCategory) {
      // Note: This is a simplified aggregation - in practice you'd want to
      // do this aggregation in the database query
      const skills = await db.userSkill.findMany({
        where: { userId },
        include: {
          skill: {
            select: {
              category: true,
            },
          },
        },
      });

      skills.forEach((userSkill) => {
        const category = userSkill.skill.category;
        categoryStats[category] = (categoryStats[category] || 0) + 1;
      });
    }

    return {
      total,
      verified,
      unverified: total - verified,
      byCategory: categoryStats,
    };
  }),

  // Endorse a user's skill (placeholder for endorsement system)
  endorse: protectedProcedure
    .input(
      z.object({
        userSkillId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { userId: endorserId } = ctx.session.user;

      const userSkill = await db.userSkill.findUnique({
        where: { id: input.userSkillId },
        include: {
          skill: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!userSkill) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User skill not found',
        });
      }

      if (userSkill.userId === endorserId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You cannot endorse your own skills',
        });
      }

      // Increment endorsement count
      const updatedUserSkill = await db.userSkill.update({
        where: { id: input.userSkillId },
        data: {
          endorsements: {
            increment: 1,
          },
        },
        include: {
          skill: {
            select: {
              id: true,
              name: true,
              category: true,
              description: true,
            },
          },
        },
      });

      return updatedUserSkill;
    }),
});
