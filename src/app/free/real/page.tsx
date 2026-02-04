"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Target, ArrowRight, Loader2, Clock, Headphones, BookOpen, PenTool, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Test {
  id: string;
  title: string;
  description: string;
  type: string;
  module: string;
  duration_minutes: number;
}

export default function RealSampleTestsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchTests() {
      const supabase = createClient();
      try {
        const { data, error } = await supabase
          .from("mock_tests")
          .select("*")
          .eq("is_free", true)
          .eq("test_category", "real_sample")
          .eq("is_published", true)
          .order("created_at", { ascending: false })
          .abortSignal(controller.signal);
        
        if (error) throw error;
        setTests(data || []);
      } catch (err: any) {
        if (err.name === "AbortError") return;
        console.error("Error fetching real sample tests:", err.message || err);
      } finally {
        setLoading(false);
      }
    }
    fetchTests();

    return () => controller.abort();
  }, []);

  const filteredTests = filter === "all" 
    ? tests 
    : tests.filter(t => t.module === filter || t.type === filter);

  const getModuleIcon = (module: string) => {
    switch(module) {
      case "listening": return <Headphones className="h-5 w-5" />;
      case "reading": return <BookOpen className="h-5 w-5" />;
      case "writing": return <PenTool className="h-5 w-5" />;
      default: return <Target className="h-5 w-5" />;
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
        <Link href="/free" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" /> ফ্রি সেকশনে ফিরুন
        </Link>

        <div className="text-center mb-12">
          <p className="text-xs font-black text-orange-500 mb-4 uppercase tracking-[0.25em]">ফ্রি স্যাম্পল</p>
          <h1 className="text-4xl md:text-5xl font-black mb-4">Real Sample Tests</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            আমাদের প্রিমিয়াম প্যাকেজ থেকে কিছু টেস্ট ফ্রিতে ট্রাই করুন। প্রিমিয়াম কিনলে ৪০+ টেস্ট পাবেন।
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {[
            { value: "all", label: "সব" },
            { value: "listening", label: "Listening" },
            { value: "reading", label: "Reading" },
            { value: "writing", label: "Writing" }
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setFilter(item.value)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                filter === item.value 
                  ? "bg-orange-500 text-white" 
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {filteredTests.length === 0 ? (
          <div className="text-center py-20">
            <Target className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-xl font-bold text-muted-foreground">কোনো টেস্ট পাওয়া যায়নি</p>
            <p className="text-muted-foreground">অ্যাডমিন শীঘ্রই টেস্ট যোগ করবেন</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTests.map((test) => (
              <div key={test.id} className="group p-6 rounded-2xl border border-orange-500/20 bg-orange-500/[0.02] hover:bg-orange-500/[0.05] hover:shadow-xl transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                    {getModuleIcon(test.module)}
                  </div>
                  <span className="text-xs font-black text-orange-500 uppercase tracking-wider">
                    {test.module || test.type}
                  </span>
                </div>
                <h3 className="text-lg font-bold mb-2 line-clamp-2">{test.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{test.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {test.duration_minutes || 60} মিনিট
                  </span>
                  <Button asChild size="sm" className="h-9 px-4 font-bold rounded-lg bg-orange-500 hover:bg-orange-600">
                      <Link href={`/free/real/${test.id}`}>
                        শুরু করুন <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-16 text-center p-10 rounded-3xl bg-orange-500/5 border border-orange-500/20">
          <h3 className="text-2xl font-bold mb-4">আরও টেস্ট চান?</h3>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            প্রিমিয়াম প্যাকেজে ৪০+ Reading, Listening ও Writing টেস্ট পাবেন।
          </p>
          <Button asChild className="h-12 px-8 font-bold rounded-xl bg-orange-500 hover:bg-orange-600">
            <Link href="/custom-subscription">প্রিমিয়াম কিনুন</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
