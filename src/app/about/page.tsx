import { Navbar } from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Target, Award, Users } from "lucide-react";

export default function AboutPage() {
  const stats = [
    { label: "সফল শিক্ষার্থী", value: "১০,০০০+", icon: <Users className="h-6 w-6" /> },
    { label: "মক টেস্ট সম্পন্ন", value: "৫০,০০০+", icon: <Target className="h-6 w-6" /> },
    { label: "গড় ব্যান্ড স্কোর", value: "৭.৫", icon: <Award className="h-6 w-6" /> },
  ];

  return (
    <div className="min-h-screen">
      <main className="pt-24 pb-16">
        <section className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <Badge variant="outline" className="mb-4 px-4 py-1 text-primary border-primary/20 bg-primary/5">
              আমাদের সম্পর্কে
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              আপনার আইইএলটিএস জয়ের <span className="gradient-text">নির্ভরযোগ্য সঙ্গী</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              আমরা বিশ্বাস করি যে সঠিক প্রস্তুতি এবং সঠিক দিকনির্দেশনা থাকলে যে কেউ আইইএলটিএস পরীক্ষায় তাদের কাঙ্ক্ষিত স্কোর অর্জন করতে পারে। ieltspracticebd তৈরি করা হয়েছে সেই লক্ষ্য পূরণেই।
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-24">
            {stats.map((stat, i) => (
              <div key={i} className="p-8 rounded-2xl border border-border bg-card/50 text-center hover:border-primary/50 transition-all">
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
            <div>
              <h2 className="text-3xl font-bold mb-6">আমাদের লক্ষ্য</h2>
              <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
                আমাদের লক্ষ্য হলো বাংলাদেশের শিক্ষার্থীদের জন্য একটি সাশ্রয়ী এবং উচ্চমানের আইইএলটিএস প্রস্তুতি প্ল্যাটফর্ম প্রদান করা। আমরা কৃত্রিম বুদ্ধিমত্তা (AI) এবং আধুনিক প্রযুক্তির ব্যবহারের মাধ্যমে শিক্ষার্থীদের দুর্বলতাগুলো চিহ্নিত করে সে অনুযায়ী ফিডব্যাক প্রদান করি।
              </p>
              <div className="space-y-4">
                {[
                  "বাস্তবসম্মত পরীক্ষার অভিজ্ঞতা প্রদান করা",
                  "সঠিক এবং দ্রুত ব্যান্ড স্কোর প্রেডিকশন",
                  "রাইটিং এবং স্পিকিং মডিউলে বিস্তারিত ফিডব্যাক",
                  "সাশ্রয়ী মূল্যে প্রিমিয়াম সার্ভিস নিশ্চিত করা",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 to-transparent rounded-3xl blur-3xl"></div>
              <div className="relative aspect-video rounded-3xl overflow-hidden border border-border bg-card">
                <div className="absolute inset-0 flex items-center justify-center text-primary/20">
                  <Target className="h-32 w-32" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
