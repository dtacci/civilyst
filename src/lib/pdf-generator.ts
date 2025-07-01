import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { generateCampaignQRCodeBuffer } from './qr-code';

export interface PDFGenerationOptions {
  format?: 'a4' | 'letter' | 'legal';
  orientation?: 'portrait' | 'landscape';
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  includeQRCode?: boolean;
  includeMetadata?: boolean;
  customTitle?: string;
  customFooter?: string;
}

export interface CampaignPDFData {
  campaignId: string;
  title: string;
  description: string;
  organizationName: string;
  location?: string;
  startDate?: Date;
  endDate?: Date;
  participationUrl: string;
  qrCodeData?: {
    campaignId: string;
    campaignTitle: string;
    baseUrl: string;
  };
  additionalInfo?: string[];
  contactInfo?: {
    email?: string;
    phone?: string;
    website?: string;
  };
}

/**
 * Generate campaign information PDF document
 */
export async function generateCampaignPDF(
  data: CampaignPDFData,
  options: PDFGenerationOptions = {}
): Promise<Blob> {
  const pdf = new jsPDF({
    orientation: options.orientation || 'portrait',
    unit: 'mm',
    format: options.format || 'a4',
  });

  const margins = options.margins || {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20,
  };
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margins.left - margins.right;

  let yPosition = margins.top;

  // Title
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  const title = options.customTitle || `Campaign: ${data.title}`;
  const titleLines = pdf.splitTextToSize(title, contentWidth);
  pdf.text(titleLines, margins.left, yPosition);
  yPosition += titleLines.length * 10 + 10;

  // Organization
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Organized by: ${data.organizationName}`, margins.left, yPosition);
  yPosition += 15;

  // Location (if provided)
  if (data.location) {
    pdf.setFontSize(12);
    pdf.text(`Location: ${data.location}`, margins.left, yPosition);
    yPosition += 10;
  }

  // Dates (if provided)
  if (data.startDate || data.endDate) {
    pdf.setFontSize(12);
    let dateText = 'Duration: ';
    if (data.startDate && data.endDate) {
      dateText += `${data.startDate.toLocaleDateString()} - ${data.endDate.toLocaleDateString()}`;
    } else if (data.startDate) {
      dateText += `Starting ${data.startDate.toLocaleDateString()}`;
    } else if (data.endDate) {
      dateText += `Until ${data.endDate.toLocaleDateString()}`;
    }
    pdf.text(dateText, margins.left, yPosition);
    yPosition += 15;
  }

  // Description
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Description:', margins.left, yPosition);
  yPosition += 8;

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  const descriptionLines = pdf.splitTextToSize(data.description, contentWidth);
  pdf.text(descriptionLines, margins.left, yPosition);
  yPosition += descriptionLines.length * 6 + 15;

  // Additional Information
  if (data.additionalInfo && data.additionalInfo.length > 0) {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Additional Information:', margins.left, yPosition);
    yPosition += 8;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    for (const info of data.additionalInfo) {
      const infoLines = pdf.splitTextToSize(`• ${info}`, contentWidth - 5);
      pdf.text(infoLines, margins.left + 5, yPosition);
      yPosition += infoLines.length * 6 + 3;
    }
    yPosition += 10;
  }

  // QR Code
  if (options.includeQRCode && data.qrCodeData) {
    try {
      const qrBuffer = await generateCampaignQRCodeBuffer(data.qrCodeData, {
        width: 200,
      });
      const qrDataUrl = `data:image/png;base64,${qrBuffer.toString('base64')}`;

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Scan to Participate:', margins.left, yPosition);
      yPosition += 15;

      const qrSize = 40; // 40mm
      pdf.addImage(qrDataUrl, 'PNG', margins.left, yPosition, qrSize, qrSize);
      yPosition += qrSize + 10;
    } catch (error) {
      console.error('Failed to add QR code to PDF:', error);
    }
  }

  // Participation URL
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Participation Link:', margins.left, yPosition);
  yPosition += 6;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const urlLines = pdf.splitTextToSize(data.participationUrl, contentWidth);
  pdf.text(urlLines, margins.left, yPosition);
  yPosition += urlLines.length * 5 + 15;

  // Contact Information
  if (data.contactInfo) {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Contact Information:', margins.left, yPosition);
    yPosition += 8;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');

    if (data.contactInfo.email) {
      pdf.text(`Email: ${data.contactInfo.email}`, margins.left, yPosition);
      yPosition += 6;
    }

    if (data.contactInfo.phone) {
      pdf.text(`Phone: ${data.contactInfo.phone}`, margins.left, yPosition);
      yPosition += 6;
    }

    if (data.contactInfo.website) {
      pdf.text(`Website: ${data.contactInfo.website}`, margins.left, yPosition);
      yPosition += 6;
    }
    yPosition += 10;
  }

  // Footer
  if (options.customFooter || options.includeMetadata) {
    const footerY = pageHeight - margins.bottom - 10;
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');

    if (options.customFooter) {
      pdf.text(options.customFooter, margins.left, footerY);
    }

    if (options.includeMetadata) {
      const metadata = `Generated on ${new Date().toLocaleDateString()} • Campaign ID: ${data.campaignId}`;
      const metadataWidth = pdf.getTextWidth(metadata);
      pdf.text(metadata, pageWidth - margins.right - metadataWidth, footerY);
    }
  }

  return new Blob([pdf.output('blob')], { type: 'application/pdf' });
}

/**
 * Generate PDF from HTML element
 */
export async function generatePDFFromElement(
  element: HTMLElement,
  filename: string,
  options: PDFGenerationOptions = {}
): Promise<Blob> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: options.orientation || 'portrait',
    unit: 'mm',
    format: options.format || 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margins = options.margins || {
    top: 10,
    right: 10,
    bottom: 10,
    left: 10,
  };

  const imgWidth = pageWidth - margins.left - margins.right;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = margins.top;

  pdf.addImage(imgData, 'PNG', margins.left, position, imgWidth, imgHeight);
  heightLeft -= pageHeight - margins.top - margins.bottom;

  while (heightLeft >= 0) {
    position = heightLeft - imgHeight + margins.top;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', margins.left, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - margins.top - margins.bottom;
  }

  return new Blob([pdf.output('blob')], { type: 'application/pdf' });
}

/**
 * Download PDF blob as file
 */
export function downloadPDF(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validate PDF generation data
 */
export function validateCampaignPDFData(data: CampaignPDFData): string[] {
  const errors: string[] = [];

  if (!data.campaignId || typeof data.campaignId !== 'string') {
    errors.push('Campaign ID is required');
  }

  if (!data.title || typeof data.title !== 'string') {
    errors.push('Campaign title is required');
  }

  if (!data.description || typeof data.description !== 'string') {
    errors.push('Campaign description is required');
  }

  if (!data.organizationName || typeof data.organizationName !== 'string') {
    errors.push('Organization name is required');
  }

  if (!data.participationUrl || typeof data.participationUrl !== 'string') {
    errors.push('Participation URL is required');
  }

  try {
    new URL(data.participationUrl);
  } catch {
    errors.push('Participation URL must be valid');
  }

  return errors;
}

/**
 * Get file size estimate for PDF generation
 */
export function estimatePDFSize(
  data: CampaignPDFData,
  options: PDFGenerationOptions = {}
): number {
  let estimatedSize = 50; // Base PDF size in KB

  // Text content
  const textLength = data.title.length + data.description.length;
  estimatedSize += Math.ceil(textLength / 100) * 2;

  // QR Code
  if (options.includeQRCode) {
    estimatedSize += 15; // QR code image
  }

  // Additional info
  if (data.additionalInfo) {
    estimatedSize += data.additionalInfo.join('').length / 200;
  }

  return Math.ceil(estimatedSize);
}
