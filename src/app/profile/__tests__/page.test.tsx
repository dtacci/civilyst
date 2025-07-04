import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useUser } from '@clerk/nextjs';
import { api } from '~/lib/trpc';
import ProfilePage from '../page';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  useUser: jest.fn(),
}));

// Mock tRPC API
jest.mock('~/lib/trpc', () => ({
  api: {
    users: {
      getStats: {
        useQuery: jest.fn(),
      },
      getRecentActivity: {
        useQuery: jest.fn(),
      },
      getProfile: {
        useQuery: jest.fn(),
      },
    },
  },
}));

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockedImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />;
  };
});

const mockUser = {
  id: 'user_123',
  firstName: 'John',
  lastName: 'Doe',
  fullName: 'John Doe',
  imageUrl: 'https://example.com/avatar.jpg',
  emailAddresses: [{ emailAddress: 'john@example.com' }],
  createdAt: new Date('2024-01-01'),
};

const mockStats = {
  campaignCount: 5,
  activeCampaignCount: 2,
  voteCount: 15,
  commentCount: 8,
  wonderResponseCount: 3,
  engagementStreak: 7,
  impactScore: 85,
  engagementLevel: 'Active Citizen',
};

const mockActivity = [
  {
    type: 'campaign' as const,
    description: 'Created campaign "Fix Main Street"',
    createdAt: new Date('2024-01-15'),
    linkId: 'campaign_1',
  },
  {
    type: 'vote' as const,
    description: 'Supported "Park Renovation Project"',
    createdAt: new Date('2024-01-14'),
    linkId: 'campaign_2',
  },
  {
    type: 'comment' as const,
    description: 'Commented on "Transit Plan"',
    createdAt: new Date('2024-01-13'),
    linkId: 'campaign_3',
  },
];

const mockProfile = {
  id: 'user_123',
  firstName: 'John',
  lastName: 'Doe',
  fullName: 'John Doe',
  email: 'john@example.com',
  imageUrl: 'https://example.com/avatar.jpg',
  bio: 'Passionate about civic engagement and community development.',
  location: 'San Francisco, CA',
  isPublic: true,
  showStats: true,
  showActivity: true,
  allowMentions: true,
  showLocation: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-15'),
};

