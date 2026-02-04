import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail, MockTestReminderEmail } from '@/lib/email';
import React from 'react';
import { addHours, addDays, isAfter, isBefore, format } from 'date-fns';

export async function GET(req: Request) {
  try {
    // Basic security check - in production you'd use a secret header or key
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createAdminClient();
    const now = new Date();
    const tomorrow = addDays(now, 1);
    const soon = addHours(now, 1); // Check for tests starting within 1 hour

    // 1. Fetch upcoming mock tests (scheduled within the next 24.5 hours)
    const { data: tests, error: testsError } = await supabaseAdmin
      .from('mock_tests')
      .select('*')
      .eq('test_type', 'mock')
      .eq('is_published', true)
      .gt('scheduled_at', now.toISOString())
      .lt('scheduled_at', addHours(tomorrow, 1).toISOString());

    if (testsError) throw testsError;
    if (!tests || tests.length === 0) {
      return NextResponse.json({ message: 'No upcoming tests found for reminders.' });
    }

    let remindersSent = 0;

    for (const test of tests) {
      const scheduledAt = new Date(test.scheduled_at);
      const hoursToTest = (scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Determine reminder type
      let reminderType = '';
      if (hoursToTest <= 24.5 && hoursToTest >= 23) {
        reminderType = 'mock_reminder_1d';
      } else if (hoursToTest <= 1 && hoursToTest >= 0) {
        reminderType = 'mock_reminder_30m';
      }

      if (!reminderType) continue;

        // 2. Fetch users to notify (Everyone who is registered)
        const { data: usersData } = await supabaseAdmin
          .from('profiles')
          .select('id');
        
        const userIds = usersData?.map(u => u.id) || [];

        if (userIds.length === 0) continue;

      for (const userId of userIds) {
        // 3. Check if reminder already sent for this user and test
        // Need user email
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (!userData.user || !userData.user.email) continue;

        const email = userData.user.email;

        // Check log with email
        const { data: realExistingLog } = await supabaseAdmin
          .from('email_logs')
          .select('id')
          .eq('recipient_email', email)
          .eq('template_type', reminderType)
          .ilike('subject', `%${test.title}%`)
          .maybeSingle();

        if (realExistingLog) continue;

        // 4. Send email
        const subject = reminderType === 'mock_reminder_1d' 
          ? `রিমাইন্ডার: আগামীকাল আপনার মক টেস্ট - ${test.title}`
          : `গুরুত্বপূর্ণ: কিছুক্ষণের মধ্যেই শুরু হচ্ছে আপনার মক টেস্ট - ${test.title}`;

        const result = await sendEmail({
          to: email,
          subject: subject,
          react: React.createElement(MockTestReminderEmail, {
            name: userData.user.user_metadata?.full_name || 'শিক্ষার্থী',
            testTitle: test.title,
            scheduledDate: format(scheduledAt, 'dd MMMM, yyyy'),
            scheduledTime: format(scheduledAt, 'hh:mm a'),
            duration: test.duration_minutes || 180,
          }),
        });

        if (result.success) {
          await supabaseAdmin.from('email_logs').insert({
            recipient_email: email,
            subject: subject,
            template_type: reminderType,
            status: 'sent',
            message_id: result.messageId,
            sent_by: 'system_cron'
          });
          remindersSent++;
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      remindersSent,
      message: `${remindersSent} reminders processed.`
    });

  } catch (error: any) {
    console.error('Reminder Cron Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
