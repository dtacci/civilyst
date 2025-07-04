'use client';

import { api } from '~/lib/trpc';
import { SignUpButton, useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { MobileNav } from '~/components/features/navigation/mobile-nav';
import { FloatingActionButton } from '~/components/ui/floating-action-button';
import { AnonymousWonderButton } from '~/components/anonymous/AnonymousWonderButton';
import { TrustSignalDisplay } from '~/components/trust/TrustSignalDisplay';
import { AnonymousWonderFeed } from '~/components/anonymous/AnonymousWonderFeed';
import { useRouter } from 'next/navigation';
import {
  Zap,
  MapPin,
  Users,
  Vote,
  Smartphone,
  Mic,
  Camera,
  Heart,
  Shield,
  Globe,
} from 'lucide-react';

export default function Home() {
  const healthCheck = api.health.check.useQuery();
  const { isSignedIn } = useAuth();
  const router = useRouter();

  // Mobile-first action handlers for homepage
  const handleVoiceCapture = () => {
    if (isSignedIn) {
      router.push('/campaigns/create?voice=true');
    } else {
      // Development logging only
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Home] Voice capture - requires login');
      }
    }
  };

  const handlePhotoCapture = () => {
    if (isSignedIn) {
      router.push('/campaigns/create?photo=true');
    } else {
      // Development logging only
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Home] Photo capture - requires login');
      }
    }
  };

  const handleLocationCapture = () => {
    if (isSignedIn) {
      router.push('/campaigns/create?location=true');
    } else {
      // Development logging only
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Home] Location capture - requires login');
      }
    }
  };

  const handleAIAssist = () => {
    router.push('/campaigns?ai=true');
  };

  const handleQuickCreate = () => {
    if (isSignedIn) {
      router.push('/campaigns/create');
    } else {
      router.push('/sign-up');
    }
  };

  const handleFeedback = () => {
    // Development logging only
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Home] Feedback - Future: User feedback system');
    }
  };

  const handleVoiceSearch = (query: string) => {
    router.push(`/campaigns?search=${encodeURIComponent(query)}`);
  };

  const handleSearch = (query: string) => {
    router.push(`/campaigns?search=${encodeURIComponent(query)}`);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[--color-background] via-[--color-surface] to-[--color-primary-light]">
      {/* Mobile Navigation */}
      <MobileNav
        onVoiceSearch={handleVoiceSearch}
        onSearch={handleSearch}
        user={
          isSignedIn
            ? {
                name: 'User', // TODO: Replace with actual user data
                email: 'user@example.com',
              }
            : undefined
        }
      />

      {/* Hero Section - Mobile-First */}
      <main className="pb-20 pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Hero Header */}
            <section className="text-center mb-16">
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 bg-[--color-primary-light] text-[--color-primary] px-4 py-2 rounded-[--border-radius-full] text-[--font-size-sm] font-medium mb-6">
                  <Zap className="h-4 w-4" />
                  Mobile-First Civic Engagement
                </div>
                <h1 className="text-[--font-size-4xl] md:text-[--font-size-5xl] font-bold text-[--color-text-primary] mb-4 leading-[--line-height-tight]">
                  Transform Your Community with
                  <span className="text-[--color-primary]">
                    {' '}
                    Voice-Powered{' '}
                  </span>
                  Civic Action
                </h1>
                <p className="text-[--font-size-xl] text-[--color-text-secondary] max-w-2xl mx-auto leading-[--line-height-relaxed]">
                  The first mobile-native platform for civic engagement. Create
                  campaigns with your voice, discover local issues through AI,
                  and drive real change in your community.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                {isSignedIn ? (
                  <>
                    <Button asChild size="lg" className="w-full sm:w-auto">
                      <Link
                        href="/campaigns"
                        className="flex items-center gap-2"
                      >
                        <MapPin className="h-5 w-5" />
                        Explore Campaigns
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto"
                    >
                      <Link href="/dashboard">Dashboard</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <AnonymousWonderButton variant="hero" />
                    <SignUpButton mode="modal">
                      <Button
                        size="lg"
                        variant="secondary"
                        className="w-full sm:w-auto"
                      >
                        <Mic className="h-5 w-5 mr-2" />
                        Sign Up for More
                      </Button>
                    </SignUpButton>
                  </>
                )}
              </div>

              {/* System Status - Mobile Optimized */}
              <Card className="mb-16">
                <CardContent className="p-6">
                  <h2 className="text-[--font-size-lg] font-semibold mb-4 text-[--color-text-primary]">
                    System Status
                  </h2>
                  {healthCheck.isLoading && (
                    <div className="flex items-center justify-center py-4">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[--color-primary] border-t-transparent mr-3"></div>
                      <span className="text-[--color-text-secondary]">
                        Checking system health...
                      </span>
                    </div>
                  )}
                  {healthCheck.error && (
                    <div className="flex items-center justify-center py-4 text-[--color-danger]">
                      <Shield className="h-5 w-5 mr-2" />
                      Error: {healthCheck.error.message}
                    </div>
                  )}
                  {healthCheck.data && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center">
                        <div className="w-3 h-3 bg-[--color-accent] rounded-full mr-3 animate-pulse"></div>
                        <span className="text-[--color-accent] font-medium">
                          🚀 All Systems Operational
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[--font-size-sm] text-[--color-text-tertiary]">
                        <div>
                          Last checked:{' '}
                          {new Date(
                            healthCheck.data.timestamp
                          ).toLocaleTimeString()}
                        </div>
                        <div>
                          Uptime: {Math.floor(healthCheck.data.uptime / 60)}{' '}
                          minutes
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* Feature Cards - Mobile-First Grid */}
            <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-16">
              {/* Voice-Powered Creation */}
              <Card interactive ripple className="group">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-[--color-primary-light] rounded-[--border-radius-lg] flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-[--duration-normal]">
                    <Mic className="h-6 w-6 text-[--color-primary]" />
                  </div>
                  <h3 className="text-[--font-size-lg] font-semibold mb-3 text-[--color-text-primary]">
                    Voice-Powered Creation
                  </h3>
                  <p className="text-[--color-text-secondary] text-[--font-size-sm]">
                    Create campaigns in seconds using natural voice commands.
                    Perfect for accessibility and on-the-go engagement.
                  </p>
                </CardContent>
              </Card>

              {/* AI-Enhanced Discovery */}
              <Card interactive ripple className="group">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-[--color-secondary-light] rounded-[--border-radius-lg] flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-[--duration-normal]">
                    <Camera className="h-6 w-6 text-[--color-secondary]" />
                  </div>
                  <h3 className="text-[--font-size-lg] font-semibold mb-3 text-[--color-text-primary]">
                    AI Vision & Content
                  </h3>
                  <p className="text-[--color-text-secondary] text-[--font-size-sm]">
                    Take a photo and let AI suggest campaign content, optimize
                    visuals, and enhance accessibility.
                  </p>
                </CardContent>
              </Card>

              {/* Location-Aware Engagement */}
              <Card interactive ripple className="group">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-[--color-accent-light] rounded-[--border-radius-lg] flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-[--duration-normal]">
                    <MapPin className="h-6 w-6 text-[--color-accent]" />
                  </div>
                  <h3 className="text-[--font-size-lg] font-semibold mb-3 text-[--color-text-primary]">
                    Smart Location Discovery
                  </h3>
                  <p className="text-[--color-text-secondary] text-[--font-size-sm]">
                    Discover campaigns near you, get location-based
                    notifications, and engage with your immediate community.
                  </p>
                </CardContent>
              </Card>

              {/* Touch-Optimized Voting */}
              <Card interactive ripple className="group">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-[--color-warning-light] rounded-[--border-radius-lg] flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-[--duration-normal]">
                    <Vote className="h-6 w-6 text-[--color-warning]" />
                  </div>
                  <h3 className="text-[--font-size-lg] font-semibold mb-3 text-[--color-text-primary]">
                    Gesture-Based Voting
                  </h3>
                  <p className="text-[--color-text-secondary] text-[--font-size-sm]">
                    Swipe to vote, touch to engage. Intuitive mobile
                    interactions make civic participation effortless.
                  </p>
                </CardContent>
              </Card>

              {/* Real-Time Community */}
              <Card interactive ripple className="group">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-[--color-info-light] rounded-[--border-radius-lg] flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-[--duration-normal]">
                    <Users className="h-6 w-6 text-[--color-info]" />
                  </div>
                  <h3 className="text-[--font-size-lg] font-semibold mb-3 text-[--color-text-primary]">
                    Real-Time Community
                  </h3>
                  <p className="text-[--color-text-secondary] text-[--font-size-sm]">
                    Live updates, instant notifications, and real-time
                    collaboration with your community.
                  </p>
                </CardContent>
              </Card>

              {/* Progressive Web App */}
              <Card interactive ripple className="group">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-[--color-primary-light] rounded-[--border-radius-lg] flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-[--duration-normal]">
                    <Smartphone className="h-6 w-6 text-[--color-primary]" />
                  </div>
                  <h3 className="text-[--font-size-lg] font-semibold mb-3 text-[--color-text-primary]">
                    Native App Experience
                  </h3>
                  <p className="text-[--color-text-secondary] text-[--font-size-sm]">
                    Install on any device for native app performance with
                    offline support and push notifications.
                  </p>
                </CardContent>
              </Card>
            </section>

            {/* Call-to-Action Section */}
            <section className="text-center">
              <Card className="bg-gradient-to-r from-[--color-primary] to-[--color-secondary] text-white border-0">
                <CardContent className="p-8">
                  <div className="flex items-center justify-center mb-4">
                    <Heart className="h-8 w-8 mr-2" />
                    <Globe className="h-8 w-8" />
                  </div>
                  <h2 className="text-[--font-size-2xl] font-bold mb-4">
                    Ready to Transform Your Community?
                  </h2>
                  <p className="text-[--font-size-lg] mb-6 opacity-90">
                    Join thousands of citizens already making a difference
                    through mobile-first civic engagement.
                  </p>
                  {!isSignedIn && (
                    <SignUpButton mode="modal">
                      <Button
                        size="lg"
                        variant="secondary"
                        className="text-[--color-primary]"
                      >
                        <Mic className="h-5 w-5 mr-2" />
                        Get Started Today
                      </Button>
                    </SignUpButton>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* Trust Building Section */}
            <section>
              <TrustSignalDisplay />
              <AnonymousWonderFeed />
            </section>
          </div>
        </div>
      </main>

      {/* Floating Action Button */}
      <FloatingActionButton
        onVoiceCapture={handleVoiceCapture}
        onPhotoCapture={handlePhotoCapture}
        onLocationCapture={handleLocationCapture}
        onAIAssist={handleAIAssist}
        onQuickCreate={handleQuickCreate}
        onFeedback={handleFeedback}
        variant="voice-first"
      />
    </div>
  );
}