describe('ProfilePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading spinner when user is not loaded', () => {
    (useUser as jest.Mock).mockReturnValue({
      user: null,
      isLoaded: false,
    });

    // Mock API queries to return loading state when user is not loaded
    (api.users.getStats.useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    (api.users.getRecentActivity.useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    (api.users.getProfile.useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    render(<ProfilePage />);

    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
  });

  it('renders profile header with user information', async () => {
    (useUser as jest.Mock).mockReturnValue({
      user: mockUser,
      isLoaded: true,
    });

    (api.users.getStats.useQuery as jest.Mock).mockReturnValue({
      data: mockStats,
      isLoading: false,
    });

    (api.users.getRecentActivity.useQuery as jest.Mock).mockReturnValue({
      data: mockActivity,
      isLoading: false,
    });

    (api.users.getProfile.useQuery as jest.Mock).mockReturnValue({
      data: mockProfile,
      isLoading: false,
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('San Francisco, CA')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Passionate about civic engagement and community development.'
        )
      ).toBeInTheDocument();
    });
  });

  it('displays activity statistics correctly', async () => {
    (useUser as jest.Mock).mockReturnValue({
      user: mockUser,
      isLoaded: true,
    });

    (api.users.getStats.useQuery as jest.Mock).mockReturnValue({
      data: mockStats,
      isLoading: false,
    });

    (api.users.getRecentActivity.useQuery as jest.Mock).mockReturnValue({
      data: mockActivity,
      isLoading: false,
    });

    (api.users.getProfile.useQuery as jest.Mock).mockReturnValue({
      data: mockProfile,
      isLoading: false,
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument(); // Campaign count
      expect(screen.getByText('15')).toBeInTheDocument(); // Vote count
      expect(screen.getByText('8')).toBeInTheDocument(); // Comment count
      expect(screen.getByText('7')).toBeInTheDocument(); // Engagement streak
      expect(screen.getByText('Campaigns')).toBeInTheDocument();
      expect(screen.getByText('Votes Cast')).toBeInTheDocument();
      expect(screen.getByText('Comments')).toBeInTheDocument();
      expect(screen.getByText('Day Streak')).toBeInTheDocument();
    });
  });

  it('shows loading state for statistics', () => {
    (useUser as jest.Mock).mockReturnValue({
      user: mockUser,
      isLoaded: true,
    });

    (api.users.getStats.useQuery as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
    });

    (api.users.getRecentActivity.useQuery as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
    });

    (api.users.getProfile.useQuery as jest.Mock).mockReturnValue({
      data: mockProfile,
      isLoading: false,
    });

    render(<ProfilePage />);

    // Should show loading skeletons
    const loadingElements = screen.getAllByTestId('loading-skeleton');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('displays recent activity correctly', async () => {
    (useUser as jest.Mock).mockReturnValue({
      user: mockUser,
      isLoaded: true,
    });

    (api.users.getStats.useQuery as jest.Mock).mockReturnValue({
      data: mockStats,
      isLoading: false,
    });

    (api.users.getRecentActivity.useQuery as jest.Mock).mockReturnValue({
      data: mockActivity,
      isLoading: false,
    });

    (api.users.getProfile.useQuery as jest.Mock).mockReturnValue({
      data: mockProfile,
      isLoading: false,
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(
        screen.getByText('Created campaign "Fix Main Street"')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Supported "Park Renovation Project"')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Commented on "Transit Plan"')
      ).toBeInTheDocument();
    });
  });

  it('shows empty state when no activity exists', async () => {
    (useUser as jest.Mock).mockReturnValue({
      user: mockUser,
      isLoaded: true,
    });

    (api.users.getStats.useQuery as jest.Mock).mockReturnValue({
      data: mockStats,
      isLoading: false,
    });

    (api.users.getRecentActivity.useQuery as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });

    (api.users.getProfile.useQuery as jest.Mock).mockReturnValue({
      data: mockProfile,
      isLoading: false,
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('No recent activity yet')).toBeInTheDocument();
      expect(screen.getByText('Explore Campaigns')).toBeInTheDocument();
    });
  });

  it('displays civic engagement metrics', async () => {
    (useUser as jest.Mock).mockReturnValue({
      user: mockUser,
      isLoaded: true,
    });

    (api.users.getStats.useQuery as jest.Mock).mockReturnValue({
      data: mockStats,
      isLoading: false,
    });

    (api.users.getRecentActivity.useQuery as jest.Mock).mockReturnValue({
      data: mockActivity,
      isLoading: false,
    });

    (api.users.getProfile.useQuery as jest.Mock).mockReturnValue({
      data: mockProfile,
      isLoading: false,
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Active Citizen')).toBeInTheDocument();
      expect(screen.getByText('85 points')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // Active campaigns
    });
  });

  it('has correct navigation links', async () => {
    (useUser as jest.Mock).mockReturnValue({
      user: mockUser,
      isLoaded: true,
    });

    (api.users.getStats.useQuery as jest.Mock).mockReturnValue({
      data: mockStats,
      isLoading: false,
    });

    (api.users.getRecentActivity.useQuery as jest.Mock).mockReturnValue({
      data: mockActivity,
      isLoading: false,
    });

    (api.users.getProfile.useQuery as jest.Mock).mockReturnValue({
      data: mockProfile,
      isLoading: false,
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /settings/i })).toHaveAttribute(
        'href',
        '/settings'
      );
      expect(
        screen.getByRole('button', { name: /share/i })
      ).toBeInTheDocument();
    });
  });

  it('shows fallback avatar when no image URL provided', async () => {
    const userWithoutImage = {
      ...mockUser,
      imageUrl: null,
    };

    (useUser as jest.Mock).mockReturnValue({
      user: userWithoutImage,
      isLoaded: true,
    });

    (api.users.getStats.useQuery as jest.Mock).mockReturnValue({
      data: mockStats,
      isLoading: false,
    });

    (api.users.getRecentActivity.useQuery as jest.Mock).mockReturnValue({
      data: mockActivity,
      isLoading: false,
    });

    (api.users.getProfile.useQuery as jest.Mock).mockReturnValue({
      data: { ...mockProfile, imageUrl: null },
      isLoading: false,
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('J')).toBeInTheDocument(); // First letter of firstName
    });
  });

  it('shows default bio message when no bio provided', async () => {
    const profileWithoutBio = {
      ...mockProfile,
      bio: null,
    };

    (useUser as jest.Mock).mockReturnValue({
      user: mockUser,
      isLoaded: true,
    });

    (api.users.getStats.useQuery as jest.Mock).mockReturnValue({
      data: mockStats,
      isLoading: false,
    });

    (api.users.getRecentActivity.useQuery as jest.Mock).mockReturnValue({
      data: mockActivity,
      isLoading: false,
    });

    (api.users.getProfile.useQuery as jest.Mock).mockReturnValue({
      data: profileWithoutBio,
      isLoading: false,
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(
        screen.getByText(
          'Add a bio to tell your community about yourself and your civic interests.'
        )
      ).toBeInTheDocument();
    });
  });
});
