import { UserButton } from '@clerk/nextjs';
import { currentUser } from '@clerk/nextjs/server';

export default async function DashboardPage() {
  const user = await currentUser();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <UserButton />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">
          Welcome, {user?.firstName}!
        </h2>
        <p className="text-gray-600 mb-4">
          This is your Civilyst dashboard where you can manage your civic
          engagement activities.
        </p>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900">Active Campaigns</h3>
            <p className="text-2xl font-bold text-blue-700">0</p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900">Your Contributions</h3>
            <p className="text-2xl font-bold text-green-700">0</p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-900">Local Projects</h3>
            <p className="text-2xl font-bold text-purple-700">0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
