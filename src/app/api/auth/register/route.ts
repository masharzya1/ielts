import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail, VerificationEmail } from '@/lib/email';
import React from 'react';

export async function POST(req: Request) {
  try {
    const { email, password, fullName } = await req.json();

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (signUpError) {
      return NextResponse.json({ error: signUpError.message }, { status: 400 });
    }

    if (!signUpData.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: signUpData.user.id,
        full_name: fullName,
        email: email,
        role: "user",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });

    if (profileError) {
      console.error('Profile creation error:', profileError);
    }

    // solve this problem generate email verification link




    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: email,
      password: password,
      options: {
        redirectTo: `${new URL(req.url).origin}/auth/callback`,
      }
    });

    if (linkError) {
      console.error('Link generation error:', linkError);
      return NextResponse.json({ error: 'Failed to generate verification link' }, { status: 500 });
    }

    const verificationUrl = linkData.properties.action_link;
    
    const emailResult = await sendEmail({
      to: email,
      subject: 'আপনার ইমেইল ভেরিফাই করুন - IELTS Practice BD',
      react: React.createElement(VerificationEmail, {
        name: fullName,
        verificationUrl,
      }),
    });

    if (!emailResult.success) {
      console.error('Verification email failed:', emailResult.error);
      return NextResponse.json({ 
        success: true, 
        message: 'User created but verification email failed to send. Please contact support.',
        userId: signUpData.user.id 
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Verification email sent!',
      userId: signUpData.user.id 
    });

  } catch (error: any) {
    console.error('Registration API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
