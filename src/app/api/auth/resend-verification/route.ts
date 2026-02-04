import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail, VerificationEmail } from '@/lib/email';
import React from 'react';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    // 1. Get user to get full name
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(email); 
    // Wait, email is not ID. Admin API has getUserByEmail? No, listUsers is common but let's check if we can filter.
    // Actually, listUsers doesn't support filtering by email in current Supabase JS.
    // So we use listUsers but we can optimize if we have many users.
    // Alternatively, we can just search for the user.
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    const targetUser = users.find(u => u.email === email);

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.email_confirmed_at) {
      return NextResponse.json({ error: 'ইমেইল অলরেডি ভেরিফাইড' }, { status: 400 });
    }

    // 2. Generate confirmation link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: email,
      options: {
        redirectTo: `${new URL(req.url).origin}/auth/callback`,
      }
    });

    if (linkError) {
      console.error('Link generation error:', linkError);
      return NextResponse.json({ error: 'Failed to generate verification link' }, { status: 500 });
    }

    // 3. Send custom email via Resend
    const verificationUrl = linkData.properties.action_link;
    const fullName = targetUser.user_metadata?.full_name || 'শিক্ষার্থী';
    
    const emailResult = await sendEmail({
      to: email,
      subject: 'আপনার ইমেইল ভেরিফাই করুন - IELTS Practice BD',
      react: React.createElement(VerificationEmail, {
        name: fullName,
        verificationUrl,
      }),
    });

    if (!emailResult.success) {
      return NextResponse.json({ error: 'Failed to send email via Resend' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Verification email resent!' });

  } catch (error: any) {
    console.error('Resend Verification API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
