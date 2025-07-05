import {
  verifyCaptchaToken,
  isCaptchaRequired,
  getClientIP,
  checkCaptchaRateLimit,
  captchaAttempts,
} from '../captcha';

// Mock environment
jest.mock('~/env', () => ({
  env: {
    HCAPTCHA_SECRET_KEY: 'mock-secret-key',
    NODE_ENV: 'test',
  },
  isServiceConfigured: {
    hcaptcha: () => true,
  },
}));

// Mock fetch
global.fetch = jest.fn();

describe('CAPTCHA Security Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  describe('verifyCaptchaToken', () => {
    it('returns valid result for successful verification', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          challenge_ts: '2024-01-01T12:00:00Z',
          hostname: 'localhost',
          score: 0.9,
        }),
      });

      const result = await verifyCaptchaToken('valid-token');

      expect(result.isValid).toBe(true);
      expect(result.score).toBe(0.9);
      expect(fetch).toHaveBeenCalledWith(
        'https://hcaptcha.com/siteverify',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
      );
    });

    it('returns invalid result for failed verification', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          'error-codes': ['invalid-input-response'],
        }),
      });

      const result = await verifyCaptchaToken('invalid-token');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid CAPTCHA response');
      expect(result.errorCodes).toEqual(['invalid-input-response']);
    });

    it('handles network errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await verifyCaptchaToken('token');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('CAPTCHA verification service unavailable');
    });

    it('returns error for missing token', async () => {
      const result = await verifyCaptchaToken('');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('CAPTCHA token is required');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('includes remote IP in verification request', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await verifyCaptchaToken('token', '192.168.1.1');

      const callArgs = (fetch as jest.Mock).mock.calls[0];
      const formData = callArgs[1].body;
      expect(formData.toString()).toContain('remoteip=192.168.1.1');
    });
  });

  describe('isCaptchaRequired', () => {
    it('requires CAPTCHA for anonymous users in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const result = isCaptchaRequired(undefined, true);

      expect(result).toBe(true);

      process.env.NODE_ENV = originalEnv;
    });

    it('does not require CAPTCHA for authenticated users', () => {
      const result = isCaptchaRequired(undefined, false);

      expect(result).toBe(false);
    });

    it('requires CAPTCHA for suspicious user agents', () => {
      const suspiciousAgents = [
        'Mozilla/5.0 (compatible; Googlebot/2.1)',
        'curl/7.68.0',
        'python-requests/2.25.1',
        'Scrapy/2.5.0',
      ];

      suspiciousAgents.forEach((agent) => {
        // Test each agent individually with production environment
        const result = isCaptchaRequired(agent, true); // Use isAnonymous=true
        expect(result).toBe(true);
      });
    });

    it('allows normal user agents', () => {
      const normalAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
      ];

      normalAgents.forEach((agent) => {
        const result = isCaptchaRequired(agent, false);
        expect(result).toBe(false);
      });
    });
  });

  describe('getClientIP', () => {
    it('extracts IP from x-forwarded-for header', () => {
      const headers = new Headers({
        'x-forwarded-for': '203.0.113.1, 192.168.1.1',
      });

      const ip = getClientIP(headers);

      expect(ip).toBe('203.0.113.1');
    });

    it('extracts IP from x-real-ip header', () => {
      const headers = new Headers({
        'x-real-ip': '203.0.113.2',
      });

      const ip = getClientIP(headers);

      expect(ip).toBe('203.0.113.2');
    });

    it('extracts IP from cf-connecting-ip header (Cloudflare)', () => {
      const headers = new Headers({
        'cf-connecting-ip': '203.0.113.3',
      });

      const ip = getClientIP(headers);

      expect(ip).toBe('203.0.113.3');
    });

    it('returns undefined when no IP headers are present', () => {
      const headers = new Headers();

      const ip = getClientIP(headers);

      expect(ip).toBeUndefined();
    });

    it('skips unknown values in headers', () => {
      const headers = new Headers({
        'x-forwarded-for': 'unknown, 203.0.113.4',
      });

      const ip = getClientIP(headers);

      expect(ip).toBe('203.0.113.4');
    });
  });

  describe('checkCaptchaRateLimit', () => {
    beforeEach(() => {
      // Clear any existing rate limit data
      captchaAttempts.clear();
    });

    it('allows first attempt', () => {
      const result = checkCaptchaRateLimit('test-ip');

      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(4);
    });

    it('tracks multiple attempts', () => {
      // First attempt
      const first = checkCaptchaRateLimit('test-ip');
      expect(first.remainingAttempts).toBe(4);

      // Second attempt
      const result = checkCaptchaRateLimit('test-ip');

      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(3);
    });

    it('blocks after max attempts', () => {
      const identifier = 'blocked-ip';

      // Use up all attempts
      for (let i = 0; i < 5; i++) {
        checkCaptchaRateLimit(identifier);
      }

      // Should be blocked now
      const result = checkCaptchaRateLimit(identifier);

      expect(result.allowed).toBe(false);
      expect(result.remainingAttempts).toBe(0);
    });

    it('resets after time window passes', () => {
      const identifier = 'reset-test';

      // Mock date to control time
      const mockDate = new Date('2024-01-01T12:00:00Z');
      jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime());

      // Use up attempts
      for (let i = 0; i < 5; i++) {
        checkCaptchaRateLimit(identifier);
      }

      // Should be blocked
      expect(checkCaptchaRateLimit(identifier).allowed).toBe(false);

      // Advance time past window
      const futureDate = new Date(mockDate.getTime() + 16 * 60 * 1000); // 16 minutes
      jest.spyOn(Date, 'now').mockReturnValue(futureDate.getTime());

      // Should be allowed again
      const result = checkCaptchaRateLimit(identifier);
      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(4);

      jest.restoreAllMocks();
    });
  });
});
