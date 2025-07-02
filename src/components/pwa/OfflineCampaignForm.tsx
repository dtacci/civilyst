'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Save, Upload, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { useToast } from '~/components/ui/toast';
import { pwaManager } from '~/lib/pwa-enhanced';
import { cn } from '~/lib/utils';

interface CampaignFormData {
  title: string;
  description: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  } | null;
  category: string;
  deadline?: Date;
}

interface OfflineCampaignFormProps {
  onSubmit?: (data: CampaignFormData) => Promise<void>;
  initialData?: Partial<CampaignFormData>;
  draftId?: string;
  className?: string;
}

export function OfflineCampaignForm({
  onSubmit,
  initialData,
  draftId = 'campaign-draft',
  className,
}: OfflineCampaignFormProps) {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<CampaignFormData>({
    title: '',
    description: '',
    location: null,
    category: '',
    ...initialData,
  });

  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (formData.title.trim() || formData.description.trim()) {
        saveDraft();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [formData]);

  // Load draft on mount
  useEffect(() => {
    loadDraft();
  }, []);

  const saveDraft = useCallback(async () => {
    try {
      await pwaManager.saveDraftOffline(draftId, formData);
      setIsDraftSaved(true);
      setLastSaved(new Date());
      
      toast({
        title: 'Draft saved',
        description: 'Your campaign draft has been saved locally',
        variant: 'default',
      });
    } catch (error) {
      console.error('Failed to save draft:', error);
      toast({
        title: 'Save failed',
        description: 'Could not save draft locally',
        variant: 'destructive',
      });
    }
  }, [formData, draftId]);

  const loadDraft = useCallback(async () => {
    try {
      const drafts = await pwaManager.getOfflineDrafts();
      const draft = drafts.find(d => d.id === draftId);
      
      if (draft && draft.data) {
        setFormData(draft.data as CampaignFormData);
        setLastSaved(new Date(draft.timestamp));
        toast({
          title: 'Draft loaded',
          description: 'Restored your previous campaign draft',
          variant: 'default',
        });
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
  }, [draftId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please fill in the title and description',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (isOnline && onSubmit) {
        // Submit directly if online
        await onSubmit(formData);
        toast({
          title: 'Campaign created',
          description: 'Your campaign has been published successfully',
          variant: 'default',
        });
        
        // Clear draft after successful submission
        clearDraft();
      } else {
        // Queue for sync if offline
        await pwaManager.addToSyncQueue('campaign_create', formData);
        toast({
          title: 'Queued for sync',
          description: 'Your campaign will be published when you come back online',
          variant: 'default',
        });
      }
    } catch (error) {
      console.error('Failed to submit campaign:', error);
      
      // Add to sync queue as fallback
      await pwaManager.addToSyncQueue('campaign_create', formData);
      toast({
        title: 'Queued for retry',
        description: 'Your campaign will be retried automatically',
        variant: 'default',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearDraft = async () => {
    try {
      await pwaManager.saveDraftOffline(draftId, null);
      setFormData({
        title: '',
        description: '',
        location: null,
        category: '',
      });
      setIsDraftSaved(false);
      setLastSaved(null);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  };

  const updateFormData = (updates: Partial<CampaignFormData>) => {
    setFormData((prev: CampaignFormData) => ({ ...prev, ...updates }));
    setIsDraftSaved(false);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Connection Status */}
      <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
        <div className="flex items-center space-x-2">
          {isOnline ? (
            <Wifi className="h-4 w-4 text-green-600" />
          ) : (
            <WifiOff className="h-4 w-4 text-orange-600" />
          )}
          <span className="text-sm font-medium">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        
        {lastSaved && (
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <Save className="h-3 w-3" />
            <span>Saved {lastSaved.toLocaleTimeString()}</span>
          </div>
        )}
      </div>

      {/* Offline Notice */}
      {!isOnline && (
        <div className="flex items-start space-x-3 p-4 rounded-lg bg-orange-50 border border-orange-200">
          <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-orange-900">Working offline</p>
            <p className="text-orange-800">
              Your campaign will be saved locally and published when you reconnect
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium">
            Campaign Title *
          </label>
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => updateFormData({ title: e.target.value })}
            placeholder="Enter campaign title..."
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium">
            Description *
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => updateFormData({ description: e.target.value })}
            placeholder="Describe your campaign..."
            rows={4}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <label htmlFor="category" className="text-sm font-medium">
            Category
          </label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) => updateFormData({ category: e.target.value })}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select category...</option>
            <option value="infrastructure">Infrastructure</option>
            <option value="environment">Environment</option>
            <option value="community">Community</option>
            <option value="transportation">Transportation</option>
            <option value="safety">Safety</option>
            <option value="education">Education</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex justify-between">
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={saveDraft}
              disabled={!formData.title.trim() && !formData.description.trim()}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
            
            {isDraftSaved && (
              <Button
                type="button"
                variant="ghost"
                onClick={clearDraft}
                className="text-muted-foreground"
              >
                Clear Draft
              </Button>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || (!formData.title.trim() || !formData.description.trim())}
          >
            {isSubmitting ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-spin" />
                {isOnline ? 'Publishing...' : 'Queueing...'}
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {isOnline ? 'Publish Campaign' : 'Queue for Publish'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}