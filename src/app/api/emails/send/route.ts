import { NextResponse } from 'next/server';
import { sendEmail, getEmailConfig, WelcomeEmail, PaymentSuccessEmail, MockTestReminderEmail, CustomEmail } from '@/lib/email';
import { createClient } from '@/lib/supabase/server';
import React from 'react';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    const body = await req.json();
    const { 
      to, 
      templateType, 
      templateData,
      subject: customSubject,
      html: customHtml,
    } = body;

    if (!to) {
      return NextResponse.json({ error: 'Recipient email is required' }, { status: 400 });
    }

    let emailElement: React.ReactElement | undefined;
    let subject = customSubject;

    switch (templateType) {
      case 'welcome':
        emailElement = React.createElement(WelcomeEmail, {
          name: templateData?.name || 'User',
          email: to,
        });
        subject = subject || `${templateData?.name || 'User'}, IELTS Practice BD এ স্বাগতম!`;
        break;

      case 'payment_success':
        emailElement = React.createElement(PaymentSuccessEmail, {
          name: templateData?.name || 'User',
          email: to,
          productName: templateData?.productName,
          productType: templateData?.productType,
          amount: templateData?.amount,
          transactionId: templateData?.transactionId,
          purchaseDate: templateData?.purchaseDate,
          expiryDate: templateData?.expiryDate,
        });
        subject = subject || `পেমেন্ট সফল - ${templateData?.productName}`;
        break;

      case 'mock_reminder':
        emailElement = React.createElement(MockTestReminderEmail, {
          name: templateData?.name || 'User',
          testTitle: templateData?.testTitle,
          scheduledDate: templateData?.scheduledDate,
          scheduledTime: templateData?.scheduledTime,
          duration: templateData?.duration,
        });
        subject = subject || `মক টেস্ট রিমাইন্ডার - ${templateData?.testTitle}`;
        break;

      case 'custom':
        emailElement = React.createElement(CustomEmail, {
          name: templateData?.name || 'User',
          subject: customSubject || 'IELTS Practice BD থেকে বার্তা',
          content: templateData?.content || '',
          buttonText: templateData?.buttonText,
          buttonUrl: templateData?.buttonUrl,
        });
        subject = customSubject || 'IELTS Practice BD থেকে বার্তা';
        break;

      default:
        if (customHtml) {
          break;
        }
        return NextResponse.json({ error: 'Invalid template type' }, { status: 400 });
    }

    const result = await sendEmail({
      to,
      subject: subject || 'IELTS Practice BD',
      react: emailElement,
      html: customHtml,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    try {
      await supabase.from('email_logs').insert({
        recipient_email: Array.isArray(to) ? to.join(', ') : to,
        subject,
        template_type: templateType || 'custom_html',
        status: 'sent',
        message_id: result.messageId,
        sent_by: user?.id,
      });
    } catch (logError) {
      console.log('Email log insert failed:', logError);
    }

    return NextResponse.json({ 
      success: true, 
      messageId: result.messageId,
      provider: result.provider,
    });
  } catch (error: any) {
    console.error('Email API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
