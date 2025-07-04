import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';
import { env } from '~/env';
import { EmailService } from '~/lib/email/service';

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(env.CLERK_WEBHOOK_SECRET || '');

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name } = evt.data;

    const primaryEmail = email_addresses.find(
      (email) => email.id === evt.data.primary_email_address_id
    );

    if (primaryEmail?.email_address) {
      try {
        // Send welcome email
        await EmailService.sendWelcomeEmail({
          to: primaryEmail.email_address,
          firstName: first_name || 'there',
          // We can add city detection based on user metadata later
          tags: [
            { name: 'type', value: 'welcome' },
            { name: 'userId', value: id },
          ],
        });

        console.warn(`Welcome email sent to ${primaryEmail.email_address}`);
      } catch (error) {
        console.error('Failed to send welcome email:', error);
        // Don't fail the webhook, just log the error
      }
    }
  }

  if (eventType === 'user.updated') {
    const { id, email_addresses } = evt.data;

    // Check if email verification status changed
    const verifiedEmails = email_addresses.filter(
      (email) => email.verification?.status === 'verified'
    );

    // You can add logic here to track email verification status changes
    console.warn(`User ${id} updated, verified emails:`, verifiedEmails.length);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
