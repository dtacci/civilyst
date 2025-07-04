import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import UnsubscribePage from '../page';
import { api } from '~/lib/trpc';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
}));

// Mock tRPC
jest.mock('~/lib/trpc', () => ({
  api: {
    email: {
      unsubscribe: {
        useMutation: jest.fn(),
      },
    },
  },
}));

// Mock URLSearchParams
const mockGet = jest.fn();
const mockSearchParams = {
  get: mockGet,
};

describe('UnsubscribePage', () => {
  const mockMutate = jest.fn();
  const mockUnsubscribeMutation = {
    mutate: mockMutate,
    isPending: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    (api.email.unsubscribe.useMutation as jest.Mock).mockReturnValue(
      mockUnsubscribeMutation
    );
  });

  describe('when token is missing', () => {
    beforeEach(() => {
      mockGet.mockReturnValue(null);
    });

    it('should render invalid link message', () => {
      render(<UnsubscribePage />);

      expect(screen.getByText('Invalid Link')).toBeInTheDocument();
      expect(
        screen.getByText('This unsubscribe link is invalid or has expired.')
      ).toBeInTheDocument();
    });
  });

  describe('when token is present', () => {
    beforeEach(() => {
      mockGet.mockReturnValue('valid-token-123');
    });

    it('should render unsubscribe options', () => {
      render(<UnsubscribePage />);

      expect(screen.getByText('Unsubscribe Options')).toBeInTheDocument();
      expect(screen.getByText('Campaign Updates')).toBeInTheDocument();
      expect(screen.getByText('Weekly Digest')).toBeInTheDocument();
      expect(screen.getByText('Product Updates')).toBeInTheDocument();
      expect(screen.getByText('Unsubscribe from All Emails')).toBeInTheDocument();
    });

    it('should handle campaign updates unsubscribe', async () => {
      render(<UnsubscribePage />);

      const campaignButton = screen.getByRole('button', {
        name: /campaign updates/i,
      });
      fireEvent.click(campaignButton);

      expect(mockMutate).toHaveBeenCalledWith({
        token: 'valid-token-123',
        type: 'campaign',
      });
    });

    it('should handle digest unsubscribe', async () => {
      render(<UnsubscribePage />);

      const digestButton = screen.getByRole('button', {
        name: /weekly digest/i,
      });
      fireEvent.click(digestButton);

      expect(mockMutate).toHaveBeenCalledWith({
        token: 'valid-token-123',
        type: 'digest',
      });
    });

    it('should handle marketing unsubscribe', async () => {
      render(<UnsubscribePage />);

      const marketingButton = screen.getByRole('button', {
        name: /product updates/i,
      });
      fireEvent.click(marketingButton);

      expect(mockMutate).toHaveBeenCalledWith({
        token: 'valid-token-123',
        type: 'marketing',
      });
    });

    it('should handle unsubscribe from all', async () => {
      render(<UnsubscribePage />);

      const allButton = screen.getByRole('button', {
        name: /unsubscribe from all emails/i,
      });
      fireEvent.click(allButton);

      expect(mockMutate).toHaveBeenCalledWith({
        token: 'valid-token-123',
        type: 'all',
      });
    });

    it('should show error when token is invalid', () => {
      mockGet.mockReturnValue(null);
      render(<UnsubscribePage />);

      const unsubscribeButton = screen.queryByText('Unsubscribe from All Emails');
      expect(unsubscribeButton).not.toBeInTheDocument();
      expect(screen.getByText('Invalid Link')).toBeInTheDocument();
    });
  });

  describe('successful unsubscribe', () => {
    beforeEach(() => {
      mockGet.mockReturnValue('valid-token-123');
    });

    it('should show success message after unsubscribe', () => {
      const successMutation = {
        mutate: mockMutate,
        isPending: false,
        isSuccess: true,
        data: { message: 'Successfully unsubscribed from campaign emails' },
      };

      (api.email.unsubscribe.useMutation as jest.Mock).mockReturnValue(
        successMutation
      );

      render(<UnsubscribePage />);

      expect(screen.getByText('Successfully Unsubscribed')).toBeInTheDocument();
      expect(
        screen.getByText('Successfully unsubscribed from campaign emails')
      ).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    beforeEach(() => {
      mockGet.mockReturnValue('valid-token-123');
    });

    it('should show loading state during mutation', () => {
      const loadingMutation = {
        mutate: mockMutate,
        isPending: true,
      };

      (api.email.unsubscribe.useMutation as jest.Mock).mockReturnValue(
        loadingMutation
      );

      render(<UnsubscribePage />);

      expect(screen.getByText('Processing...')).toBeInTheDocument();
      
      // All buttons should be disabled
      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockGet.mockReturnValue('valid-token-123');
    });

    it('should show error message on failure', () => {
      // The page shows error messages differently - need to trigger an error state
      render(<UnsubscribePage />);

      // Simulate the error by triggering the onError callback
      const campaignButton = screen.getByRole('button', {
        name: /campaign updates/i,
      });
      
      // Mock the mutation to trigger error
      const errorMutation = {
        mutate: jest.fn((_, { onError }) => {
          if (onError) onError({ message: 'Invalid token' });
        }),
        isPending: false,
      };

      (api.email.unsubscribe.useMutation as jest.Mock).mockReturnValue(
        errorMutation
      );

      // Re-render with error mutation
      render(<UnsubscribePage />);
      
      // Click to trigger error
      fireEvent.click(campaignButton);

      // Check for error message in the error div
      expect(screen.getByText('Invalid token')).toBeInTheDocument();
    });
  });
});