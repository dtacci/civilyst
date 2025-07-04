/**
 * Trust score calculation and management utilities
 */

import { TrustSignalType, TrustLevel } from '~/generated/prisma';

/**
 * Trust signal weights for score calculation
 */
const TRUST_SIGNAL_WEIGHTS: Record<TrustSignalType, number> = {
  LOCATION_VERIFIED: 0.15,
  RETURN_VISIT: 0.05,
  CONTENT_QUALITY: 0.10,
  COMMUNITY_VALIDATION: 0.10,
  PROFILE_COMPLETION: 0.10,
  EMAIL_VERIFIED: 0.15,
  PHONE_VERIFIED: 0.15,
  ADDRESS_VERIFIED: 0.05,
  SOCIAL_CONNECTED: 0.05,
  WONDER_CONVERTED: 0.05,
  CAMPAIGN_SUCCESS: 0.03,
  MODERATION_FLAG: -0.20, // Negative weight for bad behavior
};

/**
 * Trust level thresholds
 */
const TRUST_LEVEL_THRESHOLDS = {
  BASIC: 0,
  VERIFIED: 0.25,
  TRUSTED: 0.50,
  LEADER: 0.75,
};

/**
 * Calculate trust score from signals
 */
export function calculateTrustScore(signals: Array<{
  signalType: TrustSignalType;
  signalValue: number;
  expiresAt?: Date | null;
}>): number {
  const now = new Date();
  let totalScore = 0;

  // Group signals by type and take the highest value for each type
  const signalsByType = signals.reduce((acc, signal) => {
    // Skip expired signals
    if (signal.expiresAt && signal.expiresAt < now) {
      return acc;
    }

    const type = signal.signalType;
    if (!acc[type] || acc[type] < signal.signalValue) {
      acc[type] = signal.signalValue;
    }
    return acc;
  }, {} as Record<TrustSignalType, number>);

  // Calculate weighted score
  for (const [type, value] of Object.entries(signalsByType)) {
    const weight = TRUST_SIGNAL_WEIGHTS[type as TrustSignalType];
    totalScore += weight * value;
  }

  // Ensure score is between 0 and 1
  return Math.max(0, Math.min(1, totalScore));
}

/**
 * Determine trust level from score
 */
export function getTrustLevel(score: number): TrustLevel {
  if (score >= TRUST_LEVEL_THRESHOLDS.LEADER) return 'LEADER';
  if (score >= TRUST_LEVEL_THRESHOLDS.TRUSTED) return 'TRUSTED';
  if (score >= TRUST_LEVEL_THRESHOLDS.VERIFIED) return 'VERIFIED';
  return 'BASIC';
}

/**
 * Get human-readable trust level description
 */
export function getTrustLevelDescription(level: TrustLevel): string {
  switch (level) {
    case 'BASIC':
      return 'New member - Can view and vote on wonders';
    case 'VERIFIED':
      return 'Verified member - Can create campaigns and access analytics';
    case 'TRUSTED':
      return 'Trusted member - Can moderate content and get priority support';
    case 'LEADER':
      return 'Community leader - Can access investment features and B2B tools';
  }
}

/**
 * Get trust level benefits
 */
export function getTrustLevelBenefits(level: TrustLevel): string[] {
  const benefits: string[] = [];

  // Basic benefits (everyone gets these)
  benefits.push('View community wonders');
  benefits.push('Vote on proposals');
  benefits.push('Join discussions');

  if (level === 'VERIFIED' || level === 'TRUSTED' || level === 'LEADER') {
    benefits.push('Create campaigns');
    benefits.push('Access analytics dashboard');
    benefits.push('Priority notifications');
  }

  if (level === 'TRUSTED' || level === 'LEADER') {
    benefits.push('Moderate content');
    benefits.push('Priority support');
    benefits.push('Advanced analytics');
  }

  if (level === 'LEADER') {
    benefits.push('Investment features');
    benefits.push('B2B portal access');
    benefits.push('Direct property owner connections');
    benefits.push('Municipal partnership tools');
  }

  return benefits;
}

/**
 * Calculate trust score progress percentage
 */
export function getTrustProgress(score: number, currentLevel: TrustLevel): number {
  const thresholds = TRUST_LEVEL_THRESHOLDS;
  
  switch (currentLevel) {
    case 'BASIC':
      return (score / thresholds.VERIFIED) * 100;
    case 'VERIFIED':
      return ((score - thresholds.VERIFIED) / (thresholds.TRUSTED - thresholds.VERIFIED)) * 100;
    case 'TRUSTED':
      return ((score - thresholds.TRUSTED) / (thresholds.LEADER - thresholds.TRUSTED)) * 100;
    case 'LEADER':
      return 100; // Already at max level
  }
}

/**
 * Get next trust level and requirements
 */
export function getNextTrustLevel(currentLevel: TrustLevel): {
  nextLevel: TrustLevel | null;
  requirements: string[];
} {
  switch (currentLevel) {
    case 'BASIC':
      return {
        nextLevel: 'VERIFIED',
        requirements: [
          'Verify your email address',
          'Complete your profile',
          'Make your first wonder or response',
          'Get 5 community upvotes',
        ],
      };
    case 'VERIFIED':
      return {
        nextLevel: 'TRUSTED',
        requirements: [
          'Verify your phone number',
          'Create a successful campaign',
          'Maintain consistent participation for 30 days',
          'Get 20 community upvotes',
        ],
      };
    case 'TRUSTED':
      return {
        nextLevel: 'LEADER',
        requirements: [
          'Verify your address',
          'Successfully convert a wonder to campaign',
          'Maintain high-quality content score',
          'Help moderate 10 posts',
        ],
      };
    case 'LEADER':
      return {
        nextLevel: null,
        requirements: [],
      };
  }
}

/**
 * Trust signal suggestions for anonymous users
 */
export function getAnonymousTrustSuggestions(): string[] {
  return [
    'Share your location to build local credibility',
    'Return tomorrow to show consistent engagement',
    'Create quality wonders to earn community validation',
    'Consider creating a profile to unlock more features',
  ];
}

/**
 * Trust decay calculation (for inactive users)
 */
export function calculateTrustDecay(
  lastActivityDate: Date,
  currentScore: number
): number {
  const daysSinceActivity = Math.floor(
    (Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // No decay for first 30 days
  if (daysSinceActivity < 30) return currentScore;

  // Gradual decay after 30 days of inactivity
  const decayRate = 0.001; // 0.1% per day
  const decayAmount = decayRate * (daysSinceActivity - 30);
  
  return Math.max(0, currentScore - decayAmount);
}