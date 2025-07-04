import React from 'react';
import { render } from '@react-email/components';
import {
  WelcomeEmail,
  VerificationEmail,
  PasswordResetEmail,
  CampaignUpdateEmail,
} from '../templates';

describe('Email Templates', () => {
  describe('WelcomeEmail', () => {
    it('should render welcome email with all props', async () => {
      const html = await render(
        <WelcomeEmail
          firstName="John"
          city="San Francisco"
          verificationUrl="https://example.com/verify"
        />
      );

      expect(html).toContain('Welcome to Civilyst, John!');
      expect(html).toContain('in San Francisco');
      expect(html).toContain('Verify Email Address');
      expect(html).toContain('https://example.com/verify');
    });

    it('should render without optional props', async () => {
      const html = await render(<WelcomeEmail firstName="Jane" />);

      expect(html).toContain('Welcome to Civilyst, Jane!');
      expect(html).not.toContain('Verify Email Address');
    });
  });

  describe('VerificationEmail', () => {
    it('should render verification email', async () => {
      const html = await render(
        <VerificationEmail
          verificationUrl="https://example.com/verify?token=abc123"
          firstName="Alice"
        />
      );

      expect(html).toContain('Verify your email address');
      expect(html).toContain('Hi Alice,');
      expect(html).toContain('https://example.com/verify?token=abc123');
      expect(html).toContain('This link will expire in 24 hours');
    });

    it('should render without firstName', async () => {
      const html = await render(
        <VerificationEmail verificationUrl="https://example.com/verify" />
      );

      expect(html).toContain('Hi there,');
    });
  });

  describe('PasswordResetEmail', () => {
    it('should render password reset email with security info', async () => {
      const html = await render(
        <PasswordResetEmail
          resetUrl="https://example.com/reset?token=xyz789"
          firstName="Bob"
          ipAddress="192.168.1.1"
          userAgent="Chrome/120.0"
        />
      );

      expect(html).toContain('Reset your password');
      expect(html).toContain('Hi Bob,');
      expect(html).toContain('https://example.com/reset?token=xyz789');
      expect(html).toContain('IP: 192.168.1.1');
      expect(html).toContain('Device: Chrome/120.0');
      expect(html).toContain('This link will expire in 1 hour');
    });

    it('should render without optional security info', async () => {
      const html = await render(
        <PasswordResetEmail resetUrl="https://example.com/reset" />
      );

      expect(html).toContain('Hi there,');
      expect(html).not.toContain('Security Information:');
    });
  });

  describe('CampaignUpdateEmail', () => {
    it('should render campaign update email with all props', async () => {
      const html = await render(
        <CampaignUpdateEmail
          firstName="Carol"
          campaignTitle="New Community Garden"
          updateType="milestone"
          updateMessage="We've reached 500 supporters!"
          campaignUrl="https://example.com/campaigns/garden"
          voteCount={500}
          supportPercentage={85}
          unsubscribeUrl="https://example.com/unsubscribe?token=abc"
        />
      );

      expect(html).toContain('Campaign Milestone Reached!');
      expect(html).toContain('Hi Carol,');
      expect(html).toContain('New Community Garden');
      expect(html).toContain("We've reached 500 supporters!");
      expect(html).toContain('500</strong> votes');
      expect(html).toContain('85%</strong> support');
      expect(html).toContain('View Campaign');
      expect(html).toContain('Unsubscribe');
    });

    it('should render different update types correctly', async () => {
      const updateTypes = [
        { type: 'status_change' as const, expected: 'Campaign Status Update' },
        {
          type: 'new_vote' as const,
          expected: 'New Activity on Your Campaign',
        },
        { type: 'comment' as const, expected: 'New Comment on Campaign' },
        { type: 'milestone' as const, expected: 'Campaign Milestone Reached!' },
      ];

      for (const { type, expected } of updateTypes) {
        const html = await render(
          <CampaignUpdateEmail
            firstName="Test"
            campaignTitle="Test Campaign"
            updateType={type}
            updateMessage="Test message"
            campaignUrl="https://example.com/campaigns/test"
            unsubscribeUrl="https://example.com/unsubscribe"
          />
        );

        expect(html).toContain(expected);
      }
    });
  });
});
