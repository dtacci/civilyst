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
} from '~/components/ai';
import { Brain, Shield, Users } from 'lucide-react';

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
          <TabsList className="grid w-full grid-cols-3 max-w-2xl">
            <TabsTrigger
              value="suggestions"
              className="flex items-center gap-2"
            >
              <Brain className="h-4 w-4" />
              AI Suggestions
            </TabsTrigger>
            <TabsTrigger value="moderation" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Content Moderation
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
