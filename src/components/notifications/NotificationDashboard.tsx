'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  BellIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  MapPinIcon,
  ChartBarIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';
import { NotificationPreferences } from './NotificationPreferences';
import { PushNotificationSettings } from '../pwa/PushNotificationSettings';

interface NotificationActivity {
  id: string;
  type: 'sent' | 'delivered' | 'opened' | 'dismissed';
  notificationType: string;
  title: string;
  timestamp: Date;
  campaignId?: string;
}

interface NotificationStats {
  totalSent: number;
  deliveryRate: number;
  openRate: number;
  engagementScore: number;
  optimalTimes: number[];
  locationEngagement: {
    nearbyRadius: number;
    averageDistance: number;
  };
}

interface NotificationDashboardProps {
  userId: string;
  className?: string;
}

export function NotificationDashboard({ 
  userId, 
  className = '' 
}: NotificationDashboardProps) {
  const [activeTab, setActiveTab] = useState<'activity' | 'settings' | 'push'>('activity');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<NotificationStats>({
    totalSent: 0,
    deliveryRate: 0,
    openRate: 0,
    engagementScore: 0,
    optimalTimes: [],
    locationEngagement: {
      nearbyRadius: 0,
      averageDistance: 0,
    },
  });
  const [recentActivity, setRecentActivity] = useState<NotificationActivity[]>([]);

  const loadNotificationData = useCallback(async () => {
    try {
      setLoading(true);

      // Load notification statistics
      const statsResponse = await fetch(`/api/users/${userId}/notification-stats`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Load recent notification activity
      const activityResponse = await fetch(`/api/users/${userId}/notification-activity`);
      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        setRecentActivity(activityData.map((item: Record<string, unknown>) => ({
          ...item,
          timestamp: new Date(item.timestamp as string),
        })));
      }
    } catch (error) {
      console.error('Failed to load notification data:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadNotificationData();
  }, [loadNotificationData]);

  const formatTime = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'campaign_created':
      case 'campaign_nearby':
        return <MapPinIcon className="w-5 h-5 text-blue-500" />;
      case 'vote_milestone':
        return <ChartBarIcon className="w-5 h-5 text-green-500" />;
      case 'comment_reply':
        return <BellIcon className="w-5 h-5 text-purple-500" />;
      default:
        return <BellIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getActivityStatusColor = (type: NotificationActivity['type']) => {
    switch (type) {
      case 'sent':
        return 'text-blue-600 bg-blue-100';
      case 'delivered':
        return 'text-green-600 bg-green-100';
      case 'opened':
        return 'text-purple-600 bg-purple-100';
      case 'dismissed':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const tabs = [
    { id: 'activity', name: 'Activity', icon: ChartBarIcon },
    { id: 'settings', name: 'Preferences', icon: AdjustmentsHorizontalIcon },
    { id: 'push', name: 'Push Setup', icon: BellSolidIcon },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notification Center</h1>
        <p className="text-gray-600 mt-1">
          Manage your civic engagement notifications and preferences
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'activity' | 'settings' | 'push')}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <IconComponent className="w-5 h-5" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'activity' && (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BellIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Sent</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalSent}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircleIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Delivery Rate</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.deliveryRate}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <ChartBarIcon className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Open Rate</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.openRate}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <ClockIcon className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Engagement</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.engagementScore}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Optimal Times */}
            {stats.optimalTimes.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Your Optimal Notification Times
                </h3>
                <div className="flex flex-wrap gap-2">
                  {stats.optimalTimes.map((hour) => (
                    <span
                      key={hour}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {formatTime(hour)}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-3">
                  Based on your engagement patterns, these are the best times to receive notifications
                </p>
              </div>
            )}

            {/* Recent Activity */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Recent Notification Activity
              </h3>
              
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.slice(0, 10).map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {getNotificationIcon(activity.notificationType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {activity.timestamp.toLocaleDateString()} at{' '}
                          {activity.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActivityStatusColor(
                          activity.type
                        )}`}
                      >
                        {activity.type}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BellIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-sm text-gray-500">No notification activity yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <NotificationPreferences userId={userId} />
        )}

        {activeTab === 'push' && (
          <PushNotificationSettings />
        )}
      </div>
    </div>
  );
}