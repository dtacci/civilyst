import {
  generateCampaignQR,
  generateUrlQR,
  generateQRBuffer,
  generateQRSVG,
  createCampaignShareUrl,
  generateCampaignShareQR,
  type QRCodeOptions,
  type CampaignQRData,
} from '../qr-generator';

// Mock the qrcode library
jest.mock('qrcode', () => ({
  toDataURL: jest.fn(),
  toBuffer: jest.fn(),
  toString: jest.fn(),
}));

const QRCode = require('qrcode');

describe('QR Generator Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';
  });

  describe('generateCampaignQR', () => {
    const mockCampaignData: CampaignQRData = {
      campaignId: 'test-campaign-123',
      title: 'Test Campaign',
      url: 'http://localhost:3000/campaigns/test-campaign-123',
      type: 'campaign',
      metadata: { platform: 'civilyst' },
    };

    const mockOptions: Partial<QRCodeOptions> = {
      width: 200,
      margin: 2,
      errorCorrectionLevel: 'L',
    };

    it('should generate QR code data URL successfully', async () => {
      const expectedDataUrl = 'data:image/png;base64,mockBase64String';
      QRCode.toDataURL.mockResolvedValue(expectedDataUrl);

      const result = await generateCampaignQR(mockCampaignData, mockOptions);

      expect(result).toBe(expectedDataUrl);
      expect(QRCode.toDataURL).toHaveBeenCalledWith(
        expect.stringContaining('test-campaign-123'),
        expect.objectContaining({
          width: 200,
          margin: 2,
          errorCorrectionLevel: 'L',
        })
      );
    });

    it('should use default options when none provided', async () => {
      QRCode.toDataURL.mockResolvedValue('data:image/png;base64,mock');

      await generateCampaignQR(mockCampaignData);

      expect(QRCode.toDataURL).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          width: 300,
          margin: 4,
          errorCorrectionLevel: 'M',
          type: 'image/png',
          quality: 0.92,
        })
      );
    });

    it('should include structured data in QR content', async () => {
      QRCode.toDataURL.mockResolvedValue('data:image/png;base64,mock');

      await generateCampaignQR(mockCampaignData);

      const qrContentCall = QRCode.toDataURL.mock.calls[0][0];
      const qrContent = JSON.parse(qrContentCall);

      expect(qrContent).toMatchObject({
        campaignId: 'test-campaign-123',
        title: 'Test Campaign',
        url: 'http://localhost:3000/campaigns/test-campaign-123',
        type: 'campaign',
        version: '1.0',
      });
      expect(qrContent.generated).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      QRCode.toDataURL.mockRejectedValue(new Error('QR generation failed'));

      await expect(generateCampaignQR(mockCampaignData)).rejects.toThrow(
        'Failed to generate QR code: QR generation failed'
      );
    });

    it('should validate input data', async () => {
      const invalidData = {
        campaignId: '',
        title: 'Test',
        url: 'invalid-url',
        type: 'invalid' as any,
      };

      await expect(generateCampaignQR(invalidData)).rejects.toThrow();
    });
  });

  describe('generateUrlQR', () => {
    it('should generate QR code for valid URL', async () => {
      const testUrl = 'https://example.com/test';
      const expectedDataUrl = 'data:image/png;base64,mockBase64String';
      QRCode.toDataURL.mockResolvedValue(expectedDataUrl);

      const result = await generateUrlQR(testUrl);

      expect(result).toBe(expectedDataUrl);
      expect(QRCode.toDataURL).toHaveBeenCalledWith(
        testUrl,
        expect.objectContaining({
          width: 300,
          margin: 4,
          errorCorrectionLevel: 'M',
        })
      );
    });

    it('should reject invalid URLs', async () => {
      await expect(generateUrlQR('not-a-url')).rejects.toThrow();
    });

    it('should handle QR generation errors', async () => {
      QRCode.toDataURL.mockRejectedValue(new Error('Network error'));

      await expect(generateUrlQR('https://example.com')).rejects.toThrow(
        'Failed to generate URL QR code: Network error'
      );
    });
  });

  describe('generateQRBuffer', () => {
    it('should generate QR code buffer', async () => {
      const mockBuffer = Buffer.from('mock-buffer-data');
      QRCode.toBuffer.mockResolvedValue(mockBuffer);

      const result = await generateQRBuffer('test data');

      expect(result).toBe(mockBuffer);
      expect(QRCode.toBuffer).toHaveBeenCalledWith(
        'test data',
        expect.objectContaining({
          width: 300,
          margin: 4,
          errorCorrectionLevel: 'M',
          type: 'png',
        })
      );
    });

    it('should handle buffer generation errors', async () => {
      QRCode.toBuffer.mockRejectedValue(new Error('Buffer error'));

      await expect(generateQRBuffer('test')).rejects.toThrow(
        'Failed to generate QR code buffer: Buffer error'
      );
    });
  });

  describe('generateQRSVG', () => {
    it('should generate QR code SVG string', async () => {
      const mockSvg = '<svg>mock svg content</svg>';
      QRCode.toString.mockResolvedValue(mockSvg);

      const result = await generateQRSVG('test data');

      expect(result).toBe(mockSvg);
      expect(QRCode.toString).toHaveBeenCalledWith(
        'test data',
        expect.objectContaining({
          type: 'svg',
          width: 300,
          margin: 4,
          errorCorrectionLevel: 'M',
        })
      );
    });

    it('should handle SVG generation errors', async () => {
      QRCode.toString.mockRejectedValue(new Error('SVG error'));

      await expect(generateQRSVG('test')).rejects.toThrow(
        'Failed to generate QR code SVG: SVG error'
      );
    });
  });

  describe('createCampaignShareUrl', () => {
    it('should create campaign share URL with tracking parameters', () => {
      const campaignId = 'test-campaign-123';
      const source = 'social';
      const baseUrl = 'https://civilyst.com';

      const result = createCampaignShareUrl(campaignId, source, baseUrl);

      expect(result).toBe(
        'https://civilyst.com/campaigns/test-campaign-123?utm_source=social&utm_medium=qr_code&utm_campaign=campaign_share&ref=qr'
      );
    });

    it('should use default values', () => {
      const result = createCampaignShareUrl('test-123');

      expect(result).toContain('utm_source=qr');
      expect(result).toContain('utm_medium=qr_code');
      expect(result).toContain('utm_campaign=campaign_share');
      expect(result).toContain('ref=qr');
    });

    it('should use environment base URL when available', () => {
      process.env.NEXT_PUBLIC_BASE_URL = 'https://production.com';
      
      const result = createCampaignShareUrl('test-123');

      expect(result).toMatch(/^https:\/\/production\.com\/campaigns\/test-123/);
    });

    it('should fallback to localhost when no environment variable', () => {
      delete process.env.NEXT_PUBLIC_BASE_URL;
      
      const result = createCampaignShareUrl('test-123');

      expect(result).toMatch(/^http:\/\/localhost:3000\/campaigns\/test-123/);
    });
  });

  describe('generateCampaignShareQR', () => {
    it('should generate campaign share QR with optimized settings', async () => {
      const expectedDataUrl = 'data:image/png;base64,mockBase64String';
      QRCode.toDataURL.mockResolvedValue(expectedDataUrl);

      const result = await generateCampaignShareQR('test-123', 'Test Campaign');

      expect(result).toBe(expectedDataUrl);
      expect(QRCode.toDataURL).toHaveBeenCalledWith(
        expect.stringContaining('test-123'),
        expect.objectContaining({
          width: 300,
          margin: 4,
          errorCorrectionLevel: 'M',
        })
      );
    });

    it('should override default options', async () => {
      QRCode.toDataURL.mockResolvedValue('data:image/png;base64,mock');

      await generateCampaignShareQR('test-123', 'Test', { width: 500 });

      expect(QRCode.toDataURL).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          width: 500,
        })
      );
    });

    it('should include campaign metadata', async () => {
      QRCode.toDataURL.mockResolvedValue('data:image/png;base64,mock');

      await generateCampaignShareQR('test-123', 'Test Campaign');

      const qrContentCall = QRCode.toDataURL.mock.calls[0][0];
      const qrContent = JSON.parse(qrContentCall);

      expect(qrContent.metadata).toMatchObject({
        platform: 'civilyst',
      });
      expect(qrContent.metadata.generated).toBeDefined();
    });
  });

  describe('Input validation', () => {
    it('should validate QR code options', async () => {
      const invalidOptions = {
        width: 50, // Below minimum
        margin: 25, // Above maximum
        errorCorrectionLevel: 'INVALID' as any,
      };

      await expect(
        generateUrlQR('https://example.com', invalidOptions)
      ).rejects.toThrow();
    });

    it('should validate campaign QR data', async () => {
      const invalidData = {
        campaignId: '', // Empty string
        title: 'Test',
        url: 'not-a-url', // Invalid URL
        type: 'invalid' as any,
      };

      await expect(generateCampaignQR(invalidData)).rejects.toThrow();
    });
  });

  describe('Error handling', () => {
    it('should handle unknown errors gracefully', async () => {
      QRCode.toDataURL.mockRejectedValue('Unknown error');

      await expect(generateUrlQR('https://example.com')).rejects.toThrow(
        'Failed to generate URL QR code: Unknown error'
      );
    });

    it('should preserve error messages from QRCode library', async () => {
      const originalError = new Error('Specific QR error message');
      QRCode.toDataURL.mockRejectedValue(originalError);

      await expect(generateUrlQR('https://example.com')).rejects.toThrow(
        'Failed to generate URL QR code: Specific QR error message'
      );
    });
  });
});