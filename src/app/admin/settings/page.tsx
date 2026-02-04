"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Settings as SettingsIcon, 
  Save, 
  Mail, 
  Server, 
  CreditCard, 
  Database, 
  Globe, 
  ShieldCheck, 
  Zap, 
  Loader2,
  Plus,
  Trash2,
  Eye,
  Code,
  Sparkles,
  ArrowRight,
  TrendingUp
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "general");
    const [envStatus, setEnvStatus] = useState<any>({});

    // Settings State
    const [settings, setSettings] = useState<any>({
      general: {
        site_name: "IELTS Practice BD",
        site_description: "Achieve your target band score with realistic mock tests.",
        support_email: "support@ieltspracticebd.com",
        pricing_model: "hybrid"
      },
      email: {
        provider: "smtp",
        smtp_host: "",
        smtp_port: "587",
        smtp_user: "",
        smtp_pass: "",
        from_email: "noreply@ieltspracticebd.com",
        from_name: "IELTS Practice BD",
        template: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: #111; padding: 40px 20px; text-align: center; }
    .logo { color: #a3e635; font-size: 24px; font-weight: bold; letter-spacing: -1px; }
    .content { padding: 40px 30px; }
    .footer { text-align: center; padding: 30px; background: #f9f9f9; color: #888; font-size: 12px; }
    .button { display: inline-block; background: #a3e635; color: #000; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">ielts<span style="color:white">practice</span>bd</div>
    </div>
    <div class="content">
      <h2 style="margin-top:0">Welcome to Excellence</h2>
      <p>Hi {{name}},</p>
      <p>Thank you for joining our platform. We're excited to help you achieve your target IELTS band score.</p>
      <p>Click the button below to explore our latest mock tests:</p>
      <a href="{{url}}" class="button">Start Practice Now</a>
    </div>
    <div class="footer">
      <p>&copy; 2024 IELTS Practice BD. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`
      },
        payments: {
          rupantor_pay: { enabled: false, api_key: "" },
        },
        database: {
          url: "",
          service_role_key: "",
          anon_key: ""
        },
        ai: {
          provider: "openai",
          openai_model: "gpt-4o-mini",
          gemini_model: "gemini-2.5-flash-lite",
          claude_model: "claude-3-5-sonnet-20240620",
            groq_model: "llama-3.3-70b-versatile",
          poe_model: "Gemini-IELTS",
          enabled: true,
          openai_api_key: "",
          gemini_api_key: "",
          groq_api_key: "",
          claude_api_key: "",
          poe_api_key: ""
        },
        storage: {
          imgbb_api_key: ""
        }
      });


    useEffect(() => {
      fetchSettings();
      fetchEnvStatus();
    }, []);

    async function fetchEnvStatus() {
      try {
        const res = await fetch("/api/admin/check-env");
        const data = await res.json();
        if (!data.error) setEnvStatus(data);
      } catch (err) {
        console.error("Failed to fetch env status:", err);
      }
    }

    async function fetchSettings() {
      setLoading(true);
      const { data, error } = await supabase.from("site_settings").select("*");
      
      if (data) {
        const newSettings = { ...settings };
        data.forEach((item: any) => {
          if (item.key === "email_settings") newSettings.email = item.value;
          if (item.key === "payment_settings") newSettings.payments = item.value;
            if (item.key === "database_settings") newSettings.database = item.value;
            if (item.key === "general_settings") newSettings.general = item.value;
            if (item.key === "ai_settings") newSettings.ai = item.value;
          });
          setSettings(newSettings);
        }

      setLoading(false);
    }

    async function handleSave(category: string) {
      setSaving(true);
      let key = "";
      let value = {};

      if (category === "general") { key = "general_settings"; value = settings.general; }
      if (category === "email") { key = "email_settings"; value = settings.email; }
      if (category === "payments") { key = "payment_settings"; value = settings.payments; }
      if (category === "database") { key = "database_settings"; value = settings.database; }
      if (category === "ai") { key = "ai_settings"; value = settings.ai; }

      const { error } = await supabase
        .from("site_settings")
        .upsert(
          { 
            key, 
            value, 
            updated_at: new Date().toISOString() 
          },
          { 
            onConflict: 'key',
            ignoreDuplicates: false
          }
        )
        .select();

      if (error) {
        console.error("Settings save error:", error);
        // Fallback for unique constraint issues if upsert fails
        if (error.code === '23505') {
          const { error: updateError } = await supabase
            .from("site_settings")
            .update({ value, updated_at: new Date().toISOString() })
            .eq('key', key);
          
          if (updateError) toast.error("Update failed: " + updateError.message);
          else toast.success("Settings updated successfully");
        } else {
          toast.error("Failed to save: " + error.message);
        }
      } else {
        toast.success("Settings saved successfully");
      }
      setSaving(false);
    }

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    return (
      <div className="space-y-8 pb-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">System Settings</h1>
            <p className="text-muted-foreground">Configure your platform's core infrastructure and services.</p>
          </div>
          <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">
            Admin Mode
          </Badge>
        </div>

          <Tabs defaultValue="general" onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 lg:w-[900px] mb-8">
              <TabsTrigger value="general" className="gap-2"><SettingsIcon className="h-4 w-4" />General</TabsTrigger>
              <TabsTrigger value="email" className="gap-2"><Mail className="h-4 w-4" />Email</TabsTrigger>
              <TabsTrigger value="payments" className="gap-2"><CreditCard className="h-4 w-4" />Payments</TabsTrigger>
                <TabsTrigger value="database" className="gap-2"><Database className="h-4 w-4" />Database</TabsTrigger>
                <TabsTrigger value="ai" className="gap-2"><Sparkles className="h-4 w-4" />AI</TabsTrigger>
                <TabsTrigger value="seo" className="gap-2"><Globe className="h-4 w-4" />SEO & Cloudflare</TabsTrigger>
              </TabsList>


          <TabsContent value="general" className="space-y-6">
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle>General Configuration</CardTitle>
                <CardDescription>Basic site identity and behavior.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Site Name</Label>
                    <Input 
                      value={settings.general.site_name}
                      onChange={(e) => setSettings({...settings, general: {...settings.general, site_name: e.target.value}})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Support Email</Label>
                    <Input 
                      value={settings.general.support_email}
                      onChange={(e) => setSettings({...settings, general: {...settings.general, support_email: e.target.value}})}
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Site Description</Label>
                    <Textarea 
                      value={settings.general.site_description}
                      onChange={(e) => setSettings({...settings, general: {...settings.general, site_description: e.target.value}})}
                    />
                  </div>
                </div>
                <div className="pt-4">
                  <Button onClick={() => handleSave("general")} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save General Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle>SMTP / Email Service</CardTitle>
                  <CardDescription>Configure how your system sends emails.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>SMTP Host</Label>
                    <Input 
                      placeholder="smtp.resend.com"
                      value={settings.email.smtp_host}
                      onChange={(e) => setSettings({...settings, email: {...settings.email, smtp_host: e.target.value}})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Port</Label>
                      <Input 
                        placeholder="587"
                        value={settings.email.smtp_port}
                        onChange={(e) => setSettings({...settings, email: {...settings.email, smtp_port: e.target.value}})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Sender Name</Label>
                      <Input 
                        value={settings.email.from_name}
                        onChange={(e) => setSettings({...settings, email: {...settings.email, from_name: e.target.value}})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>SMTP Username</Label>
                    <Input 
                      value={settings.email.smtp_user}
                      onChange={(e) => setSettings({...settings, email: {...settings.email, smtp_user: e.target.value}})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>SMTP Password</Label>
                    <Input 
                      type="password"
                      value={settings.email.smtp_pass}
                      onChange={(e) => setSettings({...settings, email: {...settings.email, smtp_pass: e.target.value}})}
                    />
                  </div>
                  <div className="pt-4">
                    <Button onClick={() => handleSave("email")} disabled={saving}>
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Save Email Config
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Email Template</CardTitle>
                      <CardDescription>Live edit your system emails.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="gap-1"><Code className="h-3 w-3" /> HTML</Badge>
                      <Badge variant="outline" className="gap-1"><Eye className="h-3 w-3" /> Preview</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea 
                    className="font-mono text-xs h-[300px] bg-black/30"
                    value={settings.email.template}
                    onChange={(e) => setSettings({...settings, email: {...settings.email, template: e.target.value}})}
                  />
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 text-xs text-muted-foreground">
                    Available variables: <code className="text-primary">{"{{name}}"}</code>, <code className="text-primary">{"{{url}}"}</code>, <code className="text-primary">{"{{otp}}"}</code>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

            <TabsContent value="payments" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Rupantor Pay */}
                <Card className={`bg-card/50 border-border/50 transition-all ${settings.payments.rupantor_pay.enabled ? 'ring-1 ring-primary' : 'opacity-60'}`}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-[10px]">
                          RUP
                        </div>
                        <CardTitle className="text-lg">Rupantor Pay</CardTitle>
                      </div>
                      <Switch 
                        checked={settings.payments.rupantor_pay.enabled}
                        onCheckedChange={(v) => setSettings({...settings, payments: {...settings.payments, rupantor_pay: {...settings.payments.rupantor_pay, enabled: v}}})}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1">
                      <Label className="text-xs">API Key</Label>
                      <Input className="h-8 text-xs" value={settings.payments.rupantor_pay.api_key} onChange={(e) => setSettings({...settings, payments: {...settings.payments, rupantor_pay: {...settings.payments.rupantor_pay, api_key: e.target.value}}})}/>
                    </div>
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 text-[10px] text-muted-foreground">
                      <p className="font-bold mb-1">Integration Guide:</p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>Get your API key from <a href="https://rupantorpay.com" target="_blank" className="text-primary hover:underline">Rupantor Pay Dashboard</a></li>
                        <li>Set your Webhook URL to: <code className="text-primary">{typeof window !== 'undefined' ? `${window.location.origin}/api/payment/rupantor-webhook` : '/api/payment/rupantor-webhook'}</code></li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="flex justify-center pt-6">
                <Button size="lg" className="w-full md:w-auto px-12" onClick={() => handleSave("payments")} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Update Payment Gateways
                </Button>
              </div>
            </TabsContent>

          <TabsContent value="database" className="space-y-6">
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle>Infrastructure & Secrets</CardTitle>
                <CardDescription>Critical backend configuration. Handle with extreme care.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Database URL (Direct Connection)</Label>
                    <Input 
                      type="password"
                      placeholder="postgresql://postgres:password@host:5432/postgres"
                      value={settings.database.url}
                      onChange={(e) => setSettings({...settings, database: {...settings.database, url: e.target.value}})}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Supabase Service Role Key</Label>
                      <Input 
                        type="password"
                        value={settings.database.service_role_key}
                        onChange={(e) => setSettings({...settings, database: {...settings.database, service_role_key: e.target.value}})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Supabase Anon Key</Label>
                      <Input 
                        type="password"
                        value={settings.database.anon_key}
                        onChange={(e) => setSettings({...settings, database: {...settings.database, anon_key: e.target.value}})}
                      />
                    </div>
                  </div>
                </div>
                <div className="pt-4">
                  <Button variant="destructive" onClick={() => handleSave("database")} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                    Save Critical Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Alert className="bg-amber-500/10 border-amber-500/20 text-amber-500">
              <ShieldCheck className="h-4 w-4" />
              <AlertTitle className="font-bold">Security Notice</AlertTitle>
              <AlertDescription className="text-xs">
                Changes here will take effect immediately. Ensure your keys are correct to avoid service disruption.
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="ai" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle>AI Provider Settings</CardTitle>
                  <CardDescription>Select and configure the AI model for Writing evaluation.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <div className="space-y-0.5">
                      <Label>Enable AI Evaluation</Label>
                      <p className="text-xs text-muted-foreground">Toggle automated writing feedback</p>
                    </div>
                    <Switch 
                      checked={settings.ai.enabled}
                      onCheckedChange={(v) => setSettings({...settings, ai: {...settings.ai, enabled: v}})}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>AI Provider</Label>
                      <Select 
                        value={settings.ai.provider}
                        onValueChange={(v) => setSettings({...settings, ai: {...settings.ai, provider: v}})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Provider" />
                        </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="openai">OpenAI (Premium - GPT-4o)</SelectItem>
                              <SelectItem value="gemini">Google Gemini (Recommended Free)</SelectItem>
                              <SelectItem value="claude">Anthropic Claude (Premium - Sonnet 3.5)</SelectItem>
                                <SelectItem value="groq">Groq (Ultra-Fast Free - Llama 3.3)</SelectItem>
                              <SelectItem value="poe">Poe API (Community Specialized)</SelectItem>
                            </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-border/50">
                        <Label className="text-primary font-bold">API Keys (Override .env)</Label>
                        <div className="grid gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs">OpenAI API Key</Label>
                            <Input 
                              type="password" 
                              placeholder="sk-..." 
                              value={settings.ai.openai_api_key} 
                              onChange={(e) => setSettings({...settings, ai: {...settings.ai, openai_api_key: e.target.value}})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Gemini API Key</Label>
                            <Input 
                              type="password" 
                              placeholder="AIza..." 
                              value={settings.ai.gemini_api_key} 
                              onChange={(e) => setSettings({...settings, ai: {...settings.ai, gemini_api_key: e.target.value}})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Groq API Key</Label>
                            <Input 
                              type="password" 
                              placeholder="gsk_..." 
                              value={settings.ai.groq_api_key} 
                              onChange={(e) => setSettings({...settings, ai: {...settings.ai, groq_api_key: e.target.value}})}
                            />
                          </div>
                        </div>
                      </div>

                      {settings.ai.provider === "poe" && (
                        <div className="space-y-2">
                          <Label>Poe Bot Name</Label>
                          <Input 
                            value={settings.ai.poe_model}
                            onChange={(e) => setSettings({...settings, ai: {...settings.ai, poe_model: e.target.value}})}
                            placeholder="Gemini-IELTS"
                          />
                        </div>
                      )}


                    {settings.ai.provider === "openai" && (
                      <div className="space-y-2">
                        <Label>OpenAI Model</Label>
                        <Select 
                          value={settings.ai.openai_model}
                          onValueChange={(v) => setSettings({...settings, ai: {...settings.ai, openai_model: v}})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Model" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gpt-4o">GPT-4o (Most Capable)</SelectItem>
                            <SelectItem value="gpt-4o-mini">GPT-4o mini (Fast & Cheap)</SelectItem>
                            <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                      {settings.ai.provider === "gemini" && (
                        <div className="space-y-2">
                          <Label>Gemini Model</Label>
                          <Select 
                            value={settings.ai.gemini_model}
                            onValueChange={(v) => setSettings({...settings, ai: {...settings.ai, gemini_model: v}})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Model" />
                            </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite (Recommended)</SelectItem>
                                <SelectItem value="gemini-2.0-pro-exp-02-05">Gemini 2.0 Pro (Experimental)</SelectItem>
                                <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                                <SelectItem value="gemini-1.5-flash-latest">Gemini 1.5 Flash (Legacy)</SelectItem>
                              </SelectContent>
                          </Select>
                        </div>
                      )}

                      {settings.ai.provider === "claude" && (
                        <div className="space-y-2">
                          <Label>Claude Model</Label>
                          <Select 
                            value={settings.ai.claude_model}
                            onValueChange={(v) => setSettings({...settings, ai: {...settings.ai, claude_model: v}})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Model" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="claude-3-5-sonnet-20240620">Claude 3.5 Sonnet</SelectItem>
                              <SelectItem value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</SelectItem>
                              <SelectItem value="claude-3-opus-20240229">Claude 3 Opus</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {settings.ai.provider === "groq" && (
                        <div className="space-y-2">
                          <Label>Groq Model</Label>
                          <Select 
                            value={settings.ai.groq_model}
                            onValueChange={(v) => setSettings({...settings, ai: {...settings.ai, groq_model: v}})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Model" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="llama-3.3-70b-versatile">Llama 3.3 70B (High Quality)</SelectItem>
                              <SelectItem value="llama-3.1-8b-instant">Llama 3.1 8B (Fastest)</SelectItem>
                              <SelectItem value="mixtral-8x7b-32768">Mixtral 8x7B</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                  </div>

                  <div className="pt-4">
                    <Button onClick={() => handleSave("ai")} disabled={saving} className="w-full">
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Save AI Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle>Usage Instructions</CardTitle>
                  <CardDescription>How to configure API keys.</CardDescription>
                </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 text-xs space-y-3">
                      <p className="font-bold text-primary">AI Strategy Guide:</p>
                        <div className="space-y-2 text-[11px] leading-relaxed">
                          <p>
                            <span className="font-bold text-foreground">Best Free Option:</span> Use <span className="text-primary font-bold">Groq (Llama 3.3 70B)</span>. It is extremely fast and provides high-quality IELTS evaluation without costs.
                          </p>
                            <p>
                              <span className="font-bold text-foreground">Recommended Free:</span> <span className="text-primary font-bold">Google Gemini 2.5 Flash Lite</span> is the most efficient stable model and very accurate for feedback.
                            </p>
                          <p>
                            <span className="font-bold text-foreground">Premium:</span> GPT-4o and Claude 3.5 Sonnet provide the absolute best results but require paid credits.
                          </p>
                        </div>

                        <div className="pt-2 space-y-2 font-mono">
                          <div className="flex justify-between items-center p-2 rounded bg-black/20">
                            <span>OPENAI_API_KEY</span>
                            <Badge variant={envStatus.OPENAI_API_KEY ? "default" : "secondary"}>{envStatus.OPENAI_API_KEY ? "Set" : "Missing"}</Badge>
                          </div>
                          <div className="flex justify-between items-center p-2 rounded bg-black/20">
                            <span>GEMINI_API_KEY</span>
                            <Badge variant={envStatus.GEMINI_API_KEY ? "default" : "secondary"}>{envStatus.GEMINI_API_KEY ? "Set" : "Missing"}</Badge>
                          </div>
                          <div className="flex justify-between items-center p-2 rounded bg-black/20">
                            <span>ANTHROPIC_API_KEY</span>
                            <Badge variant={envStatus.ANTHROPIC_API_KEY ? "default" : "secondary"}>{envStatus.ANTHROPIC_API_KEY ? "Set" : "Missing"}</Badge>
                          </div>
                          <div className="flex justify-between items-center p-2 rounded bg-black/20">
                            <span>GROQ_API_KEY</span>
                            <Badge variant={envStatus.GROQ_API_KEY ? "default" : "secondary"}>{envStatus.GROQ_API_KEY ? "Set" : "Missing"}</Badge>
                          </div>
                          <div className="flex justify-between items-center p-2 rounded bg-black/20">
                            <span>POE_API_KEY</span>
                            <Badge variant={envStatus.POE_API_KEY ? "default" : "secondary"}>{envStatus.POE_API_KEY ? "Set" : "Missing"}</Badge>
                          </div>
                        </div>

                    <p className="text-[10px] text-muted-foreground mt-2 italic">
                      Note: You must restart the server after adding new keys to the .env file.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

            <TabsContent value="seo" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="bg-card/50 border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                      <Zap className="h-5 w-5" />
                      Cloudflare & Security
                    </CardTitle>
                    <CardDescription>Steps to integrate Cloudflare for speed and protection.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm leading-relaxed">
                    <ol className="list-decimal pl-4 space-y-2">
                      <li>Add your domain to <span className="font-bold">Cloudflare Dashboard</span>.</li>
                      <li>Update your nameservers to Cloudflare's provided ones.</li>
                      <li>Enable <span className="font-bold">SSL/TLS (Full/Strict)</span>.</li>
                      <li>In <span className="font-bold">Security &gt; WAF</span>, enable Bot Fight Mode.</li>
                      <li>Enable <span className="font-bold">Auto Minify</span> (JS, CSS, HTML) in Speed settings.</li>
                    </ol>
                    <div className="p-4 rounded-xl bg-secondary/50 border border-border/30 mt-4">
                      <p className="font-bold mb-1 flex items-center gap-2 text-xs">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Rate Limiting Status
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Middleware is active. Each IP is limited to 100 requests per 15 minutes to prevent DDoS and scraping.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/50 border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-500">
                      <TrendingUp className="h-5 w-5" />
                      SEO Best Practices
                    </CardTitle>
                    <CardDescription>How to stay at the top of Google rankings.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm leading-relaxed">
                    <ul className="list-disc pl-4 space-y-2">
                      <li><span className="font-bold">Keyword Optimization:</span> Use "IELTS Practice Bangladesh", "Online IELTS Mock Test" in translations.</li>
                      <li><span className="font-bold">Meta Tags:</span> Update site_description in General tab with high-ranking keywords.</li>
                      <li><span className="font-bold">Mobile First:</span> Our site is fully responsive, which Google loves.</li>
                      <li><span className="font-bold">Fast Loading:</span> Keep images optimized. Cloudflare will handle caching.</li>
                      <li><span className="font-bold">Fresh Content:</span> Regularly add new mock tests and vocabulary words.</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      );
    }


  function Alert({ children, className }: { children: React.ReactNode, className?: string }) {
  return <div className={`p-4 rounded-lg border flex gap-3 ${className}`}>{children}</div>
}

function AlertTitle({ children, className }: { children: React.ReactNode, className?: string }) {
  return <h5 className={`font-semibold leading-none tracking-tight ${className}`}>{children}</h5>
}

function AlertDescription({ children, className }: { children: React.ReactNode, className?: string }) {
  return <div className={`text-sm opacity-90 ${className}`}>{children}</div>
}
