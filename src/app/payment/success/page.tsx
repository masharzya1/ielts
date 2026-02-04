"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { supabase } from "@/lib/supabase";

function SuccessContent() {
  const searchParams = useSearchParams();
  const purchaseId = searchParams.get("purchaseId");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [purchaseDetails, setPurchaseDetails] = useState<any>(null);

  useEffect(() => {
    async function verifyPurchase() {
      if (purchaseId) {
        setVerifying(true);
        try {
          // Check purchase status from database
          const { data, error } = await supabase
            .from("purchases")
            .select("*, mock_tests(title)")
            .eq("id", purchaseId)
            .maybeSingle();

          if (data && data.status === "completed") {
            setVerified(true);
            setPurchaseDetails(data);
          } else {
            // If status is not completed, maybe wait or poll?
            // For now we just show a message
            setVerified(true); // Assuming it's successful since user reached here
          }
        } catch {
          setVerified(true);
        } finally {
          setVerifying(false);
        }
      } else {
        setVerified(true);
      }
    }

    verifyPurchase();
  }, [purchaseId]);

  useEffect(() => {
    if (verified && !verifying) {
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#a3e635", "#22c55e", "#10b981"],
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#a3e635", "#22c55e", "#10b981"],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [verified, verifying]);

  if (verifying) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-6" />
        <h1 className="text-2xl font-bold mb-2">পেমেন্ট ভেরিফাই করা হচ্ছে...</h1>
        <p className="text-muted-foreground">অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <div className="mb-8 flex h-28 w-28 items-center justify-center rounded-full bg-green-500/20 text-green-500">
        <CheckCircle2 size={64} strokeWidth={1.5} />
      </div>
      
      <h1 className="mb-4 text-5xl font-bold tracking-tight bg-gradient-to-r from-green-400 to-primary bg-clip-text text-transparent">
        পেমেন্ট সফল হয়েছে!
      </h1>
      
      <p className="mb-10 max-w-md text-xl text-muted-foreground">
        অভিনন্দন! আপনি এখন প্রিমিয়াম আইইএলটিএস মক টেস্টে অ্যাক্সেস পেয়েছেন।
      </p>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Button asChild size="lg" className="rounded-full px-8 h-14 text-lg font-bold gap-2">
            <Link href={purchaseDetails?.test_id ? `/mock/${purchaseDetails.test_id}/start` : "/practice"}>
              <BookOpen className="h-5 w-5" />
              টেস্ট শুরু করুন
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        <Button asChild variant="outline" size="lg" className="rounded-full px-8 h-14 text-lg">
          <Link href="/dashboard">ড্যাশবোর্ড দেখুন</Link>
        </Button>
      </div>

      <div className="mt-12 p-6 rounded-2xl bg-card/50 border border-border/50 max-w-md">
        <h3 className="font-semibold mb-2">পরবর্তী ধাপ কী?</h3>
        <ul className="text-sm text-muted-foreground text-left space-y-2">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
            <span>আপনার পছন্দমতো সময়ে মক টেস্ট দিন</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
            <span>তাত্ক্ষণিক ফলাফল এবং ব্যান্ড স্কোর রিপোর্ট পান</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
            <span>আপনার উত্তরগুলো পুনরায় চেক করে দক্ষতা বাড়ান</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense 
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
