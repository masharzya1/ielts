"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, Lock, Award, Zap, Trophy, Calendar, Flame, Ghost, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const BADGES: Record<string, { icon: React.ReactNode, title: string, description: string }> = {
  FIRST_TEST: {
    icon: <Target className="h-8 w-8 text-blue-500" />,
    title: "First Step",
    description: "প্রথম মক টেস্ট সম্পন্ন করেছেন"
  },
  FIVE_TESTS: {
    icon: <Flame className="h-8 w-8 text-orange-500" />,
    title: "Consistent Learner",
    description: "৫টি মক টেস্ট সম্পন্ন করেছেন"
  },
  BAND_7_PLUS: {
    icon: <Award className="h-8 w-8 text-yellow-500" />,
    title: "High Achiever",
    description: "৭+ ব্যান্ড স্কোর অর্জন করেছেন"
  },
  PERFECT_ATTENDANCE: {
    icon: <Calendar className="h-8 w-8 text-green-500" />,
    title: "Perfect Attendance",
    description: "পরপর ৩টি লাইভ টেস্টে উপস্থিত ছিলেন"
  },
  SPEED_DEMON: {
    icon: <Zap className="h-8 w-8 text-purple-500" />,
    title: "Speed Demon",
    description: "সময়ের আগেই মডিউল শেষ করেছেন"
  },
  NIGHT_OWL: {
    icon: <Ghost className="h-8 w-8 text-indigo-500" />,
    title: "Night Owl",
    description: "রাত ১২টার পর টেস্ট দিয়েছেন"
  }
};

export function BadgeShowcase({ userId }: { userId: string }) {
  const [earnedBadges, setEarnedBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) fetchBadges();
  }, [userId]);

  async function fetchBadges() {
    const { data } = await supabase
      .from("user_achievements")
      .select("*")
      .eq("user_id", userId)
      .order("earned_at", { ascending: false });
    
    setEarnedBadges(data || []);
    setLoading(false);
  }

  if (loading) return <div className="h-48 flex items-center justify-center"><Zap className="animate-spin text-primary" /></div>;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {Object.entries(BADGES).map(([key, badge]) => {
        const earned = earnedBadges.find(b => b.badge_type === key);
        return (
          <div 
            key={key}
            className={cn(
              "relative group p-6 rounded-[2rem] border-2 transition-all cursor-pointer overflow-hidden",
              earned 
                ? "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 hover:border-primary/50 hover:scale-105 shadow-xl shadow-primary/5" 
                : "bg-secondary/20 border-border/50 opacity-50 grayscale hover:opacity-70 transition-all"
            )}
          >
            {earned && (
              <div className="absolute -right-4 -top-4 w-12 h-12 bg-primary rotate-45 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-black -rotate-45" />
              </div>
            )}
            
            <div className="flex flex-col items-center text-center space-y-3">
              <div className={cn(
                "h-16 w-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500",
                earned ? "bg-white dark:bg-black/50 shadow-lg" : "bg-muted"
              )}>
                {badge.icon}
              </div>
              <div>
                <h4 className="font-black text-sm mb-1">{badge.title}</h4>
                <p className="text-[10px] text-muted-foreground font-bold leading-tight">
                  {badge.description}
                </p>
              </div>
            </div>

            {!earned && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                <Lock className="h-6 w-6 text-white" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Utility to check and award badges
export async function checkAndAwardBadges(userId: string) {
  try {
    // Fetch user stats
    const { data: results } = await supabase
      .from("mock_results")
      .select("*")
      .eq("user_id", userId)
      .eq("is_published", true);
    
    if (!results) return;

    const stats = {
      completed_tests: results.length,
      highest_band: Math.max(...results.map(r => r.overall_band || 0)),
      early_submissions: results.filter(r => r.metadata?.early_submit).length,
      late_night_tests: results.filter(r => {
        const hour = new Date(r.created_at).getHours();
        return hour >= 0 && hour < 5;
      }).length
    };

    const awardQueue: string[] = [];

    if (stats.completed_tests >= 1) awardQueue.push("FIRST_TEST");
    if (stats.completed_tests >= 5) awardQueue.push("FIVE_TESTS");
    if (stats.highest_band >= 7) awardQueue.push("BAND_7_PLUS");
    if (stats.early_submissions >= 5) awardQueue.push("SPEED_DEMON");
    if (stats.late_night_tests >= 3) awardQueue.push("NIGHT_OWL");

    for (const badgeKey of awardQueue) {
      const { data: existing } = await supabase
        .from("user_achievements")
        .select("id")
        .eq("user_id", userId)
        .eq("badge_type", badgeKey)
        .maybeSingle();
      
      if (!existing) {
        await supabase.from("user_achievements").insert({
          user_id: userId,
          badge_type: badgeKey,
          earned_at: new Date().toISOString()
        });

        toast.success(`নতুন অর্জন: ${BADGES[badgeKey].title}! 🎉`, {
          description: BADGES[badgeKey].description,
          duration: 5000
        });
      }
    }
  } catch (err) {
    console.error("Error awarding badges:", err);
  }
}
