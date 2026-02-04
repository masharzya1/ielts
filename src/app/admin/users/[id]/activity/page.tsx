import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Clock, Monitor, MapPin, Calendar, Timer } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function UserActivityPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const userId = params.id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  const { data: activity } = await supabase
    .from("user_activity")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const totalTime = activity?.reduce((acc, curr) => acc + (curr.stay_duration || 0), 0) || 0;
  const hours = Math.floor(totalTime / 3600);
  const minutes = Math.floor((totalTime % 3600) / 60);

  // Group by path to find where they spend most time
  const pathStats = activity?.reduce((acc: Record<string, number>, curr) => {
    acc[curr.path] = (acc[curr.path] || 0) + (curr.stay_duration || 0);
    return acc;
  }, {}) || {};

  const sortedPaths = Object.entries(pathStats).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-8 font-hind-siliguri">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon">
          <Link href="/admin/users">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{profile?.full_name || "User"}&apos;s Activity</h1>
          <p className="text-muted-foreground">Detailed tracking and session information.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Timer className="h-4 w-4 text-primary" />
              Total Time Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hours}h {minutes}m</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Total Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activity?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Most Visited
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">{sortedPaths[0]?.[0] || "None"}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Top Pages by Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sortedPaths.slice(0, 10).map(([path, time]) => (
                <div key={path} className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate max-w-[250px]">{path}</span>
                  <span className="text-sm font-bold bg-secondary px-2 py-1 rounded">
                    {Math.floor(time / 60)}m {time % 60}s
                  </span>
                </div>
              ))}
              {sortedPaths.length === 0 && (
                <p className="text-center text-muted-foreground py-10">No activity recorded yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {activity?.map((log) => (
                <div key={log.id} className="p-3 rounded-lg border border-border bg-muted/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                    <span className="text-[10px] font-bold uppercase bg-background px-2 py-0.5 rounded border border-border">
                      {log.stay_duration}s
                    </span>
                  </div>
                  <div className="text-sm font-medium truncate">{log.path}</div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Monitor className="h-3 w-3" />
                      {log.device_info?.platform || "Unknown"}
                    </span>
                    <span className="truncate flex-1">
                      {log.device_info?.userAgent?.split(') ')[1] || "Browser"}
                    </span>
                  </div>
                </div>
              ))}
              {(!activity || activity.length === 0) && (
                <p className="text-center text-muted-foreground py-10">No activity recorded yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
