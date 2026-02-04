import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Img,
  Hr,
  Preview,
} from '@react-email/components';

interface BaseTemplateProps {
  preview: string;
  children: React.ReactNode;
}

export function BaseTemplate({ preview, children }: BaseTemplateProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>
              <span style={{ color: '#000' }}>ielts</span>
              <span style={{ color: '#74b602' }}>practice</span>
              <span style={{ color: '#000' }}>bd</span>
            </Text>
          </Section>
          
          {children}
          
          <Hr style={hr} />
          
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} IELTS Practice BD. সর্বস্বত্ব সংরক্ষিত।
            </Text>
            <Text style={footerLinks}>
              <Link href="https://ieltspracticebd.com" style={link}>ওয়েবসাইট</Link>
              {' • '}
              <Link href="https://ieltspracticebd.com/contact" style={link}>যোগাযোগ</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '32px 48px',
  textAlign: 'center' as const,
  borderBottom: '1px solid #e6ebf1',
};

const logo = {
  fontSize: '28px',
  fontWeight: '900',
  letterSpacing: '-0.5px',
  margin: '0',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footer = {
  padding: '32px 48px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '0 0 8px',
};

const footerLinks = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '0',
};

const link = {
  color: '#74b602',
  textDecoration: 'underline',
};
