"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Calendar, Clock, ArrowRight, Timer, Lock, Sparkles } from "lucide-react";
import Link from "next/link";
import { differenceInSeconds, addMinutes } from "date-fns";
import { cn } from "@/lib/utils";

interface LiveMock {
  id: string;
  title: string;
  scheduled_at: string;
  slug: string;
  price: number;
}

interface LiveMockBannerProps {
  currentMock?: LiveMock | null;
  isRegistered?: boolean;
}

export function LiveMockBanner({ currentMock, isRegistered }: LiveMockBannerProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!currentMock) {
    return (
      <section className="py-4 border-y border-border/20 bg-secondary/30">
        <div className="w-full max-w-5xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5">পরবর্তী মক টেস্ট</p>
                <p className="text-base font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  এখন কোনো লাইভ মক টেস্ট চলছে না
                </p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="h-10 px-6 text-sm font-bold rounded-xl hover:scale-105 transition-all">
              <Link href="/mock">সব মক দেখুন</Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  const start = new Date(currentMock.scheduled_at);
  const diff = differenceInSeconds(start, currentTime);
  const isPreStart = diff > 0 && diff <= 300;
  const isLive = diff <= 0 && diff > -180; // Live for 3 minutes (join window)
  const isOngoing = diff <= -180 && diff > -10800; // Ongoing for 3 hours

  if (isPreStart || isLive) {
    const absDiff = Math.abs(diff);
    const m = Math.floor((isPreStart ? diff : (180 + diff)) / 60);
    const s = (isPreStart ? diff : (180 + diff)) % 60;

    return (
      <section className={cn(
        "py-6 border-y transition-all duration-500",
        isLive ? "bg-red-600 text-white border-red-500 shadow-[0_0_50px_rgba(220,38,38,0.3)]" : "bg-orange-500 text-white border-orange-400"
      )}>
        <div className="w-full max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className={cn(
                  "h-16 w-16 rounded-[1.5rem] flex items-center justify-center shadow-xl",
                  isLive ? "bg-white text-red-600" : "bg-white text-orange-500"
                )}>
                  {isLive ? <Play className="h-8 w-8 animate-pulse" /> : <Timer className="h-8 w-8" />}
                </div>
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-white rounded-full animate-ping" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
                    {isLive ? "Live Now" : "Upcoming Mock"}
                  </span>
                  <div className="h-1 w-1 rounded-full bg-white opacity-40" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
                    {currentMock.title}
                  </span>
                </div>
                <h2 className="text-2xl font-black tracking-tight">
                  {isLive ? "মক টেস্ট শুরু হয়ে গেছে!" : "মক টেস্ট শুরু হতে যাচ্ছে..."}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="flex items-center gap-4 bg-black/10 px-6 py-3 rounded-2xl border border-white/10">
                <div className="text-center">
                  <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-1">{isLive ? "Time Left to Join" : "Starts In"}</p>
                  <p className="text-3xl font-black font-mono leading-none">
                    {m.toString().padStart(2, '0')}:{s.toString().padStart(2, '0')}
                  </p>
                </div>
              </div>

              {isRegistered ? (
                <Button asChild size="lg" className={cn(
                  "h-16 px-10 text-lg font-black rounded-2xl shadow-2xl transition-all hover:scale-105 active:scale-95",
                  isLive ? "bg-white text-red-600 hover:bg-gray-100" : "bg-white text-orange-600 hover:bg-gray-100"
                )}>
                  <Link href={isLive ? `/mock/${currentMock.slug || currentMock.id}` : "#"}>
                    {isLive ? "জয়েন করুন" : "অপেক্ষা করুন"}
                    <ArrowRight className="ml-3 h-6 w-6" />
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg" className="h-16 px-10 text-lg font-black rounded-2xl bg-black text-white hover:bg-black/80 shadow-2xl transition-all hover:scale-105 active:scale-95">
                  <Link href={isPreStart ? `/checkout/mock/${currentMock.id}` : "/mock/pre-book"}>
                    {isPreStart ? "রেজিস্ট্রেশন করুন" : "পরবর্তী মক বুক করুন"}
                    <Lock className="ml-3 h-6 w-6" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (isOngoing) {
    return (
      <section className="py-4 border-y border-border/30 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
        <div className="w-full max-w-5xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                  <Sparkles className="h-5 w-5" />
                </div>
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse ring-2 ring-background" />
              </div>
              <div>
                <p className="text-xs font-black text-primary uppercase tracking-wider mb-0.5">লাইভ মক টেস্ট চলছে</p>
                <p className="text-base font-bold text-foreground">{currentMock.title}</p>
              </div>
            </div>
            {isRegistered && (
              <Button asChild size="sm" className="h-10 px-6 text-sm font-bold rounded-xl shadow-md hover:scale-105 transition-all">
                <Link href={`/mock/${currentMock.slug || currentMock.id}`}>আমার টেস্টে ফিরে যান</Link>
              </Button>
            )}
          </div>
        </div>
      </section>
    );
  }

  return null;
}
