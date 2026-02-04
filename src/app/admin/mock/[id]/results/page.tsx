"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  ArrowLeft, 
  Loader2, 
  Search, 
  Mail, 
  CheckCircle2, 
  AlertCircle,
  Save,
  Send,
  Eye,
  Trophy
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function AdminMockResultsPage({ params }: { params: any }) {
  const [testId, setTestId] = useState<string>("");

  useEffect(() => {
    async function unwrapParams() {
      const p = await params;
      setTestId(p.id);
    }
    unwrapParams();
  }, [params]);
  
  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (!testId) return;
    fetchData();
  }, [testId]);

  async function fetchData() {
    const supabase = createClient();
    
    const { data: testData } = await supabase
      .from("mock_tests")
      .select("*")
      .eq("id", testId)
      .maybeSingle();
    
    setTest(testData);

    const { data: resultsData } = await supabase
      .from("mock_results")
      .select(`
        *,
        profiles:user_id (full_name, email)
      `)
      .eq("test_id", testId)
      .order("created_at", { ascending: false });
    
    setResults(resultsData || []);
    setLoading(false);
  }

  const handleUpdateScore = async (resultId: string, updates: any) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("mock_results")
      .update(updates)
      .eq("id", resultId);
    
    if (error) {
      toast.error("স্কোর আপডেট করতে ব্যর্থ হয়েছে");
    } else {
      toast.success("স্কোর আপডেট হয়েছে");
      setResults(results.map(r => r.id === resultId ? { ...r, ...updates } : r));
    }
  };

  const handlePublishAll = async () => {
    if (!confirm("আপনি কি নিশ্চিত যে আপনি সব রেজাল্ট পাবলিশ করতে চান? এটি সবার কাছে ইমেইল পাঠিয়ে দিবে।")) return;
    
    setIsPublishing(true);
    const supabase = createClient();
    
    try {
      // 1. Update all results to published
      const { error: updateError } = await supabase
        .from("mock_results")
        .update({ is_published: true })
        .eq("test_id", testId)
        .eq("is_published", false);
      
      if (updateError) throw updateError;

      // 2. Trigger email notification (via API)
      const unpublishedResults = results.filter(r => !r.is_published);
      
      for (const res of unpublishedResults) {
        if (!res.profiles?.email) continue;
        
        await fetch("/api/emails/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: res.profiles.email,
            subject: `আপনার মক টেস্ট রেজাল্ট - ${test.title}`,
            template: "mock-result",
            data: {
              name: res.profiles.full_name || "User",
              testTitle: test.title,
              overallBand: res.overall_band?.toFixed(1) || "0.0",
              reading: res.reading_score || 0,
              listening: res.listening_score || 0,
              writing: res.writing_score || 0,
              resultUrl: `${window.location.origin}/mock/${testId}/result`
            }
          })
        });
        
        // Mark as email sent
        await supabase
          .from("mock_results")
          .update({ email_sent: true })
          .eq("id", res.id);
      }

      toast.success("সব রেজাল্ট পাবলিশ ও ইমেইল পাঠানো হয়েছে");
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsPublishing(false);
    }
  };

  const filteredResults = results.filter(r => 
    r.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.profiles?.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 font-hind-siliguri max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <Link href={`/admin/mock`} className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" /> ফিরে যান
          </Link>
          <h1 className="text-3xl font-black tracking-tight">{test?.title} - রেজাল্ট ম্যানেজমেন্ট</h1>
          <p className="text-muted-foreground font-medium">শিক্ষার্থীদের স্কোর দেখুন এবং রেজাল্ট পাবলিশ করুন</p>
        </div>
        
        <Button 
          onClick={handlePublishAll} 
          disabled={isPublishing || results.filter(r => !r.is_published).length === 0}
          className="h-14 px-8 font-black rounded-2xl shadow-xl gap-2"
        >
          {isPublishing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
          সব পাবলিশ ও ইমেইল করুন ({results.filter(r => !r.is_published).length})
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-10">
        <Card className="p-6 rounded-2xl bg-primary/5 border-primary/20">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">মোট অংশগ্রহণকারী</p>
          <div className="text-4xl font-black">{results.length} জন</div>
        </Card>
        <Card className="p-6 rounded-2xl bg-green-500/5 border-green-500/20">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">পাবলিশ করা হয়েছে</p>
          <div className="text-4xl font-black text-green-600">{results.filter(r => r.is_published).length} জন</div>
        </Card>
        <Card className="p-6 rounded-2xl bg-orange-500/5 border-orange-500/20">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">পেন্ডিং রেজাল্ট</p>
          <div className="text-4xl font-black text-orange-600">{results.filter(r => !r.is_published).length} জন</div>
        </Card>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input 
          placeholder="নাম বা ইমেইল দিয়ে সার্চ করুন..." 
          className="h-14 pl-12 rounded-2xl border-border/50"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/30 border-b border-border/50">
                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-muted-foreground">শিক্ষার্থী</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-muted-foreground">Reading</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-muted-foreground">Listening</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-muted-foreground">Writing</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-muted-foreground">Overall</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-muted-foreground">স্ট্যাটাস</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-muted-foreground">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredResults.map((res) => (
                <tr key={res.id} className="hover:bg-secondary/10 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold">{res.profiles?.full_name || "Unknown"}</div>
                    <div className="text-xs text-muted-foreground">{res.profiles?.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <Input 
                      type="number" 
                      step="0.5" 
                      className="w-20 h-9 font-bold" 
                      defaultValue={res.reading_score}
                      onBlur={(e) => handleUpdateScore(res.id, { reading_score: parseFloat(e.target.value) })}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <Input 
                      type="number" 
                      step="0.5" 
                      className="w-20 h-9 font-bold" 
                      defaultValue={res.listening_score}
                      onBlur={(e) => handleUpdateScore(res.id, { listening_score: parseFloat(e.target.value) })}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <Input 
                      type="number" 
                      step="0.5" 
                      className="w-20 h-9 font-bold" 
                      defaultValue={res.writing_score}
                      onBlur={(e) => handleUpdateScore(res.id, { writing_score: parseFloat(e.target.value) })}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <Input 
                      type="number" 
                      step="0.5" 
                      className="w-20 h-9 font-bold text-primary" 
                      defaultValue={res.overall_band}
                      onBlur={(e) => handleUpdateScore(res.id, { overall_band: parseFloat(e.target.value) })}
                    />
                  </td>
                  <td className="px-6 py-4">
                    {res.is_published ? (
                      <Badge className="bg-green-500/10 text-green-600 border-none font-bold">Published</Badge>
                    ) : (
                      <Badge className="bg-orange-500/10 text-orange-600 border-none font-bold">Pending</Badge>
                    )}
                    {res.email_sent && (
                      <div className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 mt-1">
                        <Mail className="h-3 w-3" /> Email Sent
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/mock/${test.slug}/results?resultId=${res.id}`} target="_blank">
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      {!res.is_published && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-primary"
                          onClick={() => handleUpdateScore(res.id, { is_published: true })}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
