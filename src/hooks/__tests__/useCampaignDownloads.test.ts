import { renderHook, act } from '@testing-library/react';
import { useCampaignDownloads } from '../useCampaignDownloads';

// Mock fetch globally
global.fetch = jest.fn();

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('useCampaignDownloads', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock URL.createObjectURL and related functions
    global.URL.createObjectURL = jest.fn(() => 'mock-object-url');
    global.URL.revokeObjectURL = jest.fn();
    
    // Mock DOM manipulation for downloads
    const mockLink = {
      href: '',
      download: '',
      click: jest.fn(),
    };
    
    jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'a') {
        return mockLink as any;
      }
      return document.createElement(tagName);
    });
    
    jest.spyOn(document.body, 'appendChild').mockImplementation(jest.fn());
    jest.spyOn(document.body, 'removeChild').mockImplementation(jest.fn());

    // Use the existing window.location mock from jest.setup.js
  });

  const mockCampaignData = {
    id: 'test-campaign-123',
    title: 'Test Campaign',
    description: 'Test campaign description',
    status: 'ACTIVE' as const,
    location: {
      address: '123 Test St',
      city: 'Test City',
      state: 'CA',
      zipCode: '90210',
    },
    votes: {
      total: 100,
      support: 70,
      oppose: 30,
      supportPercentage: 70,
      opposePercentage: 30,
    },
    engagement: {
      views: 500,
      shares: 25,
      comments: 15,
      participants: 100,
    },
  };

  describe('initialization', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useCampaignDownloads(mockCampaignData));

      expect(result.current.isGenerating.qr).toBe(false);
      expect(result.current.isGenerating.pdf).toBe(null);
      expect(result.current.qrCodeDataUrl).toBe(null);
      expect(result.current.error).toBe(null);
      expect(result.current.canShare).toBeDefined();
    });

    it('should detect share capability correctly', () => {
      // Mock navigator.share
      Object.defineProperty(navigator, 'share', {
        value: jest.fn(),
        configurable: true,
      });

      const { result } = renderHook(() => useCampaignDownloads(mockCampaignData));
      expect(result.current.canShare).toBe(true);

      // Remove navigator.share
      delete (navigator as any).share;
      const { result: result2 } = renderHook(() => useCampaignDownloads(mockCampaignData));
      expect(result2.current.canShare).toBe(false);
    });
  });

  describe('generateQRCode', () => {
    it('should generate QR code successfully', async () => {
      const mockDataUrl = 'data:image/png;base64,mockQRData';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { qrCode: mockDataUrl },
        }),
      } as Response);

      const { result } = renderHook(() => useCampaignDownloads(mockCampaignData));

      let generatedDataUrl: string | null;
      await act(async () => {
        generatedDataUrl = await result.current.generateQRCode();
      });

      expect(generatedDataUrl!).toBe(mockDataUrl);
      expect(result.current.qrCodeDataUrl).toBe(mockDataUrl);
      expect(result.current.isGenerating.qr).toBe(false);
      expect(result.current.error).toBe(null);
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/campaigns/${mockCampaignData.id}/qr`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining(mockCampaignData.title),
        })
      );
    });

    it('should handle QR generation errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useCampaignDownloads(mockCampaignData));

      let generatedDataUrl: string | null;
      await act(async () => {
        generatedDataUrl = await result.current.generateQRCode();
      });

      expect(generatedDataUrl!).toBe(null);
      expect(result.current.error).toBe('Network error');
      expect(result.current.isGenerating.qr).toBe(false);
    });

    it('should set loading state during generation', async () => {
      let resolveRequest: (value: any) => void;
      const requestPromise = new Promise((resolve) => {
        resolveRequest = resolve;
      });

      mockFetch.mockReturnValueOnce(requestPromise as any);

      const { result } = renderHook(() => useCampaignDownloads(mockCampaignData));

      act(() => {
        result.current.generateQRCode();
      });

      expect(result.current.isGenerating.qr).toBe(true);

      await act(async () => {
        resolveRequest({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { qrCode: 'data:image/png;base64,test' },
          }),
        });
      });

      expect(result.current.isGenerating.qr).toBe(false);
    });

    it('should accept custom options', async () => {
      const mockDataUrl = 'data:image/png;base64,mockQRData';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { qrCode: mockDataUrl },
        }),
      } as Response);

      const { result } = renderHook(() => useCampaignDownloads(mockCampaignData));

      const customOptions = { width: 500, errorCorrectionLevel: 'H' as const };

      await act(async () => {
        await result.current.generateQRCode(customOptions);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"width":500'),
        })
      );
    });
  });

  describe('downloadQRCode', () => {
    it('should download QR code successfully', async () => {
      const mockBlob = new Blob(['mock-qr-data'], { type: 'image/png' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      } as Response);

      const { result } = renderHook(() => useCampaignDownloads(mockCampaignData));

      let downloadResult: boolean;
      await act(async () => {
        downloadResult = await result.current.downloadQRCode();
      });

      expect(downloadResult!).toBe(true);
      expect(result.current.error).toBe(null);
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(document.createElement).toHaveBeenCalledWith('a');
    });

    it('should use custom filename when provided', async () => {
      const mockBlob = new Blob(['mock-qr-data'], { type: 'image/png' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      } as Response);

      const { result } = renderHook(() => useCampaignDownloads(mockCampaignData));

      await act(async () => {
        await result.current.downloadQRCode('custom-qr.png');
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('filename=custom-qr.png')
      );
    });

    it('should handle download errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Download failed'));

      const { result } = renderHook(() => useCampaignDownloads(mockCampaignData));

      let downloadResult: boolean;
      await act(async () => {
        downloadResult = await result.current.downloadQRCode();
      });

      expect(downloadResult!).toBe(false);
      expect(result.current.error).toBe('Download failed');
    });
  });

  describe('downloadPDFReport', () => {
    it('should download full report successfully', async () => {
      const mockBlob = new Blob(['mock-pdf-data'], { type: 'application/pdf' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      } as Response);

      const { result } = renderHook(() => useCampaignDownloads(mockCampaignData));

      let downloadResult: boolean;
      await act(async () => {
        downloadResult = await result.current.downloadPDFReport('full_report');
      });

      expect(downloadResult!).toBe(true);
      expect(result.current.error).toBe(null);
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/campaigns/${mockCampaignData.id}/pdf`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"type":"full_report"'),
        })
      );
    });

    it('should download voting summary with voting data', async () => {
      const mockBlob = new Blob(['mock-voting-pdf'], { type: 'application/pdf' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      } as Response);

      const { result } = renderHook(() => useCampaignDownloads(mockCampaignData));

      await act(async () => {
        await result.current.downloadPDFReport('voting_summary');
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"votes"'),
        })
      );
    });

    it('should set PDF loading state correctly', async () => {
      let resolveRequest: (value: any) => void;
      const requestPromise = new Promise((resolve) => {
        resolveRequest = resolve;
      });

      mockFetch.mockReturnValueOnce(requestPromise as any);

      const { result } = renderHook(() => useCampaignDownloads(mockCampaignData));

      act(() => {
        result.current.downloadPDFReport('full_report');
      });

      expect(result.current.isGenerating.pdf).toBe('full_report');

      await act(async () => {
        resolveRequest({
          ok: true,
          blob: () => Promise.resolve(new Blob(['test'])),
        });
      });

      expect(result.current.isGenerating.pdf).toBe(null);
    });

    it('should handle PDF generation errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('PDF failed'));

      const { result } = renderHook(() => useCampaignDownloads(mockCampaignData));

      let downloadResult: boolean;
      await act(async () => {
        downloadResult = await result.current.downloadPDFReport('full_report');
      });

      expect(downloadResult!).toBe(false);
      expect(result.current.error).toBe('PDF failed');
      expect(result.current.isGenerating.pdf).toBe(null);
    });

    it('should accept custom options and filename', async () => {
      const mockBlob = new Blob(['mock-pdf'], { type: 'application/pdf' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      } as Response);

      const { result } = renderHook(() => useCampaignDownloads(mockCampaignData));

      const customOptions = { format: 'letter' as const, orientation: 'landscape' as const };
      const customFilename = 'custom-report.pdf';

      await act(async () => {
        await result.current.downloadPDFReport('full_report', customOptions, customFilename);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"format":"letter"'),
        })
      );
    });
  });

  describe('getCampaignUrl', () => {
    it('should return correct campaign URL', () => {
      const { result } = renderHook(() => useCampaignDownloads(mockCampaignData));

      const url = result.current.getCampaignUrl();
      expect(url).toBe(`http://localhost:3000/campaigns/${mockCampaignData.id}`);
    });

    it('should handle missing window object', () => {
      const originalWindow = global.window;
      delete (global as any).window;

      const { result } = renderHook(() => useCampaignDownloads(mockCampaignData));

      const url = result.current.getCampaignUrl();
      expect(url).toBe(`/campaigns/${mockCampaignData.id}`);

      global.window = originalWindow;
    });
  });

  describe('copyCampaignUrl', () => {
    it('should copy URL to clipboard successfully', async () => {
      const { result } = renderHook(() => useCampaignDownloads(mockCampaignData));

      let copyResult: boolean;
      await act(async () => {
        copyResult = await result.current.copyCampaignUrl();
      });

      expect(copyResult!).toBe(true);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        `http://localhost:3000/campaigns/${mockCampaignData.id}`
      );
    });

    it('should handle clipboard errors', async () => {
      (navigator.clipboard.writeText as jest.Mock).mockRejectedValueOnce(new Error('Clipboard error'));

      const { result } = renderHook(() => useCampaignDownloads(mockCampaignData));

      let copyResult: boolean;
      await act(async () => {
        copyResult = await result.current.copyCampaignUrl();
      });

      expect(copyResult!).toBe(false);
    });
  });

  describe('shareCampaign', () => {
    it('should use native share when available', async () => {
      const { result } = renderHook(() => useCampaignDownloads(mockCampaignData));

      let shareResult: boolean;
      await act(async () => {
        shareResult = await result.current.shareCampaign();
      });

      expect(shareResult!).toBe(true);
      expect(navigator.share).toHaveBeenCalledWith({
        title: mockCampaignData.title,
        text: mockCampaignData.description,
        url: `http://localhost:3000/campaigns/${mockCampaignData.id}`,
      });
    });

    it('should fallback to copy URL when native share unavailable', async () => {
      delete (navigator as any).share;

      const { result } = renderHook(() => useCampaignDownloads(mockCampaignData));

      let shareResult: boolean;
      await act(async () => {
        shareResult = await result.current.shareCampaign();
      });

      expect(shareResult!).toBe(true);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        `http://localhost:3000/campaigns/${mockCampaignData.id}`
      );
    });

    it('should handle native share errors', async () => {
      (navigator.share as jest.Mock).mockRejectedValueOnce(new Error('Share cancelled'));

      const { result } = renderHook(() => useCampaignDownloads(mockCampaignData));

      let shareResult: boolean;
      await act(async () => {
        shareResult = await result.current.shareCampaign();
      });

      expect(shareResult!).toBe(false);
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Test error'));

      const { result } = renderHook(() => useCampaignDownloads(mockCampaignData));

      // Trigger an error
      await act(async () => {
        await result.current.generateQRCode();
      });

      expect(result.current.error).toBe('Test error');

      // Clear the error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('error handling', () => {
    it('should handle unknown error types', async () => {
      mockFetch.mockRejectedValueOnce('Unknown error');

      const { result } = renderHook(() => useCampaignDownloads(mockCampaignData));

      await act(async () => {
        await result.current.generateQRCode();
      });

      expect(result.current.error).toBe('Unknown error');
    });

    it('should handle network response errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      const { result } = renderHook(() => useCampaignDownloads(mockCampaignData));

      await act(async () => {
        await result.current.downloadQRCode();
      });

      expect(result.current.error).toBeDefined();
    });
  });
});