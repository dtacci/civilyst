import { createTRPCRouter } from '~/server/api/trpc';
import { healthRouter } from '~/server/api/routers/health';
import { geocodingRouter } from '~/server/api/routers/geocoding';
import { campaignsRouter } from '~/server/api/routers/campaigns';
import { commentsRouter } from '~/server/api/routers/comments';

export const appRouter = createTRPCRouter({
  health: healthRouter,
  geocoding: geocodingRouter,
  campaigns: campaignsRouter,
  comments: commentsRouter,
});

export type AppRouter = typeof appRouter;
