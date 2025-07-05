import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CaptchaVerification } from '../CaptchaVerification';

// Mock hCaptcha component
jest.mock('@hcaptcha/react-hcaptcha', () => {
  return function MockHCaptcha({ onVerify, onError, onExpire }: any) {
    return (
      <div data-testid="hcaptcha-mock">
        <button
          data-testid="captcha-verify"
          onClick={() => onVerify('mock-token-12345')}
        >
          Verify
        </button>
        <button
          data-testid="captcha-error"
          onClick={() => onError('mock-error')}
        >
          Trigger Error
        </button>
        <button data-testid="captcha-expire" onClick={() => onExpire()}>
          Expire
        </button>
      </div>
    );
  };
});

// Mock environment
jest.mock('~/env', () => ({
  env: {
    NEXT_PUBLIC_HCAPTCHA_SITE_KEY: 'mock-site-key-12345',
    NODE_ENV: 'test',
  },
  isServiceConfigured: {
    hcaptcha: () => true,
  },
}));

describe('CaptchaVerification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders CAPTCHA widget when service is configured', () => {
    const onVerify = jest.fn();
    render(<CaptchaVerification onVerify={onVerify} />);

    expect(screen.getByTestId('hcaptcha-mock')).toBeInTheDocument();
  });

  it('calls onVerify when CAPTCHA is successfully completed', async () => {
    const onVerify = jest.fn();
    render(<CaptchaVerification onVerify={onVerify} />);

    fireEvent.click(screen.getByTestId('captcha-verify'));

    await waitFor(() => {
      expect(onVerify).toHaveBeenCalledWith('mock-token-12345');
    });

    expect(screen.getByText('Verified')).toBeInTheDocument();
  });

  it('displays error message when CAPTCHA fails', async () => {
    const onError = jest.fn();
    render(<CaptchaVerification onVerify={jest.fn()} onError={onError} />);

    fireEvent.click(screen.getByTestId('captcha-error'));

    await waitFor(() => {
      expect(
        screen.getByText('CAPTCHA verification failed. Please try again.')
      ).toBeInTheDocument();
    });

    expect(onError).toHaveBeenCalledWith('mock-error');
  });

  it('handles CAPTCHA expiration', async () => {
    const onExpired = jest.fn();
    render(<CaptchaVerification onVerify={jest.fn()} onExpired={onExpired} />);

    // First verify to set verified state
    fireEvent.click(screen.getByTestId('captcha-verify'));
    await waitFor(() => {
      expect(screen.getByText('Verified')).toBeInTheDocument();
    });

    // Then expire
    fireEvent.click(screen.getByTestId('captcha-expire'));

    await waitFor(() => {
      expect(
        screen.getByText('CAPTCHA expired. Please verify again.')
      ).toBeInTheDocument();
    });

    expect(onExpired).toHaveBeenCalled();
    expect(screen.queryByText('Verified')).not.toBeInTheDocument();
  });

  it('shows try again button after error', async () => {
    render(<CaptchaVerification onVerify={jest.fn()} />);

    fireEvent.click(screen.getByTestId('captcha-error'));

    await waitFor(() => {
      expect(screen.getByText('Try again')).toBeInTheDocument();
    });
  });

  it('shows required indicator when required prop is true', () => {
    render(<CaptchaVerification onVerify={jest.fn()} required={true} />);

    expect(
      screen.getByText('Please complete the verification above')
    ).toBeInTheDocument();
  });

  it('displays development fallback when CAPTCHA is not configured', () => {
    // Mock unconfigured service
    jest.doMock('~/env', () => ({
      env: {
        NODE_ENV: 'development',
      },
      isServiceConfigured: {
        hcaptcha: () => false,
      },
    }));

    const { CaptchaVerification } = require('../CaptchaVerification');

    render(<CaptchaVerification onVerify={jest.fn()} />);

    expect(screen.getByText('CAPTCHA Not Configured')).toBeInTheDocument();
    expect(
      screen.getByText(
        'hCaptcha keys not found. CAPTCHA verification is disabled in development.'
      )
    ).toBeInTheDocument();
  });
});
