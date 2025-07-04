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
import { Skeleton } from '~/components/ui/skeleton';
import {
  AlertCircle,
  Lightbulb,
  MapPin,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { Alert, AlertDescription } from '~/components/ui/alert';
import { useToast } from '~/hooks/use-toast';

interface ContentSuggestionsProps {
  campaignId: string;
  onApplySuggestion?: (suggestion: string) => void;
}

export function ContentSuggestions({
  campaignId,
  onApplySuggestion,
}: ContentSuggestionsProps) {
  const { toast } = useToast();
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(
    new Set()
  );

  const {
    data: suggestions,
    isLoading,
    error,
  } = api.ai.getSuggestions.useQuery(
    { campaignId },
    {
      enabled: !!campaignId,
      refetchOnWindowFocus: false,
    }
  );

  const generateSuggestion = api.ai.generateSuggestion.useMutation({
    onSuccess: () => {
      toast({
        title: 'New suggestion generated',
        description:
          'A new content suggestion has been created for your campaign.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to generate suggestion',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const applySuggestionMutation = api.ai.applySuggestion.useMutation({
    onSuccess: (data) => {
      setAppliedSuggestions((prev) => new Set([...prev, data.id]));
      toast({
        title: 'Suggestion applied',
        description:
          'The suggestion has been marked as applied to your campaign.',
      });
    },
  });

  const handleGenerateSuggestion = async (
    type: 'location-based' | 'interest-based' | 'trending'
  ) => {
    await generateSuggestion.mutateAsync({
      campaignId,
      suggestionType: type,
    });
  };

  const handleApplySuggestion = async (
    suggestionId: string,
    content: string
  ) => {
    if (onApplySuggestion) {
      onApplySuggestion(content);
    }
    await applySuggestionMutation.mutateAsync({ suggestionId });
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'location-based':
        return <MapPin className="h-4 w-4" />;
      case 'interest-based':
        return <Lightbulb className="h-4 w-4" />;
      case 'trending':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const getSuggestionTypeLabel = (type: string) => {
    switch (type) {
      case 'location-based':
        return 'Location-Based';
      case 'interest-based':
        return 'Interest-Based';
      case 'trending':
        return 'Trending';
      default:
        return 'General';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load content suggestions. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Content Suggestions
        </CardTitle>
        <CardDescription>
          Get AI-powered suggestions to improve your campaign content
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleGenerateSuggestion('location-based')}
            disabled={generateSuggestion.isPending}
          >
            <MapPin className="h-4 w-4 mr-2" />
            Location-Based
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleGenerateSuggestion('interest-based')}
            disabled={generateSuggestion.isPending}
          >
            <Lightbulb className="h-4 w-4 mr-2" />
            Interest-Based
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleGenerateSuggestion('trending')}
            disabled={generateSuggestion.isPending}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Trending Topics
          </Button>
        </div>

        {suggestions && suggestions.length > 0 ? (
          <div className="space-y-3">
            {suggestions.map((suggestion: any) => (
              <div
                key={suggestion.id}
                className="p-4 border rounded-lg space-y-3 bg-muted/50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getSuggestionIcon(suggestion.suggestionType)}
                    <Badge variant="secondary">
                      {getSuggestionTypeLabel(suggestion.suggestionType)}
                    </Badge>
                    <Badge variant="outline">
                      {Math.round(suggestion.confidence * 100)}% confidence
                    </Badge>
                  </div>
                  {suggestion.isApplied ||
                  appliedSuggestions.has(suggestion.id) ? (
                    <Badge variant="default">Applied</Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        handleApplySuggestion(suggestion.id, suggestion.content)
                      }
                      disabled={applySuggestionMutation.isPending}
                    >
                      Apply
                    </Button>
                  )}
                </div>
                <p className="text-sm">{suggestion.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-8 w-8 mx-auto mb-4 opacity-50" />
            <p className="text-sm">
              No suggestions yet. Click a button above to generate suggestions.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
