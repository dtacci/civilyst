import { Resend } from 'resend';
import { env } from '~/env';

if (!env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not defined');
}

export const resend = new Resend(env.RESEND_API_KEY);

// Default from email - should be updated with a verified domain
export const DEFAULT_FROM_EMAIL = 'Civilyst <onboarding@resend.dev>';

// Email subjects
export const EMAIL_SUBJECTS = {
  WELCOME: 'Welcome to Civilyst - Your Voice in Civic Engagement',
  VERIFICATION: 'Verify your email address',
  PASSWORD_RESET: 'Reset your password',
  CAMPAIGN_UPDATE: 'Update on campaign: ',
  VOTE_CONFIRMATION: 'Your vote has been recorded',
  NOTIFICATION: 'New activity on Civilyst',
} as const;
