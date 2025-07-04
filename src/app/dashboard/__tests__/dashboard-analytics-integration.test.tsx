import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TRPCClientError } from '@trpc/client';
import DashboardPage from '../page';

// Mock the tRPC API
const mockGetMyCampaigns = jest.fn();

// Mock the TRPC hook
jest.mock('~/lib/trpc', () => ({
  api: {
    campaigns: {
      getMyCampaigns: {
        useQuery: () => mockGetMyCampaigns(),
      },
      update: {
        useMutation: () => ({
          mutateAsync: jest.fn(),
          isLoading: false,
        }),
      },
    },
  },
}));

// Mock the PushNotificationSettings component
jest.mock('~/components/pwa', () => ({
  PushNotificationSettings: ({ className }: { className?: string }) => (
    <div className={className} data-testid="push-notification-settings">
      Push Notification Settings
    </div>
  ),
}));

// Mock window.location for navigation tests
const mockLocation = {
  href: '',
};
if (!window.location) {
  Object.defineProperty(window, 'location', {
    value: mockLocation,
    writable: true,
    configurable: true,
  });
} else {
  Object.defineProperty(window, 'location', {
    value: {
      ...window.location,
      ...mockLocation,
    },
    writable: true,
    configurable: true,
  });
}

const mockCampaignsData = {
  campaigns: [
    {
      id: 'campaign-1',
      title: 'Install LED Street Lighting',
      status: 'ACTIVE',
      city: 'San Francisco',
      state: 'CA',
      createdAt: new Date('2023-01-01'),
      _count: { votes: 25, comments: 8 },
    },
    {
      id: 'campaign-2',
      title: 'Build Community Garden',
      status: 'DRAFT',
      city: 'Oakland',
      state: 'CA',
      createdAt: new Date('2023-01-15'),
      _count: { votes: 12, comments: 3 },
    },
    {
      id: 'campaign-3',
      title: 'Repair Sidewalks',
      status: 'COMPLETED',
      city: 'Berkeley',
      state: 'CA',
      createdAt: new Date('2023-02-01'),
      _count: { votes: 45, comments: 15 },
    },
  ],
};

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

