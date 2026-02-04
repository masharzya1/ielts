"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, ShieldCheck, ArrowLeft, CheckCircle2, Clock, Calendar } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function TestCheckoutPage() {
  const { testId } = useParams();
  const router = useRouter();
  
  const [testDetails, setTestDetails] = useState<{ id: string; title: string; price: number; test_type: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function initCheckout() {
      if (!testId) {
        setError("No test selected");
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/login?redirectTo=${encodeURIComponent(`/checkout/${testId}`)}`);
        return;
      }
      setUser(user);

        try {
          const { data: test, error: testError } = await supabase
            .from("mock_tests")
            .select("id, title, price, test_type")
            .eq("id", testId)
            .maybeSingle();
  
          if (testError || !test) throw new Error("Test not found");
  
          const { data: purchase } = await supabase
            .from("user_purchases")
            .select("id, expires_at")
            .eq("user_id", user.id)
            .eq("test_id", testId)
            .eq("status", "completed")
            .maybeSingle();

        if (purchase) {
            if (test.test_type === 'practice') {
              if (!purchase.expires_at || new Date(purchase.expires_at) > new Date()) {
                router.push(`/practice`);
                return;
              }
            } else {
              router.push(`/mock/${testId}`);
              return;
            }
          }

        setTestDetails(test);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    initCheckout();
  }, [testId, router]);

  const handlePayment = async () => {
    if (!testDetails || !user) return;
    
    setIsProcessing(true);
    try {
      const res = await fetch("/api/payment/rupantor-init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          testId: testDetails.id,
          amount: testDetails.price,
          customerName: user.user_metadata?.full_name || user.email?.split('@')[0] || "Customer",
          customerEmail: user.email
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to initialize payment");
      }

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        throw new Error("Payment URL not received");
      }
    } catch (err: any) {
      toast.error(err.message);
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !testDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-red-500/20 bg-red-500/5">
          <CardHeader className="text-center">
            <CardTitle className="text-red-500">Error</CardTitle>
            <CardDescription>{error || "Test not found"}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
              <Button asChild variant="outline">
                <Link href="/practice">Back to Practice</Link>
              </Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 relative">
      <div className="absolute inset-0 grid-bg opacity-30"></div>
      
        <div className="container relative z-10 mx-auto px-4 max-w-2xl">
          <Link href={`/mock/${testId}`} className="inline-flex items-center text-primary hover:underline mb-8 font-medium">
            <ArrowLeft className="h-4 w-4 mr-2" />
            টেস্ট ডিটেইলসে ফিরে যান
          </Link>

        <div className="grid gap-8">
          <Card className="border-primary/20 bg-card/60 backdrop-blur-md overflow-hidden rounded-[2rem] shadow-2xl">
            <CardHeader className="p-8 pb-4">
              <Badge className="w-fit mb-4">{testDetails.test_type === 'practice' ? 'প্র্যাকটিস মেম্বারশিপ' : 'মক টেস্ট'}</Badge>
              <CardTitle className="text-3xl font-black">{testDetails.title}</CardTitle>
              <CardDescription className="text-base font-medium">
                {testDetails.test_type === 'practice' ? '১ বছরের জন্য আনলিমিটেড অ্যাক্সেস' : 'একবার পরীক্ষার দেওয়ার সুযোগ'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="flex items-center justify-between p-6 rounded-2xl bg-primary/5 border border-primary/10 mb-8">
                <div>
                  <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider mb-1">প্রাইস</p>
                  <p className="text-4xl font-black text-primary">৳{testDetails.price.toFixed(0)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider mb-1">মেয়াদকাল</p>
                  <p className="font-bold flex items-center gap-2 justify-end">
                    {testDetails.test_type === 'practice' ? (
                      <><Calendar className="h-4 w-4" /> ৩৬৫ দিন</>
                    ) : (
                      <><Clock className="h-4 w-4" /> এককালীন</>
                    )}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-secondary/30 border border-border/50 flex items-center gap-4 group">
                  <div className="h-12 w-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-emerald-600/20">
                    RUP
                  </div>
                  <div>
                    <p className="font-black">রুপান্তর পে</p>
                    <p className="text-xs text-muted-foreground font-medium">বিকাশ, নগদ, রকেট এবং অন্যান্য কার্ড</p>
                  </div>
                </div>

                <Button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  size="lg"
                  className="w-full h-16 text-xl font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                      লোডিং হচ্ছে...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-3 h-6 w-6" />
                      পেমেন্ট করুন
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span>রুপান্তর পে দ্বারা সুরক্ষিত</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 rounded-3xl bg-card/40 border border-border/50 text-center flex flex-col items-center">
              <ShieldCheck className="h-8 w-8 mb-3 text-primary" />
              <p className="text-sm font-black">নিরাপদ পেমেন্ট</p>
            </div>
            <div className="p-6 rounded-3xl bg-card/40 border border-border/50 text-center flex flex-col items-center">
              <CheckCircle2 className="h-8 w-8 mb-3 text-primary" />
              <p className="text-sm font-black">তাৎক্ষণিক অ্যাক্সেস</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
