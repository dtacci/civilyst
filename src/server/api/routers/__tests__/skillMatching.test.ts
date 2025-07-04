import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createMockContext } from '../../test-utils';
import { skillMatchingRouter } from '../skillMatching';

// Mock the database
const mockDb = {
  userSkill: {
    findMany: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  project: {
    findUnique: jest.fn(),
  },
  projectSkillNeed: {
    findMany: jest.fn(),
  },
};

jest.mock('~/server/db', () => ({
  db: mockDb,
}));

describe('skillMatchingRouter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findMatches', () => {
    it('should return empty array when user has no skills', async () => {
      const ctx = createMockContext({ userId: 'user-1' });
      
      mockDb.userSkill.findMany.mockResolvedValue([]);
      mockDb.user.findUnique.mockResolvedValue({ location: 'San Francisco, CA' });

      const caller = skillMatchingRouter.createCaller(ctx);
      const result = await caller.findMatches({});

      expect(result).toEqual([]);
      expect(mockDb.userSkill.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
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
    });

    it('should calculate match scores correctly with enhanced algorithm', async () => {
      const ctx = createMockContext({ userId: 'user-1' });
      
      // Mock user skills
      mockDb.userSkill.findMany
        .mockResolvedValueOnce([
          {
            userId: 'user-1',
            skillId: 'skill-1',
            proficiencyLevel: 4,
            isVerified: true,
            skill: { id: 'skill-1', name: 'JavaScript', category: 'Programming' },
          },
        ])
        .mockResolvedValueOnce([
          {
            userId: 'user-2',
            skillId: 'skill-2',
            proficiencyLevel: 3,
            isVerified: false,
            skill: { id: 'skill-2', name: 'React', category: 'Programming' },
            user: {
              id: 'user-2',
              firstName: 'Jane',
              lastName: 'Doe',
              imageUrl: null,
              location: 'San Francisco, CA',
            },
          },
        ]);

      mockDb.user.findUnique.mockResolvedValue({ location: 'San Francisco, CA' });

      const caller = skillMatchingRouter.createCaller(ctx);
      const result = await caller.findMatches({
        weights: {
          skillCompatibility: 0.5,
          proficiencyLevel: 0.2,
          verifiedSkills: 0.15,
          locationProximity: 0.15,
          availability: 0.0,
        },
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        userId: 'user-2',
        user: {
          id: 'user-2',
          firstName: 'Jane',
          lastName: 'Doe',
        },
        scoreBreakdown: expect.objectContaining({
          skillCompatibility: expect.any(Number),
          proficiencyBonus: expect.any(Number),
          verificationBonus: expect.any(Number),
          locationBonus: expect.any(Number),
        }),
        confidence: expect.any(Number),
      });
    });

    it('should filter by skill categories when specified', async () => {
      const ctx = createMockContext({ userId: 'user-1' });
      
      mockDb.userSkill.findMany
        .mockResolvedValueOnce([
          {
            userId: 'user-1',
            skillId: 'skill-1',
            skill: { id: 'skill-1', name: 'JavaScript', category: 'Programming' },
          },
        ])
        .mockResolvedValueOnce([]);

      mockDb.user.findUnique.mockResolvedValue({ location: 'San Francisco, CA' });

      const caller = skillMatchingRouter.createCaller(ctx);
      await caller.findMatches({
        filters: {
          skillCategories: ['Design'],
        },
      });

      expect(mockDb.userSkill.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            skill: expect.objectContaining({
              category: {
                in: ['Design'],
              },
            }),
          }),
        })
      );
    });

    it('should apply minimum match score filter', async () => {
      const ctx = createMockContext({ userId: 'user-1' });
      
      mockDb.userSkill.findMany
        .mockResolvedValueOnce([
          {
            userId: 'user-1',
            skillId: 'skill-1',
            skill: { id: 'skill-1', name: 'JavaScript', category: 'Programming' },
          },
        ])
        .mockResolvedValueOnce([
          {
            userId: 'user-2',
            skillId: 'skill-2',
            proficiencyLevel: 1, // Low proficiency
            isVerified: false,
            skill: { id: 'skill-2', name: 'React', category: 'Programming' },
            user: {
              id: 'user-2',
              firstName: 'Jane',
              lastName: 'Doe',
              imageUrl: null,
              location: 'New York, NY', // Different location
            },
          },
        ]);

      mockDb.user.findUnique.mockResolvedValue({ location: 'San Francisco, CA' });

      const caller = skillMatchingRouter.createCaller(ctx);
      const result = await caller.findMatches({
        filters: {
          minMatchScore: 0.8, // High threshold
        },
      });

      expect(result).toHaveLength(0); // Should filter out low-scoring matches
    });
  });

  describe('advancedMatching', () => {
    it('should support collaborative filtering algorithm', async () => {
      const ctx = createMockContext({ userId: 'user-1' });
      
      mockDb.user.findUnique.mockResolvedValue({
        id: 'user-1',
        userSkills: [
          {
            skillId: 'skill-1',
            proficiencyLevel: 4,
            skill: { id: 'skill-1', name: 'JavaScript', category: 'Programming' },
          },
        ],
      });

      mockDb.userSkill.findMany.mockResolvedValue([
        {
          userId: 'user-2',
          skillId: 'skill-1',
          proficiencyLevel: 3,
          skill: { id: 'skill-1', name: 'JavaScript', category: 'Programming' },
          user: {
            id: 'user-2',
            firstName: 'Jane',
            lastName: 'Doe',
            imageUrl: null,
            location: 'San Francisco, CA',
          },
        },
      ]);

      const caller = skillMatchingRouter.createCaller(ctx);
      const result = await caller.advancedMatching({
        algorithm: 'collaborative',
      });

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('user-2');
    });

    it('should support content-based filtering algorithm', async () => {
      const ctx = createMockContext({ userId: 'user-1' });
      
      mockDb.user.findUnique.mockResolvedValue({
        id: 'user-1',
        userSkills: [
          {
            skillId: 'skill-1',
            proficiencyLevel: 4,
            skill: { id: 'skill-1', name: 'JavaScript', category: 'Programming' },
          },
        ],
      });

      mockDb.userSkill.findMany.mockResolvedValue([
        {
          userId: 'user-2',
          skillId: 'skill-2',
          proficiencyLevel: 3,
          skill: { id: 'skill-2', name: 'React', category: 'Programming' },
          user: {
            id: 'user-2',
            firstName: 'Jane',
            lastName: 'Doe',
            imageUrl: null,
            location: 'San Francisco, CA',
          },
        },
      ]);

      const caller = skillMatchingRouter.createCaller(ctx);
      const result = await caller.advancedMatching({
        algorithm: 'content_based',
      });

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('user-2');
    });

    it('should support hybrid algorithm combining both approaches', async () => {
      const ctx = createMockContext({ userId: 'user-1' });
      
      mockDb.user.findUnique.mockResolvedValue({
        id: 'user-1',
        userSkills: [
          {
            skillId: 'skill-1',
            proficiencyLevel: 4,
            skill: { id: 'skill-1', name: 'JavaScript', category: 'Programming' },
          },
        ],
      });

      // Mock both collaborative and content-based results
      mockDb.userSkill.findMany
        .mockResolvedValueOnce([ // Collaborative results
          {
            userId: 'user-2',
            skillId: 'skill-1',
            proficiencyLevel: 3,
            skill: { id: 'skill-1', name: 'JavaScript', category: 'Programming' },
            user: {
              id: 'user-2',
              firstName: 'Jane',
              lastName: 'Doe',
              imageUrl: null,
              location: 'San Francisco, CA',
            },
          },
        ])
        .mockResolvedValueOnce([ // Content-based results
          {
            userId: 'user-3',
            skillId: 'skill-2',
            proficiencyLevel: 4,
            skill: { id: 'skill-2', name: 'React', category: 'Programming' },
            user: {
              id: 'user-3',
              firstName: 'Bob',
              lastName: 'Smith',
              imageUrl: null,
              location: 'San Francisco, CA',
            },
          },
        ]);

      const caller = skillMatchingRouter.createCaller(ctx);
      const result = await caller.advancedMatching({
        algorithm: 'hybrid',
        limit: 10,
      });

      expect(result.length).toBeGreaterThan(0);
      // Should include results from both algorithms
    });
  });
});