'use client';

import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Progress } from '~/components/ui/progress';
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  DollarSign,
  Calendar,
  FileCheck,
} from 'lucide-react';
import type { MilestoneStatus } from '@prisma/client';

interface Milestone {
  id: string;
  title: string;
  description: string;
  fundingAmount: number;
  targetDate: Date;
  status: MilestoneStatus;
  orderIndex: number;
  completedAt?: Date | null;
  releasedAmount?: number;
}

interface MilestoneTrackerProps {
  milestones: Milestone[];
  totalFunding: number;
  isProjectCreator?: boolean;
  onMilestoneClick?: (milestone: Milestone) => void;
}

export function MilestoneTracker({
  milestones,
  totalFunding,
  isProjectCreator = false,
  onMilestoneClick,
}: MilestoneTrackerProps) {
  const sortedMilestones = [...milestones].sort(
    (a, b) => a.orderIndex - b.orderIndex
  );

  const totalMilestoneAmount = milestones.reduce(
    (sum, m) => sum + m.fundingAmount,
    0
  );
  const totalReleasedAmount = milestones.reduce(
    (sum, m) => sum + (m.releasedAmount || 0),
    0
  );
  const releaseProgress = (totalReleasedAmount / totalMilestoneAmount) * 100;

  const getStatusIcon = (status: MilestoneStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'VERIFIED':
        return <FileCheck className="h-5 w-5 text-blue-500" />;
      case 'SUBMITTED':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'DISPUTED':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: MilestoneStatus) => {
    const variants: Record<
      MilestoneStatus,
      'default' | 'secondary' | 'destructive'
    > = {
      PENDING: 'secondary',
      SUBMITTED: 'default',
      VERIFIED: 'default',
      COMPLETED: 'default',
      DISPUTED: 'destructive',
    };

    const labels: Record<MilestoneStatus, string> = {
      PENDING: 'Pending',
      SUBMITTED: 'Under Review',
      VERIFIED: 'Verified',
      COMPLETED: 'Completed',
      DISPUTED: 'Disputed',
    };

    return (
      <Badge variant={variants[status]} className="text-xs">
        {labels[status]}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date));
  };

  const isOverdue = (milestone: Milestone) => {
    return (
      milestone.status === 'PENDING' &&
      new Date(milestone.targetDate) < new Date()
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Project Milestones</CardTitle>
          {totalFunding > 0 && (
            <span className="text-sm text-muted-foreground">
              {formatCurrency(totalReleasedAmount)} of{' '}
              {formatCurrency(totalMilestoneAmount)} released
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        {totalMilestoneAmount > 0 && (
          <div className="space-y-2">
            <Progress
              value={releaseProgress}
              className="h-2"
              indicatorClassName="bg-green-500"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{releaseProgress.toFixed(0)}% Funds Released</span>
              <span>
                {
                  sortedMilestones.filter((m) => m.status === 'COMPLETED')
                    .length
                }{' '}
                of {sortedMilestones.length} milestones completed
              </span>
            </div>
          </div>
        )}

        {/* Milestone List */}
        <div className="space-y-4">
          {sortedMilestones.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No milestones have been created for this project yet.
            </p>
          ) : (
            sortedMilestones.map((milestone, index) => (
              <div
                key={milestone.id}
                className={`relative flex gap-4 ${
                  onMilestoneClick ? 'cursor-pointer hover:bg-gray-50' : ''
                } p-4 rounded-lg border ${
                  isOverdue(milestone) ? 'border-red-200' : 'border-gray-200'
                }`}
                onClick={() => onMilestoneClick?.(milestone)}
              >
                {/* Timeline Connector */}
                {index < sortedMilestones.length - 1 && (
                  <div className="absolute left-7 top-12 w-0.5 h-full bg-gray-200" />
                )}

                {/* Status Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {getStatusIcon(milestone.status)}
                </div>

                {/* Content */}
                <div className="flex-grow space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-medium">{milestone.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {milestone.description}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusBadge(milestone.status)}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      <span>{formatCurrency(milestone.fundingAmount)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {milestone.status === 'COMPLETED' &&
                        milestone.completedAt
                          ? `Completed ${formatDate(milestone.completedAt)}`
                          : `Target: ${formatDate(milestone.targetDate)}`}
                      </span>
                    </div>
                    {milestone.releasedAmount &&
                      milestone.releasedAmount > 0 && (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>
                            {formatCurrency(milestone.releasedAmount)} released
                          </span>
                        </div>
                      )}
                  </div>

                  {/* Overdue Warning */}
                  {isOverdue(milestone) && (
                    <div className="bg-red-50 border border-red-200 rounded p-2 mt-2">
                      <p className="text-xs text-red-700 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        This milestone is overdue
                      </p>
                    </div>
                  )}

                  {/* Creator Actions */}
                  {isProjectCreator &&
                    milestone.status === 'PENDING' &&
                    !isOverdue(milestone) && (
                      <div className="mt-2">
                        <button className="text-sm text-primary hover:underline">
                          Submit for verification →
                        </button>
                      </div>
                    )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
