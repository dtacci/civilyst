'use client';

import { useState, useCallback, ComponentType } from 'react';
import { CaptchaVerification } from './CaptchaVerification';
import { useUser } from '@clerk/nextjs';
import { isServiceConfigured } from '~/env';

interface CaptchaProtectionProps {
  onCaptchaVerified?: (token: string) => void;
  captchaRequired?: boolean;
  showCaptchaAlways?: boolean;
}

interface WithCaptchaProtectionProps extends CaptchaProtectionProps {
  captchaToken?: string;
  isCaptchaVerified: boolean;
  onCaptchaVerify: (token: string) => void;
  resetCaptcha: () => void;
}

/**
 * Higher-order component that adds CAPTCHA protection to anonymous actions
 */
export function withCaptchaProtection<P extends object>(
  WrappedComponent: ComponentType<P & WithCaptchaProtectionProps>
) {
  return function CaptchaProtectedComponent(props: P & CaptchaProtectionProps) {
    const { user } = useUser();
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
    const [_captchaError, setCaptchaError] = useState<string | null>(null);

    const isAnonymous = !user;
    const shouldShowCaptcha =
      props.showCaptchaAlways ||
      (isAnonymous && (props.captchaRequired ?? true)) ||
      (!isServiceConfigured.hcaptcha() &&
        process.env.NODE_ENV === 'development');

    const handleCaptchaVerify = useCallback(
      (token: string) => {
        setCaptchaToken(token);
        setIsCaptchaVerified(true);
        setCaptchaError(null);
        props.onCaptchaVerified?.(token);
      },
      [props]
    );

    const handleCaptchaError = useCallback((error: string) => {
      setCaptchaError(error);
      setIsCaptchaVerified(false);
      setCaptchaToken(null);
    }, []);

    const resetCaptcha = useCallback(() => {
      setCaptchaToken(null);
      setIsCaptchaVerified(false);
      setCaptchaError(null);
    }, []);

    // If CAPTCHA is not required, render the component directly
    if (!shouldShowCaptcha) {
      return (
        <WrappedComponent
          {...props}
          captchaToken={null}
          isCaptchaVerified={true}
          onCaptchaVerify={handleCaptchaVerify}
          resetCaptcha={resetCaptcha}
        />
      );
    }

    return (
      <div className="space-y-4">
        {/* CAPTCHA Verification */}
        <CaptchaVerification
          onVerify={handleCaptchaVerify}
          onError={handleCaptchaError}
          onExpired={resetCaptcha}
          required={true}
          className="mb-4"
        />

        {/* Protected Component */}
        <WrappedComponent
          {...props}
          captchaToken={captchaToken}
          isCaptchaVerified={isCaptchaVerified}
          onCaptchaVerify={handleCaptchaVerify}
          resetCaptcha={resetCaptcha}
        />
      </div>
    );
  };
}

/**
 * Hook to manage CAPTCHA state for manual integration
 */
export function useCaptchaProtection() {
  const { user } = useUser();
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [captchaError, setCaptchaError] = useState<string | null>(null);

  const isAnonymous = !user;
  const isCaptchaRequired = isAnonymous && isServiceConfigured.hcaptcha();

  const handleCaptchaVerify = useCallback((token: string) => {
    setCaptchaToken(token);
    setIsCaptchaVerified(true);
    setCaptchaError(null);
  }, []);

  const handleCaptchaError = useCallback((error: string) => {
    setCaptchaError(error);
    setIsCaptchaVerified(false);
    setCaptchaToken(null);
  }, []);

  const resetCaptcha = useCallback(() => {
    setCaptchaToken(null);
    setIsCaptchaVerified(false);
    setCaptchaError(null);
  }, []);

  return {
    captchaToken,
    isCaptchaVerified,
    captchaError,
    isCaptchaRequired,
    isAnonymous,
    onCaptchaVerify: handleCaptchaVerify,
    onCaptchaError: handleCaptchaError,
    resetCaptcha,
  };
}

/**
 * Simple CAPTCHA guard component for forms
 */
interface CaptchaGuardProps {
  children: React.ReactNode;
  onVerified?: (token: string) => void;
  required?: boolean;
  className?: string;
}

export function CaptchaGuard({
  children,
  onVerified,
  required = true,
  className = '',
}: CaptchaGuardProps) {
  const {
    captchaToken: _captchaToken,
    isCaptchaVerified,
    isCaptchaRequired,
    onCaptchaVerify,
    resetCaptcha,
  } = useCaptchaProtection();

  const handleVerify = useCallback(
    (token: string) => {
      onCaptchaVerify(token);
      onVerified?.(token);
    },
    [onCaptchaVerify, onVerified]
  );

  // Show children if CAPTCHA is not required or is verified
  if (!isCaptchaRequired || isCaptchaVerified) {
    return <div className={className}>{children}</div>;
  }

  // Show CAPTCHA verification
  return (
    <div className={`space-y-4 ${className}`}>
      <CaptchaVerification
        onVerify={handleVerify}
        onExpired={resetCaptcha}
        required={required}
      />

      {/* Disabled state of children */}
      <div className="opacity-50 pointer-events-none">{children}</div>
    </div>
  );
}

export default withCaptchaProtection;
