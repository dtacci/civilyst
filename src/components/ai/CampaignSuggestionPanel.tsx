'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { Badge } from '~/components/ui/badge';
import { Sparkles, MapPin, Users, TrendingUp, RefreshCw } from 'lucide-react';
import { ContentSuggestions } from './ContentSuggestions';
import { ModerationStatus } from './ModerationStatus';

interface CampaignSuggestionPanelProps {
  campaignId?: string;
  title: string;
  description: string;
  location?: string;
  onApplySuggestion?: (field: 'title' | 'description', value: string) => void;
  showModeration?: boolean;
}

export function CampaignSuggestionPanel({
  campaignId,
  title,
  description,
  location,
  onApplySuggestion,
  showModeration = true,
}: CampaignSuggestionPanelProps) {
  const [activeTab, setActiveTab] = React.useState('suggestions');

  // Example suggestions based on content analysis
  const getQuickSuggestions = () => {
    const suggestions = [];

    // Title suggestions
    if (title.length < 20) {
      suggestions.push({
        field: 'title' as const,
        type: 'improvement',
        message: 'Consider a more descriptive title',
        example: `${title} - ${location ? `A ${location} Initiative` : 'Community Project'}`,
      });
    }

    // Description suggestions
    if (description.length < 100) {
      suggestions.push({
        field: 'description' as const,
        type: 'expansion',
        message: 'Add more details to help people understand your campaign',
        example:
          'Include specific goals, timeline, and how the community will benefit.',
      });
    }

    if (
      !description.toLowerCase().includes('goal') &&
      !description.toLowerCase().includes('objective')
    ) {
      suggestions.push({
        field: 'description' as const,
        type: 'clarity',
        message: 'Clearly state your campaign goals',
        example: 'Our goal is to [specific objective] by [timeline].',
      });
    }

    return suggestions;
  };

  const quickSuggestions = getQuickSuggestions();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Campaign Assistant
        </CardTitle>
        <CardDescription>
          Get AI-powered suggestions and content validation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
            <TabsTrigger value="quick-tips">Quick Tips</TabsTrigger>
            {showModeration && (
              <TabsTrigger value="moderation">Moderation</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="suggestions" className="mt-4">
            {campaignId ? (
              <ContentSuggestions
                campaignId={campaignId}
                onApplySuggestion={(content) => {
                  // Try to intelligently apply the suggestion
                  if (content.length < 100 && onApplySuggestion) {
                    onApplySuggestion('title', content);
                  } else if (onApplySuggestion) {
                    onApplySuggestion(
                      'description',
                      description + '\n\n' + content
                    );
                  }
                }}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">
                  Save your campaign to get AI suggestions
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="quick-tips" className="mt-4 space-y-3">
            {quickSuggestions.length > 0 ? (
              quickSuggestions.map((suggestion, index) => (
                <div key={index} className="p-3 border rounded-lg space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {suggestion.field}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {suggestion.type}
                      </Badge>
                    </div>
                    {onApplySuggestion && suggestion.example && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          onApplySuggestion(
                            suggestion.field,
                            suggestion.field === 'title'
                              ? suggestion.example
                              : description + '\n\n' + suggestion.example
                          )
                        }
                      >
                        Apply
                      </Button>
                    )}
                  </div>
                  <p className="text-sm">{suggestion.message}</p>
                  {suggestion.example && (
                    <p className="text-sm text-muted-foreground italic">
                      Example: {suggestion.example}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <RefreshCw className="h-8 w-8 mx-auto mb-4 opacity-50" />
                <p className="text-sm">
                  Your campaign looks great! No immediate suggestions.
                </p>
              </div>
            )}

            <div className="mt-6 p-4 bg-muted/50 rounded-lg space-y-2">
              <h4 className="font-medium text-sm">Campaign Best Practices:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-start gap-2">
                  <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  Include specific location details to attract local supporters
                </li>
                <li className="flex items-start gap-2">
                  <Users className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  Mention how the community will benefit from your campaign
                </li>
                <li className="flex items-start gap-2">
                  <TrendingUp className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  Set clear, measurable goals with realistic timelines
                </li>
              </ul>
            </div>
          </TabsContent>

          {showModeration && campaignId && (
            <TabsContent value="moderation" className="mt-4">
              <ModerationStatus
                contentId={campaignId}
                contentType="campaign"
                content={`${title}\n\n${description}`}
                onModerationComplete={(status) => {
                  if (status === 'rejected') {
                    setActiveTab('quick-tips');
                  }
                }}
              />
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
