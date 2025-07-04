/**
 * Tests for AnonymousWonderButton component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnonymousWonderButton } from '../AnonymousWonderButton';
import { api } from '~/lib/trpc';
import {
  getDeviceId,
  isFingerprintingAvailable,
} from '~/lib/trust/deviceFingerprint';
import { toast } from '~/lib/toast';

// Mock dependencies
jest.mock('~/lib/trpc', () => ({
  api: {
    wonders: {
      createAnonymous: {
        useMutation: jest.fn(),
      },
    },
  },
}));

jest.mock('~/lib/trust/deviceFingerprint', () => ({
  getDeviceId: jest.fn(),
  isFingerprintingAvailable: jest.fn(),
}));

jest.mock('~/lib/toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('~/components/wonder/VoiceRecorder', () => ({
  VoiceRecorder: ({
    onResponse,
  }: {
    onResponse: (url: string, text: string) => void;
  }) => (
    <div data-testid="voice-recorder">
      <button
        onClick={() => onResponse('mock-audio-url', 'Mock transcribed text')}
        data-testid="voice-record-button"
      >
        Record Voice
      </button>
    </div>
  ),
}));

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

const mockMutate = jest.fn();
const mockMutation = {
  mutate: mockMutate,
  isPending: false,
};

describe('AnonymousWonderButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock successful device fingerprinting
    (getDeviceId as jest.Mock).mockResolvedValue('mock-device-id');
    (isFingerprintingAvailable as jest.Mock).mockReturnValue(true);

    // Mock successful mutation
    (api.wonders.createAnonymous.useMutation as jest.Mock).mockReturnValue(
      mockMutation
    );

    // Mock successful geolocation
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: {
          latitude: 37.7749,
          longitude: -122.4194,
        },
      });
    });
  });

  describe('Button rendering', () => {
    it('should render default button variant', () => {
      render(<AnonymousWonderButton />);

      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Wonder Anonymously');
      expect(button).toBeInTheDocument();
    });

    it('should render hero button variant', () => {
      render(<AnonymousWonderButton variant="hero" />);

      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Share Your Wonder Without Signing Up');
      expect(button).toHaveClass('text-lg');
    });

    it('should render floating button variant', () => {
      render(<AnonymousWonderButton variant="floating" />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('rounded-full');
    });

    it('should apply custom className', () => {
      render(<AnonymousWonderButton className="custom-class" />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('Modal interaction', () => {
    it('should open modal when button is clicked', async () => {
      const user = userEvent.setup();
      render(<AnonymousWonderButton />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(screen.getByText('Share Your Wonder ✨')).toBeInTheDocument();
      expect(
        screen.getByText(
          "No signup required - just share what you're wondering about"
        )
      ).toBeInTheDocument();
    });

    it('should close modal when X button is clicked', async () => {
      const user = userEvent.setup();
      render(<AnonymousWonderButton />);

      // Open modal
      const openButton = screen.getByRole('button', {
        name: /wonder anonymously/i,
      });
      await user.click(openButton);

      // Close modal
      const closeButton = screen.getByRole('button', { name: '' }); // X button has no text
      await user.click(closeButton);

      expect(
        screen.queryByText('Share Your Wonder ✨')
      ).not.toBeInTheDocument();
    });

    it('should close modal when clicking backdrop', async () => {
      const user = userEvent.setup();
      render(<AnonymousWonderButton />);

      // Open modal
      const openButton = screen.getByRole('button', {
        name: /wonder anonymously/i,
      });
      await user.click(openButton);

      // Click backdrop
      const backdrop = screen
        .getByText('Share Your Wonder ✨')
        .closest('.fixed');
      await user.click(backdrop!);

      expect(
        screen.queryByText('Share Your Wonder ✨')
      ).not.toBeInTheDocument();
    });

    it('should not close modal when clicking inside modal content', async () => {
      const user = userEvent.setup();
      render(<AnonymousWonderButton />);

      // Open modal
      const openButton = screen.getByRole('button', {
        name: /wonder anonymously/i,
      });
      await user.click(openButton);

      // Click inside modal
      const modalContent = screen.getByText('Share Your Wonder ✨');
      await user.click(modalContent);

      expect(screen.getByText('Share Your Wonder ✨')).toBeInTheDocument();
    });
  });

  describe('Input modes', () => {
    it('should switch between text and voice input modes', async () => {
      const user = userEvent.setup();
      render(<AnonymousWonderButton />);

      // Open modal
      const openButton = screen.getByRole('button', {
        name: /wonder anonymously/i,
      });
      await user.click(openButton);

      // Default should be text mode
      expect(screen.getByRole('textbox')).toBeInTheDocument();

      // Switch to voice mode
      const voiceButton = screen.getByRole('button', { name: /voice/i });
      await user.click(voiceButton);

      expect(screen.getByTestId('voice-recorder')).toBeInTheDocument();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

      // Switch back to text mode
      const textButton = screen.getByRole('button', { name: /text/i });
      await user.click(textButton);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.queryByTestId('voice-recorder')).not.toBeInTheDocument();
    });
  });

  describe('Text input', () => {
    it('should update content when typing in textarea', async () => {
      const user = userEvent.setup();
      render(<AnonymousWonderButton />);

      // Open modal
      const openButton = screen.getByRole('button', {
        name: /wonder anonymously/i,
      });
      await user.click(openButton);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'This is my wonder about the community');

      expect(textarea).toHaveValue('This is my wonder about the community');
    });

    it('should show placeholder text in textarea', async () => {
      const user = userEvent.setup();
      render(<AnonymousWonderButton />);

      // Open modal
      const openButton = screen.getByRole('button', {
        name: /wonder anonymously/i,
      });
      await user.click(openButton);

      const textarea = screen.getByPlaceholderText(
        /what would make your community better/i
      );
      expect(textarea).toBeInTheDocument();
    });
  });

  describe('Voice input', () => {
    it('should handle voice recording and transcription', async () => {
      const user = userEvent.setup();
      render(<AnonymousWonderButton />);

      // Open modal and switch to voice mode
      const openButton = screen.getByRole('button', {
        name: /wonder anonymously/i,
      });
      await user.click(openButton);

      const voiceButton = screen.getByRole('button', { name: /voice/i });
      await user.click(voiceButton);

      // Trigger voice recording
      const recordButton = screen.getByTestId('voice-record-button');
      await user.click(recordButton);

      // Should update both voice URL and text content
      // Note: This would be tested through the actual submission
    });
  });

  describe('Category selection', () => {
    it('should allow selecting different categories', async () => {
      const user = userEvent.setup();
      render(<AnonymousWonderButton />);

      // Open modal
      const openButton = screen.getByRole('button', {
        name: /wonder anonymously/i,
      });
      await user.click(openButton);

      // Default should be GENERAL
      const generalButton = screen.getByRole('button', { name: /general/i });
      expect(generalButton).toHaveClass('bg-[--color-primary]'); // Should have selected styling

      // Select BUSINESS category
      const businessButton = screen.getByRole('button', { name: /business/i });
      await user.click(businessButton);

      // BUSINESS should now be selected
      expect(businessButton).toHaveClass('bg-[--color-primary]'); // Should have selected styling
    });

    it('should display all available categories', async () => {
      const user = userEvent.setup();
      render(<AnonymousWonderButton />);

      // Open modal
      const openButton = screen.getByRole('button', {
        name: /wonder anonymously/i,
      });
      await user.click(openButton);

      // Check for all category buttons
      expect(
        screen.getByRole('button', { name: /general/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /business/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /recreation/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /infrastructure/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /community/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /environment/i })
      ).toBeInTheDocument();
    });
  });

  describe('Time context selection', () => {
    it('should allow selecting different time contexts', async () => {
      const user = userEvent.setup();
      render(<AnonymousWonderButton />);

      // Open modal
      const openButton = screen.getByRole('button', {
        name: /wonder anonymously/i,
      });
      await user.click(openButton);

      // Default should be ANYTIME
      const anytimeButton = screen.getByRole('button', { name: /anytime/i });
      expect(anytimeButton).toHaveClass('bg-[--color-primary]'); // Should have selected styling

      // Select MORNING context
      const morningButton = screen.getByRole('button', { name: /morning/i });
      await user.click(morningButton);

      // MORNING should now be selected
      expect(morningButton).toHaveClass('bg-[--color-primary]'); // Should have selected styling
    });
  });

  describe('Location sharing', () => {
    it('should toggle location sharing', async () => {
      const user = userEvent.setup();
      render(<AnonymousWonderButton />);

      // Open modal
      const openButton = screen.getByRole('button', {
        name: /wonder anonymously/i,
      });
      await user.click(openButton);

      // Initially location should not be shared
      const locationButton = screen.getByRole('button', {
        name: /share location \(optional\)/i,
      });
      expect(locationButton).toBeInTheDocument();

      // Enable location sharing
      await user.click(locationButton);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /location shared/i })
        ).toBeInTheDocument();
      });
    });

    it('should handle geolocation permission denied', async () => {
      const user = userEvent.setup();

      // Mock geolocation failure
      mockGeolocation.getCurrentPosition.mockImplementation(
        (success, error) => {
          error({ code: 1, message: 'Permission denied' });
        }
      );

      render(<AnonymousWonderButton />);

      // Open modal
      const openButton = screen.getByRole('button', {
        name: /wonder anonymously/i,
      });
      await user.click(openButton);

      // Try to enable location sharing
      const locationButton = screen.getByRole('button', {
        name: /share location \(optional\)/i,
      });
      await user.click(locationButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Location access denied. You can still share your wonder without location.'
        );
      });
    });
  });

  describe('Form submission', () => {
    it('should submit wonder with text content', async () => {
      const user = userEvent.setup();
      render(<AnonymousWonderButton />);

      // Open modal
      const openButton = screen.getByRole('button', {
        name: /wonder anonymously/i,
      });
      await user.click(openButton);

      // Add content
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'This is my wonderful idea');

      // Submit
      const submitButton = screen.getByRole('button', {
        name: /share wonder anonymously/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith({
          deviceId: 'mock-device-id',
          content: 'This is my wonderful idea',
          voiceUrl: undefined,
          category: 'GENERAL',
          timeContext: 'ANYTIME',
          location: undefined,
        });
      });
    });

    it('should submit wonder with voice content', async () => {
      const user = userEvent.setup();
      render(<AnonymousWonderButton />);

      // Open modal and switch to voice mode
      const openButton = screen.getByRole('button', {
        name: /wonder anonymously/i,
      });
      await user.click(openButton);

      const voiceButton = screen.getByRole('button', { name: /voice/i });
      await user.click(voiceButton);

      // Record voice
      const recordButton = screen.getByTestId('voice-record-button');
      await user.click(recordButton);

      // Submit
      const submitButton = screen.getByRole('button', {
        name: /share wonder anonymously/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            deviceId: 'mock-device-id',
            content: 'Mock transcribed text',
            voiceUrl: 'mock-audio-url',
          })
        );
      });
    });

    it('should submit wonder with location', async () => {
      const user = userEvent.setup();
      render(<AnonymousWonderButton />);

      // Open modal
      const openButton = screen.getByRole('button', {
        name: /wonder anonymously/i,
      });
      await user.click(openButton);

      // Add content
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'This is my wonderful idea');

      // Enable location sharing
      const locationButton = screen.getByRole('button', {
        name: /share location \(optional\)/i,
      });
      await user.click(locationButton);

      // Wait for location to be obtained
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /location shared/i })
        ).toBeInTheDocument();
      });

      // Submit
      const submitButton = screen.getByRole('button', {
        name: /share wonder anonymously/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            location: {
              type: 'Point',
              coordinates: [-122.4194, 37.7749],
            },
          })
        );
      });
    });

    it('should disable submit button when no content provided', async () => {
      const user = userEvent.setup();
      render(<AnonymousWonderButton />);

      // Open modal
      const openButton = screen.getByRole('button', {
        name: /wonder anonymously/i,
      });
      await user.click(openButton);

      // Submit button should be disabled when no content
      const submitButton = screen.getByRole('button', {
        name: /share wonder anonymously/i,
      });
      expect(submitButton).toBeDisabled();
    });

    it('should show error when fingerprinting is not available', async () => {
      const user = userEvent.setup();

      // Mock fingerprinting not available
      (isFingerprintingAvailable as jest.Mock).mockReturnValue(false);

      render(<AnonymousWonderButton />);

      // Open modal
      const openButton = screen.getByRole('button', {
        name: /wonder anonymously/i,
      });
      await user.click(openButton);

      // Add content
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'This is my wonderful idea');

      // Try to submit
      const submitButton = screen.getByRole('button', {
        name: /share wonder anonymously/i,
      });
      await user.click(submitButton);

      expect(toast.error).toHaveBeenCalledWith(
        'Browser not supported. Please use a modern browser to share anonymous wonders.'
      );
    });

    it('should disable submit button when mutation is pending', async () => {
      const user = userEvent.setup();

      // Mock pending mutation
      (api.wonders.createAnonymous.useMutation as jest.Mock).mockReturnValue({
        ...mockMutation,
        isPending: true,
      });

      render(<AnonymousWonderButton />);

      // Open modal
      const openButton = screen.getByRole('button', {
        name: /wonder anonymously/i,
      });
      await user.click(openButton);

      // Add content
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'This is my wonderful idea');

      // Submit button should be disabled and show loading state
      const submitButton = screen.getByRole('button', { name: /sharing.../i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Success handling', () => {
    it('should show success message and reset form on successful submission', async () => {
      const user = userEvent.setup();

      // Mock successful mutation
      const mockSuccessfulMutation = {
        mutate: jest.fn(),
        isPending: false,
      };

      (api.wonders.createAnonymous.useMutation as jest.Mock).mockImplementation(
        ({ onSuccess }) => {
          mockSuccessfulMutation.mutate = jest.fn(() => {
            onSuccess();
          });
          return mockSuccessfulMutation;
        }
      );

      render(<AnonymousWonderButton />);

      // Open modal
      const openButton = screen.getByRole('button', {
        name: /wonder anonymously/i,
      });
      await user.click(openButton);

      // Add content
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'This is my wonderful idea');

      // Submit
      const submitButton = screen.getByRole('button', {
        name: /share wonder anonymously/i,
      });
      await user.click(submitButton);

      expect(toast.success).toHaveBeenCalledWith(
        'Wonder shared! 🌟 Your anonymous wonder has been shared with the community.'
      );

      // Modal should be closed
      expect(
        screen.queryByText('Share Your Wonder ✨')
      ).not.toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('should show error message on submission failure', async () => {
      const user = userEvent.setup();

      // Mock failed mutation
      const mockFailedMutation = {
        mutate: jest.fn(),
        isPending: false,
      };

      (api.wonders.createAnonymous.useMutation as jest.Mock).mockImplementation(
        ({ onError }) => {
          mockFailedMutation.mutate = jest.fn(() => {
            onError({ message: 'Network error' });
          });
          return mockFailedMutation;
        }
      );

      render(<AnonymousWonderButton />);

      // Open modal
      const openButton = screen.getByRole('button', {
        name: /wonder anonymously/i,
      });
      await user.click(openButton);

      // Add content
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'This is my wonderful idea');

      // Submit
      const submitButton = screen.getByRole('button', {
        name: /share wonder anonymously/i,
      });
      await user.click(submitButton);

      expect(toast.error).toHaveBeenCalledWith(
        'Error sharing wonder: Network error'
      );
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', async () => {
      const user = userEvent.setup();
      render(<AnonymousWonderButton />);

      // Open modal
      const openButton = screen.getByRole('button', {
        name: /wonder anonymously/i,
      });
      await user.click(openButton);

      // Check for proper form structure
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();

      const submitButton = screen.getByRole('button', {
        name: /share wonder anonymously/i,
      });
      expect(submitButton).toBeInTheDocument();

      // Check for labeled form sections
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('When is this relevant?')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      render(<AnonymousWonderButton />);

      // Tab to the button
      await userEvent.tab();
      expect(
        screen.getByRole('button', { name: /wonder anonymously/i })
      ).toHaveFocus();

      // Press Enter to open modal
      await userEvent.keyboard('{Enter}');
      expect(screen.getByText('Share Your Wonder ✨')).toBeInTheDocument();
    });
  });
});
