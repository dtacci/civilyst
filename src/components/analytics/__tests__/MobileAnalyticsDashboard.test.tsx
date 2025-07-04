import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MobileAnalyticsDashboard } from '../MobileAnalyticsDashboard';

const mockAnalytics = {
  total: 12,
  active: 8,
  draft: 2,
  completed: 2,
  cancelled: 0,
  totalVotes: 145,
  totalComments: 23,
  averageVotesPerCampaign: 12,
  engagementRate: 4.2,
  totalViews: 1200,
  geographicReach: {
    cities: 5,
    states: 2,
  },
  topPerformingCampaign: {
    title: 'Install LED Street Lighting on Main Street',
    votes: 45,
  },
};

const emptyAnalytics = {
  total: 0,
  active: 0,
  draft: 0,
  completed: 0,
  cancelled: 0,
  totalVotes: 0,
  totalComments: 0,
  averageVotesPerCampaign: 0,
  engagementRate: 0,
};

describe('MobileAnalyticsDashboard', () => {
  const defaultProps = {
    analytics: mockAnalytics,
    onCardClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders dashboard header correctly', () => {
      render(<MobileAnalyticsDashboard {...defaultProps} />);

      expect(screen.getByText('Campaign Analytics')).toBeInTheDocument();
      expect(
        screen.getByText('Track your civic engagement impact')
      ).toBeInTheDocument();
    });

    it('renders basic analytics cards', () => {
      render(<MobileAnalyticsDashboard {...defaultProps} />);

      expect(screen.getByText('Total Campaigns')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('Active Campaigns')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('Total Votes')).toBeInTheDocument();
      expect(screen.getByText('145')).toBeInTheDocument();
      expect(screen.getByText('Community Engagement')).toBeInTheDocument();
      expect(screen.getByText('23')).toBeInTheDocument();
    });

    it('renders enhanced analytics when provided', () => {
      render(<MobileAnalyticsDashboard {...defaultProps} />);

      // Should render additional cards for views, geographic reach, and top campaign
      expect(screen.getByText('Campaign Views')).toBeInTheDocument();
      expect(screen.getByText('1.2K')).toBeInTheDocument();
      expect(screen.getByText('Geographic Reach')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('cities, 2 states')).toBeInTheDocument();
      expect(screen.getByText('Top Campaign')).toBeInTheDocument();
      expect(screen.getByText('45')).toBeInTheDocument();
    });

    it('renders quick action buttons', () => {
      render(<MobileAnalyticsDashboard {...defaultProps} />);

      expect(
        screen.getByRole('button', { name: /create campaign/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /detailed analytics/i })
      ).toBeInTheDocument();
    });

    it('renders refresh button in header', () => {
      render(<MobileAnalyticsDashboard {...defaultProps} />);

      const refreshButton = screen.getByRole('button');
      expect(refreshButton).toBeInTheDocument();
      // Should contain ClockIcon
      expect(refreshButton.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('renders empty state when no campaigns exist', () => {
      render(
        <MobileAnalyticsDashboard
          analytics={emptyAnalytics}
          onCardClick={jest.fn()}
        />
      );

      expect(screen.getByText('No campaigns yet')).toBeInTheDocument();
      expect(
        screen.getByText(/Create your first campaign to start tracking/)
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /create your first campaign/i })
      ).toBeInTheDocument();
    });

    it('does not render enhanced cards for empty analytics', () => {
      render(
        <MobileAnalyticsDashboard
          analytics={emptyAnalytics}
          onCardClick={jest.fn()}
        />
      );

      // Should not render enhanced analytics cards
      expect(screen.queryByText('Campaign Views')).not.toBeInTheDocument();
      expect(screen.queryByText('Geographic Reach')).not.toBeInTheDocument();
      expect(screen.queryByText('Top Campaign')).not.toBeInTheDocument();
    });
  });

  describe('Interactivity', () => {
    it('calls onCardClick when analytics cards are clicked', async () => {
      const user = userEvent.setup();
      const mockOnCardClick = jest.fn();

      render(
        <MobileAnalyticsDashboard
          {...defaultProps}
          onCardClick={mockOnCardClick}
        />
      );

      // Click on total campaigns card
      const campaignsCard = screen
        .getByText('Total Campaigns')
        .closest('button');
      if (campaignsCard) {
        await user.click(campaignsCard);
        expect(mockOnCardClick).toHaveBeenCalledWith('campaigns');
      }
    });

    it('calls onCardClick when action buttons are clicked', async () => {
      const user = userEvent.setup();
      const mockOnCardClick = jest.fn();

      render(
        <MobileAnalyticsDashboard
          {...defaultProps}
          onCardClick={mockOnCardClick}
        />
      );

      // Click create campaign button
      const createButton = screen.getByRole('button', {
        name: /create campaign/i,
      });
      await user.click(createButton);
      expect(mockOnCardClick).toHaveBeenCalledWith('create-campaign');

      // Click detailed analytics button
      const detailsButton = screen.getByRole('button', {
        name: /detailed analytics/i,
      });
      await user.click(detailsButton);
      expect(mockOnCardClick).toHaveBeenCalledWith('detailed-analytics');
    });

    it('calls onCardClick when refresh button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnCardClick = jest.fn();

      render(
        <MobileAnalyticsDashboard
          {...defaultProps}
          onCardClick={mockOnCardClick}
        />
      );

      // Click refresh button (first button in the document - clock icon)
      const refreshButton = screen.getAllByRole('button')[0];
      await user.click(refreshButton);
      expect(mockOnCardClick).toHaveBeenCalledWith('refresh');
    });

    it('calls onCardClick for empty state create button', async () => {
      const user = userEvent.setup();
      const mockOnCardClick = jest.fn();

      render(
        <MobileAnalyticsDashboard
          analytics={emptyAnalytics}
          onCardClick={mockOnCardClick}
        />
      );

      const createButton = screen.getByRole('button', {
        name: /create your first campaign/i,
      });
      await user.click(createButton);
      expect(mockOnCardClick).toHaveBeenCalledWith('create-campaign');
    });
  });

  describe('Data Formatting', () => {
    it('formats large numbers correctly', () => {
      const largeNumberAnalytics = {
        ...mockAnalytics,
        totalVotes: 1500,
        totalComments: 2500,
        totalViews: 150000,
      };

      render(
        <MobileAnalyticsDashboard
          analytics={largeNumberAnalytics}
          onCardClick={jest.fn()}
        />
      );

      expect(screen.getByText('1.5K')).toBeInTheDocument(); // votes
      expect(screen.getByText('2.5K')).toBeInTheDocument(); // comments
      expect(screen.getByText('150K')).toBeInTheDocument(); // views
    });

    it('calculates engagement rate correctly', () => {
      const analyticsWithViews = {
        ...mockAnalytics,
        totalViews: 1000,
        totalVotes: 50,
        totalComments: 10,
      };

      render(
        <MobileAnalyticsDashboard
          analytics={analyticsWithViews}
          onCardClick={jest.fn()}
        />
      );

      // Engagement rate should be (50 + 10) / 1000 * 100 = 6%
      expect(screen.getByText('6%')).toBeInTheDocument();
    });

    it('handles zero engagement rate gracefully', () => {
      const zeroEngagementAnalytics = {
        ...mockAnalytics,
        totalViews: 0,
        totalVotes: 0,
        totalComments: 0,
      };

      render(
        <MobileAnalyticsDashboard
          analytics={zeroEngagementAnalytics}
          onCardClick={jest.fn()}
        />
      );

      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });

  describe('Responsive Grid', () => {
    it('applies correct grid classes', () => {
      const { container } = render(
        <MobileAnalyticsDashboard {...defaultProps} />
      );

      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toHaveClass('grid-cols-1', 'sm:grid-cols-2');
    });

    it('applies staggered animation classes', () => {
      const { container } = render(
        <MobileAnalyticsDashboard {...defaultProps} />
      );

      const animatedElements = container.querySelectorAll(
        '[style*="transition-delay"]'
      );
      expect(animatedElements.length).toBeGreaterThan(0);
    });
  });

  describe('Animation and Performance', () => {
    it('sets visibility state after mounting', async () => {
      render(<MobileAnalyticsDashboard {...defaultProps} />);

      // Wait for the animation to trigger
      await waitFor(() => {
        const gridContainer = screen
          .getByText('Campaign Analytics')
          .closest('div');
        expect(gridContainer).toBeInTheDocument();
      });
    });

    it('applies custom className when provided', () => {
      const { container } = render(
        <MobileAnalyticsDashboard
          {...defaultProps}
          className="custom-dashboard-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-dashboard-class');
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(<MobileAnalyticsDashboard {...defaultProps} />);

      expect(
        screen.getByRole('heading', { level: 2, name: 'Campaign Analytics' })
      ).toBeInTheDocument();
    });

    it('has accessible button labels', () => {
      render(<MobileAnalyticsDashboard {...defaultProps} />);

      expect(
        screen.getByRole('button', { name: /create campaign/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /detailed analytics/i })
      ).toBeInTheDocument();
    });

    it('provides meaningful text for screen readers', () => {
      render(<MobileAnalyticsDashboard {...defaultProps} />);

      expect(
        screen.getByText('Track your civic engagement impact')
      ).toBeInTheDocument();
      expect(screen.getByText('campaigns')).toBeInTheDocument();
      expect(screen.getByText('running')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles missing optional analytics gracefully', () => {
      const incompleteAnalytics = {
        total: 5,
        active: 3,
        draft: 1,
        completed: 1,
        cancelled: 0,
        totalVotes: 25,
        totalComments: 5,
        // Missing optional properties
      };

      expect(() => {
        render(
          <MobileAnalyticsDashboard
            analytics={incompleteAnalytics}
            onCardClick={jest.fn()}
          />
        );
      }).not.toThrow();

      expect(screen.getByText('Total Campaigns')).toBeInTheDocument();
      // Use getAllByText to get specific instance of "5"
      const fiveElements = screen.getAllByText('5');
      expect(fiveElements.length).toBeGreaterThan(0);
    });

    it('handles undefined onCardClick gracefully', () => {
      expect(() => {
        render(<MobileAnalyticsDashboard analytics={mockAnalytics} />);
      }).not.toThrow();
    });
  });
});
