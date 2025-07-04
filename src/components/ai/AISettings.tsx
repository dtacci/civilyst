'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Label } from '~/components/ui/label';
import { Switch } from '~/components/ui/switch';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Slider } from '~/components/ui/slider';
import {
  Settings,
  Brain,
  Shield,
  Languages,
  Eye,
  Sparkles,
  Save,
  RotateCcw,
} from 'lucide-react';
import { useToast } from '~/hooks/use-toast';

interface AISettingsProps {
  userId?: string;
  className?: string;
}

interface AIUserSettings {
  // AI Suggestions
  suggestionsEnabled: boolean;
  suggestionFrequency: 'immediate' | 'batched' | 'manual';
  suggestionTypes: {
    locationBased: boolean;
    interestBased: boolean;
    trending: boolean;
  };

  // Content Moderation
  moderationEnabled: boolean;
  moderationSensitivity: number; // 1-10 scale
  autoModerationEnabled: boolean;

  // Language & Translation
  preferredLanguage: string;
  autoTranslationEnabled: boolean;
  translationLanguages: string[];

  // Accessibility
  accessibilityEnabled: boolean;
  autoAltTextEnabled: boolean;
  audioDescriptionEnabled: boolean;
  accessibilityNotifications: boolean;

  // Performance
  batchProcessingEnabled: boolean;
  maxConcurrentRequests: number;
  fallbackEnabled: boolean;
}

const defaultSettings: AIUserSettings = {
  suggestionsEnabled: true,
  suggestionFrequency: 'batched',
  suggestionTypes: {
    locationBased: true,
    interestBased: true,
    trending: false,
  },
  moderationEnabled: true,
  moderationSensitivity: 5,
  autoModerationEnabled: true,
  preferredLanguage: 'en',
  autoTranslationEnabled: false,
  translationLanguages: ['es', 'fr', 'zh'],
  accessibilityEnabled: true,
  autoAltTextEnabled: true,
  audioDescriptionEnabled: false,
  accessibilityNotifications: true,
  batchProcessingEnabled: true,
  maxConcurrentRequests: 3,
  fallbackEnabled: true,
};

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'zh', name: 'Chinese (Simplified)' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'pt', name: 'Portuguese' },
];

