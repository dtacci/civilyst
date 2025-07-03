'use client';

import { useState } from 'react';
import { VotingInterface } from '~/components/ui/voting-interface';
import { SwipeVotingCard } from '~/components/campaigns/SwipeVotingCard';
import { CampaignCardData } from '~/components/campaigns/CampaignCard';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
// Simple Badge component inline
const Badge = ({
  children,
  variant = 'default',
  className = '',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive';
  className?: string;
}) => (
  <span
    className={cn(
      'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
      variant === 'default' && 'bg-blue-100 text-blue-800',
      variant === 'secondary' && 'bg-slate-100 text-slate-800',
      variant === 'destructive' && 'bg-red-100 text-red-800',
      className
    )}
  >
    {children}
  </span>
);
import {
  Smartphone,
  Zap,
  Heart,
  Users,
  RotateCcw,
  CheckCircle,
  XCircle,
  Info,
} from 'lucide-react';
import { cn } from '~/lib/utils';

export default function VotingInterfaceDemo() {
  const [votes, setVotes] = useState<
    Record<string, { type: 'SUPPORT' | 'OPPOSE'; count: number }>
  >({
    'voting-demo': { type: 'SUPPORT', count: 47 },
    'swipe-demo': { type: 'SUPPORT', count: 23 },
  });

  const [votingStates, setVotingStates] = useState<Record<string, boolean>>({});

  const handleVote = async (
    campaignId: string,
    voteType: 'SUPPORT' | 'OPPOSE'
  ) => {
    setVotingStates((prev) => ({ ...prev, [campaignId]: true }));

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setVotes((prev) => ({
      ...prev,
      [campaignId]: {
        type: voteType,
        count: (prev[campaignId]?.count || 0) + 1,
      },
    }));

    setVotingStates((prev) => ({ ...prev, [campaignId]: false }));
  };

  const resetVotes = () => {
    setVotes({});
    setVotingStates({});
  };

  // Mock campaign data
  const mockCampaign: CampaignCardData = {
    id: 'swipe-demo',
    title: 'Install LED Street Lighting on Main Street',
    description:
      'Proposal to upgrade the current street lighting system on Main Street with energy-efficient LED lights to improve safety and reduce energy costs for our community.',
    status: 'ACTIVE' as const,
    latitude: 37.7749,
    longitude: -122.4194,
    address: '123 Main Street, San Francisco, CA',
    city: 'San Francisco',
    state: 'CA',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    creator: {
      firstName: 'Sarah',
      lastName: 'Johnson',
      imageUrl: undefined,
    },
    _count: {
      votes: votes['swipe-demo']?.count || 23,
      comments: 8,
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Smartphone className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">
              Enhanced Touch-Optimized Voting
            </h1>
          </div>

          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Experience the next generation of mobile civic engagement with
            gesture-based voting, haptic feedback, and intelligent visual cues.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Badge variant="secondary" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Gesture Recognition
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Haptic Feedback
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Visual Feedback
            </Badge>
          </div>

          <Button onClick={resetVotes} variant="outline" className="mt-4">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Demo
          </Button>
        </div>

        {/* Demo Grid */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Standard Voting Interface */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Zap className="h-5 w-5 text-blue-600" />
                </div>
                Standard Interface
              </CardTitle>
              <p className="text-sm text-slate-600">
                Classic button-based voting with enhanced haptics and animations
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <VotingInterface
                campaignId="voting-demo"
                currentVoteCount={votes['voting-demo']?.count || 47}
                userVote={votes['voting-demo']?.type}
                isVoting={votingStates['voting-demo']}
                onVote={(voteType) => handleVote('voting-demo', voteType)}
                variant="default"
              />

              <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                <h4 className="font-semibold text-slate-900 mb-2">Features:</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Enhanced button feedback with particle effects</li>
                  <li>• Success haptic patterns</li>
                  <li>• Animated vote confirmation</li>
                  <li>• Touch target optimization</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Gesture Voting Interface */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 border-b">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Heart className="h-5 w-5 text-emerald-600" />
                </div>
                Gesture Interface
              </CardTitle>
              <p className="text-sm text-slate-600">
                Revolutionary swipe-to-vote with velocity detection and visual
                feedback
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <VotingInterface
                campaignId="gesture-demo"
                currentVoteCount={votes['gesture-demo']?.count || 34}
                userVote={votes['gesture-demo']?.type}
                isVoting={votingStates['gesture-demo']}
                onVote={(voteType) => handleVote('gesture-demo', voteType)}
                variant="gesture"
              />

              <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                <h4 className="font-semibold text-slate-900 mb-2">
                  Advanced Features:
                </h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Velocity-based gesture completion</li>
                  <li>• Progressive haptic feedback</li>
                  <li>• Real-time visual progress indicators</li>
                  <li>• Particle explosion effects</li>
                  <li>• Smart quick-swipe detection</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Swipe Card Demo */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              Campaign Swipe Cards
            </CardTitle>
            <p className="text-slate-600">
              Full campaign cards with integrated swipe-to-vote functionality
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <SwipeVotingCard
                campaign={mockCampaign}
                onVote={handleVote}
                userVote={votes['swipe-demo']?.type}
                isVoting={votingStates['swipe-demo']}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    Swipe Right (Support)
                  </h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• Emerald background reveals</li>
                    <li>• Smooth transform animations</li>
                    <li>• Success particle effects</li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    Swipe Left (Oppose)
                  </h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• Red background reveals</li>
                    <li>• Responsive gesture feedback</li>
                    <li>• Error pattern on incomplete swipes</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Info className="h-5 w-5 text-slate-600" />
              </div>
              Technical Implementation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 border border-slate-200 rounded-lg">
                <h4 className="font-semibold text-slate-900 mb-2">
                  Touch Events
                </h4>
                <p className="text-sm text-slate-600">
                  Advanced touch handling with velocity calculation and gesture
                  recognition
                </p>
              </div>

              <div className="p-4 border border-slate-200 rounded-lg">
                <h4 className="font-semibold text-slate-900 mb-2">
                  Haptic Patterns
                </h4>
                <p className="text-sm text-slate-600">
                  Multiple vibration patterns for different interaction states
                </p>
              </div>

              <div className="p-4 border border-slate-200 rounded-lg">
                <h4 className="font-semibold text-slate-900 mb-2">
                  Visual Feedback
                </h4>
                <p className="text-sm text-slate-600">
                  Real-time animations, progress indicators, and particle
                  effects
                </p>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Mobile-First Design:</strong> All interactions are
                optimized for touch devices with 44px minimum touch targets,
                safe area support, and responsive gesture thresholds.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Vote Summary */}
        {Object.keys(votes).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Demo Vote Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {Object.entries(votes).map(([campaignId, vote]) => (
                  <div
                    key={campaignId}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <span className="font-medium text-slate-900 capitalize">
                      {campaignId.replace('-', ' ')}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          vote.type === 'SUPPORT' ? 'default' : 'destructive'
                        }
                        className="flex items-center gap-1"
                      >
                        {vote.type === 'SUPPORT' ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        {vote.type}
                      </Badge>
                      <span className="text-sm text-slate-600">
                        {vote.count} votes
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
