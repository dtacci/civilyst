'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {
  QrCodeIcon,
  DocumentArrowDownIcon,
  ShareIcon,
  ClipboardDocumentIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { cn } from '~/lib/utils';

interface CampaignShareToolsProps {
  campaignId: string;
  campaignTitle: string;
  campaignDescription: string;
  campaignData?: {
    status?: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    location?: {
      address: string;
      city: string;
      state: string;
      zipCode: string;
      coordinates?: { lat: number; lng: number };
    };
    votes?: {
      total: number;
      support: number;
      oppose: number;
      supportPercentage: number;
      opposePercentage: number;
    };
    engagement?: {
      views: number;
      shares: number;
      comments: number;
      participants: number;
    };
  };
  className?: string;
}

export function CampaignShareTools({
  campaignId,
  campaignTitle,
  campaignDescription,
  campaignData,
  className,
}: CampaignShareToolsProps) {
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Generate QR code
  const handleGenerateQR = async () => {
    try {
      setIsGeneratingQR(true);

      const response = await fetch(`/api/campaigns/${campaignId}/qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: campaignTitle,
          format: 'dataurl',
          options: {
            width: 300,
            margin: 4,
            errorCorrectionLevel: 'M',
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate QR code');
      }

      const result = await response.json();
      setQrCodeDataUrl(result.data.qrCode);
    } catch (error) {
      console.error('QR generation error:', error);
      // You could add toast notification here
    } finally {
      setIsGeneratingQR(false);
    }
  };

  // Download QR code
  const handleDownloadQR = async () => {
    try {
      const response = await fetch(
        `/api/campaigns/${campaignId}/qr?download=true&filename=campaign-${campaignId}-qr.png`
      );

      if (!response.ok) {
        throw new Error('Failed to download QR code');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `campaign-${campaignId}-qr.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('QR download error:', error);
    }
  };

  // Generate and download PDF report
  const handleDownloadPDF = async (
    type: 'full_report' | 'voting_summary' | 'qr_share'
  ) => {
    try {
      setIsGeneratingPDF(true);

      const pdfData = {
        type,
        data: {
          id: campaignId,
          title: campaignTitle,
          description: campaignDescription,
          status: campaignData?.status || 'ACTIVE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...campaignData,
        },
        options: {
          format: 'a4' as const,
          orientation: 'portrait' as const,
        },
      };

      const response = await fetch(`/api/campaigns/${campaignId}/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pdfData),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `campaign-${campaignId}-${type}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('PDF generation error:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Copy campaign URL
  const handleCopyUrl = async () => {
    try {
      const baseUrl = window.location.origin;
      const campaignUrl = `${baseUrl}/campaigns/${campaignId}`;
      await navigator.clipboard.writeText(campaignUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy URL error:', error);
    }
  };

  // Share via Web Share API
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: campaignTitle,
          text: campaignDescription,
          url: `${window.location.origin}/campaigns/${campaignId}`,
        });
      } catch (error) {
        console.error('Native share error:', error);
      }
    } else {
      // Fallback to copy URL
      handleCopyUrl();
    }
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShareIcon className="h-5 w-5" />
          Share Campaign
        </CardTitle>
        <CardDescription>
          Generate QR codes, download reports, and share this campaign
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* QR Code Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900">QR Code</h3>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleGenerateQR}
              disabled={isGeneratingQR}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <QrCodeIcon className="h-4 w-4 mr-2" />
              {isGeneratingQR ? 'Generating...' : 'Generate QR Code'}
            </Button>

            <Button
              onClick={handleDownloadQR}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              Download QR PNG
            </Button>
          </div>

          {/* Display generated QR code */}
          {qrCodeDataUrl && (
            <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
              <Image
                src={qrCodeDataUrl}
                alt="Campaign QR Code"
                width={192}
                height={192}
                className="w-48 h-48"
              />
            </div>
          )}
        </div>

        {/* PDF Reports Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900">PDF Reports</h3>

          <div className="grid gap-3">
            <Button
              onClick={() => handleDownloadPDF('full_report')}
              disabled={isGeneratingPDF}
              variant="outline"
              size="sm"
              className="justify-start"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              {isGeneratingPDF ? 'Generating...' : 'Download Full Report'}
            </Button>

            {campaignData?.votes && (
              <Button
                onClick={() => handleDownloadPDF('voting_summary')}
                disabled={isGeneratingPDF}
                variant="outline"
                size="sm"
                className="justify-start"
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                {isGeneratingPDF ? 'Generating...' : 'Download Voting Summary'}
              </Button>
            )}

            <Button
              onClick={() => handleDownloadPDF('qr_share')}
              disabled={isGeneratingPDF}
              variant="outline"
              size="sm"
              className="justify-start"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              {isGeneratingPDF ? 'Generating...' : 'Download QR Share PDF'}
            </Button>
          </div>
        </div>

        {/* Sharing Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900">Share Link</h3>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleCopyUrl}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              {copied ? (
                <CheckIcon className="h-4 w-4 mr-2 text-green-600" />
              ) : (
                <ClipboardDocumentIcon className="h-4 w-4 mr-2" />
              )}
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>

            <Button
              onClick={handleNativeShare}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <ShareIcon className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Campaign Info */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>
            <strong>Campaign ID:</strong> {campaignId}
          </p>
          <p>
            <strong>Title:</strong> {campaignTitle}
          </p>
          {campaignData?.status && (
            <p>
              <strong>Status:</strong> {campaignData.status}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
