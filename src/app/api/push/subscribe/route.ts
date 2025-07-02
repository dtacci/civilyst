import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '~/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Get user authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { subscription, userAgent } = body;

    // Validate subscription object
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      );
    }

    // Store subscription in database
    await db.pushSubscription.upsert({
      where: {
        userId_endpoint: {
          userId,
          endpoint: subscription.endpoint,
        },
      },
      update: {
        p256dh: subscription.keys?.p256dh || null,
        auth: subscription.keys?.auth || null,
        userAgent: userAgent || null,
        lastUpdated: new Date(),
      },
      create: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys?.p256dh || null,
        auth: subscription.keys?.auth || null,
        userAgent: userAgent || null,
        subscriptionData: JSON.stringify(subscription),
        isActive: true,
        createdAt: new Date(),
        lastUpdated: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Push notification subscription saved successfully',
    });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
