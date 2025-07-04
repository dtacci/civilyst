import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useUser } from '@clerk/nextjs';
import { api } from '~/lib/trpc';
import SettingsPage from '../page';

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
      getProfile: {
        useQuery: jest.fn(),
      },
      updateProfile: {
        useMutation: jest.fn(),
      },
      updatePrivacySettings: {
        useMutation: jest.fn(),
      },
      updateLocationSettings: {
        useMutation: jest.fn(),
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

const mockProfile = {
  id: 'user_123',
  firstName: 'John',
  lastName: 'Doe',
  fullName: 'John Doe',
  email: 'john@example.com',
  imageUrl: 'https://example.com/avatar.jpg',
  bio: 'Passionate about civic engagement.',
  location: 'San Francisco, CA',
  isPublic: true,
  showStats: true,
  showActivity: true,
  allowMentions: true,
  showLocation: true,
  defaultLocation: 'San Francisco, CA',
  autoDetectLocation: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-15'),
};

const mockUpdateProfile = {
  mutateAsync: jest.fn(),
};

const mockUpdatePrivacySettings = {
  mutateAsync: jest.fn(),
};

const mockUpdateLocationSettings = {
  mutateAsync: jest.fn(),
};

describe('SettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useUser as jest.Mock).mockReturnValue({
      user: mockUser,
      isLoaded: true,
    });

    (api.users.getProfile.useQuery as jest.Mock).mockReturnValue({
      data: mockProfile,
      isLoading: false,
    });

    (api.users.updateProfile.useMutation as jest.Mock).mockReturnValue(
      mockUpdateProfile
    );
    (api.users.updatePrivacySettings.useMutation as jest.Mock).mockReturnValue(
      mockUpdatePrivacySettings
    );
    (api.users.updateLocationSettings.useMutation as jest.Mock).mockReturnValue(
      mockUpdateLocationSettings
    );
  });

  it('shows loading spinner when user is not loaded', () => {
    (useUser as jest.Mock).mockReturnValue({
      user: null,
      isLoaded: false,
    });

    render(<SettingsPage />);

    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
  });

  it('renders settings page with correct sections', async () => {
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Account Settings')).toBeInTheDocument();
      expect(screen.getByText('Profile Information')).toBeInTheDocument();
      expect(screen.getByText('Privacy Settings')).toBeInTheDocument();
      expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
      expect(screen.getByText('Location Settings')).toBeInTheDocument();
      expect(screen.getByText('Account Management')).toBeInTheDocument();
    });
  });

  it('initializes form fields with user data', async () => {
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
      expect(
        screen.getByDisplayValue('Passionate about civic engagement.')
      ).toBeInTheDocument();
      expect(screen.getByDisplayValue('San Francisco, CA')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
    });
  });

  it('displays user avatar correctly', async () => {
    render(<SettingsPage />);

    await waitFor(() => {
      const avatar = screen.getByAltText('John Doe');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });
  });

  it('shows fallback avatar when no image URL provided', async () => {
    const userWithoutImage = {
      ...mockUser,
      imageUrl: null,
    };

    const profileWithoutImage = {
      ...mockProfile,
      imageUrl: null,
    };

    (useUser as jest.Mock).mockReturnValue({
      user: userWithoutImage,
      isLoaded: true,
    });

    (api.users.getProfile.useQuery as jest.Mock).mockReturnValue({
      data: profileWithoutImage,
      isLoading: false,
    });

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('J')).toBeInTheDocument(); // First letter of firstName
    });
  });

  it('allows updating profile information', async () => {
    const user = userEvent.setup();

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    });

    // Update first name
    const firstNameInput = screen.getByDisplayValue('John');
    await user.clear(firstNameInput);
    await user.type(firstNameInput, 'Johnny');

    // Update bio
    const bioTextarea = screen.getByDisplayValue(
      'Passionate about civic engagement.'
    );
    await user.clear(bioTextarea);
    await user.type(
      bioTextarea,
      'Updated bio about civic engagement and community building.'
    );

    // Submit form
    const saveButton = screen.getByRole('button', { name: /save profile/i });
    await user.click(saveButton);

    expect(mockUpdateProfile.mutateAsync).toHaveBeenCalledWith({
      firstName: 'Johnny',
      lastName: 'Doe',
      bio: 'Updated bio about civic engagement and community building.',
      location: 'San Francisco, CA',
    });
  });

  it('handles empty form fields correctly', async () => {
    const user = userEvent.setup();

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    });

    // Clear first name
    const firstNameInput = screen.getByDisplayValue('John');
    await user.clear(firstNameInput);

    // Clear bio
    const bioTextarea = screen.getByDisplayValue(
      'Passionate about civic engagement.'
    );
    await user.clear(bioTextarea);

    // Submit form
    const saveButton = screen.getByRole('button', { name: /save profile/i });
    await user.click(saveButton);

    expect(mockUpdateProfile.mutateAsync).toHaveBeenCalledWith({
      firstName: undefined,
      lastName: 'Doe',
      bio: undefined,
      location: 'San Francisco, CA',
    });
  });

  it('updates privacy settings when switches are toggled', async () => {
    const user = userEvent.setup();

    render(<SettingsPage />);

    await waitFor(() => {
      expect(
        screen.getByRole('switch', { name: /public profile/i })
      ).toBeInTheDocument();
    });

    // Toggle public profile switch
    const publicProfileSwitch = screen.getByRole('switch', {
      name: /public profile/i,
    });
    await user.click(publicProfileSwitch);

    expect(mockUpdatePrivacySettings.mutateAsync).toHaveBeenCalledWith({
      isPublic: false,
    });
  });

  it('updates location settings correctly', async () => {
    const user = userEvent.setup();

    render(<SettingsPage />);

    await waitFor(() => {
      expect(
        screen.getByRole('switch', { name: /auto-detect location/i })
      ).toBeInTheDocument();
    });

    // Toggle auto-detect location
    const autoDetectSwitch = screen.getByRole('switch', {
      name: /auto-detect location/i,
    });
    await user.click(autoDetectSwitch);

    expect(mockUpdateLocationSettings.mutateAsync).toHaveBeenCalledWith({
      autoDetectLocation: true,
    });
  });

  it('displays bio character count', async () => {
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('34/500 characters')).toBeInTheDocument();
    });
  });

  it('shows success message after profile update', async () => {
    const user = userEvent.setup();

    // Mock successful mutation with proper callbacks
    const mockMutation = {
      mutateAsync: jest.fn().mockResolvedValue({}),
      isLoading: false,
      isError: false,
      error: null,
    };

    (api.users.updateProfile.useMutation as jest.Mock).mockImplementation(
      (options) => {
        // Simulate calling onSuccess when mutation succeeds
        const mutateAsync = async (data: any) => {
          const result = await mockMutation.mutateAsync(data);
          if (options?.onSuccess) {
            options.onSuccess(result);
          }
          return result;
        };

        return {
          ...mockMutation,
          mutateAsync,
        };
      }
    );

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    });

    // Update and save
    const firstNameInput = screen.getByDisplayValue('John');
    await user.clear(firstNameInput);
    await user.type(firstNameInput, 'Johnny');

    const saveButton = screen.getByRole('button', { name: /save profile/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(
        screen.getByText('Profile updated successfully!')
      ).toBeInTheDocument();
    });
  });

  it('shows error message when profile update fails', async () => {
    const user = userEvent.setup();

    // Mock failed mutation with proper callbacks
    (api.users.updateProfile.useMutation as jest.Mock).mockImplementation(
      (options) => {
        const mutateAsync = jest.fn().mockImplementation(async (data: any) => {
          const error = new Error('Update failed');
          if (options?.onError) {
            options.onError(error);
          }
          throw error;
        });

        return {
          mutateAsync,
          isLoading: false,
          isError: true,
          error: new Error('Update failed'),
        };
      }
    );

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    });

    // Try to save
    const saveButton = screen.getByRole('button', { name: /save profile/i });

    // We need to handle the promise rejection
    try {
      await user.click(saveButton);
    } catch (error) {
      // Expected to throw
    }

    await waitFor(() => {
      expect(screen.getByText('Update failed')).toBeInTheDocument();
    });
  });

  it('handles notification setting toggles', async () => {
    const user = userEvent.setup();

    render(<SettingsPage />);

    await waitFor(() => {
      expect(
        screen.getByRole('switch', { name: /new votes on my campaigns/i })
      ).toBeInTheDocument();
    });

    // Toggle notification switch
    const notificationSwitch = screen.getByRole('switch', {
      name: /new votes on my campaigns/i,
    });
    await user.click(notificationSwitch);

    // Note: Notification updates are currently TODO, so no API call should be made
    expect(mockUpdatePrivacySettings.mutateAsync).not.toHaveBeenCalled();
  });

  it('shows account management section with proper buttons', () => {
    render(<SettingsPage />);

    expect(
      screen.getByRole('button', { name: /download my data/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /delete account/i })
    ).toBeInTheDocument();
  });

  it('shows alert when download data button is clicked', async () => {
    const user = userEvent.setup();

    // Mock window.alert
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(<SettingsPage />);

    const downloadButton = screen.getByRole('button', {
      name: /download my data/i,
    });
    await user.click(downloadButton);

    expect(alertSpy).toHaveBeenCalledWith('Data download feature coming soon!');

    alertSpy.mockRestore();
  });

  it('shows confirmation dialog when delete account button is clicked', async () => {
    const user = userEvent.setup();

    // Mock window.confirm
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

    render(<SettingsPage />);

    const deleteButton = screen.getByRole('button', {
      name: /delete account/i,
    });
    await user.click(deleteButton);

    expect(confirmSpy).toHaveBeenCalledWith(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );

    confirmSpy.mockRestore();
  });

  it('has correct navigation link back to profile', () => {
    render(<SettingsPage />);

    const backLink = screen.getByRole('link', { name: /back to profile/i });
    expect(backLink).toHaveAttribute('href', '/profile');
  });

  it('disables email field as readonly', () => {
    render(<SettingsPage />);

    const emailInput = screen.getByDisplayValue('john@example.com');
    expect(emailInput).toBeDisabled();
  });
});
