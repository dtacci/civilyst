import { z } from 'zod';
import { createTRPCRouter, loggedProcedure } from '~/server/api/trpc';

export const healthRouter = createTRPCRouter({
  check: loggedProcedure.query(() => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }),

  echo: loggedProcedure
    .input(z.object({ message: z.string() }))
    .query(({ input }) => {
      return {
        message: input.message,
        timestamp: new Date().toISOString(),
      };
    }),
});
