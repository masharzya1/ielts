"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Trophy, Users, Star, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { bn } from "date-fns/locale";

export function LiveLeaderboard({ testId }: { testId: string }) {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchData();

    const subscription = supabase
      .channel(`leaderboard_${testId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "mock_results", filter: `test_id=eq.${testId}` }, () => {
        fetchLeaderboard();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [testId]);

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    await fetchLeaderboard();
  }

  async function fetchLeaderboard() {
    const { data } = await supabase
      .from("mock_results")
      .select(`
        *,
        profiles!inner (
          id,
          full_name,
          avatar_url,
          email
        )
      `)
      .eq("test_id", testId)
      .eq("is_published", true)
      .order("overall_band", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(50);
    
    if (data) {
      setLeaderboard(data);
      const myRank = data.findIndex(r => r.user_id === user?.id);
      setUserRank(myRank >= 0 ? myRank + 1 : null);
    }
    setLoading(false);
  }

  if (loading) return <div className="h-64 flex items-center justify-center text-primary font-bold">লিডারবোর্ড লোড হচ্ছে...</div>;

  return (
    <div className="space-y-6 font-hind-siliguri">
      {userRank && (
        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-primary/20 via-primary/5 to-background border-2 border-primary/30 shadow-2xl shadow-primary/10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="absolute inset-0 bg-primary blur-2xl opacity-20 animate-pulse" />
                <div className="relative text-6xl font-black text-primary tracking-tighter">#{userRank}</div>
              </div>
              <div>
                <p className="font-black text-xl mb-1">আপনার অবস্থান</p>
                <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">
                  মোট {leaderboard.length} জন অংশগ্রহণকারীর মধ্যে
                </p>
              </div>
            </div>
            <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20">
              <Trophy className="h-8 w-8 text-black" />
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {leaderboard.map((entry, idx) => (
          <div
            key={entry.id}
            className={cn(
              "flex items-center gap-4 p-4 rounded-3xl transition-all hover:scale-[1.01] border group",
              idx === 0 && "bg-gradient-to-r from-yellow-400/20 to-yellow-500/5 border-yellow-500/30 shadow-lg shadow-yellow-500/5",
              idx === 1 && "bg-gradient-to-r from-slate-400/20 to-slate-500/5 border-slate-500/30 shadow-lg shadow-slate-500/5",
              idx === 2 && "bg-gradient-to-r from-orange-400/20 to-orange-500/5 border-orange-500/30 shadow-lg shadow-orange-500/5",
              idx > 2 && "bg-secondary/20 border-border/50",
              entry.user_id === user?.id && "border-primary ring-2 ring-primary/20 ring-offset-2 ring-offset-background"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg border-2 shrink-0 transition-transform group-hover:rotate-6",
              idx === 0 && "bg-yellow-400 border-yellow-500 text-black",
              idx === 1 && "bg-slate-300 border-slate-400 text-black",
              idx === 2 && "bg-orange-300 border-orange-400 text-black",
              idx > 2 && "bg-background border-border text-foreground"
            )}>
              {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}
            </div>

            <div className="relative shrink-0">
              {entry.profiles?.avatar_url ? (
                <img src={entry.profiles.avatar_url} alt="" className="h-12 w-12 rounded-2xl object-cover border-2 border-white dark:border-gray-800 shadow-sm" />
              ) : (
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-white font-black text-xl shadow-sm border-2 border-white dark:border-gray-800">
                  {entry.profiles?.full_name?.[0] || entry.profiles?.email?.[0]?.toUpperCase() || "?"}
                </div>
              )}
              {idx < 3 && (
                <div className="absolute -top-2 -right-2 bg-background rounded-full p-1 border border-border shadow-sm">
                  <Star className={cn("h-3 w-3 fill-current", idx === 0 ? "text-yellow-500" : idx === 1 ? "text-slate-400" : "text-orange-500")} />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-black text-base truncate group-hover:text-primary transition-colors">
                {entry.profiles?.full_name || entry.profiles?.email?.split("@")[0]}
                {entry.user_id === user?.id && <span className="ml-2 text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full uppercase">You</span>}
              </p>
              <p className="text-[10px] text-muted-foreground font-bold flex items-center gap-1.5 uppercase tracking-widest">
                {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true, locale: bn })}
              </p>
            </div>

            <div className="text-right">
              <div className="flex flex-col items-end">
                <span className={cn(
                  "text-3xl font-black tracking-tighter leading-none",
                  idx === 0 ? "text-yellow-600" : idx === 1 ? "text-slate-600" : idx === 2 ? "text-orange-600" : "text-primary"
                )}>
                  {typeof entry.overall_band === 'number' ? entry.overall_band.toFixed(1) : "0.0"}
                </span>
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">Band Score</span>
              </div>
            </div>
          </div>
        ))}

        {leaderboard.length === 0 && (
          <div className="text-center py-20 bg-secondary/10 rounded-[3rem] border-2 border-dashed border-border/50">
            <Users className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
            <p className="font-black text-muted-foreground opacity-50 uppercase tracking-widest">রেজাল্ট পাবলিশ হওয়ার জন্য অপেক্ষা করুন</p>
          </div>
        )}
      </div>
    </div>
  );
}
