'use client';

import { useState } from 'react';
import { Button } from '~/components/ui/button';
import {
  QrCodeIcon,
  DocumentArrowDownIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

interface DownloadToolsProps {
  campaignId: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'buttons' | 'menu';
  className?: string;
}

export function DownloadTools({
  campaignId,
  size = 'default',
  variant = 'buttons',
  className,
}: DownloadToolsProps) {
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  // Download QR code
  const handleDownloadQR = async () => {
    try {
      setIsDownloading('qr');
      
      const response = await fetch(`/api/campaigns/${campaignId}/qr?download=true&filename=campaign-${campaignId}-qr.png`);
      
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
    } finally {
      setIsDownloading(null);
    }
  };

  // Download PDF report
  const handleDownloadPDF = async (type: 'full_report' | 'qr_share' = 'full_report') => {
    try {
      setIsDownloading(type);

      // For GET requests, we'll use the simplified endpoint
      const response = await fetch(`/api/campaigns/${campaignId}/pdf?download=true&type=${type}&filename=campaign-${campaignId}-${type}.pdf`);

      if (!response.ok) {
        throw new Error('Failed to download PDF');
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
      console.error('PDF download error:', error);
    } finally {
      setIsDownloading(null);
    }
  };

  if (variant === 'menu') {
    return (
      <div className={`space-y-2 ${className}`}>
        <Button
          onClick={handleDownloadQR}
          disabled={isDownloading === 'qr'}
          variant="ghost"
          size={size}
          className="w-full justify-start"
        >
          <QrCodeIcon className="h-4 w-4 mr-3" />
          {isDownloading === 'qr' ? 'Downloading...' : 'Download QR Code'}
        </Button>
        
        <Button
          onClick={() => handleDownloadPDF('full_report')}
          disabled={isDownloading === 'full_report'}
          variant="ghost"
          size={size}
          className="w-full justify-start"
        >
          <DocumentArrowDownIcon className="h-4 w-4 mr-3" />
          {isDownloading === 'full_report' ? 'Downloading...' : 'Download Report'}
        </Button>
        
        <Button
          onClick={() => handleDownloadPDF('qr_share')}
          disabled={isDownloading === 'qr_share'}
          variant="ghost"
          size={size}
          className="w-full justify-start"
        >
          <ArrowDownTrayIcon className="h-4 w-4 mr-3" />
          {isDownloading === 'qr_share' ? 'Downloading...' : 'Download QR Share PDF'}
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <Button
        onClick={handleDownloadQR}
        disabled={isDownloading === 'qr'}
        variant="outline"
        size={size}
      >
        <QrCodeIcon className="h-4 w-4 mr-2" />
        {isDownloading === 'qr' ? 'Downloading...' : 'QR Code'}
      </Button>
      
      <Button
        onClick={() => handleDownloadPDF('full_report')}
        disabled={isDownloading === 'full_report'}
        variant="outline"
        size={size}
      >
        <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
        {isDownloading === 'full_report' ? 'Downloading...' : 'PDF Report'}
      </Button>
    </div>
  );
}