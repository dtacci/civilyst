'use client';

import { api } from '~/lib/trpc';
import { SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/nextjs';
import Link from 'next/link';

export default function Home() {
  const healthCheck = api.health.check.useQuery();
  const { isSignedIn } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Civilyst</h1>
            <div className="flex gap-4">
              {isSignedIn ? (
                <>
                  <Link
                    href="/dashboard"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <UserButton />
                </>
              ) : (
                <>
                  <SignInButton mode="modal">
                    <button className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      Sign Up
                    </button>
                  </SignUpButton>
                </>
              )}
            </div>
          </div>
          <p className="text-xl text-gray-600">
            Digital civic engagement platform for municipal development
          </p>
        </header>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">System Status</h2>
          {healthCheck.isLoading && (
            <div className="text-gray-500">Loading health check...</div>
          )}
          {healthCheck.error && (
            <div className="text-red-500">
              Error: {healthCheck.error.message}
            </div>
          )}
          {healthCheck.data && (
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                <span className="text-green-700 font-medium">
                  System Operational
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Last checked: {healthCheck.data.timestamp}
              </div>
              <div className="text-sm text-gray-600">
                Uptime: {Math.floor(healthCheck.data.uptime)} seconds
              </div>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-3 text-blue-900">
              For Citizens
            </h3>
            <p className="text-blue-700">
              Participate in local municipal projects, voice your opinions, and
              track community developments in your area.
            </p>
          </div>

          <div className="bg-green-50 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-3 text-green-900">
              For Municipalities
            </h3>
            <p className="text-green-700">
              Engage with your community efficiently, gather feedback, and
              manage development projects with transparency.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
