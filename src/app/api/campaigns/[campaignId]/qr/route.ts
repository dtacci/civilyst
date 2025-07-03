import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  generateCampaignShareQR,
  generateUrlQR,
  generateQRBuffer,
  type QRCodeOptions,
} from '~/lib/qr-generator';

// Request body schema
const QRGenerationRequestSchema = z.object({
  title: z.string().min(1).max(200),
  format: z.enum(['dataurl', 'buffer', 'svg']).optional().default('dataurl'),
  options: z
    .object({
      width: z.number().min(100).max(2048).optional(),
      margin: z.number().min(0).max(20).optional(),
      color: z
        .object({
          dark: z.string().optional(),
          light: z.string().optional(),
        })
        .optional(),
      errorCorrectionLevel: z.enum(['L', 'M', 'Q', 'H']).optional(),
      type: z.enum(['image/png', 'image/jpeg', 'image/webp']).optional(),
      quality: z.number().min(0.1).max(1).optional(),
    })
    .optional()
    .default({}),
});

// Query parameters schema
const QRQuerySchema = z.object({
  download: z.string().optional(),
  filename: z.string().optional(),
});

/**
 * Generate QR code for campaign sharing
 * POST /api/campaigns/[campaignId]/qr
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const { campaignId } = await params;

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { title, format, options } = QRGenerationRequestSchema.parse(body);

    let qrData: string | Buffer;
    let contentType: string;
    const responseHeaders: Record<string, string> = {};

    // Generate QR code based on requested format
    switch (format) {
      case 'dataurl':
        // Clean options to match expected type by removing undefined color properties
        const cleanedOptions = {
          ...options,
          color: options.color
            ? {
                dark: options.color.dark ?? '#000000',
                light: options.color.light ?? '#FFFFFF',
              }
            : undefined,
        };
        qrData = await generateCampaignShareQR(
          campaignId,
          title,
          cleanedOptions
        );
        contentType = 'application/json';
        break;

      case 'buffer':
        // For buffer format, we need to get the campaign URL and generate buffer
        const { createCampaignShareUrl } = await import('~/lib/qr-generator');
        const shareUrl = createCampaignShareUrl(campaignId, 'qr_api');
        // Clean options to match expected type by removing undefined color properties
        const cleanedOptionsBuffer = {
          ...options,
          color: options.color
            ? {
                dark: options.color.dark ?? '#000000',
                light: options.color.light ?? '#FFFFFF',
              }
            : undefined,
        };
        qrData = await generateQRBuffer(shareUrl, cleanedOptionsBuffer);
        contentType = 'image/png';
        responseHeaders['Content-Disposition'] =
          `attachment; filename="campaign-${campaignId}-qr.png"`;
        break;

      case 'svg':
        const { generateQRSVG, createCampaignShareUrl: createUrl } =
          await import('~/lib/qr-generator');
        const url = createUrl(campaignId, 'qr_api');
        // Clean options to match expected type by removing undefined color properties
        const cleanedOptionsSVG = {
          ...options,
          color: options.color
            ? {
                dark: options.color.dark ?? '#000000',
                light: options.color.light ?? '#FFFFFF',
              }
            : undefined,
        };
        qrData = await generateQRSVG(url, cleanedOptionsSVG);
        contentType = 'image/svg+xml';
        responseHeaders['Content-Disposition'] =
          `attachment; filename="campaign-${campaignId}-qr.svg"`;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid format specified' },
          { status: 400 }
        );
    }

    // For data URL format, return JSON response
    if (format === 'dataurl') {
      return NextResponse.json({
        success: true,
        data: {
          qrCode: qrData,
          campaignId,
          title,
          generatedAt: new Date().toISOString(),
          format,
          options,
        },
      });
    }

    // For binary formats, return the file directly
    return new NextResponse(qrData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        ...responseHeaders,
      },
    });
  } catch (error) {
    console.error('QR code generation API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to generate QR code',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Get QR code for campaign (simple URL-based generation)
 * GET /api/campaigns/[campaignId]/qr?download=true&filename=custom-name
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const { campaignId } = await params;

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const { download, filename } = QRQuerySchema.parse({
      download: searchParams.get('download'),
      filename: searchParams.get('filename'),
    });

    // Generate campaign share URL
    const { createCampaignShareUrl } = await import('~/lib/qr-generator');
    const shareUrl = createCampaignShareUrl(campaignId, 'qr_get');

    // Default QR options for GET requests
    const defaultOptions: Partial<QRCodeOptions> = {
      width: 300,
      margin: 4,
      errorCorrectionLevel: 'M',
    };

    // Generate QR code
    if (download === 'true') {
      // Return as downloadable PNG file
      const qrBuffer = await generateQRBuffer(shareUrl, defaultOptions);
      const downloadFilename = filename || `campaign-${campaignId}-qr.png`;

      return new NextResponse(qrBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': `attachment; filename="${downloadFilename}"`,
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        },
      });
    } else {
      // Return as data URL in JSON response
      const qrDataUrl = await generateUrlQR(shareUrl, defaultOptions);

      return NextResponse.json({
        success: true,
        data: {
          qrCode: qrDataUrl,
          campaignId,
          shareUrl,
          generatedAt: new Date().toISOString(),
          options: defaultOptions,
        },
      });
    }
  } catch (error) {
    console.error('QR code GET API error:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate QR code',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
