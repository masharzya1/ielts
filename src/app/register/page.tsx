"use client";

import { useEffect, useState, FormEvent, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Mail, 
  AlertCircle, 
  User, 
  Lock,
  CheckCircle2,
  Eye,
  EyeOff,
  Gift,
  Loader2
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("ref");

  useEffect(() => {
    async function checkUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const redirectTo = searchParams.get("redirectTo") || "/dashboard";
        router.push(redirectTo);
      }
    }
    checkUser();
  }, [router, searchParams]);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          fullName,
          referralCode
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to register");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-lg relative z-10 border-border/50 shadow-2xl backdrop-blur-sm bg-card/80 text-center p-8 rounded-[2rem]">
        <div className="flex justify-center mb-6">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
        </div>
        <CardTitle className="text-3xl font-black mb-4">অ্যাকাউন্ট তৈরি হয়েছে!</CardTitle>
        <CardDescription className="text-lg font-bold">
          আপনার ইমেইল <span className="font-semibold text-foreground">{email}</span>-এ একটি ভেরিফিকেশন লিঙ্ক পাঠানো হয়েছে। 
          দয়া করে লিঙ্কটি চেক করুন এবং আপনার অ্যাকাউন্টটি ভেরিফাই করুন।
        </CardDescription>
        <Button asChild variant="outline" className="mt-8 w-full h-12 text-lg font-black rounded-xl">
          <Link href="/login">লগইন পেজে ফিরে যান</Link>
        </Button>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md relative z-10 border-border/50 shadow-2xl backdrop-blur-sm bg-card/80 rounded-[2rem]">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-3xl font-black tracking-tight">অ্যাকাউন্ট খুলুন</CardTitle>
        <CardDescription className="font-bold">আপনার তথ্য দিয়ে রেজিস্ট্রেশন সম্পন্ন করুন</CardDescription>
        {referralCode && (
          <div className="mt-4 p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center gap-2">
            <Gift className="h-4 w-4 text-primary" />
            <span className="text-xs font-black text-primary uppercase tracking-widest">রেফারেল বোনাস সচল আছে!</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive" className="rounded-xl">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="font-medium">{error}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">পূর্ণ নাম</Label>
            <div className="relative">
              <User className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input 
                id="fullName" 
                placeholder="আপনার নাম লিখুন" 
                required 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="bg-background/50 pl-10 h-11 rounded-xl"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">ইমেইল</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input 
                id="email" 
                type="email" 
                placeholder="name@example.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background/50 pl-10 h-11 rounded-xl"
              />
            </div>
          </div>
          <div className="space-y-2">
              <Label htmlFor="password">পাসওয়ার্ড</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-background/50 pl-10 pr-10 h-11 rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">পাসওয়ার্ড নিশ্চিত করুন</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="confirmPassword" 
                  type={showConfirmPassword ? "text" : "password"} 
                  required 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-background/50 pl-10 pr-10 h-11 rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          <Button type="submit" className="w-full h-12 text-lg font-black rounded-xl mt-2" disabled={loading}>
            {loading ? "অ্যাকাউন্ট তৈরি হচ্ছে..." : "অ্যাকাউন্ট তৈরি করুন"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-center gap-1 text-sm font-bold text-muted-foreground pb-8">
        ইতিমধ্যেই অ্যাকাউন্ট আছে?{" "}
        <Link href="/login" className="text-primary hover:underline">
          লগইন করুন
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <div className="container relative min-h-screen flex items-center justify-center py-20 px-4 font-hind-siliguri">
      <div className="absolute inset-0 grid-bg opacity-50"></div>
      <Suspense fallback={<Loader2 className="animate-spin" />}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
