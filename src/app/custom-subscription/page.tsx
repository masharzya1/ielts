"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  CheckCircle2, 
  Loader2, 
  CreditCard, 
  Plus, 
  Calendar, 
  BookOpen, 
  Zap, 
  Target, 
  Award, 
  Sparkles, 
  Brain,
  Minus,
  ArrowRight,
  ShieldCheck,
  Headphones,
  Pen
} from "lucide-react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { toast } from "sonner";

interface Module {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

interface MockTest {
  id: string;
  title: string;
  module: string;
  price: number;
}

interface Coupon {
  id: string;
  code: string;
  discount_percent: number;
  min_amount: number;
}

interface FixedPlan {
  item_type: string;
  item_slug: string | null;
  duration_days: number;
  price: number;
}

export default function CustomSubscriptionPage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedModules, setSelectedModules] = useState<string[]>(["listening", "reading"]);
  const [duration, setDuration] = useState(30);
  const [availableMocks, setAvailableMocks] = useState<MockTest[]>([]);
  const [selectedMocks, setSelectedMocks] = useState<string[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [fixedPlans, setFixedPlans] = useState<FixedPlan[]>([]);
  const [unitPrices, setUnitPrices] = useState<Record<string, number>>({
    listening: 5,
    reading: 5,
    writing: 10,
    vocab_premium: 3,
    ai_evaluation: 15
  });

  const modules: Module[] = [
    { id: "listening", name: "Listening", icon: <Headphones className="h-5 w-5" />, description: "প্র্যাকটিস টেস্ট ও অডিও সেশন", color: "blue" },
    { id: "reading", name: "Reading", icon: <BookOpen className="h-5 w-5" />, description: "প্যাসেজ সলভিং ও রিডিং টিপস", color: "green" },
    { id: "writing", name: "Writing", icon: <Pen className="h-5 w-5" />, description: "টাস্ক ১ ও ২ রাইটিং প্র্যাকটিস", color: "orange" },
    { id: "ai_evaluation", name: "AI Evaluation", icon: <Sparkles className="h-5 w-5" />, description: "এআই রাইটিং চেক ও ফিডব্যাক", color: "purple" },
    { id: "vocab_premium", name: "Vocab Premium", icon: <Brain className="h-5 w-5" />, description: "সাপ্তাহিক নতুন শব্দ ও চ্যালেঞ্জ", color: "pink" },
  ];

    useEffect(() => {
      const controller = new AbortController();

      async function fetchData() {
        const supabase = createClient();
        
        try {
          const { data: mockData, error: mockError } = await supabase
            .from("mock_tests")
            .select("id, title, module, price")
            .eq("test_type", "mock")
            .abortSignal(controller.signal);
          
          if (mockError) throw mockError;
          if (mockData) setAvailableMocks(mockData);
  
          const { data: pricingData, error: pricingError } = await supabase
            .from("subscription_pricing")
            .select("item_type, item_slug, duration_days, price")
            .eq("is_active", true)
            .abortSignal(controller.signal);
          
          if (pricingError) throw pricingError;
          if (pricingData) {
            const units: Record<string, number> = {};
            const fixed: FixedPlan[] = [];
  
            pricingData.forEach(item => {
              if (item.item_type === "unit_price") {
                if (item.item_slug) units[item.item_slug] = item.price;
              } else {
                fixed.push(item);
              }
            });
            setUnitPrices(prev => ({ ...prev, ...units }));
            setFixedPlans(fixed);
          }
          } catch (error: any) {
            if (error.name === "AbortError" || controller.signal.aborted || error.message?.toLowerCase().includes("abort")) return;
            console.error("Error fetching data:", error.message || error);
          } finally {
          setLoading(false);
        }
      }
  
      fetchData();
  
      if (containerRef.current) {
        gsap.from(".fade-up", {
          y: 20,
          opacity: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: "power2.out"
        });
      }

      return () => controller.abort();
    }, []);

  const toggleModule = (id: string) => {
    setSelectedModules(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const toggleMock = (id: string) => {
    setSelectedMocks(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const applyCoupon = async () => {
    if (!couponCode) return;
    setValidatingCoupon(true);
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", couponCode.toUpperCase())
      .eq("is_active", true)
      .maybeSingle();

    if (error || !data) {
      toast.error("ভুল বা ইনঅ্যাক্টিভ কুপন কোড");
      setAppliedCoupon(null);
    } else {
      setAppliedCoupon(data);
      toast.success("কুপন অ্যাপ্লাই করা হয়েছে!");
    }
    setValidatingCoupon(false);
  };

  const calculateSubtotal = () => {
    // 1. Calculate base unit price (Custom logic: Module Unit Price * Duration)
    let calculated = selectedModules.reduce((acc, modId) => {
      return acc + (unitPrices[modId] || 0) * duration;
    }, 0);

    // 2. Fixed Plan Discount Logic:
    // If the user's selected modules and duration match a fixed plan, or if a fixed plan is cheaper, use it.
    
    // Check "Practice All" plan (Reading + Listening + Writing)
    const practiceModules = ["listening", "reading", "writing"];
    const hasAllPractice = practiceModules.every(m => selectedModules.includes(m));
    
    if (hasAllPractice) {
      const allPlan = fixedPlans.find(p => p.item_type === "practice_all" && p.duration_days === duration);
      if (allPlan) {
        // Price for these 3 modules under the fixed plan
        const fixedPrice = allPlan.price;
        // Price for these 3 modules under the unit calculation
        const unitPriceForPractice = practiceModules.reduce((acc, mId) => acc + (unitPrices[mId] || 0) * duration, 0);
        
        // If fixed plan is cheaper, use it for these 3 modules
        if (fixedPrice < unitPriceForPractice) {
          calculated = calculated - unitPriceForPractice + fixedPrice;
        }
      }
    }

    // Check individual module fixed plans (e.g. 90 days of Reading)
    selectedModules.forEach(modId => {
      const modPlan = fixedPlans.find(p => p.item_type === "practice_module" && p.item_slug === modId && p.duration_days === duration);
      if (modPlan) {
        const unitCost = (unitPrices[modId] || 0) * duration;
        // Apply the cheaper option
        if (modPlan.price < unitCost) {
          calculated = calculated - unitCost + modPlan.price;
        }
      }
    });

    return calculated;
  };

  const subtotal = calculateSubtotal();

  const mocksTotal = selectedMocks.reduce((acc, mockId) => {
    const mock = availableMocks.find(m => m.id === mockId);
    return acc + (mock?.price || 0);
  }, 0);

  const totalBeforeDiscount = subtotal + mocksTotal;
  const discountAmount = appliedCoupon ? Math.floor((totalBeforeDiscount * appliedCoupon.discount_percent) / 100) : 0;
  const totalPrice = totalBeforeDiscount - discountAmount;

  const handleCheckout = async () => {
    const supabase = createClient();
    // Prefer getSession over getUser to avoid network delay
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user || authError) {
      toast.error("অনুগ্রহ করে আগে লগইন করুন");
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (selectedModules.length === 0 && selectedMocks.length === 0) {
      toast.error("অনুগ্রহ করে কমপক্ষে একটি মডিউল বা মক টেস্ট সিলেক্ট করুন");
      return;
    }

    setProcessing(true);
    
    try {
        const cartData = {
          type: "custom_subscription",
          items: [
            ...selectedModules.map(mId => ({
              item_type: "practice_module",
              item_slug: mId,
              label: modules.find(mod => mod.id === mId)?.name,
              price: (unitPrices[mId] || 0) * duration,
              duration_days: duration
            })),
            ...selectedMocks.map(mId => {
              const mock = availableMocks.find(m => m.id === mId);
              return {
                item_type: "mock_test",
                item_slug: mId,
                label: mock?.title,
                price: mock?.price || 0,
                duration_days: 1
              };
            })
          ],
          coupon: appliedCoupon ? {
            code: appliedCoupon.code,
            discount: appliedCoupon.discount_percent
          } : null,
          total: totalPrice,
          subtotal: totalBeforeDiscount,
          discount: discountAmount,
          duration: duration,
          description: `${selectedModules.length}টি মডিউল, ${selectedMocks.length}টি মক টেস্ট, ${duration} দিন`
        };

      const res = await fetch("/api/payment/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartData })
      });

      const { sessionId, error } = await res.json();
      if (error) throw new Error(error);

      router.push(`/checkout/subscription/${sessionId}`);
    } catch (error: any) {
      toast.error("চেকআউট সেশন তৈরি করতে সমস্যা হয়েছে");
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-hind-siliguri">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen pt-24 pb-20 font-hind-siliguri">
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-80 h-80 rounded-full blur-[120px] bg-primary/10 opacity-50"></div>
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full blur-[150px] bg-primary/10 opacity-50"></div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 fade-up">
          <Badge variant="outline" className="mb-4 px-4 py-1 text-primary border-primary/20 bg-primary/5 font-bold uppercase tracking-widest">
            কাস্টম সাবস্ক্রিপশন
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tight leading-[1.1]">
            আপনার পছন্দের প্যাকেজ <br /><span className="gradient-text">নিজেই তৈরি করুন</span>
          </h1>
          <p className="text-lg text-muted-foreground font-medium opacity-80">
            আপনার যা প্রয়োজন ঠিক তা-ই বেছে নিন। অতিরিক্ত খরচের ঝামেলা নেই।
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-card border border-border/50 rounded-3xl p-6 md:p-8 shadow-xl shadow-black/5 fade-up">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                <Target className="h-6 w-6 text-primary" />
                মডিউল সিলেক্ট করুন
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {modules.map((mod) => (
                  <button
                    key={mod.id}
                    onClick={() => toggleModule(mod.id)}
                    className={`p-5 rounded-2xl border transition-all duration-300 text-left group relative overflow-hidden ${
                      selectedModules.includes(mod.id)
                        ? "border-primary bg-primary/[0.03] shadow-lg shadow-primary/5"
                        : "border-border/50 bg-secondary/20 hover:border-primary/30"
                    }`}
                  >
                    <div className="relative z-10">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${
                        selectedModules.includes(mod.id) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}>
                        {mod.icon}
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-lg">{mod.name}</h3>
                        <span className="text-xs font-black text-primary">৳{unitPrices[mod.id]}/দিন</span>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium">{mod.description}</p>
                    </div>
                    {selectedModules.includes(mod.id) && (
                      <CheckCircle2 className="absolute top-4 right-4 h-5 w-5 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {availableMocks.length > 0 && (
              <div className="bg-card border border-border/50 rounded-3xl p-6 md:p-8 shadow-xl shadow-black/5 fade-up">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                  <Award className="h-6 w-6 text-primary" />
                  মক টেস্ট বুক করুন (ঐচ্ছিক)
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {availableMocks.map((mock) => (
                    <button
                      key={mock.id}
                      onClick={() => toggleMock(mock.id)}
                      className={`p-4 rounded-xl border transition-all duration-300 text-left relative ${
                        selectedMocks.includes(mock.id)
                          ? "border-primary bg-primary/[0.03]"
                          : "border-border/50 bg-secondary/20 hover:border-primary/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          selectedMocks.includes(mock.id) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}>
                          <Calendar className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-sm truncate">{mock.title}</h3>
                          <div className="flex items-center justify-between mt-1">
                            <Badge variant="secondary" className="text-[10px] h-4 px-1 capitalize">
                              {mock.module}
                            </Badge>
                            <span className="text-[10px] font-black text-primary">৳{mock.price}</span>
                          </div>
                        </div>
                      </div>
                      {selectedMocks.includes(mock.id) && (
                        <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-card border border-border/50 rounded-3xl p-6 md:p-8 shadow-xl shadow-black/5 fade-up">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                <Calendar className="h-6 w-6 text-primary" />
                সময়কাল নির্ধারণ করুন
              </h2>
              <div className="flex items-center justify-center gap-6 py-4">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-12 w-12 rounded-xl"
                  onClick={() => setDuration(Math.max(1, duration - 1))}
                >
                  <Minus className="h-5 w-5" />
                </Button>
                <div className="text-center min-w-[120px]">
                  <span className="text-5xl font-black text-primary">{duration}</span>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">দিন</p>
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-12 w-12 rounded-xl"
                  onClick={() => setDuration(duration + 1)}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex flex-wrap justify-center gap-3 mt-8">
                {[7, 15, 30, 90, 180].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                      duration === d ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80 text-muted-foreground"
                    }`}
                  >
                    {d === 30 ? "১ মাস" : d === 90 ? "৩ মাস" : `${d} দিন`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6 fade-up">
            <div className="bg-card border-2 border-primary/20 rounded-3xl p-8 shadow-2xl shadow-primary/5 sticky top-24">
              <h2 className="text-xl font-bold mb-6">পেমেন্ট সামারি</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-medium">মডিউল ({selectedModules.length})</span>
                  <span className="font-bold">৳{subtotal}</span>
                </div>
                {selectedMocks.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-medium">মক টেস্ট ({selectedMocks.length})</span>
                    <span className="font-bold">৳{mocksTotal}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-medium">সময়কাল</span>
                  <span className="font-bold">{duration} দিন</span>
                </div>
                
                {appliedCoupon && (
                  <div className="flex justify-between text-sm text-green-500 font-bold">
                    <span>ডিসকাউন্ট ({appliedCoupon.discount_percent}%)</span>
                    <span>- ৳{discountAmount}</span>
                  </div>
                )}

                <div className="pt-4 border-t border-border flex justify-between items-baseline">
                  <span className="text-lg font-bold">মোট</span>
                  <span className="text-4xl font-black text-primary">৳{totalPrice}</span>
                </div>
              </div>

              <div className="mb-8">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 block">কুপন কোড</label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="কুপন কোড লিখুন" 
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="h-11 rounded-xl uppercase font-bold"
                  />
                  <Button 
                    variant="secondary" 
                    onClick={applyCoupon}
                    disabled={validatingCoupon || !couponCode}
                    className="h-11 px-4 font-bold rounded-xl"
                  >
                    {validatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "অ্যাপ্লাই"}
                  </Button>
                </div>
                {appliedCoupon && (
                  <p className="text-[10px] font-bold text-green-500 mt-2 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {appliedCoupon.code} অ্যাপ্লাই করা হয়েছে
                  </p>
                )}
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-2 text-xs font-bold text-green-500">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>তাৎক্ষণিক অ্যাক্টিভেশন</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-green-500">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>যেকোনো সময় পরিবর্তনযোগ্য</span>
                </div>
              </div>

              <Button 
                onClick={handleCheckout} 
                disabled={processing}
                className="w-full h-14 text-lg font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all group"
              >
                {processing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    এগিয়ে যান
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
              
              <div className="mt-6 flex items-center justify-center gap-4 grayscale opacity-50">
                <CreditCard className="h-5 w-5" />
                <ShieldCheck className="h-5 w-5" />
                <Zap className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
