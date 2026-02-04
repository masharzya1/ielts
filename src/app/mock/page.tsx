"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Target, ArrowRight, Loader2, Clock, Calendar, Users, Lock, CheckCircle2, Trophy, Activity, AlertCircle, Sparkles, Timer, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, isPast, isFuture, isWithinInterval, addMinutes, differenceInMinutes, differenceInSeconds } from "date-fns";
import { bn } from "date-fns/locale";
import { RecentActivityTicker } from "@/components/RecentActivityTicker";

interface MockTest {
  id: string;
  title: string;
  description: string;
  mock_start_time: string;
  mock_end_time: string;
  registration_deadline: string;
  price: number;
  is_free: boolean;
  is_published: boolean;
  slug: string;
  scheduled_at: string;
  duration_minutes: number;
  isJoinable?: boolean;
  isPreStart?: boolean;
}

interface Registration {
  test_id: string;
  status: string;
}

const CountdownBox = ({ value, label }: { value: string | number, label: string }) => (
  <div className="flex flex-col items-center gap-1">
    <div className="flex gap-1">
      {String(value).padStart(2, '0').split('').map((digit, i) => (
        <div key={i} className="w-8 h-10 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-center text-base font-black text-red-600 shadow-sm">
          {digit}
        </div>
      ))}
    </div>
    <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest leading-none">{label}</span>
  </div>
);

