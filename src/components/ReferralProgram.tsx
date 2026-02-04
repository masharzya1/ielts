"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Users, Gift, Copy, Share2, CheckCircle2, Loader2, Trophy, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { bn } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export function ReferralProgram({ userId }: { userId: string }) {
  const [referralCode, setReferralCode] = useState('');
  const [referrals, setReferrals] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, successful: 0, rewards: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) fetchReferralData();
  }, [userId]);

  async function fetchReferralData() {
    setLoading(true);
    // Get or create referral code
    const { data: profile } = await supabase
      .from('profiles')
      .select('referral_code')
      .eq('id', userId)
      .maybeSingle();
    
    if (!profile?.referral_code) {
      const code = `ORCHIDS${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      await supabase
        .from('profiles')
        .update({ referral_code: code })
        .eq('id', userId);
      setReferralCode(code);
    } else {
      setReferralCode(profile.referral_code);
    }
    
    // Get referral stats
    const { data: refs } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false });
    
    if (refs) {
      setReferrals(refs);
      setStats({
        total: refs.length,
        successful: refs.filter(r => r.status === 'completed').length,
        rewards: refs.filter(r => r.reward_claimed).length
      });
    }
    setLoading(false);
  }

  const copyLink = () => {
    const link = `${window.location.origin}/register?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    toast.success('রেফারেল লিংক কপি হয়েছে!');
  };

  const shareToFacebook = () => {
    const link = `${window.location.origin}/register?ref=${referralCode}`;
    const text = `Orchids IELTS Mock Test এ জয়েন করো! আমার রেফারেল কোড ব্যবহার করে ২০% ডিসকাউন্ট পাও: ${link}`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}&quote=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading) return <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-10 font-hind-siliguri">
      <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-primary/20 via-primary/5 to-background border-2 border-primary/30 p-10 shadow-2xl shadow-primary/10">
        <div className="relative z-10 space-y-8">
          <div className="space-y-3 text-center sm:text-left">
            <h2 className="text-4xl font-black tracking-tight">বন্ধুদের নিয়ে আসুন, রিওয়ার্ড জিতুন! 🎁</h2>
            <p className="text-lg text-muted-foreground font-medium">
              প্রতিটি সফল রেফারেলে পাবেন <strong className="text-primary font-black">১ টি ফ্রি মক টেস্ট</strong>! 
              আপনার বন্ধুও পাবে <strong className="text-primary font-black">২০% ডিসকাউন্ট</strong>!
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 max-w-2xl">
            <div className="flex-1 relative group">
              <input
                type="text"
                value={`${window.location.origin}/register?ref=${referralCode}`}
                readOnly
                className="w-full h-16 px-6 pr-16 rounded-2xl border-2 border-primary/20 bg-background/50 font-mono font-bold text-sm focus:outline-none focus:border-primary/50 transition-all"
              />
              <button
                onClick={copyLink}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-xl bg-primary hover:bg-primary/90 flex items-center justify-center transition-all active:scale-90 shadow-lg shadow-primary/20"
              >
                <Copy className="h-5 w-5 text-black" />
              </button>
            </div>
            
            <Button
              onClick={shareToFacebook}
              className="h-16 px-10 rounded-2xl bg-[#1877F2] hover:bg-[#166FE5] text-white font-black flex items-center gap-3 transition-all shadow-xl shadow-blue-500/20"
            >
              <Share2 className="h-5 w-5" />
              শেয়ার করুন
            </Button>
          </div>
        </div>
        
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute -left-20 -top-20 w-60 h-60 bg-primary/10 rounded-full blur-[80px]" />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: "মোট রেফারেল", value: stats.total, icon: <Users />, color: "primary" },
          { label: "সফল হয়েছে", value: stats.successful, icon: <CheckCircle2 />, color: "green" },
          { label: "ফ্রি টেস্ট পেয়েছেন", value: stats.rewards, icon: <Gift />, color: "orange" }
        ].map((stat, i) => (
          <div key={i} className="p-8 rounded-[2.5rem] bg-secondary/20 border border-border/50 hover:border-primary/20 transition-all group">
            <div className="flex items-center gap-5">
              <div className={`h-14 w-14 rounded-2xl bg-${stat.color}-500/10 text-${stat.color}-500 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-4xl font-black text-foreground tracking-tighter">{stat.value}</p>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {referrals.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <h3 className="text-xl font-black tracking-tight">আপনার রেফারেল হিস্ট্রি</h3>
          </div>
          <div className="grid gap-3">
            {referrals.map(ref => (
              <div key={ref.id} className="flex items-center justify-between p-5 rounded-[2rem] bg-background border border-border/50 hover:border-primary/20 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-black text-primary border border-primary/10">
                    {ref.referee_email?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-black text-base">{ref.referee_email || 'পেন্ডিং ইউজার'}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                      {formatDistanceToNow(new Date(ref.created_at), { addSuffix: true, locale: bn })} জয়েন করেছেন
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {ref.status === 'completed' ? (
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20 px-4 py-1.5 rounded-xl font-black uppercase text-[9px] tracking-widest">
                      সফল ✓
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="px-4 py-1.5 rounded-xl font-black uppercase text-[9px] tracking-widest opacity-50">
                      অপেক্ষমাণ
                    </Badge>
                  )}
                  {ref.reward_claimed && (
                    <div className="h-10 w-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/5">
                      <Gift size={18} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
