'use client';

import { useUser } from '@clerk/nextjs';
import { api } from '~/lib/trpc';
import { Card, CardContent } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import {
  MapPin,
  Calendar,
  Users,
  Vote,
  MessageSquare,
  Settings,
  Share2,
  Camera,
  Flame,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, isLoaded } = useUser();

  // Redirect if not authenticated
  if (isLoaded && !user) {
    redirect('/sign-in');
  }

  // Get user statistics
  const { data: stats, isLoading: statsLoading } = api.users.getStats.useQuery(
    undefined,
    { enabled: isLoaded && !!user }
  );

  // Get user's recent activity
  const { data: activity, isLoading: activityLoading } =
    api.users.getRecentActivity.useQuery(
      { limit: 5 },
      { enabled: isLoaded && !!user }
    );

  // Get extended profile data
  const { data: profile } = api.users.getProfile.useQuery(undefined, {
    enabled: isLoaded && !!user,
  });

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-[--color-background] flex items-center justify-center">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-[--color-primary] border-t-transparent"
          role="status"
          aria-label="Loading profile"
        ></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[--color-background] pb-20">
      {/* Header */}
      <div className="bg-[--color-surface] border-b border-[--color-border]">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[--color-text-primary]">
              Profile
            </h1>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-[--color-primary] flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                  {user.imageUrl ? (
                    <Image
                      src={user.imageUrl}
                      alt={user.fullName || 'Profile'}
                      width={96}
                      height={96}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <span>
                      {user.firstName?.[0] ||
                        user.emailAddresses[0]?.emailAddress[0]?.toUpperCase() ||
                        'U'}
                    </span>
                  )}
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-[--color-surface] border-2 border-[--color-border] rounded-full flex items-center justify-center hover:bg-[--color-surface-hover] transition-colors">
                  <Camera className="h-4 w-4 text-[--color-text-secondary]" />
                </button>
              </div>

              {/* User Info */}
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl font-bold text-[--color-text-primary] mb-2">
                  {user.fullName || 'Community Member'}
                </h2>
                <p className="text-[--color-text-secondary] mb-3">
                  {user.emailAddresses[0]?.emailAddress}
                </p>

                <div className="flex flex-wrap gap-4 justify-center sm:justify-start text-sm text-[--color-text-tertiary]">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Joined{' '}
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Recently'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{profile?.location || 'Location not set'}</span>
                  </div>
                </div>

                <div className="mt-4">
                  {profile?.bio ? (
                    <p className="text-[--color-text-primary] text-sm">
                      {profile.bio}
                    </p>
                  ) : (
                    <p className="text-[--color-text-secondary] text-sm">
                      Add a bio to tell your community about yourself and your
                      civic interests.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Stats */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-[--color-text-primary] mb-4">
              Activity Overview
            </h3>

            {statsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="text-center"
                    data-testid="loading-skeleton"
                  >
                    <div className="h-8 w-8 bg-[--color-surface] rounded-full animate-pulse mx-auto mb-2"></div>
                    <div className="h-6 w-12 bg-[--color-surface] rounded animate-pulse mx-auto mb-1"></div>
                    <div className="h-4 w-16 bg-[--color-surface] rounded animate-pulse mx-auto"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-[--color-primary-light] rounded-full flex items-center justify-center mx-auto mb-2">
                    <Users className="h-6 w-6 text-[--color-primary]" />
                  </div>
                  <div className="text-2xl font-bold text-[--color-text-primary]">
                    {stats?.campaignCount || 0}
                  </div>
                  <div className="text-sm text-[--color-text-secondary]">
                    Campaigns
                  </div>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-[--color-accent-light] rounded-full flex items-center justify-center mx-auto mb-2">
                    <Vote className="h-6 w-6 text-[--color-accent]" />
                  </div>
                  <div className="text-2xl font-bold text-[--color-text-primary]">
                    {stats?.voteCount || 0}
                  </div>
                  <div className="text-sm text-[--color-text-secondary]">
                    Votes Cast
                  </div>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-[--color-secondary-light] rounded-full flex items-center justify-center mx-auto mb-2">
                    <MessageSquare className="h-6 w-6 text-[--color-secondary]" />
                  </div>
                  <div className="text-2xl font-bold text-[--color-text-primary]">
                    {stats?.commentCount || 0}
                  </div>
                  <div className="text-sm text-[--color-text-secondary]">
                    Comments
                  </div>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-[--color-warning-light] rounded-full flex items-center justify-center mx-auto mb-2">
                    <Flame className="h-6 w-6 text-[--color-warning]" />
                  </div>
                  <div className="text-2xl font-bold text-[--color-text-primary]">
                    {stats?.engagementStreak || 0}
                  </div>
                  <div className="text-sm text-[--color-text-secondary]">
                    Day Streak
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-[--color-text-primary] mb-4">
              Recent Activity
            </h3>

            {activityLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[--color-surface] rounded-full animate-pulse"></div>
                    <div className="flex-1">
                      <div className="h-4 w-3/4 bg-[--color-surface] rounded animate-pulse mb-1"></div>
                      <div className="h-3 w-1/2 bg-[--color-surface] rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : activity && activity.length > 0 ? (
              <div className="space-y-4">
                {activity.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[--color-primary-light] rounded-full flex items-center justify-center">
                      {item.type === 'campaign' && (
                        <Users className="h-4 w-4 text-[--color-primary]" />
                      )}
                      {item.type === 'vote' && (
                        <Vote className="h-4 w-4 text-[--color-accent]" />
                      )}
                      {item.type === 'comment' && (
                        <MessageSquare className="h-4 w-4 text-[--color-secondary]" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-[--color-text-primary]">
                        {item.description}
                      </p>
                      <p className="text-xs text-[--color-text-tertiary]">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-[--color-surface] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-[--color-text-tertiary]" />
                </div>
                <p className="text-[--color-text-secondary] mb-4">
                  No recent activity yet
                </p>
                <Button asChild>
                  <Link href="/campaigns">Explore Campaigns</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Civic Engagement */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-[--color-text-primary] mb-4">
              Civic Engagement
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[--color-text-secondary]">
                  Engagement Level
                </span>
                <span className="text-sm font-medium text-[--color-primary]">
                  {stats?.engagementLevel || 'Getting Started'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-[--color-text-secondary]">
                  Community Impact
                </span>
                <span className="text-sm font-medium text-[--color-accent]">
                  {stats?.impactScore || 0} points
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-[--color-text-secondary]">
                  Active Campaigns
                </span>
                <span className="text-sm font-medium text-[--color-secondary]">
                  {stats?.activeCampaignCount || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
