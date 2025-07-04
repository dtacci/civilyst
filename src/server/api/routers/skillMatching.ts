import { z } from 'zod';
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from '~/server/api/trpc';
import { db } from '~/server/db';
import { TRPCError } from '@trpc/server';

// Enhanced types for matching algorithm
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
  // Enhanced scoring breakdown
  scoreBreakdown: {
    skillCompatibility: number;
    proficiencyBonus: number;
    verificationBonus: number;
    locationBonus: number;
    availabilityBonus: number;
  };
  confidence: number; // Overall confidence in match quality (0-1)
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

// Enhanced matching weights configuration
interface MatchingWeights {
  skillCompatibility: number;    // Base compatibility score (0.4)
  proficiencyLevel: number;      // Proficiency level bonus (0.2)
  verifiedSkills: number;        // Verified skills bonus (0.15)
  locationProximity: number;     // Location proximity bonus (0.15)
  availability: number;          // Availability matching bonus (0.1)
}

const DEFAULT_WEIGHTS: MatchingWeights = {
  skillCompatibility: 0.4,
  proficiencyLevel: 0.2,
  verifiedSkills: 0.15,
  locationProximity: 0.15,
  availability: 0.1,
};

// Helper functions for enhanced matching algorithm
function calculateLocationProximity(location1: string, location2: string): number {
  // Simplified location proximity calculation
  // In a production system, this would use geolocation APIs
  const loc1Lower = location1.toLowerCase();
  const loc2Lower = location2.toLowerCase();
  
  // Exact match
  if (loc1Lower === loc2Lower) {
    return 1.0;
  }
  
  // Check for city/state matches
  const loc1Parts = loc1Lower.split(',').map(part => part.trim());
  const loc2Parts = loc2Lower.split(',').map(part => part.trim());
  
  // Find common parts (city, state, country)
  const commonParts = loc1Parts.filter(part => 
    loc2Parts.some(otherPart => otherPart.includes(part) || part.includes(otherPart))
  );
  
  // Return proximity score based on common location parts
  return Math.min(1, commonParts.length / Math.max(loc1Parts.length, loc2Parts.length));
}

function calculateScoreVariance(scoreBreakdown: Record<string, number>): number {
  const scores = Object.values(scoreBreakdown);
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  
  // Normalize variance to 0-1 range (higher variance = lower confidence)
  return Math.min(1, variance / mean);
}

// Types for advanced algorithm functions
interface UserProfile {
  id: string;
  userSkills: Array<{
    skillId: string;
    proficiencyLevel: number;
    skill: {
      id: string;
      name: string;
      category: string;
    };
  }>;
}

interface MatchingPreferences {
  prioritySkills?: string[];
  avoidSkills?: string[];
  preferredProficiencyRange?: {
    min: number;
    max: number;
  };
  locationRadius?: number;
}

