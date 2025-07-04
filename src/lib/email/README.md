# Email Integration with Resend

This directory contains the email integration for Civilyst using Resend as the email service provider.

## Setup

1. Add your Resend API key to `.env.local`:

   ```
   RESEND_API_KEY=re_your_api_key_here
   ```

2. Configure Clerk webhook secret for welcome emails:

   ```
   CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret
   ```

3. Run the database migration to create UserPreferences table:
   ```bash
   npx prisma migrate deploy
   ```

## Email Templates

- **Welcome Email** - Sent when a new user signs up (via Clerk webhook)
- **Verification Email** - For email address verification
- **Password Reset Email** - For password reset requests
- **Campaign Update Email** - For campaign activity notifications

## Usage

### Send emails via tRPC

```typescript
// Send test email (development only)
const { mutate } = api.email.sendTestEmail.useMutation();
mutate({ template: 'welcome' });

// Update email preferences
const { mutate } = api.email.updateEmailPreferences.useMutation();
mutate({ emailNotifications: false });

// Send campaign notification
const { mutate } = api.email.sendCampaignNotification.useMutation();
mutate({
  campaignId: 'campaign-123',
  updateType: 'milestone',
  message: 'We reached 100 supporters!',
});
```

### Direct email service usage

```typescript
import { EmailService } from '@/lib/email/service';

// Send welcome email
await EmailService.sendWelcomeEmail({
  to: 'user@example.com',
  firstName: 'John',
  city: 'San Francisco',
  verificationUrl: 'https://civilyst.com/verify?token=abc123',
});

// Send batch emails
await EmailService.sendBatchEmails([
  { to: 'user1@example.com', subject: 'Update', html: '<p>Content</p>' },
  { to: 'user2@example.com', subject: 'Update', html: '<p>Content</p>' },
]);
```

## Unsubscribe Flow

Users can unsubscribe via:

1. Unsubscribe links in emails (points to `/unsubscribe?token=xxx`)
2. Email preferences in their account settings
3. Specific unsubscribe for campaign/marketing/digest emails

## Testing

Run the email tests:

```bash
npm test -- src/lib/email/__tests__
```

Send test emails in development:

```bash
# Via tRPC playground or API client
POST /api/trpc/email.sendTestEmail
{
  "template": "welcome",
  "to": "test@example.com" // optional
}
```

## Production Checklist

- [ ] Update `DEFAULT_FROM_EMAIL` in `resend.ts` with verified domain
- [ ] Configure Clerk webhook endpoint in Clerk dashboard
- [ ] Set up proper unsubscribe token generation (JWT recommended)
- [ ] Monitor email delivery rates in Resend dashboard
- [ ] Set up email analytics tracking
