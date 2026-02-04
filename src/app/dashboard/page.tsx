"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  Play,
  RefreshCw,
  Timer,
  TrendingUp,
  Trophy,
  XCircle,
  Award,
} from "lucide-react";

import { IELTSInfoForm } from "@/components/IELTSInfoForm";

type MockResult = {
  id: string;
  user_id?: string;
  test_type: string | null;
  band_score: number | null;
  created_at: string;
  answers: any;
  reading_score: number | null;
  listening_score: number | null;
  writing_score: number | null;
  speaking_score: number | null;
};

type UserPurchase = {
  id: string;
  user_id?: string;
  product_id: string;
  created_at: string;
  amount: number | null;
  payment_method: string | null;
  status: string | null;
  product: {
    id: string;
    name: string;
    description: string | null;
    price: number | null;
  } | null;
};

type Subscription = {
  id: string;
  user_id?: string;
  status: string | null;
  current_period_end: string | null;
  created_at: string;
  plan: string | null;
  price: number | null;
};

type Profile = {
  id: string;
  target_score: number | null;
  test_type: string | null;
  exam_date: string | null;
  current_level: string | null;
  phone: string | null;
};

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [user, setUser] = useState<any>(null);

  const [results, setResults] = useState<MockResult[]>([]);
  const [purchases, setPurchases] = useState<UserPurchase[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [needsInfo, setNeedsInfo] = useState(false);

  const fetchedRef = useRef(false);

  const computeIsEmailVerified = (u: any) => {
    // ✅ canonical: confirmed_at (your JSON has this)
    // ✅ fallback: email_confirmed_at (some payloads)
    // ✅ optional fallback: user_metadata.email_verified (your JSON has it)
    return Boolean(
      u?.confirmed_at || u?.email_confirmed_at || u?.user_metadata?.email_verified
    );
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !authUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      setUser(authUser);

      const isEmailVerified = computeIsEmailVerified(authUser);

      // ✅ If not verified, stop here (dashboard should show verify screen)
      if (!isEmailVerified) {
        setResults([]);
        setPurchases([]);
        setSubscriptions([]);
        setProfile(null);
        setNeedsInfo(false);
        setLoading(false);
        return;
      }

      // ✅ fetch everything in parallel
      const [resultsRes, purchasesRes, subsRes, profileRes] = await Promise.all([
        supabase
          .from("mock_results")
          .select("*")
          .eq("user_id", authUser.id)
          .order("created_at", { ascending: false })
          .limit(10),

        supabase
          .from("user_purchases")
          .select(
            `
            *,
            product:products(*)
          `
          )
          .eq("user_id", authUser.id)
          .order("created_at", { ascending: false })
          .limit(10),

        supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", authUser.id)
          .order("created_at", { ascending: false })
          .limit(10),

        // ✅ important: avoid hard error if profile row doesn't exist
        // maybeSingle() prevents "no rows" from being treated like a fatal error
        supabase.from("profiles").select("*").eq("id", authUser.id).maybeSingle(),
      ]);

      if (!resultsRes.error) setResults((resultsRes.data as any) || []);
      if (!purchasesRes.error) setPurchases((purchasesRes.data as any) || []);
      if (!subsRes.error) setSubscriptions((subsRes.data as any) || []);

      if (profileRes.error) {
        // if RLS or other issue, log it
        console.error("Profile fetch error:", profileRes.error);
        setProfile(null);
        setNeedsInfo(true);
      } else {
        const prof = (profileRes.data as any) as Profile | null;
        setProfile(prof);
        setNeedsInfo(!prof?.target_score);
      }

      setLoading(false);
    } catch (e) {
      console.error("Dashboard fetchData error:", e);
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchData();
      toast.success("Dashboard refreshed");
    } finally {
      setRefreshing(false);
    }
  };

  const handleInfoComplete = () => {
    // ✅ after form submit, refetch profile again
    setNeedsInfo(false);
    fetchData();
    toast.success("Your IELTS target info has been saved");
  };

  const latestScore = results?.[0]?.band_score ?? null;
  const targetScore = profile?.target_score ?? null;

  const progress = (() => {
    if (!latestScore || !targetScore) return 0;
    const pct = Math.round((latestScore / targetScore) * 100);
    return Math.max(0, Math.min(100, pct));
  })();

  const activeSub =
    subscriptions.find((s) => s.status === "active") ||
    subscriptions.find((s) => s.status === "trialing") ||
    null;

  const isPremium = Boolean(activeSub);

  const isEmailVerified = computeIsEmailVerified(user);

  if (loading) {
    return (
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center px-4 font-hind-siliguri">
        <div className="max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
          <p className="text-muted-foreground">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  // ✅ Verify screen
  if (user && !isEmailVerified) {
    return (
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center px-4 font-hind-siliguri">
        <div className="max-w-xl w-full">
          <Card className="border-muted">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                ইমেইল ভেরিফাই করুন
              </CardTitle>
              <CardDescription>
                ড্যাশবোর্ড ব্যবহার করতে আপনার ইমেইল ভেরিফাই করা প্রয়োজন।
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4 bg-muted/30">
                <p className="text-sm text-muted-foreground">
                  আপনার ইনবক্স/স্প্যাম ফোল্ডারে ভেরিফিকেশন ইমেইল চেক করুন।
                  ভেরিফাই করার পর আবার এখানে রিফ্রেশ দিন।
                </p>
              </div>
              <Button onClick={handleRefresh} className="w-full" disabled={refreshing}>
                {refreshing ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    রিফ্রেশ হচ্ছে...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    রিফ্রেশ
                  </span>
                )}
              </Button>
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground">
              সমস্যা হলে পুনরায় লগইন করে দেখুন।
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  // ✅ Needs info screen
  if (needsInfo) {
    return (
      <div className="min-h-screen pt-20 pb-12 px-4 font-hind-siliguri">
        <div className="max-w-xl mx-auto">
          <Card className="border-muted">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                আপনার IELTS তথ্য দিন
              </CardTitle>
              <CardDescription>
                আপনার টার্গেট স্কোর এবং পরীক্ষার তথ্য দিলে আমরা আপনাকে আরও ভালোভাবে গাইড করতে পারবো।
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IELTSInfoForm onComplete={handleInfoComplete} />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ✅ Normal dashboard
  return (
    <div className="min-h-screen pt-20 pb-12 px-4 font-hind-siliguri">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">ড্যাশবোর্ড</h1>
            <p className="text-muted-foreground text-sm">
              আপনার প্রগ্রেস, মক রেজাল্ট এবং সাবস্ক্রিপশন এক জায়গায়
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  রিফ্রেশ হচ্ছে...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  রিফ্রেশ
                </span>
              )}
            </Button>

            {!isPremium && (
              <Button onClick={() => router.push("/premium")} className="gap-2">
                <Award className="h-4 w-4" />
                প্রিমিয়াম নিন
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-muted">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Trophy className="h-4 w-4 text-primary" />
                সর্বশেষ স্কোর
              </CardTitle>
              <CardDescription>আপনার সর্বশেষ মক টেস্টের ব্যান্ড</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-bold">
                {latestScore ? Number(latestScore).toFixed(1) : "—"}
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>টার্গেট</span>
                <span className="font-medium text-foreground">
                  {targetScore ? Number(targetScore).toFixed(1) : "—"}
                </span>
              </div>
              <Progress value={progress} />
              <div className="text-xs text-muted-foreground">
                {latestScore && targetScore
                  ? `${progress}% complete`
                  : "টার্গেট সেট করলে প্রগ্রেস দেখাবে"}
              </div>
            </CardContent>
          </Card>

          <Card className="border-muted">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-primary" />
                প্র্যাকটিস স্ট্যাটাস
              </CardTitle>
              <CardDescription>আপনার রিসেন্ট অ্যাক্টিভিটি</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">মক টেস্ট</span>
                <span className="font-semibold">{results.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">পার্চেস</span>
                <span className="font-semibold">{purchases.length}</span>
              </div>
              <div className="pt-2 flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push("/history")}
                >
                  ইতিহাস
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
                <Button className="flex-1" onClick={() => router.push("/mock-test")}>
                  মক টেস্ট
                  <Play className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-muted">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4 text-primary" />
                সাবস্ক্রিপশন
              </CardTitle>
              <CardDescription>আপনার প্ল্যান স্ট্যাটাস</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeSub ? (
                <>
                  <div className="flex items-center justify-between">
                    <Badge variant="default" className="gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Active
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {activeSub.plan ?? "Premium"}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">মেয়াদ শেষ: </span>
                    <span className="font-medium">
                      {formatDate(activeSub.current_period_end)}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push("/subscription")}
                  >
                    সাবস্ক্রিপশন ম্যানেজ
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="gap-1">
                      <XCircle className="h-3.5 w-3.5" />
                      Free
                    </Badge>
                    <span className="text-sm text-muted-foreground">No active plan</span>
                  </div>
                  <Button className="w-full" onClick={() => router.push("/premium")}>
                    প্রিমিয়াম নিন
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-muted">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              রিসেন্ট মক রেজাল্ট
            </CardTitle>
            <CardDescription>সর্বশেষ ১০টি মক টেস্টের ফলাফল</CardDescription>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                এখনো কোনো মক টেস্ট দেননি। শুরু করতে “মক টেস্ট” বাটনে ক্লিক করুন।
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{r.test_type ?? "Mock Test"}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(r.created_at)}
                        </span>
                      </div>
                      <div className="text-sm">
                        Band:{" "}
                        <span className="font-semibold">
                          {r.band_score ? Number(r.band_score).toFixed(1) : "—"}
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => router.push(`/result/${r.id}`)}
                      className="gap-1"
                    >
                      বিস্তারিত
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button variant="ghost" onClick={() => router.push("/history")} className="gap-1">
              সব দেখুন
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-muted">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-primary" />
              রিসেন্ট পার্চেস
            </CardTitle>
            <CardDescription>সর্বশেষ ১০টি পেমেন্ট/পার্চেস</CardDescription>
          </CardHeader>
          <CardContent>
            {purchases.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                কোনো পার্চেস নেই। প্রিমিয়াম নিলে এখানে দেখাবে।
              </div>
            ) : (
              <div className="space-y-3">
                {purchases.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{p.status ?? "—"}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(p.created_at)}
                        </span>
                      </div>
                      <div className="text-sm font-medium">{p.product?.name ?? "Product"}</div>
                      <div className="text-xs text-muted-foreground">
                        Amount: {p.amount ?? "—"} | Method: {p.payment_method ?? "—"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-muted">
            <CardHeader>
              <CardTitle className="text-base">কুইক অ্যাকশন</CardTitle>
              <CardDescription>দ্রুত কাজ শুরু করুন</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-between" onClick={() => router.push("/mock-test")}>
                মক টেস্ট দিন
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => router.push("/practice")}
              >
                প্র্যাকটিস করুন
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-between"
                onClick={() => setNeedsInfo(true)}
              >
                প্রোফাইল আপডেট
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="border-muted md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">আপনার লক্ষ্য</CardTitle>
              <CardDescription>আপনার সেট করা IELTS তথ্য</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">Target Score</div>
                <div className="text-lg font-semibold">
                  {profile?.target_score ? Number(profile.target_score).toFixed(1) : "—"}
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">Exam Date</div>
                <div className="text-lg font-semibold">
                  {profile?.exam_date ? formatDate(profile.exam_date) : "—"}
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">Test Type</div>
                <div className="text-lg font-semibold">{profile?.test_type ?? "—"}</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">Current Level</div>
                <div className="text-lg font-semibold">{profile?.current_level ?? "—"}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
