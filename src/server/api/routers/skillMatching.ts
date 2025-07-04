import { z } from 'zod';
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from '~/server/api/trpc';
import { db } from '~/server/db';
import { TRPCError } from '@trpc/server';

// Types for matching algorithm
interface SkillMatch {
  userId: string;
  matchScore: number;
  commonSkills: string[];
  complementarySkills: string[];
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
    location: string | null;
  };
}

interface ProjectMatch {
  projectId: string;
  matchScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  project: {
    id: string;
    title: string;
    description: string;
    creator: {
      firstName: string | null;
      lastName: string | null;
    };
  };
}

export const skillMatchingRouter = createTRPCRouter({
  // Find users with complementary skills
  findMatches: protectedProcedure
    .input(
      z.object({
        userId: z.string().optional(), // If not provided, use current user
        skillIds: z.array(z.string()).optional(), // Specific skills to match against
        excludeUserIds: z.array(z.string()).default([]), // Users to exclude from results
        limit: z.number().min(1).max(50).default(20),
        minProficiency: z.number().min(1).max(5).default(1),
        requireVerified: z.boolean().default(false),
      })
    )
    .query(async ({ input, ctx }) => {
      const targetUserId = input.userId || ctx.session.user.userId;

      // Get the target user's skills
      const userSkills = await db.userSkill.findMany({
        where: {
          userId: targetUserId,
          ...(input.requireVerified ? { isVerified: true } : {}),
        },
        include: {
          skill: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
      });

      if (userSkills.length === 0) {
        return [];
      }

      const userSkillIds = userSkills.map((us) => us.skillId);
      const userSkillCategories = [
        ...new Set(userSkills.map((us) => us.skill.category)),
      ];

      // Find users with different skills in same categories (complementary)
      // or users with similar skills for collaboration
      const potentialMatches = await db.userSkill.findMany({
        where: {
          userId: {
            notIn: [targetUserId, ...input.excludeUserIds],
          },
          proficiencyLevel: {
            gte: input.minProficiency,
          },
          ...(input.requireVerified ? { isVerified: true } : {}),
          OR: [
            // Users with skills in same categories but different skills
            {
              skill: {
                category: {
                  in: userSkillCategories,
                },
                id: {
                  notIn: userSkillIds,
                },
              },
            },
            // Users with same skills (for collaboration)
            {
              skillId: {
                in: input.skillIds || userSkillIds,
              },
            },
          ],
        },
        include: {
          skill: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              imageUrl: true,
              location: true,
              isPublic: true,
            },
          },
        },
      });

      // Calculate match scores
      const matchMap = new Map<string, SkillMatch>();

      for (const match of potentialMatches) {
        if (!match.user.isPublic) continue; // Skip private profiles

        const userId = match.userId;

        if (!matchMap.has(userId)) {
          matchMap.set(userId, {
            userId,
            matchScore: 0,
            commonSkills: [],
            complementarySkills: [],
            user: match.user,
          });
        }

        const userMatch = matchMap.get(userId)!;

        // Check if it's a common skill (collaboration potential)
        if (userSkillIds.includes(match.skillId)) {
          userMatch.commonSkills.push(match.skill.name);
          userMatch.matchScore += 2; // Higher weight for common skills
        } else {
          // Complementary skill
          userMatch.complementarySkills.push(match.skill.name);
          userMatch.matchScore += 1;
        }

        // Bonus for verified skills
        if (match.isVerified) {
          userMatch.matchScore += 0.5;
        }

        // Bonus for higher proficiency
        userMatch.matchScore += match.proficiencyLevel * 0.1;
      }

      // Convert to array and sort by match score
      const matches = Array.from(matchMap.values())
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, input.limit);

      return matches;
    }),

  // Recommend projects based on user skills
  recommendProjects: protectedProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
        minMatchScore: z.number().min(0).max(1).default(0.1),
        includeFilledNeeds: z.boolean().default(false),
      })
    )
    .query(async ({ input, ctx }) => {
      const targetUserId = input.userId || ctx.session.user.userId;

      // Get user's skills
      const userSkills = await db.userSkill.findMany({
        where: {
          userId: targetUserId,
        },
        include: {
          skill: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
      });

      if (userSkills.length === 0) {
        return [];
      }

      const userSkillIds = userSkills.map((us) => us.skillId);

      // Find projects that need skills the user has
      const projectNeeds = await db.projectSkillNeed.findMany({
        where: {
          skillId: {
            in: userSkillIds,
          },
          ...(input.includeFilledNeeds ? {} : { isFilled: false }),
          project: {
            status: {
              in: ['DRAFT', 'ACTIVE'],
            },
            creatorId: {
              not: targetUserId, // Don't recommend user's own projects
            },
          },
        },
        include: {
          skill: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
          project: {
            select: {
              id: true,
              title: true,
              description: true,
              status: true,
              creator: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
              skillNeeds: {
                include: {
                  skill: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Calculate match scores for projects
      const projectMatchMap = new Map<string, ProjectMatch>();

      for (const need of projectNeeds) {
        const projectId = need.projectId;

        if (!projectMatchMap.has(projectId)) {
          // Calculate all needed skills for this project
          const allNeededSkills = need.project.skillNeeds.map(
            (sn) => sn.skill.name
          );
          const userSkillNames = userSkills.map((us) => us.skill.name);
          const matchingSkills = allNeededSkills.filter((skill) =>
            userSkillNames.includes(skill)
          );
          const missingSkills = allNeededSkills.filter(
            (skill) => !userSkillNames.includes(skill)
          );

          projectMatchMap.set(projectId, {
            projectId,
            matchScore: 0,
            matchingSkills,
            missingSkills,
            project: need.project,
          });
        }

        const projectMatch = projectMatchMap.get(projectId)!;

        // Increase match score based on skill proficiency
        const userSkill = userSkills.find((us) => us.skillId === need.skillId);
        if (userSkill) {
          projectMatch.matchScore += userSkill.proficiencyLevel * 0.2;

          // Bonus for verified skills
          if (userSkill.isVerified) {
            projectMatch.matchScore += 0.1;
          }
        }
      }

      // Calculate final match scores (percentage of skills matched)
      const matches = Array.from(projectMatchMap.values())
        .map((match) => {
          const totalSkills =
            match.matchingSkills.length + match.missingSkills.length;
          const matchPercentage =
            totalSkills > 0 ? match.matchingSkills.length / totalSkills : 0;
          return {
            ...match,
            matchScore: matchPercentage + match.matchScore * 0.1, // Add proficiency bonus
          };
        })
        .filter((match) => match.matchScore >= input.minMatchScore)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, input.limit);

      return matches;
    }),

  // Recommend users for a specific project
  recommendUsers: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        limit: z.number().min(1).max(50).default(20),
        minProficiency: z.number().min(1).max(5).default(1),
        requireVerified: z.boolean().default(false),
        excludeUserIds: z.array(z.string()).default([]),
      })
    )
    .query(async ({ input }) => {
      // Check if user has access to this project
      const project = await db.project.findUnique({
        where: { id: input.projectId },
        select: {
          id: true,
          creatorId: true,
          title: true,
          skillNeeds: {
            where: {
              isFilled: false,
            },
            include: {
              skill: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                },
              },
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

      const neededSkillIds = project.skillNeeds.map((sn) => sn.skillId);

      if (neededSkillIds.length === 0) {
        return [];
      }

      // Find users with the needed skills
      const userSkills = await db.userSkill.findMany({
        where: {
          skillId: {
            in: neededSkillIds,
          },
          proficiencyLevel: {
            gte: input.minProficiency,
          },
          ...(input.requireVerified ? { isVerified: true } : {}),
          userId: {
            notIn: [project.creatorId, ...input.excludeUserIds],
          },
          user: {
            isPublic: true,
          },
        },
        include: {
          skill: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              imageUrl: true,
              location: true,
            },
          },
        },
      });

      // Calculate match scores
      const userMatchMap = new Map<string, SkillMatch>();

      for (const userSkill of userSkills) {
        const userId = userSkill.userId;

        if (!userMatchMap.has(userId)) {
          userMatchMap.set(userId, {
            userId,
            matchScore: 0,
            commonSkills: [],
            complementarySkills: [],
            user: userSkill.user,
          });
        }

        const userMatch = userMatchMap.get(userId)!;
        userMatch.commonSkills.push(userSkill.skill.name);

        // Score based on proficiency level
        userMatch.matchScore += userSkill.proficiencyLevel * 0.2;

        // Bonus for verified skills
        if (userSkill.isVerified) {
          userMatch.matchScore += 0.1;
        }
      }

      // Sort by match score and return top matches
      const matches = Array.from(userMatchMap.values())
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, input.limit);

      return matches;
    }),

  // Get skill compatibility between two users
  getCompatibility: protectedProcedure
    .input(
      z.object({
        userId1: z.string(),
        userId2: z.string(),
      })
    )
    .query(async ({ input }) => {
      const [user1Skills, user2Skills] = await Promise.all([
        db.userSkill.findMany({
          where: { userId: input.userId1 },
          include: {
            skill: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
        }),
        db.userSkill.findMany({
          where: { userId: input.userId2 },
          include: {
            skill: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
        }),
      ]);

      const user1SkillIds = new Set(user1Skills.map((us) => us.skillId));
      const user2SkillIds = new Set(user2Skills.map((us) => us.skillId));

      // Find common skills
      const commonSkillIds = [...user1SkillIds].filter((skillId) =>
        user2SkillIds.has(skillId)
      );
      const commonSkills = user1Skills
        .filter((us) => commonSkillIds.includes(us.skillId))
        .map((us) => ({
          skill: us.skill,
          user1Proficiency: us.proficiencyLevel,
          user2Proficiency:
            user2Skills.find((u2s) => u2s.skillId === us.skillId)
              ?.proficiencyLevel || 0,
        }));

      // Find complementary skills (unique to each user)
      const user1UniqueSkills = user1Skills.filter(
        (us) => !user2SkillIds.has(us.skillId)
      );
      const user2UniqueSkills = user2Skills.filter(
        (us) => !user1SkillIds.has(us.skillId)
      );

      // Calculate compatibility score
      const totalSkills = user1Skills.length + user2Skills.length;
      const sharedSkillWeight = (commonSkills.length / totalSkills) * 0.6; // 60% weight for shared skills
      const complementaryWeight =
        ((user1UniqueSkills.length + user2UniqueSkills.length) / totalSkills) *
        0.4; // 40% weight for complementary skills
      const compatibilityScore = Math.min(
        1,
        sharedSkillWeight + complementaryWeight
      );

      return {
        compatibilityScore,
        commonSkills,
        user1UniqueSkills: user1UniqueSkills.map((us) => ({
          skill: us.skill,
          proficiency: us.proficiencyLevel,
        })),
        user2UniqueSkills: user2UniqueSkills.map((us) => ({
          skill: us.skill,
          proficiency: us.proficiencyLevel,
        })),
      };
    }),

  // Get project skill gaps
  getProjectSkillGaps: publicProcedure
    .input(
      z.object({
        projectId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const project = await db.project.findUnique({
        where: { id: input.projectId },
        include: {
          skillNeeds: {
            include: {
              skill: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                  _count: {
                    select: {
                      userSkills: {
                        where: {
                          proficiencyLevel: {
                            gte: 3, // Only count users with good proficiency
                          },
                        },
                      },
                    },
                  },
                },
              },
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

      const skillGaps = project.skillNeeds.map((need) => ({
        skillNeed: {
          id: need.id,
          hoursNeeded: need.hoursNeeded,
          description: need.description,
          isFilled: need.isFilled,
        },
        skill: need.skill,
        availableUsers: need.skill._count.userSkills,
        difficulty:
          need.skill._count.userSkills < 5
            ? 'high'
            : need.skill._count.userSkills < 15
              ? 'medium'
              : 'low',
      }));

      const totalNeeds = skillGaps.length;
      const filledNeeds = skillGaps.filter(
        (gap) => gap.skillNeed.isFilled
      ).length;
      const criticalGaps = skillGaps.filter(
        (gap) => !gap.skillNeed.isFilled && gap.difficulty === 'high'
      ).length;

      return {
        project: {
          id: project.id,
          title: project.title,
        },
        skillGaps,
        summary: {
          totalNeeds,
          filledNeeds,
          criticalGaps,
          completionPercentage:
            totalNeeds > 0 ? (filledNeeds / totalNeeds) * 100 : 0,
        },
      };
    }),
});
