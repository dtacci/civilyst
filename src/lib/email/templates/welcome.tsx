import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface WelcomeEmailProps {
  firstName: string;
  city?: string;
  verificationUrl?: string;
}

export const WelcomeEmail = ({
  firstName,
  city,
  verificationUrl,
}: WelcomeEmailProps) => {
  const previewText = `Welcome to Civilyst, ${firstName}!`;

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

          <Heading style={h1}>Welcome to Civilyst, {firstName}!</Heading>

          <Text style={text}>
            Thank you for joining Civilyst, your platform for civic engagement
            and community participation{city ? ` in ${city}` : ''}.
          </Text>

          <Text style={text}>With Civilyst, you can:</Text>

          <Section style={list}>
            <Text style={listItem}>
              • Voice your opinion on local development projects
            </Text>
            <Text style={listItem}>• Participate in community discussions</Text>
            <Text style={listItem}>
              • Stay informed about civic initiatives
            </Text>
            <Text style={listItem}>
              • Connect with neighbors who share your vision
            </Text>
          </Section>

          {verificationUrl && (
            <>
              <Text style={text}>
                To get started, please verify your email address:
              </Text>
              <Section style={buttonContainer}>
                <Button style={button} href={verificationUrl}>
                  Verify Email Address
                </Button>
              </Section>
            </>
          )}

          <Hr style={hr} />

          <Text style={footer}>
            Have questions? Reply to this email or visit our{' '}
            <Link href="https://civilyst.com/help" style={link}>
              help center
            </Link>
            .
          </Text>

          <Text style={footer}>Civilyst - Your Voice in Civic Engagement</Text>
        </Container>
      </Body>
    </Html>
  );
};

export default WelcomeEmail;

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

const list = {
  padding: '0 48px',
  margin: '16px 0',
};

const listItem = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '8px 0',
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

const hr = {
  borderColor: '#e6ebf1',
  margin: '32px 48px',
};

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 0',
  padding: '0 48px',
};

const link = {
  color: '#6366f1',
  textDecoration: 'underline',
};
