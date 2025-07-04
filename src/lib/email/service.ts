import { render } from '@react-email/components';
import { resend, DEFAULT_FROM_EMAIL, EMAIL_SUBJECTS } from './resend';
import {
  WelcomeEmail,
  VerificationEmail,
  PasswordResetEmail,
  CampaignUpdateEmail,
} from './templates';

export interface SendEmailOptions {
  to: string | string[];
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
}

export class EmailService {
  static async sendWelcomeEmail(
    options: SendEmailOptions & {
      firstName: string;
      city?: string;
      verificationUrl?: string;
    }
  ) {
    const { to, firstName, city, verificationUrl, replyTo, tags } = options;

    const html = await render(
      WelcomeEmail({ firstName, city, verificationUrl })
    );

    return resend.emails.send({
      from: DEFAULT_FROM_EMAIL,
      to,
      subject: EMAIL_SUBJECTS.WELCOME,
      html,
      replyTo,
      tags,
    });
  }

  static async sendVerificationEmail(
    options: SendEmailOptions & {
      verificationUrl: string;
      firstName?: string;
    }
  ) {
    const { to, verificationUrl, firstName, replyTo, tags } = options;

    const html = await render(
      VerificationEmail({ verificationUrl, firstName })
    );

    return resend.emails.send({
      from: DEFAULT_FROM_EMAIL,
      to,
      subject: EMAIL_SUBJECTS.VERIFICATION,
      html,
      replyTo,
      tags,
    });
  }

  static async sendPasswordResetEmail(
    options: SendEmailOptions & {
      resetUrl: string;
      firstName?: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ) {
    const { to, resetUrl, firstName, ipAddress, userAgent, replyTo, tags } =
      options;

    const html = await render(
      PasswordResetEmail({ resetUrl, firstName, ipAddress, userAgent })
    );

    return resend.emails.send({
      from: DEFAULT_FROM_EMAIL,
      to,
      subject: EMAIL_SUBJECTS.PASSWORD_RESET,
      html,
      replyTo,
      tags,
    });
  }

  static async sendCampaignUpdateEmail(
    options: SendEmailOptions & {
      firstName: string;
      campaignTitle: string;
      updateType: 'status_change' | 'new_vote' | 'comment' | 'milestone';
      updateMessage: string;
      campaignUrl: string;
      voteCount?: number;
      supportPercentage?: number;
      unsubscribeUrl: string;
    }
  ) {
    const {
      to,
      firstName,
      campaignTitle,
      updateType,
      updateMessage,
      campaignUrl,
      voteCount,
      supportPercentage,
      unsubscribeUrl,
      replyTo,
      tags,
    } = options;

    const html = await render(
      CampaignUpdateEmail({
        firstName,
        campaignTitle,
        updateType,
        updateMessage,
        campaignUrl,
        voteCount,
        supportPercentage,
        unsubscribeUrl,
      })
    );

    return resend.emails.send({
      from: DEFAULT_FROM_EMAIL,
      to,
      subject: EMAIL_SUBJECTS.CAMPAIGN_UPDATE + campaignTitle,
      html,
      replyTo,
      tags,
    });
  }

  // Batch email sending for notifications
  static async sendBatchEmails(
    emails: Array<{
      to: string;
      subject: string;
      html: string;
      tags?: Array<{ name: string; value: string }>;
    }>
  ) {
    // Resend supports batch sending up to 100 emails at once
    const batches = [];
    for (let i = 0; i < emails.length; i += 100) {
      batches.push(emails.slice(i, i + 100));
    }

    const results = await Promise.all(
      batches.map((batch) =>
        resend.batch.send(
          batch.map((email) => ({
            from: DEFAULT_FROM_EMAIL,
            ...email,
          }))
        )
      )
    );

    return results.flat();
  }

  // Get email analytics
  static async getEmailAnalytics(emailId: string) {
    try {
      const email = await resend.emails.get(emailId);
      return email;
    } catch (error) {
      console.error('Failed to get email analytics:', error);
      return null;
    }
  }
}