export function AISettings({ userId: _userId, className }: AISettingsProps) {
  const { toast } = useToast();
  const [settings, setSettings] =
    React.useState<AIUserSettings>(defaultSettings);
  const [hasChanges, setHasChanges] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const updateSetting = <K extends keyof AIUserSettings>(
    key: K,
    value: AIUserSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const updateNestedSetting = <
    T extends keyof AIUserSettings,
    K extends keyof AIUserSettings[T],
  >(
    parent: T,
    key: K,
    value: AIUserSettings[T][K]
  ) => {
    setSettings((prev) => ({
      ...prev,
      [parent]: {
        ...((prev[parent] as Record<string, unknown>) || {}),
        [key]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // In a real implementation, this would save to the backend
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast({
        title: 'Settings saved',
        description: 'Your AI preferences have been updated successfully.',
      });
      setHasChanges(false);
    } catch (_error) {
      toast({
        title: 'Failed to save settings',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    setHasChanges(true);
    toast({
      title: 'Settings reset',
      description: 'AI preferences have been reset to defaults.',
    });
  };

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  AI Feature Settings
                </CardTitle>
                <CardDescription>
                  Configure AI-powered features to match your preferences
                </CardDescription>
              </div>
              <Badge variant={hasChanges ? 'default' : 'secondary'}>
                {hasChanges ? 'Unsaved Changes' : 'Saved'}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* AI Suggestions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Content Suggestions
            </CardTitle>
            <CardDescription>
              AI-powered suggestions for improving your campaigns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="suggestions-enabled">
                  Enable AI Suggestions
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get AI-powered recommendations for your content
                </p>
              </div>
              <Switch
                id="suggestions-enabled"
                checked={settings.suggestionsEnabled}
                onCheckedChange={(checked) =>
                  updateSetting('suggestionsEnabled', checked)
                }
              />
            </div>

            {settings.suggestionsEnabled && (
              <>
                <div className="space-y-2">
                  <Label>Suggestion Frequency</Label>
                  <Select
                    value={settings.suggestionFrequency}
                    onValueChange={(value) =>
                      updateSetting(
                        'suggestionFrequency',
                        value as AIUserSettings['suggestionFrequency']
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="batched">
                        Batched (Recommended)
                      </SelectItem>
                      <SelectItem value="manual">Manual Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Suggestion Types</Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="location-based">
                        Location-based suggestions
                      </Label>
                      <Switch
                        id="location-based"
                        checked={settings.suggestionTypes.locationBased}
                        onCheckedChange={(checked) =>
                          updateNestedSetting(
                            'suggestionTypes',
                            'locationBased',
                            checked
                          )
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="interest-based">
                        Interest-based suggestions
                      </Label>
                      <Switch
                        id="interest-based"
                        checked={settings.suggestionTypes.interestBased}
                        onCheckedChange={(checked) =>
                          updateNestedSetting(
                            'suggestionTypes',
                            'interestBased',
                            checked
                          )
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="trending">
                        Trending topic suggestions
                      </Label>
                      <Switch
                        id="trending"
                        checked={settings.suggestionTypes.trending}
                        onCheckedChange={(checked) =>
                          updateNestedSetting(
                            'suggestionTypes',
                            'trending',
                            checked
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Content Moderation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Content Moderation
            </CardTitle>
            <CardDescription>
              AI-powered content safety and quality checks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="moderation-enabled">
                  Enable Content Moderation
                </Label>
                <p className="text-sm text-muted-foreground">
                  Automatically check content for safety and quality issues
                </p>
              </div>
              <Switch
                id="moderation-enabled"
                checked={settings.moderationEnabled}
                onCheckedChange={(checked) =>
                  updateSetting('moderationEnabled', checked)
                }
              />
            </div>

            {settings.moderationEnabled && (
              <>
                <div className="space-y-2">
                  <Label>
                    Moderation Sensitivity: {settings.moderationSensitivity}/10
                  </Label>
                  <Slider
                    value={[settings.moderationSensitivity]}
                    onValueChange={([value]) =>
                      updateSetting('moderationSensitivity', value)
                    }
                    min={1}
                    max={10}
                    step={1}
                  />
                  <p className="text-xs text-muted-foreground">
                    Higher values mean stricter moderation
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-moderation">
                      Automatic Moderation
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically approve/reject content based on AI analysis
                    </p>
                  </div>
                  <Switch
                    id="auto-moderation"
                    checked={settings.autoModerationEnabled}
                    onCheckedChange={(checked) =>
                      updateSetting('autoModerationEnabled', checked)
                    }
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Language & Translation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5" />
              Language & Translation
            </CardTitle>
            <CardDescription>
              Multi-language support and translation preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Preferred Language</Label>
              <Select
                value={settings.preferredLanguage}
                onValueChange={(value) =>
                  updateSetting('preferredLanguage', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-translation">Auto-translate content</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically offer translations for content in other
                  languages
                </p>
              </div>
              <Switch
                id="auto-translation"
                checked={settings.autoTranslationEnabled}
                onCheckedChange={(checked) =>
                  updateSetting('autoTranslationEnabled', checked)
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Available Translation Languages</Label>
              <div className="flex flex-wrap gap-2">
                {settings.translationLanguages.map((langCode) => (
                  <Badge key={langCode} variant="secondary">
                    {LANGUAGES.find((l) => l.code === langCode)?.name ||
                      langCode}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Content can be translated to these languages
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Accessibility */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Accessibility Features
            </CardTitle>
            <CardDescription>
              AI-powered accessibility enhancements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="accessibility-enabled">
                  Enable Accessibility Features
                </Label>
                <p className="text-sm text-muted-foreground">
                  AI-powered tools to make content more accessible
                </p>
              </div>
              <Switch
                id="accessibility-enabled"
                checked={settings.accessibilityEnabled}
                onCheckedChange={(checked) =>
                  updateSetting('accessibilityEnabled', checked)
                }
              />
            </div>

            {settings.accessibilityEnabled && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-alt-text">
                      Auto-generate alt text
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically create alt text for images
                    </p>
                  </div>
                  <Switch
                    id="auto-alt-text"
                    checked={settings.autoAltTextEnabled}
                    onCheckedChange={(checked) =>
                      updateSetting('autoAltTextEnabled', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="audio-description">
                      Generate audio descriptions
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Create audio descriptions for media content
                    </p>
                  </div>
                  <Switch
                    id="audio-description"
                    checked={settings.audioDescriptionEnabled}
                    onCheckedChange={(checked) =>
                      updateSetting('audioDescriptionEnabled', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="accessibility-notifications">
                      Accessibility notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about accessibility improvements
                    </p>
                  </div>
                  <Switch
                    id="accessibility-notifications"
                    checked={settings.accessibilityNotifications}
                    onCheckedChange={(checked) =>
                      updateSetting('accessibilityNotifications', checked)
                    }
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Performance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Performance & Reliability
            </CardTitle>
            <CardDescription>
              Optimize AI feature performance and reliability
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="batch-processing">
                  Enable batch processing
                </Label>
                <p className="text-sm text-muted-foreground">
                  Process multiple AI requests together for better performance
                </p>
              </div>
              <Switch
                id="batch-processing"
                checked={settings.batchProcessingEnabled}
                onCheckedChange={(checked) =>
                  updateSetting('batchProcessingEnabled', checked)
                }
              />
            </div>

            <div className="space-y-2">
              <Label>
                Max concurrent AI requests: {settings.maxConcurrentRequests}
              </Label>
              <Slider
                value={[settings.maxConcurrentRequests]}
                onValueChange={([value]) =>
                  updateSetting('maxConcurrentRequests', value)
                }
                min={1}
                max={10}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                Lower values reduce load but may be slower
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="fallback-enabled">
                  Enable fallback mechanisms
                </Label>
                <p className="text-sm text-muted-foreground">
                  Gracefully handle AI service unavailability
                </p>
              </div>
              <Switch
                id="fallback-enabled"
                checked={settings.fallbackEnabled}
                onCheckedChange={(checked) =>
                  updateSetting('fallbackEnabled', checked)
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className="flex-1"
              >
                {isSaving ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isSaving}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
