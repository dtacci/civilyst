import type { inferAsyncReturnType } from '@trpc/server';
import type { createTRPCContext } from './trpc';

type Context = inferAsyncReturnType<typeof createTRPCContext>;

export function createMockContext(overrides?: Partial<Context>): Context {
  return {
    db: {} as any,
    auth: null,
    ...overrides,
  } as Context;
}
