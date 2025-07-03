'use client';

import { useState, useEffect, useCallback } from 'react';
import { Switch } from '@headlessui/react';
import {
  BellIcon,
  MapPinIcon,
  ClockIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftIcon,
  HandThumbUpIcon,
} from '@heroicons/react/24/outline';

interface NotificationPreference {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<Record<string, unknown>>;
  enabled: boolean;
  category: 'engagement' | 'location' | 'timing' | 'content';
}

interface LocationSettings {
  enabled: boolean;
  radius: number; // kilometers
  coordinates?: {
    lat: number;
    lng: number;
    address: string;
  };
}

interface TimingSettings {
  quietHours: {
    enabled: boolean;
    start: number; // hour 0-23
    end: number; // hour 0-23
  };
  optimalTiming: boolean;
  instantDelivery: boolean;
}

interface NotificationPreferencesProps {
  userId: string;
  className?: string;
}

export function NotificationPreferences({
  userId,
  className = '',
}: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([
    {
      id: 'campaign_created',
      name: 'New Campaigns',
      description: 'Get notified when new campaigns are created in your area',
      icon: BellIcon,
      enabled: true,
      category: 'content',
    },
    {
      id: 'campaign_nearby',
      name: 'Nearby Activity',
      description: 'Alerts for campaign activity within your specified radius',
      icon: MapPinIcon,
      enabled: true,
      category: 'location',
    },
    {
      id: 'vote_milestone',
      name: 'Vote Milestones',
      description: 'When campaigns you follow reach voting milestones',
      icon: HandThumbUpIcon,
      enabled: true,
      category: 'engagement',
    },
    {
      id: 'comment_reply',
      name: 'Comment Replies',
      description: 'When someone replies to your comments',
      icon: ChatBubbleLeftIcon,
      enabled: true,
      category: 'engagement',
    },
    {
      id: 'engagement_streak',
      name: 'Engagement Streaks',
      description: 'Celebrate your civic participation streaks',
      icon: UserGroupIcon,
      enabled: false,
      category: 'engagement',
    },
    {
      id: 'emergency_alert',
      name: 'Emergency Alerts',
      description: 'Critical civic announcements and emergency information',
      icon: ExclamationTriangleIcon,
      enabled: true,
      category: 'content',
    },
  ]);

  const [locationSettings, setLocationSettings] = useState<LocationSettings>({
    enabled: true,
    radius: 10,
  });

  const [timingSettings, setTimingSettings] = useState<TimingSettings>({
    quietHours: {
      enabled: true,
      start: 22,
      end: 8,
    },
    optimalTiming: true,
    instantDelivery: false,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const loadUserPreferences = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load user preferences from API
      const response = await fetch(
        `/api/users/${userId}/notification-preferences`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.preferences) {
          setPreferences(data.preferences);
        }
        if (data.locationSettings) {
          setLocationSettings(data.locationSettings);
        }
        if (data.timingSettings) {
          setTimingSettings(data.timingSettings);
        }
      }
    } catch (err) {
      console.error('Failed to load notification preferences:', err);
      setError('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadUserPreferences();
  }, [loadUserPreferences]);

  const savePreferences = async () => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch(
        `/api/users/${userId}/notification-preferences`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            preferences,
            locationSettings,
            timingSettings,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save notification preferences:', err);
      setError('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const togglePreference = (id: string) => {
    setPreferences((prev) =>
      prev.map((pref) =>
        pref.id === id ? { ...pref, enabled: !pref.enabled } : pref
      )
    );
  };

  const updateLocationRadius = (radius: number) => {
    setLocationSettings((prev) => ({ ...prev, radius }));
  };

  const toggleLocationEnabled = () => {
    setLocationSettings((prev) => ({ ...prev, enabled: !prev.enabled }));
  };

  const updateQuietHours = (start: number, end: number) => {
    setTimingSettings((prev) => ({
      ...prev,
      quietHours: { ...prev.quietHours, start, end },
    }));
  };

  const toggleQuietHours = () => {
    setTimingSettings((prev) => ({
      ...prev,
      quietHours: { ...prev.quietHours, enabled: !prev.quietHours.enabled },
    }));
  };

  const toggleOptimalTiming = () => {
    setTimingSettings((prev) => ({
      ...prev,
      optimalTiming: !prev.optimalTiming,
    }));
  };

  const groupedPreferences = preferences.reduce(
    (acc, pref) => {
      if (!acc[pref.category]) {
        acc[pref.category] = [];
      }
      acc[pref.category].push(pref);
      return acc;
    },
    {} as Record<string, NotificationPreference[]>
  );

  if (loading) {
    return (
      <div className={`animate-pulse space-y-4 ${className}`}>
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Notification Preferences
        </h2>
        <p className="text-sm text-gray-600">
          Customize how and when you receive notifications about civic
          activities
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700">
            Preferences saved successfully!
          </p>
        </div>
      )}

      {/* Location Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <MapPinIcon className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Location-Based Notifications
              </h3>
              <p className="text-sm text-gray-500">
                Get alerts for nearby campaign activity
              </p>
            </div>
          </div>
          <Switch
            checked={locationSettings.enabled}
            onChange={toggleLocationEnabled}
            className={`${
              locationSettings.enabled ? 'bg-blue-600' : 'bg-gray-200'
            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
          >
            <span
              className={`${
                locationSettings.enabled ? 'translate-x-6' : 'translate-x-1'
              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
          </Switch>
        </div>

        {locationSettings.enabled && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notification Radius: {locationSettings.radius} km
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={locationSettings.radius}
                onChange={(e) => updateLocationRadius(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1 km</span>
                <span>25 km</span>
                <span>50 km</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                📍 You&apos;ll receive notifications for campaigns and
                activities within {locationSettings.radius} km of your location
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Timing Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <ClockIcon className="w-6 h-6 text-purple-600" />
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Intelligent Timing
            </h3>
            <p className="text-sm text-gray-500">
              Control when notifications are delivered
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Optimal Timing */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">
                Smart Timing
              </h4>
              <p className="text-sm text-gray-500">
                Deliver notifications when you&apos;re most likely to engage
              </p>
            </div>
            <Switch
              checked={timingSettings.optimalTiming}
              onChange={toggleOptimalTiming}
              className={`${
                timingSettings.optimalTiming ? 'bg-purple-600' : 'bg-gray-200'
              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2`}
            >
              <span
                className={`${
                  timingSettings.optimalTiming
                    ? 'translate-x-6'
                    : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </Switch>
          </div>

          {/* Quiet Hours */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  Quiet Hours
                </h4>
                <p className="text-sm text-gray-500">
                  No notifications during these hours
                </p>
              </div>
              <Switch
                checked={timingSettings.quietHours.enabled}
                onChange={toggleQuietHours}
                className={`${
                  timingSettings.quietHours.enabled
                    ? 'bg-purple-600'
                    : 'bg-gray-200'
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2`}
              >
                <span
                  className={`${
                    timingSettings.quietHours.enabled
                      ? 'translate-x-6'
                      : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </Switch>
            </div>

            {timingSettings.quietHours.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <select
                    value={timingSettings.quietHours.start}
                    onChange={(e) =>
                      updateQuietHours(
                        Number(e.target.value),
                        timingSettings.quietHours.end
                      )
                    }
                    className="w-full text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {i.toString().padStart(2, '0')}:00
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <select
                    value={timingSettings.quietHours.end}
                    onChange={(e) =>
                      updateQuietHours(
                        timingSettings.quietHours.start,
                        Number(e.target.value)
                      )
                    }
                    className="w-full text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {i.toString().padStart(2, '0')}:00
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notification Types */}
      <div className="space-y-6">
        {Object.entries(groupedPreferences).map(([category, prefs]) => (
          <div
            key={category}
            className="bg-white border border-gray-200 rounded-lg p-6"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4 capitalize">
              {category} Notifications
            </h3>
            <div className="space-y-4">
              {prefs.map((pref) => {
                const IconComponent = pref.icon;
                return (
                  <div
                    key={pref.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <IconComponent className="w-5 h-5 text-gray-400" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {pref.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {pref.description}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={pref.enabled}
                      onChange={() => togglePreference(pref.id)}
                      className={`${
                        pref.enabled ? 'bg-blue-600' : 'bg-gray-200'
                      } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                    >
                      <span
                        className={`${
                          pref.enabled ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                      />
                    </Switch>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={savePreferences}
          disabled={saving}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}
