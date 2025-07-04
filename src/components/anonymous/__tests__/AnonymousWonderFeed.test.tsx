import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AnonymousWonderFeed } from '../AnonymousWonderFeed';
import { api } from '~/lib/trpc';
import { useAuth } from '@clerk/nextjs';
import { getDeviceId } from '~/lib/trust/deviceFingerprint';
import { toast } from '~/lib/toast';

// Mock dependencies
jest.mock('~/lib/trpc');
jest.mock('@clerk/nextjs');
jest.mock('~/lib/trust/deviceFingerprint');
jest.mock('~/lib/toast');

const mockApi = api as jest.Mocked<typeof api>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockGetDeviceId = getDeviceId as jest.MockedFunction<typeof getDeviceId>;
const mockToast = toast as jest.Mocked<typeof toast>;

describe('AnonymousWonderFeed', () => {
  const mockWonder = {
    id: 'wonder-1',
    content: 'What if we had better bike lanes?',
    category: 'INFRASTRUCTURE',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    claimedBy: null,
    metadata: {
      locationCity: 'San Francisco',
      locationAddress: 'San Francisco, CA, USA',
      trustBonusReason: 'Within San Francisco Bay Area community',
    },
    location: {
      type: 'Point',
      coordinates: [-122.4194, 37.7749],
    },
  };

  const mockQueryResult = {
    data: {
      wonders: [mockWonder],
      trustScore: 0.4,
    },
    isLoading: false,
    error: null,
  };

  const mockMutation = {
    mutate: jest.fn(),
    isPending: false,
    error: null,
  };

  beforeEach(() => {
    jest.resetAllMocks();

    mockGetDeviceId.mockResolvedValue('test-device-id-12345678901234567890123456789012');
    
    mockUseAuth.mockReturnValue({
      isSignedIn: false,
      userId: null,
    } as any);

    mockApi.wonders.getAnonymousWonders.useQuery.mockReturnValue(mockQueryResult as any);
    mockApi.wonders.claimAnonymousWonders.useMutation.mockReturnValue(mockMutation as any);

    mockToast.success = jest.fn();
    mockToast.error = jest.fn();
  });

  it('should render loading state initially', () => {
    mockApi.wonders.getAnonymousWonders.useQuery.mockReturnValue({
      ...mockQueryResult,
      isLoading: true,
    } as any);

    render(<AnonymousWonderFeed />);

    expect(screen.getByRole('progressbar', { hidden: true })).toBeInTheDocument();
  });

  it('should render nothing when no wonders exist', () => {
    mockApi.wonders.getAnonymousWonders.useQuery.mockReturnValue({
      ...mockQueryResult,
      data: { wonders: [], trustScore: 0 },
    } as any);

    const { container } = render(<AnonymousWonderFeed />);
    expect(container.firstChild).toBeNull();
  });

  it('should display anonymous wonder with city name', async () => {
    render(<AnonymousWonderFeed />);

    await waitFor(() => {
      expect(screen.getByText('Your Anonymous Wonders')).toBeInTheDocument();
    });

    expect(screen.getByText('What if we had better bike lanes?')).toBeInTheDocument();
    expect(screen.getByText('San Francisco')).toBeInTheDocument();
    expect(screen.getByText('infrastructure')).toBeInTheDocument();
    expect(screen.getByText(/ago/)).toBeInTheDocument(); // Relative time
  });

  it('should show "Location shared" when no city in metadata', async () => {
    const wonderWithoutCity = {
      ...mockWonder,
      metadata: {},
    };

    mockApi.wonders.getAnonymousWonders.useQuery.mockReturnValue({
      ...mockQueryResult,
      data: {
        wonders: [wonderWithoutCity],
        trustScore: 0.4,
      },
    } as any);

    render(<AnonymousWonderFeed />);

    await waitFor(() => {
      expect(screen.getByText('Location shared')).toBeInTheDocument();
    });
  });

  it('should not show location icon when no location provided', async () => {
    const wonderWithoutLocation = {
      ...mockWonder,
      location: null,
    };

    mockApi.wonders.getAnonymousWonders.useQuery.mockReturnValue({
      ...mockQueryResult,
      data: {
        wonders: [wonderWithoutLocation],
        trustScore: 0.4,
      },
    } as any);

    render(<AnonymousWonderFeed />);

    await waitFor(() => {
      expect(screen.getByText('What if we had better bike lanes?')).toBeInTheDocument();
    });

    // Should not show location-related text
    expect(screen.queryByText('San Francisco')).not.toBeInTheDocument();
    expect(screen.queryByText('Location shared')).not.toBeInTheDocument();
  });

  it('should show claim button when user is signed in', async () => {
    mockUseAuth.mockReturnValue({
      isSignedIn: true,
      userId: 'user-123',
    } as any);

    render(<AnonymousWonderFeed />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Claim All' })).toBeInTheDocument();
    });
  });

  it('should not show claim button when user is not signed in', async () => {
    render(<AnonymousWonderFeed />);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Claim All' })).not.toBeInTheDocument();
    });

    expect(screen.getByText(/Sign up to claim these wonders/)).toBeInTheDocument();
  });

  it('should handle claim all action', async () => {
    mockUseAuth.mockReturnValue({
      isSignedIn: true,
      userId: 'user-123',
    } as any);

    render(<AnonymousWonderFeed />);

    await waitFor(() => {
      const claimButton = screen.getByRole('button', { name: 'Claim All' });
      fireEvent.click(claimButton);
    });

    expect(mockMutation.mutate).toHaveBeenCalledWith({
      deviceId: 'test-device-id-12345678901234567890123456789012',
    });
  });

  it('should disable claim button when mutation is pending', async () => {
    mockUseAuth.mockReturnValue({
      isSignedIn: true,
      userId: 'user-123',
    } as any);

    mockApi.wonders.claimAnonymousWonders.useMutation.mockReturnValue({
      ...mockMutation,
      isPending: true,
    } as any);

    render(<AnonymousWonderFeed />);

    await waitFor(() => {
      const claimButton = screen.getByRole('button', { name: 'Claim All' });
      expect(claimButton).toBeDisabled();
    });
  });

  it('should show claimed status for claimed wonders', async () => {
    const claimedWonder = {
      ...mockWonder,
      claimedBy: 'user-123',
    };

    mockApi.wonders.getAnonymousWonders.useQuery.mockReturnValue({
      ...mockQueryResult,
      data: {
        wonders: [claimedWonder],
        trustScore: 0.4,
      },
    } as any);

    render(<AnonymousWonderFeed />);

    await waitFor(() => {
      expect(screen.getByText('✓ Claimed')).toBeInTheDocument();
    });
  });

  it('should handle successful claim mutation', async () => {
    mockUseAuth.mockReturnValue({
      isSignedIn: true,
      userId: 'user-123',
    } as any);

    // Mock successful mutation
    const mockOnSuccess = mockApi.wonders.claimAnonymousWonders.useMutation.mock.calls[0]?.[0]?.onSuccess;
    
    render(<AnonymousWonderFeed />);

    // Simulate successful claim
    if (mockOnSuccess) {
      mockOnSuccess({ claimed: 1, wonders: [] });
    }

    expect(mockToast.success).toHaveBeenCalledWith('Successfully claimed 1 wonders!');
  });

  it('should handle failed claim mutation', async () => {
    mockUseAuth.mockReturnValue({
      isSignedIn: true,
      userId: 'user-123',
    } as any);

    // Mock failed mutation
    const mockOnError = mockApi.wonders.claimAnonymousWonders.useMutation.mock.calls[0]?.[0]?.onError;
    
    render(<AnonymousWonderFeed />);

    // Simulate failed claim
    if (mockOnError) {
      mockOnError(new Error('Network error'));
    }

    expect(mockToast.error).toHaveBeenCalledWith('Failed to claim wonders: Network error');
  });

  it('should display multiple wonders correctly', async () => {
    const multipleWonders = [
      mockWonder,
      {
        ...mockWonder,
        id: 'wonder-2',
        content: 'How about more parks?',
        category: 'ENVIRONMENT',
        metadata: {
          locationCity: 'Oakland',
        },
      },
    ];

    mockApi.wonders.getAnonymousWonders.useQuery.mockReturnValue({
      ...mockQueryResult,
      data: {
        wonders: multipleWonders,
        trustScore: 0.6,
      },
    } as any);

    render(<AnonymousWonderFeed />);

    await waitFor(() => {
      expect(screen.getByText('What if we had better bike lanes?')).toBeInTheDocument();
      expect(screen.getByText('How about more parks?')).toBeInTheDocument();
      expect(screen.getByText('San Francisco')).toBeInTheDocument();
      expect(screen.getByText('Oakland')).toBeInTheDocument();
      expect(screen.getByText('infrastructure')).toBeInTheDocument();
      expect(screen.getByText('environment')).toBeInTheDocument();
    });
  });

  it('should handle device ID loading state', () => {
    mockGetDeviceId.mockReturnValue(new Promise(() => {})); // Never resolves

    render(<AnonymousWonderFeed />);

    expect(screen.getByRole('progressbar', { hidden: true })).toBeInTheDocument();
  });
});