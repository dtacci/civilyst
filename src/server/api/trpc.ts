import { initTRPC, TRPCError } from '@trpc/server';
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import { ZodError } from 'zod';
import superjson from 'superjson';
import {
  checkRateLimit,
  getRateLimitConfig,
  getRateLimitIdentifier,
} from '~/lib/rate-limiting';
import { getAuth } from '@clerk/nextjs/server';

export const createTRPCContext = (opts: CreateNextContextOptions) => {
  const { req, res } = opts;

  // Extract IP address for rate limiting
  const forwarded = req.headers['x-forwarded-for'];
  const ip =
    typeof forwarded === 'string'
      ? forwarded.split(',')[0]
      : req.socket.remoteAddress || 'unknown';

  // Clerk authentication (safe-optional for anonymous routes)
  let userId: string | undefined;
  try {
    // `getAuth` will throw if clerkMiddleware() did not run.
    const { userId: clerkUserId } = getAuth(req);

    // Convert null to undefined for consistency
    userId = clerkUserId || undefined;
  } catch {
    // No Clerk context – treat as anonymous
    userId = undefined;
  }

  // Check if user is admin (you can customize this based on your admin logic)
  // For now, we'll use a simple check based on email or a specific user ID
  // In production, you might want to check against a database or Clerk metadata
  const isAdmin = userId === process.env.ADMIN_USER_ID || false;

  return {
    req,
    res,
    ip,
    userId,
    isAdmin,
  };
};

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

// Middleware for logging requests
const loggerMiddleware = t.middleware(async ({ path, type, next }) => {
  const start = Date.now();
  const result = await next();
  const durationMs = Date.now() - start;

  // Log in development only
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.info(`[tRPC] ${type} ${path} - ${durationMs}ms`);
  }

  return result;
});

// Rate limiting middleware
const rateLimitMiddleware = t.middleware(async ({ ctx, path, next }) => {
  // Determine user type from Clerk authentication
  const userType = ctx.userId ? 'pro' : 'anonymous';
  const isExpensiveOperation =
    path.includes('geocod') || path.includes('search');

  const identifier = getRateLimitIdentifier(ctx.userId ?? undefined, ctx.ip);
  const config = getRateLimitConfig(userType, isExpensiveOperation);

  const rateLimitResult = await checkRateLimit(identifier, config);

  if (!rateLimitResult.success) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `Rate limit exceeded. Try again in ${Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)} seconds.`,
    });
  }

  // Add rate limit headers to response
  ctx.res.setHeader('X-RateLimit-Limit', config.maxRequests);
  ctx.res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
  ctx.res.setHeader(
    'X-RateLimit-Reset',
    Math.ceil(rateLimitResult.resetTime / 1000)
  );

  return next();
});

export const loggedProcedure = publicProcedure.use(loggerMiddleware);
export const rateLimitedProcedure = publicProcedure
  .use(rateLimitMiddleware)
  .use(loggerMiddleware);
