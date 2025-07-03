import QRCode from 'qrcode';
import { z } from 'zod';

// QR Code generation options schema
const QRCodeOptionsSchema = z.object({
  width: z.number().min(100).max(2048).optional().default(300),
  margin: z.number().min(0).max(20).optional().default(4),
  color: z
    .object({
      dark: z.string().optional().default('#000000'),
      light: z.string().optional().default('#FFFFFF'),
    })
    .optional()
    .default({}),
  errorCorrectionLevel: z.enum(['L', 'M', 'Q', 'H']).optional().default('M'),
  type: z
    .enum(['image/png', 'image/jpeg', 'image/webp'])
    .optional()
    .default('image/png'),
  quality: z.number().min(0.1).max(1).optional().default(0.92),
});

type QRCodeOptions = z.infer<typeof QRCodeOptionsSchema>;

// Campaign QR code data schema
const CampaignQRDataSchema = z.object({
  campaignId: z.string(),
  title: z.string(),
  url: z.string().url(),
  type: z.enum(['campaign', 'vote', 'share']).default('campaign'),
  metadata: z.record(z.string()).optional(),
});

type CampaignQRData = z.infer<typeof CampaignQRDataSchema>;

/**
 * Generate QR code for campaign sharing
 * @param data Campaign data to encode
 * @param options QR code generation options
 * @returns Promise resolving to base64 data URL
 */
export async function generateCampaignQR(
  data: CampaignQRData,
  options: Partial<QRCodeOptions> = {}
): Promise<string> {
  try {
    // Validate input data
    const validatedData = CampaignQRDataSchema.parse(data);
    const validatedOptions = QRCodeOptionsSchema.parse(options);

    // Create QR code content with structured data
    const qrContent = JSON.stringify({
      ...validatedData,
      generated: new Date().toISOString(),
      version: '1.0',
    });

    // Generate QR code with mobile-optimized settings
    const qrCodeDataUrl = await QRCode.toDataURL(qrContent, {
      width: validatedOptions.width,
      margin: validatedOptions.margin,
      color: validatedOptions.color,
      errorCorrectionLevel: validatedOptions.errorCorrectionLevel,
      type: validatedOptions.type,
      quality: validatedOptions.quality,
      // Mobile-friendly settings
      rendererOpts: {
        quality: validatedOptions.quality,
      },
    });

    return qrCodeDataUrl;
  } catch (error) {
    console.error('QR code generation failed:', error);
    throw new Error(
      `Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Generate simple URL QR code
 * @param url URL to encode
 * @param options QR code generation options
 * @returns Promise resolving to base64 data URL
 */
export async function generateUrlQR(
  url: string,
  options: Partial<QRCodeOptions> = {}
): Promise<string> {
  try {
    // Validate URL
    const validatedUrl = z.string().url().parse(url);
    const validatedOptions = QRCodeOptionsSchema.parse(options);

    const qrCodeDataUrl = await QRCode.toDataURL(validatedUrl, {
      width: validatedOptions.width,
      margin: validatedOptions.margin,
      color: validatedOptions.color,
      errorCorrectionLevel: validatedOptions.errorCorrectionLevel,
      type: validatedOptions.type,
      quality: validatedOptions.quality,
    });

    return qrCodeDataUrl;
  } catch (error) {
    console.error('URL QR code generation failed:', error);
    throw new Error(
      `Failed to generate URL QR code: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Generate QR code buffer for server-side use
 * @param data Data to encode
 * @param options QR code generation options
 * @returns Promise resolving to Buffer
 */
export async function generateQRBuffer(
  data: string,
  options: Partial<QRCodeOptions> = {}
): Promise<Buffer> {
  try {
    const validatedOptions = QRCodeOptionsSchema.parse(options);

    const buffer = await QRCode.toBuffer(data, {
      width: validatedOptions.width,
      margin: validatedOptions.margin,
      color: validatedOptions.color,
      errorCorrectionLevel: validatedOptions.errorCorrectionLevel,
      type: validatedOptions.type === 'image/png' ? 'png' : 'png', // QRCode.toBuffer only supports png
    });

    return buffer;
  } catch (error) {
    console.error('QR code buffer generation failed:', error);
    throw new Error(
      `Failed to generate QR code buffer: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Generate QR code SVG string
 * @param data Data to encode
 * @param options QR code generation options
 * @returns Promise resolving to SVG string
 */
export async function generateQRSVG(
  data: string,
  options: Partial<QRCodeOptions> = {}
): Promise<string> {
  try {
    const validatedOptions = QRCodeOptionsSchema.parse(options);

    const svgString = await QRCode.toString(data, {
      type: 'svg',
      width: validatedOptions.width,
      margin: validatedOptions.margin,
      color: validatedOptions.color,
      errorCorrectionLevel: validatedOptions.errorCorrectionLevel,
    });

    return svgString;
  } catch (error) {
    console.error('QR code SVG generation failed:', error);
    throw new Error(
      `Failed to generate QR code SVG: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Create campaign share URL with tracking parameters
 * @param campaignId Campaign ID
 * @param source Source of the share (qr, social, etc.)
 * @param baseUrl Base URL for the application
 * @returns Campaign share URL
 */
export function createCampaignShareUrl(
  campaignId: string,
  source: string = 'qr',
  baseUrl: string = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
): string {
  const url = new URL(`/campaigns/${campaignId}`, baseUrl);
  url.searchParams.set('utm_source', source);
  url.searchParams.set('utm_medium', 'qr_code');
  url.searchParams.set('utm_campaign', 'campaign_share');
  url.searchParams.set('ref', 'qr');

  return url.toString();
}

/**
 * Generate campaign QR code with optimized settings for mobile scanning
 * @param campaignId Campaign ID
 * @param campaignTitle Campaign title
 * @param options Additional options
 * @returns Promise resolving to QR code data URL
 */
export async function generateCampaignShareQR(
  campaignId: string,
  campaignTitle: string,
  options: Partial<QRCodeOptions> = {}
): Promise<string> {
  const shareUrl = createCampaignShareUrl(campaignId, 'qr_share');

  const campaignData: CampaignQRData = {
    campaignId,
    title: campaignTitle,
    url: shareUrl,
    type: 'campaign',
    metadata: {
      generated: new Date().toISOString(),
      platform: 'civilyst',
    },
  };

  return generateCampaignQR(campaignData, {
    width: 300,
    margin: 4,
    errorCorrectionLevel: 'M', // Good balance of error correction and density
    ...options,
  });
}

// Export types for use in other modules
export type { QRCodeOptions, CampaignQRData };
