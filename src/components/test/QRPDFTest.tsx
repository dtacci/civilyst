'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { DownloadTools } from '~/components/campaign/DownloadTools';
import { useCampaignDownloads } from '~/hooks/useCampaignDownloads';

// Test component for QR and PDF functionality
export function QRPDFTest() {
  const [testCampaignId] = useState('test-campaign-123');
  const testCampaignData = {
    id: testCampaignId,
    title: 'Test Campaign for QR & PDF Generation',
    description:
      'This is a test campaign to verify QR code and PDF generation functionality works correctly.',
    status: 'ACTIVE' as const,
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

  const {
    isGenerating,
    qrCodeDataUrl,
    error,
    generateQRCode,
    downloadQRCode,
    downloadPDFReport,
    getCampaignUrl,
    copyCampaignUrl,
    clearError,
  } = useCampaignDownloads(testCampaignData);

  const [copied, setCopied] = useState(false);

  const handleCopyUrl = async () => {
    const success = await copyCampaignUrl();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>QR Code & PDF Generation Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">{error}</p>
              <Button
                onClick={clearError}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                Clear Error
              </Button>
            </div>
          )}

          {/* Campaign Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">
              Test Campaign Details
            </h3>
            <p>
              <strong>ID:</strong> {testCampaignData.id}
            </p>
            <p>
              <strong>Title:</strong> {testCampaignData.title}
            </p>
            <p>
              <strong>URL:</strong> {getCampaignUrl()}
            </p>
            <p>
              <strong>Votes:</strong> {testCampaignData.votes.total} total (
              {testCampaignData.votes.supportPercentage}% support)
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => generateQRCode()}
              disabled={isGenerating.qr}
              variant="outline"
            >
              {isGenerating.qr ? 'Generating...' : 'Generate QR Code'}
            </Button>

            <Button
              onClick={() => downloadQRCode()}
              disabled={isGenerating.qr}
              variant="outline"
            >
              {isGenerating.qr ? 'Downloading...' : 'Download QR PNG'}
            </Button>

            <Button
              onClick={() => downloadPDFReport('full_report')}
              disabled={!!isGenerating.pdf}
              variant="outline"
            >
              {isGenerating.pdf === 'full_report'
                ? 'Generating...'
                : 'Download Full Report'}
            </Button>

            <Button
              onClick={() => downloadPDFReport('voting_summary')}
              disabled={!!isGenerating.pdf}
              variant="outline"
            >
              {isGenerating.pdf === 'voting_summary'
                ? 'Generating...'
                : 'Download Voting Summary'}
            </Button>

            <Button
              onClick={() => downloadPDFReport('qr_share')}
              disabled={!!isGenerating.pdf}
              variant="outline"
            >
              {isGenerating.pdf === 'qr_share'
                ? 'Generating...'
                : 'Download QR Share PDF'}
            </Button>

            <Button onClick={handleCopyUrl} variant="outline">
              {copied ? 'Copied!' : 'Copy URL'}
            </Button>
          </div>

          {/* QR Code Display */}
          {qrCodeDataUrl && (
            <div className="text-center">
              <h3 className="font-medium text-gray-900 mb-4">
                Generated QR Code
              </h3>
              <div className="inline-block p-4 bg-white border rounded-lg shadow-sm">
                <Image
                  src={qrCodeDataUrl}
                  alt="Campaign QR Code"
                  width={256}
                  height={256}
                  className="w-64 h-64"
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Scan this QR code to access the campaign
              </p>
            </div>
          )}

          {/* Download Tools Component Test */}
          <div className="border-t pt-6">
            <h3 className="font-medium text-gray-900 mb-4">
              Download Tools Component
            </h3>
            <DownloadTools
              campaignId={testCampaignId}
              variant="buttons"
              className="mb-4"
            />
            <DownloadTools campaignId={testCampaignId} variant="menu" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
