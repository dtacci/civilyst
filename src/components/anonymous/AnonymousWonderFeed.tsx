'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Sparkles, Clock, MapPin, Tag } from 'lucide-react';
import { api } from '~/lib/trpc';
import { getOrCreateDeviceId } from '~/lib/trust/deviceFingerprint';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@clerk/nextjs';
import { toast } from '~/lib/toast';

export function AnonymousWonderFeed() {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const { isSignedIn } = useAuth();

  // Get anonymous wonders for this device
  const { data: anonymousData, isLoading } = api.wonders.getAnonymousWonders.useQuery(
    { deviceId: deviceId ?? '' },
    { enabled: !!deviceId }
  );

  // Claim wonders mutation
  const claimWonders = api.wonders.claimAnonymousWonders.useMutation({
    onSuccess: (data) => {
      toast.success(`Successfully claimed ${data.claimed} wonders!`);
    },
    onError: (error) => {
      toast.error('Failed to claim wonders: ' + error.message);
    },
  });

  useEffect(() => {
    const initDevice = async () => {
      const id = await getOrCreateDeviceId();
      setDeviceId(id);
    };
    initDevice();
  }, []);

  const handleClaimAll = async () => {
    if (!deviceId) return;
    claimWonders.mutate({ deviceId });
  };

  if (isLoading || !deviceId) {
    return (
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[--color-primary] border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!anonymousData?.wonders || anonymousData.wonders.length === 0) {
    return null;
  }

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[--font-size-lg] font-semibold text-[--color-text-primary] flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[--color-primary]" />
            Your Anonymous Wonders
          </h3>
          {isSignedIn && (
            <Button
              size="sm"
              onClick={handleClaimAll}
              disabled={claimWonders.isPending}
            >
              Claim All
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {anonymousData.wonders.map((wonder) => (
            <div
              key={wonder.id}
              className="p-4 rounded-[--border-radius-md] bg-[--color-surface] border border-[--color-border]"
            >
              <p className="text-[--color-text-primary] mb-3">{wonder.content}</p>
              
              <div className="flex flex-wrap gap-4 text-[--font-size-sm] text-[--color-text-secondary]">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatDistanceToNow(new Date(wonder.createdAt), { addSuffix: true })}
                </div>
                
                {wonder.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Location shared
                  </div>
                )}
                
                <div className="flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  {wonder.category.toLowerCase()}
                </div>
              </div>

              {wonder.claimedBy && (
                <div className="mt-3 text-[--font-size-sm] text-[--color-accent]">
                  ✓ Claimed
                </div>
              )}
            </div>
          ))}
        </div>

        {!isSignedIn && (
          <div className="mt-6 p-4 bg-[--color-primary-light] rounded-[--border-radius-md]">
            <p className="text-[--font-size-sm] text-[--color-primary] text-center">
              Sign up to claim these wonders and boost your trust score by 30%!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}