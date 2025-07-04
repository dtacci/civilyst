import { db } from '~/lib/db';

export async function checkOnboardingStatus(userId: string): Promise<boolean> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { hasCompletedOnboarding: true },
    });

    return user?.hasCompletedOnboarding ?? false;
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
}
