import { Metadata } from 'next';
import { WifiOff, RefreshCw, Home, Search } from 'lucide-react';
import { Button } from '~/components/ui/button';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Offline - Civilyst',
  description: 'You are currently offline. Some features may not be available.',
  robots: 'noindex',
};

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Offline Icon */}
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-gray-200">
          <WifiOff className="h-12 w-12 text-gray-600" />
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              You&apos;re Offline
            </h1>
            <p className="text-gray-600">
              It looks like you&apos;ve lost your internet connection. Don&apos;t worry - you can still browse previously viewed campaigns and access cached content.
            </p>
          </div>

          {/* What You Can Do */}
          <div className="bg-white rounded-lg border p-6 text-left">
            <h2 className="font-semibold text-gray-900 mb-4">
              What you can do while offline:
            </h2>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start space-x-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 mt-0.5">
                  <div className="h-2 w-2 rounded-full bg-green-600"></div>
                </div>
                <span>View previously loaded campaigns</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 mt-0.5">
                  <div className="h-2 w-2 rounded-full bg-green-600"></div>
                </div>
                <span>Browse cached search results</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 mt-0.5">
                  <div className="h-2 w-2 rounded-full bg-green-600"></div>
                </div>
                <span>View your participation history</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 mt-0.5">
                  <div className="h-2 w-2 rounded-full bg-orange-600"></div>
                </div>
                <span>Draft new campaigns (will sync when online)</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={() => window.location.reload()}
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            
            <div className="flex space-x-3">
              <Button
                asChild
                variant="outline"
                className="flex-1"
              >
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </Link>
              </Button>
              
              <Button
                asChild
                variant="outline"
                className="flex-1"
              >
                <Link href="/campaigns">
                  <Search className="mr-2 h-4 w-4" />
                  Campaigns
                </Link>
              </Button>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <h3 className="font-medium text-blue-900 mb-2">
              💡 Pro Tips
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Install our app for better offline support</li>
              <li>• Your data will sync automatically when you&apos;re back online</li>
              <li>• Check your wifi or mobile data connection</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-xs text-gray-500">
          Civilyst - Civic Engagement Platform
        </div>
      </div>
    </div>
  );
}