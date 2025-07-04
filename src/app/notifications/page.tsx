import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { NotificationDashboard } from '~/components/notifications/NotificationDashboard';

export default async function NotificationsPage() {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <NotificationDashboard userId={user.id} />
      </div>
    </div>
  );
}
