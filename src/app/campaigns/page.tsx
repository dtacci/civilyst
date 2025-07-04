'use client';

import { CampaignDiscoveryMap } from '~/components/map/CampaignDiscoveryMap';
import { AsyncBoundary } from '~/components/error';
import { MobileNav } from '~/components/features/navigation/mobile-nav';
import { FloatingActionButton } from '~/components/ui/floating-action-button';
import { FloatingShareFab } from '~/components/features/sharing/floating-share-fab';
import { useRouter } from 'next/navigation';

export default function CampaignsPage() {
  const router = useRouter();

  // Mobile-first action handlers
  const handleVoiceCapture = () => {
    // TODO: Implement voice-to-campaign creation
    console.log(
      'Voice capture initiated - Future: Voice-powered campaign creation'
    );
  };

  const handlePhotoCapture = () => {
    // TODO: Implement AI photo-to-campaign generation
    console.log(
      'Photo capture initiated - Future: AI vision for campaign content'
    );
  };

  const handleLocationCapture = () => {
    // TODO: Implement location-based campaign creation
    console.log(
      'Location capture initiated - Future: Location-aware campaign creation'
    );
  };

  const handleAIAssist = () => {
    // TODO: Implement AI-powered campaign suggestions
    console.log(
      'AI assist initiated - Future: AI-powered campaign optimization'
    );
  };

  const handleQuickCreate = () => {
    router.push('/campaigns/create');
  };

  const handleFeedback = () => {
    // TODO: Implement feedback system
    console.log(
      'Feedback initiated - Future: User feedback and improvement suggestions'
    );
  };

  const handleVoiceSearch = (query: string) => {
    // TODO: Implement voice search for campaigns
    console.log('Voice search:', query);
  };

  const handleSearch = (query: string) => {
    // TODO: Implement campaign search
    console.log('Search:', query);
  };

  return (
    <div className="relative min-h-screen bg-[--color-background]">
      {/* Mobile Navigation Header */}
      <MobileNav
        onVoiceSearch={handleVoiceSearch}
        onSearch={handleSearch}
        user={{
          name: 'Demo User', // TODO: Replace with actual user data
          email: 'demo@example.com',
        }}
        notifications={3} // TODO: Replace with actual notification count
      />

      {/* Main Content */}
      <main className="pb-20">
        {' '}
        {/* Bottom padding for mobile nav */}
        <AsyncBoundary
          loadingFallback={
            <div className="flex items-center justify-center min-h-[calc(100vh-140px)]">
              <div className="text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[--color-primary] border-t-transparent mx-auto mb-4"></div>
                <p className="text-[--color-text-secondary] text-[--font-size-sm]">
                  Loading campaigns map...
                </p>
              </div>
            </div>
          }
          errorFallback={
            <div className="flex items-center justify-center min-h-[calc(100vh-140px)]">
              <div className="text-center max-w-md mx-4">
                <h2 className="text-[--font-size-xl] font-semibold text-[--color-text-primary] mb-2">
                  Map Unavailable
                </h2>
                <p className="text-[--color-text-secondary] text-[--font-size-base]">
                  The campaigns map could not be loaded. Please try refreshing
                  the page.
                </p>
              </div>
            </div>
          }
        >
          <CampaignDiscoveryMap />
        </AsyncBoundary>
      </main>

      {/* Floating Action Button - Mobile-First Quick Actions */}
      <FloatingActionButton
        onVoiceCapture={handleVoiceCapture}
        onPhotoCapture={handlePhotoCapture}
        onLocationCapture={handleLocationCapture}
        onAIAssist={handleAIAssist}
        onQuickCreate={handleQuickCreate}
        onFeedback={handleFeedback}
        variant="ai-powered"
      />

      {/* Floating Share FAB - Viral Civic Engagement */}
      <FloatingShareFab
        data={{
          id: 'platform',
          title: 'Civilyst - Revolutionary Civic Engagement',
          description:
            'Join the mobile-first platform transforming how citizens engage with local campaigns and democracy.',
          url: `${typeof window !== 'undefined' ? window.location.origin : ''}/campaigns`,
          tags: ['civic-engagement', 'democracy', 'mobile-first', 'ai-powered'],
          voteCount: 1247, // Sample engagement count
          creatorName: 'Civilyst Community',
        }}
        showOnScroll={true}
        scrollThreshold={200}
        className="z-[--z-floating]"
      />
    </div>
  );
}
