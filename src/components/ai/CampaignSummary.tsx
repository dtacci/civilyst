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
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Skeleton } from '~/components/ui/skeleton';
import { Alert, AlertDescription } from '~/components/ui/alert';
import {
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  FileText,
  Calendar,
} from 'lucide-react';
import { toast } from '~/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface CampaignSummaryProps {
  campaignId: string;
  campaignTitle?: string;
  includeComments?: boolean;
  includeVotes?: boolean;
  onSummaryGenerated?: () => void;
  className?: string;
}

export function CampaignSummary({
  campaignId,
  campaignTitle,
  includeComments = true,
  includeVotes = true,
  onSummaryGenerated,
  className,
}: CampaignSummaryProps) {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  // Query existing summary
  const {
    data: summary,
    isLoading: isLoadingSummary,
    refetch: refetchSummary,
  } = api.ai.getSummary.useQuery({ campaignId });

  // Mutation to generate summary
  const generateSummary = api.ai.generateSummary.useMutation({
    onSuccess: () => {
      toast({
        title: 'Summary generated',
        description: 'AI has successfully created a summary for this campaign.',
      });
      refetchSummary();
      onSummaryGenerated?.();
    },
    onError: (error) => {
      toast({
        title: 'Failed to generate summary',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleGenerateSummary = () => {
    generateSummary.mutate({ campaignId, includeComments, includeVotes });
  };

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast({
        title: 'Copied to clipboard',
        description: `${field} has been copied.`,
      });
      setTimeout(() => setCopiedField(null), 2000);
    } catch (_error) {
      toast({
        title: 'Failed to copy',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (isLoadingSummary) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Campaign Summary
            </CardTitle>
            <CardDescription>
              {summary
                ? `Last updated ${formatDistanceToNow(new Date(summary.lastGenerated), { addSuffix: true })}`
                : 'AI-powered summary of campaign content'}
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant={summary ? 'outline' : 'default'}
            onClick={handleGenerateSummary}
            disabled={generateSummary.isPending}
          >
            {generateSummary.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                {summary ? (
                  <RefreshCw className="h-4 w-4 mr-2" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                {summary ? 'Regenerate' : 'Generate Summary'}
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {!summary && !generateSummary.isPending ? (
          <Alert>
            <AlertDescription>
              No summary has been generated yet. Click the button above to
              create an AI-powered summary of this campaign.
            </AlertDescription>
          </Alert>
        ) : summary ? (
          <div className="space-y-6">
            {/* Short Summary */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Brief Summary
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    handleCopy(summary.shortSummary, 'Brief summary')
                  }
                >
                  {copiedField === 'Brief summary' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm leading-relaxed">{summary.shortSummary}</p>
            </div>

            {/* Full Summary */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Detailed Summary
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    handleCopy(summary.fullSummary, 'Detailed summary')
                  }
                >
                  {copiedField === 'Detailed summary' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {summary.fullSummary}
              </p>
            </div>

            {/* Key Points */}
            {summary.keyPoints.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Key Points
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleCopy(summary.keyPoints.join('\n• '), 'Key points')
                    }
                  >
                    {copiedField === 'Key points' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <ul className="space-y-1">
                  {summary.keyPoints.map((point, index) => (
                    <li
                      key={index}
                      className="text-sm text-muted-foreground flex items-start"
                    >
                      <span className="mr-2">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Summary Metadata */}
            <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Generated{' '}
                {formatDistanceToNow(new Date(summary.lastGenerated), {
                  addSuffix: true,
                })}
              </div>
              {campaignTitle && (
                <Badge variant="outline" className="text-xs">
                  {campaignTitle}
                </Badge>
              )}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
