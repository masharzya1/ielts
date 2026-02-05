"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Lock, Zap, Target, Award, Sparkles, Brain, ChevronDown, Calendar, Clock, X, Timer, Users, Trophy } from "lucide-react";
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
    // Register plugin inside useEffect for safety in Next.js
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Hero animations - Ultra Fast & Creative
      const tl = gsap.timeline({
        defaults: { ease: "power4.out" }
      });
      
      tl.from(".hero-badge", {
        y: -20,
        opacity: 0,
        duration: 0.4,
      })
      .from(".hero-title span", {
        y: 60,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
      }, "-=0.2")
      .from(".hero-desc", {
        y: 20,
        opacity: 0,
        duration: 0.5,
      }, "-=0.3")
      .from(".hero-cta-btn", {
        scale: 0.9,
        opacity: 0,
        duration: 0.4,
      }, "-=0.2")
      .from(".benefit-badge", {
        y: 10,
        opacity: 0,
        duration: 0.4,
        stagger: 0.05,
      }, "-=0.2");

        // Interactive mouse follow for grid glow effect
        const handleMouseMove = (e: MouseEvent) => {
          // // Disable mouse effect in light mode
          // const isDark = document.documentElement.classList.contains('dark');
          // if (!isDark) return;

          const { clientX, clientY } = e;
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
          const x = clientX - rect.left;
          const y = clientY - rect.top;
          
          // Move the glow
          gsap.to(".mouse-glow", {
            x,
            y,
            duration: 0.8,
            ease: "power2.out",
          });

          // Move bubbles with different speeds for depth
          gsap.to(".hero-bubble-1", { x: (x - rect.width / 2) * 0.05, y: (y - rect.height / 2) * 0.05, duration: 1.5, ease: "power2.out" });
          gsap.to(".hero-bubble-2", { x: -(x - rect.width / 2) * 0.03, y: -(y - rect.height / 2) * 0.03, duration: 2, ease: "power2.out" });
          gsap.to(".hero-bubble-3", { x: (x - rect.width / 2) * 0.02, y: -(y - rect.height / 2) * 0.04, duration: 2.5, ease: "power2.out" });
          gsap.to(".hero-bubble-4", { x: (x - rect.width / 2) * 0.04, y: (y - rect.height / 2) * 0.02, duration: 1.8, ease: "power2.out" });
          gsap.to(".hero-bubble-5", { x: -(x - rect.width / 2) * 0.06, y: (y - rect.height / 2) * 0.03, duration: 2.2, ease: "power2.out" });
        }
      };

      window.addEventListener("mousemove", handleMouseMove);

      // Subtle floating for benefit badges
      gsap.to(".benefit-badge", {
        y: -4,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: {
          each: 0.2,
          from: "random"
        }
      });

      // Background elements animation
      gsap.to(".bg-blob", {
        x: "random(-20, 20)",
        y: "random(-20, 20)",
        duration: 5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 1
      });

      // Bubble floating animation
      [1, 2, 3, 4, 5].forEach((i) => {
        gsap.to(`.hero-bubble-${i}`, {
          x: "random(-30, 30)",
          y: "random(-30, 30)",
          scale: "random(0.9, 1.1)",
          duration: "random(3, 5)",
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: i * 0.2
        });
      });

      // Scroll animations
      gsap.utils.toArray(".fade-up").forEach((el: any) => {
        gsap.from(el, {
          scrollTrigger: {
            trigger: el,
            start: "top 90%",
          },
          y: 30,
          opacity: 0,
          duration: 0.5,
          ease: "power3.out",
        });
      });

      gsap.utils.toArray(".stagger-item").forEach((el: any, i: number) => {
        gsap.from(el, {
          scrollTrigger: {
            trigger: el,
            start: "top 95%",
          },
          y: 20,
          opacity: 0,
          duration: 0.4,
          delay: i * 0.05,
          ease: "power2.out",
        });
      });

      return () => window.removeEventListener("mousemove", handleMouseMove);
    }, containerRef);

    return () => ctx.revert();
  }, []);


  return (
    <div ref={containerRef} className="relative overflow-hidden font-hind-siliguri">

    {/* Hero Section */}
    <section className="relative min-h-screen flex items-center justify-center pt-16 pb-16 overflow-hidden">
        {/* Apple-style Grid Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808022_1px,transparent_1px),linear-gradient(to_bottom,#80808022_1px,transparent_1px)] bg-[size:30px_30px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
          
          {/* Mouse Glow Effect */}
          <div className="mouse-glow absolute top-0 left-0 w-[500px] h-[500px] bg-primary/30 dark:bg-primary/20 rounded-full blur-[60px] dark:blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2 opacity-30 dark:opacity-60"></div>

          {/* Floating Bubbles */}
          <div className="hero-bubble-1 absolute top-[20%] left-[15%] w-12 h-12 rounded-full bg-primary/50 dark:bg-primary/30 blur-lg dark:blur-xl"></div>
          <div className="hero-bubble-2 absolute top-[60%] right-[20%] w-16 h-16 rounded-full bg-primary/40 dark:bg-primary/20 blur-lg dark:blur-xl"></div>
          <div className="hero-bubble-3 absolute bottom-[15%] left-[40%] w-10 h-10 rounded-full bg-primary/60 dark:bg-primary/40 blur-md dark:blur-lg"></div>
          <div className="hero-bubble-4 absolute top-[40%] left-[80%] w-8 h-8 rounded-full bg-primary/50 dark:bg-primary/30 blur-sm dark:blur-md"></div>
          <div className="hero-bubble-5 absolute bottom-[30%] left-[10%] w-14 h-14 rounded-full bg-primary/40 dark:bg-primary/20 blur-lg dark:blur-xl"></div>
        </div>

        {/* Animated Background Blobs */}
        <div className="absolute top-1/4 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-[40px] dark:blur-[100px] bg-blob opacity-20 pointer-events-none"></div>
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-primary/5 rounded-full blur-[50px] dark:blur-[120px] bg-blob opacity-20 pointer-events-none"></div>
        
        <div className="container max-w-4xl mx-auto px-4 relative z-10">
          <div className="hero-content text-center">
            <div className="hero-badge inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 text-foreground/50 text-[10px] font-bold mb-8 border border-border/20 backdrop-blur-md">
              <Sparkles className="h-3 w-3 text-primary" />
              <span className="uppercase tracking-wider">বাংলাদেশের ১ নম্বর আইইএলটিএস প্ল্যাটফর্ম</span>
            </div>

            <h1 className="hero-title text-4xl md:text-5xl lg:text-7xl font-black leading-[1] mb-6 tracking-[-0.06em]">
              <span className="block mb-1">আপনার বিদেশের স্বপ্ন</span>
              <span className="block gradient-text bg-clip-text text-transparent pb-2">এখন হাতের মুঠোয়</span>
            </h1>

            <p className="hero-desc text-sm md:text-base text-muted-foreground/80 leading-relaxed mb-10 max-w-md mx-auto font-medium tracking-tight">
              আসল পরীক্ষার মতো মক টেস্ট দিন। এআই প্রযুক্তির মাধ্যমে তাৎক্ষণিক ফলাফল এবং ফিডব্যাক পেয়ে আপনার আইইএলটিএস ব্যান্ড স্কোর নিশ্চিত করুন।
            </p>

            <div className="hero-cta-btn flex justify-center mb-12">
              <Button asChild size="lg" className="h-12 px-8 text-sm font-bold rounded-xl shadow-xl dark:shadow-primary/20 hover:scale-105 transition-all duration-500 active:scale-95 group">
                <Link href="/pricing" className="flex items-center gap-2">
                  মক টেস্ট শুরু করুন
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>

            <div className="hero-benefits flex flex-wrap justify-center gap-4 md:gap-6">
              {[
                { icon: <Zap className="h-3.5 w-3.5" />, text: "তাৎক্ষণিক ফলাফল" },
                { icon: <Target className="h-3.5 w-3.5" />, text: "সঠিক ব্যান্ড প্রেডিকশন" },
                { icon: <Award className="h-3.5 w-3.5" />, text: "এক্সপার্ট গাইডেন্স" },
              ].map((benefit, i) => (
                <div key={i} className="benefit-badge flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/30 border border-border/20 text-[11px] font-bold text-muted-foreground/90 backdrop-blur-md hover:bg-secondary/50 transition-colors cursor-default">
                  <div className="text-primary">{benefit.icon}</div>
                  <span>{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
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