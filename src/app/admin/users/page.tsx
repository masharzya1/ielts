import { createClient } from "@/lib/supabase/server";
import { User, Shield, ShieldAlert, BookPlus, MoreVertical, Activity, CreditCard } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { updateUserRole, giveTestToUser } from "./actions";
import Link from "next/link";

export default async function UsersPage() {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: tests } = await supabase
    .from("mock_tests")
    .select("id, title");

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">User Management</h1>
          <p className="text-muted-foreground">Manage roles and permissions for your students.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Joined</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {profiles?.map((profile) => (
                <tr key={profile.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {profile.full_name?.[0] || <User className="h-5 w-5" />}
                      </div>
                      <span className="font-medium">{profile.full_name || "New Student"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{profile.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      profile.role === 'admin' 
                        ? 'bg-primary/20 text-primary' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {profile.role === 'admin' ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
                      {profile.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground text-sm">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/users/${profile.id}`} className="flex items-center gap-2 w-full cursor-pointer">
                                <CreditCard className="h-4 w-4" /> Manage Subscriptions
                              </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild>
                              <Link href={`/admin/users/${profile.id}/activity`} className="flex items-center gap-2 w-full cursor-pointer">
                                <Activity className="h-4 w-4" /> View Activity
                              </Link>
                            </DropdownMenuItem>
                          
                            <DropdownMenuSeparator />
                            <form action={updateUserRole}>
                              <input type="hidden" name="userId" value={profile.id} />
                              <input type="hidden" name="role" value={profile.role === 'admin' ? 'user' : 'admin'} />
                              <DropdownMenuItem className="cursor-pointer">
                                <button type="submit" className="flex items-center gap-2 w-full">
                                  {profile.role === 'admin' ? (
                                    <><ShieldAlert className="h-4 w-4" /> Demote to User</>
                                  ) : (
                                    <><Shield className="h-4 w-4" /> Promote to Admin</>
                                  )}
                                </button>
                              </DropdownMenuItem>
                            </form>

                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Assign Test</DropdownMenuLabel>
                            {tests?.map((test) => (
                              <form key={test.id} action={giveTestToUser}>
                            <input type="hidden" name="userId" value={profile.id} />
                            <input type="hidden" name="testId" value={test.id} />
                            <DropdownMenuItem className="cursor-pointer">
                              <button type="submit" className="flex items-center gap-2 w-full truncate">
                                <BookPlus className="h-4 w-4" />
                                {test.title}
                              </button>
                            </DropdownMenuItem>
                          </form>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!profiles || profiles.length === 0) && (
            <div className="text-center py-20">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground">No users found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
