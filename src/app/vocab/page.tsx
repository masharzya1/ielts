"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Brain, Volume2, ChevronLeft, ChevronRight, RotateCcw, CheckCircle2, Loader2, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Word {
  id: string;
  word: string;
  meaning_bn: string;
  meaning_en: string;
  example_sentence: string;
  pronunciation: string;
  part_of_speech: string;
  is_free: boolean;
}

export default function VocabPage() {
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [learned, setLearned] = useState<Set<string>>(new Set());
  const [hasPremium, setHasPremium] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    async function fetchData() {
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      let isPremium = false;
      
      if (user) {
        const { data: purchase } = await supabase
          .from("user_purchases")
          .select("*")
          .eq("user_id", user.id)
          .eq("item_type", "vocab_premium")
          .eq("status", "active")
          .gte("expires_at", new Date().toISOString())
          .maybeSingle();
        
        isPremium = !!purchase;
        setHasPremium(isPremium);
      }

      const query = supabase
        .from("vocabulary_words")
        .select("*")
        .order("created_at", { ascending: true });
      
      const { data } = isPremium
        ? await query
        : await query.eq("is_free", true);
      
      setWords(data || []);
      setLoading(false);
    }
    
    fetchData();
  }, []);

  const currentWord = words[currentIndex];

  const nextCard = useCallback(() => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
    }, 150);
  }, [words.length]);

  const prevCard = useCallback(() => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + words.length) % words.length);
    }, 150);
  }, [words.length]);

  const markAsLearned = () => {
    if (currentWord) {
      setLearned((prev) => new Set(prev).add(currentWord.id));
      nextCard();
    }
  };

  const speakWord = () => {
    if (currentWord && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(currentWord.word);
      utterance.lang = "en-US";
      speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevCard();
      if (e.key === "ArrowRight") nextCard();
      if (e.key === " ") {
        e.preventDefault();
        setIsFlipped((f) => !f);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextCard, prevCard]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-hind-siliguri">
      <div className="container max-w-4xl mx-auto px-4 py-12 md:py-20">
        <div className="text-center mb-12">
          <p className="text-xs font-black text-blue-500 mb-4 uppercase tracking-[0.25em]">শব্দ ভাণ্ডার</p>
          <h1 className="text-4xl md:text-5xl font-black mb-4">ভোকাবুলারি</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              ফ্ল্যাশকার্ডে IELTS শব্দ শিখুন। {!hasPremium ? "১০০টি শব্দ সম্পূর্ণ ফ্রি!" : `${words.length}টি শব্দ`}
            </p>
        </div>

        <div className="flex justify-center gap-4 mb-8">
          <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-secondary/50 text-sm">
            <span className="font-bold text-muted-foreground">প্রগ্রেস:</span>
            <span className="font-black text-primary">{currentIndex + 1}/{words.length}</span>
          </div>
          <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-green-500/10 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="font-black text-green-500">{learned.size} শেখা হয়েছে</span>
          </div>
        </div>

        {words.length === 0 ? (
          <div className="text-center py-20">
            <Brain className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-xl font-bold text-muted-foreground">কোনো শব্দ পাওয়া যায়নি</p>
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-8">
              <div 
                className="relative w-full max-w-md h-80 cursor-pointer perspective-1000"
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <div className={`absolute inset-0 transition-transform duration-500 transform-style-3d ${isFlipped ? "rotate-y-180" : ""}`}>
                  <div className="absolute inset-0 backface-hidden">
                    <div className="h-full rounded-3xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-transparent p-8 flex flex-col items-center justify-center">
                      <button 
                        onClick={(e) => { e.stopPropagation(); speakWord(); }}
                        className="absolute top-4 right-4 h-10 w-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all"
                      >
                        <Volume2 className="h-5 w-5" />
                      </button>
                      <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-4">
                        {currentWord?.part_of_speech}
                      </p>
                      <h2 className="text-4xl md:text-5xl font-black mb-3">{currentWord?.word}</h2>
                      <p className="text-sm text-muted-foreground">{currentWord?.pronunciation}</p>
                      <p className="text-xs text-muted-foreground mt-8 opacity-60">ক্লিক করে অর্থ দেখুন</p>
                    </div>
                  </div>
                  <div className="absolute inset-0 backface-hidden rotate-y-180">
                    <div className="h-full rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-8 flex flex-col items-center justify-center">
                      <p className="text-xs font-bold text-primary uppercase tracking-wider mb-4">অর্থ</p>
                      <h3 className="text-2xl font-bold mb-2 text-center">{currentWord?.meaning_bn}</h3>
                      <p className="text-sm text-muted-foreground mb-6">{currentWord?.meaning_en}</p>
                      <div className="p-4 rounded-xl bg-secondary/50 w-full">
                        <p className="text-xs font-bold text-muted-foreground mb-2">উদাহরণ:</p>
                        <p className="text-sm italic">&quot;{currentWord?.example_sentence}&quot;</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-4 mb-12">
              <Button variant="outline" size="lg" className="h-14 w-14 rounded-2xl" onClick={prevCard}>
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="h-14 px-6 rounded-2xl font-bold"
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                ফ্লিপ
              </Button>
              <Button 
                size="lg" 
                className="h-14 px-6 rounded-2xl font-bold bg-green-500 hover:bg-green-600"
                onClick={markAsLearned}
              >
                <CheckCircle2 className="h-5 w-5 mr-2" />
                শিখেছি
              </Button>
              <Button variant="outline" size="lg" className="h-14 w-14 rounded-2xl" onClick={nextCard}>
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
          </>
        )}

        {!hasPremium && (
          <div className="p-8 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent text-center">
            <Lock className="h-10 w-10 mx-auto text-primary mb-4" />
            <h3 className="text-xl font-bold mb-2">আরও শব্দ চান?</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              প্রিমিয়াম ভোকাব প্যাকেজে ৫০০+ শব্দ ও প্রতি সপ্তাহে নতুন ৮-১০টি শব্দ পাবেন।
            </p>
            <Button asChild className="h-12 px-8 font-bold rounded-xl">
              <Link href="/custom-subscription">
                প্রিমিয়াম কিনুন <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}

        <div className="mt-12 text-center text-xs text-muted-foreground space-x-6">
          <span>← → কার্ড নেভিগেশন</span>
          <span>Space ফ্লিপ</span>
        </div>
      </div>

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}
