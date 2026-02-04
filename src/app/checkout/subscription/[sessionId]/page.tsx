"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, ShieldCheck, ArrowLeft, CheckCircle2, ShoppingCart, Tag } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function SubscriptionCheckoutPage() {
  const { sessionId } = useParams();
  const router = useRouter();
  const supabase = createClient();
  
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [user, setUser] = useState<any>(null);

    useEffect(() => {
      async function initCheckout() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push(`/login?redirectTo=${encodeURIComponent(`/checkout/subscription/${sessionId}`)}`);
          return;
        }
      setUser(user);

      try {
        const { data, error } = await supabase
          .from("checkout_sessions")
          .select("*")
          .eq("id", sessionId)
          .eq("user_id", user.id)
          .eq("status", "pending")
          .maybeSingle();

        if (error || !data) throw new Error("Session not found or expired");
        setSession(data);
      } catch (err: any) {
        toast.error(err.message);
        router.push("/custom-subscription");
      } finally {
        setLoading(false);
      }
    }

    initCheckout();
  }, [sessionId, router, supabase]);

  const subtotal = session?.cart_data?.items?.reduce((sum: number, item: any) => sum + item.price, 0) || 0;
  const discount = session?.cart_data?.coupon ? (subtotal * session.cart_data.coupon.discount) / 100 : 0;
  const total = subtotal - discount;

  const handleFreeCheckout = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/payment/complete-free-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to complete free checkout");

      toast.success("সাবস্ক্রিপশন সফলভাবে সক্রিয় হয়েছে!");
      router.push("/payment/success");
    } catch (err: any) {
      toast.error(err.message);
      setIsProcessing(false);
    }
  };

  const handlePaidCheckout = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/payment/rupantor-init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          sessionId: sessionId,
          amount: total,
          customerName: user.user_metadata?.full_name || user.email?.split('@')[0] || "Customer",
          customerEmail: user.email,
          type: "subscription"
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to initialize payment");

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

  return (
    <div className="min-h-screen pt-24 pb-16 relative font-hind-siliguri">
      <div className="absolute inset-0 grid-bg opacity-30"></div>
      
      <div className="container relative z-10 mx-auto px-4 max-w-2xl">
        <Link href="/custom-subscription" className="inline-flex items-center text-primary hover:underline mb-8 font-medium">
          <ArrowLeft className="h-4 w-4 mr-2" />
          কার্টে ফিরে যান
        </Link>

        <Card className="border-primary/20 bg-card/60 backdrop-blur-md overflow-hidden rounded-[2rem] shadow-2xl">
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center gap-3 mb-4">
                <Badge>কাস্টম সাবস্ক্রিপশন</Badge>
                {session.cart_data.coupon && (
                    <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/5">
                        <Tag className="h-3 w-3 mr-1" />
                        {session.cart_data.coupon.code} Applied
                    </Badge>
                )}
            </div>
            <CardTitle className="text-3xl font-black">অর্ডার সামারি</CardTitle>
            <CardDescription className="text-base font-medium">
              আপনার নির্বাচিত আইটেমগুলো চেকআউট করুন
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8 pt-0">
            <div className="space-y-3 mb-8">
              {session.cart_data.items.map((item: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-4 rounded-2xl bg-secondary/20 border border-border/50">
                  <div>
                    <p className="font-bold">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.duration_days} দিনের জন্য</p>
                  </div>
                  <p className="font-bold">৳{item.price}</p>
                </div>
              ))}
            </div>

            <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 mb-8 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground font-bold">সাবটোটাল</span>
                <span className="font-bold">৳{subtotal}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-500 font-bold">
                  <span>ছাড় ({session.cart_data.coupon.discount}%)</span>
                  <span>-৳{discount.toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-primary/10">
                <p className="text-sm text-muted-foreground font-black uppercase tracking-wider">মোট প্রদেয়</p>
                <p className="text-4xl font-black text-primary">৳{total.toFixed(0)}</p>
              </div>
            </div>

            <div className="space-y-6">
              {total === 0 ? (
                <Button
                  onClick={handleFreeCheckout}
                  disabled={isProcessing}
                  size="lg"
                  className="w-full h-16 text-xl font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all bg-green-600 hover:bg-green-700 text-white"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                      অ্যাক্টিভেট হচ্ছে...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-3 h-6 w-6" />
                      ফ্রি অ্যাক্টিভেট করুন
                    </>
                  )}
                </Button>
              ) : (
                <>
                  <div className="p-5 rounded-2xl bg-secondary/30 border border-border/50 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-emerald-600/20">
                      RUP
                    </div>
                    <div>
                      <p className="font-black">রুপান্তর পে</p>
                      <p className="text-xs text-muted-foreground font-medium">বিকাশ, নগদ, রকেট এবং কার্ড</p>
                    </div>
                  </div>

                  <Button
                    onClick={handlePaidCheckout}
                    disabled={isProcessing}
                    size="lg"
                    className="w-full h-16 text-xl font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                        প্রসেসিং হচ্ছে...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-3 h-6 w-6" />
                        পেমেন্ট সম্পন্ন করুন
                      </>
                    )}
                  </Button>
                </>
              )}

              <div className="flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>{total === 0 ? "সম্পূর্ণ নিরাপদ অ্যাক্টিভেশন" : "রুপান্তর পে দ্বারা সুরক্ষিত"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
