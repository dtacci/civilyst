import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/profile(.*)',
  // Only pages that mutate or manage campaigns require auth.
  '/campaigns/create(.*)',
  '/campaigns/.*/edit(.*)',
  '/campaigns/.*/delete(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // 1. Protect specific app routes (see matcher above)
  if (isProtectedRoute(req)) {
    await auth.protect();
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
