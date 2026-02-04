"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { bn } from "date-fns/locale";
import { Activity, Zap, Trophy, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export function RecentActivityTicker() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();

    const subscription = supabase
      .channel("recent_activities")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "user_activities" }, (payload) => {
        setActivities(prev => [payload.new, ...prev].slice(0, 20));
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchActivities() {
    const { data } = await supabase
      .from("user_activities")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    
    setActivities(data || []);
    setLoading(false);
  }

  if (loading && activities.length === 0) return null;

  return (
    <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-6">
        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
          সাম্প্রতিক কার্যক্রম
        </h3>
      </div>
      
      <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-4 p-3 rounded-2xl bg-background/50 border border-border/50 transition-all hover:scale-[1.02] group">
            <div className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
              activity.activity_type.includes("completed") ? "bg-green-500/10 text-green-600" :
              activity.activity_type.includes("joined") ? "bg-blue-500/10 text-blue-600" :
              activity.activity_type.includes("achieved") ? "bg-yellow-500/10 text-yellow-600" :
              "bg-primary/10 text-primary"
            )}>
              {activity.activity_type.includes("completed") ? <Zap size={18} /> :
               activity.activity_type.includes("joined") ? <Users size={18} /> :
               activity.activity_type.includes("achieved") ? <Trophy size={18} /> :
               <Activity size={18} />}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">
                {activity.user_name}
              </p>
              <p className="text-xs text-muted-foreground leading-snug mt-0.5">
                <span className="font-medium text-foreground/70">{activity.activity_type}</span>{" "}
                <span className="font-black text-primary">{activity.test_name}</span>
              </p>
              <p className="text-[10px] text-muted-foreground/50 font-bold mt-1 uppercase tracking-wider">
                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: bn })}
              </p>
            </div>
          </div>
        ))}
        
        {activities.length === 0 && (
          <div className="text-center py-10 opacity-30">
            <Activity className="mx-auto mb-2" size={24} />
            <p className="text-xs font-bold">কোনো কার্যক্রম নেই</p>
          </div>
        )}
      </div>
    </div>
  );
}
