"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  Target, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles,
  Zap,
  ShieldCheck,
  CreditCard,
  Percent
} from "lucide-react";
import Link from "next/link";
import { format, addMinutes } from "date-fns";
import { bn } from "date-fns/locale";
import gsap from "gsap";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function MockPreBookPage() {
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [user, setUser] = useState<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
  
    useEffect(() => {
      const controller = new AbortController();
      async function init() {
        const supabase = createClient();
        // Use getSession to avoid network hang and abort if needed
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (!controller.signal.aborted) {
          setUser(session?.user || null);
          setLoading(false);
        }
      }
      init();
      return () => controller.abort();
    }, []);

    useEffect(() => {
      if (!loading && containerRef.current) {
        gsap.from(".animate-up", {
          y: 20,
          opacity: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out"
        });
      }
    }, [loading]);
  
    const handlePreBook = async () => {
      if (!user) {
        toast.error("অনুগ্রহ করে আগে লগইন করুন");
        router.push("/login?redirect=/mock/pre-book");
        return;
      }
  
      setIsProcessing(true);
      try {
        const response = await fetch("/api/payment/rupantor-init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: 50,
            customerName: user.user_metadata?.full_name || user.email.split('@')[0],
            customerEmail: user.email,
            type: "prebook",
            testId: null // Next upcoming mock
          }),
        });
  
        const data = await response.json();
        if (data.paymentUrl) {
          window.location.href = data.paymentUrl;
        } else {
          throw new Error(data.error || "পেমেন্ট শুরু করতে ব্যর্থ হয়েছে");
        }
      } catch (error: any) {
        toast.error(error.message);
        setIsProcessing(false);
      }
    };
  
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
        </div>
      );
    }
  
    return (
      <div ref={containerRef} className="min-h-screen bg-background font-hind-siliguri pb-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none"></div>
  
        <div className="container max-w-3xl mx-auto px-4 pt-32 relative z-10">
          <div className="text-center mb-12">
            <div className="animate-up inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-primary/20">
              <Sparkles className="h-3 w-3" />
              <span>Special Offer</span>
            </div>
            <h1 className="animate-up text-3xl md:text-5xl font-black mb-6 tracking-tight leading-tight">
              শীঘ্রই নতুন কোনো মক টেস্ট <br /><span className="text-primary italic">এখানে আসবে</span>
            </h1>
            <p className="animate-up text-base md:text-lg text-muted-foreground font-medium max-w-xl mx-auto leading-relaxed">
              পরবর্তী মক টেস্টের সিডিউল শীঘ্রই জানানো হবে। এখন প্রি-বুক করলে মক টেস্টের মূল প্রাইস থেকে সরাসরি ১০% ডিসকাউন্ট পাবেন।
            </p>
          </div>
  
          <div className="animate-up max-w-xl mx-auto">
            <div className="p-8 md:p-10 rounded-[2.5rem] bg-card border border-border/50 shadow-2xl shadow-black/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Percent className="h-32 w-32 rotate-12" />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-10">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <Zap className="h-7 w-7" />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Pre-booking Fee</p>
                    <div className="text-4xl font-black tracking-tighter text-primary">৳৫০</div>
                  </div>
                </div>

                <div className="space-y-5 mb-10">
                  <h3 className="text-xl font-bold mb-4">প্রি-বুক করার সুবিধাসমূহ:</h3>
                  {[
                    "পরবর্তী মক টেস্টের মূল মূল্যের উপর ১০% সরাসরি ডিসকাউন্ট",
                    "আপনার প্রি-বুক করা ৫০ টাকা পেমেন্ট থেকে অ্যাডজাস্ট হবে",
                    "সবার আগে মক টেস্টের ইমেইল নোটিফিকেশন পাবেন",
                    "লিমিটেড সিটের মধ্যে আপনার জায়গা নিশ্চিত থাকবে",
                    "সরাসরি ইমেইলে ডিসকাউন্ট পেমেন্ট লিংক পাবেন"
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <p className="text-sm font-bold text-muted-foreground leading-snug">{item}</p>
                    </div>
                  ))}
                </div>

                <Button 
                  onClick={handlePreBook} 
                  disabled={isProcessing}
                  className="w-full h-16 text-base font-black rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {isProcessing ? "প্রসেসিং হচ্ছে..." : "এখনই প্রি-বুক করুন (৳৫০)"}
                  <ArrowRight className="ml-3 h-5 w-5" />
                </Button>
                
                <p className="text-[10px] text-center mt-6 font-bold text-muted-foreground/60 flex items-center justify-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5" /> ১০০% নিরাপদ ও সুরক্ষিত পেমেন্ট
                </p>
              </div>
            </div>
          </div>

          <div className="animate-up mt-16 text-center">
            <p className="text-xs font-bold text-muted-foreground">
              আপনার কি কোনো প্রশ্ন আছে? আমাদের <Link href="/contact" className="text-primary hover:underline">সাপোর্ট টিমে</Link> যোগাযোগ করুন।
            </p>
          </div>
        </div>
      </div>
    );
  }
