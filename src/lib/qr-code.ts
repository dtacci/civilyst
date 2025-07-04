import QRCode from 'qrcode';

export interface QRCodeOptions {
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  type?: 'image/png' | 'image/jpeg' | 'image/webp';
  quality?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  width?: number;
}

export interface CampaignQRCodeData {
  campaignId: string;
  campaignTitle: string;
  baseUrl: string;
  metadata?: {
    organizationName?: string;
    expiresAt?: string;
    trackingCode?: string;
  };
}

/**
 * Generate QR code as base64 data URL for campaign participation
 */
export async function generateCampaignQRCode(
  data: CampaignQRCodeData,
  options: QRCodeOptions = {}
): Promise<string> {
  const participationUrl = `${data.baseUrl}/campaigns/${data.campaignId}/participate`;

  const qrOptions = {
    errorCorrectionLevel: options.errorCorrectionLevel || 'M',
    type: options.type || 'image/png',
    quality: options.quality || 0.92,
    margin: options.margin || 1,
    color: {
      dark: options.color?.dark || '#000000',
      light: options.color?.light || '#FFFFFF',
    },
    width: options.width || 256,
  };

  try {
    const qrDataUrl = await QRCode.toDataURL(participationUrl, qrOptions);
    return qrDataUrl;
  } catch (error) {
    throw new Error(
      `Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Generate QR code as SVG string for campaign participation
 */
export async function generateCampaignQRCodeSVG(
  data: CampaignQRCodeData,
  options: Omit<QRCodeOptions, 'type'> = {}
): Promise<string> {
  const participationUrl = `${data.baseUrl}/campaigns/${data.campaignId}/participate`;

  const qrOptions = {
    errorCorrectionLevel: options.errorCorrectionLevel || 'M',
    margin: options.margin || 1,
    color: {
      dark: options.color?.dark || '#000000',
      light: options.color?.light || '#FFFFFF',
    },
    width: options.width || 256,
  };

  try {
    const qrSvg = await QRCode.toString(participationUrl, {
      ...qrOptions,
      type: 'svg',
    });
    return qrSvg;
  } catch (error) {
    throw new Error(
      `Failed to generate QR code SVG: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Generate QR code buffer for server-side use
 */
export async function generateCampaignQRCodeBuffer(
  data: CampaignQRCodeData,
  options: QRCodeOptions = {}
): Promise<Buffer> {
  const participationUrl = `${data.baseUrl}/campaigns/${data.campaignId}/participate`;

  const qrOptions = {
    errorCorrectionLevel: options.errorCorrectionLevel || 'M',
    margin: options.margin || 1,
    color: {
      dark: options.color?.dark || '#000000',
      light: options.color?.light || '#FFFFFF',
    },
    width: options.width || 256,
  };

  try {
    const qrBuffer = await QRCode.toBuffer(participationUrl, qrOptions);
    return qrBuffer;
  } catch (error) {
    throw new Error(
      `Failed to generate QR code buffer: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Validate QR code data before generation
 */
export function validateCampaignQRCodeData(data: CampaignQRCodeData): boolean {
  if (!data.campaignId || typeof data.campaignId !== 'string') {
    return false;
  }

  if (!data.campaignTitle || typeof data.campaignTitle !== 'string') {
    return false;
  }

  if (!data.baseUrl || typeof data.baseUrl !== 'string') {
    return false;
  }

  try {
    new URL(data.baseUrl);
  } catch {
    return false;
  }

  return true;
}

/**
 * Get optimal QR code size based on content length and usage
 */
export function getOptimalQRCodeSize(
  contentLength: number,
  usage: 'print' | 'digital' = 'digital'
): number {
  const baseSize = usage === 'print' ? 300 : 200;

  if (contentLength < 50) return baseSize;
  if (contentLength < 100) return baseSize + 50;
  if (contentLength < 200) return baseSize + 100;

  return baseSize + 150;
}
