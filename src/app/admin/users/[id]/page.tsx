import { createClient } from "@/lib/supabase/server";
import { 
  User, 
  Shield, 
  Calendar, 
  CreditCard, 
  Trash2, 
  Plus, 
  ArrowLeft, 
  Activity,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  assignSubscriptionToUser, 
  removeSubscriptionFromUser,
  updateUserRole 
} from "../actions";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function UserDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!profile) {
    redirect("/admin/users");
  }

  const { data: activePurchases } = await supabase
    .from("user_purchases")
    .select("*")
    .eq("user_id", id)
    .neq("status", "removed")
    .order("created_at", { ascending: false });

  const { data: testList } = await supabase
    .from("mock_tests")
    .select("id, title");

  const itemTypeLabels: Record<string, string> = {
    practice_module: "Practice Module",
    practice_all: "Practice All",
    mock_single: "Single Mock",
    vocab_premium: "Vocab Premium",
    ai_evaluation: "AI Evaluation",
    custom_unit: "Custom Unit"
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon" className="rounded-full">
          <Link href="/admin/users">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-black tracking-tight">User Details</h1>
          <p className="text-muted-foreground">Manage subscriptions and permissions for {profile.full_name || profile.email}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* User Info Card */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-black mb-4">
                {profile.full_name?.[0] || <User className="h-10 w-10" />}
              </div>
              <h2 className="text-xl font-bold">{profile.full_name || "New Student"}</h2>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              
              <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-muted text-muted-foreground border border-border">
                {profile.role === 'admin' ? <Shield className="h-3 w-3 text-primary" /> : <User className="h-3 w-3" />}
                {profile.role}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium">Joined</span>
                <span className="font-bold">{new Date(profile.created_at).toLocaleDateString()}</span>
              </div>
              
              <form action={updateUserRole} className="pt-4">
                <input type="hidden" name="userId" value={profile.id} />
                <input type="hidden" name="role" value={profile.role === 'admin' ? 'user' : 'admin'} />
                <Button variant="outline" className="w-full font-bold rounded-xl" size="sm">
                  {profile.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                </Button>
              </form>

              <Button asChild variant="secondary" className="w-full font-bold rounded-xl" size="sm">
                <Link href={`/admin/users/${profile.id}/activity`} className="flex items-center justify-center gap-2">
                  <Activity className="h-4 w-4" /> View Activity
                </Link>
              </Button>
            </div>
          </div>

          {/* Quick Assign Card */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Assign Subscription
            </h3>
            <form action={assignSubscriptionToUser} className="space-y-4">
              <input type="hidden" name="userId" value={profile.id} />
              
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1.5">Item Type</label>
                <select name="itemType" className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm font-medium focus:ring-2 ring-primary/20 outline-none">
                  <option value="practice_module">Practice Module</option>
                  <option value="practice_all">Practice All</option>
                  <option value="mock_single">Single Mock</option>
                  <option value="vocab_premium">Vocab Premium</option>
                  <option value="ai_evaluation">AI Evaluation</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1.5">Module (If Practice)</label>
                <select name="moduleSlug" className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm font-medium focus:ring-2 ring-primary/20 outline-none">
                  <option value="">None</option>
                  <option value="listening">Listening</option>
                  <option value="reading">Reading</option>
                  <option value="writing">Writing</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1.5">Duration (Days)</label>
                <input 
                  type="number" 
                  name="durationDays" 
                  defaultValue={30}
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm font-medium focus:ring-2 ring-primary/20 outline-none"
                />
              </div>

              <Button type="submit" className="w-full font-bold rounded-xl bg-primary hover:bg-primary/90">
                Assign Now
              </Button>
            </form>
          </div>
        </div>

        {/* Subscriptions List */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm min-h-[400px]">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-primary" />
              Active Subscriptions
            </h3>

            <div className="space-y-4">
              {activePurchases && activePurchases.length > 0 ? (
                activePurchases.map((purchase) => {
                  const isExpired = purchase.expires_at && new Date(purchase.expires_at) < new Date();
                  return (
                    <div key={purchase.id} className={`p-5 rounded-2xl border border-border transition-all hover:border-primary/20 ${isExpired ? 'opacity-60 grayscale' : 'bg-secondary/10'}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isExpired ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                            {purchase.item_type === 'mock_single' ? <BookPlus className="h-6 w-6" /> : <Shield className="h-6 w-6" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-lg">
                                {itemTypeLabels[purchase.item_type]}
                                {purchase.module_slug && ` (${purchase.module_slug})`}
                              </h4>
                              {isExpired ? (
                                <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full">
                                  <XCircle className="h-2.5 w-2.5" /> Expired
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full">
                                  <CheckCircle2 className="h-2.5 w-2.5" /> Active
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground font-medium">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4" />
                                Assigned: {new Date(purchase.created_at).toLocaleDateString()}
                              </span>
                              {purchase.expires_at && (
                                <span className="flex items-center gap-1.5">
                                  <Clock className="h-4 w-4" />
                                  Expires: {new Date(purchase.expires_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] font-bold text-muted-foreground mt-2 uppercase tracking-widest">
                              ID: {purchase.payment_id}
                            </p>
                          </div>
                        </div>

                        <form action={removeSubscriptionFromUser}>
                          <input type="hidden" name="userId" value={profile.id} />
                          <input type="hidden" name="purchaseId" value={purchase.id} />
                          <Button 
                            type="submit" 
                            variant="ghost" 
                            size="sm" 
                            className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center p-0"
                            title="Remove Subscription"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </form>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                    <CreditCard className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="font-bold text-muted-foreground">No active subscriptions</p>
                    <p className="text-xs text-muted-foreground/60">This user hasn't purchased or been assigned any access yet.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BookPlus({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
      <path d="M9 10h6" />
      <path d="M12 7v6" />
    </svg>
  );
}
