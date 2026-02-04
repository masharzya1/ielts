"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Mail, 
  Save, 
  Send, 
  Settings, 
  History, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Users,
  RefreshCw,
  Eye,
  Sparkles
} from "lucide-react";
import { format } from "date-fns";
import { bn } from "date-fns/locale";

interface EmailLog {
  id: string;
  recipient_email: string;
  subject: string;
  template_type: string;
  status: string;
  message_id: string;
  created_at: string;
}

interface EmailConfig {
  provider: 'resend' | 'brevo';
  from_name: string;
  from_address: string;
}

export default function EmailSettingsPage() {
  const [config, setConfig] = useState<EmailConfig>({
    provider: 'resend',
    from_name: 'IELTS Practice BD',
    from_address: 'noreply@ieltspracticebd.com',
  });
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  
  const [customEmail, setCustomEmail] = useState({
    recipients: 'all',
    selectedUsers: [] as string[],
    subject: '',
    content: '',
    buttonText: '',
    buttonUrl: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const supabase = createClient();

    const { data: settings } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'email_config')
      .maybeSingle();

    if (settings?.value) {
      setConfig(settings.value as EmailConfig);
    }

    const { data: emailLogs } = await supabase
      .from('email_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (emailLogs) setLogs(emailLogs);

    const { data: usersData } = await supabase
      .from('users')
      .select('id, email, full_name')
      .order('created_at', { ascending: false });

    if (usersData) setUsers(usersData);

    setLoading(false);
  }

  const handleSaveConfig = async () => {
    setSaving(true);
    const supabase = createClient();

    const { error } = await supabase
      .from('site_settings')
      .upsert({
        key: 'email_config',
        value: config,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });

    if (error) {
      toast.error('সেটিংস সেভ করতে সমস্যা হয়েছে');
    } else {
      toast.success('Email সেটিংস সেভ হয়েছে');
    }
    setSaving(false);
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      toast.error('টেস্ট ইমেইল এড্রেস দিন');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testEmail,
          templateType: 'welcome',
          templateData: { name: 'Test User' },
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`টেস্ট ইমেইল পাঠানো হয়েছে (${data.provider})`);
        fetchData();
      } else {
        toast.error(data.error || 'ইমেইল পাঠাতে সমস্যা হয়েছে');
      }
    } catch (error) {
      toast.error('ইমেইল পাঠাতে সমস্যা হয়েছে');
    }
    setSending(false);
  };

  const handleSendCustomEmail = async () => {
    if (!customEmail.subject || !customEmail.content) {
      toast.error('সাবজেক্ট এবং কন্টেন্ট দিন');
      return;
    }

    setSending(true);
    const supabase = createClient();

    let recipients: string[] = [];
    if (customEmail.recipients === 'all') {
      recipients = users.map(u => u.email);
    } else if (customEmail.recipients === 'selected') {
      recipients = customEmail.selectedUsers;
    }

    if (recipients.length === 0) {
      toast.error('অন্তত একজন প্রাপক সিলেক্ট করুন');
      setSending(false);
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const email of recipients) {
      try {
        const user = users.find(u => u.email === email);
        const res = await fetch('/api/emails/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: email,
            templateType: 'custom',
            templateData: {
              name: user?.full_name || 'User',
              content: customEmail.content,
              buttonText: customEmail.buttonText,
              buttonUrl: customEmail.buttonUrl,
            },
            subject: customEmail.subject,
          }),
        });

        const data = await res.json();
        if (data.success) successCount++;
        else failCount++;
      } catch {
        failCount++;
      }
      
      await new Promise(r => setTimeout(r, 200));
    }

    toast.success(`${successCount}টি ইমেইল পাঠানো হয়েছে, ${failCount}টি ব্যর্থ`);
    fetchData();
    setSending(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Email Settings</h1>
        <p className="text-muted-foreground">ইমেইল প্রোভাইডার কনফিগার এবং কাস্টম ইমেইল পাঠান</p>
      </div>

      <Tabs defaultValue="config" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="config" className="gap-2">
            <Settings className="h-4 w-4" /> কনফিগ
          </TabsTrigger>
          <TabsTrigger value="compose" className="gap-2">
            <Send className="h-4 w-4" /> কম্পোজ
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" /> হিস্টোরি
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" /> Email Provider
              </CardTitle>
              <CardDescription>
                Resend বা Brevo থেকে আপনার পছন্দের প্রোভাইডার সিলেক্ট করুন
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Email Provider</Label>
                  <Select
                    value={config.provider}
                    onValueChange={(value: 'resend' | 'brevo') => setConfig({ ...config, provider: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="resend">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Resend</span>
                          <Badge variant="secondary" className="text-xs">100 ইমেইল/দিন ফ্রি</Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="brevo">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Brevo</span>
                          <Badge variant="secondary" className="text-xs">300 ইমেইল/দিন ফ্রি</Badge>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>From Name</Label>
                  <Input
                    value={config.from_name}
                    onChange={(e) => setConfig({ ...config, from_name: e.target.value })}
                    placeholder="IELTS Practice BD"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>From Email Address</Label>
                <Input
                  value={config.from_address}
                  onChange={(e) => setConfig({ ...config, from_address: e.target.value })}
                  placeholder="noreply@yourdomain.com"
                />
                <p className="text-xs text-muted-foreground">
                  {config.provider === 'resend' 
                    ? 'Resend ড্যাশবোর্ডে ডোমেইন ভেরিফাই করতে হবে। টেস্টের জন্য onboarding@resend.dev ব্যবহার হবে।'
                    : 'Brevo ড্যাশবোর্ডে Sender ভেরিফাই করতে হবে।'
                  }
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
                <Button onClick={handleSaveConfig} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  সেটিংস সেভ করুন
                </Button>

                <div className="flex-1 flex gap-2">
                  <Input
                    placeholder="test@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                  <Button variant="outline" onClick={handleSendTestEmail} disabled={sending}>
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 text-sm">
                <p className="font-medium mb-2">API Keys কনফিগারেশন:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• <code className="text-xs bg-background px-1 py-0.5 rounded">RESEND_API_KEY</code> - Resend ড্যাশবোর্ড থেকে নিন</li>
                  <li>• <code className="text-xs bg-background px-1 py-0.5 rounded">BREVO_API_KEY</code> - Brevo ড্যাশবোর্ড থেকে নিন</li>
                  <li>• <code className="text-xs bg-background px-1 py-0.5 rounded">EMAIL_PROVIDER</code> - resend বা brevo</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compose" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" /> কাস্টম ইমেইল পাঠান
              </CardTitle>
              <CardDescription>
                সকল বা নির্দিষ্ট ইউজারদের ইমেইল পাঠান
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>প্রাপক</Label>
                <Select
                  value={customEmail.recipients}
                  onValueChange={(value) => setCustomEmail({ ...customEmail, recipients: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        সকল ইউজার ({users.length} জন)
                      </div>
                    </SelectItem>
                    <SelectItem value="selected">নির্দিষ্ট ইউজার সিলেক্ট করুন</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {customEmail.recipients === 'selected' && (
                <div className="space-y-2">
                  <Label>ইউজার সিলেক্ট করুন</Label>
                  <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-1">
                    {users.map((user) => (
                      <label key={user.id} className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={customEmail.selectedUsers.includes(user.email)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCustomEmail({
                                ...customEmail,
                                selectedUsers: [...customEmail.selectedUsers, user.email],
                              });
                            } else {
                              setCustomEmail({
                                ...customEmail,
                                selectedUsers: customEmail.selectedUsers.filter((e) => e !== user.email),
                              });
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{user.full_name || user.email}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {customEmail.selectedUsers.length} জন সিলেক্ট করা হয়েছে
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>সাবজেক্ট</Label>
                <Input
                  value={customEmail.subject}
                  onChange={(e) => setCustomEmail({ ...customEmail, subject: e.target.value })}
                  placeholder="ইমেইলের সাবজেক্ট"
                />
              </div>

              <div className="space-y-2">
                <Label>ইমেইল কন্টেন্ট (HTML সাপোর্টেড)</Label>
                <Textarea
                  rows={8}
                  value={customEmail.content}
                  onChange={(e) => setCustomEmail({ ...customEmail, content: e.target.value })}
                  placeholder="<p>আপনার মেসেজ এখানে লিখুন...</p>"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>বাটন টেক্সট (অপশনাল)</Label>
                  <Input
                    value={customEmail.buttonText}
                    onChange={(e) => setCustomEmail({ ...customEmail, buttonText: e.target.value })}
                    placeholder="বিস্তারিত দেখুন"
                  />
                </div>
                <div className="space-y-2">
                  <Label>বাটন URL (অপশনাল)</Label>
                  <Input
                    value={customEmail.buttonUrl}
                    onChange={(e) => setCustomEmail({ ...customEmail, buttonUrl: e.target.value })}
                    placeholder="https://ieltspracticebd.com/..."
                  />
                </div>
              </div>

              <Button 
                onClick={handleSendCustomEmail} 
                disabled={sending || !customEmail.subject || !customEmail.content}
                className="w-full"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    পাঠানো হচ্ছে...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    ইমেইল পাঠান ({customEmail.recipients === 'all' ? users.length : customEmail.selectedUsers.length} জন)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" /> Email History
                </CardTitle>
                <CardDescription>
                  সাম্প্রতিক পাঠানো ইমেইলের তালিকা
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                রিফ্রেশ
              </Button>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  কোনো ইমেইল পাঠানো হয়নি
                </p>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-center gap-4 p-3 rounded-lg border">
                      <div className="flex-shrink-0">
                        {log.status === 'sent' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{log.subject}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {log.recipient_email}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <Badge variant="secondary" className="text-xs">
                          {log.template_type}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(log.created_at), "d MMM, h:mm a", { locale: bn })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
