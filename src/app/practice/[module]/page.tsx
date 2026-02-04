"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, Loader2, Clock, ArrowLeft, RotateCcw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Test {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  slug: string;
}

interface Attempt {
  test_id: string;
  band_score: number;
  completed_at: string;
}

export default function ModuleTestsPage() {
  const params = useParams();
  const moduleSlug = params.module as string;
  const [tests, setTests] = useState<Test[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  const moduleNames: Record<string, string> = {
    listening: "Listening",
    reading: "Reading",
    writing: "Writing"
  };

    useEffect(() => {
      const controller = new AbortController();
      const supabase = createClient();
      let isMounted = true;

      async function fetchData() {
        try {
          // Try to load cached user from localStorage
          const cachedUser = localStorage.getItem("user_data");
          let user: any = null;
          if (cachedUser && isMounted) {
            try {
              user = JSON.parse(cachedUser);
            } catch (e) {
              localStorage.removeItem("user_data");
            }
          }

          if (!user) {
            // Use getSession instead of getUser for faster auth retrieval
            const { data: { session }, error: authError } = await supabase.auth.getSession();
            user = session?.user;
            if (user && isMounted) {
              localStorage.setItem("user_data", JSON.stringify(user));
            }
          }

          if (!isMounted || controller.signal.aborted) return;

          if (user) {
            const { data: allPurchases } = await supabase
              .from("user_purchases")
              .select("item_type, module_slug, expires_at")
              .eq("user_id", user.id)
              .eq("status", "completed")
              .gte("expires_at", new Date().toISOString())
              .abortSignal(controller.signal);
            if (!isMounted || controller.signal.aborted) return;
            const hasAllAccess = allPurchases?.some((p: any) => p.item_type === "practice_all");
            const hasModuleAccess = allPurchases?.some((p: any) => p.item_type === "practice_module" && p.module_slug === moduleSlug);
            setHasAccess(!!(hasAllAccess || hasModuleAccess));

            const { data: attemptsData } = await supabase
              .from("test_attempts")
              .select("test_id, band_score, completed_at")
              .eq("user_id", user.id)
              .eq("status", "completed")
              .abortSignal(controller.signal);
            if (!isMounted || controller.signal.aborted) return;
            setAttempts(attemptsData || []);
          } else {
            setHasAccess(false);
          }

          const { data: testsData } = await supabase
            .from("mock_tests")
            .select("*")
            .eq("test_type", "practice")
            .eq("module", moduleSlug)
            .eq("is_published", true)
            .order("created_at", { ascending: false })
            .abortSignal(controller.signal);
          if (!isMounted || controller.signal.aborted) return;
          setTests(testsData || []);
        } catch (error: any) {
          if (error?.name === "AbortError" || controller.signal.aborted) {
            // ignore abort
          } else {
            console.error("Error fetching module tests:", error);
          }
        } finally {
          if (isMounted && !controller.signal.aborted) {
            setLoading(false);
          }
        }
      }

      fetchData();
      return () => {
        isMounted = false;
        controller.abort();
      };
    }, [moduleSlug]);

  const getAttempt = (testId: string) => {
    return attempts.find(a => a.test_id === testId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background font-hind-siliguri flex items-center justify-center">
        <div className="text-center p-10 max-w-md">
          <h2 className="text-2xl font-bold mb-4">অ্যাক্সেস নেই</h2>
          <p className="text-muted-foreground mb-6">
            এই মডিউলে অ্যাক্সেস পেতে প্রথমে কিনুন।
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild variant="outline">
              <Link href="/practice">ফিরে যান</Link>
            </Button>
            <Button asChild>
              <Link href="/custom-subscription">কিনুন</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-hind-siliguri">
      <div className="container max-w-6xl mx-auto px-4 py-12 md:py-20">
        <Link href="/practice" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" /> প্র্যাকটিসে ফিরুন
        </Link>

        <div className="text-center mb-12">
          <p className="text-xs font-black text-primary mb-4 uppercase tracking-[0.25em]">প্র্যাকটিস</p>
          <h1 className="text-4xl md:text-5xl font-black mb-4">{moduleNames[moduleSlug] || moduleSlug}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            যেকোনো টেস্ট বেছে নিন এবং প্র্যাকটিস শুরু করুন।
            {moduleSlug === "writing" && " (Writing এর Band Score শুধু Mock Test এ পাওয়া যাবে)"}
          </p>
        </div>

        {tests.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl font-bold text-muted-foreground">কোনো টেস্ট পাওয়া যায়নি</p>
            <p className="text-muted-foreground">অ্যাডমিন শীঘ্রই টেস্ট যোগ করবেন</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((test) => {
              const attempt = getAttempt(test.id);
              return (
                <div key={test.id} className="group p-6 rounded-2xl border border-border/50 bg-card hover:border-primary/30 hover:shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-black text-primary uppercase tracking-wider">
                      {moduleNames[moduleSlug]}
                    </span>
                    {attempt && moduleSlug !== "writing" && (
                      <span className="text-xs font-bold text-green-500 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Band {attempt.band_score}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold mb-2 line-clamp-2">{test.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{test.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {test.duration_minutes || 60} মিনিট
                    </span>
                      <div className="flex gap-2">
                          {attempt && (
                            <Button asChild variant="ghost" size="sm" className="h-9 px-3">
                              <Link href={`/practice/${moduleSlug}/${test.slug}`}>
                                <RotateCcw className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}
                            <Button asChild size="sm" className="h-9 px-4 font-bold rounded-lg">
                              <Link href={`/practice/${moduleSlug}/${test.slug}`}>
                                {attempt ? "আবার দিন" : "শুরু করুন"} <ArrowRight className="ml-1 h-3.5 w-3.5" />
                              </Link>
                            </Button>
                      </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
