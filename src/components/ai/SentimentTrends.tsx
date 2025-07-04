'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  MessageSquare,
  Users,
  Calendar,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '~/lib/utils';

interface SentimentTrendsProps {
  campaignId: string;
  className?: string;
}

interface SentimentDataPoint {
  date: Date;
  sentiment: number;
  count: number;
  type: 'campaign' | 'comment' | 'update';
}

export function SentimentTrends({
  campaignId: _campaignId,
  className,
}: SentimentTrendsProps) {
  const [timeRange, setTimeRange] = React.useState<'week' | 'month' | 'all'>(
    'week'
  );

  // This would need a new endpoint to fetch sentiment trends over time
  // For now, we'll mock the data structure
  const mockTrendData: SentimentDataPoint[] = [
    {
      date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      sentiment: 0.2,
      count: 5,
      type: 'comment',
    },
    {
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      sentiment: 0.4,
      count: 8,
      type: 'comment',
    },
    {
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      sentiment: 0.3,
      count: 3,
      type: 'comment',
    },
    {
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      sentiment: 0.6,
      count: 12,
      type: 'comment',
    },
    {
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      sentiment: 0.5,
      count: 7,
      type: 'comment',
    },
    {
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      sentiment: 0.7,
      count: 15,
      type: 'comment',
    },
    {
      date: new Date(),
      sentiment: 0.8,
      count: 10,
      type: 'comment',
    },
  ];

  const calculateAverageSentiment = (data: SentimentDataPoint[]) => {
    if (data.length === 0) return 0;
    const totalSentiment = data.reduce(
      (sum, point) => sum + point.sentiment * point.count,
      0
    );
    const totalCount = data.reduce((sum, point) => sum + point.count, 0);
    return totalCount > 0 ? totalSentiment / totalCount : 0;
  };

  const getTimeRangeData = (data: SentimentDataPoint[]) => {
    const now = new Date();
    const cutoffDate = new Date();

    switch (timeRange) {
      case 'week':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case 'all':
        return data;
    }

    return data.filter((point) => point.date >= cutoffDate);
  };

  const trendData = getTimeRangeData(mockTrendData);
  const averageSentiment = calculateAverageSentiment(trendData);
  const latestSentiment = trendData[trendData.length - 1]?.sentiment || 0;
  const previousSentiment = trendData[trendData.length - 2]?.sentiment || 0;
  const sentimentChange = latestSentiment - previousSentiment;

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.3) return 'text-green-600';
    if (sentiment < -0.3) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getSentimentBgColor = (sentiment: number) => {
    if (sentiment > 0.3) return 'bg-green-100';
    if (sentiment < -0.3) return 'bg-red-100';
    return 'bg-yellow-100';
  };

  const maxSentiment = Math.max(...trendData.map((d) => d.sentiment));
  const minSentiment = Math.min(...trendData.map((d) => d.sentiment));
  const sentimentRange = maxSentiment - minSentiment || 1;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Sentiment Trends
            </CardTitle>
            <CardDescription>
              Track emotional response over time
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {sentimentChange > 0 ? (
              <Badge variant="default" className="gap-1">
                <TrendingUp className="h-3 w-3" />+
                {(sentimentChange * 100).toFixed(0)}%
              </Badge>
            ) : sentimentChange < 0 ? (
              <Badge variant="destructive" className="gap-1">
                <TrendingDown className="h-3 w-3" />
                {(sentimentChange * 100).toFixed(0)}%
              </Badge>
            ) : (
              <Badge variant="secondary">Stable</Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs
          value={timeRange}
          onValueChange={(v) => setTimeRange(v as 'week' | 'month' | 'all')}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="all">All Time</TabsTrigger>
          </TabsList>

          <TabsContent value={timeRange} className="space-y-4 mt-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Average Sentiment
                </p>
                <p
                  className={cn(
                    'text-2xl font-bold',
                    getSentimentColor(averageSentiment)
                  )}
                >
                  {averageSentiment > 0 ? '+' : ''}
                  {(averageSentiment * 100).toFixed(0)}%
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Total Interactions
                </p>
                <p className="text-2xl font-bold">
                  {trendData.reduce((sum, d) => sum + d.count, 0)}
                </p>
              </div>
            </div>

            {/* Trend Visualization */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Daily Sentiment</h4>
              <div className="relative h-32">
                <div className="absolute inset-0 flex items-end gap-1">
                  {trendData.map((point, index) => {
                    const height =
                      ((point.sentiment - minSentiment) / sentimentRange) * 100;
                    return (
                      <div
                        key={index}
                        className="flex-1 relative group cursor-pointer"
                      >
                        <div
                          className={cn(
                            'absolute bottom-0 left-0 right-0 rounded-t transition-all',
                            getSentimentBgColor(point.sentiment),
                            'group-hover:opacity-80'
                          )}
                          style={{ height: `${height}%` }}
                        />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <div className="bg-popover text-popover-foreground text-xs rounded px-2 py-1 shadow-lg whitespace-nowrap">
                            <p className="font-medium">
                              {formatDistanceToNow(point.date, {
                                addSuffix: true,
                              })}
                            </p>
                            <p>
                              Sentiment: {(point.sentiment * 100).toFixed(0)}%
                            </p>
                            <p>{point.count} interactions</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-muted-foreground">
                  <span>+100%</span>
                  <span>0%</span>
                  <span>-100%</span>
                </div>
              </div>
            </div>

            {/* Interaction Breakdown */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Interaction Types</h4>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {trendData.filter((d) => d.type === 'comment').length}{' '}
                    Comments
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {trendData.reduce((sum, d) => sum + d.count, 0)} Total
                  </span>
                </div>
              </div>
            </div>

            {/* Time Range Info */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
              <Calendar className="h-3 w-3" />
              <span>
                {timeRange === 'week' && 'Last 7 days'}
                {timeRange === 'month' && 'Last 30 days'}
                {timeRange === 'all' && 'All time data'}
              </span>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
