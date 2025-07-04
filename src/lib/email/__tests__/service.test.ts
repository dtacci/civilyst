import { EmailService } from '~/lib/email/service';
import { resend } from '~/lib/email/resend';

// Mock Resend
jest.mock('~/lib/email/resend', () => ({
  resend: {
    emails: {
      send: jest.fn(),
      get: jest.fn(),
    },
    batch: {
      send: jest.fn(),
    },
  },
  DEFAULT_FROM_EMAIL: 'test@example.com',
  EMAIL_SUBJECTS: {
    WELCOME: 'Welcome',
    VERIFICATION: 'Verify',
    PASSWORD_RESET: 'Reset',
    CAMPAIGN_UPDATE: 'Update: ',
  },
}));

// Mock React Email render
jest.mock('@react-email/components', () => ({
  render: jest.fn().mockResolvedValue('<html>Email content</html>'),
  Body: 'Body',
  Button: 'Button',
  Container: 'Container',
  Head: 'Head',
  Heading: 'Heading',
  Hr: 'Hr',
  Html: 'Html',
  Img: 'Img',
  Link: 'Link',
  Preview: 'Preview',
  Section: 'Section',
  Text: 'Text',
}));

describe('EmailService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email with correct parameters', async () => {
      const mockResponse = { data: { id: 'email-123' } };
      (resend.emails.send as jest.Mock).mockResolvedValue(mockResponse);

      const result = await EmailService.sendWelcomeEmail({
        to: 'user@example.com',
        firstName: 'John',
        city: 'San Francisco',
        verificationUrl: 'https://example.com/verify',
        tags: [{ name: 'type', value: 'welcome' }],
      });

      expect(resend.emails.send).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: 'user@example.com',
        subject: 'Welcome',
        html: '<html>Email content</html>',
        replyTo: undefined,
        tags: [{ name: 'type', value: 'welcome' }],
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle multiple recipients', async () => {
      const mockResponse = { data: { id: 'email-124' } };
      (resend.emails.send as jest.Mock).mockResolvedValue(mockResponse);

      await EmailService.sendWelcomeEmail({
        to: ['user1@example.com', 'user2@example.com'],
        firstName: 'Team',
      });

      expect(resend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['user1@example.com', 'user2@example.com'],
        })
      );
    });
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email', async () => {
      const mockResponse = { data: { id: 'email-125' } };
      (resend.emails.send as jest.Mock).mockResolvedValue(mockResponse);

      const result = await EmailService.sendVerificationEmail({
        to: 'user@example.com',
        verificationUrl: 'https://example.com/verify?token=abc',
        firstName: 'Jane',
      });

      expect(resend.emails.send).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: 'user@example.com',
        subject: 'Verify',
        html: '<html>Email content</html>',
        replyTo: undefined,
        tags: undefined,
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email with security info', async () => {
      const mockResponse = { data: { id: 'email-126' } };
      (resend.emails.send as jest.Mock).mockResolvedValue(mockResponse);

      const result = await EmailService.sendPasswordResetEmail({
        to: 'user@example.com',
        resetUrl: 'https://example.com/reset?token=xyz',
        firstName: 'Bob',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });

      expect(resend.emails.send).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: 'user@example.com',
        subject: 'Reset',
        html: '<html>Email content</html>',
        replyTo: undefined,
        tags: undefined,
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('sendCampaignUpdateEmail', () => {
    it('should send campaign update email with stats', async () => {
      const mockResponse = { data: { id: 'email-127' } };
      (resend.emails.send as jest.Mock).mockResolvedValue(mockResponse);

      const result = await EmailService.sendCampaignUpdateEmail({
        to: 'user@example.com',
        firstName: 'Alice',
        campaignTitle: 'New Park Initiative',
        updateType: 'milestone',
        updateMessage: 'We reached 100 supporters!',
        campaignUrl: 'https://example.com/campaigns/123',
        voteCount: 100,
        supportPercentage: 75,
        unsubscribeUrl: 'https://example.com/unsubscribe',
      });

      expect(resend.emails.send).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: 'user@example.com',
        subject: 'Update: New Park Initiative',
        html: '<html>Email content</html>',
        replyTo: undefined,
        tags: undefined,
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('sendBatchEmails', () => {
    it('should send batch emails in chunks of 100', async () => {
      const mockResponse = { data: [{ id: 'batch-1' }] };
      (resend.batch.send as jest.Mock).mockResolvedValue(mockResponse);

      // Create 150 test emails
      const emails = Array.from({ length: 150 }, (_, i) => ({
        to: `user${i}@example.com`,
        subject: 'Test Email',
        html: '<html>Test</html>',
      }));

      const results = await EmailService.sendBatchEmails(emails);

      // Should be called twice (100 + 50)
      expect(resend.batch.send).toHaveBeenCalledTimes(2);

      // First call with 100 emails
      expect(resend.batch.send).toHaveBeenNthCalledWith(
        1,
        expect.arrayContaining([
          expect.objectContaining({
            from: 'test@example.com',
            to: 'user0@example.com',
          }),
        ])
      );

      // Second call with 50 emails
      expect(resend.batch.send).toHaveBeenNthCalledWith(
        2,
        expect.arrayContaining([
          expect.objectContaining({
            from: 'test@example.com',
            to: 'user100@example.com',
          }),
        ])
      );

      expect(results).toEqual([mockResponse, mockResponse]);
    });
  });

  describe('getEmailAnalytics', () => {
    it('should fetch email analytics', async () => {
      const mockEmail = {
        id: 'email-123',
        status: 'delivered',
        opens: 5,
        clicks: 2,
      };
      (resend.emails.get as jest.Mock).mockResolvedValue(mockEmail);

      const result = await EmailService.getEmailAnalytics('email-123');

      expect(resend.emails.get).toHaveBeenCalledWith('email-123');
      expect(result).toEqual(mockEmail);
    });

    it('should handle analytics fetch errors', async () => {
      (resend.emails.get as jest.Mock).mockRejectedValue(
        new Error('API Error')
      );

      const result = await EmailService.getEmailAnalytics('email-123');

      expect(result).toBeNull();
    });
  });
});
