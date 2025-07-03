'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { Download, FileText, Settings, Loader2 } from 'lucide-react';
import {
  generateCampaignReport,
  type CampaignReportData,
  type PDFOptions,
} from '~/lib/pdf-generator';

interface PDFGeneratorProps {
  campaignId: string;
  campaignTitle: string;
  campaignDescription: string;
  organizationName: string;
  location?: string;
  startDate?: Date;
  endDate?: Date;
  participationUrl: string;
  additionalInfo?: string[];
  contactInfo?: {
    email?: string;
    phone?: string;
    website?: string;
  };
  className?: string;
  onError?: (error: string) => void;
  onSuccess?: (filename: string) => void;
}

export function PDFGenerator({
  campaignId,
  campaignTitle,
  campaignDescription,
  organizationName,
  location,
  startDate,
  endDate,
  participationUrl,
  additionalInfo,
  contactInfo,
  className = '',
  onError,
  onSuccess,
}: PDFGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [options, setOptions] = useState<Partial<PDFOptions>>({
    format: 'a4',
    orientation: 'portrait',
    margin: { top: 20, right: 20, bottom: 20, left: 20 },
  });
  const previewRef = useRef<HTMLDivElement>(null);

  // Wrap pdfData in useMemo to prevent recreation on every render
  const pdfData = useMemo<CampaignReportData>(
    () => ({
      id: campaignId,
      title: campaignTitle,
      description: campaignDescription,
      status: 'ACTIVE' as const,
      createdAt: startDate || new Date(),
      updatedAt: new Date(),
      location: location
        ? {
            address: location,
            city: 'Unknown',
            state: 'Unknown',
            zipCode: '00000',
          }
        : undefined,
    }),
    [campaignId, campaignTitle, campaignDescription, location, startDate]
  );

  // Note: estimatePDFSize function is not available in the current implementation
  const estimatedSize = 'Unknown';

  const handleGenerateStandardPDF = useCallback(async () => {
    // Note: validateCampaignPDFData function is not available in the current implementation
    // Basic validation can be added here if needed

    setIsGenerating(true);

    try {
      // Use the available generateCampaignReport function
      const pdfBuffer = await generateCampaignReport(pdfData, options);
      const filename = `campaign-${campaignId}-info.pdf`;

      // Create blob and download
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      onSuccess?.(filename);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to generate PDF';
      onError?.(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, [pdfData, options, campaignId, onError, onSuccess]);

  const handleGenerateCustomPDF = useCallback(async () => {
    if (!previewRef.current) return;

    setIsGenerating(true);

    try {
      // Note: generatePDFFromElement function is not available in the current implementation
      // Using generateCampaignReport as fallback
      const pdfBuffer = await generateCampaignReport(pdfData, options);
      const filename = `campaign-${campaignId}-custom.pdf`;

      // Create blob and download
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      onSuccess?.(filename);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to generate custom PDF';
      onError?.(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, [pdfData, options, campaignId, onError, onSuccess]);

  // Replace 'any' with proper type for the value parameter
  const updateOptions = useCallback(
    (
      key: keyof PDFOptions,
      value: string | boolean | Record<string, number>
    ) => {
      setOptions((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <div className="flex gap-2">
          <button
            onClick={handleGenerateStandardPDF}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Generate PDF
          </button>

          <button
            onClick={handleGenerateCustomPDF}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            Custom PDF
          </button>

          <button
            onClick={() => setShowOptions(!showOptions)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Options
          </button>
        </div>

        <div className="text-sm text-gray-600">
          Estimated size: ~{estimatedSize}KB
        </div>
      </div>

      {/* Options Panel */}
      {showOptions && (
        <div className="bg-gray-50 border rounded-lg p-4 space-y-4">
          <h3 className="font-semibold text-gray-900">
            PDF Generation Options
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Format
              </label>
              <select
                value={options.format}
                onChange={(e) => updateOptions('format', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="a4">A4</option>
                <option value="letter">Letter</option>
                <option value="legal">Legal</option>
              </select>
            </div>

            {/* Orientation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Orientation
              </label>
              <select
                value={options.orientation}
                onChange={(e) => updateOptions('orientation', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Preview for Custom PDF */}
      <div className="bg-white border rounded-lg p-6" ref={previewRef}>
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center border-b pb-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {`Campaign: ${campaignTitle}`}
            </h1>
            <p className="text-lg text-gray-600">
              Organized by {organizationName}
            </p>
          </div>

          {/* Campaign Details */}
          <div className="space-y-4">
            {location && (
              <div>
                <span className="font-semibold text-gray-700">Location: </span>
                <span className="text-gray-600">{location}</span>
              </div>
            )}

            {(startDate || endDate) && (
              <div>
                <span className="font-semibold text-gray-700">Duration: </span>
                <span className="text-gray-600">
                  {startDate && endDate
                    ? `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
                    : startDate
                      ? `Starting ${startDate.toLocaleDateString()}`
                      : endDate
                        ? `Until ${endDate.toLocaleDateString()}`
                        : 'Ongoing'}
                </span>
              </div>
            )}

            <div>
              <h2 className="font-semibold text-gray-900 mb-2">Description</h2>
              <p className="text-gray-700 leading-relaxed">
                {campaignDescription}
              </p>
            </div>

            {additionalInfo && additionalInfo.length > 0 && (
              <div>
                <h2 className="font-semibold text-gray-900 mb-2">
                  Additional Information
                </h2>
                <ul className="space-y-1">
                  {additionalInfo.map((info, index) => (
                    <li key={index} className="text-gray-700">
                      • {info}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h2 className="font-semibold text-gray-900 mb-2">
                Participation
              </h2>
              <p className="text-gray-700 mb-2">
                Visit the following link to participate in this campaign:
              </p>
              <p className="text-blue-600 text-sm break-all bg-blue-50 p-2 rounded">
                {participationUrl}
              </p>
            </div>

            {contactInfo && (
              <div>
                <h2 className="font-semibold text-gray-900 mb-2">
                  Contact Information
                </h2>
                <div className="space-y-1 text-gray-700">
                  {contactInfo.email && <p>Email: {contactInfo.email}</p>}
                  {contactInfo.phone && <p>Phone: {contactInfo.phone}</p>}
                  {contactInfo.website && <p>Website: {contactInfo.website}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t pt-4 text-xs text-gray-500 flex justify-between">
            <span>Generated on {new Date().toLocaleDateString()}</span>
            <span>Campaign ID: {campaignId}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
