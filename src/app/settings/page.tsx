'use client';

import { useState } from 'react';
import * as React from 'react';
import { useUser } from '@clerk/nextjs';
import { api } from '~/lib/trpc';
import { Card, CardContent } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Switch } from '~/components/ui/switch';
import { Textarea } from '~/components/ui/textarea';
import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import {
  ArrowLeft,
  Camera,
  Save,
  User,
  Bell,
  MapPin,
  Shield,
  Download,
  Trash2,
  Eye,
} from 'lucide-react';

interface NotificationSettings {
  newVotes: boolean;
  newComments: boolean;
  nearbyAlerts: boolean;
  wonderUpdates: boolean;
  weeklyDigest: boolean;
}

interface PrivacySettings {
  publicProfile: boolean;
  showStats: boolean;
  showActivity: boolean;
  allowMentions: boolean;
}

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');

  // Notification settings state
  const [notifications, setNotifications] = useState<NotificationSettings>({
    newVotes: true,
    newComments: true,
    nearbyAlerts: true,
    wonderUpdates: false,
    weeklyDigest: true,
  });

  // Privacy settings state
  const [privacy, setPrivacy] = useState<PrivacySettings>({
    publicProfile: true,
    showStats: true,
    showActivity: true,
    allowMentions: true,
  });

  // Redirect if not authenticated
  if (isLoaded && !user) {
    redirect('/sign-in');
  }

  // Get user profile data
  const { data: userProfile } = api.users.getProfile.useQuery(undefined, {
    enabled: isLoaded && !!user,
  });

  // Initialize form with user data
  React.useEffect(() => {
    if (userProfile) {
      setFirstName(userProfile.firstName || '');
      setLastName(userProfile.lastName || '');
      setBio(userProfile.bio || '');
      setLocation(userProfile.location || '');

      // Update privacy settings
      setPrivacy({
        publicProfile: userProfile.isPublic ?? true,
        showStats: userProfile.showStats ?? true,
        showActivity: userProfile.showActivity ?? true,
        allowMentions: userProfile.allowMentions ?? true,
      });
    }
  }, [userProfile]);

  // Update profile mutation
  const updateProfile = api.users.updateProfile.useMutation({
    onSuccess: () => {
      setIsLoading(false);
      setSuccessMessage('Profile updated successfully!');
      setErrorMessage('');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (error) => {
      setIsLoading(false);
      setErrorMessage(error.message || 'Failed to update profile');
      setSuccessMessage('');
    },
  });

  // Update privacy settings mutation
  const updatePrivacySettings = api.users.updatePrivacySettings.useMutation({
    onSuccess: () => {
      setSuccessMessage('Privacy settings updated successfully!');
      setErrorMessage('');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (error) => {
      setErrorMessage(error.message || 'Failed to update privacy settings');
      setSuccessMessage('');
    },
  });

  // Update location settings mutation
  const updateLocationSettings = api.users.updateLocationSettings.useMutation({
    onSuccess: () => {
      setSuccessMessage('Location settings updated successfully!');
      setErrorMessage('');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (error) => {
      setErrorMessage(error.message || 'Failed to update location settings');
      setSuccessMessage('');
    },
  });

  const handleSaveProfile = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      await updateProfile.mutateAsync({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        bio: bio.trim() || undefined,
        location: location.trim() || undefined,
      });
    } catch (error) {
      // Error is handled by onError callback in mutation
      console.error('Profile update failed:', error);
    }
  };

  const handleNotificationChange = (
    key: keyof NotificationSettings,
    value: boolean
  ) => {
    setNotifications((prev) => ({ ...prev, [key]: value }));
    // TODO: Save to backend when notification preferences API is ready
  };

  const handlePrivacyChange = async (
    key: keyof PrivacySettings,
    value: boolean
  ) => {
    setPrivacy((prev) => ({ ...prev, [key]: value }));

    // Update in backend
    const updateData: Record<string, boolean> = {};
    if (key === 'publicProfile') updateData.isPublic = value;
    if (key === 'showStats') updateData.showStats = value;
    if (key === 'showActivity') updateData.showActivity = value;
    if (key === 'allowMentions') updateData.allowMentions = value;

    try {
      await updatePrivacySettings.mutateAsync(updateData);
    } catch (_error) {
      // Revert on error
      setPrivacy((prev) => ({ ...prev, [key]: !value }));
    }
  };

  const handleDownloadData = () => {
    // TODO: Implement data export
    alert('Data download feature coming soon!');
  };

  const handleDeleteAccount = () => {
    // TODO: Implement account deletion
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );
    if (confirmed) {
      alert('Account deletion feature coming soon!');
    }
  };

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-[--color-background] flex items-center justify-center">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-[--color-primary] border-t-transparent"
          role="status"
          aria-label="Loading settings"
        ></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[--color-background] pb-20">
      {/* Header */}
      <div className="bg-[--color-surface] border-b border-[--color-border]">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/profile">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Profile
              </Link>
            </Button>
            <h1 className="text-2xl font-bold text-[--color-text-primary]">
              Account Settings
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {errorMessage}
          </div>
        )}

        {/* Profile Information */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <User className="h-5 w-5 text-[--color-primary]" />
              <h2 className="text-xl font-semibold text-[--color-text-primary]">
                Profile Information
              </h2>
            </div>

            <div className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-[--color-primary] flex items-center justify-center text-white text-xl font-bold overflow-hidden">
                    {user.imageUrl ? (
                      <Image
                        src={user.imageUrl}
                        alt={user.fullName || 'Profile'}
                        width={80}
                        height={80}
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <span>
                        {user.firstName?.[0] ||
                          user.emailAddresses[0]?.emailAddress[0]?.toUpperCase() ||
                          'U'}
                      </span>
                    )}
                  </div>
                  <button className="absolute bottom-0 right-0 w-6 h-6 bg-[--color-surface] border-2 border-[--color-border] rounded-full flex items-center justify-center hover:bg-[--color-surface-hover] transition-colors">
                    <Camera className="h-3 w-3 text-[--color-text-secondary]" />
                  </button>
                </div>
                <div>
                  <p className="text-sm text-[--color-text-secondary] mb-1">
                    Profile Picture
                  </p>
                  <p className="text-xs text-[--color-text-tertiary]">
                    Managed through your Clerk account
                  </p>
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter your first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              {/* Email (readonly) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  value={user.emailAddresses[0]?.emailAddress || ''}
                  disabled
                  className="bg-[--color-surface-hover] cursor-not-allowed"
                />
                <p className="text-xs text-[--color-text-tertiary]">
                  Email address is managed through your Clerk account
                </p>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell your community about yourself and your civic interests..."
                  className="min-h-[100px]"
                  maxLength={500}
                />
                <p className="text-xs text-[--color-text-tertiary]">
                  {bio.length}/500 characters
                </p>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., San Francisco, CA"
                />
              </div>

              <Button
                onClick={handleSaveProfile}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Eye className="h-5 w-5 text-[--color-primary]" />
              <h2 className="text-xl font-semibold text-[--color-text-primary]">
                Privacy Settings
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="publicProfile">Public Profile</Label>
                  <p className="text-sm text-[--color-text-secondary]">
                    Allow others to view your profile
                  </p>
                </div>
                <Switch
                  id="publicProfile"
                  checked={privacy.publicProfile}
                  onCheckedChange={(checked) =>
                    handlePrivacyChange('publicProfile', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="showStats">Show Activity Stats</Label>
                  <p className="text-sm text-[--color-text-secondary]">
                    Display your campaign and engagement statistics
                  </p>
                </div>
                <Switch
                  id="showStats"
                  checked={privacy.showStats}
                  onCheckedChange={(checked) =>
                    handlePrivacyChange('showStats', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="showActivity">Show Recent Activity</Label>
                  <p className="text-sm text-[--color-text-secondary]">
                    Display your recent campaigns and votes
                  </p>
                </div>
                <Switch
                  id="showActivity"
                  checked={privacy.showActivity}
                  onCheckedChange={(checked) =>
                    handlePrivacyChange('showActivity', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allowMentions">Allow Mentions</Label>
                  <p className="text-sm text-[--color-text-secondary]">
                    Let others mention you in comments and discussions
                  </p>
                </div>
                <Switch
                  id="allowMentions"
                  checked={privacy.allowMentions}
                  onCheckedChange={(checked) =>
                    handlePrivacyChange('allowMentions', checked)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Bell className="h-5 w-5 text-[--color-primary]" />
              <h2 className="text-xl font-semibold text-[--color-text-primary]">
                Notification Preferences
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="newVotes">New Votes on My Campaigns</Label>
                  <p className="text-sm text-[--color-text-secondary]">
                    Get notified when someone votes on your campaigns
                  </p>
                </div>
                <Switch
                  id="newVotes"
                  checked={notifications.newVotes}
                  onCheckedChange={(checked) =>
                    handleNotificationChange('newVotes', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="newComments">New Comments</Label>
                  <p className="text-sm text-[--color-text-secondary]">
                    Get notified about comments on your campaigns
                  </p>
                </div>
                <Switch
                  id="newComments"
                  checked={notifications.newComments}
                  onCheckedChange={(checked) =>
                    handleNotificationChange('newComments', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="nearbyAlerts">Nearby Campaign Alerts</Label>
                  <p className="text-sm text-[--color-text-secondary]">
                    Get notified about new campaigns in your area
                  </p>
                </div>
                <Switch
                  id="nearbyAlerts"
                  checked={notifications.nearbyAlerts}
                  onCheckedChange={(checked) =>
                    handleNotificationChange('nearbyAlerts', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="wonderUpdates">Wonder System Updates</Label>
                  <p className="text-sm text-[--color-text-secondary]">
                    Get notified about new Wonder questions and trends
                  </p>
                </div>
                <Switch
                  id="wonderUpdates"
                  checked={notifications.wonderUpdates}
                  onCheckedChange={(checked) =>
                    handleNotificationChange('wonderUpdates', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="weeklyDigest">Weekly Digest</Label>
                  <p className="text-sm text-[--color-text-secondary]">
                    Receive a weekly summary of platform activity
                  </p>
                </div>
                <Switch
                  id="weeklyDigest"
                  checked={notifications.weeklyDigest}
                  onCheckedChange={(checked) =>
                    handleNotificationChange('weeklyDigest', checked)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Settings */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <MapPin className="h-5 w-5 text-[--color-primary]" />
              <h2 className="text-xl font-semibold text-[--color-text-primary]">
                Location Settings
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoLocation">Auto-detect Location</Label>
                  <p className="text-sm text-[--color-text-secondary]">
                    Automatically detect your location for relevant campaigns
                  </p>
                </div>
                <Switch
                  id="autoLocation"
                  checked={userProfile?.autoDetectLocation ?? false}
                  onCheckedChange={async (checked) => {
                    try {
                      await updateLocationSettings.mutateAsync({
                        autoDetectLocation: checked,
                      });
                    } catch (error) {
                      // Handle error
                      console.error(
                        'Failed to update auto-detect location:',
                        error
                      );
                    }
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="showLocationProfile">
                    Show Location on Profile
                  </Label>
                  <p className="text-sm text-[--color-text-secondary]">
                    Display your location on your public profile
                  </p>
                </div>
                <Switch
                  id="showLocationProfile"
                  checked={userProfile?.showLocation ?? false}
                  onCheckedChange={async (checked) => {
                    try {
                      await updatePrivacySettings.mutateAsync({
                        showLocation: checked,
                      });
                    } catch (error) {
                      // Handle error
                      console.error('Failed to update show location:', error);
                    }
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Management */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="h-5 w-5 text-[--color-primary]" />
              <h2 className="text-xl font-semibold text-[--color-text-primary]">
                Account Management
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={handleDownloadData}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download My Data
                </Button>

                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </div>

              <div className="text-sm text-[--color-text-tertiary] space-y-1">
                <p>
                  • Download includes all your campaigns, votes, comments, and
                  profile data
                </p>
                <p>• Account deletion is permanent and cannot be undone</p>
                <p>• Password changes are managed through your Clerk account</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
