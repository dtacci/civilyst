import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createMockContext } from '../../test-utils';
import { skillMatchingRouter } from '../skillMatching';

// Mock the database
const mockDb = {
  userSkill: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  user: {
    count: jest.fn(),
  },
  skill: {
    count: jest.fn(),
  },
};

jest.mock('~/server/db', () => ({
  db: mockDb,
}));

describe('skillMatchingRouter - Optimized Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findMatchesOptimized', () => {
    it('should return optimized matches with performance focus', async () => {
      const ctx = createMockContext({ userId: 'user-1' });

      // Mock user's top skills
      mockDb.userSkill.findMany
        .mockResolvedValueOnce([
          {
            skillId: 'skill-1',
            proficiencyLevel: 4,
            skill: { category: 'Programming' },
          },
          {
            skillId: 'skill-2',
            proficiencyLevel: 5,
            skill: { category: 'Design' },
          },
        ])
        .mockResolvedValueOnce([
          // Mock potential matches
          {
            userId: 'user-2',
            skillId: 'skill-3',
            proficiencyLevel: 4,
            isVerified: true,
            skill: { name: 'React', category: 'Programming' },
            user: {
              id: 'user-2',
              firstName: 'Jane',
              lastName: 'Doe',
              imageUrl: null,
              location: 'San Francisco, CA',
            },
          },
          {
            userId: 'user-3',
            skillId: 'skill-4',
            proficiencyLevel: 3,
            isVerified: false,
            skill: { name: 'Figma', category: 'Design' },
            user: {
              id: 'user-3',
              firstName: 'Bob',
              lastName: 'Smith',
              imageUrl: null,
              location: 'New York, NY',
            },
          },
        ]);

      const caller = skillMatchingRouter.createCaller(ctx);
      const result = await caller.findMatchesOptimized({
        limit: 10,
        minProficiency: 3,
        prioritizeRecent: true,
        fastMode: true,
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        userId: expect.any(String),
        matchScore: expect.any(Number),
        user: expect.objectContaining({
          id: expect.any(String),
          firstName: expect.any(String),
        }),
        scoreBreakdown: expect.objectContaining({
          skillCompatibility: expect.any(Number),
          proficiencyBonus: expect.any(Number),
        }),
        confidence: expect.any(Number),
      });

      // Verify performance optimizations
      expect(mockDb.userSkill.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10, // Limited to top skills
          orderBy: expect.arrayContaining([
            { proficiencyLevel: 'desc' },
            { isVerified: 'desc' },
          ]),
        })
      );
    });

    it('should filter by skill categories when provided', async () => {
      const ctx = createMockContext({ userId: 'user-1' });

      mockDb.userSkill.findMany
        .mockResolvedValueOnce([
          {
            skillId: 'skill-1',
            proficiencyLevel: 4,
            skill: { category: 'Programming' },
          },
        ])
        .mockResolvedValueOnce([]);

      const caller = skillMatchingRouter.createCaller(ctx);
      await caller.findMatchesOptimized({
        skillCategories: ['Design'],
        limit: 5,
      });

      // Check that the second call (for matches) used category filtering
      expect(mockDb.userSkill.findMany).toHaveBeenLastCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            skill: expect.objectContaining({
              category: { in: ['Design'] },
            }),
          }),
        })
      );
    });

    it('should prioritize recent users when prioritizeRecent is true', async () => {
      const ctx = createMockContext({ userId: 'user-1' });

      mockDb.userSkill.findMany
        .mockResolvedValueOnce([
          {
            skillId: 'skill-1',
            proficiencyLevel: 4,
            skill: { category: 'Programming' },
          },
        ])
        .mockResolvedValueOnce([]);

      const caller = skillMatchingRouter.createCaller(ctx);
      await caller.findMatchesOptimized({
        prioritizeRecent: true,
      });

      // Check that recent activity filter was applied
      expect(mockDb.userSkill.findMany).toHaveBeenLastCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user: expect.objectContaining({
              isPublic: true,
              updatedAt: expect.objectContaining({
                gte: expect.any(Date),
              }),
            }),
          }),
        })
      );
    });
  });

  describe('batchFindMatches', () => {
    it('should process multiple users efficiently', async () => {
      const ctx = createMockContext({ userId: 'user-1' });

      mockDb.userSkill.findMany.mockResolvedValue([
        {
          userId: 'user-1',
          skillId: 'skill-1',
          proficiencyLevel: 4,
          skill: { name: 'JavaScript', category: 'Programming' },
        },
        {
          userId: 'user-2',
          skillId: 'skill-2',
          proficiencyLevel: 3,
          skill: { name: 'Design', category: 'UI/UX' },
        },
        {
          userId: 'user-3',
          skillId: 'skill-3',
          proficiencyLevel: 5,
          skill: { name: 'Python', category: 'Programming' },
        },
      ]);

      const caller = skillMatchingRouter.createCaller(ctx);
      const result = await caller.batchFindMatches({
        userIds: ['user-1', 'user-2', 'user-3'],
        matchPerUser: 2,
        minProficiency: 3,
      });

      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        userId: expect.any(String),
        complementaryUsers: expect.any(Array),
        sharedSkillCategories: expect.any(Array),
        teamSynergy: expect.any(Number),
      });

      // Verify batch processing efficiency
      expect(mockDb.userSkill.findMany).toHaveBeenCalledTimes(1);
      expect(mockDb.userSkill.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: { in: ['user-1', 'user-2', 'user-3'] },
          }),
        })
      );
    });

    it('should calculate team synergy correctly', async () => {
      const ctx = createMockContext({ userId: 'user-1' });

      mockDb.userSkill.findMany.mockResolvedValue([
        {
          userId: 'user-1',
          skillId: 'skill-1',
          proficiencyLevel: 4,
          skill: { name: 'JavaScript', category: 'Programming' },
        },
        {
          userId: 'user-2',
          skillId: 'skill-2',
          proficiencyLevel: 3,
          skill: { name: 'Design', category: 'UI/UX' },
        },
      ]);

      const caller = skillMatchingRouter.createCaller(ctx);
      const result = await caller.batchFindMatches({
        userIds: ['user-1', 'user-2'],
        matchPerUser: 5,
      });

      // Each user should have the other as complementary (different categories)
      expect(result[0].complementaryUsers).toContain('user-2');
      expect(result[1].complementaryUsers).toContain('user-1');
      expect(result[0].teamSynergy).toBeGreaterThan(0);
      expect(result[1].teamSynergy).toBeGreaterThan(0);
    });
  });

  describe('getPerformanceMetrics', () => {
    it('should return comprehensive performance analytics', async () => {
      const ctx = createMockContext({ userId: 'user-1' });

      // Mock all the count queries
      mockDb.user.count.mockResolvedValue(1000);
      mockDb.skill.count.mockResolvedValue(150);
      mockDb.userSkill.count
        .mockResolvedValueOnce(5000) // total user skills
        .mockResolvedValueOnce(1500) // verified skills
        .mockResolvedValueOnce(300); // recently active users

      const caller = skillMatchingRouter.createCaller(ctx);
      const result = await caller.getPerformanceMetrics();

      expect(result).toMatchObject({
        dataset: {
          totalUsers: 1000,
          totalSkills: 150,
          totalUserSkills: 5000,
          verifiedSkills: 1500,
          recentlyActiveUsers: 300,
          averageSkillsPerUser: 5,
          verificationRate: 0.3,
        },
        performance: {
          algorithms: expect.arrayContaining([
            'findMatches (comprehensive)',
            'findMatchesOptimized (fast)',
            'advancedMatching (ML-inspired)',
            'batchFindMatches (team formation)',
          ]),
          optimizations: expect.arrayContaining([
            'Selective field loading',
            'Batch processing',
            'Proficiency-based filtering',
          ]),
          recommendations: expect.any(Array),
        },
      });

      // Verify all count queries were made
      expect(mockDb.user.count).toHaveBeenCalledTimes(2);
      expect(mockDb.skill.count).toHaveBeenCalledTimes(1);
      expect(mockDb.userSkill.count).toHaveBeenCalledTimes(2);
    });

    it('should provide different recommendations based on dataset size', async () => {
      const ctx = createMockContext({ userId: 'user-1' });

      // Mock large dataset
      mockDb.user.count.mockResolvedValue(15000); // > 10k users
      mockDb.skill.count.mockResolvedValue(500);
      mockDb.userSkill.count
        .mockResolvedValueOnce(150000) // > 100k user skills
        .mockResolvedValueOnce(5000) // Low verification rate
        .mockResolvedValueOnce(5000);

      const caller = skillMatchingRouter.createCaller(ctx);
      const result = await caller.getPerformanceMetrics();

      expect(result.performance.recommendations).toEqual(
        expect.arrayContaining([
          'Consider implementing Redis caching',
          'Consider database query optimization',
          'Encourage more skill verification for better matching accuracy',
        ])
      );
    });
  });
});
