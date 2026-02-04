import * as React from 'react';
import { Section, Text, Button, Link, Row, Column } from '@react-email/components';
import { BaseTemplate } from './base-template';

interface PaymentSuccessEmailProps {
  name: string;
  email: string;
  productName: string;
  productType: 'mock' | 'subscription' | 'ai_evaluation' | 'vocab';
  amount: number;
  transactionId: string;
  purchaseDate: string;
  expiryDate?: string;
}

export function PaymentSuccessEmail({
  name,
  email,
  productName,
  productType,
  amount,
  transactionId,
  purchaseDate,
  expiryDate,
}: PaymentSuccessEmailProps) {
  const getProductTypeLabel = () => {
    switch (productType) {
      case 'mock': return 'মক টেস্ট';
      case 'subscription': return 'সাবস্ক্রিপশন';
      case 'ai_evaluation': return 'AI ইভ্যালুয়েশন';
      case 'vocab': return 'ভোকাবুলারি';
      default: return 'পণ্য';
    }
  };

  return (
    <BaseTemplate preview={`পেমেন্ট সফল - ${productName}`}>
      <Section style={content}>
        <Section style={successBanner}>
          <Text style={successIcon}>✓</Text>
          <Text style={successText}>পেমেন্ট সফল হয়েছে!</Text>
        </Section>
        
        <Text style={greeting}>হ্যালো {name},</Text>
        
        <Text style={paragraph}>
          আপনার পেমেন্ট সফলভাবে সম্পন্ন হয়েছে। আপনার ক্রয়ের বিস্তারিত নিচে দেওয়া হলো:
        </Text>
        
        <Section style={invoiceBox}>
          <Row style={invoiceRow}>
            <Column style={invoiceLabel}>পণ্য:</Column>
            <Column style={invoiceValue}>{productName}</Column>
          </Row>
          <Row style={invoiceRow}>
            <Column style={invoiceLabel}>ধরন:</Column>
            <Column style={invoiceValue}>{getProductTypeLabel()}</Column>
          </Row>
          <Row style={invoiceRow}>
            <Column style={invoiceLabel}>মূল্য:</Column>
            <Column style={invoiceValue}>৳{amount}</Column>
          </Row>
          <Row style={invoiceRow}>
            <Column style={invoiceLabel}>ট্রানজেকশন আইডি:</Column>
            <Column style={invoiceValue}>{transactionId}</Column>
          </Row>
          <Row style={invoiceRow}>
            <Column style={invoiceLabel}>তারিখ:</Column>
            <Column style={invoiceValue}>{purchaseDate}</Column>
          </Row>
          {expiryDate && (
            <Row style={invoiceRow}>
              <Column style={invoiceLabel}>মেয়াদ:</Column>
              <Column style={invoiceValue}>{expiryDate} পর্যন্ত</Column>
            </Row>
          )}
        </Section>
        
        <Section style={buttonContainer}>
          <Button style={button} href="https://ieltspracticebd.com/dashboard">
            ড্যাশবোর্ডে যান
          </Button>
        </Section>
        
        <Text style={paragraph}>
          কোনো সমস্যা হলে আমাদের{' '}
          <Link href="https://ieltspracticebd.com/contact" style={link}>
            সাপোর্ট টিমের
          </Link>
          {' '}সাথে যোগাযোগ করুন।
        </Text>
        
        <Text style={signature}>
          ধন্যবাদ,<br />
          IELTS Practice BD টিম
        </Text>
      </Section>
    </BaseTemplate>
  );
}

const content = {
  padding: '32px 48px',
};

const successBanner = {
  backgroundColor: '#f0fdf4',
  borderRadius: '12px',
  padding: '24px',
  textAlign: 'center' as const,
  marginBottom: '32px',
};

const successIcon = {
  fontSize: '48px',
  margin: '0 0 8px',
  color: '#16a34a',
};

const successText = {
  fontSize: '24px',
  fontWeight: '700',
  color: '#166534',
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

const invoiceBox = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
  padding: '20px',
  margin: '24px 0',
};

const invoiceRow = {
  marginBottom: '12px',
};

const invoiceLabel = {
  fontSize: '14px',
  color: '#6b7280',
  width: '140px',
  paddingRight: '16px',
};

const invoiceValue = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#1f2937',
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

export default PaymentSuccessEmail;
