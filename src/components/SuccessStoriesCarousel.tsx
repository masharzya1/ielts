"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowRight, TrendingUp, Quote, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export function SuccessStoriesCarousel() {
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStories();
  }, []);

  async function fetchStories() {
    const { data } = await supabase
      .from("success_stories")
      .select("*")
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(6);
    setStories(data || []);
    setLoading(false);
  }

  if (loading || stories.length === 0) return null;

  return (
    <div className="py-24 relative overflow-hidden font-hind-siliguri">
      <div className="absolute inset-0 bg-primary/[0.02] -z-10" />
      
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
            <Star className="h-3 w-3 fill-current" />
            সফলতার গল্প
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight">আমাদের স্টুডেন্টরা কী বলছেন?</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            হাজার হাজার স্টুডেন্ট আমাদের প্ল্যাটফর্ম ব্যবহার করে তাদের কাঙ্ক্ষিত ব্যান্ড স্কোর অর্জন করেছেন।
          </p>
        </div>
        
        <Carousel className="w-full max-w-6xl mx-auto">
          <CarouselContent className="-ml-4">
            {stories.map(story => (
              <CarouselItem key={story.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                <div className="h-full p-8 rounded-[2.5rem] bg-background border border-border shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 flex flex-col group">
                  <div className="relative mb-8">
                    <Quote className="absolute -top-4 -left-4 h-12 w-12 text-primary/10 -rotate-12 transition-transform group-hover:rotate-0 duration-500" />
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-white font-black text-2xl shadow-lg border-2 border-white dark:border-gray-800">
                        {story.user_name[0]}
                      </div>
                      <div>
                        <h3 className="font-black text-lg group-hover:text-primary transition-colors">{story.user_name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-black">
                            BEFORE: {story.before_band}
                          </span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span className="px-2 py-0.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[10px] font-black">
                            AFTER: {story.after_band}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground leading-relaxed italic mb-8 flex-1">
                    "{story.story}"
                  </p>
                  
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/10 group-hover:bg-primary/10 transition-colors">
                    <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                      <TrendingUp className="h-5 w-5 text-black" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest">ব্যান্ড স্কোর উন্নতি</p>
                      <p className="text-lg font-black text-foreground">
                        {(story.after_band - story.before_band).toFixed(1)} ব্যান্ড বেশি পেয়েছেন
                      </p>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden md:block">
            <CarouselPrevious className="h-12 w-12 border-2" />
            <CarouselNext className="h-12 w-12 border-2" />
          </div>
        </Carousel>
      </div>
    </div>
  );
}
