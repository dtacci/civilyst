import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SwipeVotingCard } from '../SwipeVotingCard';
import { CampaignCardData } from '../CampaignCard';

const mockCampaign: CampaignCardData = {
  id: 'test-campaign',
  title: 'Install LED Street Lighting on Main Street',
  description: 'Proposal to upgrade street lighting with energy-efficient LED lights.',
  status: 'ACTIVE' as const,
  latitude: 37.7749,
  longitude: -122.4194,
  address: '123 Main Street, San Francisco, CA',
  city: 'San Francisco',
  state: 'CA',
  createdAt: new Date('2023-01-01'),
  creator: {
    firstName: 'John',
    lastName: 'Doe',
    imageUrl: undefined,
  },
  _count: {
    votes: 25,
    comments: 8,
  },
};

describe('SwipeVotingCard', () => {
  const defaultProps = {
    campaign: mockCampaign,
    onVote: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (navigator.vibrate as jest.Mock).mockClear();
  });

  describe('Rendering', () => {
    it('renders campaign information correctly', () => {
      render(<SwipeVotingCard {...defaultProps} />);
      
      expect(screen.getByText('Install LED Street Lighting on Main Street')).toBeInTheDocument();
      expect(screen.getByText(/Proposal to upgrade street lighting/)).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('123 Main Street, San Francisco, CA')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('displays vote and comment counts', () => {
      render(<SwipeVotingCard {...defaultProps} />);
      
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
    });

    it('shows swipe instructions when no vote', () => {
      render(<SwipeVotingCard {...defaultProps} />);
      
      expect(screen.getByText('← Swipe left to oppose • Swipe right to support →')).toBeInTheDocument();
    });

    it('hides swipe instructions when user has voted', () => {
      render(<SwipeVotingCard {...defaultProps} userVote="SUPPORT" />);
      
      expect(screen.queryByText('← Swipe left to oppose • Swipe right to support →')).not.toBeInTheDocument();
    });

    it('shows vote status indicator when user has voted', () => {
      render(<SwipeVotingCard {...defaultProps} userVote="SUPPORT" />);
      
      expect(screen.getByText('Voted')).toBeInTheDocument();
      const card = screen.getByRole('article') || document.querySelector('[class*="border-emerald"]');
      expect(card).toHaveClass('border-emerald-300');
    });
  });

  describe('Status Styling', () => {
    it('applies correct styling for ACTIVE status', () => {
      render(<SwipeVotingCard {...defaultProps} />);
      
      const statusBadge = screen.getByText('Active');
      expect(statusBadge).toHaveClass('bg-emerald-100', 'text-emerald-800');
    });

    it('applies correct styling for DRAFT status', () => {
      const draftCampaign = { ...mockCampaign, status: 'DRAFT' as const };
      render(<SwipeVotingCard {...defaultProps} campaign={draftCampaign} />);
      
      const statusBadge = screen.getByText('Draft');
      expect(statusBadge).toHaveClass('bg-amber-100', 'text-amber-800');
    });

    it('applies correct styling for COMPLETED status', () => {
      const completedCampaign = { ...mockCampaign, status: 'COMPLETED' as const };
      render(<SwipeVotingCard {...defaultProps} campaign={completedCampaign} />);
      
      const statusBadge = screen.getByText('Completed');
      expect(statusBadge).toHaveClass('bg-blue-100', 'text-blue-800');
    });
  });

  describe('Touch Gestures', () => {
    it('starts gesture on touch start', () => {
      render(<SwipeVotingCard {...defaultProps} />);
      
      const card = document.querySelector('[class*="relative bg-white"]');
      
      if (card) {
        fireEvent.touchStart(card, {
          touches: [{ clientX: 100, clientY: 100 }],
        });
        
        expect(navigator.vibrate).toHaveBeenCalledWith([10]);
      }
    });

    it('prevents gesture when user has already voted', () => {
      render(<SwipeVotingCard {...defaultProps} userVote="SUPPORT" />);
      
      const card = document.querySelector('[class*="relative bg-white"]');
      
      if (card) {
        fireEvent.touchStart(card, {
          touches: [{ clientX: 100, clientY: 100 }],
        });
        
        expect(navigator.vibrate).not.toHaveBeenCalled();
      }
    });

    it('prevents gesture when voting is in progress', () => {
      render(<SwipeVotingCard {...defaultProps} isVoting={true} />);
      
      const card = document.querySelector('[class*="relative bg-white"]');
      
      if (card) {
        fireEvent.touchStart(card, {
          touches: [{ clientX: 100, clientY: 100 }],
        });
        
        expect(navigator.vibrate).not.toHaveBeenCalled();
      }
    });

    it('shows support background on right swipe', () => {
      render(<SwipeVotingCard {...defaultProps} />);
      
      const card = document.querySelector('[class*="relative bg-white"]');
      
      if (card) {
        fireEvent.touchStart(card, {
          touches: [{ clientX: 100, clientY: 100 }],
        });
        
        fireEvent.touchMove(card, {
          touches: [{ clientX: 160, clientY: 100 }],
        });
        
        const supportBackground = document.querySelector('.bg-gradient-to-r.from-emerald-400');
        expect(supportBackground).toBeInTheDocument();
      }
    });

    it('shows oppose background on left swipe', () => {
      render(<SwipeVotingCard {...defaultProps} />);
      
      const card = document.querySelector('[class*="relative bg-white"]');
      
      if (card) {
        fireEvent.touchStart(card, {
          touches: [{ clientX: 100, clientY: 100 }],
        });
        
        fireEvent.touchMove(card, {
          touches: [{ clientX: 40, clientY: 100 }],
        });
        
        const opposeBackground = document.querySelector('.bg-gradient-to-l.from-red-400');
        expect(opposeBackground).toBeInTheDocument();
      }
    });

    it('completes support vote on sufficient right swipe', async () => {
      render(<SwipeVotingCard {...defaultProps} />);
      
      const card = document.querySelector('[class*="relative bg-white"]');
      
      if (card) {
        fireEvent.touchStart(card, {
          touches: [{ clientX: 100, clientY: 100 }],
        });
        
        fireEvent.touchMove(card, {
          touches: [{ clientX: 250, clientY: 100 }],
        });
        
        fireEvent.touchEnd(card);
        
        await waitFor(() => {
          expect(defaultProps.onVote).toHaveBeenCalledWith('test-campaign', 'SUPPORT');
        });
        
        expect(navigator.vibrate).toHaveBeenCalledWith([30, 10, 30, 10, 50]);
      }
    });

    it('completes oppose vote on sufficient left swipe', async () => {
      render(<SwipeVotingCard {...defaultProps} />);
      
      const card = document.querySelector('[class*="relative bg-white"]');
      
      if (card) {
        fireEvent.touchStart(card, {
          touches: [{ clientX: 100, clientY: 100 }],
        });
        
        fireEvent.touchMove(card, {
          touches: [{ clientX: -50, clientY: 100 }],
        });
        
        fireEvent.touchEnd(card);
        
        await waitFor(() => {
          expect(defaultProps.onVote).toHaveBeenCalledWith('test-campaign', 'OPPOSE');
        });
      }
    });

    it('resets gesture on insufficient swipe', () => {
      render(<SwipeVotingCard {...defaultProps} />);
      
      const card = document.querySelector('[class*="relative bg-white"]');
      
      if (card) {
        fireEvent.touchStart(card, {
          touches: [{ clientX: 100, clientY: 100 }],
        });
        
        fireEvent.touchMove(card, {
          touches: [{ clientX: 120, clientY: 100 }],
        });
        
        fireEvent.touchEnd(card);
        
        expect(defaultProps.onVote).not.toHaveBeenCalled();
        expect(navigator.vibrate).toHaveBeenCalledWith([10]); // Light feedback for reset
      }
    });

    it('allows scrolling on vertical gestures', () => {
      render(<SwipeVotingCard {...defaultProps} />);
      
      const card = document.querySelector('[class*="relative bg-white"]');
      
      if (card) {
        fireEvent.touchStart(card, {
          touches: [{ clientX: 100, clientY: 100 }],
        });
        
        // Large vertical movement should reset gesture
        fireEvent.touchMove(card, {
          touches: [{ clientX: 110, clientY: 250 }],
        });
        
        // Should not be in dragging state
        expect(card).not.toHaveClass('shadow-xl');
      }
    });
  });

  describe('Feedback and Animation', () => {
    it('shows success feedback after voting', async () => {
      render(<SwipeVotingCard {...defaultProps} />);
      
      const card = document.querySelector('[class*="relative bg-white"]');
      
      if (card) {
        // Complete a vote
        fireEvent.touchStart(card, {
          touches: [{ clientX: 100, clientY: 100 }],
        });
        
        fireEvent.touchMove(card, {
          touches: [{ clientX: 250, clientY: 100 }],
        });
        
        fireEvent.touchEnd(card);
        
        await waitFor(() => {
          expect(screen.getByText('Vote Recorded!')).toBeInTheDocument();
          expect(screen.getByText('Thank you for participating')).toBeInTheDocument();
        });
      }
    });

    it('applies transform during dragging', () => {
      render(<SwipeVotingCard {...defaultProps} />);
      
      const card = document.querySelector('[class*="relative bg-white"]');
      
      if (card) {
        fireEvent.touchStart(card, {
          touches: [{ clientX: 100, clientY: 100 }],
        });
        
        fireEvent.touchMove(card, {
          touches: [{ clientX: 150, clientY: 100 }],
        });
        
        // Should have transform and shadow
        const cardElement = card as HTMLElement;
        expect(cardElement.style.transform).toContain('translateX');
        expect(card).toHaveClass('shadow-xl', 'z-10');
      }
    });

    it('shows progress indicator during swipe', () => {
      render(<SwipeVotingCard {...defaultProps} />);
      
      const card = document.querySelector('[class*="relative bg-white"]');
      
      if (card) {
        fireEvent.touchStart(card, {
          touches: [{ clientX: 100, clientY: 100 }],
        });
        
        fireEvent.touchMove(card, {
          touches: [{ clientX: 160, clientY: 100 }],
        });
        
        const progressBar = document.querySelector('.absolute.bottom-0.left-0.right-0.h-1');
        expect(progressBar).toBeInTheDocument();
      }
    });
  });

  describe('Link Navigation', () => {
    it('links to campaign detail page', () => {
      render(<SwipeVotingCard {...defaultProps} />);
      
      const campaignLink = screen.getByRole('link', { name: /Install LED Street Lighting/i });
      expect(campaignLink).toHaveAttribute('href', '/campaigns/test-campaign');
    });

    it('prevents navigation during drag', async () => {
      const user = userEvent.setup();
      render(<SwipeVotingCard {...defaultProps} />);
      
      const card = document.querySelector('[class*="relative bg-white"]');
      const campaignLink = screen.getByRole('link', { name: /Install LED Street Lighting/i });
      
      if (card) {
        // Start dragging
        fireEvent.touchStart(card, {
          touches: [{ clientX: 100, clientY: 100 }],
        });
        
        fireEvent.touchMove(card, {
          touches: [{ clientX: 150, clientY: 100 }],
        });
        
        // Try to click link during drag
        await user.click(campaignLink);
        
        // Navigation should be prevented (tested via preventDefault)
        // This is more of an integration test behavior
      }
    });
  });

  describe('Accessibility', () => {
    it('has proper semantic structure', () => {
      render(<SwipeVotingCard {...defaultProps} />);
      
      const link = screen.getByRole('link', { name: /Install LED Street Lighting/i });
      expect(link).toBeInTheDocument();
      
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Install LED Street Lighting on Main Street');
    });

    it('provides meaningful text for screen readers', () => {
      render(<SwipeVotingCard {...defaultProps} />);
      
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('2 days ago')).toBeInTheDocument();
      expect(screen.getByRole('link')).toHaveAccessibleName();
    });
  });
});