export default function MockTestPage() {
  const router = useRouter();

  const requestFullscreen = async () => {
    try {
      const el: any = document.documentElement;
      if (!document.fullscreenElement && el?.requestFullscreen) {
        await el.requestFullscreen();
      }
    } catch {
      // If fullscreen fails (browser policy / user setting), still continue.
    }
  };

  const handleJoin = async (test: any) => {
    await requestFullscreen();
    router.push(`/mock/${test.slug || test.id}`);
  };
  const [upcomingTests, setUpcomingTests] = useState<MockTest[]>([]);
  const [liveTests, setLiveTests] = useState<MockTest[]>([]);
  const [pastTests, setPastTests] = useState<MockTest[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const fetchedRef = useRef(false);

  const [allTests, setAllTests] = useState<any[]>([]);
  const [presenceCount, setPresenceCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (liveTests.length > 0 && user) {
      const supabase = createClient();
      const channel = supabase.channel(`mock_presence_all`, {
        config: { presence: { key: user.id } }
      });

      channel
        .on("presence", { event: "sync" }, () => {
          const state = channel.presenceState();
          setPresenceCount(Object.keys(state).length);
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await channel.track({ online_at: new Date().toISOString() });
          }
        });

      return () => {
        channel.unsubscribe();
      };
    }
  }, [liveTests.length, user]);

  useEffect(() => {
    if (allTests.length > 0) {
      categorizeTests(allTests);
    }
  }, [currentTime, allTests]);

  const categorizeTests = (tests: any[]) => {
    const now = currentTime;
    const upcoming: MockTest[] = [];
    const live: MockTest[] = [];
    const past: MockTest[] = [];

      tests.forEach((test: any) => {
        const start = new Date(test.scheduled_at);
        const transferEnd = addMinutes(start, test.live_to_previous_minutes || 180);
        const secondsSinceStart = differenceInSeconds(now, start);
        const secondsUntilStart = differenceInSeconds(start, now);

        if (secondsUntilStart > 0) {
          const isPreStart = secondsUntilStart <= 300;
          upcoming.push({ ...test, mock_start_time: test.scheduled_at, mock_end_time: transferEnd.toISOString(), registration_deadline: test.scheduled_at, isPreStart });
        } else if (now > transferEnd) {
          past.push({ ...test, mock_start_time: test.scheduled_at, mock_end_time: transferEnd.toISOString() });
        } else {
          live.push({ ...test, mock_start_time: test.scheduled_at, mock_end_time: transferEnd.toISOString(), isJoinable: secondsSinceStart <= 180 });
        }
      });

    setUpcomingTests(upcoming);
    setLiveTests(live);
    setPastTests(past);
  };

  useEffect(() => {
    // Create an AbortController to cancel fetches on unmount or route change
    const controller = new AbortController();

    async function fetchData() {
      const supabase = createClient();
      try {
        // Prefer getSession over getUser to avoid network latency/hydration hangs
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError || !session?.user) {
          setUser(null);
        } else {
          setUser(session.user);
        }

        // Fetch all published mock tests
        const { data: tests, error: testsError } = await supabase
          .from("mock_tests")
          .select("*")
          .eq("test_type", "mock")
          .eq("is_published", true)
          .order("scheduled_at", { ascending: true })
          .abortSignal(controller.signal);

        if (!controller.signal.aborted && tests) {
          setAllTests(tests);
          categorizeTests(tests);
        }

        // If user is logged in, load registrations and purchases
        if (session?.user) {
          const [regsRes, purchasesRes] = await Promise.all([
            supabase
              .from("mock_registrations")
              .select("test_id, status")
              .eq("user_id", session.user.id)
              .abortSignal(controller.signal),
            supabase
              .from("user_purchases")
              .select("item_id, status, item_type")
              .eq("user_id", session.user.id)
              .eq("status", "completed")
              .abortSignal(controller.signal)
          ]);

          if (!controller.signal.aborted) {
            const hasGlobalAccess = (purchasesRes.data || []).some(p =>
              ["practice_all", "mock_all", "all_access", "full_package", "premium_all"].includes(p.item_type) && p.status === "completed"
            );

            const combinedRegs: Registration[] = [
              ...(regsRes.data || []),
              ...(purchasesRes.data || [])
                .filter(p => ["mock_test", "mock", "mock_single", "practice_all", "mock_all", "all_access", "full_package", "premium_all"].includes(p.item_type))
                .map(p => ({ test_id: p.item_id, status: p.status }))
            ];

            if (hasGlobalAccess && !combinedRegs.some(r => r.test_id === "GLOBAL")) {
              combinedRegs.push({ test_id: "GLOBAL", status: "completed" });
            }

            setRegistrations(combinedRegs);
          }
        }
      } catch (error: any) {
        if (error?.name === "AbortError" || controller.signal.aborted) {
          // Ignore abort errors
        } else {
          console.error("Error fetching mock tests:", error);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    fetchData();
    return () => {
      // Abort ongoing requests when the component unmounts
      controller.abort();
    };
  }, []);

  const isRegistered = (testId: string) => {
    return registrations.some(r => r.test_id === testId || r.test_id === "GLOBAL");
  };

  const getTimeStatus = (test: MockTest) => {
    const start = new Date(test.mock_start_time);
    const deadline = new Date(test.registration_deadline);
    
    if (test.isPreStart) {
      return { text: "শীঘ্রই শুরু", color: "text-orange-500" };
    }
    if (isPast(deadline) && isFuture(start)) {
      return { text: "রেজিস্ট্রেশন শেষ", color: "text-red-500" };
    }
    if (isFuture(deadline)) {
      return { text: "রেজিস্ট্রেশন চলছে", color: "text-green-500" };
    }
    return { text: "শেষ", color: "text-muted-foreground" };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-hind-siliguri">
      <div className="container max-w-7xl mx-auto px-4 py-12 md:py-20">
        <div className="grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8">
            <div className="mb-16">
              <p className="text-xs font-black text-orange-500 mb-4 uppercase tracking-[0.25em]">লাইভ পরীক্ষা</p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tight">
                লাইভ মক টেস্ট
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                সপ্তাহে ৫ দিন নির্ধারিত সময়ে সবাই একসাথে পরীক্ষা দিন। র‌্যাংকিং ও ফিডব্যাক পান।
              </p>
            </div>

              {liveTests.length > 0 && (
                <div className="mb-16">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    এখন চলছে
                  </h2>
                  <div className="grid gap-6">
                    {liveTests.map((test) => {
                      const registered = isRegistered(test.id);
                      const start = new Date(test.mock_start_time);
                      const secondsSinceStart = differenceInSeconds(currentTime, start);
                      const joinTimeLeft = Math.max(0, 180 - secondsSinceStart);
                      const joinMinutes = Math.floor(joinTimeLeft / 60);
                      const joinSeconds = joinTimeLeft % 60;

                      return (
                        <div key={test.id} className="group relative overflow-hidden rounded-[2.5rem] bg-[#0A0A0A] border border-red-500/20 shadow-[0_30px_60px_-15px_rgba(220,38,38,0.2)] transition-all duration-500 hover:scale-[1.005]">
                          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                            <Target className="h-48 w-48 text-red-600 -rotate-12" />
                          </div>
                          
                          <div className="relative p-6 sm:p-8 flex flex-col md:flex-row items-center gap-8 z-10">
                            <div className="flex-1 text-center md:text-left">
                              <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                                <Badge className="bg-red-600 hover:bg-red-700 text-white font-black px-4 py-1 rounded-full text-[10px] tracking-widest uppercase animate-pulse">
                                  LIVE NOW
                                </Badge>
                                <span className="text-xs font-bold text-red-500 uppercase tracking-widest">Ongoing Test</span>
                              </div>
                              <h3 className="text-2xl sm:text-3xl font-black mb-3 tracking-tight text-white">{test.title}</h3>
                              <p className="text-sm text-white/50 leading-relaxed max-w-xl line-clamp-1">{test.description}</p>
                              
                              <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-6">
                                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5">
                                  <Clock className="h-4 w-4 text-red-500" />
                                  <span className="text-xs font-bold text-white/70">{format(new Date(test.mock_end_time), "h:mm a", { locale: bn })} শেষ</span>
                                </div>
                                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5">
                                    <Users className="h-4 w-4 text-red-500" />
                                    <span className="text-xs font-bold text-white/70">{presenceCount > 0 ? presenceCount + 450 : 500}+ জন লাইভ</span>
                                  </div>
                              </div>
                            </div>

                              <div className="w-full md:w-auto shrink-0 space-y-4">
                                {test.isJoinable ? (
                                  <div className="flex flex-col items-center gap-4">
                                    <div className="flex flex-col items-center">
                                      <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mb-2">জয়েন করার সময় বাকি</p>
                                      <div className="flex gap-2 items-center">
                                        <CountdownBox value={joinMinutes} label="মিনিট" />
                                        <div className="text-red-500/30 font-black text-xl mb-4">:</div>
                                        <CountdownBox value={joinSeconds} label="সেকেন্ড" />
                                      </div>
                                    </div>
                                    
                                    {registered ? (
                                      <Button asChild size="lg" className="w-full md:w-64 h-16 font-black rounded-2xl bg-[#74b602] hover:bg-[#86d102] text-black shadow-lg shadow-primary/20 group/btn transition-all text-lg border-none">
                                        <button type="button" onClick={() => handleJoin(test)} className="flex items-center justify-center gap-3 w-full">
                                          <Sparkles className="h-5 w-5 animate-pulse" />
                                          পরীক্ষা শুরু করুন
                                          <ArrowRight className="h-5 w-5 group-hover/btn:translate-x-2 transition-transform" />
                                        </button>
                                      </Button>
                                    ) : (
                                      <div className="text-center p-4 rounded-2xl bg-red-500/10 border border-red-500/20 w-full md:w-64">
                                        <p className="text-xs font-black text-red-500 uppercase tracking-widest mb-2">রেজিস্ট্রেশন বন্ধ</p>
                                        <Button asChild variant="link" className="text-[#74b602] font-black p-0 h-auto">
                                          <Link href="/mock/pre-book" className="flex items-center gap-2">
                                            পরবর্তী মক বুক করুন <ArrowRight className="h-4 w-4" />
                                          </Link>
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-center md:text-right p-6 rounded-[2rem] border border-red-500/20 bg-red-500/5">
                                    <p className="text-xs font-black text-red-500 uppercase tracking-widest mb-2">জয়েন উইন্ডো শেষ</p>
                                    <p className="text-[10px] text-white/40 mb-4">৩ মিনিট সময় পার হয়ে গেছে</p>
                                    <Button asChild variant="link" className="text-[#74b602] font-black p-0 h-auto">
                                      <Link href="/mock/pre-book" className="flex items-center gap-2">
                                        পরবর্তী মক টেস্ট <ArrowRight className="h-4 w-4" />
                                      </Link>
                                    </Button>
                                  </div>
                                )}
                              </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            {upcomingTests.length === 0 && liveTests.length === 0 && (
              <div className="mb-16 p-10 rounded-3xl border-2 border-dashed border-primary/20 bg-primary/[0.02] text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-black mb-3 text-foreground">বর্তমানে কোনো লাইভ মক টেস্ট নেই</h2>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  শীঘ্রই নতুন মক টেস্ট শুরু হবে। এখন প্রি-বুক করলে পরবর্তী মক টেস্টে পাবেন সরাসরি ডিসকাউন্ট!
                </p>
                <Button asChild className="h-12 px-10 font-black rounded-xl">
                  <Link href="/mock/pre-book" className="flex items-center gap-2">
                    পরবর্তী মক টেস্টের জন্য প্রি-বুক করুন (৳৫০)
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              </div>
            )}

            {upcomingTests.length > 0 && (
              <div className="mb-20">
                <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
                  <Calendar className="h-6 w-6 text-primary" />
                  পরবর্তী মক টেস্টগুলো
                </h2>
                <div className="grid sm:grid-cols-2 gap-8">
                  {upcomingTests.map((test) => {
                    const status = getTimeStatus(test);
                    const registered = isRegistered(test.id);
                    const start = new Date(test.mock_start_time);
                    const diff = differenceInSeconds(start, currentTime);
                    const d = Math.floor(diff / 86400);
                    const h = Math.floor((diff % 86400) / 3600);
                    const m = Math.floor((diff % 3600) / 60);
                    const s = diff % 60;

                    return (
                      <div key={test.id} className="group relative flex flex-col h-full rounded-[2.5rem] bg-card border border-border/40 hover:border-primary/40 transition-all duration-500 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_50px_-12px_rgba(116,182,2,0.15)] overflow-hidden">
                        <div className={`h-1.5 w-full ${registered ? 'bg-emerald-500' : 'bg-primary/20 group-hover:bg-primary transition-colors'}`}></div>
                        
                        <div className="p-8 flex flex-col h-full">
                          <div className="flex items-center justify-between mb-8">
                            <Badge variant="secondary" className={`${status.color} bg-secondary/50 font-black uppercase text-[10px] tracking-[0.15em] px-4 py-1.5 rounded-xl border border-border/50`}>
                              {status.text}
                            </Badge>
                            <div className="flex flex-col items-end">
                              <div className="text-2xl font-black text-foreground tracking-tighter">৳{test.price}</div>
                              <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">রেজিস্ট্রেশন ফি</div>
                            </div>
                          </div>
                          
                          <h3 className="text-2xl font-black mb-4 tracking-tight leading-tight group-hover:text-primary transition-colors">{test.title}</h3>
                          <p className="text-sm text-muted-foreground mb-8 line-clamp-2 font-medium leading-relaxed">{test.description}</p>
                          
                          <div className="space-y-4 mb-10 mt-auto">
                            {test.isPreStart ? (
                              <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-orange-500/5 border border-orange-500/20 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">শুরু হতে বাকি</p>
                                <div className="flex gap-2">
                                  <CountdownBox value={m} label="মিনিট" />
                                  <div className="text-orange-500/30 font-black text-xl mb-4">:</div>
                                  <CountdownBox value={s} label="সেকেন্ড" />
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/30 border border-border/30 group-hover:bg-secondary/50 transition-colors">
                                  <div className="h-10 w-10 rounded-xl bg-background flex items-center justify-center shadow-sm">
                                    <Calendar className="h-5 w-5 text-primary" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">তারিখ</p>
                                    <p className="text-sm font-bold">{format(new Date(test.mock_start_time), "dd MMMM, yyyy", { locale: bn })}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/30 border border-border/30 group-hover:bg-secondary/50 transition-colors">
                                  <div className="h-10 w-10 rounded-xl bg-background flex items-center justify-center shadow-sm">
                                    <Clock className="h-5 w-5 text-primary" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">সময়</p>
                                    <p className="text-sm font-bold">{format(new Date(test.mock_start_time), "h:mm a", { locale: bn })}</p>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>

                          {registered ? (
                            <div className="w-full">
                              {test.isPreStart ? (
                                 <Button disabled className="w-full h-14 font-black rounded-2xl bg-orange-500/10 text-orange-500 border border-orange-500/20 cursor-not-allowed">
                                   অপেক্ষা করুন...
                                 </Button>
                              ) : (
                                <div className="w-full h-14 flex items-center justify-center gap-3 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-black text-base shadow-sm">
                                  <CheckCircle2 className="h-5 w-5" />
                                  রেজিস্ট্রেশন সম্পন্ন
                                </div>
                              )}
                            </div>
                          ) : (
                            <Button asChild className="w-full h-14 font-black rounded-2xl shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 text-black border-none hover:scale-[1.02] active:scale-[0.98] transition-all text-base">
                              <Link href={`/checkout/mock/${test.id}`} className="flex items-center justify-center gap-2">
                                রেজিস্ট্রেশন করুন
                                <ArrowRight className="h-5 w-5" />
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {pastTests.length > 0 && (
              <div className="mb-20">
                <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
                  <Trophy className="h-6 w-6 text-muted-foreground" />
                  পূর্ববর্তী মক টেস্টগুলো
                </h2>
                <div className="grid sm:grid-cols-2 gap-6">
                  {pastTests.map((test) => {
                    const registered = isRegistered(test.id);
                    return (
                      <div key={test.id} className="p-6 rounded-[2rem] border border-border/30 bg-secondary/10 hover:bg-secondary/20 transition-all group">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-black transition-colors">
                            <Award className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-black group-hover:text-primary transition-colors line-clamp-1">{test.title}</h3>
                            <p className="text-[10px] text-muted-foreground font-bold flex items-center gap-1.5 mt-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {format(new Date(test.mock_start_time), "dd MMM yyyy", { locale: bn })}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mt-6">
                          <Button asChild variant="outline" size="sm" className="font-black rounded-xl h-11 border-border/50 bg-background/50 hover:bg-white dark:hover:bg-white/5">
                            <Link href={`/mock/${test.slug || test.id}/leaderboard`}>
                              লিডারবোর্ড
                            </Link>
                          </Button>
                          <Button asChild variant="outline" size="sm" className="font-black rounded-xl h-11 border-border/50 bg-background/50 hover:bg-white dark:hover:bg-white/5">
                            <Link href={`/mock/${test.slug || test.id}/result`}>
                              আমার রেজাল্ট
                            </Link>
                          </Button>
                        </div>
                        
                        {!registered && (
                          <div className="mt-4 pt-4 border-t border-border/20">
                            <p className="text-[10px] text-center font-bold text-muted-foreground/60 flex items-center justify-center gap-2 uppercase tracking-widest">
                              <Lock className="h-3 w-3" /> শুধু রেজিস্টার্ড ইউজারদের জন্য
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-8">
            <RecentActivityTicker />
            
            <div className="p-8 rounded-[2.5rem] border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <h3 className="text-xl font-black mb-6">মক টেস্টে কী পাবেন?</h3>
              <div className="space-y-6">
                {[
                  { icon: <Users className="h-5 w-5" />, title: "একসাথে পরীক্ষা", desc: "সবাই নির্ধারিত সময়ে" },
                  { icon: <Trophy className="h-5 w-5" />, title: "র‌্যাংকিং", desc: "অন্যদের সাথে তুলনা" },
                  { icon: <Target className="h-5 w-5" />, title: "বিস্তারিত ফিডব্যাক", desc: "দুর্বলতা চিহ্নিত" }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm mb-0.5">{item.title}</h4>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
