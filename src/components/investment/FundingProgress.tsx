'use client';

import { Card, CardContent } from '~/components/ui/card';
import { Progress } from '~/components/ui/progress';
import { DollarSign, Users, Calendar, TrendingUp } from 'lucide-react';

interface FundingProgressProps {
  fundingGoal: number;
  currentFunding: number;
  backerCount: number;
  deadline: Date;
  className?: string;
}

export function FundingProgress({
  fundingGoal,
  currentFunding,
  backerCount,
  deadline,
  className,
}: FundingProgressProps) {
  const fundingPercentage = (currentFunding / fundingGoal) * 100;
  const daysRemaining = Math.max(
    0,
    Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );
  const isFullyFunded = currentFunding >= fundingGoal;
  const isAlmostFunded = fundingPercentage >= 75 && !isFullyFunded;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getProgressColor = () => {
    if (isFullyFunded) return 'bg-green-500';
    if (isAlmostFunded) return 'bg-yellow-500';
    if (fundingPercentage >= 50) return 'bg-blue-500';
    return 'bg-gray-400';
  };

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">
                {formatCurrency(currentFunding)} raised
              </span>
              <span className="text-muted-foreground">
                {fundingPercentage.toFixed(1)}%
              </span>
            </div>
            <Progress
              value={Math.min(100, fundingPercentage)}
              className="h-3"
              indicatorClassName={getProgressColor()}
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>of {formatCurrency(fundingGoal)} goal</span>
              {isFullyFunded && (
                <span className="text-green-600 font-medium">
                  Fully Funded! 🎉
                </span>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="text-sm">Backers</span>
              </div>
              <p className="text-2xl font-semibold">{backerCount}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Days Left</span>
              </div>
              <p className="text-2xl font-semibold">{daysRemaining}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm">Avg. Pledge</span>
              </div>
              <p className="text-2xl font-semibold">
                {backerCount > 0
                  ? formatCurrency(Math.round(currentFunding / backerCount))
                  : '$0'}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">Daily Rate</span>
              </div>
              <p className="text-2xl font-semibold">
                {daysRemaining > 0
                  ? formatCurrency(
                      Math.round((fundingGoal - currentFunding) / daysRemaining)
                    )
                  : '$0'}
              </p>
            </div>
          </div>

          {/* Status Messages */}
          {isAlmostFunded && !isFullyFunded && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Almost there!</strong> This project is{' '}
                {fundingPercentage.toFixed(0)}% funded and needs just{' '}
                {formatCurrency(fundingGoal - currentFunding)} more to reach its
                goal.
              </p>
            </div>
          )}

          {daysRemaining <= 3 && daysRemaining > 0 && !isFullyFunded && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">
                <strong>Ending soon!</strong> Only {daysRemaining} day
                {daysRemaining !== 1 ? 's' : ''} left to support this project.
              </p>
            </div>
          )}

          {daysRemaining === 0 && !isFullyFunded && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-sm text-gray-800">
                This funding campaign has ended.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
