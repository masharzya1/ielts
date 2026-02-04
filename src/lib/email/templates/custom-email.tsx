import * as React from 'react';
import { Section, Text, Button, Link } from '@react-email/components';
import { BaseTemplate } from './base-template';

interface CustomEmailProps {
  name: string;
  subject: string;
  content: string;
  buttonText?: string;
  buttonUrl?: string;
}

export function CustomEmail({
  name,
  subject,
  content,
  buttonText,
  buttonUrl,
}: CustomEmailProps) {
  return (
    <BaseTemplate preview={subject}>
      <Section style={contentStyle}>
        <Text style={greeting}>হ্যালো {name},</Text>
        
        <div 
          style={htmlContent}
          dangerouslySetInnerHTML={{ __html: content }}
        />
        
        {buttonText && buttonUrl && (
          <Section style={buttonContainer}>
            <Button style={button} href={buttonUrl}>
              {buttonText}
            </Button>
          </Section>
        )}
        
        <Text style={signature}>
          শুভকামনা,<br />
          IELTS Practice BD টিম
        </Text>
      </Section>
    </BaseTemplate>
  );
}

const contentStyle = {
  padding: '32px 48px',
};

const greeting = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#1f2937',
  margin: '0 0 24px',
};

const htmlContent = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#374151',
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

const signature = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#6b7280',
  margin: '32px 0 0',
};

export default CustomEmail;
