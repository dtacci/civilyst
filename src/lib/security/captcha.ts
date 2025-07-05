import { env, isServiceConfigured } from '~/env';

interface CaptchaVerificationResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  credit?: boolean;
  'error-codes'?: string[];
  score?: number;
  score_reason?: string[];
}

interface CaptchaVerificationResult {
  isValid: boolean;
  error?: string;
  score?: number;
  errorCodes?: string[];
}

/**
 * Verify hCaptcha token on the server side
 */
export async function verifyCaptchaToken(
  token: string,
  remoteip?: string
): Promise<CaptchaVerificationResult> {
  // Skip verification in development if CAPTCHA is not configured
  if (!isServiceConfigured.hcaptcha()) {
    if (process.env.NODE_ENV === 'development') {
      return { isValid: true };
    }
    return {
      isValid: false,
      error: 'CAPTCHA service not configured',
    };
  }

  if (!token) {
    return {
      isValid: false,
      error: 'CAPTCHA token is required',
    };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', env.HCAPTCHA_SECRET_KEY!);
    formData.append('response', token);
    if (remoteip) {
      formData.append('remoteip', remoteip);
    }

    const response = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      return {
        isValid: false,
        error: `CAPTCHA verification request failed: ${response.statusText}`,
      };
    }

    const data: CaptchaVerificationResponse = await response.json();

    if (!data.success) {
      const errorCodes = data['error-codes'] || [];
      const errorMessages = {
        'missing-input-secret': 'Missing secret key',
        'invalid-input-secret': 'Invalid secret key',
        'missing-input-response': 'Missing CAPTCHA response',
        'invalid-input-response': 'Invalid CAPTCHA response',
        'bad-request': 'Bad request format',
        'timeout-or-duplicate': 'CAPTCHA expired or already used',
        'invalid-or-already-seen-response': 'CAPTCHA already used',
      };

      const errorMessage =
        errorCodes
          .map(
            (code) => errorMessages[code as keyof typeof errorMessages] || code
          )
          .join(', ') || 'CAPTCHA verification failed';

      return {
        isValid: false,
        error: errorMessage,
        errorCodes,
      };
    }

    return {
      isValid: true,
      score: data.score,
    };
  } catch (error) {
    console.error('CAPTCHA verification error:', error);
    return {
      isValid: false,
      error: 'CAPTCHA verification service unavailable',
    };
  }
}

/**
 * Middleware to check if CAPTCHA is required for anonymous actions
 */
export function isCaptchaRequired(
  userAgent?: string,
  isAnonymous = true
): boolean {
  // Always require CAPTCHA for anonymous users in production
  if (isAnonymous && process.env.NODE_ENV === 'production') {
    return true;
  }

  // Skip CAPTCHA in development if not configured
  if (
    process.env.NODE_ENV === 'development' &&
    !isServiceConfigured.hcaptcha()
  ) {
    return false;
  }

  // Basic bot detection - require CAPTCHA for suspicious user agents
  if (userAgent) {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /requests/i,
    ];

    if (suspiciousPatterns.some((pattern) => pattern.test(userAgent))) {
      return true;
    }
  }

  return isAnonymous;
}

/**
 * Extract client IP from request headers
 */
export function getClientIP(headers: Headers): string | undefined {
  // Check various headers for the real client IP
  const ipHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'cf-connecting-ip', // Cloudflare
    'x-client-ip',
    'x-forwarded',
    'forwarded-for',
    'forwarded',
  ];

  for (const header of ipHeaders) {
    const value = headers.get(header);
    if (value) {
      // x-forwarded-for can contain multiple IPs, take the first one
      const ip = value.split(',')[0]?.trim();
      if (ip && ip !== 'unknown') {
        return ip;
      }
    }
  }

  return undefined;
}

/**
 * Rate limiting for CAPTCHA verification attempts
 */
export const captchaAttempts = new Map<
  string,
  { count: number; lastAttempt: number }
>();

export function checkCaptchaRateLimit(
  identifier: string,
  maxAttempts = 5,
  windowMs = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; remainingAttempts: number; resetTime: number } {
  const now = Date.now();
  const attempts = captchaAttempts.get(identifier);

  if (!attempts) {
    captchaAttempts.set(identifier, { count: 1, lastAttempt: now });
    return {
      allowed: true,
      remainingAttempts: maxAttempts - 1,
      resetTime: now + windowMs,
    };
  }

  // Reset if window has passed
  if (now - attempts.lastAttempt > windowMs) {
    captchaAttempts.set(identifier, { count: 1, lastAttempt: now });
    return {
      allowed: true,
      remainingAttempts: maxAttempts - 1,
      resetTime: now + windowMs,
    };
  }

  // Check if limit exceeded
  if (attempts.count >= maxAttempts) {
    return {
      allowed: false,
      remainingAttempts: 0,
      resetTime: attempts.lastAttempt + windowMs,
    };
  }

  // Increment attempt count
  attempts.count++;
  attempts.lastAttempt = now;

  return {
    allowed: true,
    remainingAttempts: maxAttempts - attempts.count,
    resetTime: attempts.lastAttempt + windowMs,
  };
}

/**
 * Clean up old CAPTCHA rate limit entries
 */
export function cleanupCaptchaRateLimit() {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes

  for (const [key, attempts] of captchaAttempts.entries()) {
    if (now - attempts.lastAttempt > windowMs) {
      captchaAttempts.delete(key);
    }
  }
}

// Clean up old entries every hour
if (typeof window === 'undefined') {
  setInterval(cleanupCaptchaRateLimit, 60 * 60 * 1000);
}
