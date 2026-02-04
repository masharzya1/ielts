import * as React from 'react';
import { Section, Text, Button, Link } from '@react-email/components';
import { BaseTemplate } from './base-template';

interface WelcomeEmailProps {
  name: string;
  email: string;
}

export function WelcomeEmail({ name, email }: WelcomeEmailProps) {
  return (
    <BaseTemplate preview={`${name}, IELTS Practice BD এ স্বাগতম!`}>
      <Section style={content}>
        <Text style={greeting}>হ্যালো {name}! 👋</Text>
        
        <Text style={paragraph}>
          <strong>IELTS Practice BD</strong> এ আপনাকে স্বাগতম! আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে।
        </Text>
        
        <Text style={paragraph}>
          এখন আপনি আমাদের প্ল্যাটফর্মে:
        </Text>
        
        <Section style={features}>
          <Text style={featureItem}>✓ ফ্রি প্র্যাকটিস টেস্ট দিতে পারবেন</Text>
          <Text style={featureItem}>✓ লাইভ মক টেস্টে অংশ নিতে পারবেন</Text>
          <Text style={featureItem}>✓ AI ইভ্যালুয়েশন পেতে পারবেন</Text>
          <Text style={featureItem}>✓ ভোকাবুলারি শিখতে পারবেন</Text>
        </Section>
        
        <Section style={buttonContainer}>
          <Button style={button} href="https://ieltspracticebd.com/dashboard">
            ড্যাশবোর্ডে যান
          </Button>
        </Section>
        
        <Text style={paragraph}>
          কোনো প্রশ্ন থাকলে আমাদের{' '}
          <Link href="https://ieltspracticebd.com/contact" style={link}>
            যোগাযোগ পেজে
          </Link>
          {' '}জানাতে পারেন।
        </Text>
        
        <Text style={signature}>
          শুভকামনা,<br />
          IELTS Practice BD টিম
        </Text>
      </Section>
    </BaseTemplate>
  );
}

const content = {
  padding: '32px 48px',
};

const greeting = {
  fontSize: '24px',
  fontWeight: '700',
  color: '#1f2937',
  margin: '0 0 24px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#374151',
  margin: '0 0 16px',
};

const features = {
  backgroundColor: '#f0fdf4',
  borderRadius: '8px',
  padding: '20px 24px',
  margin: '24px 0',
};

const featureItem = {
  fontSize: '15px',
  lineHeight: '28px',
  color: '#166534',
  margin: '0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#74b602',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
};

const link = {
  color: '#74b602',
  textDecoration: 'underline',
};

const signature = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#6b7280',
  margin: '32px 0 0',
};

export default WelcomeEmail;
