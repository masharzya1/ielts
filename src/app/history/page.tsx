"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  BookOpen, 
  Clock, 
  ArrowRight, 
  Loader2, 
  Trophy,
  FileText,
  CheckCircle2,
  XCircle,
  CalendarDays
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MockResult {
  id: string;
  test_id: string;
  user_id: string;
  answers: any;
  overall_band: number | null;
  reading_score: number | null;
  listening_score: number | null;
  writing_score: number | null;
  is_published: boolean;
  created_at: string;
  mock_tests?: {
    id: string;
    title: string;
    slug: string;
    scheduled_at: string;
  };
}

interface PracticeAttempt {
  id: string;
  test_id: string;
  user_id: string;
  band_score: number | null;
  status: string;
  completed_at: string;
  mock_tests?: {
    id: string;
    title: string;
    slug: string;
    module: string;
  };
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "---";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "---";
  return d.toLocaleDateString("bn-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function HistoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mockResults, setMockResults] = useState<MockResult[]>([]);
  const [practiceAttempts, setPracticeAttempts] = useState<PracticeAttempt[]>([]);
  const [user, setUser] = useState<any>(null);
  const fetchedRef = useRef(false);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push("/login?redirectTo=/history");
        return;
      }
      setUser(authUser);

      const [mockRes, practiceRes] = await Promise.all([
        supabase
          .from("mock_results")
          .select(`
            *,
            mock_tests:test_id (id, title, slug, scheduled_at)
          `)
          .eq("user_id", authUser.id)
          .order("created_at", { ascending: false }),

        supabase
          .from("test_attempts")
          .select(`
            *,
            mock_tests:test_id (id, title, slug, module)
          `)
          .eq("user_id", authUser.id)
          .order("completed_at", { ascending: false })
      ]);

      if (!mockRes.error) setMockResults(mockRes.data || []);
      if (!practiceRes.error) setPracticeAttempts(practiceRes.data || []);

    } catch (err) {
      console.error("History fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 font-hind-siliguri">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Clock className="h-8 w-8 text-primary" />
            টেস্ট ইতিহাস
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">
            আপনার সব মক টেস্ট এবং প্র্যাকটিস টেস্টের রেজাল্ট
          </p>
        </div>

        <Tabs defaultValue="mock" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md h-12 bg-secondary/50 rounded-xl">
            <TabsTrigger value="mock" className="rounded-lg font-bold">
              <Trophy className="h-4 w-4 mr-2" />
              মক টেস্ট ({mockResults.length})
            </TabsTrigger>
            <TabsTrigger value="practice" className="rounded-lg font-bold">
              <BookOpen className="h-4 w-4 mr-2" />
              প্র্যাকটিস ({practiceAttempts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mock" className="space-y-4">
            {mockResults.length === 0 ? (
              <Card className="p-12 text-center border-dashed">
                <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="font-bold text-muted-foreground">কোনো মক টেস্ট দেননি</p>
                <Button asChild className="mt-6 rounded-xl font-bold">
                  <Link href="/mock">মক টেস্ট দিন</Link>
                </Button>
              </Card>
            ) : (
              mockResults.map((result) => (
                <Card key={result.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-bold text-lg">
                          {result.mock_tests?.title || "Unknown Test"}
                        </h3>
                        {result.is_published ? (
                          <Badge className="bg-green-500/10 text-green-600 border-none font-bold">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Published
                          </Badge>
                        ) : (
                          <Badge className="bg-orange-500/10 text-orange-600 border-none font-bold">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatDate(result.created_at)}
                        </span>
                        {result.is_published && result.overall_band !== null && (
                          <span className="font-bold text-primary">
                            Band: {result.overall_band.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {result.is_published && (
                        <div className="hidden sm:grid grid-cols-3 gap-3 text-center">
                          <div className="bg-secondary/50 px-3 py-2 rounded-lg">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase">Reading</p>
                            <p className="font-black">{result.reading_score ?? "---"}</p>
                          </div>
                          <div className="bg-secondary/50 px-3 py-2 rounded-lg">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase">Listening</p>
                            <p className="font-black">{result.listening_score ?? "---"}</p>
                          </div>
                          <div className="bg-secondary/50 px-3 py-2 rounded-lg">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase">Writing</p>
                            <p className="font-black">{result.writing_score ?? "---"}</p>
                          </div>
                        </div>
                      )}
                      <Button asChild className="rounded-xl font-bold">
                        <Link href={`/mock/${result.mock_tests?.slug}/result`}>
                          বিস্তারিত
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="practice" className="space-y-4">
            {practiceAttempts.length === 0 ? (
              <Card className="p-12 text-center border-dashed">
                <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="font-bold text-muted-foreground">কোনো প্র্যাকটিস টেস্ট দেননি</p>
                <Button asChild className="mt-6 rounded-xl font-bold">
                  <Link href="/practice">প্র্যাকটিস শুরু করুন</Link>
                </Button>
              </Card>
            ) : (
              practiceAttempts.map((attempt) => (
                <Card key={attempt.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-bold text-lg">
                          {attempt.mock_tests?.title || "Unknown Test"}
                        </h3>
                        <Badge variant="outline" className="font-bold capitalize">
                          {attempt.mock_tests?.module || "General"}
                        </Badge>
                        {attempt.status === "completed" ? (
                          <Badge className="bg-green-500/10 text-green-600 border-none font-bold">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-500/10 text-gray-600 border-none font-bold">
                            In Progress
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatDate(attempt.completed_at)}
                        </span>
                        {attempt.band_score !== null && (
                          <span className="font-bold text-primary">
                            Band: {attempt.band_score}
                          </span>
                        )}
                      </div>
                    </div>

                    <Button asChild variant="outline" className="rounded-xl font-bold">
                      <Link href={`/practice/${attempt.mock_tests?.module}/${attempt.mock_tests?.slug}`}>
                        আবার দিন
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
