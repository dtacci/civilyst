'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '~/lib/trpc';

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [message, setMessage] = useState('');

  const unsubscribeMutation = api.email.unsubscribe.useMutation({
    onSuccess: (data) => {
      setStatus('success');
      setMessage(data.message);
    },
    onError: (error) => {
      setStatus('error');
      setMessage(error.message || 'Failed to unsubscribe. Please try again.');
    },
  });

  const handleUnsubscribe = (
    type?: 'all' | 'campaign' | 'marketing' | 'digest'
  ) => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid unsubscribe link.');
      return;
    }

    setStatus('loading');
    unsubscribeMutation.mutate({ token, type });
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Invalid Link
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              This unsubscribe link is invalid or has expired.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-green-600">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Successfully Unsubscribed
            </h2>
            <p className="mt-2 text-sm text-gray-600">{message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Manage Email Preferences
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Choose which types of emails you want to stop receiving
          </p>
        </div>

        {status === 'error' && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{message}</p>
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={() => handleUnsubscribe('campaign')}
            disabled={status === 'loading'}
            className="group relative w-full flex justify-between items-center py-4 px-4 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <div className="text-left">
              <h3 className="text-sm font-medium text-gray-900">
                Campaign Updates
              </h3>
              <p className="text-sm text-gray-500">
                Updates about campaigns you follow
              </p>
            </div>
            <span className="text-gray-400">→</span>
          </button>

          <button
            onClick={() => handleUnsubscribe('digest')}
            disabled={status === 'loading'}
            className="group relative w-full flex justify-between items-center py-4 px-4 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <div className="text-left">
              <h3 className="text-sm font-medium text-gray-900">
                Weekly Digest
              </h3>
              <p className="text-sm text-gray-500">
                Weekly summary of activity
              </p>
            </div>
            <span className="text-gray-400">→</span>
          </button>

          <button
            onClick={() => handleUnsubscribe('marketing')}
            disabled={status === 'loading'}
            className="group relative w-full flex justify-between items-center py-4 px-4 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <div className="text-left">
              <h3 className="text-sm font-medium text-gray-900">
                Product Updates
              </h3>
              <p className="text-sm text-gray-500">
                New features and announcements
              </p>
            </div>
            <span className="text-gray-400">→</span>
          </button>

          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={() => handleUnsubscribe('all')}
              disabled={status === 'loading'}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              {status === 'loading'
                ? 'Processing...'
                : 'Unsubscribe from All Emails'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
