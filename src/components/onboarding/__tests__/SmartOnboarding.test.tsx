import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { SmartOnboarding } from '../SmartOnboarding';
import { api } from '~/lib/trpc';

// Mock dependencies
jest.mock('@clerk/nextjs', () => ({
  useUser: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('~/lib/trpc', () => ({
  api: {
    users: {
      getProfile: {
        useQuery: jest.fn(),
      },
      updateProfile: {
        useMutation: jest.fn(),
      },
      completeOnboarding: {
        useMutation: jest.fn(),
      },
    },
  },
}));

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock geolocation API
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
};

Object.defineProperty(navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

// Mock fetch for location API
global.fetch = jest.fn();

describe('SmartOnboarding', () => {
  const mockPush = jest.fn();
  const mockUser = {
    firstName: 'John',
    lastName: 'Doe',
  };
  const mockUpdateProfile = jest.fn();
  const mockCompleteOnboarding = jest.fn();

  const setupLocationMocks = () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: { latitude: 37.7749, longitude: -122.4194 },
      });
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        address: {
          city: 'San Francisco',
          state: 'California',
        },
      }),
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useUser as jest.Mock).mockReturnValue({
      user: mockUser,
    });

    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    (api.users.getProfile.useQuery as jest.Mock).mockReturnValue({
      data: { hasCompletedOnboarding: false },
    });

    (api.users.updateProfile.useMutation as jest.Mock).mockReturnValue({
      mutateAsync: mockUpdateProfile,
    });

    (api.users.completeOnboarding.useMutation as jest.Mock).mockReturnValue({
      mutateAsync: mockCompleteOnboarding,
    });
  });

  describe('Rendering and Navigation', () => {
    it('should render the welcome step initially', () => {
      render(<SmartOnboarding />);

      expect(screen.getByText('Welcome to Civilyst!')).toBeInTheDocument();
      expect(
        screen.getByText(/Hi John, great to have you here!/)
      ).toBeInTheDocument();
    });

    it('should show progress bar', () => {
      render(<SmartOnboarding />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should navigate between steps', async () => {
      const user = userEvent.setup();
      render(<SmartOnboarding />);

      // Click next to go to profile type step
      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      expect(
        screen.getByText('How will you use Civilyst?')
      ).toBeInTheDocument();

      // Click previous to go back
      const prevButton = screen.getByRole('button', { name: /previous/i });
      await user.click(prevButton);

      expect(screen.getByText('Welcome to Civilyst!')).toBeInTheDocument();
    });

    it('should redirect to dashboard if onboarding is already completed', () => {
      (api.users.getProfile.useQuery as jest.Mock).mockReturnValue({
        data: { hasCompletedOnboarding: true },
      });

      render(<SmartOnboarding />);

      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('Profile Type Selection', () => {
    it('should allow selecting profile type', async () => {
      const user = userEvent.setup();
      render(<SmartOnboarding />);

      // Navigate to profile type step
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Select organizer profile type
      const organizerButton = screen.getByText('Campaign Organizer');
      await user.click(organizerButton);

      // Should be able to proceed
      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).not.toBeDisabled();
    });

    it('should disable next button when no profile type selected', async () => {
      const user = userEvent.setup();
      render(<SmartOnboarding />);

      // Navigate to profile type step
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Next button should be disabled initially
      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeDisabled();
    });
  });

  describe('Location Detection', () => {
    it('should detect user location', async () => {
      const user = userEvent.setup();
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success({
          coords: { latitude: 37.7749, longitude: -122.4194 },
        });
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          address: {
            city: 'San Francisco',
            state: 'California',
          },
        }),
      });

      render(<SmartOnboarding />);

      // Navigate to location step
      await user.click(screen.getByRole('button', { name: /next/i }));
      await user.click(screen.getByText('Engaged Citizen'));
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Click detect location
      const detectButton = screen.getByRole('button', {
        name: /detect my location/i,
      });
      await user.click(detectButton);

      await waitFor(() => {
        expect(
          screen.getByText('San Francisco, California')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Interest Selection', () => {
    it('should allow selecting multiple interests', async () => {
      const user = userEvent.setup();

      // Mock successful location detection
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success({
          coords: { latitude: 37.7749, longitude: -122.4194 },
        });
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          address: {
            city: 'San Francisco',
            state: 'California',
          },
        }),
      });

      render(<SmartOnboarding />);

      // Navigate to interests step
      await user.click(screen.getByRole('button', { name: /next/i }));
      await user.click(screen.getByText('Engaged Citizen'));
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Set location
      await user.click(
        screen.getByRole('button', { name: /detect my location/i })
      );
      await waitFor(() => {
        expect(
          screen.getByText('San Francisco, California')
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /next/i }));

      // Select interests
      await user.click(screen.getByText('Transportation'));
      await user.click(screen.getByText('Parks & Recreation'));
      await user.click(screen.getByText('Education'));

      // Should be able to proceed
      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).not.toBeDisabled();
    });
  });

  describe('Goal Selection', () => {
    it('should show goals based on profile type', async () => {
      const user = userEvent.setup();

      // Mock location
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success({
          coords: { latitude: 37.7749, longitude: -122.4194 },
        });
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          address: {
            city: 'San Francisco',
            state: 'California',
          },
        }),
      });

      render(<SmartOnboarding />);

      // Navigate through steps selecting organizer profile
      await user.click(screen.getByRole('button', { name: /next/i }));
      await user.click(screen.getByText('Campaign Organizer'));
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Set location
      await user.click(
        screen.getByRole('button', { name: /detect my location/i })
      );
      await waitFor(() => {
        expect(
          screen.getByText('San Francisco, California')
        ).toBeInTheDocument();
      });
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Select interests
      await user.click(screen.getByText('Transportation'));
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Should see organizer-specific goals
      expect(
        screen.getByText('Launch successful campaigns')
      ).toBeInTheDocument();
      expect(screen.getByText('Build community support')).toBeInTheDocument();
    });
  });

  describe('Onboarding Completion', () => {
    it('should complete onboarding and redirect based on profile type', async () => {
      const user = userEvent.setup();
      setupLocationMocks();
      mockUpdateProfile.mockResolvedValue({});
      mockCompleteOnboarding.mockResolvedValue({});

      render(<SmartOnboarding />);

      // Complete all steps as organizer
      await user.click(screen.getByRole('button', { name: /next/i }));
      await user.click(screen.getByText('Campaign Organizer'));
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Set location
      await user.click(
        screen.getByRole('button', { name: /detect my location/i })
      );
      await waitFor(() => {
        expect(
          screen.getByText('San Francisco, California')
        ).toBeInTheDocument();
      });
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Select interests
      await user.click(screen.getByText('Transportation'));
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Select goals
      await user.click(screen.getByText('Launch successful campaigns'));

      // Click Get Started
      const getStartedButton = screen.getByRole('button', {
        name: /get started/i,
      });
      await user.click(getStartedButton);

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith({
          location: 'San Francisco, California',
          metadata: {
            interests: ['Transportation'],
            goals: ['Launch successful campaigns'],
            profileType: 'organizer',
            onboardingVersion: '1.0',
          },
        });
        expect(mockCompleteOnboarding).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith('/campaigns/new');
      });
    });

    it('should redirect citizens to campaigns page', async () => {
      const user = userEvent.setup();
      setupLocationMocks();
      mockUpdateProfile.mockResolvedValue({});
      mockCompleteOnboarding.mockResolvedValue({});

      render(<SmartOnboarding />);

      // Complete all steps as citizen
      await user.click(screen.getByRole('button', { name: /next/i }));
      await user.click(screen.getByText('Engaged Citizen'));
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Set location
      await user.click(
        screen.getByRole('button', { name: /detect my location/i })
      );
      await waitFor(() => {
        expect(
          screen.getByText('San Francisco, California')
        ).toBeInTheDocument();
      });
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Select interests
      await user.click(screen.getByText('Transportation'));
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Select goals
      await user.click(screen.getByText('Stay informed about local issues'));
      await user.click(screen.getByRole('button', { name: /get started/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/campaigns');
      });
    });

    it('should redirect officials to analytics dashboard', async () => {
      const user = userEvent.setup();
      setupLocationMocks();
      mockUpdateProfile.mockResolvedValue({});
      mockCompleteOnboarding.mockResolvedValue({});

      render(<SmartOnboarding />);

      // Complete all steps as official
      await user.click(screen.getByRole('button', { name: /next/i }));
      await user.click(screen.getByText('City Official'));
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Set location
      await user.click(
        screen.getByRole('button', { name: /detect my location/i })
      );
      await waitFor(() => {
        expect(
          screen.getByText('San Francisco, California')
        ).toBeInTheDocument();
      });
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Select interests
      await user.click(screen.getByText('Transportation'));
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Select goals
      await user.click(screen.getByText('Understand citizen priorities'));
      await user.click(screen.getByRole('button', { name: /get started/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard/analytics');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle profile update errors gracefully', async () => {
      const user = userEvent.setup();
      setupLocationMocks();
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      mockUpdateProfile.mockRejectedValue(new Error('Update failed'));

      render(<SmartOnboarding />);

      // Complete all steps
      await user.click(screen.getByRole('button', { name: /next/i }));
      await user.click(screen.getByText('Engaged Citizen'));
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Set location
      await user.click(
        screen.getByRole('button', { name: /detect my location/i })
      );
      await waitFor(() => {
        expect(
          screen.getByText('San Francisco, California')
        ).toBeInTheDocument();
      });
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Select interests
      await user.click(screen.getByText('Transportation'));
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Select goals
      await user.click(screen.getByText('Stay informed about local issues'));
      await user.click(screen.getByRole('button', { name: /get started/i }));

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Error completing onboarding:',
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });
  });
});
