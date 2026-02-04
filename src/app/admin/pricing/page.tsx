"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Tag, Plus, Trash2, Edit, Loader2, X, Percent, Calendar, Info, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface PricingItem {
  id: string;
  item_type: string;
  item_slug: string | null;
  duration_days: number;
  price: number;
  discount_percent: number;
  is_active: boolean;
}

interface Coupon {
  id: string;
  code: string;
  discount_percent: number;
  min_amount: number;
  max_uses: number | null;
  used_count: number;
  valid_until: string;
  is_active: boolean;
}

export default function AdminPricingPage() {
  const [pricing, setPricing] = useState<PricingItem[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pricing" | "coupons">("pricing");
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingPricing, setEditingPricing] = useState<PricingItem | null>(null);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const [pricingForm, setPricingForm] = useState({
    item_type: "practice_module",
    item_slug: "listening",
    duration_days: 90,
    price: 500,
    discount_percent: 0,
    is_active: true
  });

  const [couponForm, setCouponForm] = useState({
    code: "",
    discount_percent: 10,
    min_amount: 0,
    max_uses: null as number | null,
    valid_until: "",
    is_active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const supabase = createClient();
    
    const { data: pricingData } = await supabase
      .from("subscription_pricing")
      .select("*")
      .order("item_type")
      .order("duration_days");
    
    const { data: couponsData } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    
    setPricing(pricingData || []);
    setCoupons(couponsData || []);
    setLoading(false);
  }

  const itemTypeLabels: Record<string, string> = {
    practice_module: "Practice Module",
    practice_all: "Practice All",
    mock_single: "Single Mock",
    vocab_premium: "Vocab Premium",
    ai_evaluation: "AI Evaluation",
    unit_price: "Unit Price (Per Day)"
  };

  const durationLabels: Record<number, string> = {
    1: "১ দিন (ইউনিট)",
    30: "১ মাস",
    90: "৩ মাস",
    180: "৬ মাস",
    365: "১ বছর"
  };

  const openPricingModal = (item?: PricingItem) => {
    if (item) {
      setEditingPricing(item);
      setPricingForm({
        item_type: item.item_type,
        item_slug: item.item_slug || "",
        duration_days: item.duration_days,
        price: item.price,
        discount_percent: item.discount_percent,
        is_active: item.is_active
      });
    } else {
      setEditingPricing(null);
      setPricingForm({
        item_type: "practice_module",
        item_slug: "listening",
        duration_days: 90,
        price: 500,
        discount_percent: 0,
        is_active: true
      });
    }
    setShowPricingModal(true);
  };

  const openCouponModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setCouponForm({
        code: coupon.code,
        discount_percent: coupon.discount_percent,
        min_amount: coupon.min_amount,
        max_uses: coupon.max_uses,
        valid_until: coupon.valid_until?.split("T")[0] || "",
        is_active: coupon.is_active
      });
    } else {
      setEditingCoupon(null);
      setCouponForm({
        code: "",
        discount_percent: 10,
        min_amount: 0,
        max_uses: null,
        valid_until: "",
        is_active: true
      });
    }
    setShowCouponModal(true);
  };

  const savePricing = async () => {
    const supabase = createClient();
    const data = {
      ...pricingForm,
      item_slug: pricingForm.item_slug || null
    };

    if (editingPricing) {
      await supabase.from("subscription_pricing").update(data).eq("id", editingPricing.id);
      toast.success("প্রাইসিং আপডেট হয়েছে");
    } else {
      await supabase.from("subscription_pricing").insert(data);
      toast.success("নতুন প্রাইসিং যোগ হয়েছে");
    }
    fetchData();
    setShowPricingModal(false);
  };

  const saveCoupon = async () => {
    if (!couponForm.code) {
      toast.error("কুপন কোড আবশ্যক");
      return;
    }

    const supabase = createClient();
    const data = {
      ...couponForm,
      code: couponForm.code.toUpperCase(),
      valid_until: couponForm.valid_until || null
    };

    if (editingCoupon) {
      await supabase.from("coupons").update(data).eq("id", editingCoupon.id);
      toast.success("কুপন আপডেট হয়েছে");
    } else {
      await supabase.from("coupons").insert(data);
      toast.success("নতুন কুপন যোগ হয়েছে");
    }
    fetchData();
    setShowCouponModal(false);
  };

  const deletePricing = async (id: string) => {
    const supabase = createClient();
    await supabase.from("subscription_pricing").delete().eq("id", id);
    toast.success("প্রাইসিং ডিলিট হয়েছে");
    fetchData();
  };

  const deleteCoupon = async (id: string) => {
    const supabase = createClient();
    await supabase.from("coupons").delete().eq("id", id);
    toast.success("কুপন ডিলিট হয়েছে");
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 font-hind-siliguri">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-hind-siliguri">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
            <Tag className="h-7 w-7 text-emerald-500" />
            প্রাইসিং ও কুপন
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">
            সার্ভিস প্রাইস ও ডিসকাউন্ট কুপন ম্যানেজ করুন। এখানে সব ফিক্সড প্ল্যান এবং কাস্টম প্রাইসিং কনফিগার করা যায়।
          </p>
        </div>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
        <h2 className="font-bold flex items-center gap-2 mb-3 text-primary">
          <HelpCircle className="h-5 w-5" />
          প্রাইসিং কিভাবে কাজ করে?
        </h2>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-2">
              <p className="font-bold text-foreground">১. ফিক্সড প্ল্যান (Fixed Plans):</p>
              <p className="text-muted-foreground">তালিকায় থাকা নির্দিষ্ট দিন (যেমন ৯০ দিন) এবং নির্দিষ্ট মডিউলের জন্য ফিক্সড প্রাইস। এগুলো সাধারণত ল্যান্ডিং পেজে দেখানো হয়।</p>
            </div>
            <div className="space-y-2">
              <p className="font-bold text-foreground">২. কাস্টম প্রাইসিং (Custom Pricing):</p>
              <p className="text-muted-foreground">
                ইউজার যখন নিজের মতো দিন ও মডিউল বেছে নেয়, তখন প্রতি মডিউলের <Badge variant="outline" className="text-primary font-bold">Unit Price (Per Day)</Badge> ব্যবহার করা হয়। 
                <br />
                <span className="text-foreground font-medium">হিসাব: (সিলেক্টেড মডিউলগুলোর ইউনিট প্রাইসের যোগফল × দিন সংখ্যা) + সিলেক্টেড মক টেস্টগুলোর প্রাইস।</span>
              </p>
            </div>
          </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("pricing")}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            tab === "pricing" ? "bg-primary text-primary-foreground" : "bg-secondary/50"
          }`}
        >
          প্রাইসিং ({pricing.length})
        </button>
        <button
          onClick={() => setTab("coupons")}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            tab === "coupons" ? "bg-primary text-primary-foreground" : "bg-secondary/50"
          }`}
        >
          কুপন ({coupons.length})
        </button>
      </div>

      {tab === "pricing" && (
        <>
          <div className="flex justify-end">
            <Button onClick={() => openPricingModal()} className="h-11 px-6 font-bold rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              নতুন প্রাইসিং
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase">সার্ভিস</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase">মডিউল</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase">সময়কাল</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase">প্রাইস</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase">স্ট্যাটাস</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-muted-foreground uppercase">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {pricing.map((item) => (
                  <tr key={item.id} className="border-b border-border/30 hover:bg-secondary/20 transition-colors">
                    <td className="py-4 px-4 font-bold text-sm">
                      {itemTypeLabels[item.item_type]}
                    </td>
                    <td className="py-4 px-4 text-sm text-muted-foreground font-medium">{item.item_slug || "All"}</td>
                    <td className="py-4 px-4 text-sm font-medium">{durationLabels[item.duration_days] || `${item.duration_days} দিন`}</td>
                    <td className="py-4 px-4 font-bold text-sm text-primary">৳{item.price}</td>
                    <td className="py-4 px-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        item.is_active ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                      }`}>
                        {item.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openPricingModal(item)} className="h-8 w-8 rounded-lg bg-secondary/50 hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => deletePricing(item.id)} className="h-8 w-8 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "coupons" && (
        <>
          <div className="flex justify-end">
            <Button onClick={() => openCouponModal()} className="h-11 px-6 font-bold rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              নতুন কুপন
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons.map((coupon) => (
              <div key={coupon.id} className="p-5 rounded-2xl border border-border/50 bg-card">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-black text-primary">{coupon.code}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    coupon.is_active ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                  }`}>
                    {coupon.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}
                  </span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Percent className="h-4 w-4 text-muted-foreground" />
                    <span className="font-bold">{coupon.discount_percent}% ছাড়</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {coupon.valid_until 
                        ? new Date(coupon.valid_until).toLocaleDateString("bn-BD")
                        : "সীমাহীন"
                      }
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">
                    ব্যবহৃত: {coupon.used_count}/{coupon.max_uses || "∞"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openCouponModal(coupon)} className="flex-1 h-9 rounded-lg bg-secondary/50 hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center text-sm font-bold">
                    <Edit className="h-4 w-4 mr-1" /> এডিট
                  </button>
                  <button onClick={() => deleteCoupon(coupon.id)} className="h-9 w-9 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showPricingModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{editingPricing ? "এডিট" : "নতুন"} প্রাইসিং</h2>
              <button onClick={() => setShowPricingModal(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold mb-2 block">সার্ভিস টাইপ</label>
                <select
                  value={pricingForm.item_type}
                  onChange={(e) => setPricingForm({ ...pricingForm, item_type: e.target.value })}
                  className="w-full h-11 rounded-xl border border-border bg-background px-3 font-medium"
                >
                    <option value="practice_module">Practice Module</option>
                    <option value="practice_all">Practice All</option>
                    <option value="mock_single">Single Mock</option>
                    <option value="vocab_premium">Vocab Premium</option>
                    <option value="ai_evaluation">AI Evaluation</option>
                    <option value="unit_price">Unit Price (Per Day)</option>
                  </select>
                </div>
                {(pricingForm.item_type === "practice_module" || pricingForm.item_type === "unit_price") && (
                  <div>
                    <label className="text-sm font-bold mb-2 block">মডিউল / আইটেম স্ল্যাগ</label>
                    <select
                      value={pricingForm.item_slug}
                      onChange={(e) => setPricingForm({ ...pricingForm, item_slug: e.target.value })}
                      className="w-full h-11 rounded-xl border border-border bg-background px-3 font-medium"
                    >
                      <option value="listening">Listening</option>
                      <option value="reading">Reading</option>
                      <option value="writing">Writing</option>
                      <option value="vocab_premium">Vocab Premium</option>
                      <option value="ai_evaluation">AI Evaluation</option>
                    </select>
                  </div>
                )}
                  <div>
                    <label className="text-sm font-bold mb-2 block">সময়কাল (দিন)</label>
                    <Input
                      type="number"
                      value={isNaN(pricingForm.duration_days) ? "" : pricingForm.duration_days}
                      onChange={(e) => setPricingForm({ ...pricingForm, duration_days: parseInt(e.target.value) || 0 })}
                      className="h-11 rounded-xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold mb-2 block">প্রাইস (৳)</label>
                    <Input
                      type="number"
                      value={isNaN(pricingForm.price) ? "" : pricingForm.price}
                      onChange={(e) => setPricingForm({ ...pricingForm, price: parseInt(e.target.value) || 0 })}
                      className="h-11 rounded-xl font-bold"
                    />
                  </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowPricingModal(false)} className="flex-1 h-11 rounded-xl font-bold">বাতিল</Button>
                <Button onClick={savePricing} className="flex-1 h-11 rounded-xl font-bold">সেভ করুন</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCouponModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{editingCoupon ? "এডিট" : "নতুন"} কুপন</h2>
              <button onClick={() => setShowCouponModal(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold mb-2 block">কুপন কোড</label>
                <Input
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  placeholder="DISCOUNT10"
                  className="h-11 rounded-xl font-bold"
                />
              </div>
                <div>
                  <label className="text-sm font-bold mb-2 block">ডিসকাউন্ট (%)</label>
                  <Input
                    type="number"
                    value={isNaN(couponForm.discount_percent) ? "" : couponForm.discount_percent}
                    onChange={(e) => setCouponForm({ ...couponForm, discount_percent: parseInt(e.target.value) || 0 })}
                    className="h-11 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold mb-2 block">সর্বনিম্ন অর্ডার (৳)</label>
                  <Input
                    type="number"
                    value={isNaN(couponForm.min_amount) ? "" : couponForm.min_amount}
                    onChange={(e) => setCouponForm({ ...couponForm, min_amount: parseInt(e.target.value) || 0 })}
                    className="h-11 rounded-xl font-bold"
                  />
                </div>
              <div>
                <label className="text-sm font-bold mb-2 block">মেয়াদ শেষ</label>
                <Input
                  type="date"
                  value={couponForm.valid_until}
                  onChange={(e) => setCouponForm({ ...couponForm, valid_until: e.target.value })}
                  className="h-11 rounded-xl font-bold"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowCouponModal(false)} className="flex-1 h-11 rounded-xl font-bold">বাতিল</Button>
                <Button onClick={saveCoupon} className="flex-1 h-11 rounded-xl font-bold">সেভ করুন</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
