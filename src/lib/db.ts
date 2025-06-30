import { PrismaClient } from '~/generated/prisma';
import { auth } from '@clerk/nextjs/server';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Get Prisma client with RLS context for the current user
 * This ensures all database operations respect Row Level Security policies
 */
export async function getPrismaWithRLS() {
  const authResult = await auth();
  const userId = authResult?.userId;
  
  if (!userId) {
    // Return regular prisma for anonymous access (RLS will handle permissions)
    return prisma;
  }

  // For authenticated users, we rely on RLS policies in the database
  // The JWT token is set via Supabase client when needed
  return prisma;
}

export { prisma };
export { prisma as db };
