import { z } from 'zod';
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from '~/server/api/trpc';
import { db } from '~/server/db';
import { TRPCError } from '@trpc/server';

export const skillRouter = createTRPCRouter({
  // Get all skills with optional filtering
  list: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const { category, search, limit, offset } = input;

      const where: Record<string, unknown> = {};

      if (category) {
        where.category = {
          contains: category,
          mode: 'insensitive' as const,
        };
      }

      if (search) {
        where.OR = [
          {
            name: {
              contains: search,
              mode: 'insensitive' as const,
            },
          },
          {
            description: {
              contains: search,
              mode: 'insensitive' as const,
            },
          },
        ];
      }

      const [skills, total] = await Promise.all([
        db.skill.findMany({
          where,
          select: {
            id: true,
            name: true,
            category: true,
            description: true,
            createdAt: true,
            _count: {
              select: {
                userSkills: true,
                projectNeeds: true,
              },
            },
          },
          orderBy: {
            name: 'asc',
          },
          take: limit,
          skip: offset,
        }),
        db.skill.count({ where }),
      ]);

      return {
        skills,
        total,
        hasMore: offset + limit < total,
      };
    }),

  // Get skills by category
  getByCategory: publicProcedure
    .input(
      z.object({
        category: z.string(),
      })
    )
    .query(async ({ input }) => {
      const skills = await db.skill.findMany({
        where: {
          category: {
            contains: input.category,
            mode: 'insensitive',
          },
        },
        select: {
          id: true,
          name: true,
          category: true,
          description: true,
          _count: {
            select: {
              userSkills: true,
              projectNeeds: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });

      return skills;
    }),

  // Get skill details by ID
  getById: publicProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ input }) => {
      const skill = await db.skill.findUnique({
        where: {
          id: input.id,
        },
        select: {
          id: true,
          name: true,
          category: true,
          description: true,
          createdAt: true,
          _count: {
            select: {
              userSkills: true,
              projectNeeds: true,
            },
          },
        },
      });

      if (!skill) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Skill not found',
        });
      }

      return skill;
    }),

  // Create a new skill (protected - requires authentication)
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        category: z.string().min(1).max(50),
        description: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Check if skill already exists
      const existingSkill = await db.skill.findFirst({
        where: {
          name: {
            equals: input.name,
            mode: 'insensitive',
          },
        },
      });

      if (existingSkill) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'A skill with this name already exists',
        });
      }

      const skill = await db.skill.create({
        data: {
          name: input.name,
          category: input.category,
          description: input.description,
        },
        select: {
          id: true,
          name: true,
          category: true,
          description: true,
          createdAt: true,
        },
      });

      return skill;
    }),

  // Update skill details (protected)
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        category: z.string().min(1).max(50).optional(),
        description: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;

      // Check if skill exists
      const existingSkill = await db.skill.findUnique({
        where: { id },
      });

      if (!existingSkill) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Skill not found',
        });
      }

      // If name is being updated, check for conflicts
      if (updateData.name && updateData.name !== existingSkill.name) {
        const nameConflict = await db.skill.findFirst({
          where: {
            name: {
              equals: updateData.name,
              mode: 'insensitive',
            },
            id: {
              not: id,
            },
          },
        });

        if (nameConflict) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'A skill with this name already exists',
          });
        }
      }

      const skill = await db.skill.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          category: true,
          description: true,
          updatedAt: true,
        },
      });

      return skill;
    }),

  // Get unique categories
  getCategories: publicProcedure.query(async () => {
    const result = await db.skill.findMany({
      select: {
        category: true,
      },
      distinct: ['category'],
      orderBy: {
        category: 'asc',
      },
    });

    return result.map((item) => item.category);
  }),

  // Search skills by name or description
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ input }) => {
      const skills = await db.skill.findMany({
        where: {
          OR: [
            {
              name: {
                contains: input.query,
                mode: 'insensitive',
              },
            },
            {
              description: {
                contains: input.query,
                mode: 'insensitive',
              },
            },
          ],
        },
        select: {
          id: true,
          name: true,
          category: true,
          description: true,
          _count: {
            select: {
              userSkills: true,
            },
          },
        },
        orderBy: [
          {
            name: 'asc',
          },
        ],
        take: input.limit,
      });

      return skills;
    }),
});
