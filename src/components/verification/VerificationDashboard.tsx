'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { cn } from '~/lib/utils';
import { api } from '~/lib/trpc';
import {
  VerificationRequestList,
  VerificationRequestStatus,
} from './VerificationRequest';
import {
  Award,
  Clock,
  CheckCircle,
  Users,
  FileText,
  TrendingUp,
} from 'lucide-react';

interface VerificationStatsProps {
  userId?: string;
  className?: string;
}

export function VerificationStats({
  userId,
  className,
}: VerificationStatsProps) {
  const { data: stats, isLoading } =
    api.verification.getVerificationStats.useQuery({
      userId,
    });

  if (isLoading) {
    return (
      <div
        className={cn(
          'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4',
          className
        )}
      >
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
              <div className="h-8 bg-gray-200 rounded animate-pulse w-16" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-32" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div
        className={cn(
          'text-center py-8 text-[--color-text-secondary]',
          className
        )}
      >
        No verification statistics available.
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Skills',
      value: stats.totalSkills,
      icon: <Award className="w-4 h-4" />,
      color: 'blue',
    },
    {
      title: 'Verified Skills',
      value: stats.verifiedSkills,
      icon: <CheckCircle className="w-4 h-4" />,
      color: 'green',
    },
    {
      title: 'Pending Verification',
      value: stats.pendingVerification,
      icon: <Clock className="w-4 h-4" />,
      color: 'yellow',
    },
    {
      title: 'Total Endorsements',
      value: stats.totalEndorsements,
      icon: <Users className="w-4 h-4" />,
      color: 'purple',
    },
  ];

  return (
    <div className={cn('space-y-4', className)}>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[--color-text-secondary]">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-[--color-text-primary]">
                  {stat.value}
                </p>
              </div>
              <div
                className={cn(
                  'p-2 rounded-full',
                  stat.color === 'blue' && 'bg-blue-100 text-blue-600',
                  stat.color === 'green' && 'bg-green-100 text-green-600',
                  stat.color === 'yellow' && 'bg-yellow-100 text-yellow-600',
                  stat.color === 'purple' && 'bg-purple-100 text-purple-600'
                )}
              >
                {stat.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Verification Rate */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-[--color-text-primary]">
              Verification Rate
            </h3>
            <p className="text-sm text-[--color-text-secondary]">
              Percentage of skills that are verified
            </p>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-2xl font-bold text-green-600">
              {Math.round(stats.verificationRate)}%
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${stats.verificationRate}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h3 className="font-medium text-[--color-text-primary]">
              Portfolio Items
            </h3>
          </div>
          <p className="text-2xl font-bold text-[--color-text-primary]">
            {stats.totalPortfolioItems}
          </p>
          <p className="text-sm text-[--color-text-secondary]">
            Supporting evidence and work samples
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-purple-600" />
            <h3 className="font-medium text-[--color-text-primary]">
              Avg. Endorsements per Skill
            </h3>
          </div>
          <p className="text-2xl font-bold text-[--color-text-primary]">
            {stats.totalSkills > 0
              ? Math.round((stats.totalEndorsements / stats.totalSkills) * 10) /
                10
              : 0}
          </p>
          <p className="text-sm text-[--color-text-secondary]">
            Community validation strength
          </p>
        </Card>
      </div>
    </div>
  );
}

interface VerificationDashboardProps {
  userId?: string;
  isAdmin?: boolean;
  className?: string;
}

export function VerificationDashboard({
  userId,
  isAdmin = false,
  className,
}: VerificationDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className={cn('w-full space-y-6', className)}>
      <div>
        <h1 className="text-2xl font-bold text-[--color-text-primary]">
          {isAdmin ? 'Verification Administration' : 'Skill Verification'}
        </h1>
        <p className="text-[--color-text-secondary] mt-1">
          {isAdmin
            ? 'Review and manage skill verification requests across the platform'
            : 'Track your skill verification progress and manage requests'}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pending">
            Pending
            {isAdmin && (
              <Badge variant="secondary" className="ml-1 text-xs">
                New
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="in-review">In Review</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="all">All Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <VerificationStats userId={userId} />

          {/* Recent Activity */}
          <div>
            <h2 className="text-lg font-medium text-[--color-text-primary] mb-4">
              Recent Verification Activity
            </h2>
            <VerificationRequestList
              userId={userId}
              limit={5}
              canReview={isAdmin}
            />
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <div>
            <h2 className="text-lg font-medium text-[--color-text-primary] mb-2">
              Pending Verification Requests
            </h2>
            <p className="text-sm text-[--color-text-secondary] mb-4">
              {isAdmin
                ? 'New requests awaiting initial review'
                : 'Your requests waiting for admin review'}
            </p>
          </div>
          <VerificationRequestList
            userId={userId}
            status={VerificationRequestStatus.PENDING}
            canReview={isAdmin}
          />
        </TabsContent>

        <TabsContent value="in-review" className="space-y-4">
          <div>
            <h2 className="text-lg font-medium text-[--color-text-primary] mb-2">
              In Review
            </h2>
            <p className="text-sm text-[--color-text-secondary] mb-4">
              {isAdmin
                ? 'Requests currently being reviewed by administrators'
                : 'Your requests currently under review'}
            </p>
          </div>
          <VerificationRequestList
            userId={userId}
            status={VerificationRequestStatus.IN_REVIEW}
            canReview={isAdmin}
          />
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div>
            <h2 className="text-lg font-medium text-[--color-text-primary] mb-2">
              Completed Requests
            </h2>
            <p className="text-sm text-[--color-text-secondary] mb-4">
              {isAdmin
                ? 'All completed verification requests with final decisions'
                : 'Your completed verification requests'}
            </p>
          </div>
          <VerificationRequestList
            userId={userId}
            status={VerificationRequestStatus.COMPLETED}
            canReview={false}
          />
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <div>
            <h2 className="text-lg font-medium text-[--color-text-primary] mb-2">
              All Verification Requests
            </h2>
            <p className="text-sm text-[--color-text-secondary] mb-4">
              {isAdmin
                ? 'Complete history of all verification requests on the platform'
                : 'Complete history of all your verification requests'}
            </p>
          </div>
          <VerificationRequestList
            userId={userId}
            canReview={isAdmin}
            limit={50}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
