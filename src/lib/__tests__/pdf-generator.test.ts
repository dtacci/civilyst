import {
  generateCampaignReport,
  generateVotingSummaryPDF,
  generateCampaignQRPDF,
  type CampaignReportData,
  type PDFOptions,
} from '../pdf-generator';

// Mock jsPDF
jest.mock('jspdf', () => {
  return jest.fn().mockImplementation(() => ({
    internal: {
      pageSize: {
        getWidth: () => 210,
        getHeight: () => 297,
      },
      pages: [null, {}], // Mock pages array
    },
    setFontSize: jest.fn(),
    setFont: jest.fn(),
    text: jest.fn(),
    splitTextToSize: jest.fn((text: string) => [text]),
    addPage: jest.fn(),
    setFillColor: jest.fn(),
    setDrawColor: jest.fn(),
    rect: jest.fn(),
    addImage: jest.fn(),
    setPage: jest.fn(),
    output: jest.fn(() => new ArrayBuffer(1024)),
  }));
});

// Mock date-fns format function
jest.mock('date-fns', () => ({
  format: jest.fn((date: Date, formatStr: string) => {
    if (formatStr === 'PPP') return 'January 1, 2024';
    return date.toISOString();
  }),
}));

const jsPDF = require('jspdf');

describe('PDF Generator Utilities', () => {
  let mockPDFInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPDFInstance = {
      internal: {
        pageSize: {
          getWidth: () => 210,
          getHeight: () => 297,
        },
        pages: [null, {}],
      },
      setFontSize: jest.fn(),
      setFont: jest.fn(),
      text: jest.fn(),
      splitTextToSize: jest.fn((text: string) => [text]),
      addPage: jest.fn(),
      setFillColor: jest.fn(),
      setDrawColor: jest.fn(),
      rect: jest.fn(),
      addImage: jest.fn(),
      setPage: jest.fn(),
      output: jest.fn(() => new ArrayBuffer(1024)),
    };
    jsPDF.mockReturnValue(mockPDFInstance);
  });

  describe('generateCampaignReport', () => {
    const mockCampaignData: CampaignReportData = {
      id: 'test-campaign-123',
      title: 'Test Campaign for PDF Generation',
      description:
        'This is a test campaign description for PDF report generation.',
      status: 'ACTIVE',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
      location: {
        address: '123 Test Street',
        city: 'Test City',
        state: 'CA',
        zipCode: '90210',
        coordinates: { lat: 34.0522, lng: -118.2437 },
      },
      votes: {
        total: 150,
        support: 90,
        oppose: 60,
        supportPercentage: 60,
        opposePercentage: 40,
      },
      engagement: {
        views: 1200,
        shares: 45,
        comments: 23,
        participants: 150,
      },
    };

    it('should generate PDF with default options', async () => {
      const result = await generateCampaignReport(mockCampaignData);

      expect(result).toBeInstanceOf(Buffer);
      expect(jsPDF).toHaveBeenCalledWith({
        format: 'a4',
        orientation: 'portrait',
        unit: 'mm',
        compress: true,
      });
    });

    it('should generate PDF with custom options', async () => {
      const customOptions: Partial<PDFOptions> = {
        format: 'letter',
        orientation: 'landscape',
        fontSize: 14,
        margin: { top: 25, right: 25, bottom: 25, left: 25 },
      };

      await generateCampaignReport(mockCampaignData, customOptions);

      expect(jsPDF).toHaveBeenCalledWith({
        format: 'letter',
        orientation: 'landscape',
        unit: 'mm',
        compress: true,
      });
    });

    it('should include campaign information in PDF', async () => {
      await generateCampaignReport(mockCampaignData);

      // Verify campaign title is added
      expect(mockPDFInstance.text).toHaveBeenCalledWith(
        'Campaign Report',
        expect.any(Number),
        expect.any(Number),
        expect.objectContaining({ align: 'center' })
      );

      // Verify basic campaign info is included
      expect(mockPDFInstance.splitTextToSize).toHaveBeenCalledWith(
        expect.stringContaining('Test Campaign for PDF Generation'),
        expect.any(Number)
      );
    });

    it('should include voting results when available', async () => {
      await generateCampaignReport(mockCampaignData);

      // Check if voting results section is created
      expect(mockPDFInstance.text).toHaveBeenCalledWith(
        'Voting Results',
        expect.any(Number),
        expect.any(Number)
      );

      // Check if voting bars are drawn
      expect(mockPDFInstance.setFillColor).toHaveBeenCalledWith(34, 197, 94); // Green for support
      expect(mockPDFInstance.setFillColor).toHaveBeenCalledWith(239, 68, 68); // Red for oppose
      expect(mockPDFInstance.rect).toHaveBeenCalled();
    });

    it('should include location information when available', async () => {
      await generateCampaignReport(mockCampaignData);

      expect(mockPDFInstance.text).toHaveBeenCalledWith(
        'Location',
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should include engagement statistics when available', async () => {
      await generateCampaignReport(mockCampaignData);

      expect(mockPDFInstance.text).toHaveBeenCalledWith(
        'Engagement Statistics',
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should handle timeline data', async () => {
      const dataWithTimeline = {
        ...mockCampaignData,
        timeline: [
          {
            date: new Date('2024-01-01'),
            event: 'Campaign Created',
            description: 'Initial campaign setup',
          },
          {
            date: '2024-01-02',
            event: 'First Vote',
            description: 'First community member voted',
          },
        ],
      };

      await generateCampaignReport(dataWithTimeline);

      expect(mockPDFInstance.text).toHaveBeenCalledWith(
        'Timeline',
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should handle documents list', async () => {
      const dataWithDocuments = {
        ...mockCampaignData,
        documents: [
          {
            name: 'Campaign Proposal.pdf',
            url: 'https://example.com/doc1.pdf',
            type: 'PDF',
            size: 1024000,
          },
        ],
      };

      await generateCampaignReport(dataWithDocuments);

      expect(mockPDFInstance.text).toHaveBeenCalledWith(
        'Related Documents',
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should add page numbers and footer', async () => {
      await generateCampaignReport(mockCampaignData);

      expect(mockPDFInstance.setPage).toHaveBeenCalled();
      expect(mockPDFInstance.text).toHaveBeenCalledWith(
        expect.stringContaining('Civilyst - Civic Engagement Platform'),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should handle PDF generation errors', async () => {
      mockPDFInstance.output.mockImplementation(() => {
        throw new Error('PDF output failed');
      });

      await expect(generateCampaignReport(mockCampaignData)).rejects.toThrow(
        'Failed to generate PDF report: PDF output failed'
      );
    });

    it('should validate input data', async () => {
      const invalidData = {
        id: '', // Empty ID
        title: 'Test',
        description: 'Test desc',
        status: 'INVALID' as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await expect(generateCampaignReport(invalidData)).rejects.toThrow();
    });

    it('should handle string dates properly', async () => {
      const dataWithStringDates = {
        ...mockCampaignData,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      };

      await expect(
        generateCampaignReport(dataWithStringDates)
      ).resolves.toBeDefined();
    });
  });

  describe('generateVotingSummaryPDF', () => {
    const mockVotingData = {
      id: 'test-123',
      title: 'Voting Summary Test',
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

    it('should generate voting summary PDF', async () => {
      const result = await generateVotingSummaryPDF(mockVotingData);

      expect(result).toBeInstanceOf(Buffer);
      expect(jsPDF).toHaveBeenCalled();
    });

    it('should create minimal campaign data for summary', async () => {
      await generateVotingSummaryPDF(mockVotingData);

      // Verify the internal call to generateCampaignReport includes default values
      expect(mockPDFInstance.splitTextToSize).toHaveBeenCalledWith(
        expect.stringContaining('Voting Summary Test'),
        expect.any(Number)
      );
    });
  });

  describe('generateCampaignQRPDF', () => {
    const mockCampaignData = {
      id: 'test-123',
      title: 'QR PDF Test Campaign',
      description: 'Test description for QR PDF',
    };

    const mockQRDataUrl = 'data:image/png;base64,mockQRData';

    it('should generate QR PDF successfully', async () => {
      const result = await generateCampaignQRPDF(
        mockCampaignData,
        mockQRDataUrl
      );

      expect(result).toBeInstanceOf(Buffer);
      expect(jsPDF).toHaveBeenCalled();
    });

    it('should include QR code image in PDF', async () => {
      await generateCampaignQRPDF(mockCampaignData, mockQRDataUrl);

      expect(mockPDFInstance.addImage).toHaveBeenCalledWith(
        mockQRDataUrl,
        'PNG',
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should include campaign title and instructions', async () => {
      await generateCampaignQRPDF(mockCampaignData, mockQRDataUrl);

      expect(mockPDFInstance.text).toHaveBeenCalledWith(
        'Campaign QR Code',
        expect.any(Number),
        expect.any(Number),
        expect.objectContaining({ align: 'center' })
      );

      expect(mockPDFInstance.text).toHaveBeenCalledWith(
        'Scan this QR code to view the campaign',
        expect.any(Number),
        expect.any(Number),
        expect.objectContaining({ align: 'center' })
      );
    });

    it('should handle QR PDF generation errors', async () => {
      mockPDFInstance.addImage.mockImplementation(() => {
        throw new Error('Image add failed');
      });

      await expect(
        generateCampaignQRPDF(mockCampaignData, mockQRDataUrl)
      ).rejects.toThrow('Failed to generate QR PDF: Image add failed');
    });

    it('should include campaign description when provided', async () => {
      await generateCampaignQRPDF(mockCampaignData, mockQRDataUrl);

      expect(mockPDFInstance.splitTextToSize).toHaveBeenCalledWith(
        mockCampaignData.description,
        expect.any(Number)
      );
    });
  });

  describe('PDF Options validation', () => {
    const mockData: CampaignReportData = {
      id: 'test',
      title: 'Test',
      description: 'Test desc',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should validate PDF format options', async () => {
      const invalidOptions = {
        format: 'invalid' as any,
      };

      await expect(
        generateCampaignReport(mockData, invalidOptions)
      ).rejects.toThrow();
    });

    it('should validate orientation options', async () => {
      const invalidOptions = {
        orientation: 'invalid' as any,
      };

      await expect(
        generateCampaignReport(mockData, invalidOptions)
      ).rejects.toThrow();
    });

    it('should validate margin values', async () => {
      const invalidOptions = {
        margin: {
          top: -5, // Invalid negative margin
        },
      };

      await expect(
        generateCampaignReport(mockData, invalidOptions)
      ).rejects.toThrow();
    });

    it('should validate font size range', async () => {
      const invalidOptions = {
        fontSize: 5, // Below minimum
      };

      await expect(
        generateCampaignReport(mockData, invalidOptions)
      ).rejects.toThrow();
    });
  });

  describe('Error handling', () => {
    const mockData: CampaignReportData = {
      id: 'test',
      title: 'Test',
      description: 'Test desc',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should handle jsPDF constructor errors', async () => {
      jsPDF.mockImplementation(() => {
        throw new Error('PDF initialization failed');
      });

      await expect(generateCampaignReport(mockData)).rejects.toThrow(
        'Failed to generate PDF report: PDF initialization failed'
      );
    });

    it('should handle unknown errors gracefully', async () => {
      mockPDFInstance.output.mockImplementation(() => {
        throw 'Unknown error type';
      });

      await expect(generateCampaignReport(mockData)).rejects.toThrow(
        'Failed to generate PDF report: Unknown error'
      );
    });
  });
});
