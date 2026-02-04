"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/settings?reset=true`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  return (
    <div className="container relative min-h-screen flex items-center justify-center py-20 px-4 font-hind-siliguri">
      <div className="absolute inset-0 grid-bg opacity-50"></div>
      
      <Card className="w-full max-w-md relative z-10 border-border/50 shadow-2xl backdrop-blur-sm bg-card/80 rounded-3xl overflow-hidden">
        <CardHeader className="space-y-1 text-center pt-10">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-black">পাসওয়ার্ড ভুলে গেছেন?</CardTitle>
          <CardDescription className="font-medium">
            আপনার ইমেইল দিন, আমরা পাসওয়ার্ড রিসেট লিংক পাঠিয়ে দেব।
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-6">
          {error && (
            <Alert variant="destructive" className="rounded-xl">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>ত্রুটি</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success ? (
            <Alert className="rounded-xl border-green-500/30 bg-green-500/5 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>সফল!</AlertTitle>
              <AlertDescription>
                আপনার ইমেইলে রিসেট লিংক পাঠানো হয়েছে। দয়া করে ইনবক্স চেক করুন।
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-bold">ইমেইল ঠিকানা</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@example.com" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background/50 h-12 rounded-xl border-border/50"
                />
              </div>
              <Button type="submit" className="w-full h-12 font-black rounded-xl shadow-lg" disabled={loading}>
                {loading ? "পাঠানো হচ্ছে..." : "রিসেট লিংক পাঠান"}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-center justify-center gap-4 px-6 pb-10">
          <Link 
            href="/login" 
            className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            লগইন পেজে ফিরে যান
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
