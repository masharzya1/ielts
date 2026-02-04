"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
  Award, 
  ArrowLeft, 
  Loader2, 
  Lock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Target,
  Sparkles,
  Share2
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShareResultCard } from "@/components/ShareResultCard";

export default function PersonalResultPage({ params }: { params: any }) {
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
  const [result, setResult] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const controller = new AbortController();
    async function fetchData() {
      const supabase = createClient();
      try {
        // Use getSession instead of getUser
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        const currentUser = session?.user || null;
        if (!controller.signal.aborted) setUser(currentUser);

        if (!currentUser) {
          setLoading(false);
          return;
        }

        // Fetch test by id or slug
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

        // Check registration for this test
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
          const { data: resultData } = await supabase
            .from("mock_results")
            .select("*")
            .eq("test_id", testData.id)
            .eq("user_id", currentUser.id)
            .maybeSingle()
            .abortSignal(controller.signal);
          setResult(resultData);
        }
      } catch (error: any) {
        if (error?.name === "AbortError" || controller.signal.aborted) {
          // ignore
        } else {
          console.error("Error fetching personal result:", error);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    fetchData();
    return () => controller.abort();
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center font-hind-siliguri px-4">
        <Lock className="h-16 w-16 text-muted-foreground mb-6" />
        <h1 className="text-2xl font-black mb-2">লগইন প্রয়োজন</h1>
        <p className="text-muted-foreground mb-8 text-center">আপনার রেজাল্ট দেখতে হলে আপনাকে অবশ্যই লগইন করতে হবে।</p>
        <Button asChild className="h-12 px-10 font-black rounded-xl shadow-lg"><Link href={`/login?redirect=/mock/${slug}/result`}>লগইন করুন</Link></Button>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center font-hind-siliguri px-4">
        <Lock className="h-16 w-16 text-red-500/50 mb-6" />
        <h1 className="text-2xl font-black mb-2">এক্সেস নেই</h1>
        <p className="text-muted-foreground mb-8 text-center">এই মক টেস্টের রেজাল্ট দেখতে হলে আপনাকে এটি পারচেজ করতে হবে।</p>
        <Button asChild className="h-12 px-10 font-black rounded-xl shadow-lg"><Link href={`/checkout/mock/${test?.id}`}>পারচেজ করুন</Link></Button>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-background font-hind-siliguri py-20 px-4">
        <div className="container max-w-4xl mx-auto">
          <Link href="/mock" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary mb-12 transition-colors"><ArrowLeft className="h-4 w-4" /> মক টেস্টে ফিরুন</Link>
          <div className="text-center py-20 bg-secondary/20 rounded-[2.5rem] border border-dashed border-border/50">
            <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-bold text-muted-foreground">আপনি এখনো এই টেস্টে অংশগ্রহণ করেননি</p>
            <Button asChild className="mt-6 font-black rounded-xl h-11 px-8"><Link href={`/mock/${test?.slug}`}>টেস্টটি শুরু করুন</Link></Button>
          </div>
        </div>
      </div>
    );
  }

  const isPublished = result.is_published;

  return (
    <div className="min-h-screen bg-background font-hind-siliguri py-20 px-4">
      <div className="container max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <Link href="/mock" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> মক টেস্টে ফিরুন
          </Link>
          {isPublished && (
            <Button 
              onClick={() => setShowShare(!showShare)}
              variant={showShare ? "default" : "outline"}
              className="font-black rounded-xl"
            >
              <Share2 className="mr-2 h-4 w-4" />
              {showShare ? "রিপোর্ট দেখুন" : "শেয়ার করুন"}
            </Button>
          )}
        </div>

        {showShare && isPublished ? (
          <div className="animate-in fade-in zoom-in duration-500">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-black mb-4">আপনার সাফল্য শেয়ার করুন!</h2>
              <p className="text-muted-foreground">আপনার এই দুর্দান্ত রেজাল্টটি বন্ধুদের সাথে শেয়ার করে অনুপ্রাণিত করুন।</p>
            </div>
            <ShareResultCard result={result} testTitle={test?.title || ""} />
          </div>
        ) : (
          <>
            <div className="text-center mb-16">
              <div className="h-20 w-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-6">
                <Award className="h-10 w-10" />
              </div>
              <h1 className="text-4xl font-black mb-4 tracking-tight leading-tight">আমার রেজাল্ট</h1>
              <p className="text-lg text-muted-foreground font-medium">
                <span className="text-primary font-black">{test?.title}</span> - এর ফলাফল ও বিশ্লেষণ
              </p>
              {!isPublished && (
                <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 text-orange-600 border border-orange-500/20 text-xs font-bold">
                  <AlertCircle className="h-4 w-4" />
                  আপনার রেজাল্ট বর্তমানে পেন্ডিং অবস্থায় আছে। অ্যাডমিন পাবলিশ করলে এখানে পূর্ণাঙ্গ ফলাফল দেখতে পাবেন।
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {[
                { 
                  label: "Overall Band", 
                  value: isPublished && typeof result.overall_band === 'number' ? result.overall_band.toFixed(1) : "---", 
                  icon: <Target className="text-primary" />, 
                  color: "bg-primary/5 border-primary/20" 
                },
                { 
                  label: "Reading", 
                  value: isPublished && result.reading_score !== null && result.reading_score !== undefined ? result.reading_score : "---", 
                  icon: <CheckCircle2 className="text-green-500" />, 
                  color: "bg-green-500/5 border-green-500/20" 
                },
                { 
                  label: "Listening", 
                  value: isPublished && result.listening_score !== null && result.listening_score !== undefined ? result.listening_score : "---", 
                  icon: <CheckCircle2 className="text-blue-500" />, 
                  color: "bg-blue-500/5 border-blue-500/20" 
                },
                { 
                  label: "Writing", 
                  value: isPublished && result.writing_score !== null && result.writing_score !== undefined ? result.writing_score : "---", 
                  icon: <Sparkles className="text-purple-500" />, 
                  color: "bg-purple-500/5 border-purple-500/20" 
                }
              ].map((stat, i) => (
                <Card key={i} className={`p-6 rounded-2xl flex flex-col items-center text-center justify-center space-y-2 border-border/40 ${stat.color}`}>
                  <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm">{stat.icon}</div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                  <div className="text-3xl font-black">{stat.value}</div>
                </Card>
              ))}
            </div>

            {isPublished && (
              <div className="space-y-8">
                <Card className="p-8 rounded-[2rem] bg-card border-border/40 shadow-sm">
                  <h2 className="text-2xl font-black mb-6">বিস্তারিত ফিডব্যাক</h2>
                  <div className="prose prose-sm max-w-none text-muted-foreground font-medium leading-relaxed">
                    {result.feedback ? <div dangerouslySetInnerHTML={{ __html: result.feedback }} /> : <p>আপনার এই টেস্টের জন্য কোনো বিস্তারিত ফিডব্যাক দেওয়া হয়নি।</p>}
                  </div>
                </Card>
                <div className="text-center">
                  <Button asChild size="lg" className="h-14 px-10 font-black rounded-2xl shadow-xl hover:scale-[1.02] transition-all"><Link href={`/mock/${test?.slug}/results?resultId=${result.id}`}>পূর্ণাঙ্গ বিশ্লেষণ দেখুন</Link></Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
