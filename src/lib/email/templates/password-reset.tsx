import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface PasswordResetEmailProps {
  resetUrl: string;
  firstName?: string;
  ipAddress?: string;
  userAgent?: string;
}

export const PasswordResetEmail = ({
  resetUrl,
  firstName,
  ipAddress,
  userAgent,
}: PasswordResetEmailProps) => {
  const previewText = 'Reset your Civilyst password';

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logo}>
            <Img
              src="https://civilyst.com/logo.png"
              width="180"
              height="60"
              alt="Civilyst"
            />
          </Section>

          <Heading style={h1}>Reset your password</Heading>

          <Text style={text}>
            {firstName ? `Hi ${firstName},` : 'Hi there,'}
          </Text>

          <Text style={text}>
            We received a request to reset your password. Click the button below
            to create a new password:
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={resetUrl}>
              Reset Password
            </Button>
          </Section>

          <Text style={text}>
            Or copy and paste this URL into your browser:
          </Text>

          <Text style={code}>{resetUrl}</Text>

          <Text style={text}>
            This link will expire in 1 hour for security reasons.
          </Text>

          <Text style={warning}>
            If you didn&apos;t request a password reset, please ignore this
            email or contact support if you have concerns about your account
            security.
          </Text>

          {(ipAddress || userAgent) && (
            <Section style={securityInfo}>
              <Text style={securityTitle}>Security Information:</Text>
              {ipAddress && <Text style={securityDetail}>IP: {ipAddress}</Text>}
              {userAgent && (
                <Text style={securityDetail}>Device: {userAgent}</Text>
              )}
            </Section>
          )}

          <Text style={footer}>Civilyst - Your Voice in Civic Engagement</Text>
        </Container>
      </Body>
    </Html>
  );
};

export default PasswordResetEmail;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const logo = {
  margin: '0 auto',
  marginBottom: '32px',
  textAlign: 'center' as const,
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '32px',
  margin: '16px 0',
  padding: '0 48px',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
  padding: '0 48px',
};

const buttonContainer = {
  padding: '0 48px',
  margin: '32px 0',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#6366f1',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const code = {
  backgroundColor: '#f4f4f5',
  borderRadius: '4px',
  color: '#374151',
  fontSize: '14px',
  fontFamily: 'monospace',
  lineHeight: '20px',
  margin: '16px 48px',
  padding: '12px',
  wordBreak: 'break-all' as const,
};

const warning = {
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  color: '#92400e',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 48px',
  padding: '12px',
};

const securityInfo = {
  backgroundColor: '#f3f4f6',
  borderRadius: '8px',
  margin: '16px 48px',
  padding: '16px',
};

const securityTitle = {
  color: '#4b5563',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 8px 0',
};

const securityDetail = {
  color: '#6b7280',
  fontSize: '13px',
  margin: '4px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 0',
  padding: '0 48px',
};