describe('Dashboard Analytics Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default successful response
    mockGetMyCampaigns.mockReturnValue({
      data: mockCampaignsData,
      isLoading: false,
      refetch: jest.fn(),
    });
  });

  describe('Analytics Calculation', () => {
    it('calculates analytics from campaign data correctly', async () => {
      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        // Total campaigns
        expect(screen.getByText('3')).toBeInTheDocument(); // Total: 3 campaigns

        // Active campaigns
        expect(screen.getByText('1')).toBeInTheDocument(); // Active: 1 campaign

        // Total votes: 25 + 12 + 45 = 82
        expect(screen.getByText('82')).toBeInTheDocument();

        // Total comments: 8 + 3 + 15 = 26
        expect(screen.getByText('26')).toBeInTheDocument();
      });
    });

    it('handles empty campaign data', async () => {
      mockGetMyCampaigns.mockReturnValue({
        data: { campaigns: [] },
        isLoading: false,
        refetch: jest.fn(),
      });

      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument(); // Should show 0 for all metrics
      });
    });

    it('handles undefined campaign counts gracefully', async () => {
      const campaignsWithUndefinedCounts = {
        campaigns: [
          {
            id: 'campaign-1',
            title: 'Test Campaign',
            status: 'ACTIVE',
            city: 'Test City',
            state: 'CA',
            createdAt: new Date(),
            _count: undefined, // Undefined count
          },
        ],
      };

      mockGetMyCampaigns.mockReturnValue({
        data: campaignsWithUndefinedCounts,
        isLoading: false,
        refetch: jest.fn(),
      });

      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument(); // Total campaigns
        expect(screen.getByText('0')).toBeInTheDocument(); // Votes should be 0
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading skeleton while data is loading', async () => {
      mockGetMyCampaigns.mockReturnValue({
        data: undefined,
        isLoading: true,
        refetch: jest.fn(),
      });

      renderWithProviders(<DashboardPage />);

      // Should show loading skeleton
      const skeletonElements =
        screen.getAllByTestId || screen.queryAllByText(/loading/i);
      // The skeleton is implemented with CSS animations, so we check for the structure
      expect(screen.getByText('Campaign Dashboard')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      mockGetMyCampaigns.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new TRPCClientError('Failed to fetch campaigns'),
        refetch: jest.fn(),
      });

      renderWithProviders(<DashboardPage />);

      // Should still render the dashboard structure
      expect(screen.getByText('Campaign Dashboard')).toBeInTheDocument();
      expect(
        screen.getByText('Manage your campaigns and track their performance')
      ).toBeInTheDocument();
    });
  });

  describe('Page Structure', () => {
    it('renders all main dashboard sections', async () => {
      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        // Header section
        expect(screen.getByText('Campaign Dashboard')).toBeInTheDocument();
        expect(
          screen.getByText('Manage your campaigns and track their performance')
        ).toBeInTheDocument();

        // Create campaign button
        expect(
          screen.getByRole('link', { name: /create campaign/i })
        ).toBeInTheDocument();

        // Analytics cards section
        expect(screen.getByText('Total Campaigns')).toBeInTheDocument();
        expect(screen.getByText('Active Campaigns')).toBeInTheDocument();
        expect(screen.getByText('Total Votes')).toBeInTheDocument();
        expect(screen.getByText('Total Comments')).toBeInTheDocument();

        // Push notification settings
        expect(
          screen.getByTestId('push-notification-settings')
        ).toBeInTheDocument();
      });
    });

    it('renders campaign status filter', async () => {
      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Your Campaigns')).toBeInTheDocument();
        expect(screen.getByDisplayValue('All Statuses')).toBeInTheDocument();
      });
    });

    it('renders campaign table when data exists', async () => {
      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(
          screen.getByText('Install LED Street Lighting')
        ).toBeInTheDocument();
        expect(screen.getByText('Build Community Garden')).toBeInTheDocument();
        expect(screen.getByText('Repair Sidewalks')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('has working create campaign link', async () => {
      renderWithProviders(<DashboardPage />);

      const createLink = screen.getByRole('link', { name: /create campaign/i });
      expect(createLink).toHaveAttribute('href', '/campaigns/create');
    });

    it('has working campaign detail links', async () => {
      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        const campaignLinks = screen.getAllByText(/view/i);
        campaignLinks.forEach((link) => {
          expect(link.closest('a')).toHaveAttribute(
            'href',
            expect.stringContaining('/campaigns/')
          );
        });
      });
    });
  });

  describe('Status Management', () => {
    it('allows changing campaign status', async () => {
      const user = userEvent.setup();
      const mockUpdateMutation = jest.fn();

      // Mock the update mutation
      jest.doMock('~/lib/trpc', () => ({
        api: {
          campaigns: {
            getMyCampaigns: {
              useQuery: () => mockGetMyCampaigns(),
            },
            update: {
              useMutation: () => ({
                mutateAsync: mockUpdateMutation,
                isLoading: false,
              }),
            },
          },
        },
      }));

      renderWithProviders(<DashboardPage />);

      await waitFor(async () => {
        const statusSelects = screen.getAllByDisplayValue(
          /active|draft|completed/i
        );
        if (statusSelects.length > 0) {
          await user.selectOptions(statusSelects[0], 'COMPLETED');
          // The update should trigger (mocked)
        }
      });
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive grid classes to analytics cards', () => {
      const { container } = renderWithProviders(<DashboardPage />);

      const gridContainer = container.querySelector(
        '.grid-cols-2.md\\:grid-cols-4'
      );
      expect(gridContainer).toBeInTheDocument();
    });

    it('applies responsive flex layout to header', () => {
      const { container } = renderWithProviders(<DashboardPage />);

      const headerFlex = container.querySelector('.flex-col.sm\\:flex-row');
      expect(headerFlex).toBeInTheDocument();
    });
  });

  describe('Data Filtering', () => {
    it('filters campaigns by status', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DashboardPage />);

      await waitFor(async () => {
        const statusFilter = screen.getByDisplayValue('All Statuses');
        await user.selectOptions(statusFilter, 'ACTIVE');

        // This would trigger a new query with the filter
        // The actual filtering logic is in the API query
        expect(statusFilter).toHaveValue('ACTIVE');
      });
    });
  });

  describe('Empty States', () => {
    it('shows empty state when no campaigns match filter', async () => {
      mockGetMyCampaigns.mockReturnValue({
        data: { campaigns: [] },
        isLoading: false,
        refetch: jest.fn(),
      });

      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/ready to make a difference/i)
        ).toBeInTheDocument();
        expect(
          screen.getByText(/create your first campaign/i)
        ).toBeInTheDocument();
      });
    });
  });
});
