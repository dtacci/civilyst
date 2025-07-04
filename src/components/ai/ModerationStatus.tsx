'use client';

import React from 'react';
import { api } from '~/lib/trpc';
import { Badge } from '~/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
  Loader2,
} from 'lucide-react';
import { cn } from '~/lib/utils';

interface ModerationStatusProps {
  contentId: string;
  contentType: 'campaign' | 'comment' | 'update';
  content: string;
  onModerationComplete?: (
    status: 'approved' | 'rejected' | 'manual_review'
  ) => void;
}

export function ModerationStatus({
  contentId,
  contentType,
  content,
  onModerationComplete,
}: ModerationStatusProps) {
  const moderateContent = api.ai.moderateContent.useMutation({
    onSuccess: (data) => {
      if (onModerationComplete) {
        onModerationComplete(
          data.moderationStatus as 'approved' | 'rejected' | 'manual_review'
        );
      }
    },
  });

  React.useEffect(() => {
    if (content && contentId) {
      moderateContent.mutate({ contentId, contentType, content });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentId, contentType, content]);

  if (moderateContent.isPending) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Checking content...</span>
      </div>
    );
  }

  if (moderateContent.error) {
    return null; // Fail silently for moderation errors
  }

  const moderation = moderateContent.data;
  if (!moderation) return null;

  const getStatusIcon = () => {
    switch (moderation.moderationStatus) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'manual_review':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getStatusColor = () => {
    switch (moderation.moderationStatus) {
      case 'approved':
        return 'text-green-600';
      case 'rejected':
        return 'text-red-600';
      case 'manual_review':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusBadgeVariant = () => {
    switch (moderation.moderationStatus) {
      case 'approved':
        return 'default' as const;
      case 'rejected':
        return 'destructive' as const;
      case 'manual_review':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className={cn('flex items-center gap-2', getStatusColor())}>
          {getStatusIcon()}
          <span className="text-sm font-medium">Content Moderation</span>
        </div>
        <Badge variant={getStatusBadgeVariant()}>
          {moderation.moderationStatus
            .replace('_', ' ')
            .replace(/\b\w/g, (l: string) => l.toUpperCase())}
        </Badge>
      </div>

      {moderation.moderationStatus === 'rejected' &&
        moderation.flaggedIssues.length > 0 && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Content Rejected</AlertTitle>
            <AlertDescription>
              <p className="mb-2">The following issues were detected:</p>
              <ul className="list-disc list-inside space-y-1">
                {moderation.flaggedIssues.map(
                  (issue: string, index: number) => (
                    <li key={index} className="text-sm">
                      {issue
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </li>
                  )
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}

      {moderation.moderationStatus === 'manual_review' && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Manual Review Required</AlertTitle>
          <AlertDescription>
            This content has been flagged for manual review. A moderator will
            review it shortly.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-4 text-sm text-muted-foreground">
        <div>Safety Score: {Math.round(moderation.safetyScore * 100)}%</div>
        <div>Quality Score: {Math.round(moderation.qualityScore * 100)}%</div>
      </div>
    </div>
  );
}
