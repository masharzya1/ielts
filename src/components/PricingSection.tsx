"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  ShieldCheck,
  BookOpen,
  ChevronRight,
  Loader2,
  Target,
  Sparkles,
  Calendar,
  Clock,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { format, isFuture } from "date-fns";
import { bn } from "date-fns/locale";

interface MockTest {
  id: string;
  title: string;
  price: number;
  is_free: boolean;
  scheduled_at: string;
  duration_minutes: number;
}

export default function PricingSection() {
  const [upcomingMocks, setUpcomingMocks] = useState<MockTest[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    async function fetchData() {
      const supabase = createClient();
      
      const { data: mocks } = await supabase
        .from("mock_tests")
        .select("id, title, price, is_free, scheduled_at, duration_minutes")
        .eq("test_type", "mock")
        .eq("is_published", true)
        .order("scheduled_at", { ascending: true });
      
      const upcoming = (mocks || []).filter((test: MockTest) => 
        isFuture(new Date(test.scheduled_at))
      ).slice(0, 3);
      
      setUpcomingMocks(upcoming);
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <section id="pricing" className="relative py-24 md:py-32 border-t border-border overflow-hidden">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  return (
    <section id="pricing" className="relative py-24 md:py-32 border-t border-border overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-30"></div>
      
      <div className="container relative z-10 mx-auto px-4 max-w-6xl">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-1 text-primary border-primary/20 bg-primary/5">
            সাশ্রয়ী প্রাইসিং
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
            আপনার <span className="gradient-text">সফলতার প্রস্তুতি</span> শুরু করুন
          </h2>
          <p className="text-lg text-muted-foreground">
            আপনার প্রয়োজন অনুযায়ী মক টেস্ট কিনুন অথবা কাস্টম সাবস্ক্রিপশন তৈরি করুন।
          </p>
        </div>

        {/* Mock Test Section */}
        <div className="mb-20">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-12 w-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-black">লাইভ মক টেস্ট</h3>
              <p className="text-sm text-muted-foreground">নির্ধারিত সময়ে আসল পরীক্ষার মতো পরিবেশে টেস্ট দিন</p>
            </div>
          </div>

          {upcomingMocks.length > 0 ? (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingMocks.map((test) => (
                  <Card key={test.id} className="group border-orange-500/20 bg-orange-500/[0.03] hover:bg-orange-500/[0.08] p-6 hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-500 hover:translate-y-[-8px] relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-black px-4 py-1.5 rounded-bl-xl shadow-lg tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300">LIVE MOCK</div>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 rounded-lg bg-orange-500/10">
                        <Calendar className="h-4 w-4 text-orange-500" />
                      </div>
                      <span className="text-sm font-black text-orange-500">
                        {format(new Date(test.scheduled_at), "d MMMM, yyyy", { locale: bn })}
                      </span>
                    </div>
                    
                    <h4 className="font-black text-xl mb-3 leading-tight line-clamp-2 group-hover:text-orange-600 transition-colors">{test.title}</h4>
                    
                    <div className="flex items-center gap-4 text-[11px] font-bold text-muted-foreground mb-6">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-orange-400" />
                        <span>{format(new Date(test.scheduled_at), "h:mm a", { locale: bn })}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Target className="h-3.5 w-3.5 text-orange-400" />
                        <span>{test.duration_minutes || 180} মিনিট</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-5 border-t border-orange-500/10 mt-auto">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">রেজিস্ট্রেশন ফি</span>
                        {test.is_free ? (
                          <span className="text-2xl font-black text-green-500">ফ্রি</span>
                        ) : (
                          <span className="text-3xl font-black text-orange-500">৳{test.price}</span>
                        )}
                      </div>
                      <Button asChild className="h-11 px-6 font-black rounded-xl bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20 hover:scale-105 transition-all">
                        <Link href={`/mock/pre-book`}>
                          বুক করুন
                        </Link>
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
              <div className="text-center mt-12">
                <Button asChild variant="outline" className="h-14 px-10 text-base font-black rounded-2xl border-orange-500/20 hover:bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:border-orange-500/40 transition-all">
                  <Link href="/mock/pre-book" className="flex items-center gap-2">সব মক টেস্ট দেখুন <ArrowRight className="h-5 w-5" /></Link>
                </Button>
              </div>
            </>
          ) : (
            <Card className="p-8 text-center border-orange-500/20 bg-orange-500/[0.03]">
              <Target className="h-12 w-12 text-orange-500/30 mx-auto mb-4" />
              <h4 className="font-bold text-lg mb-2">শীঘ্রই আসছে নতুন মক টেস্ট</h4>
              <p className="text-sm text-muted-foreground mb-4">
                আমাদের পরবর্তী লাইভ মক টেস্টের জন্য অপেক্ষা করুন।
              </p>
              <Button asChild variant="outline" className="h-10 px-5 font-bold rounded-xl border-orange-500/20 hover:bg-orange-500/10 text-orange-600 dark:text-orange-400">
                <Link href="/mock/pre-book">মক টেস্ট পেজ দেখুন</Link>
              </Button>
            </Card>
          )}
        </div>

        {/* Custom Subscription Section */}
        <div>
          <div className="flex items-center gap-4 mb-8">
            <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-black">কাস্টম সাবস্ক্রিপশন</h3>
              <p className="text-sm text-muted-foreground">আপনার প্রয়োজন অনুযায়ী প্যাকেজ তৈরি করুন</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="group border-border/40 bg-card/40 backdrop-blur-sm p-8 flex flex-col hover:border-primary/40 transition-all duration-500 hover:translate-y-[-8px]">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-black transition-all">
                <BookOpen className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-black mb-2">প্র্যাকটিস মেম্বারশিপ</h3>
              <p className="text-muted-foreground mb-8 font-medium">Listening, Reading, Writing মডিউলে আনলিমিটেড অ্যাক্সেস।</p>
              <div className="mt-auto space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <span>সকল প্র্যাকটিস টেস্ট অ্যাক্সেস</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <span>রেগুলার কন্টেন্ট আপডেট</span>
                  </div>
                </div>
                <div>
                  <Button asChild className="w-full h-14 font-black rounded-xl shadow-lg shadow-primary/10">
                    <Link href="/custom-subscription">পছন্দমতো প্যাকেজ সাজিয়ে নিন <ChevronRight className="ml-2 h-5 w-5" /></Link>
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="group border-border/40 bg-card/40 backdrop-blur-sm p-8 flex flex-col hover:border-purple-500/40 transition-all duration-500 hover:translate-y-[-8px]">
              <div className="h-14 w-14 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-6 group-hover:bg-purple-500 group-hover:text-white transition-all">
                <Sparkles className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-black mb-2">AI ইভ্যালুয়েশন + ভোকাব</h3>
              <p className="text-muted-foreground mb-8 font-medium">Writing এর জন্য AI ফিডব্যাক এবং প্রিমিয়াম ভোকাবুলারি।</p>
              <div className="mt-auto space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-purple-500" />
                    <span>AI Writing রিভিউ ও ফিডব্যাক</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-purple-500" />
                    <span>৫০০+ প্রিমিয়াম শব্দ ও কন্টেন্ট</span>
                  </div>
                </div>
                <div>
                  <Button asChild variant="outline" className="w-full h-14 font-black rounded-xl border-purple-500/20 hover:bg-purple-500/10 hover:text-purple-500 hover:border-purple-500/40">
                    <Link href="/custom-subscription">পছন্দমতো প্যাকেজ সাজিয়ে নিন <ChevronRight className="ml-2 h-5 w-5" /></Link>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="mt-20 flex flex-col items-center gap-8">
          <div className="flex flex-wrap justify-center gap-8 text-sm font-medium text-muted-foreground/80">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary/70" />
              <span>নিরাপদ রুপান্তর পে</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary/70" />
              <span>তাৎক্ষণিক অ্যাক্সেস</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
