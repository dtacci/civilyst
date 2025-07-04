'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';
import { Label } from '~/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import {
  CampaignSuggestionPanel,
  ModerationQueue,
  ContentSuggestions,
  ModerationStatus,
  CampaignSummary,
  SentimentAnalysis,
  SentimentTrends,
} from '~/components/ai';
import { Translation } from '~/components/ai/Translation';
import { AccessibilityDashboard } from '~/components/ai/AccessibilityDashboard';
import {
  Brain,
  Shield,
  Users,
  FileText,
  BarChart3,
  Languages,
  Eye,
} from 'lucide-react';

export default function AIDemo() {
  const [campaignId] = useState('demo-campaign-1');
  const [title, setTitle] = useState('Community Garden Project');
  const [description, setDescription] = useState(
    'We want to create a beautiful community garden in our neighborhood.'
  );
  const [location, setLocation] = useState('Downtown San Francisco');

  const handleApplySuggestion = (
    field: 'title' | 'description',
    value: string
  ) => {
    if (field === 'title') {
      setTitle(value);
    } else {
      setDescription(value);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            AI Content Enhancement Demo
          </h1>
          <p className="text-muted-foreground">
            Explore AI-powered features for content suggestions, moderation, and
            campaign optimization
          </p>
        </div>

        <Tabs defaultValue="suggestions" className="space-y-4">
          <TabsList className="grid w-full grid-cols-7 max-w-6xl">
            <TabsTrigger
              value="suggestions"
              className="flex items-center gap-2"
            >
              <Brain className="h-4 w-4" />
              AI Suggestions
            </TabsTrigger>
            <TabsTrigger value="moderation" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Moderation
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Summary
            </TabsTrigger>
            <TabsTrigger value="sentiment" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Sentiment
            </TabsTrigger>
            <TabsTrigger
              value="translation"
              className="flex items-center gap-2"
            >
              <Languages className="h-4 w-4" />
              Translation
            </TabsTrigger>
            <TabsTrigger
              value="accessibility"
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Accessibility
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Admin Queue
            </TabsTrigger>
          </TabsList>

          <TabsContent value="suggestions" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Editor</CardTitle>
                  <CardDescription>
                    Create or edit your campaign with AI assistance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Campaign Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter campaign title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe your campaign..."
                      rows={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Campaign location"
                    />
                  </div>
                </CardContent>
              </Card>

              <CampaignSuggestionPanel
                campaignId={campaignId}
                title={title}
                description={description}
                location={location}
                onApplySuggestion={handleApplySuggestion}
                showModeration={false}
              />
            </div>

            <div className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">
                Standalone Suggestions Component
              </h2>
              <ContentSuggestions
                campaignId={campaignId}
                onApplySuggestion={(content) => {
                  setDescription(description + '\n\n' + content);
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="moderation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Moderation Demo</CardTitle>
                <CardDescription>
                  See how AI moderates content for safety and quality
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Safe Content Example</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      &quot;Join us in creating a beautiful community garden
                      where neighbors can grow fresh vegetables and build
                      lasting friendships.&quot;
                    </p>
                    <ModerationStatus
                      contentId="safe-content-1"
                      contentType="campaign"
                      content="Join us in creating a beautiful community garden where neighbors can grow fresh vegetables and build lasting friendships."
                    />
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">
                      Potentially Problematic Content
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      &quot;URGENT!!! Send money NOW to this account for our
                      project!!!&quot;
                    </p>
                    <ModerationStatus
                      contentId="problematic-content-1"
                      contentType="campaign"
                      content="URGENT!!! Send money NOW to this account for our project!!!"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="summary" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Content</CardTitle>
                  <CardDescription>
                    Sample campaign for AI summarization
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">{title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {description}
                    </p>
                  </div>
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium mb-2">
                      Sample Comments
                    </h4>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        &quot;This is a fantastic idea! I would love to help
                        organize volunteers.&quot;
                      </p>
                      <p className="text-sm text-muted-foreground">
                        &quot;We should include native plants to support local
                        wildlife.&quot;
                      </p>
                      <p className="text-sm text-muted-foreground">
                        &quot;I have experience in landscape design and would be
                        happy to contribute.&quot;
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <CampaignSummary
                campaignId={campaignId}
                campaignTitle={title}
                includeComments={true}
                includeVotes={true}
              />
            </div>
          </TabsContent>

          <TabsContent value="sentiment" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Content for Analysis</CardTitle>
                    <CardDescription>
                      Analyze sentiment in different types of content
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg">
                        <h3 className="font-medium mb-2">Positive Comment</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          &quot;This project is amazing! I&apos;m so excited to
                          participate and help make our community better. Great
                          initiative!&quot;
                        </p>
                        <SentimentAnalysis
                          contentId="positive-comment-1"
                          contentType="comment"
                          content="This project is amazing! I'm so excited to participate and help make our community better. Great initiative!"
                          autoAnalyze={true}
                        />
                      </div>

                      <div className="p-4 border rounded-lg">
                        <h3 className="font-medium mb-2">Mixed Sentiment</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          &quot;I like the idea but I&apos;m concerned about the
                          maintenance costs. Who will take care of it
                          long-term?&quot;
                        </p>
                        <SentimentAnalysis
                          contentId="mixed-comment-1"
                          contentType="comment"
                          content="I like the idea but I'm concerned about the maintenance costs. Who will take care of it long-term?"
                          autoAnalyze={true}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <SentimentTrends campaignId={campaignId} />

                <Card>
                  <CardHeader>
                    <CardTitle>Campaign Sentiment</CardTitle>
                    <CardDescription>
                      Overall sentiment analysis for the campaign
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SentimentAnalysis
                      contentId={campaignId}
                      contentType="campaign"
                      content={`${title}\n\n${description}`}
                      autoAnalyze={true}
                      showEmotions={true}
                      showKeywords={true}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="translation" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Content to Translate</CardTitle>
                  <CardDescription>
                    Demonstrate AI-powered translation for accessibility
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">{title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {description}
                    </p>
                  </div>
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium mb-2">Sample Comment</h4>
                    <p className="text-sm text-muted-foreground">
                      &quot;This is exactly what our community needs! I would
                      love to volunteer my time to help maintain the
                      garden.&quot;
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Translation
                contentId={campaignId}
                contentType="campaign"
                content={`${title}\n\n${description}`}
                sourceLanguage="en"
              />
            </div>

            <div className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">
                Comment Translation Example
              </h2>
              <Translation
                contentId="demo-comment-1"
                contentType="comment"
                content="This is exactly what our community needs! I would love to volunteer my time to help maintain the garden."
                sourceLanguage="en"
              />
            </div>
          </TabsContent>

          <TabsContent value="accessibility" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Accessibility</CardTitle>
                  <CardDescription>
                    AI-powered accessibility analysis and improvements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Current Campaign</h3>
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium">{title}</h4>
                      <p className="text-sm text-muted-foreground mt-2">
                        {description}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">
                      Accessibility Considerations
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Reading level and language clarity</li>
                      <li>• Visual contrast and color usage</li>
                      <li>• Alternative text for images</li>
                      <li>• Screen reader compatibility</li>
                      <li>• Inclusive language usage</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <AccessibilityDashboard
                campaignId={campaignId}
                campaignTitle={title}
              />
            </div>
          </TabsContent>

          <TabsContent value="admin" className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Moderation Queue</h2>
              <p className="text-muted-foreground mb-6">
                Admin interface for reviewing and moderating flagged content
              </p>
              <ModerationQueue limit={10} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
