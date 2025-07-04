'use client';

import React from 'react';
import { api } from '~/lib/trpc';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Progress } from '~/components/ui/progress';
import { Badge } from '~/components/ui/badge';
import { Skeleton } from '~/components/ui/skeleton';
import { Alert, AlertDescription } from '~/components/ui/alert';
import {
  Heart,
  Frown,
  Meh,
  Smile,
  TrendingUp,
  TrendingDown,
  Minus,
  Hash,
  BarChart3,
} from 'lucide-react';
import { cn } from '~/lib/utils';

interface SentimentAnalysisProps {
  contentId: string;
  contentType: 'campaign' | 'comment' | 'update';
  content: string;
  showEmotions?: boolean;
  showKeywords?: boolean;
  autoAnalyze?: boolean;
  className?: string;
}

interface Emotion {
  name: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}

export function SentimentAnalysis({
  contentId,
  contentType,
  content,
  showEmotions = true,
  showKeywords = true,
  autoAnalyze = false,
  className,
}: SentimentAnalysisProps) {
  // Query existing sentiment analysis
  const {
    data: sentimentData,
    isLoading,
    refetch,
  } = api.ai.getSentimentAnalysis.useQuery({
    contentId,
    contentType,
  });

  // Mutation to analyze sentiment
  const analyzeSentiment = api.ai.analyzeSentiment.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  React.useEffect(() => {
    if (autoAnalyze && !sentimentData && !isLoading && content) {
      analyzeSentiment.mutate({ contentId, contentType, content });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAnalyze, sentimentData, isLoading, content, contentId, contentType]);

  const getSentimentIcon = (sentiment: number) => {
    if (sentiment > 0.3) return <Smile className="h-5 w-5 text-green-600" />;
    if (sentiment < -0.3) return <Frown className="h-5 w-5 text-red-600" />;
    return <Meh className="h-5 w-5 text-yellow-600" />;
  };

  const getSentimentLabel = (sentiment: number) => {
    if (sentiment > 0.6) return 'Very Positive';
    if (sentiment > 0.3) return 'Positive';
    if (sentiment > -0.3) return 'Neutral';
    if (sentiment > -0.6) return 'Negative';
    return 'Very Negative';
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.3) return 'text-green-600';
    if (sentiment < -0.3) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getTrendIcon = (sentiment: number) => {
    if (sentiment > 0.1) return <TrendingUp className="h-4 w-4" />;
    if (sentiment < -0.1) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getEmotions = (emotions: unknown): Emotion[] => {
    if (!emotions || typeof emotions !== 'object') return [];

    const emotionMap: Record<string, { color: string; icon: React.ReactNode }> =
      {
        joy: { color: 'bg-yellow-500', icon: <Smile className="h-4 w-4" /> },
        anger: { color: 'bg-red-500', icon: <Frown className="h-4 w-4" /> },
        sadness: { color: 'bg-blue-500', icon: <Frown className="h-4 w-4" /> },
        fear: { color: 'bg-purple-500', icon: <Meh className="h-4 w-4" /> },
        surprise: { color: 'bg-pink-500', icon: <Smile className="h-4 w-4" /> },
        disgust: { color: 'bg-green-500', icon: <Frown className="h-4 w-4" /> },
      };

    return Object.entries(emotions)
      .filter(([_, value]) => typeof value === 'number' && value > 0)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value: value as number,
        color: emotionMap[name]?.color || 'bg-gray-500',
        icon: emotionMap[name]?.icon || <Heart className="h-4 w-4" />,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4); // Show top 4 emotions
  };

  if (isLoading || analyzeSentiment.isPending) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!sentimentData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Sentiment Analysis
          </CardTitle>
          <CardDescription>
            Analyze the emotional tone and keywords
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              No sentiment analysis available for this content.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const emotions = getEmotions(sentimentData.emotions);
  const sentimentScore = sentimentData.sentiment;
  const sentimentPercentage = Math.round((sentimentScore + 1) * 50); // Convert -1 to 1 scale to 0-100

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Sentiment Analysis
        </CardTitle>
        <CardDescription>
          Emotional tone and key themes in the content
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Sentiment */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getSentimentIcon(sentimentScore)}
              <span
                className={cn('font-medium', getSentimentColor(sentimentScore))}
              >
                {getSentimentLabel(sentimentScore)}
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              {getTrendIcon(sentimentScore)}
              <span>
                {sentimentScore > 0 ? '+' : ''}
                {(sentimentScore * 100).toFixed(0)}%
              </span>
            </div>
          </div>
          <Progress value={sentimentPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Sentiment score: {sentimentScore.toFixed(2)} (-1 to +1 scale)
          </p>
        </div>

        {/* Emotions Breakdown */}
        {showEmotions && emotions.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Emotional Breakdown</h4>
            <div className="space-y-2">
              {emotions.map((emotion) => (
                <div key={emotion.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {emotion.icon}
                      <span>{emotion.name}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {Math.round(emotion.value * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-1.5">
                    <div
                      className={cn(
                        'h-1.5 rounded-full transition-all',
                        emotion.color
                      )}
                      style={{ width: `${emotion.value * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Keywords */}
        {showKeywords && sentimentData.keywords.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Key Themes
            </h4>
            <div className="flex flex-wrap gap-2">
              {sentimentData.keywords.map((keyword, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Content Type Badge */}
        <div className="flex items-center justify-between pt-2">
          <Badge variant="outline" className="text-xs">
            {contentType.charAt(0).toUpperCase() + contentType.slice(1)}{' '}
            Analysis
          </Badge>
          <span className="text-xs text-muted-foreground">
            AI-powered analysis
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
