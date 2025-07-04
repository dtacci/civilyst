import { createTRPCRouter } from '~/server/api/trpc';
import { healthRouter } from '~/server/api/routers/health';
import { geocodingRouter } from '~/server/api/routers/geocoding';
import { campaignsRouter } from '~/server/api/routers/campaigns';
import { commentsRouter } from '~/server/api/routers/comments';
import { usersRouter } from '~/server/api/routers/users';
import { wondersRouter } from '~/server/api/routers/wonders';
import { emailRouter } from '~/server/api/routers/email';
import { projectRouter } from '~/server/api/routers/project';
import { pledgeRouter } from '~/server/api/routers/pledge';
import { escrowRouter } from '~/server/api/routers/escrow';
import { aiRouter } from '~/server/api/routers/ai';
import { aiJobsRouter } from '~/server/api/routers/ai-jobs';
import { skillRouter } from '~/server/api/routers/skill';
import { userSkillRouter } from '~/server/api/routers/userSkill';
import { skillMatchingRouter } from '~/server/api/routers/skillMatching';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

export const appRouter = createTRPCRouter({
  health: healthRouter,
  geocoding: geocodingRouter,
  campaigns: campaignsRouter,
  comments: commentsRouter,
  users: usersRouter,
  wonders: wondersRouter,
  email: emailRouter,
  projects: projectRouter,
  pledges: pledgeRouter,
  escrow: escrowRouter,
  ai: aiRouter,
  aiJobs: aiJobsRouter,
  skills: skillRouter,
  userSkills: userSkillRouter,
  skillMatching: skillMatchingRouter,
});

export type AppRouter = typeof appRouter;
export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
