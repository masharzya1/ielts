"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { BookOpen, Headphones, PenTool, ArrowRight, Loader2, Lock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Module {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
}

interface Purchase {
  item_type: string;
  module_slug: string | null;
  expires_at: string;
}

export default function PracticePage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [testCounts, setTestCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const fetchedRef = useRef(false);

    useEffect(() => {
      // AbortController to cancel fetches when component unmounts
      const controller = new AbortController();
      const supabase = createClient();
      let isMounted = true;

      async function fetchData() {
        try {
          // Load cached user data from localStorage first
          const cachedUser = localStorage.getItem("user_data");
          if (cachedUser && isMounted) {
            try {
              const parsed = JSON.parse(cachedUser);
              setUser(parsed);
            } catch (e) {
              localStorage.removeItem("user_data");
            }
          }

          // Prefer getSession over getUser to avoid blocking on network
          const { data: { session }, error: authError } = await supabase.auth.getSession();
          if (!isMounted) return;
          const currentUser = session?.user || null;
          if (currentUser) {
            setUser(currentUser);
            localStorage.setItem("user_data", JSON.stringify(currentUser));
          } else {
            setUser(null);
            localStorage.removeItem("user_data");
          }

          // Fetch active practice modules
          const { data: modulesData, error: modulesError } = await supabase
            .from("practice_modules")
            .select("*")
            .eq("is_active", true)
            .order("display_order")
            .abortSignal(controller.signal);
          if (!isMounted || controller.signal.aborted) return;
          setModules(modulesData || []);

          // If user logged in fetch their active purchases
          if (currentUser) {
            const { data: purchasesData } = await supabase
              .from("user_purchases")
              .select("item_type, module_slug, expires_at")
              .eq("user_id", currentUser.id)
              .eq("status", "completed")
              .gte("expires_at", new Date().toISOString())
              .abortSignal(controller.signal);
            if (!isMounted || controller.signal.aborted) return;
            setPurchases(purchasesData || []);
          }

          // Load test counts for each module
          if (modulesData && modulesData.length > 0) {
            const counts: Record<string, number> = {};
            await Promise.all(modulesData.map(async (m: any) => {
              const { count } = await supabase
                .from("mock_tests")
                .select("*", { count: "exact", head: true })
                .eq("test_type", "practice")
                .eq("module", m.slug)
                .eq("is_published", true)
                .abortSignal(controller.signal);
              counts[m.slug] = count || 0;
            }));
            if (!isMounted || controller.signal.aborted) return;
            setTestCounts(counts);
          }
        } catch (error: any) {
          if (error?.name === "AbortError" || controller.signal.aborted) {
            // ignore abort
          } else {
            console.error("Error fetching data:", error);
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
    }, []);

  const hasAccess = (slug: string) => {
    return purchases.some(p => {
      const notExpired = new Date(p.expires_at) > new Date();
      const hasAllAccess = p.item_type === "practice_all";
      const hasModuleAccess = p.item_type === "practice_module" && p.module_slug === slug;
      return notExpired && (hasAllAccess || hasModuleAccess);
    });
  };

  const getIcon = (icon: string) => {
    switch(icon) {
      case "headphones": return <Headphones className="h-7 w-7" />;
      case "book-open": return <BookOpen className="h-7 w-7" />;
      case "pen-tool": return <PenTool className="h-7 w-7" />;
      default: return <BookOpen className="h-7 w-7" />;
    }
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
      <div className="container max-w-6xl mx-auto px-4 py-12 md:py-20">
        <div className="text-center mb-16">
          <p className="text-xs font-black text-primary mb-4 uppercase tracking-[0.25em]">প্র্যাকটিস</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tight">
            মডিউল বেছে নিন
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            আপনার কেনা মডিউলে ক্লিক করে টেস্ট দিন। নতুন মডিউল কিনতে চাইলে কাস্টম সাবস্ক্রিপশন থেকে কিনুন।
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {modules.map((module) => {
            const access = hasAccess(module.slug);
            return (
              <div 
                key={module.id}
                className={`group p-8 rounded-3xl border transition-all duration-300 ${
                  access 
                    ? "border-primary/30 bg-primary/[0.03] hover:bg-primary/[0.08] hover:shadow-2xl cursor-pointer" 
                    : "border-border/30 bg-secondary/20 opacity-70"
                }`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className={`h-16 w-16 rounded-2xl flex items-center justify-center transition-all ${
                    access 
                      ? "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground" 
                      : "bg-secondary text-muted-foreground"
                  }`}>
                    {getIcon(module.icon)}
                  </div>
                  {!access && <Lock className="h-5 w-5 text-muted-foreground" />}
                </div>
                <h3 className="text-2xl font-bold mb-2">{module.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{module.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">
                    {testCounts[module.slug] || 0}টি টেস্ট
                  </span>
                  {access ? (
                    <Button asChild size="sm" className="h-10 px-5 font-bold rounded-xl">
                      <Link href={`/practice/${module.slug}`}>
                        টেস্ট দিন <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild variant="outline" size="sm" className="h-10 px-5 font-bold rounded-xl">
                      <Link href="/custom-subscription">কিনুন</Link>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {user && purchases.length > 0 && (
          <div className="p-8 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent mb-16">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-bold mb-2">Full Test তৈরি করুন</h3>
                <p className="text-sm text-muted-foreground">
                  আপনার কেনা মডিউলগুলো একসাথে মিলিয়ে একটি Full Practice Test দিন।
                </p>
              </div>
              <Button asChild className="h-12 px-8 font-bold rounded-xl">
                <Link href="/practice/create-full-test">
                  <Plus className="mr-2 h-4 w-4" /> Full Test তৈরি করুন
                </Link>
              </Button>
            </div>
          </div>
        )}

        {!user && (
          <div className="text-center p-10 rounded-3xl bg-secondary/30 border border-border/30">
            <h3 className="text-2xl font-bold mb-4">লগইন করুন</h3>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              প্র্যাকটিস মডিউল কিনতে ও টেস্ট দিতে প্রথমে লগইন করুন।
            </p>
            <div className="flex justify-center gap-4">
              <Button asChild className="h-12 px-8 font-bold rounded-xl">
                <Link href="/login">লগইন</Link>
              </Button>
              <Button asChild variant="outline" className="h-12 px-8 font-bold rounded-xl">
                <Link href="/register">রেজিস্টার</Link>
              </Button>
            </div>
          </div>
        )}

        {user && purchases.length === 0 && (
          <div className="text-center p-10 rounded-3xl bg-secondary/30 border border-border/30">
            <h3 className="text-2xl font-bold mb-4">কোনো মডিউল কেনা নেই</h3>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              প্র্যাকটিস টেস্ট দিতে চাইলে আপনার পছন্দের মডিউল কিনুন।
            </p>
            <Button asChild className="h-12 px-8 font-bold rounded-xl">
              <Link href="/custom-subscription">কাস্টম সাবস্ক্রিপশন দেখুন</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
