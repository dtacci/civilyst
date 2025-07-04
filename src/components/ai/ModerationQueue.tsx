'use client';

import React, { useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { ScrollArea } from '~/components/ui/scroll-area';
import { Skeleton } from '~/components/ui/skeleton';
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { Alert, AlertDescription } from '~/components/ui/alert';
import { useToast } from '~/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface ModerationQueueProps {
  limit?: number;
}

interface ModerationItem {
  id: string;
  contentId: string;
  contentType: string;
  safetyScore: number;
  qualityScore: number;
  flaggedIssues: string[];
  moderationStatus: string;
  createdAt: Date;
  content?: {
    title?: string;
    description?: string;
    author?: string;
  };
}

export function ModerationQueue({ limit = 20 }: ModerationQueueProps) {
  const { toast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState<
    'manual_review' | 'rejected' | 'all'
  >('manual_review');

  // This would need a new tRPC endpoint to fetch moderation items
  // For now, we'll show the UI structure
  const {
    data: moderationItems,
    isLoading,
    error,
    refetch,
  } = api.ai.getModerationQueue?.useQuery?.(
    { status: selectedStatus, limit },
    {
      enabled: true,
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  ) ?? { data: null, isLoading: false, error: null, refetch: () => {} };

  const updateModerationStatus = api.ai.updateModerationStatus?.useMutation?.({
    onSuccess: () => {
      toast({
        title: 'Status updated',
        description: 'The moderation status has been updated successfully.',
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Failed to update status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleApprove = async (id: string) => {
    await updateModerationStatus?.mutateAsync?.({ id, status: 'approved' });
  };

  const handleReject = async (id: string) => {
    await updateModerationStatus?.mutateAsync?.({ id, status: 'rejected' });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'manual_review':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getContentTypeColor = (type: string) => {
    switch (type) {
      case 'campaign':
        return 'bg-blue-100 text-blue-800';
      case 'comment':
        return 'bg-green-100 text-green-800';
      case 'update':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load moderation queue. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  // Mock data for UI demonstration
  const mockItems: ModerationItem[] = (moderationItems as any)?.items || [
    {
      id: '1',
      contentId: 'campaign-1',
      contentType: 'campaign',
      safetyScore: 0.6,
      qualityScore: 0.5,
      flaggedIssues: ['potentially_misleading'],
      moderationStatus: 'manual_review',
      createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      content: {
        title: 'Community Garden Project',
        description: 'Help us build a sustainable community garden...',
        author: 'John Doe',
      },
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Moderation Queue</CardTitle>
        <CardDescription>Review and moderate flagged content</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          value={selectedStatus}
          onValueChange={(value) =>
            setSelectedStatus(value as 'manual_review' | 'rejected' | 'all')
          }
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="manual_review">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Review (
              {
                mockItems.filter(
                  (item) => item.moderationStatus === 'manual_review'
                ).length
              }
              )
            </TabsTrigger>
            <TabsTrigger value="rejected">
              <XCircle className="h-4 w-4 mr-2" />
              Rejected
            </TabsTrigger>
            <TabsTrigger value="all">All Items</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedStatus} className="mt-4">
            <ScrollArea className="h-[600px]">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="border rounded-lg p-4">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  ))}
                </div>
              ) : mockItems.length > 0 ? (
                <div className="space-y-4">
                  {mockItems.map((item) => (
                    <div
                      key={item.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(item.moderationStatus)}
                            <Badge
                              className={getContentTypeColor(item.contentType)}
                            >
                              {item.contentType}
                            </Badge>
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(item.createdAt, {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                          {item.content && (
                            <div>
                              <h4 className="font-medium">
                                {item.content.title}
                              </h4>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {item.content.description}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                By: {item.content.author}
                              </p>
                            </div>
                          )}
                        </div>
                        {item.moderationStatus === 'manual_review' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApprove(item.id)}
                              disabled={updateModerationStatus?.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(item.id)}
                              disabled={updateModerationStatus?.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Safety:</span>
                          <span
                            className={
                              item.safetyScore < 0.5 ? 'text-red-600' : ''
                            }
                          >
                            {Math.round(item.safetyScore * 100)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">
                            Quality:
                          </span>
                          <span
                            className={
                              item.qualityScore < 0.6 ? 'text-yellow-600' : ''
                            }
                          >
                            {Math.round(item.qualityScore * 100)}%
                          </span>
                        </div>
                      </div>

                      {item.flaggedIssues.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.flaggedIssues.map((issue, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {issue.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No items to moderate</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
