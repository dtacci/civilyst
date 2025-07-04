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
import { Progress } from '~/components/ui/progress';
import { Skeleton } from '~/components/ui/skeleton';
import { Alert, AlertDescription } from '~/components/ui/alert';
import {
  Eye,
  Ear,
  Type,
  Image,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  Lightbulb,
} from 'lucide-react';
import { useToast } from '~/hooks/use-toast';
import { cn } from '~/lib/utils';

interface AccessibilityDashboardProps {
  campaignId: string;
  campaignTitle?: string;
  className?: string;
}

interface AccessibilityFeature {
  icon: React.ReactNode;
  title: string;
  description: string;
  score: number;
  status: 'good' | 'warning' | 'needs-attention';
}

export function AccessibilityDashboard({
  campaignId,
  campaignTitle,
  className,
}: AccessibilityDashboardProps) {
  const { toast } = useToast();

  // Query accessibility enhancements
  const {
    data: enhancements,
    isLoading: isLoadingEnhancements,
    refetch: refetchEnhancements,
  } = api.ai.getAccessibilityEnhancements.useQuery({
    contentId: campaignId,
    contentType: 'campaign',
  });

  // Mutation to calculate accessibility score
  const calculateScore = api.ai.calculateAccessibilityScore.useMutation({
    onSuccess: () => {
      toast({
        title: 'Accessibility analysis complete',
        description: 'Your campaign has been analyzed for accessibility.',
      });
      refetchEnhancements();
    },
    onError: (error) => {
      toast({
        title: 'Analysis failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation to generate audio description for images
  const generateAudioDescription = api.ai.generateAudioDescription.useMutation({
    onSuccess: () => {
      toast({
        title: 'Audio description generated',
        description: 'Audio description has been created for the media.',
      });
      refetchEnhancements();
    },
    onError: (error) => {
      toast({
        title: 'Audio description failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleCalculateScore = () => {
    calculateScore.mutate({ campaignId });
  };

  const handleGenerateAudioDescription = (
    mediaUrl: string,
    mediaType: 'image' | 'video'
  ) => {
    generateAudioDescription.mutate({
      contentId: campaignId,
      mediaUrl,
      mediaType,
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLevel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Needs Improvement';
    return 'Poor';
  };

  // Mock accessibility data for demonstration
  const accessibilityScore = enhancements && enhancements.length > 0 ? 85 : 0;
  const suggestions = enhancements && enhancements.length > 0 ? [
    'Add alt text for all images',
    'Provide audio descriptions for videos',
    'Include transcriptions for audio content'
  ] : [];

  // Mock accessibility features for demonstration
  const accessibilityFeatures: AccessibilityFeature[] = [
    {
      icon: <Type className="h-5 w-5" />,
      title: 'Text Readability',
      description: 'Reading level and clarity',
      score: Math.min(100, accessibilityScore + 10),
      status:
        accessibilityScore >= 70
          ? 'good'
          : accessibilityScore >= 50
            ? 'warning'
            : 'needs-attention',
    },
    {
      icon: <Eye className="h-5 w-5" />,
      title: 'Visual Accessibility',
      description: 'Color contrast and visual elements',
      score: Math.min(100, accessibilityScore - 5),
      status:
        accessibilityScore >= 75
          ? 'good'
          : accessibilityScore >= 55
            ? 'warning'
            : 'needs-attention',
    },
    {
      icon: <Ear className="h-5 w-5" />,
      title: 'Audio Descriptions',
      description: 'Media accessibility for hearing impaired',
      score: enhancements?.filter(
        (e) => e.audioDescription
      ).length
        ? 85
        : 30,
      status: enhancements?.filter(
        (e) => e.audioDescription
      ).length
        ? 'good'
        : 'needs-attention',
    },
    {
      icon: <Image className="h-5 w-5" />,
      title: 'Alt Text Coverage',
      description: 'Image alternative text availability',
      score: enhancements?.filter((e) => e.altText).length
        ? 90
        : 25,
      status: enhancements?.filter((e) => e.altText)
        .length
        ? 'good'
        : 'needs-attention',
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'needs-attention':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (isLoadingEnhancements) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
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
              <Users className="h-5 w-5" />
              Accessibility Dashboard
            </CardTitle>
            <CardDescription>
              Make your campaign accessible to all community members
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCalculateScore}
            disabled={calculateScore.isPending}
          >
            {calculateScore.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 mr-2" />
                {latestEnhancement ? 'Re-analyze' : 'Analyze'}
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Accessibility Score */}
        {latestEnhancement ? (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <span className="text-3xl font-bold">{accessibilityScore}</span>
                <span className="text-sm text-muted-foreground">/100</span>
              </div>
              <div
                className={cn(
                  'text-lg font-medium',
                  getScoreColor(accessibilityScore)
                )}
              >
                {getScoreLevel(accessibilityScore)}
              </div>
              <Progress value={accessibilityScore} className="h-3" />
            </div>
            {campaignTitle && (
              <div className="text-center">
                <Badge variant="outline" className="text-xs">
                  {campaignTitle}
                </Badge>
              </div>
            )}
          </div>
        ) : (
          <Alert>
            <AlertDescription>
              No accessibility analysis available yet. Click &quot;Analyze&quot;
              to get started.
            </AlertDescription>
          </Alert>
        )}

        {/* Accessibility Features */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Accessibility Features</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accessibilityFeatures.map((feature, index) => (
              <div key={index} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {feature.icon}
                    <span className="text-sm font-medium">{feature.title}</span>
                  </div>
                  {getStatusIcon(feature.status)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {feature.description}
                </p>
                <div className="flex items-center gap-2">
                  <Progress value={feature.score} className="flex-1 h-2" />
                  <span
                    className={cn(
                      'text-xs font-medium',
                      getScoreColor(feature.score)
                    )}
                  >
                    {feature.score}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Accessibility Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Improvement Suggestions
            </h4>
            <div className="space-y-2">
              {suggestions.map((suggestion: string, index: number) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-3 bg-muted rounded-lg"
                >
                  <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Quick Actions</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleGenerateAudioDescription('placeholder-url', 'image')
              }
              disabled={generateAudioDescription.isPending}
              className="justify-start"
            >
              <Ear className="h-4 w-4 mr-2" />
              Generate Audio Descriptions
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toast({
                  title: 'Coming soon',
                  description: 'Alt text generation will be available soon.',
                });
              }}
              className="justify-start"
            >
              <Image className="h-4 w-4 mr-2" />
              Add Alt Text to Images
            </Button>
          </div>
        </div>

        {/* Stats */}
        {enhancements && enhancements.length > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Total enhancements: {enhancements.length}</span>
              <span>AI-powered accessibility</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
