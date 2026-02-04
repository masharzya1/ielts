"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Github, Mail, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);
  const [resending, setResending] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email_confirmed_at) {
        const params = new URLSearchParams(window.location.search);
        const redirectTo = params.get("redirectTo") || "/dashboard";
        router.push(redirectTo);
      }
    }
    checkUser();
  }, [router]);

  const handleResendVerification = async () => {
    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        setError(null);
        alert("ভেরিফিকেশন ইমেইল পুনরায় পাঠানো হয়েছে। আপনার ইনবক্স চেক করুন।");
      } else {
        setError(data.error || "Failed to resend email");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    }
    setResending(false);
  };

  const handleLogin = async (e: FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError(null);
  
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
  
      if (error) {
        setError(error.message);
        setLoading(false);
        } else if (data.user && !data.user.email_confirmed_at) {
          await supabase.auth.signOut();
          setError("আপনার ইমেইলটি এখনও ভেরিফাই করা হয়নি। দয়া করে আপনার ইনবক্স চেক করুন।");
          setLoading(false);
          // Show resend button
          setShowResend(true);
        } else {
        const params = new URLSearchParams(window.location.search);
        const redirectTo = params.get("redirectTo") || "/dashboard";
        router.replace(redirectTo);
      }
    };

    const handleOAuthLogin = async (provider: "github" | "google") => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) setError(error.message);
    };

  return (
    <div className="container relative min-h-screen flex items-center justify-center py-20 px-4">
      <div className="absolute inset-0 grid-bg opacity-50"></div>
      
      <Card className="w-full max-w-md relative z-10 border-border/50 shadow-2xl backdrop-blur-sm bg-card/80">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">Welcome back</CardTitle>
          <CardDescription>
            Enter your email to sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {error && (
              <div className="space-y-3">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
                {showResend && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full h-11 border-primary/30 hover:bg-primary/10 transition-colors"
                    onClick={handleResendVerification}
                    disabled={resending}
                  >
                    {resending ? "পাঠানো হচ্ছে..." : "আবার ভেরিফিকেশন ইমেইল পাঠান"}
                  </Button>
                )}
              </div>
            )}
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="m@example.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background/50"
              />
            </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/forgot-password" className="text-sm text-primary hover:underline px-0 h-auto font-normal">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-background/50 pr-10"
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
            <Button type="submit" className="w-full h-11 font-semibold" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-11" onClick={() => handleOAuthLogin("github")}>
              <Github className="mr-2 h-4 w-4" />
              Github
            </Button>
            <Button variant="outline" className="h-11" onClick={() => handleOAuthLogin("google")}>
              <Mail className="mr-2 h-4 w-4" />
              Google
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-center gap-1 text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/register" className="text-primary font-semibold hover:underline">
            Sign up
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
