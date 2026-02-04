"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Loader2, 
  CreditCard, 
  ShieldCheck, 
  ArrowLeft,
  Smartphone,
  Globe,
  Wallet
} from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { toast } from "sonner";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const testId = searchParams.get("testId");
  const planId = searchParams.get("planId");

    const [loading, setLoading] = useState(true);
    const [itemDetails, setItemDetails] = useState<any>(null);
    const [selectedGateway, setSelectedGateway] = useState<string>("rupantor_pay");
    const [processing, setProcessing] = useState(false);
    const [user, setUser] = useState<any>(null);
  
    useEffect(() => {
      async function fetchData() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push(`/login?redirectTo=${encodeURIComponent(`/checkout?testId=${testId}`)}`);
          return;
        }
        setUser(user);
  
        // Fetch Item Details
        if (testId) {
          const { data: test } = await supabase
            .from("mock_tests")
            .select("*")
            .eq("id", testId)
            .maybeSingle();
          if (test) setItemDetails({ title: test.title, price: test.price, type: "test", id: test.id });
        }
  
        setLoading(false);
      }
      fetchData();
    }, [testId, router]);
  
    const handlePayment = async () => {
      setProcessing(true);
      
      try {
        const res = await fetch("/api/payment/rupantor-init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            testId: itemDetails.id,
            amount: itemDetails.price,
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
        setProcessing(false);
      }
    };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Preparing checkout...</p>
        </div>
      </div>
    );
  }

  if (!itemDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">আইটেম পাওয়া যায়নি</h2>
          <Button asChild><Link href="/pricing">প্রাইসিং-এ ফিরে যান</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link href="/pricing" className="inline-flex items-center text-primary hover:underline mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            ফিরে যান
          </Link>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Order Summary */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">অর্ডার সামারি</h2>
              <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-bold">{itemDetails.title}</h3>
                      <p className="text-sm text-muted-foreground">{itemDetails.type === "plan" ? "সাবস্ক্রিপশন প্ল্যান" : "প্রিমিয়াম মক টেস্ট"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">৳{Number(itemDetails.price).toFixed(0)}</p>
                    </div>
                  </div>
                  
                  <div className="border-t border-border pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">সাবটোটাল</span>
                      <span>৳{Number(itemDetails.price).toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">ভ্যাট (০%)</span>
                      <span>৳০</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold mt-4 pt-4 border-t border-border">
                      <span>মোট</span>
                      <span className="text-primary">৳{Number(itemDetails.price).toFixed(0)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-6 w-6 text-primary shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold">নিরাপদ পেমেন্ট</h4>
                    <p className="text-sm text-muted-foreground">আপনার পেমেন্ট তথ্য এনক্রিপ্ট করা এবং সম্পূর্ণ নিরাপদ।</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">পেমেন্ট মেথড</h2>
              <div className="grid gap-4">
                <div className="p-4 rounded-xl border-2 border-primary bg-primary/5 ring-1 ring-primary/20 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                      RUP
                    </div>
                    <div>
                      <p className="font-bold">Rupantor Pay</p>
                      <p className="text-xs text-muted-foreground">বিকাশ, রকেট, নগদ, কার্ড</p>
                    </div>
                  </div>
                  <div className="h-5 w-5 rounded-full border-2 border-primary flex items-center justify-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                  </div>
                </div>
              </div>

              <Button 
                onClick={handlePayment} 
                disabled={processing} 
                size="lg" 
                className="w-full h-14 text-lg font-bold mt-8 shadow-lg shadow-primary/20"
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    প্রসেসিং হচ্ছে...
                  </>
                ) : (
                  <>
                    পেমেন্ট সম্পন্ন করুন - ৳{Number(itemDetails.price).toFixed(0)}
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-4">
                <ShieldCheck className="h-3 w-3" />
                <span>Secured by Rupantor Pay. SSL এনক্রিপ্টেড পেমেন্ট গেটওয়ে।</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
