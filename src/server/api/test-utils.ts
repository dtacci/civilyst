import type { NextApiRequest, NextApiResponse } from 'next';
import type { Context } from './trpc';

export function createMockContext(overrides?: Partial<Context>): Context {
  const mockReq = {
    headers: {},
    socket: { remoteAddress: '127.0.0.1' },
  } as unknown as NextApiRequest;

  const mockRes = {
    setHeader: jest.fn(),
  } as unknown as NextApiResponse;

  return {
    req: mockReq,
    res: mockRes,
    ip: '127.0.0.1',
    userId: undefined,
    isAdmin: false,
    ...overrides,
  };
}
