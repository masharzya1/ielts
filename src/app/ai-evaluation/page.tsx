"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Sparkles, ArrowRight, Loader2, Send, CheckCircle2, AlertCircle, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { toast } from "sonner";

interface Question {
  id: string;
  task_type: string;
  question_text: string;
  image_url: string | null;
}

interface Evaluation {
  task_achievement: number;
  coherence_cohesion: number;
  lexical_resource: number;
  grammatical_range: number;
  overall_band: number;
  detailed_feedback: {
    tr_analysis: string;
    cc_analysis: string;
    lr_analysis: string;
    gra_analysis: string;
  };
  feedback: {
    strengths: string[];
    improvements: string[];
    suggestions: string[];
  };
  corrections?: {
    original: string;
    correction: string;
    explanation: string;
  }[];
}

export default function AIEvaluationPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [customTaskType, setCustomTaskType] = useState<"task1" | "task2">("task1");
  const [customQuestionText, setCustomQuestionText] = useState("");
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [user, setUser] = useState<any>(null);
  const [hasPremium, setHasPremium] = useState(false);
  const [usageCount, setUsageCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchData() {
      const supabase = createClient();
      try {
        // Use getSession for faster user retrieval
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        const currentUser = session?.user || null;
        if (!controller.signal.aborted) setUser(currentUser);

        if (currentUser) {
          const { data: purchase } = await supabase
            .from("user_purchases")
            .select("*")
            .eq("user_id", currentUser.id)
            .eq("item_type", "ai_evaluation")
            .eq("status", "active")
            .gte("expires_at", new Date().toISOString())
            .maybeSingle()
            .abortSignal(controller.signal);
          if (!controller.signal.aborted) setHasPremium(!!purchase);

          const { count } = await supabase
            .from("ai_writing_submissions")
            .select("*", { count: "exact", head: true })
            .eq("user_id", currentUser.id)
            .abortSignal(controller.signal);
          if (!controller.signal.aborted) setUsageCount(count || 0);
        }

        const { data } = await supabase
          .from("ai_writing_questions")
          .select("*")
          .eq("is_active", true)
          .abortSignal(controller.signal);
        if (!controller.signal.aborted) setQuestions(data || []);
      } catch (error: any) {
        if (error?.name === "AbortError" || controller.signal.aborted) {
          // ignore abort
        } else {
          console.error("Error fetching AI evaluation data:", error);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    fetchData();
    return () => controller.abort();
  }, []);

  const uploadToImgBB = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("image", file);
    const response = await fetch(`https://api.imgbb.com/1/upload?key=74ab1b5e9a3dd246d0c7745d5e33d051`, {
      method: "POST",
      body: formData
    });
    const result = await response.json();
    if (result.success) {
      return result.data.url;
    }
    throw new Error("Upload failed");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setUploadingImage(true);
    try {
      const url = await uploadToImgBB(file);
      setCustomImageUrl(url);
      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEvaluate = async () => {
    if (!user) {
      toast.error("Please login first");
      return;
    }
    if (!hasPremium && usageCount >= 1) {
      toast.error("Free trial exhausted. Please upgrade to premium.");
      return;
    }
    if (userAnswer.trim().length < 50) {
      toast.error("Answer must be at least 50 words");
      return;
    }

    if (!customQuestionText.trim()) {
      toast.error("Please provide the question prompt");
      return;
    }

    setEvaluating(true);

    try {
      const payload = {
        questionId: null,
        questionText: customQuestionText,
        taskType: customTaskType,
        userAnswer,
        imageUrl: customImageUrl,
        customQuestionText: customQuestionText
      };

      const response = await fetch("/api/ai/evaluate-writing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Evaluation failed");
      }

      const result = await response.json();
      setEvaluation(result);
      setUsageCount(prev => prev + 1);
      toast.success("Evaluation completed");
    } catch (error: any) {
      toast.error(error.message || "Something went wrong with evaluation");
    } finally {
      setEvaluating(false);
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
        <div className="text-center mb-12">
          <p className="text-xs font-black text-primary mb-4 uppercase tracking-[0.25em]">Expert Trainer</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 tracking-tight">IELTS Writing Evaluation</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
            Get instant expert feedback and accurate band scores for your IELTS Writing tasks.
          </p>
        </div>

        {!hasPremium && (
          <div className="mb-10 p-5 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-primary" />
              </div>
                <div>
                  <span className="text-sm font-bold block">Free Trial Status</span>
                  <span className="text-xs text-muted-foreground font-medium">You have {Math.max(0, 1 - usageCount)} evaluations remaining.</span>
                </div>
            </div>
            <Button asChild className="w-full sm:w-auto font-bold rounded-xl shadow-lg shadow-primary/20">
              <Link href="/custom-subscription">Get Unlimited Access</Link>
            </Button>
          </div>
        )}

          <div className="grid lg:grid-cols-[1fr_400px] gap-8 items-start relative">
            <div className="space-y-8 relative">
              {!hasPremium && usageCount >= 1 && (
                <div className="absolute inset-0 z-50 rounded-[2rem] bg-background/60 backdrop-blur-[4px] flex flex-col items-center justify-center p-8 text-center border-2 border-primary/20 animate-in fade-in duration-500">
                  <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                    <Sparkles className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-3xl font-black mb-4 tracking-tight">Limit Reached</h3>
                  <p className="text-lg text-muted-foreground font-medium mb-8 max-w-sm">
                    You have used your 1 free AI evaluation. Upgrade to premium to continue receiving expert feedback.
                  </p>
                  <Button asChild size="lg" className="h-14 px-10 text-base font-black rounded-2xl shadow-xl shadow-primary/20">
                    <Link href="/custom-subscription" className="flex items-center gap-3">
                      UPGRADE TO PREMIUM
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </Button>
                </div>
              )}
              {/* Input Section */}
              <div className="p-8 rounded-[2rem] border border-border/50 bg-card shadow-sm space-y-8">
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex-1 space-y-3">
                    <label className="text-sm font-bold flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Task Type
                    </label>
                    <div className="flex p-1 bg-secondary/50 rounded-xl">
                      {(["task1", "task2"] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => {
                            setCustomTaskType(t);
                            setEvaluation(null);
                          }}
                          className={`flex-1 py-2.5 rounded-lg text-xs font-black transition-all ${
                            customTaskType === t
                              ? "bg-background text-primary shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {t === "task1" ? "TASK 1 (Report)" : "TASK 2 (Essay)"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <label className="text-sm font-bold flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-primary" />
                      Upload Prompt Image
                    </label>
                    <div className="relative">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <label 
                        htmlFor="image-upload"
                        className="flex items-center justify-center gap-3 h-[46px] border border-border rounded-xl cursor-pointer hover:bg-secondary/50 transition-all bg-secondary/20 overflow-hidden"
                      >
                        {uploadingImage ? (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        ) : customImageUrl ? (
                          <span className="text-xs font-bold text-primary flex items-center gap-2">
                            <CheckCircle2 className="h-3 w-3" /> Image Selected
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-muted-foreground">Choose Image (Optional)</span>
                        )}
                      </label>
                      {customImageUrl && (
                        <button 
                          onClick={() => setCustomImageUrl("")}
                          className="absolute -top-2 -right-2 h-6 w-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold flex items-center gap-2">
                    <Send className="h-4 w-4 text-primary" />
                    Question Prompt
                  </label>
                  <Textarea
                    value={customQuestionText}
                    onChange={(e) => setCustomQuestionText(e.target.value)}
                    placeholder="Paste your IELTS Writing question here..."
                    className="min-h-[120px] text-base font-medium resize-none rounded-2xl bg-secondary/20 border-none focus-visible:ring-1 focus-visible:ring-primary/50"
                  />
                </div>

                {customImageUrl && (
                  <div className="relative group rounded-2xl overflow-hidden border border-border/50">
                    <img src={customImageUrl} alt="Prompt" className="w-full object-cover max-h-[300px]" />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Your Response
                  </label>
                  <div className="px-3 py-1 rounded-full bg-secondary text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {userAnswer.trim() ? userAnswer.trim().split(/\s+/).length : 0} Words
                  </div>
                </div>
                <Textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder={customTaskType === "task1" ? "At least 150 words..." : "At least 250 words..."}
                  className="min-h-[400px] text-lg font-medium leading-relaxed resize-none rounded-2xl bg-secondary/10 border-none focus-visible:ring-1 focus-visible:ring-primary/50 p-6"
                />
                <Button 
                  className="w-full h-14 text-base font-black rounded-2xl bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
                  onClick={handleEvaluate}
                  disabled={evaluating || !userAnswer.trim() || !customQuestionText.trim()}
                >
                  {evaluating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      EVALUATING...
                    </>
                  ) : (
                    <>
                      GET FEEDBACK
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6 sticky top-8">
            {evaluation ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="p-8 rounded-[2rem] border border-primary/20 bg-primary/[0.02] shadow-sm overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-4">
                    <div className="px-3 py-1.5 rounded-full bg-primary/10 text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                      <Sparkles className="h-3 w-3" />
                      IELTS Trainer
                    </div>
                  </div>

                  <div className="flex flex-col items-center text-center mb-10 pt-4">
                    <span className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em] mb-4">Overall Band Score</span>
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
                      <span className="relative text-7xl font-black text-primary leading-none tracking-tighter">
                        {evaluation.overall_band}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    {[
                      { label: "Task Achievement", score: evaluation.task_achievement },
                      { label: "Coherence", score: evaluation.coherence_cohesion },
                      { label: "Lexical Resource", score: evaluation.lexical_resource },
                      { label: "Grammar", score: evaluation.grammatical_range }
                    ].map((item, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-background border border-border/50 shadow-sm">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1.5">{item.label}</p>
                        <p className="text-2xl font-black text-foreground">{item.score}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className="p-5 rounded-2xl bg-green-500/5 border border-green-500/10">
                      <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-3">Key Strengths</p>
                      <ul className="space-y-2">
                        {evaluation.feedback.strengths.slice(0, 3).map((s, i) => (
                          <li key={i} className="text-sm font-bold flex items-start gap-2 text-foreground/80 leading-relaxed">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-5 rounded-2xl bg-orange-500/5 border border-orange-500/10">
                      <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-3">Areas to Improve</p>
                      <ul className="space-y-2">
                        {evaluation.feedback.improvements.slice(0, 3).map((s, i) => (
                          <li key={i} className="text-sm font-bold flex items-start gap-2 text-foreground/80 leading-relaxed">
                            <div className="h-1.5 w-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {evaluation.corrections && evaluation.corrections.length > 0 && (
                  <div className="p-8 rounded-[2rem] border border-border bg-card shadow-sm">
                    <p className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Corrections
                    </p>
                    <div className="space-y-4">
                      {evaluation.corrections.map((c, i) => (
                        <div key={i} className="group p-4 rounded-2xl bg-secondary/30 border border-border/50 hover:border-primary/30 transition-all">
                          <p className="text-xs text-muted-foreground line-through mb-1.5 opacity-60 font-medium">{c.original}</p>
                          <p className="text-sm text-foreground font-bold mb-2.5 leading-relaxed">{c.correction}</p>
                          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-background/50 text-[11px] text-muted-foreground italic font-medium">
                            <AlertCircle className="h-3 w-3 mt-0.5 text-primary" />
                            {c.explanation}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-12 rounded-[2rem] border-2 border-dashed border-border/50 bg-secondary/5 text-center">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 relative">
                  <Sparkles className="h-10 w-10 text-primary/40" />
                  {evaluating && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-black mb-2 tracking-tight">Ready to Grade</h3>
                <p className="text-sm text-muted-foreground font-medium max-w-[200px] mx-auto">
                  Submit your writing to receive a detailed evaluation from our AI Trainer.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
