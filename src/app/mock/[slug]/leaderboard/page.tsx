"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
  Trophy, 
  Medal, 
  ArrowLeft, 
  Loader2, 
  Lock,
  Search,
  Users
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LiveLeaderboard } from "@/components/LiveLeaderboard";

export default function LeaderboardPage({ params }: { params: any }) {
  const [slug, setSlug] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    async function unwrapParams() {
      const p = await params;
      setSlug(p.slug);
    }
    unwrapParams();
  }, [params]);
  
  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [user, setUser] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const controller = new AbortController();
    async function fetchData() {
      const supabase = createClient();
      try {
        // Retrieve session to determine logged in user
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        const currentUser = session?.user || null;
        if (!controller.signal.aborted) setUser(currentUser);

        if (!currentUser) {
          setLoading(false);
          return;
        }

        // Fetch test details
        const { data: testData } = await supabase
          .from("mock_tests")
          .select("*")
          .or(`id.eq.${slug},slug.eq.${slug}`)
          .maybeSingle()
          .abortSignal(controller.signal);
        if (!testData) {
          setLoading(false);
          return;
        }
        setTest(testData);

        // Check purchase/access
        const { data: purchase } = await supabase
          .from("mock_registrations")
          .select("id")
          .eq("user_id", currentUser.id)
          .eq("test_id", testData.id)
          .eq("status", "completed")
          .maybeSingle()
          .abortSignal(controller.signal);

        if (purchase || testData.is_free) {
          setHasAccess(true);
          // Fetch published results for this test
          const { data: resultsData } = await supabase
            .from("mock_results")
            .select(`
              *,
              profiles:user_id (full_name, avatar_url)
            `)
            .eq("test_id", testData.id)
            .eq("is_published", true)
            .order("overall_band", { ascending: false })
            .order("reading_score", { ascending: false })
            .abortSignal(controller.signal);
          setResults(resultsData || []);
        }
      } catch (error: any) {
        if (error?.name === "AbortError" || controller.signal.aborted) {
          // ignore
        } else {
          console.error("Error fetching leaderboard data:", error);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    fetchData();
    return () => controller.abort();
  }, [slug]);

  const filteredResults = results.filter(r => 
    r.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.user_id === user?.id
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center font-hind-siliguri px-4">
        <Lock className="h-16 w-16 text-muted-foreground mb-6" />
        <h1 className="text-2xl font-black mb-2">লগইন প্রয়োজন</h1>
        <p className="text-muted-foreground mb-8 text-center">লিডারবোর্ড দেখতে হলে আপনাকে অবশ্যই লগইন করতে হবে।</p>
        <Button asChild className="h-12 px-10 font-black rounded-xl shadow-lg">
          <Link href={`/login?redirect=/mock/${slug}/leaderboard`}>লগইন করুন</Link>
        </Button>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center font-hind-siliguri px-4">
        <Lock className="h-16 w-16 text-red-500/50 mb-6" />
        <h1 className="text-2xl font-black mb-2">এক্সেস নেই</h1>
        <p className="text-muted-foreground mb-8 text-center">এই মক টেস্টের লিডারবোর্ড দেখতে হলে আপনাকে এটি পারচেজ করতে হবে।</p>
        <Button asChild className="h-12 px-10 font-black rounded-xl shadow-lg">
          <Link href={`/checkout/mock/${test?.id}`}>পারচেজ করুন</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-hind-siliguri py-20 px-4">
      <div className="container max-w-4xl mx-auto">
        <Link href="/mock" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary mb-12 transition-colors">
          <ArrowLeft className="h-4 w-4" /> মক টেস্টে ফিরুন
        </Link>

        <div className="text-center mb-16">
          <div className="h-20 w-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-6">
            <Trophy className="h-10 w-10" />
          </div>
          <h1 className="text-4xl font-black mb-4 tracking-tight leading-tight">
            লিডারবোর্ড
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            <span className="text-primary font-black">{test?.title}</span> - এর সেরা পারফর্মারদের তালিকা
          </p>
        </div>

          <div className="relative mb-10">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="নাম দিয়ে সার্চ করুন..." 
              className="h-14 pl-12 rounded-2xl border-border/50 bg-card"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <LiveLeaderboard testId={test?.id} />
        </div>
      </div>
    );
  }
