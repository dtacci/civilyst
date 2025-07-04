import { useState, useCallback } from 'react';

interface CampaignData {
  id: string;
  title: string;
  description: string;
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
  timeline?: Array<{
    date: string | Date;
    event: string;
    description: string;
  }>;
  documents?: Array<{
    name: string;
    url: string;
    type: string;
    size?: number;
  }>;
}

interface QRCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  type?: 'image/png' | 'image/jpeg' | 'image/webp';
  quality?: number;
}

interface PDFOptions {
  format?: 'a4' | 'letter' | 'legal';
  orientation?: 'portrait' | 'landscape';
  unit?: 'mm' | 'cm' | 'in' | 'px';
  compress?: boolean;
  fontSize?: number;
  lineHeight?: number;
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
}

export function useCampaignDownloads(campaignData: CampaignData) {
  const [isGenerating, setIsGenerating] = useState<{
    qr: boolean;
    pdf: string | null;
  }>({
    qr: false,
    pdf: null,
  });

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Generate QR code and return data URL
  const generateQRCode = useCallback(
    async (options?: QRCodeOptions): Promise<string | null> => {
      try {
        setIsGenerating((prev) => ({ ...prev, qr: true }));
        setError(null);

        const response = await fetch(`/api/campaigns/${campaignData.id}/qr`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: campaignData.title,
            format: 'dataurl',
            options: {
              width: 300,
              margin: 4,
              errorCorrectionLevel: 'M',
              ...options,
            },
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate QR code');
        }

        const result = await response.json();
        const dataUrl = result.data.qrCode;
        setQrCodeDataUrl(dataUrl);
        return dataUrl;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('QR generation error:', err);
        return null;
      } finally {
        setIsGenerating((prev) => ({ ...prev, qr: false }));
      }
    },
    [campaignData.id, campaignData.title]
  );

  // Download QR code as PNG file
  const downloadQRCode = useCallback(
    async (filename?: string): Promise<boolean> => {
      try {
        setIsGenerating((prev) => ({ ...prev, qr: true }));
        setError(null);

        const downloadFilename =
          filename || `campaign-${campaignData.id}-qr.png`;
        const response = await fetch(
          `/api/campaigns/${campaignData.id}/qr?download=true&filename=${downloadFilename}`
        );

        if (!response.ok) {
          throw new Error('Failed to download QR code');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = downloadFilename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('QR download error:', err);
        return false;
      } finally {
        setIsGenerating((prev) => ({ ...prev, qr: false }));
      }
    },
    [campaignData.id]
  );

  // Generate and download PDF report
  const downloadPDFReport = useCallback(
    async (
      type: 'full_report' | 'voting_summary' | 'qr_share' = 'full_report',
      options?: PDFOptions,
      filename?: string
    ): Promise<boolean> => {
      try {
        setIsGenerating((prev) => ({ ...prev, pdf: type }));
        setError(null);

        const pdfData = {
          type,
          data: {
            id: campaignData.id,
            title: campaignData.title,
            description: campaignData.description,
            status: campaignData.status || 'ACTIVE',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            location: campaignData.location,
            votes: campaignData.votes,
            engagement: campaignData.engagement,
            timeline: campaignData.timeline,
            documents: campaignData.documents,
          },
          options: {
            format: 'a4',
            orientation: 'portrait',
            ...options,
          },
        };

        const response = await fetch(`/api/campaigns/${campaignData.id}/pdf`, {
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
        const downloadFilename =
          filename || `campaign-${campaignData.id}-${type}.pdf`;
        a.href = url;
        a.download = downloadFilename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('PDF generation error:', err);
        return false;
      } finally {
        setIsGenerating((prev) => ({ ...prev, pdf: null }));
      }
    },
    [campaignData]
  );

  // Get campaign share URL
  const getCampaignUrl = useCallback(() => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/campaigns/${campaignData.id}`;
  }, [campaignData.id]);

  // Copy campaign URL to clipboard
  const copyCampaignUrl = useCallback(async (): Promise<boolean> => {
    try {
      const url = getCampaignUrl();
      await navigator.clipboard.writeText(url);
      return true;
    } catch (err) {
      console.error('Copy URL error:', err);
      return false;
    }
  }, [getCampaignUrl]);

  // Native share (if supported)
  const shareCampaign = useCallback(async (): Promise<boolean> => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: campaignData.title,
          text: campaignData.description,
          url: getCampaignUrl(),
        });
        return true;
      } catch (err) {
        console.error('Native share error:', err);
        return false;
      }
    } else {
      // Fallback to copy URL
      return copyCampaignUrl();
    }
  }, [
    campaignData.title,
    campaignData.description,
    getCampaignUrl,
    copyCampaignUrl,
  ]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    isGenerating,
    qrCodeDataUrl,
    error,

    // Actions
    generateQRCode,
    downloadQRCode,
    downloadPDFReport,
    getCampaignUrl,
    copyCampaignUrl,
    shareCampaign,
    clearError,

    // Utilities
    canShare: typeof navigator !== 'undefined' && !!navigator.share,
  };
}
