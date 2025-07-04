import jsPDF from 'jspdf';
import { z } from 'zod';
import { format } from 'date-fns';

// PDF generation options schema
const PDFOptionsSchema = z.object({
  format: z.enum(['a4', 'letter', 'legal']).optional().default('a4'),
  orientation: z.enum(['portrait', 'landscape']).optional().default('portrait'),
  unit: z.enum(['mm', 'cm', 'in', 'px']).optional().default('mm'),
  compress: z.boolean().optional().default(true),
  fontSize: z.number().min(8).max(72).optional().default(11),
  lineHeight: z.number().min(1).max(3).optional().default(1.4),
  margin: z
    .object({
      top: z.number().min(0).max(50).optional().default(20),
      right: z.number().min(0).max(50).optional().default(20),
      bottom: z.number().min(0).max(50).optional().default(20),
      left: z.number().min(0).max(50).optional().default(20),
    })
    .optional()
    .default({}),
});

type PDFOptions = z.infer<typeof PDFOptionsSchema>;

// Campaign data schema for PDF reports
const CampaignReportDataSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED']),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
  location: z
    .object({
      address: z.string(),
      city: z.string(),
      state: z.string(),
      zipCode: z.string(),
      coordinates: z
        .object({
          lat: z.number(),
          lng: z.number(),
        })
        .optional(),
    })
    .optional(),
  votes: z
    .object({
      total: z.number(),
      support: z.number(),
      oppose: z.number(),
      supportPercentage: z.number(),
      opposePercentage: z.number(),
    })
    .optional(),
  engagement: z
    .object({
      views: z.number(),
      shares: z.number(),
      comments: z.number(),
      participants: z.number(),
    })
    .optional(),
  timeline: z
    .array(
      z.object({
        date: z.string().or(z.date()),
        event: z.string(),
        description: z.string(),
      })
    )
    .optional(),
  documents: z
    .array(
      z.object({
        name: z.string(),
        url: z.string(),
        type: z.string(),
        size: z.number().optional(),
      })
    )
    .optional(),
});

type CampaignReportData = z.infer<typeof CampaignReportDataSchema>;

/**
 * Generate campaign summary PDF report
 * @param data Campaign data
 * @param options PDF generation options
 * @returns Promise resolving to PDF buffer
 */
