"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, CheckCircle2, ArrowLeft, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { bn } from "date-fns/locale";
import { toast } from "sonner";

function PreBookContent() {
  const searchParams = useSearchParams();
  const testId = searchParams.get("testId");
  const router = useRouter();
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (!user) {
        setLoading(false);
        return;
      }

      if (testId) {
        const { data: testData } = await supabase
          .from("mock_tests")
          .select("*")
          .eq("id", testId)
          .maybeSingle();
        
        setTest(testData);

        if (testData) {
          const { data: existing } = await supabase
            .from("pre_bookings")
            .select("*")
            .eq("user_id", user.id)
            .eq("test_id", testId)
            .maybeSingle();
          
          if (existing) setIsBooked(true);
        }
      }
      setLoading(false);
    }
    loadData();
  }, [testId]);

  const handlePreBook = async () => {
    if (!user) {
      router.push(`/login?redirectTo=/pre-book?testId=${testId}`);
      return;
    }

    setBooking(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("pre_bookings")
      .insert({
        user_id: user.id,
        test_id: testId
      });

    if (error) {
      if (error.code === '23505') {
        toast.error("আপনি ইতিমধ্যে প্রি-বুক করেছেন");
        setIsBooked(true);
      } else {
        toast.error("প্রি-বুক করতে সমস্যা হয়েছে");
      }
    } else {
      toast.success("প্রি-বুক সফল হয়েছে!");
      setIsBooked(true);
    }
    setBooking(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-hind-siliguri">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 font-hind-siliguri text-center">
        <h1 className="text-2xl font-bold mb-4">মক টেস্ট পাওয়া যায়নি</h1>
        <Button asChild>
          <Link href="/">হোম পেজে ফিরে যান</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/5 py-12 px-4 font-hind-siliguri">
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" asChild className="mb-8 group">
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            পিছনে যান
          </Link>
        </Button>

        <div className="bg-card border border-border/50 rounded-3xl p-8 md:p-12 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
          
          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-600 text-[11px] font-black uppercase tracking-widest mb-6">
              <Calendar className="h-3.5 w-3.5" />
              মক টেস্ট প্রি-বুকিং
            </div>
            <h1 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">{test.title}</h1>
            <p className="text-muted-foreground font-medium">নির্ধারিত সময়ে পরীক্ষা শুরু হওয়ার আগে আপনাকে ইমেইল এবং নোটিফিকেশন পাঠানো হবে।</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-10">
            <div className="p-5 rounded-2xl bg-secondary/30 border border-border/20 text-center">
              <Calendar className="h-6 w-6 text-blue-500 mx-auto mb-2" />
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1">তারিখ</p>
              <p className="text-sm font-bold">{format(new Date(test.scheduled_at), "d MMMM, yyyy", { locale: bn })}</p>
            </div>
            <div className="p-5 rounded-2xl bg-secondary/30 border border-border/20 text-center">
              <Clock className="h-6 w-6 text-blue-500 mx-auto mb-2" />
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1">সময়</p>
              <p className="text-sm font-bold">{format(new Date(test.scheduled_at), "h:mm a", { locale: bn })}</p>
            </div>
          </div>

          {isBooked ? (
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 text-center">
              <div className="h-16 w-16 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/20">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold mb-2">আপনি সফলভাবে প্রি-বুক করেছেন!</h2>
              <p className="text-sm text-muted-foreground font-medium mb-6">পরীক্ষা শুরুর ২০ মিনিট আগে আপনাকে বিস্তারিত জানিয়ে দেওয়া হবে।</p>
              <Button asChild variant="outline" className="rounded-xl font-bold">
                <Link href="/">হোম পেজে ফিরে যান</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-6">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                  প্রি-বুকিং এর সুবিধা:
                </h3>
                <ul className="text-sm space-y-2 text-muted-foreground font-medium">
                  <li>• পরীক্ষা শুরুর আগে রিমাইন্ডার পাবেন।</li>
                  <li>• নিশ্চিত আসন পাবেন (লাইভ মক টেস্টের জন্য)।</li>
                  <li>• পরীক্ষার ফলাফল সবার আগে ইমেইলে পাবেন।</li>
                </ul>
              </div>
              
              <Button 
                onClick={handlePreBook} 
                disabled={booking}
                className="w-full h-14 text-base font-bold rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98]"
              >
                {booking ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    প্রসেসিং...
                  </>
                ) : (
                  <>
                    নিশ্চিত করুন
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </Button>
              <p className="text-[11px] text-center text-muted-foreground font-medium uppercase tracking-wider">
                কোনো চার্জ প্রযোজ্য নয় (ফ্রি প্রি-বুকিং)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PreBookPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <PreBookContent />
    </Suspense>
  );
}
