import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  generateCampaignReport,
  generateVotingSummaryPDF,
  generateCampaignQRPDF,
  type CampaignReportData,
} from '~/lib/pdf-generator';
import { generateCampaignShareQR } from '~/lib/qr-generator';

// Request body schema
const PDFGenerationRequestSchema = z.object({
  type: z
    .enum(['full_report', 'voting_summary', 'qr_share'])
    .default('full_report'),
  data: z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
    createdAt: z.string().or(z.date()).optional(),
    updatedAt: z.string().or(z.date()).optional(),
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
  }),
  options: z
    .object({
      format: z.enum(['a4', 'letter', 'legal']).optional(),
      orientation: z.enum(['portrait', 'landscape']).optional(),
      unit: z.enum(['mm', 'cm', 'in', 'px']).optional(),
      compress: z.boolean().optional(),
      fontSize: z.number().min(8).max(72).optional(),
      lineHeight: z.number().min(1).max(3).optional(),
      margin: z
        .object({
          top: z.number().min(0).max(50).optional(),
          right: z.number().min(0).max(50).optional(),
          bottom: z.number().min(0).max(50).optional(),
          left: z.number().min(0).max(50).optional(),
        })
        .optional(),
    })
    .optional()
    .default({}),
  includeQR: z.boolean().optional().default(false),
});

// Query parameters schema
const PDFQuerySchema = z.object({
  type: z
    .enum(['full_report', 'voting_summary', 'qr_share'])
    .optional()
    .default('full_report'),
  download: z.string().optional(),
  filename: z.string().optional(),
  includeQR: z.string().optional(),
});

/**
 * Generate PDF report for campaign
 * POST /api/campaigns/[campaignId]/pdf
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
    const { type, data, options } = PDFGenerationRequestSchema.parse(body);

    // Ensure campaign ID matches
    if (data.id !== campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID mismatch' },
        { status: 400 }
      );
    }

    let pdfBuffer: Buffer;
    let filename: string;

    // Generate PDF based on type
    switch (type) {
      case 'full_report':
        // Add default values for required fields if missing
        const reportData: CampaignReportData = {
          ...data,
          status: data.status || 'ACTIVE',
          createdAt: data.createdAt || new Date(),
          updatedAt: data.updatedAt || new Date(),
        };
        // Clean options to match expected type by removing undefined margin properties
        const cleanedOptions = {
          ...options,
          margin: options.margin
            ? {
                top: options.margin.top ?? 20,
                right: options.margin.right ?? 20,
                bottom: options.margin.bottom ?? 20,
                left: options.margin.left ?? 20,
              }
            : undefined,
        };
        pdfBuffer = await generateCampaignReport(reportData, cleanedOptions);
        filename = `campaign-${campaignId}-report.pdf`;
        break;

      case 'voting_summary':
        if (!data.votes) {
          return NextResponse.json(
            { error: 'Voting data is required for voting summary' },
            { status: 400 }
          );
        }
        // Clean options to match expected type by removing undefined margin properties
        const cleanedOptionsVoting = {
          ...options,
          margin: options.margin
            ? {
                top: options.margin.top ?? 20,
                right: options.margin.right ?? 20,
                bottom: options.margin.bottom ?? 20,
                left: options.margin.left ?? 20,
              }
            : undefined,
        };
        pdfBuffer = await generateVotingSummaryPDF(
          {
            id: data.id,
            title: data.title,
            votes: data.votes,
            engagement: data.engagement,
          },
          cleanedOptionsVoting
        );
        filename = `campaign-${campaignId}-voting-summary.pdf`;
        break;

      case 'qr_share':
        // Generate QR code first
        const qrDataUrl = await generateCampaignShareQR(campaignId, data.title);
        // Clean options to match expected type by removing undefined margin properties
        const cleanedOptionsQR = {
          ...options,
          margin: options.margin
            ? {
                top: options.margin.top ?? 20,
                right: options.margin.right ?? 20,
                bottom: options.margin.bottom ?? 20,
                left: options.margin.left ?? 20,
              }
            : undefined,
        };
        pdfBuffer = await generateCampaignQRPDF(
          {
            id: data.id,
            title: data.title,
            description: data.description,
          },
          qrDataUrl,
          cleanedOptionsQR
        );
        filename = `campaign-${campaignId}-qr-share.pdf`;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid PDF type specified' },
          { status: 400 }
        );
    }

    // Return PDF as downloadable file
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('PDF generation API error:', error);

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
        error: 'Failed to generate PDF',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Get campaign PDF report (simplified version)
 * GET /api/campaigns/[campaignId]/pdf?type=voting_summary&download=true
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
    const { type, download, filename } = PDFQuerySchema.parse({
      type: searchParams.get('type'),
      download: searchParams.get('download'),
      filename: searchParams.get('filename'),
    });

    // This is a simplified GET endpoint that generates a basic report
    // In a real application, you would fetch campaign data from your database
    // For now, we'll return a message indicating that POST should be used for full functionality

    if (download === 'true') {
      // Generate a minimal PDF with campaign ID only
      const minimalData: CampaignReportData = {
        id: campaignId,
        title: `Campaign ${campaignId}`,
        description:
          'This is a simplified report. Use the POST endpoint with full campaign data for complete reports.',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const pdfBuffer = await generateCampaignReport(minimalData);
      const downloadFilename =
        filename || `campaign-${campaignId}-basic-report.pdf`;

      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${downloadFilename}"`,
          'Content-Length': pdfBuffer.length.toString(),
        },
      });
    } else {
      // Return information about available PDF generation options
      return NextResponse.json({
        success: true,
        message: 'PDF generation endpoint',
        campaignId,
        availableTypes: ['full_report', 'voting_summary', 'qr_share'],
        usage: {
          GET: 'Use GET with ?download=true for basic PDF download',
          POST: 'Use POST with campaign data for full-featured PDF generation',
        },
        endpoints: {
          download: `/api/campaigns/${campaignId}/pdf?download=true&type=${type}`,
          generate: `/api/campaigns/${campaignId}/pdf`,
        },
      });
    }
  } catch (error) {
    console.error('PDF GET API error:', error);

    return NextResponse.json(
      {
        error: 'Failed to process PDF request',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
