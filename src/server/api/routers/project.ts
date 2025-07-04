import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  rateLimitedProcedure,
} from '~/server/api/trpc';
import { db } from '~/server/db';
import { ProjectStatus } from '@prisma/client';

// Input validation schemas
const createProjectSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(5000),
  fundingGoal: z.number().min(500).max(500000),
  fundingDeadline: z.date().min(new Date()),
  campaignId: z.string().cuid().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
});

const updateProjectSchema = z.object({
  projectId: z.string().cuid(),
  title: z.string().min(5).max(200).optional(),
  description: z.string().min(20).max(5000).optional(),
  fundingGoal: z.number().min(500).max(500000).optional(),
  fundingDeadline: z.date().optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
});

const createMilestoneSchema = z.object({
  projectId: z.string().cuid(),
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(2000),
  targetDate: z.date(),
  fundingAmount: z.number().min(0),
  orderIndex: z.number().int().min(0),
});

export const projectRouter = createTRPCRouter({
  // Create a new project
  create: rateLimitedProcedure
    .input(createProjectSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      // If linked to a campaign, verify ownership
      if (input.campaignId) {
        const campaign = await db.campaign.findUnique({
          where: { id: input.campaignId },
          select: { creatorId: true },
        });

        if (!campaign) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Campaign not found',
          });
        }

        if (campaign.creatorId !== ctx.userId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You can only create projects for your own campaigns',
          });
        }
      }

      const project = await db.project.create({
        data: {
          ...input,
          creatorId: ctx.userId,
          status: 'DRAFT',
        },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              imageUrl: true,
            },
          },
          campaign: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
            },
          },
        },
      });

      return project;
    }),

  // Get a single project
  getById: publicProcedure
    .input(z.object({ projectId: z.string().cuid() }))
    .query(async ({ input }) => {
      const project = await db.project.findUnique({
        where: { id: input.projectId },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              imageUrl: true,
              isPublic: true,
              trustLevel: true,
            },
          },
          campaign: {
            select: {
              id: true,
              title: true,
              description: true,
              imageUrl: true,
            },
          },
          milestones: {
            orderBy: { orderIndex: 'asc' },
          },
          _count: {
            select: {
              pledges: true,
              skillNeeds: true,
            },
          },
        },
      });

      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      // Get funding summary
      const fundingSummary = await db.pledge.aggregate({
        where: {
          projectId: input.projectId,
          status: 'COMPLETED',
        },
        _sum: {
          amount: true,
        },
        _count: true,
      });

      return {
        ...project,
        currentFunding: fundingSummary._sum.amount || 0,
        backerCount: fundingSummary._count,
        fundingPercentage:
          ((fundingSummary._sum.amount || 0) / project.fundingGoal) * 100,
      };
    }),

  // List projects with filters
  list: publicProcedure
    .input(
      z.object({
        status: z.nativeEnum(ProjectStatus).optional(),
        creatorId: z.string().cuid().optional(),
        search: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        sortBy: z
          .enum(['createdAt', 'fundingDeadline', 'fundingGoal'])
          .default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const where = {
        ...(input.status && { status: input.status }),
        ...(input.creatorId && { creatorId: input.creatorId }),
        ...(input.search && {
          OR: [
            { title: { contains: input.search, mode: 'insensitive' as const } },
            {
              description: {
                contains: input.search,
                mode: 'insensitive' as const,
              },
            },
          ],
        }),
        ...(input.city && { city: input.city }),
        ...(input.state && { state: input.state }),
      };

      const [projects, total] = await Promise.all([
        db.project.findMany({
          where,
          include: {
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                imageUrl: true,
                trustLevel: true,
              },
            },
            campaign: {
              select: {
                id: true,
                imageUrl: true,
              },
            },
            _count: {
              select: {
                pledges: true,
                milestones: true,
              },
            },
          },
          orderBy: { [input.sortBy]: input.sortOrder },
          take: input.limit,
          skip: input.offset,
        }),
        db.project.count({ where }),
      ]);

      // Get funding summaries for all projects
      const projectIds = projects.map((p) => p.id);
      const fundingSummaries = await db.pledge.groupBy({
        by: ['projectId'],
        where: {
          projectId: { in: projectIds },
          status: 'COMPLETED',
        },
        _sum: {
          amount: true,
        },
        _count: true,
      });

      const fundingMap = fundingSummaries.reduce(
        (acc, curr) => ({
          ...acc,
          [curr.projectId]: {
            currentFunding: curr._sum.amount || 0,
            backerCount: curr._count,
          },
        }),
        {} as Record<string, { currentFunding: number; backerCount: number }>
      );

      const projectsWithFunding = projects.map((project) => ({
        ...project,
        currentFunding: fundingMap[project.id]?.currentFunding || 0,
        backerCount: fundingMap[project.id]?.backerCount || 0,
        fundingPercentage:
          ((fundingMap[project.id]?.currentFunding || 0) /
            project.fundingGoal) *
          100,
      }));

      return {
        projects: projectsWithFunding,
        total,
        hasMore: input.offset + projects.length < total,
      };
    }),

  // Update a project
  update: protectedProcedure
    .input(updateProjectSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const project = await db.project.findUnique({
        where: { id: input.projectId },
        select: { creatorId: true, status: true },
      });

      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      if (project.creatorId !== ctx.userId && !ctx.isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only update your own projects',
        });
      }

      // Validate status transitions
      if (input.status) {
        const validTransitions: Record<ProjectStatus, ProjectStatus[]> = {
          DRAFT: ['ACTIVE', 'CANCELLED'],
          ACTIVE: ['FUNDED', 'CANCELLED'],
          FUNDED: ['IN_PROGRESS', 'CANCELLED'],
          IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
          COMPLETED: [],
          CANCELLED: [],
        };

        if (!validTransitions[project.status].includes(input.status)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Invalid status transition from ${project.status} to ${input.status}`,
          });
        }
      }

      const { projectId, ...updateData } = input;
      const updatedProject = await db.project.update({
        where: { id: projectId },
        data: updateData,
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              imageUrl: true,
            },
          },
          campaign: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
            },
          },
        },
      });

      return updatedProject;
    }),

  // Create a project milestone
  createMilestone: protectedProcedure
    .input(createMilestoneSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify project ownership
      const project = await db.project.findUnique({
        where: { id: input.projectId },
        select: {
          creatorId: true,
          fundingGoal: true,
          milestones: {
            select: { fundingAmount: true },
          },
        },
      });

      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      if (project.creatorId !== ctx.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only add milestones to your own projects',
        });
      }

      // Validate total milestone amounts don't exceed funding goal
      const totalMilestoneAmount = project.milestones.reduce(
        (sum, m) => sum + m.fundingAmount,
        0
      );

      if (totalMilestoneAmount + input.fundingAmount > project.fundingGoal) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Total milestone amounts cannot exceed funding goal. Maximum additional amount: $${
            project.fundingGoal - totalMilestoneAmount
          }`,
        });
      }

      const milestone = await db.projectMilestone.create({
        data: input,
      });

      return milestone;
    }),

  // Get projects needing attention (for creators)
  getMyProjects: protectedProcedure
    .input(
      z.object({
        status: z.nativeEnum(ProjectStatus).optional(),
        limit: z.number().min(1).max(50).default(10),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const where = {
        creatorId: ctx.userId,
        ...(input.status && { status: input.status }),
      };

      const [projects, total] = await Promise.all([
        db.project.findMany({
          where,
          include: {
            campaign: {
              select: {
                id: true,
                title: true,
                imageUrl: true,
              },
            },
            milestones: {
              where: { status: 'SUBMITTED' },
              select: { id: true },
            },
            _count: {
              select: {
                pledges: true,
                milestones: true,
                skillNeeds: true,
              },
            },
          },
          orderBy: { updatedAt: 'desc' },
          take: input.limit,
          skip: input.offset,
        }),
        db.project.count({ where }),
      ]);

      // Get funding summaries
      const projectIds = projects.map((p) => p.id);
      const fundingSummaries = await db.pledge.groupBy({
        by: ['projectId'],
        where: {
          projectId: { in: projectIds },
          status: 'COMPLETED',
        },
        _sum: {
          amount: true,
        },
        _count: true,
      });

      const fundingMap = fundingSummaries.reduce(
        (acc, curr) => ({
          ...acc,
          [curr.projectId]: {
            currentFunding: curr._sum.amount || 0,
            backerCount: curr._count,
          },
        }),
        {} as Record<string, { currentFunding: number; backerCount: number }>
      );

      const projectsWithDetails = projects.map((project) => ({
        ...project,
        currentFunding: fundingMap[project.id]?.currentFunding || 0,
        backerCount: fundingMap[project.id]?.backerCount || 0,
        fundingPercentage:
          ((fundingMap[project.id]?.currentFunding || 0) /
            project.fundingGoal) *
          100,
        pendingMilestones: project.milestones.length,
      }));

      return {
        projects: projectsWithDetails,
        total,
        hasMore: input.offset + projects.length < total,
      };
    }),

  // Get featured projects (for homepage)
  getFeatured: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(10).default(6),
      })
    )
    .query(async ({ input }) => {
      // Get active projects close to funding goal
      const projects = await db.project.findMany({
        where: {
          status: 'ACTIVE',
          fundingDeadline: { gte: new Date() },
        },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              imageUrl: true,
              trustLevel: true,
            },
          },
          campaign: {
            select: {
              id: true,
              imageUrl: true,
            },
          },
          _count: {
            select: {
              pledges: true,
            },
          },
        },
        take: input.limit * 2, // Get extra to sort by funding percentage
      });

      // Get funding data and sort by funding percentage
      const projectsWithFunding = await Promise.all(
        projects.map(async (project) => {
          const funding = await db.pledge.aggregate({
            where: {
              projectId: project.id,
              status: 'COMPLETED',
            },
            _sum: {
              amount: true,
            },
            _count: true,
          });

          return {
            ...project,
            currentFunding: funding._sum.amount || 0,
            backerCount: funding._count,
            fundingPercentage:
              ((funding._sum.amount || 0) / project.fundingGoal) * 100,
          };
        })
      );

      // Sort by funding percentage (50-90% range preferred)
      projectsWithFunding.sort((a, b) => {
        const aScore =
          a.fundingPercentage >= 50 && a.fundingPercentage <= 90
            ? 100 - Math.abs(70 - a.fundingPercentage)
            : a.fundingPercentage;
        const bScore =
          b.fundingPercentage >= 50 && b.fundingPercentage <= 90
            ? 100 - Math.abs(70 - b.fundingPercentage)
            : b.fundingPercentage;
        return bScore - aScore;
      });

      return projectsWithFunding.slice(0, input.limit);
    }),
});
