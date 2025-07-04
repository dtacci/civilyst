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

interface VerificationEmailProps {
  verificationUrl: string;
  firstName?: string;
}

export const VerificationEmail = ({
  verificationUrl,
  firstName,
}: VerificationEmailProps) => {
  const previewText = 'Verify your email address for Civilyst';

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

          <Heading style={h1}>Verify your email address</Heading>

          <Text style={text}>
            {firstName ? `Hi ${firstName},` : 'Hi there,'}
          </Text>

          <Text style={text}>
            Please click the button below to verify your email address and
            complete your Civilyst account setup.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={verificationUrl}>
              Verify Email Address
            </Button>
          </Section>

          <Text style={text}>
            Or copy and paste this URL into your browser:
          </Text>

          <Text style={code}>{verificationUrl}</Text>

          <Text style={text}>
            This link will expire in 24 hours. If you didn&apos;t create an
            account with Civilyst, you can safely ignore this email.
          </Text>

          <Text style={footer}>Civilyst - Your Voice in Civic Engagement</Text>
        </Container>
      </Body>
    </Html>
  );
};

export default VerificationEmail;

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

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 0',
  padding: '0 48px',
};
