'use client';

import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { MessageSquare, Sparkles, ArrowRight } from 'lucide-react';
import { VoiceRecorder } from './VoiceRecorder';
import { Textarea } from '~/components/ui/textarea';
import { api } from '~/lib/trpc';
import { toast } from '~/lib/toast';
import { getOrCreateDeviceId } from '~/lib/trust/deviceFingerprint';

interface AnonymousWonderCTAProps {
  onSuccess?: () => void;
}

export function AnonymousWonderCTA({ onSuccess }: AnonymousWonderCTAProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [wonderText, setWonderText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [voiceUrl, setVoiceUrl] = useState<string | null>(null);

  const createAnonymousWonder = api.wonders.createAnonymous.useMutation({
    onSuccess: () => {
      toast.success('Your wonder has been shared!');
      setIsExpanded(false);
      setWonderText('');
      setVoiceUrl(null);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error('Failed to share wonder: ' + error.message);
    },
  });

  const handleSubmit = async () => {
    if (!wonderText.trim() && !voiceUrl) {
      toast.error('Please share your wonder using voice or text');
      return;
    }

    const deviceId = await getOrCreateDeviceId();
    
    // Get location if permission granted
    let location = null;
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 5000,
          enableHighAccuracy: true,
        });
      });
      
      location = {
        type: 'Point',
        coordinates: [position.coords.longitude, position.coords.latitude],
      };
    } catch (error) {
      console.log('Location not available:', error);
    }

    createAnonymousWonder.mutate({
      deviceId,
      content: wonderText,
      voiceUrl,
      location,
    });
  };

  const handleVoiceRecording = (audioUrl: string, transcript?: string) => {
    setVoiceUrl(audioUrl);
    if (transcript) {
      setWonderText(transcript);
    }
  };

  if (!isExpanded) {
    return (
      <Card className="bg-gradient-to-r from-[--color-primary] to-[--color-secondary] text-white border-0 mb-8">
        <CardContent className="p-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 animate-pulse" />
          </div>
          <h2 className="text-[--font-size-2xl] font-bold mb-4">
            Wonder Without Signing Up
          </h2>
          <p className="text-[--font-size-lg] mb-6 opacity-90">
            Share your vision for your community instantly. No account needed.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="text-[--color-primary]"
            onClick={() => setIsExpanded(true)}
          >
            <MessageSquare className="h-5 w-5 mr-2" />
            Share Your Wonder
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <h3 className="text-[--font-size-xl] font-semibold mb-4 text-[--color-text-primary]">
          What do you wonder about your community?
        </h3>
        
        <div className="space-y-4">
          {/* Voice Recording Option */}
          <div className="flex items-center gap-4">
            <VoiceRecorder
              onRecordingComplete={handleVoiceRecording}
              onRecordingStart={() => setIsRecording(true)}
              onRecordingStop={() => setIsRecording(false)}
            />
            <span className="text-[--font-size-sm] text-[--color-text-secondary]">
              {isRecording ? 'Recording...' : 'Tap to record your wonder'}
            </span>
          </div>

          {/* Text Input Option */}
          <Textarea
            placeholder="Or type your wonder here... What would make your neighborhood better?"
            value={wonderText}
            onChange={(e) => setWonderText(e.target.value)}
            className="min-h-[100px] text-[--font-size-base]"
            disabled={isRecording}
          />

          {/* Trust Building Message */}
          <div className="bg-[--color-primary-light] p-4 rounded-[--border-radius-md] text-[--font-size-sm]">
            <p className="text-[--color-primary] font-medium mb-1">
              🔒 Your privacy is protected
            </p>
            <p className="text-[--color-text-secondary]">
              Share anonymously now, claim your wonder later if you choose to sign up.
              Build trust through your contributions.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={createAnonymousWonder.isPending || (!wonderText.trim() && !voiceUrl)}
              className="flex-1"
            >
              {createAnonymousWonder.isPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                  Sharing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Share Wonder
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsExpanded(false);
                setWonderText('');
                setVoiceUrl(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}