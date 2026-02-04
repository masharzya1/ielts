"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, CreditCard, ShieldCheck, ArrowLeft, CheckCircle2, Clock, Tag, X, Sparkles } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function MockCheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const [testId, setTestId] = useState<string>("");
  const router = useRouter();
  const supabase = createClient();
  
  useEffect(() => {
    async function unwrapParams() {
      const p = await params;
      setTestId(p.id);
    }
    unwrapParams();
  }, [params]);

  const [mockTest, setMockTest] = useState<{ id: string; title: string; price: number; is_free: boolean; slug: string } | null>(null);
  const [isPrebooking, setIsPrebooking] = useState(false);
  const [hasPrebooked, setHasPrebooked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount_percent: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!testId) return;
    async function initCheckout() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/login?redirect=/checkout/mock/${testId}`);
        return;
      }
      setUser(user);

      try {
        const { data: mock, error: mockError } = await supabase
          .from("mock_tests")
          .select("id, title, price, is_free, slug")
          .eq("id", testId)
          .maybeSingle();

        if (mockError || !mock) throw new Error("Mock test not found");
        setMockTest(mock);

        // Check if user has an unapplied pre-booking
        const { data: preBooking } = await supabase
          .from("pre_bookings")
          .select("id, amount_paid")
          .eq("user_id", user.id)
          .eq("payment_status", "completed")
          .eq("is_applied", false)
          .maybeSingle();
        
        if (preBooking) {
          setHasPrebooked(true);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    initCheckout();
  }, [testId, router]);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setCouponLoading(true);
    setCouponError(null);
    
    try {
      const { data: coupon, error: couponErr } = await supabase
        .from("coupons")
        .select("code, discount_percent, valid_until, max_uses, used_count")
        .eq("code", couponCode.trim().toUpperCase())
        .eq("is_active", true)
        .maybeSingle();
      
      if (couponErr || !coupon) {
        setCouponError("কুপন কোড সঠিক নয়");
        return;
      }
      
      if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
        setCouponError("এই কুপনের মেয়াদ শেষ হয়ে গেছে");
        return;
      }
      
      if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
        setCouponError("এই কুপন ব্যবহারের সীমা শেষ");
        return;
      }
      
      setAppliedCoupon({ code: coupon.code, discount_percent: coupon.discount_percent });
      setCouponCode("");
      toast.success(`${coupon.discount_percent}% ডিসকাউন্ট প্রয়োগ হয়েছে!`);
    } catch {
      setCouponError("কুপন যাচাই করতে সমস্যা হয়েছে");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  const finalPrice = useMemo(() => {
    if (!mockTest) return 0;
    let price = mockTest.price;
    
    if (hasPrebooked) {
      // Apply 10% discount + 50 BDT deduction
      price = (price * 0.9) - 50;
    }

    if (appliedCoupon) {
      price = price * (1 - appliedCoupon.discount_percent / 100);
    }

    return Math.max(0, price);
  }, [mockTest, hasPrebooked, appliedCoupon]);

  const handlePayment = async () => {
    if (!mockTest || !user) return;
    
    setIsProcessing(true);
    try {
      if (finalPrice === 0) {
        const res = await fetch("/api/payment/complete-free-mock-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            testId: mockTest.id,
            couponCode: appliedCoupon?.code,
            hasPrebooked: hasPrebooked
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to complete checkout");

        toast.success("অ্যাক্টিভেশন সফল হয়েছে!");
        router.push("/payment/success");
        return;
      }

      const res = await fetch("/api/payment/rupantor-init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          testId: mockTest.id,
          amount: finalPrice,
          customerName: user.user_metadata?.full_name || user.email?.split('@')[0] || "Customer",
          customerEmail: user.email,
          couponCode: appliedCoupon?.code,
          hasPrebooked: hasPrebooked
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

  if (error || !mockTest) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-red-500/20 bg-red-500/5">
          <CardHeader className="text-center">
            <CardTitle className="text-red-500">Error</CardTitle>
            <CardDescription>{error || "Mock test not found"}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <Button asChild variant="outline">
              <Link href="/mock">Back to Mock Tests</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 relative font-hind-siliguri">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none"></div>
      
      <div className="container relative z-10 mx-auto px-4 max-w-2xl">
        <Link href="/mock" className="inline-flex items-center text-primary hover:underline mb-8 font-medium">
          <ArrowLeft className="h-4 w-4 mr-2" />
          মক টেস্টে ফিরে যান
        </Link>

        <div className="grid gap-8">
          <Card className="border-primary/20 bg-card/60 backdrop-blur-md overflow-hidden rounded-[2.5rem] shadow-2xl">
            <CardHeader className="p-8 pb-4">
              <Badge className="w-fit mb-4">লাইভ মক টেস্ট</Badge>
              <CardTitle className="text-3xl font-black">{mockTest.title}</CardTitle>
              <CardDescription className="text-base font-medium">
                পরীক্ষার জন্য রেজিস্ট্রেশন সম্পন্ন করুন
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              {hasPrebooked && (
                <div className="mb-6 p-6 rounded-2xl bg-primary/10 border border-primary/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                    <Sparkles className="h-12 w-12" />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-black text-primary">প্রি-বুকিং সুবিধা পাওয়া গেছে!</p>
                      <p className="text-xs text-muted-foreground font-bold">১০% ডিসকাউন্ট + পূর্বের ৫০ টাকা অ্যাডজাস্ট করা হয়েছে।</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-6 rounded-2xl bg-secondary/30 border border-border/50 mb-6">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1">মূল্য</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-black text-primary">৳{finalPrice.toFixed(0)}</p>
                    {(hasPrebooked || appliedCoupon) && (
                      <p className="text-sm text-muted-foreground line-through">৳{mockTest.price}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1">টাইপ</p>
                  <p className="font-bold flex items-center gap-2 justify-end text-sm">
                    <Clock className="h-4 w-4" /> এককালীন
                  </p>
                </div>
              </div>

              {!appliedCoupon && (
                <div className="mb-8">
                  <div className="flex gap-2">
                    <Input
                      placeholder="কুপন কোড (যদি থাকে)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="h-12 rounded-xl font-bold uppercase"
                      onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                    />
                    <Button 
                      onClick={applyCoupon} 
                      disabled={couponLoading || !couponCode.trim()}
                      className="h-12 px-6 rounded-xl font-black"
                    >
                      {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "প্রয়োগ"}
                    </Button>
                  </div>
                  {couponError && (
                    <p className="text-xs text-red-500 mt-2 font-bold">{couponError}</p>
                  )}
                </div>
              )}

              {appliedCoupon && (
                <div className="mb-8 p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Tag className="h-5 w-5 text-green-500" />
                    <p className="font-black text-green-600 uppercase">{appliedCoupon.code} প্রয়োগ হয়েছে</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={removeCoupon} className="h-8 w-8 p-0 hover:bg-red-500/10">
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              )}

              <Button
                onClick={handlePayment}
                disabled={isProcessing}
                size="lg"
                className="w-full h-16 text-lg font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all bg-primary text-primary-foreground"
              >
                {isProcessing ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    <CreditCard className="mr-3 h-6 w-6" />
                    {finalPrice === 0 ? "ফ্রি অ্যাক্টিভেট করুন" : `৳${finalPrice.toFixed(0)} পেমেন্ট করুন`}
                  </>
                )}
              </Button>

              <p className="text-[10px] text-center mt-6 font-bold text-muted-foreground/60 flex items-center justify-center gap-2 uppercase tracking-widest">
                <ShieldCheck className="h-4 w-4" /> ১০০% নিরাপদ ও সুরক্ষিত পেমেন্ট
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
