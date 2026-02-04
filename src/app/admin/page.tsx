import { createClient } from "@/lib/supabase/server";
import { Users, BookOpen, CreditCard, ArrowRight, Calendar, Zap, Brain, Target, Tag, BookmarkIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const { count: userCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

    const { count: testCount } = await supabase
      .from("mock_tests")
      .select("*", { count: "exact", head: true });

  const { count: vocabCount } = await supabase
    .from("vocabulary_words")
    .select("*", { count: "exact", head: true });

  const { data: recentPurchases } = await supabase
    .from("user_purchases")
    .select("*, profiles(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(5);

  const stats = [
    { label: "মোট ইউজার", value: userCount || 0, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "টেস্ট", value: testCount || 0, icon: BookOpen, color: "text-primary", bg: "bg-primary/10" },
    { label: "ভোকাব", value: vocabCount || 0, icon: Brain, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "মোট বিক্রি", value: recentPurchases?.length || 0, icon: CreditCard, color: "text-orange-500", bg: "bg-orange-500/10" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">অ্যাডমিন ড্যাশবোর্ড</h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">কন্টেন্ট ম্যানেজমেন্ট সিস্টেম</p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" className="h-10 px-4 rounded-xl font-bold text-sm">
            <Link href="/" className="flex items-center gap-2">
              সাইট দেখুন
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card border border-border/50 rounded-2xl p-5 md:p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className={`h-11 w-11 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-black tracking-tight">{stat.value}</p>
            <p className="text-xs font-bold text-muted-foreground mt-1 uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <Link href="/admin/practice" className="group relative bg-card border border-border/50 p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 overflow-hidden">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-black">প্র্যাকটিস</h2>
              </div>
              <p className="text-muted-foreground text-sm mb-4">প্র্যাকটিস টেস্ট ম্যানেজ করুন</p>
              <div className="flex items-center text-primary font-bold text-sm">
                Manage <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link href="/admin/mock" className="group relative bg-card border border-border/50 p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 overflow-hidden">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-orange-500/10 text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500">
                  <Target className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-black">মক টেস্ট</h2>
              </div>
              <p className="text-muted-foreground text-sm mb-4">লাইভ মক টেস্ট ম্যানেজ</p>
              <div className="flex items-center text-orange-500 font-bold text-sm">
                Manage <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

          <Link href="/admin/vocab" className="group relative bg-card border border-border/50 p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 overflow-hidden">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-all duration-500">
                <Brain className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-black">ভোকাব</h2>
            </div>
            <p className="text-muted-foreground text-sm mb-4">ভোকাবুলারি ম্যানেজ</p>
            <div className="flex items-center text-purple-500 font-bold text-sm">
              Manage <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

            <Link href="/admin/pricing" className="group relative bg-card border border-border/50 p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 overflow-hidden">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500">
                  <Tag className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-black">প্রাইসিং</h2>
              </div>
              <p className="text-muted-foreground text-sm mb-4">প্রাইস ও কুপন ম্যানেজ</p>
              <div className="flex items-center text-emerald-500 font-bold text-sm">
                Manage <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

              <Link href="/admin/pre-bookings" className="group relative bg-card border border-border/50 p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 overflow-hidden">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all duration-500">
                    <BookmarkIcon className="h-6 w-6" />
                  </div>
                  <h2 className="text-lg font-black">প্রি-বুকিং</h2>
                </div>
                <p className="text-muted-foreground text-sm mb-4">ইউজার প্রি-বুকিং লিস্ট</p>
                <div className="flex items-center text-blue-500 font-bold text-sm">
                  View List <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
          </div>


      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-border/50 bg-secondary/30">
            <h3 className="text-base font-black flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              কুইক অ্যাকশন
            </h3>
          </div>
          <div className="p-4 space-y-2">
            <Button asChild variant="outline" className="w-full h-auto p-4 justify-start rounded-xl border-border/50 hover:bg-secondary/50">
                <Link href="/admin/mock" className="flex flex-col items-start gap-0.5">
                  <span className="font-bold text-sm">নতুন মক যোগ করুন</span>
                  <span className="text-xs text-muted-foreground">Create a mock test</span>
                </Link>
              </Button>
            <Button asChild variant="outline" className="w-full h-auto p-4 justify-start rounded-xl border-border/50 hover:bg-secondary/50">
              <Link href="/admin/users" className="flex flex-col items-start gap-0.5">
                <span className="font-bold text-sm">ইউজার ম্যানেজমেন্ট</span>
                <span className="text-xs text-muted-foreground">Manage accounts</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full h-auto p-4 justify-start rounded-xl border-border/50 hover:bg-secondary/50">
              <Link href="/admin/settings" className="flex flex-col items-start gap-0.5">
                <span className="font-bold text-sm">সেটিংস</span>
                <span className="text-xs text-muted-foreground">Configure settings</span>
              </Link>
            </Button>
          </div>
        </div>

        <div className="lg:col-span-2 bg-card border border-border/50 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-border/50 bg-secondary/30 flex items-center justify-between">
            <h2 className="text-base font-black flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              সাম্প্রতিক ক্রয়
            </h2>
            <Link href="/admin/analytics" className="text-xs font-bold text-primary hover:underline">
              সব দেখুন
            </Link>
          </div>
          <div className="p-4">
            {recentPurchases && recentPurchases.length > 0 ? (
              <div className="space-y-3">
                {recentPurchases.map((purchase: any) => (
                    <div key={purchase.id} className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/30 hover:bg-secondary/50 transition-colors">
                      <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm truncate">{purchase.profiles?.full_name || purchase.profiles?.email || "Unknown User"}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {purchase.item_type === "practice_all" ? "All Practice Modules" : 
                             purchase.item_type === "practice_module" ? `Practice: ${purchase.module_slug ? (purchase.module_slug.charAt(0).toUpperCase() + purchase.module_slug.slice(1)) : "Module"}` :
                             purchase.item_type === "mock" || purchase.item_type === "mock_test" ? `Mock: ${purchase.mock_tests?.title || "Test"}` :
                             purchase.item_type === "custom" ? "Custom Package" :
                             purchase.item_type}
                          </p>
                        </div>
                    <div className="text-right ml-4">
                      <p className="font-black text-primary">৳{Number(purchase.amount).toFixed(0)}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
                        <Calendar className="h-3 w-3" />
                        {new Date(purchase.created_at).toLocaleDateString('bn-BD')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-bold text-sm">কোনো ক্রয় পাওয়া যায়নি</p>
                <p className="text-xs mt-1">নতুন ক্রয় এখানে দেখা যাবে</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
