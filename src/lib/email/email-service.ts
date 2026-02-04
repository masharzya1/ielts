import { Resend } from 'resend';
import { TransactionalEmailsApi, TransactionalEmailsApiApiKeys } from '@getbrevo/brevo';
import { render } from '@react-email/components';
import { createClient } from '@/lib/supabase/server';
import * as React from 'react';

export type EmailProvider = 'resend' | 'brevo';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react?: React.ReactElement;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider?: EmailProvider;
}

interface EmailConfig {
  provider: EmailProvider;
  from_name: string;
  from_address: string;
}

async function getEmailConfig(): Promise<EmailConfig> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'email_config')
      .maybeSingle();
    
    if (data?.value) {
      return data.value as EmailConfig;
    }
  } catch (e) {
    console.log('Using default email config');
  }
  
  return {
    provider: (process.env.EMAIL_PROVIDER as EmailProvider) || 'resend',
    from_name: process.env.EMAIL_FROM_NAME || 'IELTS Practice BD',
    from_address: process.env.EMAIL_FROM_ADDRESS || 'noreply@ieltspracticebd.com',
  };
}

export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
  const config = await getEmailConfig();
  const toAddresses = Array.isArray(options.to) ? options.to : [options.to];

  let htmlContent = options.html;
  if (options.react && !htmlContent) {
    htmlContent = await render(options.react);
  }

  if (config.provider === 'resend') {
    return sendWithResend(toAddresses, options.subject, htmlContent, options.text, config, options.replyTo);
  } else if (config.provider === 'brevo') {
    return sendWithBrevo(toAddresses, options.subject, htmlContent, options.text, config, options.replyTo);
  }

  return {
    success: false,
    error: `Email provider ${config.provider} not configured properly`,
  };
}

async function sendWithResend(
  to: string[],
  subject: string,
  html?: string,
  text?: string,
  config?: EmailConfig,
  replyTo?: string
): Promise<EmailResult> {
  if (!process.env.RESEND_API_KEY) {
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  
  let fromAddress = `${config?.from_name || 'IELTS Practice BD'} <onboarding@resend.dev>`;
  if (config?.from_address && config.from_address !== 'noreply@ieltspracticebd.com') {
    fromAddress = `${config.from_name} <${config.from_address}>`;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to,
      subject,
      html,
      text,
      replyTo: replyTo ? [replyTo] : undefined,
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message, provider: 'resend' };
    }

    return { success: true, messageId: data?.id, provider: 'resend' };
  } catch (error: any) {
    console.error('Resend exception:', error);
    return { success: false, error: error.message || 'Failed to send email', provider: 'resend' };
  }
}

async function sendWithBrevo(
  to: string[],
  subject: string,
  html?: string,
  text?: string,
  config?: EmailConfig,
  replyTo?: string
): Promise<EmailResult> {
  if (!process.env.BREVO_API_KEY) {
    return { success: false, error: 'BREVO_API_KEY not configured' };
  }

  const brevo = new TransactionalEmailsApi();
  brevo.setApiKey(TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

  try {
    const result = await brevo.sendTransacEmail({
      sender: { 
        email: config?.from_address || 'noreply@ieltspracticebd.com', 
        name: config?.from_name || 'IELTS Practice BD' 
      },
      to: to.map(email => ({ email })),
      subject,
      htmlContent: html,
      textContent: text,
      replyTo: replyTo ? { email: replyTo } : undefined,
    });

    return { success: true, messageId: result.body.messageId, provider: 'brevo' };
  } catch (error: any) {
    console.error('Brevo exception:', error);
    return { success: false, error: error.message || 'Failed to send email', provider: 'brevo' };
  }
}

export async function sendBulkEmail(
  recipients: Array<{ email: string; name?: string; variables?: Record<string, string> }>,
  subject: string,
  htmlTemplate: string,
  textTemplate?: string
): Promise<EmailResult[]> {
  const results: EmailResult[] = [];

  for (const recipient of recipients) {
    let html = htmlTemplate;
    let text = textTemplate;
    
    if (recipient.variables) {
      for (const [key, value] of Object.entries(recipient.variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        html = html.replace(regex, value);
        if (text) text = text.replace(regex, value);
      }
    }

    html = html.replace(/{{name}}/g, recipient.name || 'User');
    if (text) text = text.replace(/{{name}}/g, recipient.name || 'User');

    const result = await sendEmail({
      to: recipient.email,
      subject,
      html,
      text,
    });

    results.push(result);
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
}

export { getEmailConfig };
