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
import { Slider } from '~/components/ui/slider';
import { Badge } from '~/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import {
  Bell,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Settings,
} from 'lucide-react';
import { useToast } from '~/hooks/use-toast';

interface SentimentNotificationSettingsProps {
  campaignId: string;
  className?: string;
}

interface NotificationSettings {
  enabled: boolean;
  thresholds: {
    positiveChange: number;
    negativeChange: number;
    volumeSpike: number;
  };
  frequency: 'immediate' | 'hourly' | 'daily';
  channels: {
    email: boolean;
    inApp: boolean;
    push: boolean;
  };
}

export function SentimentNotificationSettings({
  campaignId: _campaignId,
  className,
}: SentimentNotificationSettingsProps) {
  const { toast } = useToast();
  const [settings, setSettings] = React.useState<NotificationSettings>({
    enabled: true,
    thresholds: {
      positiveChange: 20,
      negativeChange: 20,
      volumeSpike: 50,
    },
    frequency: 'hourly',
    channels: {
      email: true,
      inApp: true,
      push: false,
    },
  });

  const handleSaveSettings = () => {
    // In a real implementation, this would save to the backend
    toast({
      title: 'Settings saved',
      description: 'Sentiment notification preferences have been updated.',
    });
  };

  const getThresholdColor = (value: number) => {
    if (value <= 10) return 'text-green-600';
    if (value <= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Sentiment Notifications
            </CardTitle>
            <CardDescription>
              Get alerts when sentiment changes significantly
            </CardDescription>
          </div>
          <Badge variant={settings.enabled ? 'default' : 'secondary'}>
            {settings.enabled ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Enable/Disable */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="notifications-enabled">Enable Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Receive alerts about sentiment changes
            </p>
          </div>
          <Switch
            id="notifications-enabled"
            checked={settings.enabled}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, enabled: checked })
            }
          />
        </div>

        {settings.enabled && (
          <>
            {/* Alert Thresholds */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Alert Thresholds
              </h4>

              {/* Positive Change Threshold */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    Positive sentiment increase
                  </Label>
                  <span
                    className={`text-sm font-medium ${getThresholdColor(
                      settings.thresholds.positiveChange
                    )}`}
                  >
                    +{settings.thresholds.positiveChange}%
                  </span>
                </div>
                <Slider
                  value={[settings.thresholds.positiveChange]}
                  onValueChange={([value]) =>
                    setSettings({
                      ...settings,
                      thresholds: {
                        ...settings.thresholds,
                        positiveChange: value,
                      },
                    })
                  }
                  min={5}
                  max={50}
                  step={5}
                  className="cursor-pointer"
                />
              </div>

              {/* Negative Change Threshold */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    Negative sentiment increase
                  </Label>
                  <span
                    className={`text-sm font-medium ${getThresholdColor(
                      settings.thresholds.negativeChange
                    )}`}
                  >
                    -{settings.thresholds.negativeChange}%
                  </span>
                </div>
                <Slider
                  value={[settings.thresholds.negativeChange]}
                  onValueChange={([value]) =>
                    setSettings({
                      ...settings,
                      thresholds: {
                        ...settings.thresholds,
                        negativeChange: value,
                      },
                    })
                  }
                  min={5}
                  max={50}
                  step={5}
                  className="cursor-pointer"
                />
              </div>

              {/* Volume Spike Threshold */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    Comment volume spike
                  </Label>
                  <span className="text-sm font-medium text-yellow-600">
                    +{settings.thresholds.volumeSpike}%
                  </span>
                </div>
                <Slider
                  value={[settings.thresholds.volumeSpike]}
                  onValueChange={([value]) =>
                    setSettings({
                      ...settings,
                      thresholds: {
                        ...settings.thresholds,
                        volumeSpike: value,
                      },
                    })
                  }
                  min={20}
                  max={200}
                  step={10}
                  className="cursor-pointer"
                />
              </div>
            </div>

            {/* Notification Frequency */}
            <div className="space-y-2">
              <Label htmlFor="notification-frequency">
                Notification Frequency
              </Label>
              <Select
                value={settings.frequency}
                onValueChange={(value) =>
                  setSettings({
                    ...settings,
                    frequency: value as NotificationSettings['frequency'],
                  })
                }
              >
                <SelectTrigger id="notification-frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="hourly">Hourly Summary</SelectItem>
                  <SelectItem value="daily">Daily Digest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notification Channels */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Notification Channels</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="channel-email">Email</Label>
                  <Switch
                    id="channel-email"
                    checked={settings.channels.email}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        channels: { ...settings.channels, email: checked },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="channel-in-app">In-App</Label>
                  <Switch
                    id="channel-in-app"
                    checked={settings.channels.inApp}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        channels: { ...settings.channels, inApp: checked },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="channel-push">Push Notifications</Label>
                  <Switch
                    id="channel-push"
                    checked={settings.channels.push}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        channels: { ...settings.channels, push: checked },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Save Button */}
        <div className="pt-4">
          <button
            onClick={handleSaveSettings}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium transition-colors"
          >
            Save Notification Settings
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
