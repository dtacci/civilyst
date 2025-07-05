import { TRPCError } from '@trpc/server';
import { NextRequest } from 'next/server';
import { db } from '~/server/db';
import crypto from 'crypto';

export interface RateLimitContext {
  userId?: string;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
  actionType: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining?: number;
  resetTime?: Date;
  violation?: {
    severity: 'warning' | 'temporary_block' | 'permanent_block';
    blockDuration?: number; // in seconds
    message: string;
  };
}

export interface RateLimitRule {
  id: string;
  actionType: string;
  timeWindow: number; // in seconds
  maxActions: number;
  blockDuration: number; // in seconds
  isActive: boolean;
  priority: number;
  description?: string;
}

class RateLimitService {
  private cache = new Map<
    string,
    { count: number; windowStart: Date; blocked?: Date }
  >();

  /**
   * Generate a unique identifier for rate limiting based on available context
   */
  private generateRateLimitKey(context: RateLimitContext): string {
    const { userId, deviceId, ipAddress, actionType } = context;

    // Prefer userId, then deviceId, then fallback to hashed IP
    let identifier: string;
    if (userId) {
      identifier = `user:${userId}`;
    } else if (deviceId) {
      identifier = `device:${deviceId}`;
    } else if (ipAddress) {
      // Hash IP address for privacy
      const hashedIP = crypto
        .createHash('sha256')
        .update(ipAddress)
        .digest('hex')
        .substring(0, 16);
      identifier = `ip:${hashedIP}`;
    } else {
      throw new Error('No valid identifier for rate limiting');
    }

    return `${identifier}:${actionType}`;
  }

  /**
   * Hash device fingerprint for storage
   */
  private hashDeviceId(fingerprint: string): string {
    return crypto.createHash('sha256').update(fingerprint).digest('hex');
  }

  /**
   * Get applicable rate limit rules for an action type
   */
  private async getRateLimitRules(
    actionType: string
  ): Promise<RateLimitRule[]> {
    const rules = await db.rateLimitRule.findMany({
      where: {
        OR: [
          { actionType },
          { actionType: '*' }, // Global rules
        ],
        isActive: true,
      },
      orderBy: {
        priority: 'desc', // Higher priority first
      },
    });

    return rules.map((rule) => ({
      id: rule.id,
      actionType: rule.actionType,
      timeWindow: rule.timeWindow,
      maxActions: rule.maxActions,
      blockDuration: rule.blockDuration,
      isActive: rule.isActive,
      priority: rule.priority,
      description: rule.description,
    }));
  }

  /**
   * Check if an action is allowed based on rate limiting rules
   */
  async checkRateLimit(context: RateLimitContext): Promise<RateLimitResult> {
    const { actionType } = context;

    try {
      // Get applicable rules
      const rules = await this.getRateLimitRules(actionType);
      if (rules.length === 0) {
        return { allowed: true }; // No rules, allow action
      }

      const key = this.generateRateLimitKey(context);
      const now = new Date();

      // Check each rule (highest priority first)
      for (const rule of rules) {
        const ruleKey = `${key}:${rule.id}`;
        const cached = this.cache.get(ruleKey);

        // Check if currently blocked
        if (cached?.blocked && cached.blocked > now) {
          const remainingBlockTime = Math.ceil(
            (cached.blocked.getTime() - now.getTime()) / 1000
          );
          return {
            allowed: false,
            violation: {
              severity:
                remainingBlockTime > 3600
                  ? 'permanent_block'
                  : 'temporary_block',
              blockDuration: remainingBlockTime,
              message: `Action blocked. Try again in ${remainingBlockTime} seconds.`,
            },
          };
        }

        // Check time window
        const windowStart = new Date(now.getTime() - rule.timeWindow * 1000);

        // Reset cache if window has expired
        if (!cached || cached.windowStart < windowStart) {
          this.cache.set(ruleKey, {
            count: 0,
            windowStart: now,
          });
        }

        const current = this.cache.get(ruleKey)!;

        // Check if limit exceeded
        if (current.count >= rule.maxActions) {
          // Determine violation severity based on how much the limit was exceeded
          const excessActions = current.count - rule.maxActions;
          let severity: 'warning' | 'temporary_block' | 'permanent_block' =
            'warning';
          let blockDuration = rule.blockDuration;

          if (excessActions >= rule.maxActions) {
            // Severe violation (more than 100% over limit)
            severity = 'permanent_block';
            blockDuration = rule.blockDuration * 10; // 10x longer block
          } else if (excessActions >= rule.maxActions * 0.5) {
            // Moderate violation (50%+ over limit)
            severity = 'temporary_block';
            blockDuration = rule.blockDuration * 2; // 2x longer block
          } else {
            // Minor violation
            severity = 'warning';
            // No block for warnings, just deny the action
          }

          // Apply block if not just a warning
          if (severity !== 'warning') {
            const blockUntil = new Date(now.getTime() + blockDuration * 1000);
            this.cache.set(ruleKey, {
              ...current,
              blocked: blockUntil,
            });

            // Log security event
            await this.logSecurityEvent(context, {
              riskScore: severity === 'permanent_block' ? 1.0 : 0.7,
              isBlocked: true,
              metadata: {
                rule: rule.id,
                excessActions,
                blockDuration,
                severity,
              },
            });
          }

          return {
            allowed: false,
            violation: {
              severity,
              blockDuration: severity !== 'warning' ? blockDuration : undefined,
              message: this.getViolationMessage(severity, blockDuration),
            },
          };
        }

        // Calculate remaining actions in this window
        const remaining = rule.maxActions - current.count;
        const resetTime = new Date(
          current.windowStart.getTime() + rule.timeWindow * 1000
        );

        return {
          allowed: true,
          remaining,
          resetTime,
        };
      }

      return { allowed: true }; // No violations found
    } catch (error) {
      console.error('Rate limit check failed:', error);
      // In case of error, allow the action to prevent blocking legitimate users
      return { allowed: true };
    }
  }

