import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface CampaignUpdateEmailProps {
  firstName: string;
  campaignTitle: string;
  updateType: 'status_change' | 'new_vote' | 'comment' | 'milestone';
  updateMessage: string;
  campaignUrl: string;
  voteCount?: number;
  supportPercentage?: number;
  unsubscribeUrl: string;
}

export const CampaignUpdateEmail = ({
  firstName,
  campaignTitle,
  updateType,
  updateMessage,
  campaignUrl,
  voteCount,
  supportPercentage,
  unsubscribeUrl,
}: CampaignUpdateEmailProps) => {
  const getUpdateTitle = () => {
    switch (updateType) {
      case 'status_change':
        return 'Campaign Status Update';
      case 'new_vote':
        return 'New Activity on Your Campaign';
      case 'comment':
        return 'New Comment on Campaign';
      case 'milestone':
        return 'Campaign Milestone Reached!';
      default:
        return 'Campaign Update';
    }
  };

  const previewText = `${getUpdateTitle()}: ${campaignTitle}`;

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

          <Heading style={h1}>{getUpdateTitle()}</Heading>

          <Text style={text}>Hi {firstName},</Text>

          <Section style={campaignBox}>
            <Text style={campaignTitle}>{campaignTitle}</Text>
            {(voteCount !== undefined || supportPercentage !== undefined) && (
              <Section style={statsContainer}>
                {voteCount !== undefined && (
                  <Text style={stat}>
                    <strong>{voteCount}</strong> votes
                  </Text>
                )}
                {supportPercentage !== undefined && (
                  <Text style={stat}>
                    <strong>{supportPercentage}%</strong> support
                  </Text>
                )}
              </Section>
            )}
          </Section>

          <Text style={text}>{updateMessage}</Text>

          <Section style={buttonContainer}>
            <Button style={button} href={campaignUrl}>
              View Campaign
            </Button>
          </Section>

          <Text style={footer}>
            You're receiving this because you're following this campaign.
            <Link href={unsubscribeUrl} style={link}>
              {' '}
              Unsubscribe
            </Link>
          </Text>

          <Text style={footer}>Civilyst - Your Voice in Civic Engagement</Text>
        </Container>
      </Body>
    </Html>
  );
};

export default CampaignUpdateEmail;

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

const campaignBox = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  margin: '16px 48px',
  padding: '20px',
};

const campaignTitle = {
  color: '#111827',
  fontSize: '18px',
  fontWeight: '600',
  lineHeight: '24px',
  margin: '0 0 12px 0',
};

const statsContainer = {
  display: 'flex',
  gap: '24px',
};

const stat = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0',
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
