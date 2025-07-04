import { describe, it, expect, beforeEach } from '@jest/globals';
import { createInnerTRPCContext } from '~/server/api/trpc';
import { appRouter } from '~/server/api/root';
import { db } from '~/server/db';
import { users, skills, userSkills } from '~/server/db/schema';
import { TRPCError } from '@trpc/server';

describe('Verification Router', () => {
  const mockUserId = 'test-user-123';
  const mockSkillId = 'test-skill-123';
  const mockUserSkillId = 'test-user-skill-123';

  const createMockContext = (userId?: string) => {
    return createInnerTRPCContext({
      headers: new Headers(),
      userId: userId || null,
    });
  };

  const createCaller = (userId?: string) => {
    const ctx = createMockContext(userId);
    return appRouter.createCaller(ctx);
  };

  beforeEach(async () => {
    // Clean up test data
    await db.delete(users).execute();
    await db.delete(skills).execute();

    // Insert test data
    await db.insert(users).values({
      id: mockUserId,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      clerkId: 'clerk_test_123',
    });

    await db.insert(skills).values({
      id: mockSkillId,
      name: 'React',
      category: 'Frontend',
      description: 'React development',
    });

    await db.insert(userSkills).values({
      id: mockUserSkillId,
      userId: mockUserId,
      skillId: mockSkillId,
      proficiencyLevel: 4,
    });
  });

  describe('createEndorsement', () => {
    it('should create an endorsement successfully', async () => {
      const caller = createCaller(mockUserId);

      const result = await caller.verification.createEndorsement({
        userSkillId: mockUserSkillId,
        message: 'Great developer!',
        strength: 'EXCELLENT',
      });

      expect(result.endorsement).toBeDefined();
      expect(result.endorsement.message).toBe('Great developer!');
      expect(result.endorsement.strength).toBe('EXCELLENT');
    });

    it('should throw error if not authenticated', async () => {
      const caller = createCaller();

      await expect(
        caller.verification.createEndorsement({
          userSkillId: mockUserSkillId,
          message: 'Great developer!',
          strength: 'EXCELLENT',
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('requestVerification', () => {
    it('should create a verification request', async () => {
      const caller = createCaller(mockUserId);

      const result = await caller.verification.requestVerification({
        userSkillId: mockUserSkillId,
        message: 'Please verify my React skills',
        evidence: { portfolio: 'https://example.com' },
      });

      expect(result.request).toBeDefined();
      expect(result.request.status).toBe('PENDING');
      expect(result.request.message).toBe('Please verify my React skills');
    });
  });

  describe('getEndorsementsByUserSkill', () => {
    it('should return endorsements for a user skill', async () => {
      const caller = createCaller(mockUserId);

      // First create an endorsement
      await caller.verification.createEndorsement({
        userSkillId: mockUserSkillId,
        message: 'Test endorsement',
        strength: 'GOOD',
      });

      // Then fetch endorsements
      const endorsements = await caller.verification.getEndorsementsByUserSkill(
        {
          userSkillId: mockUserSkillId,
        }
      );

      expect(endorsements).toHaveLength(1);
      expect(endorsements[0].message).toBe('Test endorsement');
    });
  });

  describe('getVerificationStats', () => {
    it('should return verification statistics', async () => {
      const caller = createCaller(mockUserId);

      const stats = await caller.verification.getVerificationStats();

      expect(stats).toHaveProperty('totalRequests');
      expect(stats).toHaveProperty('pendingRequests');
      expect(stats).toHaveProperty('completedRequests');
      expect(stats).toHaveProperty('rejectedRequests');
      expect(stats).toHaveProperty('averageReviewTime');
    });
  });
});
