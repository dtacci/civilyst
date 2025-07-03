import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DownloadTools } from '../DownloadTools';

// Mock fetch globally
global.fetch = jest.fn();

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('DownloadTools', () => {
  const mockLink = {
    href: '',
    download: '',
    click: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock URL.createObjectURL and related functions
    global.URL.createObjectURL = jest.fn(() => 'mock-object-url');
    global.URL.revokeObjectURL = jest.fn();
    
    // Mock document.createElement
    global.document.createElement = jest.fn().mockImplementation((tagName) => {
      if (tagName === 'a') {
        return mockLink as any;
      }
      return {
        tagName: tagName.toUpperCase(),
      } as any;
    });
    
    // Mock document.body methods
    global.document.body.appendChild = jest.fn();
    global.document.body.removeChild = jest.fn();
  });

  const defaultProps = {
    campaignId: 'test-campaign-123',
  };

  describe('buttons variant', () => {
    it('should render QR code and PDF download buttons', () => {
      render(<DownloadTools {...defaultProps} variant="buttons" />);

      expect(screen.getByRole('button', { name: /qr code/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /pdf report/i })).toBeInTheDocument();
    });

    it('should download QR code when QR button is clicked', async () => {
      const mockBlob = new Blob(['mock-qr-data'], { type: 'image/png' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      } as Response);

      render(<DownloadTools {...defaultProps} variant="buttons" />);

      const qrButton = screen.getByRole('button', { name: /qr code/i });
      fireEvent.click(qrButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `/api/campaigns/${defaultProps.campaignId}/qr?download=true&filename=campaign-${defaultProps.campaignId}-qr.png`
        );
      });

      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(document.createElement).toHaveBeenCalledWith('a');
    });

    it('should download PDF report when PDF button is clicked', async () => {
      const mockBlob = new Blob(['mock-pdf-data'], { type: 'application/pdf' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      } as Response);

      render(<DownloadTools {...defaultProps} variant="buttons" />);

      const pdfButton = screen.getByRole('button', { name: /pdf report/i });
      fireEvent.click(pdfButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `/api/campaigns/${defaultProps.campaignId}/pdf?download=true&type=full_report&filename=campaign-${defaultProps.campaignId}-full_report.pdf`
        );
      });

      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
    });

    it('should show loading state during download', async () => {
      let resolveDownload: (value: any) => void;
      const downloadPromise = new Promise((resolve) => {
        resolveDownload = resolve;
      });

      mockFetch.mockReturnValueOnce(downloadPromise as any);

      render(<DownloadTools {...defaultProps} variant="buttons" />);

      const qrButton = screen.getByRole('button', { name: /qr code/i });
      fireEvent.click(qrButton);

      expect(screen.getByRole('button', { name: /downloading/i })).toBeInTheDocument();

      // Resolve the download
      resolveDownload({
        ok: true,
        blob: () => Promise.resolve(new Blob(['test'])),
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /qr code/i })).toBeInTheDocument();
      });
    });

    it('should handle download errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockFetch.mockRejectedValueOnce(new Error('Download failed'));

      render(<DownloadTools {...defaultProps} variant="buttons" />);

      const qrButton = screen.getByRole('button', { name: /qr code/i });
      fireEvent.click(qrButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('QR download error:', expect.any(Error));
      });

      // Button should return to normal state
      expect(screen.getByRole('button', { name: /qr code/i })).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('should handle network errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<DownloadTools {...defaultProps} variant="buttons" />);

      const qrButton = screen.getByRole('button', { name: /qr code/i });
      fireEvent.click(qrButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('QR download error:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('menu variant', () => {
    it('should render menu items with proper structure', () => {
      render(<DownloadTools {...defaultProps} variant="menu" />);

      expect(screen.getByRole('button', { name: /download qr code/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /download report/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /download qr share pdf/i })).toBeInTheDocument();
    });

    it('should have ghost variant styling for menu items', () => {
      render(<DownloadTools {...defaultProps} variant="menu" />);

      const menuItems = screen.getAllByRole('button');
      menuItems.forEach(item => {
        expect(item).toHaveClass('justify-start');
      });
    });

    it('should download QR share PDF when clicked', async () => {
      const mockBlob = new Blob(['mock-qr-pdf'], { type: 'application/pdf' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      } as Response);

      render(<DownloadTools {...defaultProps} variant="menu" />);

      const qrShareButton = screen.getByRole('button', { name: /download qr share pdf/i });
      fireEvent.click(qrShareButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `/api/campaigns/${defaultProps.campaignId}/pdf?download=true&type=qr_share&filename=campaign-${defaultProps.campaignId}-qr_share.pdf`
        );
      });
    });
  });

  describe('size prop', () => {
    it('should apply small size', () => {
      render(<DownloadTools {...defaultProps} size="sm" />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });

    it('should apply large size', () => {
      render(<DownloadTools {...defaultProps} size="lg" />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });
  });

  describe('className prop', () => {
    it('should apply custom className', () => {
      const customClass = 'custom-test-class';
      const { container } = render(
        <DownloadTools {...defaultProps} className={customClass} />
      );

      expect(container.firstChild).toHaveClass(customClass);
    });
  });

  describe('accessibility', () => {
    it('should have proper button roles and labels', () => {
      render(<DownloadTools {...defaultProps} variant="buttons" />);

      const qrButton = screen.getByRole('button', { name: /qr code/i });
      const pdfButton = screen.getByRole('button', { name: /pdf report/i });

      expect(qrButton).toBeInTheDocument();
      expect(pdfButton).toBeInTheDocument();
    });

    it('should disable buttons during download', async () => {
      let resolveDownload: (value: any) => void;
      const downloadPromise = new Promise((resolve) => {
        resolveDownload = resolve;
      });

      mockFetch.mockReturnValueOnce(downloadPromise as any);

      render(<DownloadTools {...defaultProps} variant="buttons" />);

      const qrButton = screen.getByRole('button', { name: /qr code/i });
      const pdfButton = screen.getByRole('button', { name: /pdf report/i });

      fireEvent.click(qrButton);

      // QR button should be disabled during its download
      expect(screen.getByRole('button', { name: /downloading/i })).toBeDisabled();
      // PDF button should remain enabled
      expect(pdfButton).not.toBeDisabled();

      resolveDownload({
        ok: true,
        blob: () => Promise.resolve(new Blob(['test'])),
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /qr code/i })).not.toBeDisabled();
      });
    });
  });

  describe('error scenarios', () => {
    it('should handle blob creation errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.reject(new Error('Blob creation failed')),
      } as any);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<DownloadTools {...defaultProps} variant="buttons" />);

      const qrButton = screen.getByRole('button', { name: /qr code/i });
      fireEvent.click(qrButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('QR download error:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('should handle simultaneous downloads correctly', async () => {
      const qrBlob = new Blob(['qr-data'], { type: 'image/png' });
      const pdfBlob = new Blob(['pdf-data'], { type: 'application/pdf' });

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          blob: () => Promise.resolve(qrBlob),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          blob: () => Promise.resolve(pdfBlob),
        } as Response);

      render(<DownloadTools {...defaultProps} variant="buttons" />);

      const qrButton = screen.getByRole('button', { name: /qr code/i });
      const pdfButton = screen.getByRole('button', { name: /pdf report/i });

      // Click both buttons quickly
      fireEvent.click(qrButton);
      fireEvent.click(pdfButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });
  });
});