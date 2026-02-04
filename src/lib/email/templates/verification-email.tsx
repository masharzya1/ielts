import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Button,
} from '@react-email/components';
import { BaseTemplate } from './base-template';

interface VerificationEmailProps {
  name: string;
  verificationUrl: string;
}

export const VerificationEmail = ({
  name,
  verificationUrl,
}: VerificationEmailProps) => {
  return (
    <BaseTemplate previewText="আপনার ইমেইল ভেরিফাই করুন">
      <Heading className="text-2xl font-black text-center mb-6">
        ইমেইল ভেরিফিকেশন
      </Heading>
      <Text className="text-base mb-4">
        প্রিয় {name},
      </Text>
      <Text className="text-base mb-6">
        IELTS Practice BD-তে যোগ দেওয়ার জন্য ধন্যবাদ। আপনার অ্যাকাউন্টটি সক্রিয় করতে নিচের বাটনে ক্লিক করে ইমেইলটি ভেরিফাই করুন:
      </Text>
      <Section className="text-center mb-8">
        <Button
          className="bg-[#74b602] text-white px-8 py-4 rounded-xl font-bold text-lg"
          href={verificationUrl}
        >
          ইমেইল ভেরিফাই করুন
        </Button>
      </Section>
      <Text className="text-sm text-gray-500 mb-4">
        বাটনটি কাজ না করলে নিচের লিঙ্কটি কপি করে ব্রাউজারে পেস্ট করুন:
      </Text>
      <Text className="text-xs text-blue-500 break-all mb-6">
        {verificationUrl}
      </Text>
      <Hr className="border-gray-200 mb-6" />
      <Text className="text-xs text-gray-400">
        আপনি যদি এই অ্যাকাউন্টটি তৈরি না করে থাকেন, তবে এই মেইলটি ইগনোর করুন।
      </Text>
    </BaseTemplate>
  );
};

export default VerificationEmail;
