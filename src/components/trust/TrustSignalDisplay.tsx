'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '~/components/ui/card';
import { 
  MapPin, 
  Clock, 
  ThumbsUp, 
  User, 
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { api } from '~/lib/trpc';
import { getOrCreateDeviceId } from '~/lib/trust/deviceFingerprint';

interface TrustSignal {
  icon: React.ReactNode;
  label: string;
  status: 'verified' | 'unverified' | 'pending';
  value: number;
  description: string;
}

export function TrustSignalDisplay() {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [trustScore, setTrustScore] = useState(0);
  const [signals, setSignals] = useState<TrustSignal[]>([]);

  // Get anonymous wonders for this device
  const { data: anonymousData, isLoading } = api.wonders.getAnonymousWonders.useQuery(
    { deviceId: deviceId ?? '' },
    { enabled: !!deviceId }
  );

  useEffect(() => {
    const initDevice = async () => {
      const id = await getOrCreateDeviceId();
      setDeviceId(id);
    };
    initDevice();
  }, []);

  useEffect(() => {
    if (anonymousData) {
      setTrustScore(anonymousData.trustScore);
      
      // Build trust signals based on data
      const newSignals: TrustSignal[] = [
        {
          icon: <MapPin className="h-5 w-5" />,
          label: 'Location Verified',
          status: anonymousData.wonders.some(w => w.location) ? 'verified' : 'unverified',
          value: 0.2,
          description: 'Share your location to build local trust',
        },
        {
          icon: <Clock className="h-5 w-5" />,
          label: 'Return Visitor',
          status: anonymousData.wonders.length > 1 ? 'verified' : 'pending',
          value: 0.1,
          description: 'Regular participation builds credibility',
        },
        {
          icon: <ThumbsUp className="h-5 w-5" />,
          label: 'Quality Content',
          status: anonymousData.wonders.length > 0 ? 'verified' : 'pending',
          value: 0.1,
          description: 'Share thoughtful wonders to earn trust',
        },
        {
          icon: <User className="h-5 w-5" />,
          label: 'Profile Created',
          status: 'unverified',
          value: 0.3,
          description: 'Sign up to claim your wonders and boost trust',
        },
      ];
      
      setSignals(newSignals);
    }
  }, [anonymousData]);

  const getStatusIcon = (status: TrustSignal['status']) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-[--color-accent]" />;
      case 'unverified':
        return <XCircle className="h-4 w-4 text-[--color-text-tertiary]" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-[--color-warning]" />;
    }
  };

  const getStatusColor = (status: TrustSignal['status']) => {
    switch (status) {
      case 'verified':
        return 'text-[--color-accent]';
      case 'unverified':
        return 'text-[--color-text-tertiary]';
      case 'pending':
        return 'text-[--color-warning]';
    }
  };

  if (isLoading || !deviceId) {
    return null;
  }

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-[--color-primary]" />
            <h3 className="text-[--font-size-lg] font-semibold text-[--color-text-primary]">
              Your Trust Score
            </h3>
          </div>
          <div className="text-[--font-size-2xl] font-bold text-[--color-primary]">
            {Math.round(trustScore * 100)}%
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[--color-surface] rounded-full h-3 mb-6">
          <div
            className="bg-gradient-to-r from-[--color-primary] to-[--color-accent] h-3 rounded-full transition-all duration-500"
            style={{ width: `${trustScore * 100}%` }}
          />
        </div>

        {/* Trust Signals */}
        <div className="space-y-3">
          {signals.map((signal, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-[--border-radius-md] bg-[--color-surface] hover:bg-[--color-surface-hover] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={getStatusColor(signal.status)}>
                  {signal.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[--color-text-primary]">
                      {signal.label}
                    </span>
                    {getStatusIcon(signal.status)}
                  </div>
                  <p className="text-[--font-size-sm] text-[--color-text-secondary]">
                    {signal.description}
                  </p>
                </div>
              </div>
              <div className="text-[--font-size-sm] text-[--color-text-tertiary]">
                +{Math.round(signal.value * 100)}%
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        {trustScore < 0.3 && (
          <div className="mt-6 p-4 bg-[--color-primary-light] rounded-[--border-radius-md]">
            <p className="text-[--font-size-sm] text-[--color-primary] text-center">
              Continue sharing wonders and engaging with your community to build trust!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}