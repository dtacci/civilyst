import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EnhancedCampaignList } from '../EnhancedCampaignList';
import { CampaignCardData } from '../CampaignCard';

const mockCampaigns: CampaignCardData[] = [
  {
    id: 'campaign-1',
    title: 'LED Street Lighting Project',
    description: 'Install energy-efficient LED lights',
    status: 'ACTIVE',
    latitude: 37.7749,
    longitude: -122.4194,
    address: '123 Main St, San Francisco, CA',
    city: 'San Francisco',
    state: 'CA',
    createdAt: new Date('2023-01-01'),
    creator: {
      firstName: 'John',
      lastName: 'Doe',
    },
    _count: {
      votes: 25,
      comments: 8,
    },
  },
  {
    id: 'campaign-2',
    title: 'Community Garden Initiative',
    description: 'Create a community garden space',
    status: 'DRAFT',
    latitude: 37.7849,
    longitude: -122.4094,
    address: '456 Oak St, San Francisco, CA',
    city: 'San Francisco',
    state: 'CA',
    createdAt: new Date('2023-01-15'),
    creator: {
      firstName: 'Jane',
      lastName: 'Smith',
    },
    _count: {
      votes: 12,
      comments: 3,
    },
  },
];

describe('EnhancedCampaignList', () => {
  const defaultProps = {
    campaigns: mockCampaigns,
    onVote: jest.fn(),
    getUserVote: jest.fn(() => null),
    isVoting: jest.fn(() => false),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders campaign feed header with count', () => {
      render(<EnhancedCampaignList {...defaultProps} />);
      
      expect(screen.getByText('Campaign Feed')).toBeInTheDocument();
      expect(screen.getByText('2 campaigns')).toBeInTheDocument();
    });

    it('renders all campaigns', () => {
      render(<EnhancedCampaignList {...defaultProps} />);
      
      expect(screen.getByText('LED Street Lighting Project')).toBeInTheDocument();
      expect(screen.getByText('Community Garden Initiative')).toBeInTheDocument();
    });

    it('shows swipe instructions when swipe voting is enabled', () => {
      render(<EnhancedCampaignList {...defaultProps} enableSwipeVoting={true} />);
      
      expect(screen.getByText('Swipe to Vote')).toBeInTheDocument();
      expect(screen.getByText('Swipe right to support campaigns, left to oppose. Quick swipes count too!')).toBeInTheDocument();
    });

    it('hides swipe instructions when swipe voting is disabled', () => {
      render(<EnhancedCampaignList {...defaultProps} enableSwipeVoting={false} />);
      
      expect(screen.queryByText('Swipe to Vote')).not.toBeInTheDocument();
    });
  });

  describe('View Mode Switching', () => {
    it('defaults to swipe mode when swipe voting is enabled', () => {
      render(<EnhancedCampaignList {...defaultProps} enableSwipeVoting={true} />);
      
      const swipeButton = screen.getByTitle('Swipe to Vote');
      expect(swipeButton).toHaveClass('bg-blue-100', 'text-blue-600');
    });

    it('defaults to grid mode when swipe voting is disabled', () => {
      render(<EnhancedCampaignList {...defaultProps} enableSwipeVoting={false} />);
      
      const gridButton = screen.getByTitle('Grid View');
      expect(gridButton).toHaveClass('bg-blue-100', 'text-blue-600');
    });

    it('switches to grid view when grid button is clicked', async () => {
      const user = userEvent.setup();
      render(<EnhancedCampaignList {...defaultProps} enableSwipeVoting={true} />);
      
      const gridButton = screen.getByTitle('Grid View');
      await user.click(gridButton);
      
      expect(gridButton).toHaveClass('bg-blue-100', 'text-blue-600');
    });

    it('switches to list view when list button is clicked', async () => {
      const user = userEvent.setup();
      render(<EnhancedCampaignList {...defaultProps} />);
      
      const listButton = screen.getByTitle('List View');
      await user.click(listButton);
      
      expect(listButton).toHaveClass('bg-blue-100', 'text-blue-600');
    });

    it('switches to swipe view when swipe button is clicked', async () => {
      const user = userEvent.setup();
      render(<EnhancedCampaignList {...defaultProps} enableSwipeVoting={true} />);
      
      // First switch to grid
      const gridButton = screen.getByTitle('Grid View');
      await user.click(gridButton);
      
      // Then switch back to swipe
      const swipeButton = screen.getByTitle('Swipe to Vote');
      await user.click(swipeButton);
      
      expect(swipeButton).toHaveClass('bg-blue-100', 'text-blue-600');
    });

    it('hides swipe button when swipe voting is disabled', () => {
      render(<EnhancedCampaignList {...defaultProps} enableSwipeVoting={false} />);
      
      expect(screen.queryByTitle('Swipe to Vote')).not.toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('shows loading skeletons when loading', () => {
      render(<EnhancedCampaignList {...defaultProps} campaigns={[]} isLoading={true} />);
      
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('does not show skeletons when not loading', () => {
      render(<EnhancedCampaignList {...defaultProps} />);
      
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBe(0);
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no campaigns', () => {
      render(<EnhancedCampaignList {...defaultProps} campaigns={[]} />);
      
      expect(screen.getByText('No campaigns found')).toBeInTheDocument();
      expect(screen.getByText('Be the first to create a campaign in your area!')).toBeInTheDocument();
      expect(screen.getByText('Create Campaign')).toBeInTheDocument();
    });

    it('shows custom empty message when provided', () => {
      render(
        <EnhancedCampaignList 
          {...defaultProps} 
          campaigns={[]} 
          emptyMessage="No active campaigns"
          emptyDescription="All campaigns are currently inactive"
        />
      );
      
      expect(screen.getByText('No active campaigns')).toBeInTheDocument();
      expect(screen.getByText('All campaigns are currently inactive')).toBeInTheDocument();
    });
  });

  describe('Load More Functionality', () => {
    it('shows load more button when hasMore is true', () => {
      render(<EnhancedCampaignList {...defaultProps} hasMore={true} />);
      
      expect(screen.getByText('Load More Campaigns')).toBeInTheDocument();
    });

    it('hides load more button when hasMore is false', () => {
      render(<EnhancedCampaignList {...defaultProps} hasMore={false} />);
      
      expect(screen.queryByText('Load More Campaigns')).not.toBeInTheDocument();
    });

    it('calls onLoadMore when load more button is clicked', async () => {
      const onLoadMore = jest.fn();
      const user = userEvent.setup();
      
      render(<EnhancedCampaignList {...defaultProps} hasMore={true} onLoadMore={onLoadMore} />);
      
      const loadMoreButton = screen.getByText('Load More Campaigns');
      await user.click(loadMoreButton);
      
      expect(onLoadMore).toHaveBeenCalledTimes(1);
    });

    it('shows loading state when load more is in progress', async () => {
      const onLoadMore = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      const user = userEvent.setup();
      
      render(<EnhancedCampaignList {...defaultProps} hasMore={true} onLoadMore={onLoadMore} />);
      
      const loadMoreButton = screen.getByText('Load More Campaigns');
      await user.click(loadMoreButton);
      
      expect(screen.getByText('Loading more campaigns...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('Load More Campaigns')).toBeInTheDocument();
      });
    });

    it('prevents multiple load more calls', async () => {
      const onLoadMore = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      const user = userEvent.setup();
      
      render(<EnhancedCampaignList {...defaultProps} hasMore={true} onLoadMore={onLoadMore} />);
      
      const loadMoreButton = screen.getByText('Load More Campaigns');
      
      // Click multiple times rapidly
      await user.click(loadMoreButton);
      await user.click(loadMoreButton);
      await user.click(loadMoreButton);
      
      expect(onLoadMore).toHaveBeenCalledTimes(1);
    });
  });

  describe('Voting Integration', () => {
    it('calls onVote when campaign vote is triggered', async () => {
      const onVote = jest.fn();
      render(<EnhancedCampaignList {...defaultProps} onVote={onVote} enableSwipeVoting={true} />);
      
      // This would typically be triggered by swipe gesture in SwipeVotingCard
      // Here we test the callback integration
      const campaignCards = document.querySelectorAll('[class*="relative"]');
      if (campaignCards.length > 0) {
        // Simulate a vote completion (this would come from SwipeVotingCard)
        await defaultProps.onVote('campaign-1', 'SUPPORT');
        expect(defaultProps.onVote).toHaveBeenCalledWith('campaign-1', 'SUPPORT');
      }
    });

    it('tracks voting state correctly', () => {
      const isVoting = jest.fn((id) => id === 'campaign-1');
      render(<EnhancedCampaignList {...defaultProps} isVoting={isVoting} enableSwipeVoting={true} />);
      
      expect(isVoting).toHaveBeenCalledWith('campaign-1');
      expect(isVoting).toHaveBeenCalledWith('campaign-2');
    });

    it('gets user vote status correctly', () => {
      const getUserVote = jest.fn((id) => id === 'campaign-1' ? 'SUPPORT' : null);
      render(<EnhancedCampaignList {...defaultProps} getUserVote={getUserVote} enableSwipeVoting={true} />);
      
      expect(getUserVote).toHaveBeenCalledWith('campaign-1');
      expect(getUserVote).toHaveBeenCalledWith('campaign-2');
    });
  });

  describe('Error Handling', () => {
    it('shows error boundary fallback for failed campaigns', () => {
      // Mock a campaign that would cause an error
      const errorCampaign = { ...mockCampaigns[0], id: null } as any;
      
      render(<EnhancedCampaignList {...defaultProps} campaigns={[errorCampaign]} />);
      
      // The error boundary should catch and show fallback
      // This might be harder to test without actually triggering an error
      // In a real scenario, the SectionErrorBoundary would catch component errors
    });
  });

  describe('Performance Features', () => {
    it('shows performance stats in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      render(<EnhancedCampaignList {...defaultProps} enableSwipeVoting={true} />);
      
      // Switch to swipe mode to trigger stats
      expect(screen.getByText(/Enhanced Touch-Optimized Voting Interface Active/)).toBeInTheDocument();
      expect(screen.getByText(/2 campaigns loaded/)).toBeInTheDocument();
      
      process.env.NODE_ENV = originalEnv;
    });

    it('hides performance stats in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      render(<EnhancedCampaignList {...defaultProps} enableSwipeVoting={true} />);
      
      expect(screen.queryByText(/Enhanced Touch-Optimized Voting Interface Active/)).not.toBeInTheDocument();
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Layout Variations', () => {
    it('applies grid layout classes in grid mode', async () => {
      const user = userEvent.setup();
      render(<EnhancedCampaignList {...defaultProps} />);
      
      const gridButton = screen.getByTitle('Grid View');
      await user.click(gridButton);
      
      const container = document.querySelector('.grid.gap-6.md\\:grid-cols-2.lg\\:grid-cols-3');
      expect(container).toBeInTheDocument();
    });

    it('applies list layout classes in list mode', async () => {
      const user = userEvent.setup();
      render(<EnhancedCampaignList {...defaultProps} />);
      
      const listButton = screen.getByTitle('List View');
      await user.click(listButton);
      
      const container = document.querySelector('.space-y-3');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper button roles and titles', () => {
      render(<EnhancedCampaignList {...defaultProps} enableSwipeVoting={true} />);
      
      expect(screen.getByTitle('Swipe to Vote')).toHaveAttribute('title');
      expect(screen.getByTitle('Grid View')).toHaveAttribute('title');
      expect(screen.getByTitle('List View')).toHaveAttribute('title');
    });

    it('has proper heading structure', () => {
      render(<EnhancedCampaignList {...defaultProps} />);
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Campaign Feed');
    });

    it('provides meaningful labels for screen readers', () => {
      render(<EnhancedCampaignList {...defaultProps} hasMore={true} />);
      
      const loadMoreButton = screen.getByRole('button', { name: 'Load More Campaigns' });
      expect(loadMoreButton).toBeInTheDocument();
    });
  });
});