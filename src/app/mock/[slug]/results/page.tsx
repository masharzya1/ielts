"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  CheckCircle2, 
  Target, 
  Clock, 
  Award, 
  ArrowLeft, 
  Sparkles, 
  Loader2,
  AlertCircle,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";

export default function MockResultsPage({ params }: { params: any }) {
  const [slug, setSlug] = useState<string>("");
  const searchParams = useSearchParams();
  const resultId = searchParams.get("resultId");
  const router = useRouter();

  useEffect(() => {
    async function unwrapParams() {
      const p = await params;
      setSlug(p.slug);
    }
    unwrapParams();
  }, [params]);

  const [result, setResult] = useState<any>(null);
  const [test, setTest] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState<Record<string, boolean>>({});
  const [aiEvaluations, setAiEvaluations] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!slug) return;
    const controller = new AbortController();
    async function fetchData() {
      const supabase = createClient();
      try {
        // Prefer getSession to get user quickly and allow aborting
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) {
          router.push("/login");
          return;
        }

        // Fetch test by slug
        const { data: testData } = await supabase
          .from("mock_tests")
          .select("*")
          .eq("slug", slug)
          .maybeSingle()
          .abortSignal(controller.signal);
        if (!testData) {
          setLoading(false);
          return;
        }

        // Check purchase for paid tests
        if (!testData.is_free) {
          const { data: purchase } = await supabase
            .from("user_purchases")
            .select("id")
            .eq("user_id", user.id)
            .eq("item_id", testData.id)
            .eq("status", "completed")
            .maybeSingle()
            .abortSignal(controller.signal);
          if (!purchase) {
            router.push(`/checkout/mock/${testData.id}`);
            return;
          }
        }
        setTest(testData);

        // Fetch result data
        let resultData;
        if (resultId) {
          const { data } = await supabase
            .from("mock_results")
            .select("*")
            .eq("id", resultId)
            .maybeSingle()
            .abortSignal(controller.signal);
          resultData = data;
        } else {
          const { data } = await supabase
            .from("mock_results")
            .select("*")
            .eq("user_id", user.id)
            .eq("test_id", testData.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle()
            .abortSignal(controller.signal);
          resultData = data;
        }

        if (resultData) {
          setResult(resultData);
          const { data: allSections } = await supabase
            .from("test_sections")
            .select("*")
            .eq("test_id", testData.id)
            .order("order_index")
            .abortSignal(controller.signal);
          setSections(allSections || []);

          const sectionIds = allSections?.map((s: any) => s.id) || [];
          const { data: allQuestions } = await supabase
            .from("questions")
            .select("*")
            .in("section_id", sectionIds)
            .order("order_index")
            .abortSignal(controller.signal);
          setQuestions(allQuestions || []);

          // Fetch existing AI evaluations for this result
          const { data: evaluations } = await supabase
            .from("ai_writing_submissions")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .abortSignal(controller.signal);
          if (evaluations) {
            const evalMap: Record<string, any> = {};
            evaluations.forEach((ev: any) => {
              if (!evalMap[ev.question_id]) {
                evalMap[ev.question_id] = ev.evaluation_result;
              }
            });
            setAiEvaluations(evalMap);
          }
        }
      } catch (error: any) {
        if (error?.name === "AbortError" || controller.signal.aborted) {
          // ignore abort
        } else {
          console.error("Error fetching mock results:", error);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    fetchData();
    return () => controller.abort();
  }, [slug, resultId]);

  const handleEvaluateWriting = async (sectionId: string, questionId: string, questionText: string, userAnswer: string) => {
    setEvaluating(prev => ({ ...prev, [questionId]: true }));
    try {
      const response = await fetch("/api/ai/evaluate-writing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId,
          questionText,
          taskType: "task2", // default to task2 for general essays, or detect from context
          userAnswer
        })
      });

      if (!response.ok) throw new Error("Evaluation failed");

      const result = await response.json();
      setAiEvaluations(prev => ({ ...prev, [questionId]: result }));
      toast.success("AI মূল্যায়ন সম্পন্ন হয়েছে");
    } catch (error) {
      console.error(error);
      toast.error("ইভ্যালুয়েশনে সমস্যা হয়েছে");
    } finally {
      setEvaluating(prev => ({ ...prev, [questionId]: false }));
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (!result) return (
    <div className="min-h-screen flex flex-col items-center justify-center font-hind-siliguri">
      <h1 className="text-2xl font-bold mb-4">ফলাফল পাওয়া যায়নি</h1>
      <Button asChild><Link href="/mock">মক টেস্টে ফিরে যান</Link></Button>
    </div>
  );

  const userAnswers = result.answers || {};
  const objectiveSections = sections.filter(s => s.section_type === 'reading' || s.section_type === 'listening');
  const writingSections = sections.filter(s => s.section_type === 'writing');

  // Scoring for objective sections
  let totalCorrect = 0;
  let totalObjectiveQuestions = 0;

  objectiveSections.forEach(section => {
    const sectionQs = questions.filter(q => q.section_id === section.id);
    totalObjectiveQuestions += sectionQs.length;
    sectionQs.forEach(q => {
      const uAns = (userAnswers[q.id] || "").toString().trim().toLowerCase();
      const cAns = q.correct_answer.split(",").map((a: string) => a.trim().toLowerCase());
      if (cAns.includes(uAns)) totalCorrect++;
    });
  });

  const estimatedBand = totalObjectiveQuestions > 0 
    ? (Math.round((totalCorrect / totalObjectiveQuestions) * 9 * 2) / 2).toFixed(1)
    : "0.0";
  
  const sanitizedBand = isNaN(parseFloat(estimatedBand)) ? "0.0" : estimatedBand;

  return (
    <div className="min-h-screen pt-24 pb-16 bg-secondary/5 font-hind-siliguri">
      <div className="container mx-auto px-4 max-w-5xl">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" /> ড্যাশবোর্ডে ফিরুন
        </Link>

        <div className="text-center mb-12">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary mb-6">
            <Award className="h-10 w-10" />
          </div>
          <h1 className="text-4xl font-black mb-2">মক টেস্ট রেজাল্ট</h1>
          <p className="text-muted-foreground text-lg font-medium">
            <span className="text-primary font-bold">{test?.title}</span> এর ফলাফল ও বিশ্লেষণ
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="border-primary/20 bg-primary/5 p-6 flex flex-col items-center justify-center text-center">
            <Target className="h-6 w-6 text-primary mb-2" />
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Estimated Band (L/R)</p>
            <div className="text-5xl font-black text-primary mt-1">{sanitizedBand}</div>
          </Card>

          <Card className="p-6 flex flex-col items-center justify-center text-center border-border/40">
            <CheckCircle2 className="h-6 w-6 text-green-500 mb-2" />
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Correct Answers</p>
            <div className="text-5xl font-black mt-1">{totalCorrect}<span className="text-xl text-muted-foreground">/{totalObjectiveQuestions}</span></div>
          </Card>

          <Card className="p-6 flex flex-col items-center justify-center text-center border-border/40">
            <Clock className="h-6 w-6 text-blue-500 mb-2" />
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Test Date</p>
            <div className="text-xl font-black mt-1">
              {new Date(result.created_at).toLocaleDateString('bn-BD')}
            </div>
          </Card>
        </div>

        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black">সেকশন ভিত্তিক বিশ্লেষণ</h2>
          </div>

          <Accordion type="multiple" className="space-y-4">
            {sections.map(section => {
              const sectionQs = questions.filter(q => q.section_id === section.id);
              if (sectionQs.length === 0 && section.section_type !== 'writing') return null;

              const isWriting = section.section_type === 'writing';

              return (
                <AccordionItem key={section.id} value={section.id} className="border-none rounded-3xl bg-card overflow-hidden shadow-sm">
                  <AccordionTrigger className="px-8 py-6 hover:no-underline hover:bg-secondary/10 transition-all">
                    <div className="flex items-center gap-4 text-left">
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${
                        isWriting ? 'bg-purple-500/10 text-purple-500' : 'bg-primary/10 text-primary'
                      }`}>
                        {isWriting ? <Sparkles className="h-6 w-6" /> : <Target className="h-6 w-6" />}
                      </div>
                      <div>
                        <p className="font-black text-lg capitalize">{section.title}</p>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          {isWriting ? 'Writing Task' : `${sectionQs.length} Questions`}
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-8 pb-8 pt-0">
                    {isWriting ? (
                      <div className="space-y-6">
                        {sectionQs.map((q) => {
                          const answer = userAnswers[q.id] || "";
                          const evaluation = aiEvaluations[q.id];
                          const isEvaluating = evaluating[q.id];

                          return (
                            <div key={q.id} className="p-6 rounded-2xl border border-border/50 bg-secondary/5">
                              <h4 className="font-bold text-sm mb-4">প্রশ্ন: {q.question_text}</h4>
                              <div className="bg-white p-6 rounded-xl border border-border/30 mb-6 text-sm leading-relaxed whitespace-pre-wrap">
                                {answer || "কোনো উত্তর দেওয়া হয়নি।"}
                              </div>

                              {evaluation ? (
                                <div className="mt-6 p-6 rounded-xl bg-purple-500/5 border border-purple-500/20">
                                  <div className="flex items-center justify-between mb-6">
                                    <h5 className="font-black text-purple-600 flex items-center gap-2">
                                      <Sparkles className="h-4 w-4" /> AI মূল্যায়ন ফলাফল
                                    </h5>
                                    <div className="text-2xl font-black text-purple-600">Band {evaluation.overall_band}</div>
                                  </div>
                                  <div className="grid sm:grid-cols-2 gap-4 mb-6">
                                    {[
                                      { label: "Task Achievement", score: evaluation.task_achievement },
                                      { label: "Coherence", score: evaluation.coherence_cohesion },
                                      { label: "Vocabulary", score: evaluation.lexical_resource },
                                      { label: "Grammar", score: evaluation.grammatical_range }
                                    ].map((item, i) => (
                                      <div key={i} className="flex items-center justify-between text-xs font-bold p-3 rounded-lg bg-white border border-purple-500/10">
                                        <span className="text-muted-foreground">{item.label}</span>
                                        <span>{item.score}</span>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="space-y-4">
                                    <div className="text-xs">
                                      <p className="font-bold text-green-600 mb-1">শক্তি:</p>
                                      <ul className="list-disc list-inside text-muted-foreground">
                                        {evaluation.feedback?.strengths?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                                      </ul>
                                    </div>
                                    <div className="text-xs">
                                      <p className="font-bold text-orange-600 mb-1">উন্নতির জায়গা:</p>
                                      <ul className="list-disc list-inside text-muted-foreground">
                                        {evaluation.feedback?.improvements?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <Button 
                                  onClick={() => handleEvaluateWriting(section.id, q.id, q.question_text, answer)}
                                  disabled={isEvaluating || !answer}
                                  className="w-full bg-purple-500 hover:bg-purple-600 font-bold rounded-xl h-12"
                                >
                                  {isEvaluating ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      মূল্যায়ন হচ্ছে...
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="mr-2 h-4 w-4" />
                                      AI দিয়ে মূল্যায়ন করুন
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {sectionQs.map((q, idx) => {
                          const uAns = userAnswers[q.id] || "";
                          const cAns = q.correct_answer.split(",").map((a: string) => a.trim().toLowerCase());
                          const isCorrect = cAns.includes(uAns.toString().trim().toLowerCase());

                          return (
                            <div key={q.id} className={`p-4 rounded-xl border ${isCorrect ? 'border-green-500/10 bg-green-500/5' : 'border-red-500/10 bg-red-500/5'}`}>
                              <div className="flex items-start gap-4">
                                <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black mt-1 ${
                                  isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                }`}>
                                  {idx + 1}
                                </span>
                                <div className="flex-1">
                                  <p className="font-bold text-sm mb-2">{q.question_text.replace(/\[\[H?\d+\]\]/g, '___')}</p>
                                  <div className="grid sm:grid-cols-2 gap-4 text-xs">
                                    <div>
                                      <p className="text-muted-foreground font-bold uppercase tracking-widest text-[9px] mb-1">আপনার উত্তর</p>
                                      <p className={`font-black ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{uAns || "(ফাঁকা)"}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground font-bold uppercase tracking-widest text-[9px] mb-1">সঠিক উত্তর</p>
                                      <p className="font-black text-green-600">{q.correct_answer}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row gap-4">
          <Button asChild variant="outline" className="flex-1 h-14 font-black rounded-2xl border-border/50">
            <Link href="/mock">
              অন্য মক টেস্ট দেখুন
            </Link>
          </Button>
          <Button asChild className="flex-1 h-14 font-black rounded-2xl shadow-xl">
            <Link href="/dashboard">
              ড্যাশবোর্ডে ফিরে যান
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
