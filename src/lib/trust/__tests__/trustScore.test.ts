/**
 * Tests for trust scoring functionality
 */

import {
  calculateTrustScore,
  getTrustLevel,
  getTrustLevelDescription,
  getTrustLevelBenefits,
  getTrustProgress,
  getNextTrustLevel,
  getAnonymousTrustSuggestions,
  calculateTrustDecay,
} from '../trustScore';
import { TrustSignalType, TrustLevel } from '~/generated/prisma';

describe('Trust Score System', () => {
  describe('calculateTrustScore', () => {
    it('should calculate trust score with weighted signals', () => {
      const signals = [
        {
          signalType: TrustSignalType.LOCATION_VERIFIED,
          signalValue: 1.0,
        },
        {
          signalType: TrustSignalType.EMAIL_VERIFIED,
          signalValue: 1.0,
        },
        {
          signalType: TrustSignalType.CONTENT_QUALITY,
          signalValue: 1.0,
        },
      ];

      const score = calculateTrustScore(signals);

      // Expected: 0.15 (location) + 0.15 (email) + 0.10 (content) = 0.40
      expect(score).toBeCloseTo(0.40, 2);
    });

    it('should handle expired signals by excluding them', () => {
      const pastDate = new Date('2020-01-01');
      const futureDate = new Date('2030-01-01');

      const signals = [
        {
          signalType: TrustSignalType.LOCATION_VERIFIED,
          signalValue: 1.0,
          expiresAt: pastDate, // Expired
        },
        {
          signalType: TrustSignalType.EMAIL_VERIFIED,
          signalValue: 1.0,
          expiresAt: futureDate, // Valid
        },
      ];

      const score = calculateTrustScore(signals);

      // Should only include email verification (0.15)
      expect(score).toBeCloseTo(0.15, 2);
    });

    it('should use highest value for duplicate signal types', () => {
      const signals = [
        {
          signalType: TrustSignalType.CONTENT_QUALITY,
          signalValue: 0.5,
        },
        {
          signalType: TrustSignalType.CONTENT_QUALITY,
          signalValue: 0.8, // Higher value
        },
        {
          signalType: TrustSignalType.CONTENT_QUALITY,
          signalValue: 0.3,
        },
      ];

      const score = calculateTrustScore(signals);

      // Should use the highest value (0.8) * weight (0.10) = 0.08
      expect(score).toBeCloseTo(0.08, 2);
    });

    it('should handle negative signals (moderation flags)', () => {
      const signals = [
        {
          signalType: TrustSignalType.LOCATION_VERIFIED,
          signalValue: 1.0, // +0.15
        },
        {
          signalType: TrustSignalType.MODERATION_FLAG,
          signalValue: 1.0, // -0.20
        },
      ];

      const score = calculateTrustScore(signals);

      // 0.15 - 0.20 = -0.05, but should be clamped to 0
      expect(score).toBe(0);
    });

    it('should clamp score between 0 and 1', () => {
      // Test maximum possible score
      const maxSignals = Object.values(TrustSignalType)
        .filter((type) => type !== TrustSignalType.MODERATION_FLAG)
        .map((signalType) => ({
          signalType,
          signalValue: 1.0,
        }));

      const maxScore = calculateTrustScore(maxSignals);
      expect(maxScore).toBeLessThanOrEqual(1.0);

      // Test with very negative signals
      const negativeSignals = [
        {
          signalType: TrustSignalType.MODERATION_FLAG,
          signalValue: 10.0, // Extreme negative
        },
      ];

      const negativeScore = calculateTrustScore(negativeSignals);
      expect(negativeScore).toBe(0);
    });

    it('should return 0 for empty signals array', () => {
      const score = calculateTrustScore([]);
      expect(score).toBe(0);
    });
  });

  describe('getTrustLevel', () => {
    it('should return correct trust levels for different scores', () => {
      expect(getTrustLevel(0)).toBe('BASIC');
      expect(getTrustLevel(0.1)).toBe('BASIC');
      expect(getTrustLevel(0.24)).toBe('BASIC');
      
      expect(getTrustLevel(0.25)).toBe('VERIFIED');
      expect(getTrustLevel(0.4)).toBe('VERIFIED');
      expect(getTrustLevel(0.49)).toBe('VERIFIED');
      
      expect(getTrustLevel(0.5)).toBe('TRUSTED');
      expect(getTrustLevel(0.6)).toBe('TRUSTED');
      expect(getTrustLevel(0.74)).toBe('TRUSTED');
      
      expect(getTrustLevel(0.75)).toBe('LEADER');
      expect(getTrustLevel(0.9)).toBe('LEADER');
      expect(getTrustLevel(1.0)).toBe('LEADER');
    });
  });

  describe('getTrustLevelDescription', () => {
    it('should return appropriate descriptions for each level', () => {
      expect(getTrustLevelDescription('BASIC')).toContain('New member');
      expect(getTrustLevelDescription('VERIFIED')).toContain('Verified member');
      expect(getTrustLevelDescription('TRUSTED')).toContain('Trusted member');
      expect(getTrustLevelDescription('LEADER')).toContain('Community leader');
    });
  });

  describe('getTrustLevelBenefits', () => {
    it('should return progressive benefits for each level', () => {
      const basicBenefits = getTrustLevelBenefits('BASIC');
      const verifiedBenefits = getTrustLevelBenefits('VERIFIED');
      const trustedBenefits = getTrustLevelBenefits('TRUSTED');
      const leaderBenefits = getTrustLevelBenefits('LEADER');

      // Basic benefits should be included in all levels
      expect(basicBenefits).toContain('View community wonders');
      expect(verifiedBenefits).toContain('View community wonders');
      expect(trustedBenefits).toContain('View community wonders');
      expect(leaderBenefits).toContain('View community wonders');

      // Verified and above should have creation benefits
      expect(basicBenefits).not.toContain('Create campaigns');
      expect(verifiedBenefits).toContain('Create campaigns');
      expect(trustedBenefits).toContain('Create campaigns');
      expect(leaderBenefits).toContain('Create campaigns');

      // Trusted and above should have moderation benefits
      expect(basicBenefits).not.toContain('Moderate content');
      expect(verifiedBenefits).not.toContain('Moderate content');
      expect(trustedBenefits).toContain('Moderate content');
      expect(leaderBenefits).toContain('Moderate content');

      // Only leaders should have investment features
      expect(basicBenefits).not.toContain('Investment features');
      expect(verifiedBenefits).not.toContain('Investment features');
      expect(trustedBenefits).not.toContain('Investment features');
      expect(leaderBenefits).toContain('Investment features');
    });
  });

  describe('getTrustProgress', () => {
    it('should calculate correct progress percentages for BASIC level', () => {
      // 0% to VERIFIED (25%)
      expect(getTrustProgress(0, 'BASIC')).toBe(0);
      expect(getTrustProgress(0.125, 'BASIC')).toBe(50); // Halfway to VERIFIED
      expect(getTrustProgress(0.25, 'BASIC')).toBe(100); // At VERIFIED threshold
    });

    it('should calculate correct progress percentages for VERIFIED level', () => {
      // 25% to 50% (TRUSTED)
      expect(getTrustProgress(0.25, 'VERIFIED')).toBe(0);
      expect(getTrustProgress(0.375, 'VERIFIED')).toBe(50); // Halfway to TRUSTED
      expect(getTrustProgress(0.5, 'VERIFIED')).toBe(100); // At TRUSTED threshold
    });

    it('should calculate correct progress percentages for TRUSTED level', () => {
      // 50% to 75% (LEADER)
      expect(getTrustProgress(0.5, 'TRUSTED')).toBe(0);
      expect(getTrustProgress(0.625, 'TRUSTED')).toBe(50); // Halfway to LEADER
      expect(getTrustProgress(0.75, 'TRUSTED')).toBe(100); // At LEADER threshold
    });

    it('should return 100% for LEADER level', () => {
      expect(getTrustProgress(0.75, 'LEADER')).toBe(100);
      expect(getTrustProgress(1.0, 'LEADER')).toBe(100);
    });
  });

  describe('getNextTrustLevel', () => {
    it('should return next level and requirements for BASIC', () => {
      const result = getNextTrustLevel('BASIC');
      
      expect(result.nextLevel).toBe('VERIFIED');
      expect(result.requirements).toContain('Verify your email address');
      expect(result.requirements.length).toBeGreaterThan(0);
    });

    it('should return next level and requirements for VERIFIED', () => {
      const result = getNextTrustLevel('VERIFIED');
      
      expect(result.nextLevel).toBe('TRUSTED');
      expect(result.requirements).toContain('Verify your phone number');
      expect(result.requirements.length).toBeGreaterThan(0);
    });

    it('should return next level and requirements for TRUSTED', () => {
      const result = getNextTrustLevel('TRUSTED');
      
      expect(result.nextLevel).toBe('LEADER');
      expect(result.requirements).toContain('Verify your address');
      expect(result.requirements.length).toBeGreaterThan(0);
    });

    it('should return null for LEADER (max level)', () => {
      const result = getNextTrustLevel('LEADER');
      
      expect(result.nextLevel).toBeNull();
      expect(result.requirements).toEqual([]);
    });
  });

  describe('getAnonymousTrustSuggestions', () => {
    it('should return helpful suggestions for anonymous users', () => {
      const suggestions = getAnonymousTrustSuggestions();
      
      expect(suggestions).toContain('Share your location to build local credibility');
      expect(suggestions).toContain('Return tomorrow to show consistent engagement');
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('calculateTrustDecay', () => {
    it('should not decay trust within first 30 days', () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 15); // 15 days ago
      
      const originalScore = 0.8;
      const decayedScore = calculateTrustDecay(recentDate, originalScore);
      
      expect(decayedScore).toBe(originalScore);
    });

    it('should apply gradual decay after 30 days', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 45); // 45 days ago
      
      const originalScore = 0.8;
      const decayedScore = calculateTrustDecay(oldDate, originalScore);
      
      // Should have some decay after 45 days
      expect(decayedScore).toBeLessThan(originalScore);
      expect(decayedScore).toBeGreaterThan(0.7); // But not too much
    });

    it('should not decay below 0', () => {
      const veryOldDate = new Date();
      veryOldDate.setFullYear(veryOldDate.getFullYear() - 1); // 1 year ago
      
      const originalScore = 0.1;
      const decayedScore = calculateTrustDecay(veryOldDate, originalScore);
      
      expect(decayedScore).toBeGreaterThanOrEqual(0);
    });

    it('should apply correct decay rate', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 60); // 60 days ago
      
      const originalScore = 1.0;
      const decayedScore = calculateTrustDecay(oldDate, originalScore);
      
      // 30 days of decay at 0.1% per day = 3% decay
      const expectedDecay = 0.001 * 30; // 0.03
      const expectedScore = originalScore - expectedDecay;
      
      expect(decayedScore).toBeCloseTo(expectedScore, 3);
    });
  });

  describe('Edge cases and validation', () => {
    it('should handle signals with null expiresAt', () => {
      const signals = [
        {
          signalType: TrustSignalType.LOCATION_VERIFIED,
          signalValue: 1.0,
          expiresAt: null,
        },
      ];

      const score = calculateTrustScore(signals);
      expect(score).toBeCloseTo(0.15, 2);
    });

    it('should handle signals with undefined expiresAt', () => {
      const signals = [
        {
          signalType: TrustSignalType.LOCATION_VERIFIED,
          signalValue: 1.0,
          // expiresAt is undefined
        },
      ];

      const score = calculateTrustScore(signals);
      expect(score).toBeCloseTo(0.15, 2);
    });

    it('should handle extreme signal values', () => {
      const signals = [
        {
          signalType: TrustSignalType.LOCATION_VERIFIED,
          signalValue: 999.0, // Extreme high value
        },
        {
          signalType: TrustSignalType.CONTENT_QUALITY,
          signalValue: -999.0, // Extreme negative value
        },
      ];

      const score = calculateTrustScore(signals);
      
      // Should still clamp to valid range
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });
});