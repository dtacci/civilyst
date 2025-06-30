'use client';

import { useState, useEffect, useCallback } from 'react';
import { Download, Share2, Copy, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import {
  generateCampaignQRCode,
  generateCampaignQRCodeSVG,
  type CampaignQRCodeData,
  type QRCodeOptions,
} from '~/lib/qr-code';

interface QRCodeDisplayProps {
  campaignId: string;
  campaignTitle: string;
  baseUrl?: string;
  className?: string;
  size?: number;
  showControls?: boolean;
  onError?: (error: string) => void;
  onGenerated?: (dataUrl: string) => void;
}

export function QRCodeDisplay({
  campaignId,
  campaignTitle,
  baseUrl = typeof window !== 'undefined' ? window.location.origin : '',
  className = '',
  size = 256,
  showControls = true,
  onError,
  onGenerated,
}: QRCodeDisplayProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrSvg, setQrSvg] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [displayFormat, setDisplayFormat] = useState<'png' | 'svg'>('png');

  const qrData: CampaignQRCodeData = {
    campaignId,
    campaignTitle,
    baseUrl,
    metadata: {
      organizationName: 'Civilyst',
      trackingCode: `qr-${campaignId}-${Date.now()}`,
    },
  };

  const generateQRCode = useCallback(async () => {
    if (!campaignId || !campaignTitle) return;

    setIsLoading(true);
    setError('');

    try {
      const options: QRCodeOptions = {
        width: size,
        errorCorrectionLevel: 'M',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      };

      const [dataUrl, svg] = await Promise.all([
        generateCampaignQRCode(qrData, options),
        generateCampaignQRCodeSVG(qrData, options),
      ]);

      setQrDataUrl(dataUrl);
      setQrSvg(svg);
      onGenerated?.(dataUrl);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to generate QR code';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [campaignId, campaignTitle, baseUrl, size, onError, onGenerated, qrData]);

  useEffect(() => {
    generateQRCode();
  }, [generateQRCode]);

  const handleDownload = useCallback(() => {
    if (!qrDataUrl) return;

    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `campaign-${campaignId}-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [qrDataUrl, campaignId]);

  const handleCopyUrl = useCallback(async () => {
    const participationUrl = `${baseUrl}/campaigns/${campaignId}/participate`;

    try {
      await navigator.clipboard.writeText(participationUrl);
      // Could add toast notification here
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  }, [baseUrl, campaignId]);

  const handleShare = useCallback(async () => {
    const participationUrl = `${baseUrl}/campaigns/${campaignId}/participate`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join Campaign: ${campaignTitle}`,
          text: `Participate in the "${campaignTitle}" campaign`,
          url: participationUrl,
        });
      } catch (err) {
        console.error('Failed to share:', err);
      }
    } else {
      handleCopyUrl();
    }
  }, [campaignId, campaignTitle, handleCopyUrl]);

  if (error) {
    return (
      <div
        className={`flex flex-col items-center p-4 border border-red-200 rounded-lg bg-red-50 ${className}`}
      >
        <div className="text-red-600 text-sm mb-2">
          Failed to generate QR code
        </div>
        <div className="text-red-500 text-xs mb-3">{error}</div>
        <button
          onClick={generateQRCode}
          className="flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* QR Code Display */}
      <div className="relative">
        {isLoading ? (
          <div
            className="flex items-center justify-center bg-gray-100 rounded-lg border"
            style={{ width: size, height: size }}
          >
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
          </div>
        ) : (
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            {displayFormat === 'png' && qrDataUrl ? (
              <Image
                src={qrDataUrl}
                alt={`QR Code for ${campaignTitle}`}
                width={size}
                height={size}
                className="block"
                priority
              />
            ) : displayFormat === 'svg' && qrSvg ? (
              <div
                dangerouslySetInnerHTML={{ __html: qrSvg }}
                style={{ width: size, height: size }}
              />
            ) : null}
          </div>
        )}
      </div>

      {/* Campaign Info */}
      <div className="text-center">
        <h3 className="font-semibold text-gray-900 mb-1">{campaignTitle}</h3>
        <p className="text-sm text-gray-600">Scan to participate</p>
      </div>

      {/* Controls */}
      {showControls && !isLoading && (qrDataUrl || qrSvg) && (
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Format Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setDisplayFormat('png')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                displayFormat === 'png'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              PNG
            </button>
            <button
              onClick={() => setDisplayFormat('svg')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                displayFormat === 'svg'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              SVG
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>

            <button
              onClick={handleCopyUrl}
              className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
            >
              <Copy className="w-4 h-4" />
              Copy Link
            </button>
          </div>
        </div>
      )}

      {/* Participation URL */}
      {showControls && (
        <div className="w-full max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Participation URL
          </label>
          <div className="flex rounded-lg border border-gray-300">
            <input
              type="text"
              value={`${baseUrl}/campaigns/${campaignId}/participate`}
              readOnly
              className="flex-1 px-3 py-2 bg-gray-50 text-sm text-gray-600 rounded-l-lg border-0 focus:outline-none"
            />
            <button
              onClick={handleCopyUrl}
              className="px-3 py-2 bg-gray-100 text-gray-600 rounded-r-lg hover:bg-gray-200 transition-colors border-l"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