export async function generateCampaignReport(
  data: CampaignReportData,
  options: Partial<PDFOptions> = {}
): Promise<Buffer> {
  try {
    // Validate input data
    const validatedData = CampaignReportDataSchema.parse(data);
    const validatedOptions = PDFOptionsSchema.parse(options);

    // Create new PDF document
    const doc = new jsPDF({
      format: validatedOptions.format,
      orientation: validatedOptions.orientation,
      unit: validatedOptions.unit,
      compress: validatedOptions.compress,
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = validatedOptions.margin;
    const contentWidth = pageWidth - margin.left - margin.right;
    let yPosition = margin.top;

    // Helper function to add text with automatic line breaks
    const addText = (
      text: string,
      x: number,
      y: number,
      maxWidth: number,
      fontSize: number = validatedOptions.fontSize
    ) => {
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return y + lines.length * fontSize * validatedOptions.lineHeight;
    };

    // Helper function to check if we need a new page
    const checkPageBreak = (requiredHeight: number) => {
      if (yPosition + requiredHeight > pageHeight - margin.bottom) {
        doc.addPage();
        yPosition = margin.top;
      }
    };

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Campaign Report', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Campaign Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    yPosition = addText(
      validatedData.title,
      margin.left,
      yPosition,
      contentWidth,
      16
    );
    yPosition += 10;

    // Basic Information Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Campaign Information', margin.left, yPosition);
    yPosition += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    // Campaign ID
    yPosition = addText(
      `Campaign ID: ${validatedData.id}`,
      margin.left,
      yPosition,
      contentWidth
    );
    yPosition += 5;

    // Status
    yPosition = addText(
      `Status: ${validatedData.status}`,
      margin.left,
      yPosition,
      contentWidth
    );
    yPosition += 5;

    // Dates
    const createdDate =
      typeof validatedData.createdAt === 'string'
        ? new Date(validatedData.createdAt)
        : validatedData.createdAt;
    const updatedDate =
      typeof validatedData.updatedAt === 'string'
        ? new Date(validatedData.updatedAt)
        : validatedData.updatedAt;

    yPosition = addText(
      `Created: ${format(createdDate, 'PPP')}`,
      margin.left,
      yPosition,
      contentWidth
    );
    yPosition += 5;
    yPosition = addText(
      `Last Updated: ${format(updatedDate, 'PPP')}`,
      margin.left,
      yPosition,
      contentWidth
    );
    yPosition += 10;

    // Location Section
    if (validatedData.location) {
      checkPageBreak(30);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Location', margin.left, yPosition);
      yPosition += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const location = validatedData.location;
      yPosition = addText(
        `Address: ${location.address}`,
        margin.left,
        yPosition,
        contentWidth
      );
      yPosition += 5;
      yPosition = addText(
        `City: ${location.city}, ${location.state} ${location.zipCode}`,
        margin.left,
        yPosition,
        contentWidth
      );

      if (location.coordinates) {
        yPosition += 5;
        yPosition = addText(
          `Coordinates: ${location.coordinates.lat.toFixed(6)}, ${location.coordinates.lng.toFixed(6)}`,
          margin.left,
          yPosition,
          contentWidth
        );
      }
      yPosition += 10;
    }

    // Description Section
    checkPageBreak(50);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Description', margin.left, yPosition);
    yPosition += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    yPosition = addText(
      validatedData.description,
      margin.left,
      yPosition,
      contentWidth
    );
    yPosition += 10;

    // Voting Results Section
    if (validatedData.votes) {
      checkPageBreak(60);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Voting Results', margin.left, yPosition);
      yPosition += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const votes = validatedData.votes;

      yPosition = addText(
        `Total Votes: ${votes.total}`,
        margin.left,
        yPosition,
        contentWidth
      );
      yPosition += 5;
      yPosition = addText(
        `Support: ${votes.support} (${votes.supportPercentage.toFixed(1)}%)`,
        margin.left,
        yPosition,
        contentWidth
      );
      yPosition += 5;
      yPosition = addText(
        `Oppose: ${votes.oppose} (${votes.opposePercentage.toFixed(1)}%)`,
        margin.left,
        yPosition,
        contentWidth
      );
      yPosition += 10;

      // Simple visual representation
      const barWidth = contentWidth - 40;
      const barHeight = 8;
      const supportWidth = (votes.supportPercentage / 100) * barWidth;
      const opposeWidth = (votes.opposePercentage / 100) * barWidth;

      // Support bar (green)
      doc.setFillColor(34, 197, 94); // Green
      doc.rect(margin.left, yPosition, supportWidth, barHeight, 'F');

      // Oppose bar (red)
      doc.setFillColor(239, 68, 68); // Red
      doc.rect(
        margin.left + supportWidth,
        yPosition,
        opposeWidth,
        barHeight,
        'F'
      );

      // Border
      doc.setDrawColor(0, 0, 0);
      doc.rect(margin.left, yPosition, barWidth, barHeight, 'S');

      yPosition += barHeight + 10;
    }

    // Engagement Statistics Section
    if (validatedData.engagement) {
      checkPageBreak(40);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Engagement Statistics', margin.left, yPosition);
      yPosition += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const engagement = validatedData.engagement;

      yPosition = addText(
        `Views: ${engagement.views}`,
        margin.left,
        yPosition,
        contentWidth
      );
      yPosition += 5;
      yPosition = addText(
        `Shares: ${engagement.shares}`,
        margin.left,
        yPosition,
        contentWidth
      );
      yPosition += 5;
      yPosition = addText(
        `Comments: ${engagement.comments}`,
        margin.left,
        yPosition,
        contentWidth
      );
      yPosition += 5;
      yPosition = addText(
        `Participants: ${engagement.participants}`,
        margin.left,
        yPosition,
        contentWidth
      );
      yPosition += 10;
    }

    // Timeline Section
    if (validatedData.timeline && validatedData.timeline.length > 0) {
      checkPageBreak(50);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Timeline', margin.left, yPosition);
      yPosition += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');

      validatedData.timeline.forEach((event) => {
        checkPageBreak(20);
        const eventDate =
          typeof event.date === 'string' ? new Date(event.date) : event.date;
        yPosition = addText(
          `${format(eventDate, 'PPP')}: ${event.event}`,
          margin.left,
          yPosition,
          contentWidth
        );
        yPosition += 3;
        yPosition = addText(
          `   ${event.description}`,
          margin.left,
          yPosition,
          contentWidth
        );
        yPosition += 5;
      });
      yPosition += 5;
    }

    // Documents Section
    if (validatedData.documents && validatedData.documents.length > 0) {
      checkPageBreak(30);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Related Documents', margin.left, yPosition);
      yPosition += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');

      validatedData.documents.forEach((document) => {
        checkPageBreak(15);
        yPosition = addText(
          `• ${document.name} (${document.type})`,
          margin.left,
          yPosition,
          contentWidth
        );
        yPosition += 3;
        yPosition = addText(
          `  ${document.url}`,
          margin.left,
          yPosition,
          contentWidth
        );
        yPosition += 5;
      });
    }

    // Footer
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, {
        align: 'center',
      });
      doc.text(
        `Generated on ${format(new Date(), 'PPP')}`,
        pageWidth - margin.right,
        pageHeight - 10,
        { align: 'right' }
      );
      doc.text(
        'Civilyst - Civic Engagement Platform',
        margin.left,
        pageHeight - 10
      );
    }

    // Return PDF as buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    return pdfBuffer;
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw new Error(
      `Failed to generate PDF report: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Generate voting summary PDF for a campaign
 * @param campaignData Campaign data with voting results
 * @param options PDF generation options
 * @returns Promise resolving to PDF buffer
 */
export async function generateVotingSummaryPDF(
  campaignData: Pick<
    CampaignReportData,
    'id' | 'title' | 'votes' | 'engagement'
  >,
  options: Partial<PDFOptions> = {}
): Promise<Buffer> {
  const summaryData: CampaignReportData = {
    ...campaignData,
    description: 'Voting summary report',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return generateCampaignReport(summaryData, options);
}

/**
 * Generate QR code embedded PDF for campaign sharing
 * @param campaignData Campaign data
 * @param qrCodeDataUrl QR code as data URL
 * @param options PDF generation options
 * @returns Promise resolving to PDF buffer
 */
export async function generateCampaignQRPDF(
  campaignData: Pick<CampaignReportData, 'id' | 'title' | 'description'>,
  qrCodeDataUrl: string,
  options: Partial<PDFOptions> = {}
): Promise<Buffer> {
  try {
    const validatedOptions = PDFOptionsSchema.parse(options);

    const doc = new jsPDF({
      format: validatedOptions.format,
      orientation: validatedOptions.orientation,
      unit: validatedOptions.unit,
      compress: validatedOptions.compress,
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = validatedOptions.margin;
    let yPosition = margin.top;

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Campaign QR Code', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Campaign Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    const lines = doc.splitTextToSize(
      campaignData.title,
      pageWidth - margin.left - margin.right
    );
    doc.text(lines, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += lines.length * 8 + 10;

    // QR Code
    const qrSize = 80;
    const qrX = (pageWidth - qrSize) / 2;
    doc.addImage(qrCodeDataUrl, 'PNG', qrX, yPosition, qrSize, qrSize);
    yPosition += qrSize + 15;

    // Instructions
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(
      'Scan this QR code to view the campaign',
      pageWidth / 2,
      yPosition,
      { align: 'center' }
    );
    yPosition += 10;

    // Campaign ID
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Campaign ID: ${campaignData.id}`, pageWidth / 2, yPosition, {
      align: 'center',
    });
    yPosition += 15;

    // Description
    if (campaignData.description) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const descLines = doc.splitTextToSize(
        campaignData.description,
        pageWidth - margin.left - margin.right
      );
      doc.text(descLines, margin.left, yPosition);
    }

    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Generated on ${format(new Date(), 'PPP')}`,
      pageWidth / 2,
      pageWidth - 10,
      { align: 'center' }
    );

    return Buffer.from(doc.output('arraybuffer'));
  } catch (error) {
    console.error('QR PDF generation failed:', error);
    throw new Error(
      `Failed to generate QR PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// Export types for use in other modules
export type { PDFOptions, CampaignReportData };
