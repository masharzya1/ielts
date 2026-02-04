"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { BookOpen, Target, Zap, Brain, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FreeTest {
  id: string;
  title: string;
  description: string;
  type: string;
  module: string;
  is_cambridge: boolean;
  free_section_type: string;
  is_micro: boolean;
}

export default function FreePage() {
  const [cambridgeTests, setCambridgeTests] = useState<FreeTest[]>([]);
  const [realTests, setRealTests] = useState<FreeTest[]>([]);
  const [microTests, setMicroTests] = useState<FreeTest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFreeTests() {
      const supabase = createClient();
      
        const { data: cambridge } = await supabase
          .from("mock_tests")
          .select("*")
          .eq("is_free", true)
          .eq("is_cambridge", true)
          .eq("is_published", true);
        
        const { data: real } = await supabase
          .from("mock_tests")
          .select("*")
          .eq("is_free", true)
          .eq("test_category", "real_sample")
          .eq("is_published", true);
        
        const { data: micro } = await supabase
          .from("mock_tests")
          .select("*")
          .eq("is_free", true)
          .eq("is_micro", true)
          .eq("is_published", true);
      
      setCambridgeTests(cambridge || []);
      setRealTests(real || []);
      setMicroTests(micro || []);
      setLoading(false);
    }
    
    fetchFreeTests();
  }, []);

  const sections = [
    {
      title: "Cambridge Tests",
      titleBn: "ক্যামব্রিজ টেস্ট",
      description: "অফিসিয়াল Cambridge IELTS টেস্ট থেকে প্র্যাকটিস করুন",
      icon: <BookOpen className="h-6 w-6" />,
      href: "/free/cambridge",
      count: cambridgeTests.length,
      color: "primary",
      tests: cambridgeTests.slice(0, 3)
    },
    {
      title: "Real Sample Tests",
      titleBn: "রিয়েল স্যাম্পল",
      description: "আমাদের প্রিমিয়াম প্যাকেজ থেকে ফ্রি স্যাম্পল টেস্ট",
      icon: <Target className="h-6 w-6" />,
      href: "/free/real",
      count: realTests.length,
      color: "orange",
      tests: realTests.slice(0, 3)
    },
    {
      title: "Micro Tests",
      titleBn: "মাইক্রো টেস্ট",
      description: "ছোট ছোট দ্রুত প্র্যাকটিস টেস্ট",
      icon: <Zap className="h-6 w-6" />,
      href: "/free/micro",
      count: microTests.length,
      color: "blue",
      tests: microTests.slice(0, 3)
    }
  ];

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
          <p className="text-xs font-black text-primary mb-4 uppercase tracking-[0.25em]">ফ্রি রিসোর্স</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tight">
            ফ্রি সেকশন
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            লগইন ছাড়াই শুরু করুন। এগুলো আমাদের প্রিমিয়াম প্যাকেজের স্যাম্পল—ট্রাই করে দেখুন কেমন!
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {sections.map((section, i) => (
            <Link 
              key={i}
              href={section.href}
              className={`group p-8 rounded-3xl border transition-all duration-300 hover:shadow-2xl
                ${section.color === 'primary' ? 'border-primary/20 bg-primary/[0.03] hover:bg-primary/[0.08]' : ''}
                ${section.color === 'orange' ? 'border-orange-500/20 bg-orange-500/[0.03] hover:bg-orange-500/[0.08]' : ''}
                ${section.color === 'blue' ? 'border-blue-500/20 bg-blue-500/[0.03] hover:bg-blue-500/[0.08]' : ''}
              `}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all
                  ${section.color === 'primary' ? 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground' : ''}
                  ${section.color === 'orange' ? 'bg-orange-500/10 text-orange-500 group-hover:bg-orange-500 group-hover:text-white' : ''}
                  ${section.color === 'blue' ? 'bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white' : ''}
                `}>
                  {section.icon}
                </div>
                <span className={`text-sm font-black px-3 py-1.5 rounded-full
                  ${section.color === 'primary' ? 'bg-primary/10 text-primary' : ''}
                  ${section.color === 'orange' ? 'bg-orange-500/10 text-orange-500' : ''}
                  ${section.color === 'blue' ? 'bg-blue-500/10 text-blue-500' : ''}
                `}>
                  {section.count}টি টেস্ট
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-2">{section.titleBn}</h3>
              <p className="text-sm text-muted-foreground mb-6">{section.description}</p>
              <div className="flex items-center gap-2 text-sm font-bold group-hover:underline">
                সব দেখুন <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>

        <div className="p-8 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Brain className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">ফ্রি ভোকাবুলারি</h3>
                <p className="text-sm text-muted-foreground">১০০টি শব্দ সম্পূর্ণ ফ্রি শিখুন</p>
              </div>
            </div>
            <Button asChild className="h-12 px-8 font-bold rounded-xl">
              <Link href="/vocab">
                শব্দ শিখুন <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-16 text-center p-10 rounded-3xl bg-secondary/30 border border-border/30">
          <h3 className="text-2xl font-bold mb-4">প্রিমিয়াম প্যাকেজে আগ্রহী?</h3>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            ফ্রি সেকশন পছন্দ হলে আমাদের প্রিমিয়াম প্যাকেজে ৪০+ টেস্ট, লাইভ মক, এআই ইভ্যালুয়েশন ও আরও অনেক কিছু পাবেন।
          </p>
          <Button asChild variant="outline" className="h-12 px-8 font-bold rounded-xl">
            <Link href="/custom-subscription">কাস্টম সাবস্ক্রিপশন দেখুন</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
