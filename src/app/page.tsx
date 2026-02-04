"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, CheckCircle2, Zap, Target, Award, Sparkles, Brain, ChevronDown, Calendar, Clock, X, Timer, Users, Trophy } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { addMinutes, isWithinInterval, format, differenceInSeconds } from "date-fns";
import { bn } from "date-fns/locale";
import { RecentActivityTicker } from "@/components/RecentActivityTicker";
import { SuccessStoriesCarousel } from "@/components/SuccessStoriesCarousel";

const PricingSection = dynamic(() => import("@/components/PricingSection"), {
  ssr: false,
  loading: () => <div className="py-24 flex items-center justify-center font-hind-siliguri">লোড হচ্ছে...</div>
});

const CountdownBox = ({ value, label }: { value: string | number, label: string }) => (
  <div className="flex flex-col items-center gap-1.5">
    <div className="flex gap-1 sm:gap-1.5">
      {String(value).padStart(2, '0').split('').map((digit, i) => (
        <div key={i} className="w-7 h-9 sm:w-9 sm:h-11 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center text-base sm:text-lg font-black text-primary shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]">
          {digit}
        </div>
      ))}
    </div>
    <span className="text-[8px] sm:text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none">{label}</span>
  </div>
);

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [liveTest, setLiveTest] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [presenceCount, setPresenceCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function fetchLiveTestData() {
      const supabase = createClient();
      
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);

      const { data: tests } = await supabase
        .from("mock_tests")
        .select("*")
        .eq("test_type", "mock")
        .eq("is_published", true)
        .order("scheduled_at", { ascending: true });

      if (tests) {
        const now = new Date();
        const availableTest = tests.find((test: any) => {
          const start = new Date(test.scheduled_at);
          const end = addMinutes(start, test.live_to_previous_minutes || 180);
          return now <= end;
        });

        if (availableTest) {
          const start = new Date(availableTest.scheduled_at);
          const joinWindowEnd = addMinutes(start, 3);
          const preStartWindowBegin = addMinutes(start, -5);
          
          const isJoinWindow = now >= start && now <= joinWindowEnd;
          const isPreStart = now >= preStartWindowBegin && now < start;
          const isUpcoming = now < preStartWindowBegin;
          const transferEnd = addMinutes(start, availableTest.live_to_previous_minutes || 180);
          const isLive = now >= start && now <= transferEnd;
          
          setLiveTest({ ...availableTest, isUpcoming, isPreStart, isJoinWindow, isLive });
          
          if (authUser) {
            const { data: registration } = await supabase
              .from("mock_registrations")
              .select("id")
              .eq("user_id", authUser.id)
              .eq("test_id", availableTest.id)
              .eq("status", "completed")
              .maybeSingle();
            setIsEnrolled(!!registration);
          }

          // Presence for live test
          const channel = supabase.channel(`mock_presence_${availableTest.id}`);
          channel.on("presence", { event: "sync" }, () => {
            setPresenceCount(Object.keys(channel.presenceState()).length);
          }).subscribe();
          return () => { channel.unsubscribe(); };
        } else {
          setLiveTest({ isComingSoon: true });
        }
      }
    }

    fetchLiveTestData();
    const refreshInterval = setInterval(fetchLiveTestData, 30000);
    return () => clearInterval(refreshInterval);
  }, []);

  const timeDisplay = useMemo(() => {
    if (!liveTest || liveTest.isComingSoon) return null;
    const start = new Date(liveTest.scheduled_at);
    if (liveTest.isLive && !liveTest.isUpcoming && !liveTest.isPreStart) {
      const diffSeconds = differenceInSeconds(currentTime, start);
      if (diffSeconds > 180) return null;
      const m = Math.floor((180 - diffSeconds) / 60);
      const s = (180 - diffSeconds) % 60;
      return (
        <div className="flex flex-col items-center">
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">জয়েন করার সময় বাকি</p>
          <div className="flex gap-2 items-center">
            <CountdownBox value={m} label="মিনিট" />
            <div className="text-primary/30 font-black text-xl mb-4">:</div>
            <CountdownBox value={s} label="সেকেন্ড" />
          </div>
        </div>
      );
    }
    const diff = differenceInSeconds(start, currentTime);
    if (diff <= 0) return <span className="text-sm font-bold text-primary animate-pulse">এখনই শুরু হচ্ছে...</span>;
    const d = Math.floor(diff / 86400), h = Math.floor((diff % 86400) / 3600), m = Math.floor((diff % 3600) / 60), s = diff % 60;
    return (
      <div className="flex gap-2">
        {d > 0 && <CountdownBox value={d} label="দিন" />}
        {(d > 0 || h > 0) && <CountdownBox value={h} label="ঘণ্টা" />}
        <CountdownBox value={m} label="মিনিট" />
        <CountdownBox value={s} label="সেকেন্ড" />
      </div>
    );
  }, [liveTest, currentTime]);

  const bannerConfig = useMemo(() => {
    if (!liveTest) return null;
    if (liveTest.isComingSoon) return { label: "শীঘ্রই আসছে", colorClass: "bg-primary", icon: <Zap />, showTimer: false, buttonText: "প্রি-বুক করুন", buttonHref: "/mock/pre-book", description: "পরবর্তী মক টেস্টের সিডিউল শীঘ্রই জানানো হবে।" };
    if (liveTest.isUpcoming) return { label: "আসন্ন মক টেস্ট", colorClass: "bg-primary", icon: <Calendar />, showTimer: true, buttonText: "রেজিস্ট্রেশন করুন", buttonHref: `/checkout/mock/${liveTest.id}`, description: "পরবর্তী মক টেস্টের জন্য সিট নিশ্চিত করুন।" };
    if (liveTest.isPreStart) return { label: "শুরু হতে বাকি", colorClass: "bg-orange-500", icon: <Timer />, showTimer: true, buttonText: isEnrolled ? "প্রস্তুত হোন" : "রেজিস্ট্রেশন করুন", buttonHref: isEnrolled ? "#" : `/checkout/mock/${liveTest.id}`, buttonDisabled: isEnrolled, description: isEnrolled ? "৫ মিনিটের কম সময় বাকি। প্রস্তুত হোন!" : "রেজিস্ট্রেশন করার শেষ সুযোগ।" };
    if (liveTest.isLive) {
      if (liveTest.isJoinWindow) return { label: "পরীক্ষা শুরু হয়েছে", colorClass: "bg-red-600", icon: <Clock />, showTimer: true, buttonText: isEnrolled ? "জয়েন করুন" : "রেজিস্ট্রেশন শেষ", buttonHref: isEnrolled ? `/mock/${liveTest.slug || liveTest.id}` : "/mock/pre-book", description: isEnrolled ? "৩ মিনিটের গ্রেস পিরিয়ড চলছে।" : "পরবর্তী টেস্টের জন্য প্রি-বুক করুন।" };
      return { label: "পরীক্ষা চলছে", colorClass: "bg-muted", icon: <Lock />, showTimer: false, buttonText: "পরবর্তী টেস্ট", buttonHref: "/mock/pre-book", description: "জয়েন করার সময় শেষ হয়ে গেছে।" };
    }
    return null;
  }, [liveTest, isEnrolled]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
      tl.from(".hero-badge", { y: -20, opacity: 0, duration: 0.4 })
        .from(".hero-title span", { y: 60, opacity: 0, duration: 0.6, stagger: 0.1 }, "-=0.2")
        .from(".hero-desc", { y: 20, opacity: 0, duration: 0.5 }, "-=0.3")
        .from(".hero-cta-btn", { scale: 0.9, opacity: 0, duration: 0.4 }, "-=0.2")
        .from(".live-mock-box", { y: 30, opacity: 0, duration: 0.6 }, "-=0.4");
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative overflow-hidden font-hind-siliguri">
      <section className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_50%,transparent_100%)]"></div>
          <div className="mouse-glow absolute top-0 left-0 w-[600px] h-[600px] rounded-full blur-[150px] opacity-0 dark:opacity-50 dark:bg-primary/15"></div>
        </div>

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 relative z-10 grid lg:grid-cols-12 gap-12 items-center py-20">
          <div className="lg:col-span-7 text-center lg:text-left">
            <div className="hero-badge inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-secondary/40 text-foreground/60 text-[11px] font-bold mb-10 border border-border/30 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="uppercase tracking-[0.15em]">বাংলাদেশের ১ নম্বর আইইএলটিএস প্ল্যাটফর্ম</span>
            </div>

            <h1 className="hero-title text-[2.5rem] sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black leading-[0.95] mb-8 tracking-[-0.04em]">
              <span className="block mb-2">আপনার বিদেশের স্বপ্ন</span>
              <span className="block gradient-text bg-clip-text text-transparent pb-3">এখন হাতের মুঠোয়</span>
            </h1>

            <p className="hero-desc text-base sm:text-lg md:text-xl text-muted-foreground/70 leading-relaxed mb-12 max-w-2xl font-medium tracking-tight">
              প্র্যাকটিস, লাইভ মক, ভোকাব ও এআই রাইটিং—সব এক প্ল্যাটফর্মে। ফ্রি সেকশন থেকে শুরু করুন, চাইলে প্রিমিয়াম নিন।
            </p>

            <div className="hero-cta-btn flex flex-col sm:flex-row gap-4 mb-14">
              <Button asChild size="lg" className="h-16 px-10 text-lg font-black rounded-2xl shadow-xl hover:scale-[1.02] transition-all group">
                <Link href="/free" className="flex items-center gap-3">
                  ফ্রি শুরু করুন
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-16 px-10 text-lg font-black rounded-2xl border-border/50">
                <Link href="/pricing">প্রাইসিং দেখুন</Link>
              </Button>
            </div>

            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-primary/10 border border-primary/20 backdrop-blur-xl">
                <Users className="h-5 w-5 text-primary animate-pulse" />
                <span className="text-sm font-black">{presenceCount > 0 ? presenceCount + 450 : 500}+ জন এখন লাইভ আছেন</span>
              </div>
              <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 backdrop-blur-xl">
                <Trophy className="h-5 w-5 text-orange-500" />
                <span className="text-sm font-black">১০০০+ সফল স্টুডেন্ট</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <RecentActivityTicker />
          </div>
        </div>

        {showBanner && liveTest && bannerConfig && (
          <div className="live-mock-box fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[94%] sm:w-full max-w-xl group">
            <div className={`relative overflow-hidden p-4 sm:p-5 rounded-[2rem] backdrop-blur-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] border transition-all duration-500 hover:scale-[1.01] ${
              liveTest.isLive ? 'bg-background/95 border-red-500/30' : 'bg-background/95 dark:bg-card/95 border-primary/20'
            }`}>
              <button onClick={() => setShowBanner(false)} className="absolute top-2 right-2 h-6 w-6 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all z-30"><X className="h-3 w-3" /></button>
              <div className="flex items-center gap-4 sm:gap-6 relative z-10">
                {bannerConfig.showTimer && <div className={`flex-shrink-0 p-3 sm:p-4 rounded-2xl border flex flex-col items-center justify-center min-w-[120px] ${liveTest.isLive ? 'bg-red-500/10 border-red-500/20' : 'bg-primary/[0.03] border-primary/10'}`}>{timeDisplay}</div>}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`h-1.5 w-1.5 rounded-full ${liveTest.isLive ? 'bg-red-500 animate-pulse' : 'bg-primary'}`}></div>
                    <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${liveTest.isLive ? 'text-red-600' : 'text-muted-foreground'}`}>{bannerConfig.label}</span>
                  </div>
                  <h4 className="text-sm sm:text-base font-black mb-1 truncate">{liveTest.title}</h4>
                  <p className="text-[11px] font-medium text-muted-foreground truncate">{bannerConfig.description}</p>
                </div>
                <div className="shrink-0">
                  <Button asChild disabled={bannerConfig.buttonDisabled} size="sm" className={`h-10 px-6 text-[10px] font-black rounded-xl transition-all shadow-lg ${liveTest.isLive ? 'bg-[#74b602] hover:bg-[#86d102] text-black shadow-[#74b602]/20' : 'bg-primary hover:bg-primary/90 shadow-primary/20'}`}><Link href={bannerConfig.buttonHref} className="flex items-center gap-2">{bannerConfig.buttonText}<ArrowRight className="h-3 w-3" /></Link></Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="py-20 bg-secondary/5 border-y border-border/30">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "৫০০+", label: "লাইভ অংশগ্রহণকারী" },
              { value: "৫০+", label: "মক টেস্ট প্রতি মাসে" },
              { value: "১০০%", label: "রিয়েল এক্সাম ফিল" },
              { value: "২৪/৭", label: "সাপোর্ট সিস্টেম" }
            ].map((stat, i) => (
              <div key={i} className="text-center space-y-2">
                <div className="text-4xl md:text-5xl font-black text-primary tracking-tighter">{stat.value}</div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SuccessStoriesCarousel />

      <section className="py-20 md:py-28 lg:py-36 border-t border-border/30 bg-background">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
            <p className="fade-up text-xs font-black text-primary mb-4 uppercase tracking-[0.25em]">আমাদের সার্ভিস</p>
            <h2 className="fade-up text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tight leading-[1.1]">পূর্ণাঙ্গ আইইএলটিএস সলিউশন</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: "প্র্যাকটিস", icon: <BookOpen />, href: "/practice", color: "primary", desc: "রিডিং, লিসেনিং, রাইটিং—সব মডিউল।" },
              { title: "লাইভ মক টেস্ট", icon: <Target />, href: "/mock", color: "orange", desc: "নির্ধারিত সময়ে একসাথে পরীক্ষা।" },
              { title: "ভোকাবুলারি", icon: <Brain />, href: "/vocab", color: "blue", desc: "১০০+ ফ্রি শব্দ ও উইকলি চ্যালেঞ্জ।" },
              { title: "এআই ইভ্যালুয়েশন", icon: <Sparkles />, href: "/ai-evaluation", color: "purple", desc: "ইনস্ট্যান্ট রাইটিং ফিডব্যাক।" }
            ].map((s, i) => (
              <Link key={i} href={s.href} className="group p-8 rounded-[2.5rem] border border-border/30 bg-card/50 hover:bg-card hover:border-primary/20 transition-all duration-500 flex flex-col items-center text-center">
                <div className={`h-16 w-16 rounded-2xl flex items-center justify-center mb-6 bg-${s.color}-500/10 text-${s.color}-500 group-hover:scale-110 transition-transform`}>{s.icon}</div>
                <h3 className="text-xl font-bold mb-3">{s.title}</h3>
                <p className="text-sm text-muted-foreground mb-6 flex-1">{s.desc}</p>
                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-colors"><ArrowRight size={18} /></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <PricingSection />

      <footer className="py-16 border-t border-border/30 bg-secondary/5">
        <div className="container max-w-6xl mx-auto px-4 text-center space-y-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black dark:bg-[#74b602] text-white font-black text-2xl transition-transform group-hover:scale-110">I</div>
            <span className="text-2xl font-black tracking-tighter">ielts<span className="text-black dark:text-[#74b602]">practice</span>bd</span>
          </Link>
          <div className="flex flex-wrap justify-center gap-8">
            {["প্র্যাকটিস", "মক টেস্ট", "ভোকাবুলারি", "AI Evaluation", "প্রাইসিং"].map(l => <Link key={l} href="#" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">{l}</Link>)}
          </div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">© {new Date().getFullYear()} ieltspracticebd</p>
        </div>
      </footer>
    </div>
  );
}
