'use client';

import { useRef, useState, useCallback } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { env, isServiceConfigured } from '~/env';
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface CaptchaVerificationProps {
  onVerify: (token: string) => void;
  onError?: (error: string) => void;
  onExpired?: () => void;
  size?: 'compact' | 'normal';
  theme?: 'light' | 'dark';
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export function CaptchaVerification({
  onVerify,
  onError,
  onExpired,
  size = 'normal',
  theme = 'light',
  className = '',
  disabled: _disabled = false,
  required = false,
}: CaptchaVerificationProps) {
  const captchaRef = useRef<HCaptcha>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  const handleVerify = useCallback(
    (token: string) => {
      setIsVerified(true);
      setError(null);
      setIsLoading(false);
      onVerify(token);
    },
    [onVerify]
  );

  const handleError = useCallback(
    (err: string) => {
      setError('CAPTCHA verification failed. Please try again.');
      setIsVerified(false);
      setIsLoading(false);
      onError?.(err);
    },
    [onError]
  );

  const handleExpired = useCallback(() => {
    setIsVerified(false);
    setError('CAPTCHA expired. Please verify again.');
    onExpired?.();
  }, [onExpired]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleOpen = useCallback(() => {
    setIsLoading(true);
    setError(null);
  }, []);

  const resetCaptcha = useCallback(() => {
    captchaRef.current?.resetCaptcha();
    setIsVerified(false);
    setError(null);
  }, []);

  // If CAPTCHA is not configured, show a fallback message for development
  if (!isServiceConfigured.hcaptcha()) {
    if (process.env.NODE_ENV === 'development') {
      return (
        <div
          className={`rounded-lg border border-yellow-200 bg-yellow-50 p-4 ${className}`}
        >
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                CAPTCHA Not Configured
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                hCaptcha keys not found. CAPTCHA verification is disabled in
                development.
              </p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* CAPTCHA Widget */}
      <div className="flex flex-col items-center space-y-2">
        {isVerified && (
          <div className="flex items-center space-x-2 text-green-600">
            <ShieldCheckIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Verified</span>
          </div>
        )}

        <HCaptcha
          ref={captchaRef}
          sitekey={env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
          onVerify={handleVerify}
          onError={handleError}
          onExpire={handleExpired}
          onLoad={handleLoad}
          onOpen={handleOpen}
          size={size}
          theme={theme}
        />

        {isLoading && (
          <div className="text-sm text-gray-500">Loading verification...</div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
              <button
                type="button"
                onClick={resetCaptcha}
                className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Required indicator */}
      {required && !isVerified && (
        <p className="text-sm text-gray-600">
          <span className="text-red-500">*</span> Please complete the
          verification above
        </p>
      )}
    </div>
  );
}

export default CaptchaVerification;
