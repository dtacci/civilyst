import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { checkOnboardingStatus } from '~/lib/auth/onboarding-check';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/profile(.*)',
  // Only pages that mutate or manage campaigns require auth.
  '/campaigns/create(.*)',
  '/campaigns/.*/edit(.*)',
  '/campaigns/.*/delete(.*)',
]);

// const isPublicRoute = createRouteMatcher([
//   '/',
//   '/sign-in(.*)',
//   '/sign-up(.*)',
//   '/onboarding(.*)',
//   '/api/webhooks(.*)',
// ]);

export default clerkMiddleware(async (auth, req) => {
  const authData = await auth();

  // 1. Protect specific app routes (see matcher above)
  if (isProtectedRoute(req)) {
    await auth.protect();

    // Check onboarding status for authenticated users
    if (authData.userId && !req.nextUrl.pathname.startsWith('/onboarding')) {
      const hasCompletedOnboarding = await checkOnboardingStatus(
        authData.userId
      );

      if (!hasCompletedOnboarding) {
        return NextResponse.redirect(new URL('/onboarding', req.url));
      }
    }

    return;
  }

  // 2. For all API / tRPC calls:
  //    – Allow anonymous GET requests (read-only)
  //    – Require auth for non-GET (mutations)
  if (
    req.nextUrl.pathname.startsWith('/api') ||
    req.nextUrl.pathname.startsWith('/trpc')
  ) {
    if (req.method !== 'GET') {
      await auth.protect();
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
