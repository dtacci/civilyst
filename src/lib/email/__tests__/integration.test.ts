import { EmailService } from '../service';
import { render } from '@react-email/components';
import { WelcomeEmail, CampaignUpdateEmail } from '../templates';

// Mock Resend to test integration without actual API calls
jest.mock('../resend', () => ({
  resend: {
    emails: {
      send: jest.fn(),
      get: jest.fn(),
    },
    batch: {
      send: jest.fn(),
    },
  },
  DEFAULT_FROM_EMAIL: 'test@civilyst.com',
  EMAIL_SUBJECTS: {
    WELCOME: 'Welcome to Civilyst',
    CAMPAIGN_UPDATE: 'Campaign Update',
  },
}));

// Mock React Email render function
jest.mock('@react-email/components', () => ({
  render: jest.fn(),
}));

import { resend } from '../resend';

describe('Email Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Email Workflow', () => {
    it('should send welcome email with rendered template', async () => {
      // Mock template rendering
      const mockHtml = '<html><body>Welcome John!</body></html>';
      (render as jest.Mock).mockResolvedValue(mockHtml);

      // Mock Resend response
      const mockEmailResponse = {
        data: { id: 'email-123' },
        error: null,
      };
      (resend.emails.send as jest.Mock).mockResolvedValue(mockEmailResponse);

      // Send welcome email
      const result = await EmailService.sendWelcomeEmail({
        to: 'john@example.com',
        firstName: 'John',
        city: 'San Francisco',
        verificationUrl: 'https://example.com/verify?token=abc123',
      });

      // Verify template was rendered with correct props
      expect(render).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.any(Function),
          props: {
            firstName: 'John',
            city: 'San Francisco',
            verificationUrl: 'https://example.com/verify?token=abc123',
          },
        })
      );

      // Verify email was sent with rendered HTML
      expect(resend.emails.send).toHaveBeenCalledWith({
        from: 'test@civilyst.com',
        to: 'john@example.com',
        subject: 'Welcome to Civilyst',
        html: mockHtml,
      });

      expect(result).toEqual(mockEmailResponse);
    });

    it('should send campaign update with voting statistics', async () => {
      const mockHtml = '<html><body>Campaign update!</body></html>';
      (render as jest.Mock).mockResolvedValue(mockHtml);

      const mockEmailResponse = {
        data: { id: 'email-456' },
        error: null,
      };
      (resend.emails.send as jest.Mock).mockResolvedValue(mockEmailResponse);

      const result = await EmailService.sendCampaignUpdateEmail({
        to: 'voter@example.com',
        firstName: 'Alice',
        campaignTitle: 'New Community Garden',
        updateType: 'milestone',
        message: 'We reached our goal!',
        voteCount: 250,
        supportPercentage: 85,
        campaignUrl: 'https://example.com/campaigns/garden',
        unsubscribeUrl: 'https://example.com/unsubscribe?token=xyz',
      });

      expect(render).toHaveBeenCalledWith(
        expect.objectContaining({
          props: {
            firstName: 'Alice',
            campaignTitle: 'New Community Garden',
            updateType: 'milestone',
            message: 'We reached our goal!',
            voteCount: 250,
            supportPercentage: 85,
            campaignUrl: 'https://example.com/campaigns/garden',
            unsubscribeUrl: 'https://example.com/unsubscribe?token=xyz',
          },
        })
      );

      expect(resend.emails.send).toHaveBeenCalledWith({
        from: 'test@civilyst.com',
        to: 'voter@example.com',
        subject: 'Campaign Update',
        html: mockHtml,
      });

      expect(result).toEqual(mockEmailResponse);
    });
  });

  describe('Batch Email Processing', () => {
    it('should process batch emails with template rendering', async () => {
      const mockHtml = '<html><body>Batch email</body></html>';
      (render as jest.Mock).mockResolvedValue(mockHtml);

      const mockBatchResponse = {
        data: [
          { id: 'email-1' },
          { id: 'email-2' },
          { id: 'email-3' },
        ],
        error: null,
      };
      (resend.batch.send as jest.Mock).mockResolvedValue(mockBatchResponse);

      const emails = [
        {
          to: 'user1@example.com',
          subject: 'Campaign Update 1',
          html: '<p>Update 1</p>',
        },
        {
          to: 'user2@example.com',
          subject: 'Campaign Update 2',
          html: '<p>Update 2</p>',
        },
        {
          to: 'user3@example.com',
          subject: 'Campaign Update 3',
          html: '<p>Update 3</p>',
        },
      ];

      const results = await EmailService.sendBatchEmails(emails);

      expect(resend.batch.send).toHaveBeenCalledWith([
        {
          from: 'test@civilyst.com',
          to: 'user1@example.com',
          subject: 'Campaign Update 1',
          html: '<p>Update 1</p>',
        },
        {
          from: 'test@civilyst.com',
          to: 'user2@example.com',
          subject: 'Campaign Update 2',
          html: '<p>Update 2</p>',
        },
        {
          from: 'test@civilyst.com',
          to: 'user3@example.com',
          subject: 'Campaign Update 3',
          html: '<p>Update 3</p>',
        },
      ]);

      expect(results).toEqual([mockBatchResponse]);
    });

    it('should chunk large batches correctly', async () => {
      const mockBatchResponse = {
        data: new Array(100).fill({ id: 'email-id' }),
        error: null,
      };
      (resend.batch.send as jest.Mock).mockResolvedValue(mockBatchResponse);

      // Create 150 emails (should be split into 2 batches)
      const emails = Array.from({ length: 150 }, (_, i) => ({
        to: `user${i}@example.com`,
        subject: `Email ${i}`,
        html: `<p>Content ${i}</p>`,
      }));

      const results = await EmailService.sendBatchEmails(emails);

      // Should be called twice (100 + 50)
      expect(resend.batch.send).toHaveBeenCalledTimes(2);

      // First batch should have 100 emails
      expect(resend.batch.send).toHaveBeenNthCalledWith(
        1,
        expect.arrayContaining([
          expect.objectContaining({
            to: 'user0@example.com',
          }),
        ])
      );

      // Second batch should have 50 emails
      expect(resend.batch.send).toHaveBeenNthCalledWith(
        2,
        expect.arrayContaining([
          expect.objectContaining({
            to: 'user100@example.com',
          }),
        ])
      );

      expect(results).toHaveLength(2);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle template rendering errors gracefully', async () => {
      (render as jest.Mock).mockRejectedValue(new Error('Template error'));

      await expect(
        EmailService.sendWelcomeEmail({
          to: 'test@example.com',
          firstName: 'Test',
        })
      ).rejects.toThrow('Template error');
    });

    it('should handle Resend API errors', async () => {
      const mockHtml = '<html><body>Test</body></html>';
      (render as jest.Mock).mockResolvedValue(mockHtml);

      const mockErrorResponse = {
        data: null,
        error: {
          message: 'Invalid API key',
          name: 'validation_error',
        },
      };
      (resend.emails.send as jest.Mock).mockResolvedValue(mockErrorResponse);

      await expect(
        EmailService.sendWelcomeEmail({
          to: 'test@example.com',
          firstName: 'Test',
        })
      ).rejects.toThrow('Failed to send email: Invalid API key');
    });

    it('should handle network failures', async () => {
      const mockHtml = '<html><body>Test</body></html>';
      (render as jest.Mock).mockResolvedValue(mockHtml);

      (resend.emails.send as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      await expect(
        EmailService.sendWelcomeEmail({
          to: 'test@example.com',
          firstName: 'Test',
        })
      ).rejects.toThrow('Network error');
    });
  });

  describe('Analytics Integration', () => {
    it('should fetch email analytics successfully', async () => {
      const mockAnalytics = {
        id: 'email-123',
        status: 'delivered',
        opens: 5,
        clicks: 2,
        bounces: 0,
        complaints: 0,
      };

      (resend.emails.get as jest.Mock).mockResolvedValue(mockAnalytics);

      const result = await EmailService.getEmailAnalytics('email-123');

      expect(resend.emails.get).toHaveBeenCalledWith('email-123');
      expect(result).toEqual(mockAnalytics);
    });

    it('should handle analytics fetch errors', async () => {
      (resend.emails.get as jest.Mock).mockRejectedValue(
        new Error('Analytics API error')
      );

      const result = await EmailService.getEmailAnalytics('email-123');

      expect(result).toBeNull();
    });
  });

  describe('Email Validation Integration', () => {
    it('should handle invalid email addresses', async () => {
      const mockHtml = '<html><body>Test</body></html>';
      (render as jest.Mock).mockResolvedValue(mockHtml);

      const mockErrorResponse = {
        data: null,
        error: {
          message: 'Invalid email address',
          name: 'validation_error',
        },
      };
      (resend.emails.send as jest.Mock).mockResolvedValue(mockErrorResponse);

      await expect(
        EmailService.sendWelcomeEmail({
          to: 'invalid-email',
          firstName: 'Test',
        })
      ).rejects.toThrow('Failed to send email: Invalid email address');
    });
  });

  describe('Rate Limiting Integration', () => {
    it('should handle rate limiting errors', async () => {
      const mockHtml = '<html><body>Test</body></html>';
      (render as jest.Mock).mockResolvedValue(mockHtml);

      const mockRateLimitResponse = {
        data: null,
        error: {
          message: 'Rate limit exceeded',
          name: 'rate_limit_exceeded',
        },
      };
      (resend.emails.send as jest.Mock).mockResolvedValue(mockRateLimitResponse);

      await expect(
        EmailService.sendWelcomeEmail({
          to: 'test@example.com',
          firstName: 'Test',
        })
      ).rejects.toThrow('Failed to send email: Rate limit exceeded');
    });
  });
});