import { Resend } from 'resend';

export async function sendCustomEmail({ 
  to, 
  subject, 
  html, 
    from = process.env.EMAIL_FROM || 'ielts-practice-bd <[email protected]>' 
  }: { 
    to: string | string[], 
    subject: string, 
    html: string, 
    from?: string 
  }) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Resend Error:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error };
  }
}
