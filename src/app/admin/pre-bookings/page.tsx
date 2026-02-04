import { createClient } from "@/lib/supabase/server";
import { Calendar, Clock, User, Mail, ArrowLeft, Bookmark, Target, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";
import { bn } from "date-fns/locale";
import { Card } from "@/components/ui/card";

export default async function AdminPreBookings() {
  const supabase = await createClient();

  const { data: bookings } = await supabase
    .from("pre_bookings")
    .select(`
      *,
      profiles(full_name, email),
      mock_tests(title, scheduled_at)
    `)
    .order("created_at", { ascending: false });

  const upcomingBookings = bookings?.filter(b => !b.test_id) || [];
  const assignedBookings = bookings?.filter(b => b.test_id) || [];

  return (
    <div className="space-y-10 font-hind-siliguri">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2 text-muted-foreground hover:text-primary">
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-1" />
              ড্যাশবোর্ড
            </Link>
          </Button>
          <h1 className="text-3xl font-black tracking-tight">প্রি-বুকিং ম্যানেজমেন্ট</h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">কারা পরবর্তী মক টেস্টের জন্য প্রি-বুক করেছে</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="p-8 rounded-[2rem] bg-primary/5 border-primary/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Sparkles className="h-20 w-20 text-primary" />
          </div>
          <h3 className="text-xl font-black mb-2 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            আসন্ন মক টেস্টের জন্য
          </h3>
          <p className="text-sm text-muted-foreground mb-6">যেসব প্রি-বুকিং এখনো কোনো মক টেস্টের সাথে যুক্ত হয়নি</p>
          <div className="text-5xl font-black text-primary">{upcomingBookings.length}</div>
          <p className="text-[10px] font-black uppercase tracking-widest mt-2 opacity-50">মোট প্রি-বুকিং</p>
        </Card>

        <Card className="p-8 rounded-[2rem] bg-card border-border/50">
          <h3 className="text-xl font-black mb-2 flex items-center gap-2 text-foreground">
            <Bookmark className="h-5 w-5 text-muted-foreground" />
            নির্দিষ্ট মক টেস্টের জন্য
          </h3>
          <p className="text-sm text-muted-foreground mb-6">যেসব প্রি-বুকিং নির্দিষ্ট মক টেস্টের সময় করা হয়েছে</p>
          <div className="text-5xl font-black text-foreground">{assignedBookings.length}</div>
          <p className="text-[10px] font-black uppercase tracking-widest mt-2 opacity-50">মোট অ্যাসাইনড বুকিং</p>
        </Card>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-black flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          সাম্প্রতিক প্রি-বুকিং তালিকা
        </h2>
        
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary/30 border-b border-border/50">
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-muted-foreground">ইউজার</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-muted-foreground">মক টেস্ট</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-muted-foreground">বুকিং সময়</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-muted-foreground">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {bookings && bookings.length > 0 ? (
                  bookings.map((booking: any) => (
                    <tr key={booking.id} className="hover:bg-secondary/20 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
                            <User className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-bold text-sm">{booking.profiles?.full_name || booking.email || "Unknown User"}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {booking.profiles?.email || booking.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {booking.mock_tests ? (
                          <div>
                            <p className="font-bold text-sm text-foreground">{booking.mock_tests.title}</p>
                            <p className="text-[10px] font-black text-muted-foreground uppercase">Assigned</p>
                          </div>
                        ) : (
                          <span className="text-xs font-black px-3 py-1 rounded-full bg-primary/10 text-primary">
                            Upcoming Mock Test
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            {format(new Date(booking.created_at), "d MMMM, yyyy", { locale: bn })}
                          </span>
                          <span className="text-[10px] font-black text-muted-foreground mt-0.5 flex items-center gap-1.5 uppercase tracking-widest">
                            <Clock className="h-3 w-3" />
                            {format(new Date(booking.created_at), "h:mm a", { locale: bn })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                          booking.payment_status === 'completed' ? 'bg-green-500/10 text-green-600' : 'bg-orange-500/10 text-orange-600'
                        }`}>
                          {booking.payment_status === 'completed' ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Bookmark className="h-12 w-12 text-muted-foreground/20 mb-4" />
                        <p className="text-sm font-bold text-muted-foreground">এখন পর্যন্ত কোনো প্রি-বুকিং নেই</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