// Advanced algorithm implementations
async function collaborativeFiltering(
  userProfile: UserProfile,
  preferences: MatchingPreferences,
  limit: number
): Promise<SkillMatch[]> {
  // Find users with similar skill profiles (collaborative filtering)
  const userSkillIds = userProfile.userSkills.map(us => us.skillId);
  
  // Find users who have similar skills to the target user
  const similarUsers = await db.userSkill.findMany({
    where: {
      skillId: { in: userSkillIds },
      userId: { not: userProfile.id },
      proficiencyLevel: {
        gte: preferences.preferredProficiencyRange?.min || 1,
        lte: preferences.preferredProficiencyRange?.max || 5,
      },
      user: { isPublic: true },
    },
    include: {
      skill: true,
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

  // Group by user and calculate similarity scores
  interface UserSimilarityData {
    user: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      imageUrl: string | null;
      location: string | null;
    };
    skills: typeof similarUsers;
    score: number;
  }
  
  const userSimilarity = new Map<string, UserSimilarityData>();
  
  for (const userSkill of similarUsers) {
    const userId = userSkill.userId;
    if (!userSimilarity.has(userId)) {
      userSimilarity.set(userId, {
        user: userSkill.user,
        skills: [],
        score: 0,
      });
    }
    
    const userData = userSimilarity.get(userId)!;
    userData.skills.push(userSkill);
    
    // Calculate Jaccard similarity coefficient
    const commonSkills = userData.skills.length;
    const totalUniqueSkills = userSkillIds.length; // Simplified for this example
    userData.score = commonSkills / totalUniqueSkills;
  }

  // Convert to SkillMatch format
  return Array.from(userSimilarity.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(userData => ({
      userId: userData.user.id,
      matchScore: userData.score,
      commonSkills: userData.skills.map(s => s.skill.name),
      complementarySkills: [],
      user: userData.user,
      scoreBreakdown: {
        skillCompatibility: userData.score * 0.8,
        proficiencyBonus: 0.1,
        verificationBonus: 0.05,
        locationBonus: 0.05,
        availabilityBonus: 0,
      },
      confidence: userData.score,
    }));
}

async function contentBasedFiltering(
  userProfile: UserProfile,
  preferences: MatchingPreferences,
  limit: number
): Promise<SkillMatch[]> {
  // Find users with complementary skills in the same categories
  const userCategories = [...new Set(userProfile.userSkills.map(us => us.skill.category))];
  const userSkillIds = userProfile.userSkills.map(us => us.skillId);
  
  const complementaryUsers = await db.userSkill.findMany({
    where: {
      skill: {
        category: { in: userCategories },
        id: { notIn: userSkillIds }, // Different skills, same categories
      },
      userId: { not: userProfile.id },
      proficiencyLevel: {
        gte: preferences.preferredProficiencyRange?.min || 1,
        lte: preferences.preferredProficiencyRange?.max || 5,
      },
      user: { isPublic: true },
    },
    include: {
      skill: true,
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

  // Group by user and calculate complementarity scores
  const userComplementarity = new Map<string, UserSimilarityData>();
  
  for (const userSkill of complementaryUsers) {
    const userId = userSkill.userId;
    if (!userComplementarity.has(userId)) {
      userComplementarity.set(userId, {
        user: userSkill.user,
        skills: [],
        score: 0,
      });
    }
    
    const userData = userComplementarity.get(userId)!;
    userData.skills.push(userSkill);
    
    // Calculate complementarity score based on skill categories coverage
    const categoryOverlap = userCategories.filter(cat => 
      userData.skills.some(s => s.skill.category === cat)
    ).length;
    userData.score = categoryOverlap / userCategories.length;
  }

  // Convert to SkillMatch format
  return Array.from(userComplementarity.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(userData => ({
      userId: userData.user.id,
      matchScore: userData.score,
      commonSkills: [],
      complementarySkills: userData.skills.map(s => s.skill.name),
      user: userData.user,
      scoreBreakdown: {
        skillCompatibility: userData.score * 0.8,
        proficiencyBonus: 0.1,
        verificationBonus: 0.05,
        locationBonus: 0.05,
        availabilityBonus: 0,
      },
      confidence: userData.score,
    }));
}

function mergeAndRankMatches(
  collabMatches: SkillMatch[],
  contentMatches: SkillMatch[],
  limit: number
): SkillMatch[] {
  // Merge results and remove duplicates, combining scores for users appearing in both
  const mergedMap = new Map<string, SkillMatch>();
  
  // Add collaborative filtering results
  for (const match of collabMatches) {
    mergedMap.set(match.userId, {
      ...match,
      matchScore: match.matchScore * 0.6, // Weight collaborative results
    });
  }
  
  // Add content-based results, merging with existing if present
  for (const match of contentMatches) {
    if (mergedMap.has(match.userId)) {
      const existing = mergedMap.get(match.userId)!;
      existing.matchScore += match.matchScore * 0.4; // Weight content-based results
      existing.complementarySkills = [...existing.complementarySkills, ...match.complementarySkills];
      existing.confidence = Math.max(existing.confidence, match.confidence);
    } else {
      mergedMap.set(match.userId, {
        ...match,
        matchScore: match.matchScore * 0.4,
      });
    }
  }
  
  return Array.from(mergedMap.values())
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}

async function calculateDetailedCompatibility(userId1: string, userId2: string): Promise<{
  overallScore: number;
  skillOverlap: number;
  complementarity: number;
  proficiencyAlignment: number;
  recommendations: string[];
}> {
  // Implementation for detailed compatibility analysis
  const [user1Skills, user2Skills] = await Promise.all([
    db.userSkill.findMany({
      where: { userId: userId1 },
      include: { skill: true },
    }),
    db.userSkill.findMany({
      where: { userId: userId2 },
      include: { skill: true },
    }),
  ]);

  const compatibility = {
    overallScore: 0,
    skillOverlap: 0,
    complementarity: 0,
    proficiencyAlignment: 0,
    recommendations: [],
  };

  // Calculate various compatibility metrics
  const user1SkillIds = new Set(user1Skills.map(us => us.skillId));
  const user2SkillIds = new Set(user2Skills.map(us => us.skillId));
  
  const intersection = [...user1SkillIds].filter(id => user2SkillIds.has(id));
  const union = [...new Set([...user1SkillIds, ...user2SkillIds])];
  
  compatibility.skillOverlap = intersection.length / union.length;
  compatibility.overallScore = compatibility.skillOverlap * 0.7 + compatibility.complementarity * 0.3;

  return compatibility;
}

async function generateCollaborationRecommendations(_compatibility: {
  overallScore: number;
  skillOverlap: number;
  complementarity: number;
  proficiencyAlignment: number;
  recommendations: string[];
}): Promise<string[]> {
  // Generate specific recommendations for collaboration
  return [
    'Consider collaborating on projects that leverage both skill sets',
    'Explore knowledge sharing opportunities',
    'Plan complementary skill development',
  ];
}

export const skillMatchingRouter = createTRPCRouter({
  // Enhanced algorithm for finding users with complementary skills
  findMatches: protectedProcedure
    .input(
      z.object({
        userId: z.string().optional(), // If not provided, use current user
        skillIds: z.array(z.string()).optional(), // Specific skills to match against
        excludeUserIds: z.array(z.string()).default([]), // Users to exclude from results
        limit: z.number().min(1).max(50).default(20),
        minProficiency: z.number().min(1).max(5).default(1),
        requireVerified: z.boolean().default(false),
        // Enhanced filtering options
        filters: z.object({
          skillCategories: z.array(z.string()).optional(), // Filter by skill categories
          location: z.string().optional(), // Location-based filtering
          maxDistance: z.number().optional(), // Maximum distance in km
          minMatchScore: z.number().min(0).max(1).default(0.1), // Minimum match score threshold
          prioritizeComplementary: z.boolean().default(true), // Prioritize complementary vs similar skills
        }).default({}),
        // Custom weighting factors
        weights: z.object({
          skillCompatibility: z.number().min(0).max(1).default(DEFAULT_WEIGHTS.skillCompatibility),
          proficiencyLevel: z.number().min(0).max(1).default(DEFAULT_WEIGHTS.proficiencyLevel),
          verifiedSkills: z.number().min(0).max(1).default(DEFAULT_WEIGHTS.verifiedSkills),
          locationProximity: z.number().min(0).max(1).default(DEFAULT_WEIGHTS.locationProximity),
          availability: z.number().min(0).max(1).default(DEFAULT_WEIGHTS.availability),
        }).default(DEFAULT_WEIGHTS),
      })
    )
    .query(async ({ input, ctx }) => {
      const targetUserId = input.userId || ctx.session.user.userId;
      const { filters, weights } = input;

      // Get the target user's skills and profile
      const [userSkills, targetUser] = await Promise.all([
        db.userSkill.findMany({
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
        }),
        db.user.findUnique({
          where: { id: targetUserId },
          select: { location: true },
        }),
      ]);

      if (userSkills.length === 0) {
        return [];
      }

      const userSkillIds = userSkills.map((us) => us.skillId);
      const userSkillCategories = [
        ...new Set(userSkills.map((us) => us.skill.category)),
      ];

      // Build dynamic where clause based on filters
      const whereClause: Record<string, unknown> = {
        userId: {
          notIn: [targetUserId, ...input.excludeUserIds],
        },
        proficiencyLevel: {
          gte: input.minProficiency,
        },
        ...(input.requireVerified ? { isVerified: true } : {}),
        user: {
          isPublic: true,
        },
      };

      // Apply skill category filtering
      if (filters.skillCategories && filters.skillCategories.length > 0) {
        whereClause.skill = {
          ...whereClause.skill,
          category: {
            in: filters.skillCategories,
          },
        };
      }

      // Apply location filtering if specified
      if (filters.location) {
        whereClause.user.location = {
          contains: filters.location,
          mode: 'insensitive' as const,
        };
      }

      // Determine skill matching strategy
      const skillMatchConditions = [];
      
      if (filters.prioritizeComplementary) {
        // Complementary skills (same categories, different skills)
        skillMatchConditions.push({
          skill: {
            category: {
              in: userSkillCategories,
            },
            id: {
              notIn: userSkillIds,
            },
          },
        });
      }

      // Similar skills for collaboration
      skillMatchConditions.push({
        skillId: {
          in: input.skillIds || userSkillIds,
        },
      });

      whereClause.OR = skillMatchConditions;

      // Find potential matches with optimized query
      const potentialMatches = await db.userSkill.findMany({
        where: whereClause,
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
        // Optimize for large datasets
        orderBy: [
          { proficiencyLevel: 'desc' },
          { isVerified: 'desc' },
        ],
      });

      // Enhanced scoring algorithm
      const matchMap = new Map<string, SkillMatch>();

      for (const match of potentialMatches) {
        const userId = match.userId;

        if (!matchMap.has(userId)) {
          matchMap.set(userId, {
            userId,
            matchScore: 0,
            commonSkills: [],
            complementarySkills: [],
            user: match.user,
            scoreBreakdown: {
              skillCompatibility: 0,
              proficiencyBonus: 0,
              verificationBonus: 0,
              locationBonus: 0,
              availabilityBonus: 0,
            },
            confidence: 0,
          });
        }

        const userMatch = matchMap.get(userId)!;

        // Calculate skill compatibility score
        const isCommonSkill = userSkillIds.includes(match.skillId);
        if (isCommonSkill) {
          userMatch.commonSkills.push(match.skill.name);
          userMatch.scoreBreakdown.skillCompatibility += weights.skillCompatibility * 0.8; // Collaboration bonus
        } else {
          userMatch.complementarySkills.push(match.skill.name);
          userMatch.scoreBreakdown.skillCompatibility += weights.skillCompatibility * 1.0; // Complementary bonus
        }

        // Calculate proficiency bonus (normalized to 0-1)
        const proficiencyNormalized = (match.proficiencyLevel - 1) / 4; // Scale 1-5 to 0-1
        userMatch.scoreBreakdown.proficiencyBonus += weights.proficiencyLevel * proficiencyNormalized;

        // Calculate verification bonus
        if (match.isVerified) {
          userMatch.scoreBreakdown.verificationBonus += weights.verifiedSkills;
        }

        // Calculate location proximity bonus
        if (targetUser?.location && match.user.location) {
          const locationBonus = calculateLocationProximity(targetUser.location, match.user.location);
          userMatch.scoreBreakdown.locationBonus = Math.max(
            userMatch.scoreBreakdown.locationBonus,
            weights.locationProximity * locationBonus
          );
        }

        // TODO: Implement availability bonus when calendar integration is available
        // userMatch.scoreBreakdown.availabilityBonus = weights.availability * availabilityScore;
      }

      // Calculate final scores and confidence levels
      const matches = Array.from(matchMap.values()).map((match) => {
        const totalScore = Object.values(match.scoreBreakdown).reduce((sum, score) => sum + score, 0);
        
        // Calculate confidence based on score distribution and number of skills
        const scoreVariance = calculateScoreVariance(match.scoreBreakdown);
        const skillCount = match.commonSkills.length + match.complementarySkills.length;
        const confidence = Math.min(1, (totalScore * (1 - scoreVariance)) * Math.min(1, skillCount / 3));

        return {
          ...match,
          matchScore: totalScore,
          confidence,
        };
      });

      // Apply minimum match score filter and sort
      const filteredMatches = matches
        .filter((match) => match.matchScore >= filters.minMatchScore)
        .sort((a, b) => {
          // Primary sort by match score
          if (Math.abs(b.matchScore - a.matchScore) > 0.05) {
            return b.matchScore - a.matchScore;
          }
          // Secondary sort by confidence for similar scores
          return b.confidence - a.confidence;
        })
        .slice(0, input.limit);

      return filteredMatches;
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

  // Advanced skill matching algorithm with ML-inspired features
  advancedMatching: protectedProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        algorithm: z.enum(['collaborative', 'content_based', 'hybrid']).default('hybrid'),
        preferences: z.object({
          prioritySkills: z.array(z.string()).default([]), // Skills to prioritize
          avoidSkills: z.array(z.string()).default([]), // Skills to avoid
          preferredProficiencyRange: z.object({
            min: z.number().min(1).max(5).default(1),
            max: z.number().min(1).max(5).default(5),
          }).default({ min: 1, max: 5 }),
          locationRadius: z.number().optional(), // km radius for location matching
        }).default({}),
        limit: z.number().min(1).max(100).default(30),
      })
    )
    .query(async ({ input, ctx }) => {
      const targetUserId = input.userId || ctx.session.user.userId;
      const { algorithm, preferences } = input;

      // Get comprehensive user profile
      const userProfile = await db.user.findUnique({
        where: { id: targetUserId },
        include: {
          userSkills: {
            include: {
              skill: true,
            },
          },
        },
      });

      if (!userProfile || userProfile.userSkills.length === 0) {
        return [];
      }

      let matches: SkillMatch[] = [];

      switch (algorithm) {
        case 'collaborative':
          matches = await collaborativeFiltering(userProfile, preferences, input.limit);
          break;
        case 'content_based':
          matches = await contentBasedFiltering(userProfile, preferences, input.limit);
          break;
        case 'hybrid':
          const [collabMatches, contentMatches] = await Promise.all([
            collaborativeFiltering(userProfile, preferences, Math.ceil(input.limit / 2)),
            contentBasedFiltering(userProfile, preferences, Math.ceil(input.limit / 2)),
          ]);
          matches = mergeAndRankMatches(collabMatches, contentMatches, input.limit);
          break;
      }

      return matches;
    }),

  // Get detailed skill compatibility analysis
  getDetailedCompatibility: protectedProcedure
    .input(
      z.object({
        userId1: z.string(),
        userId2: z.string(),
        includeRecommendations: z.boolean().default(true),
      })
    )
    .query(async ({ input }) => {
      const compatibility = await calculateDetailedCompatibility(input.userId1, input.userId2);
      
      if (input.includeRecommendations) {
        const recommendations = await generateCollaborationRecommendations(compatibility);
        return {
          ...compatibility,
          recommendations,
        };
      }

      return compatibility;
    }),
});
