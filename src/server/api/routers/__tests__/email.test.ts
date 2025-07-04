import { createMockContext } from '~/server/api/test-utils';
import { emailRouter } from '../email';
import { EmailService } from '~/lib/email/service';
import { db } from '~/server/db';
import { TRPCError } from '@trpc/server';

// Mock dependencies
jest.mock('~/lib/email/service');
jest.mock('~/server/db', () => ({
  db: {
    userPreferences: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    campaign: {
      findUnique: jest.fn(),
    },
  },
}));

describe('emailRouter', () => {
  let ctx: ReturnType<typeof createMockContext>;
  let caller: ReturnType<typeof emailRouter.createCaller>;

  beforeEach(() => {
    ctx = createMockContext({
      auth: {
        userId: 'user-123',
        user: {
          id: 'user-123',
          firstName: 'Test',
          emailAddresses: [{ emailAddress: 'test@example.com' }],
        },
      },
    });
    caller = emailRouter.createCaller(ctx);
    jest.clearAllMocks();
  });

  describe('sendTestEmail', () => {
    beforeEach(() => {
      // Set NODE_ENV to development for test emails
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      process.env.NODE_ENV = 'test';
    });

    it('should send test welcome email', async () => {
      (EmailService.sendWelcomeEmail as jest.Mock).mockResolvedValue({
        data: { id: 'email-123' },
      });

      const result = await caller.sendTestEmail({
        template: 'welcome',
      });

      expect(EmailService.sendWelcomeEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        firstName: 'Test',
        city: 'Test City',
        verificationUrl: expect.stringContaining('/verify-email?token=test'),
      });
      expect(result).toEqual({
        success: true,
        emailId: 'email-123',
        message: 'Test welcome email sent to test@example.com',
      });
    });

    it('should send to custom email address', async () => {
      (EmailService.sendVerificationEmail as jest.Mock).mockResolvedValue({
        data: { id: 'email-124' },
      });

      await caller.sendTestEmail({
        template: 'verification',
        to: 'custom@example.com',
      });

      expect(EmailService.sendVerificationEmail).toHaveBeenCalledWith({
        to: 'custom@example.com',
        firstName: 'Test',
        verificationUrl: expect.any(String),
      });
    });

    it('should throw error in production', async () => {
      process.env.NODE_ENV = 'production';

      await expect(
        caller.sendTestEmail({ template: 'welcome' })
      ).rejects.toThrow('Test emails are only available in development');
    });
  });

  describe('getEmailPreferences', () => {
    it('should return existing preferences', async () => {
      const mockPreferences = {
        emailNotifications: false,
        campaignUpdates: true,
        weeklyDigest: true,
        marketingEmails: false,
      };

      (db.userPreferences.findUnique as jest.Mock).mockResolvedValue(
        mockPreferences
      );

      const result = await caller.getEmailPreferences();

      expect(db.userPreferences.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        select: {
          emailNotifications: true,
          campaignUpdates: true,
          weeklyDigest: true,
          marketingEmails: true,
        },
      });
      expect(result).toEqual(mockPreferences);
    });

    it('should return defaults if no preferences exist', async () => {
      (db.userPreferences.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await caller.getEmailPreferences();

      expect(result).toEqual({
        emailNotifications: true,
        campaignUpdates: true,
        weeklyDigest: false,
        marketingEmails: false,
      });
    });
  });

  describe('updateEmailPreferences', () => {
    it('should update existing preferences', async () => {
      const updatedPreferences = {
        userId: 'user-123',
        emailNotifications: false,
        campaignUpdates: true,
        weeklyDigest: false,
        marketingEmails: false,
      };

      (db.userPreferences.upsert as jest.Mock).mockResolvedValue(
        updatedPreferences
      );

      const result = await caller.updateEmailPreferences({
        emailNotifications: false,
      });

      expect(db.userPreferences.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        update: { emailNotifications: false },
        create: {
          userId: 'user-123',
          emailNotifications: false,
        },
      });
      expect(result).toEqual(updatedPreferences);
    });
  });

  describe('unsubscribe', () => {
    it('should unsubscribe from all emails', async () => {
      const token = Buffer.from('user-456:123456', 'utf-8').toString('base64');

      (db.userPreferences.upsert as jest.Mock).mockResolvedValue({});

      const result = await caller.unsubscribe({
        token,
        type: 'all',
      });

      expect(db.userPreferences.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-456' },
        update: {
          emailNotifications: false,
          campaignUpdates: false,
          weeklyDigest: false,
          marketingEmails: false,
        },
        create: {
          userId: 'user-456',
          emailNotifications: false,
          campaignUpdates: false,
          weeklyDigest: false,
          marketingEmails: false,
        },
      });
      expect(result).toEqual({
        success: true,
        message: 'You have been unsubscribed from all emails',
      });
    });

    it('should unsubscribe from specific email type', async () => {
      const token = Buffer.from('user-789:123456', 'utf-8').toString('base64');

      await caller.unsubscribe({
        token,
        type: 'marketing',
      });

      expect(db.userPreferences.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-789' },
        update: { marketingEmails: false },
        create: {
          userId: 'user-789',
          marketingEmails: false,
        },
      });
    });

    it('should handle invalid token', async () => {
      await expect(
        caller.unsubscribe({ token: 'invalid-token' })
      ).rejects.toThrow('Invalid or expired unsubscribe token');
    });
  });

  describe('sendCampaignNotification', () => {
    const mockCampaign = {
      id: 'campaign-123',
      title: 'Test Campaign',
      creatorId: 'user-123',
      creator: {
        id: 'user-123',
        email: 'creator@example.com',
      },
      votes: [
        {
          type: 'SUPPORT',
          user: {
            id: 'voter-1',
            email: 'voter1@example.com',
            firstName: 'Voter1',
          },
        },
        {
          type: 'OPPOSE',
          user: {
            id: 'voter-2',
            email: 'voter2@example.com',
            firstName: 'Voter2',
          },
        },
      ],
    };

    it('should send notifications to campaign voters', async () => {
      (db.campaign.findUnique as jest.Mock).mockResolvedValue(mockCampaign);
      (db.userPreferences.findUnique as jest.Mock).mockResolvedValue({
        emailNotifications: true,
        campaignUpdates: true,
      });
      (EmailService.sendCampaignUpdateEmail as jest.Mock).mockResolvedValue({});

      const result = await caller.sendCampaignNotification({
        campaignId: 'campaign-123',
        updateType: 'milestone',
        message: 'We reached our goal!',
      });

      expect(EmailService.sendCampaignUpdateEmail).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        success: true,
        sent: 2,
        failed: 0,
        message: 'Sent 2 emails',
      });
    });

    it('should respect email preferences', async () => {
      (db.campaign.findUnique as jest.Mock).mockResolvedValue(mockCampaign);
      (db.userPreferences.findUnique as jest.Mock)
        .mockResolvedValueOnce({
          emailNotifications: false,
          campaignUpdates: false,
        })
        .mockResolvedValueOnce({
          emailNotifications: true,
          campaignUpdates: true,
        });

      await caller.sendCampaignNotification({
        campaignId: 'campaign-123',
        updateType: 'new_vote',
        message: 'New vote received',
      });

      // Should only send to voter with preferences enabled
      expect(EmailService.sendCampaignUpdateEmail).toHaveBeenCalledTimes(1);
    });

    it('should throw error if not campaign creator', async () => {
      (db.campaign.findUnique as jest.Mock).mockResolvedValue({
        ...mockCampaign,
        creatorId: 'other-user',
      });

      await expect(
        caller.sendCampaignNotification({
          campaignId: 'campaign-123',
          updateType: 'comment',
          message: 'New comment',
        })
      ).rejects.toThrow('Only campaign creators can send notifications');
    });

    it('should handle campaign not found', async () => {
      (db.campaign.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        caller.sendCampaignNotification({
          campaignId: 'non-existent',
          updateType: 'status_change',
          message: 'Status updated',
        })
      ).rejects.toThrow('Campaign not found');
    });
  });
});
