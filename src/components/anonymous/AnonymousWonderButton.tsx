'use client';

import React, { useState } from 'react';
import { Sparkles, Mic, Type, MapPin, X } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Textarea } from '~/components/ui/textarea';
import { api } from '~/lib/trpc';
import {
  getDeviceId,
  isFingerprintingAvailable,
} from '~/lib/trust/deviceFingerprint';
import { WonderCategory, WonderTimeContext } from '~/generated/prisma';
import { toast } from '~/lib/toast';
import { VoiceRecorder } from '~/components/wonder/VoiceRecorder';

interface AnonymousWonderButtonProps {
  className?: string;
  variant?: 'default' | 'hero' | 'floating';
}

export function AnonymousWonderButton({
  className = '',
  variant = 'default',
}: AnonymousWonderButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text');
  const [content, setContent] = useState('');
  const [voiceUrl, setVoiceUrl] = useState<string | null>(null);
  const [category, setCategory] = useState<WonderCategory>(
    WonderCategory.GENERAL
  );
  const [timeContext, setTimeContext] = useState<WonderTimeContext>(
    WonderTimeContext.ANYTIME
  );
  const [shareLocation, setShareLocation] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );

  const createWonderMutation = api.wonders.createAnonymous.useMutation({
    onSuccess: () => {
      toast.success(
        'Wonder shared! 🌟 Your anonymous wonder has been shared with the community.'
      );
      setIsOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Error sharing wonder: ' + error.message);
    },
  });

  const resetForm = () => {
    setContent('');
    setVoiceUrl(null);
    setCategory('GENERAL');
    setTimeContext('ANYTIME');
    setShareLocation(false);
    setLocation(null);
  };

  const handleLocationToggle = async () => {
    if (!shareLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setShareLocation(true);
        },
        () => {
          toast.error(
            'Location access denied. You can still share your wonder without location.'
          );
        }
      );
    } else {
      setShareLocation(false);
      setLocation(null);
    }
  };

  const handleSubmit = async () => {
    if (!content && !voiceUrl) {
      toast.error(
        "Please share your wonder. Use text or voice to describe what you're wondering about."
      );
      return;
    }

    if (!isFingerprintingAvailable()) {
      toast.error(
        'Browser not supported. Please use a modern browser to share anonymous wonders.'
      );
      return;
    }

    const deviceId = await getDeviceId();

    createWonderMutation.mutate({
      deviceId,
      content: content || '',
      voiceUrl: voiceUrl || undefined,
      category,
      timeContext,
      location: location
        ? {
            type: 'Point',
            coordinates: [location.lng, location.lat],
          }
        : undefined,
    });
  };

  const getButtonContent = () => {
    switch (variant) {
      case 'hero':
        return (
          <>
            <Sparkles className="w-6 h-6 mr-2" />
            Share Your Wonder Without Signing Up
          </>
        );
      case 'floating':
        return <Sparkles className="w-6 h-6" />;
      default:
        return (
          <>
            <Sparkles className="w-5 h-5 mr-2" />
            Wonder Anonymously
          </>
        );
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className={`
          ${variant === 'hero' ? 'text-lg px-8 py-6 bg-purple-600 hover:bg-purple-700' : ''}
          ${variant === 'floating' ? 'rounded-full w-14 h-14 p-0 shadow-lg' : ''}
          ${className}
        `}
        size={variant === 'hero' ? 'lg' : 'default'}
      >
        {getButtonContent()}
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Share Your Wonder ✨</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  No signup required - just share what you&apos;re wondering
                  about
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Trust Badge */}
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-purple-700 dark:text-purple-300">
                  🔒 Your privacy is protected
                </span>
                <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                  Anonymous
                </span>
              </div>
            </div>

            {/* Input Mode Toggle */}
            <div className="flex gap-2 mb-4">
              <Button
                variant={inputMode === 'text' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setInputMode('text')}
              >
                <Type className="w-4 h-4 mr-1" />
                Text
              </Button>
              <Button
                variant={inputMode === 'voice' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setInputMode('voice')}
              >
                <Mic className="w-4 h-4 mr-1" />
                Voice
              </Button>
            </div>

            {/* Input Area */}
            {inputMode === 'text' ? (
              <Textarea
                placeholder="What would make your community better? What are you wondering about?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[120px] mb-4"
              />
            ) : (
              <div className="mb-4">
                <VoiceRecorder
                  onResponse={async (audioUrl, textResponse) => {
                    if (audioUrl) setVoiceUrl(audioUrl);
                    if (textResponse) setContent(textResponse);
                  }}
                  isLoading={false}
                />
              </div>
            )}

            {/* Category Selection */}
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">Category</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.values(WonderCategory).map((cat) => (
                  <Button
                    key={cat}
                    variant={category === cat ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCategory(cat)}
                    className="text-xs"
                  >
                    {cat.toLowerCase()}
                  </Button>
                ))}
              </div>
            </div>

            {/* Time Context */}
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">
                When is this relevant?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {Object.values(WonderTimeContext).map((time) => (
                  <Button
                    key={time}
                    variant={timeContext === time ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeContext(time)}
                    className="text-xs"
                  >
                    {time.toLowerCase()}
                  </Button>
                ))}
              </div>
            </div>

            {/* Location Toggle */}
            <div className="mb-6">
              <Button
                variant={shareLocation ? 'default' : 'outline'}
                size="sm"
                onClick={handleLocationToggle}
                className="w-full"
              >
                <MapPin className="w-4 h-4 mr-2" />
                {shareLocation
                  ? 'Location shared'
                  : 'Share location (optional)'}
              </Button>
              {shareLocation && (
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Helps connect you with local community members
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={
                createWonderMutation.isPending || (!content && !voiceUrl)
              }
              className="w-full"
              size="lg"
            >
              {createWonderMutation.isPending ? (
                'Sharing...'
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Share Wonder Anonymously
                </>
              )}
            </Button>

            {/* Privacy Note */}
            <p className="text-xs text-gray-500 text-center mt-4">
              You can claim this wonder later by creating a free account.
              We&apos;ll give you a claim code after submission.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