  /**
   * Record an action for rate limiting
   */
  async recordAction(context: RateLimitContext): Promise<void> {
    try {
      const rules = await this.getRateLimitRules(context.actionType);
      const key = this.generateRateLimitKey(context);

      for (const rule of rules) {
        const ruleKey = `${key}:${rule.id}`;
        const cached = this.cache.get(ruleKey);

        if (cached && !cached.blocked) {
          this.cache.set(ruleKey, {
            ...cached,
            count: cached.count + 1,
          });
        }
      }

      // Log the action
      await this.logSecurityEvent(context, {
        riskScore: 0.1, // Normal action
        isBlocked: false,
        metadata: {
          actionRecorded: true,
        },
      });
    } catch (error) {
      console.error('Failed to record action:', error);
      // Don't throw - recording failure shouldn't block the action
    }
  }

  /**
   * Log security event to database
   */
  private async logSecurityEvent(
    context: RateLimitContext,
    options: {
      riskScore: number;
      isBlocked: boolean;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void> {
    try {
      const { userId, deviceId, ipAddress, userAgent, actionType } = context;

      await db.securityLog.create({
        data: {
          deviceId: deviceId ? this.hashDeviceId(deviceId) : null,
          userId: userId || null,
          actionType,
          ipAddress: ipAddress ? this.hashDeviceId(ipAddress) : null,
          userAgent: userAgent || null,
          riskScore: options.riskScore,
          isBlocked: options.isBlocked,
          metadata: options.metadata || {},
        },
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
      // Don't throw - logging failure shouldn't affect rate limiting
    }
  }

  /**
   * Get violation message based on severity
   */
  private getViolationMessage(
    severity: string,
    blockDuration?: number
  ): string {
    switch (severity) {
      case 'warning':
        return 'Rate limit exceeded. Please slow down your requests.';
      case 'temporary_block':
        return `Too many requests. You are temporarily blocked for ${blockDuration} seconds.`;
      case 'permanent_block':
        return `Severe rate limit violation. You are blocked for ${blockDuration} seconds.`;
      default:
        return 'Rate limit exceeded.';
    }
  }

  /**
   * Clear rate limit cache (for testing/admin purposes)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const rateLimitService = new RateLimitService();

/**
 * Extract rate limiting context from Next.js request
 */
export function extractRateLimitContext(
  req: NextRequest,
  actionType: string,
  userId?: string,
  deviceId?: string
): RateLimitContext {
  const ipAddress =
    req.ip ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';

  const userAgent = req.headers.get('user-agent') || 'unknown';

  return {
    userId,
    deviceId,
    ipAddress,
    userAgent,
    actionType,
  };
}

/**
 * TRPC middleware for rate limiting
 */
export function createRateLimitMiddleware(actionType: string) {
  return async (opts: {
    next: () => Promise<unknown>;
    ctx: { req?: NextRequest; session?: { user: { userId: string } } };
  }) => {
    const { ctx, next } = opts;

    if (!ctx.req) {
      // No request context available, skip rate limiting
      return next();
    }

    const context = extractRateLimitContext(
      ctx.req,
      actionType,
      ctx.session?.user?.userId
    );

    const result = await rateLimitService.checkRateLimit(context);

    if (!result.allowed) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: result.violation?.message || 'Rate limit exceeded',
        cause: result.violation,
      });
    }

    // Record the action
    await rateLimitService.recordAction(context);

    return next();
  };
}
