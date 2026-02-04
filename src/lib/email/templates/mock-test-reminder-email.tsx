import * as React from 'react';
import { Section, Text, Button, Link } from '@react-email/components';
import { BaseTemplate } from './base-template';

interface MockTestReminderEmailProps {
  name: string;
  testTitle: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
}

export function MockTestReminderEmail({
  name,
  testTitle,
  scheduledDate,
  scheduledTime,
  duration,
}: MockTestReminderEmailProps) {
  return (
    <BaseTemplate preview={`মক টেস্ট রিমাইন্ডার - ${testTitle}`}>
      <Section style={content}>
        <Section style={reminderBanner}>
          <Text style={reminderIcon}>⏰</Text>
          <Text style={reminderText}>মক টেস্ট শুরু হতে চলেছে!</Text>
        </Section>
        
        <Text style={greeting}>হ্যালো {name},</Text>
        
        <Text style={paragraph}>
          আপনার রেজিস্টার করা মক টেস্ট শীঘ্রই শুরু হতে যাচ্ছে।
        </Text>
        
        <Section style={testBox}>
          <Text style={testTitle}>{testTitle}</Text>
          <Text style={testInfo}>📅 তারিখ: {scheduledDate}</Text>
          <Text style={testInfo}>🕐 সময়: {scheduledTime}</Text>
          <Text style={testInfo}>⏱️ সময়কাল: {duration} মিনিট</Text>
        </Section>
        
        <Section style={tipBox}>
          <Text style={tipTitle}>পরীক্ষার আগে মনে রাখুন:</Text>
          <Text style={tipItem}>• স্থিতিশীল ইন্টারনেট সংযোগ নিশ্চিত করুন</Text>
          <Text style={tipItem}>• শান্ত পরিবেশে পরীক্ষা দিন</Text>
          <Text style={tipItem}>• হেডফোন প্রস্তুত রাখুন (লিসেনিং এর জন্য)</Text>
          <Text style={tipItem}>• নির্ধারিত সময়ে লগইন করুন</Text>
        </Section>
        
        <Section style={buttonContainer}>
          <Button style={button} href="https://ieltspracticebd.com/mock">
            মক টেস্ট পেজে যান
          </Button>
        </Section>
        
        <Text style={paragraph}>
          শুভকামনা! আপনার সাফল্য কামনা করি।
        </Text>
        
        <Text style={signature}>
          IELTS Practice BD টিম
        </Text>
      </Section>
    </BaseTemplate>
  );
}

const content = {
  padding: '32px 48px',
};

const reminderBanner = {
  backgroundColor: '#fef3c7',
  borderRadius: '12px',
  padding: '24px',
  textAlign: 'center' as const,
  marginBottom: '32px',
};

const reminderIcon = {
  fontSize: '48px',
  margin: '0 0 8px',
};

const reminderText = {
  fontSize: '24px',
  fontWeight: '700',
  color: '#92400e',
  margin: '0',
};

const greeting = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#1f2937',
  margin: '0 0 16px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#374151',
  margin: '0 0 16px',
};

const testBox = {
  backgroundColor: '#74b602',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const testTitle = {
  fontSize: '20px',
  fontWeight: '700',
  color: '#fff',
  margin: '0 0 16px',
};

const testInfo = {
  fontSize: '15px',
  color: '#fff',
  margin: '4px 0',
  opacity: '0.9',
};

const tipBox = {
  backgroundColor: '#f3f4f6',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const tipTitle = {
  fontSize: '14px',
  fontWeight: '700',
  color: '#374151',
  margin: '0 0 12px',
};

const tipItem = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '4px 0',
  lineHeight: '24px',
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

export default MockTestReminderEmail;
