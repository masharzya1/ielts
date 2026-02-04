"use client";

import { Navbar } from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MessageSquare, Phone, MapPin, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ContactPage() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("আপনার মেসেজটি সফলভাবে পাঠানো হয়েছে!");
      (e.target as HTMLFormElement).reset();
    }, 1500);
  };

  const contactInfo = [
    {
      icon: <Mail className="h-6 w-6" />,
      title: "ইমেইল",
      details: "support@ieltspracticebd.com",
      description: "যেকোনো জিজ্ঞাসায় আমাদের ইমেইল করুন"
    },
    {
      icon: <Phone className="h-6 w-6" />,
      title: "ফোন",
      details: "+৮৮০ ১৭০০-০০০০০০",
      description: "সকাল ১০টা থেকে রাত ৮টা পর্যন্ত"
    },
    {
      icon: <MapPin className="h-6 w-6" />,
      title: "অফিস",
      details: "ঢাকা, বাংলাদেশ",
      description: "আমাদের প্রধান কার্যালয়"
    }
  ];

  return (
    <div className="min-h-screen">
      <main className="pt-24 pb-16">
        <section className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
              <Badge variant="outline" className="mb-4 px-4 py-1 text-primary border-primary/20 bg-primary/5">
                যোগাযোগ
              </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              আমাদের সাথে <span className="gradient-text">যোগাযোগ করুন</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              আপনার কোনো প্রশ্ন বা মতামত থাকলে নিচের ফর্মটি পূরণ করুন। আমরা দ্রুত আপনার সাথে যোগাযোগ করব।
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            {contactInfo.map((item, i) => (
              <div key={i} className="p-8 rounded-2xl border border-border bg-card/50 hover:border-primary/50 transition-all">
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="font-semibold text-primary mb-1">{item.details}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-card/50 border border-border rounded-3xl p-8 md:p-12 backdrop-blur-sm">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">আপনার নাম</Label>
                    <Input id="name" placeholder="নাম লিখুন" required className="bg-background/50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">ইমেইল ঠিকানা</Label>
                    <Input id="email" type="email" placeholder="ইমেইল লিখুন" required className="bg-background/50" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">বিষয়</Label>
                  <Input id="subject" placeholder="বিষয় লিখুন" required className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">মেসেজ</Label>
                  <Textarea id="message" placeholder="আপনার মেসেজটি এখানে লিখুন..." required className="min-h-[150px] bg-background/50" />
                </div>
                <Button type="submit" size="lg" className="w-full h-12 font-bold" disabled={loading}>
                  {loading ? "পাঠানো হচ্ছে..." : (
                    <>
                      মেসেজ পাঠান
                      <Send className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
