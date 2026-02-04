"use client";

import * as React from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  MousePointer2, 
  Clock, 
  Globe, 
  Users, 
  Activity,
  ArrowUpRight,
  Search,
  Timer,
  Layout,
  LineChart as LineIcon,
  Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell
} from "recharts";

export default function AnalyticsPage() {
  const [activities, setActivities] = React.useState<any[]>([]);
  const [stats, setStats] = React.useState<any>({});
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [chartData, setChartData] = React.useState<any[]>([]);

  const fetchAnalytics = React.useCallback(async () => {
    // Fetch recent events (last 1000 or last 7 days)
    const { data: activityData, error } = await supabase
      .from("user_activity")
      .select(`
        *,
        profiles:user_id (
          email,
          full_name
        )
      `)
      .order("created_at", { ascending: false })
      .limit(2000);

    if (activityData) {
      setActivities(activityData);
      
      // Calculate basic stats
      const pageViews = activityData.filter(a => a.event_type === "page_view").length;
      const clicks = activityData.filter(a => a.event_type === "click").length;
      const uniqueUsers = new Set(activityData.map(a => a.user_id)).size;
      
      // Chart data: Daily activity for last 7 days
      const dailyData: any = {};
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dailyData[label] = { name: label, views: 0, clicks: 0 };
      }

      // Most popular paths
      const paths: any = {};
      const userEngagement: any = {};
      let totalSeconds = 0;
      let timeEvents = 0;

      activityData.forEach(a => {
        paths[a.path] = (paths[a.path] || 0) + 1;
        const userEmail = a.profiles?.email || 'Anonymous';
        userEngagement[userEmail] = (userEngagement[userEmail] || 0) + 1;
        
        if (a.event_type === "page_time" && a.metadata?.seconds) {
          totalSeconds += a.metadata.seconds;
          timeEvents++;
        }

        // Daily breakdown
        const eventDate = new Date(a.created_at);
        const dateLabel = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (dailyData[dateLabel]) {
          if (a.event_type === "page_view") dailyData[dateLabel].views++;
          if (a.event_type === "click") dailyData[dateLabel].clicks++;
        }
      });

      const topPaths = Object.entries(paths)
        .sort((a: any, b: any) => b[1] - a[1])
        .slice(0, 10);

      const topUsers = Object.entries(userEngagement)
        .sort((a: any, b: any) => b[1] - a[1])
        .slice(0, 5);

      const avgSessionTime = timeEvents > 0 ? Math.round(totalSeconds / uniqueUsers) : 0;

      setChartData(Object.values(dailyData));
      setStats({ 
        pageViews, 
        clicks, 
        uniqueUsers, 
        topPaths, 
        topUsers, 
        avgSessionTime,
        totalEvents: activityData.length 
      });
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, [fetchAnalytics]);


  const filteredActivities = activities.filter(a => {
    const userIdentifier = (a.profiles?.email || a.profiles?.full_name || 'Anonymous').toLowerCase();
    const searchLower = search.toLowerCase();
    return userIdentifier.includes(searchLower) ||
           a.event_type.toLowerCase().includes(searchLower) ||
           a.path?.toLowerCase().includes(searchLower);
  });

  if (loading && activities.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Extreme Analytics</h1>
          <p className="text-muted-foreground">Comprehensive real-time monitoring of user behavior and platform engagement.</p>
        </div>
        <Badge variant="outline" className="animate-pulse bg-green-500/10 text-green-500 border-green-500/20">
          Live Tracking Active
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Reach</CardTitle>
            <Globe className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pageViews || 0}</div>
            <p className="text-xs text-muted-foreground">Page views (last 2k events)</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interactivity</CardTitle>
            <MousePointer2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clicks || 0}</div>
            <p className="text-xs text-muted-foreground">Total clicks tracked</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Session Depth</CardTitle>
            <Timer className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgSessionTime || 0}s</div>
            <p className="text-xs text-muted-foreground">Avg. time per user</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Base</CardTitle>
            <Users className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueUsers || 0}</div>
            <p className="text-xs text-muted-foreground">Active unique users</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineIcon className="h-4 w-4 text-primary" />
            Activity Trends (Last 7 Days)
          </CardTitle>
          <CardDescription>Visualizing platform engagement peaks and troughs.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fill: '#888'}} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fill: '#888'}} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="views" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorViews)" 
                  strokeWidth={2}
                  name="Page Views"
                />
                <Area 
                  type="monotone" 
                  dataKey="clicks" 
                  stroke="#10b981" 
                  fillOpacity={1} 
                  fill="url(#colorClicks)" 
                  strokeWidth={2}
                  name="Clicks"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-border/50 bg-card/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Live Activity Stream</CardTitle>
                <CardDescription>Real-time interaction feed across all modules.</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter by user or path..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50 group">
                  <div className={`mt-1 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                    activity.event_type === 'click' ? 'bg-blue-500/10 text-blue-500' :
                    activity.event_type === 'page_view' ? 'bg-green-500/10 text-green-500' :
                    activity.event_type === 'page_time' ? 'bg-orange-500/10 text-orange-500' :
                    'bg-primary/10 text-primary'
                  }`}>
                    {activity.event_type === 'click' ? <MousePointer2 className="h-4 w-4" /> : 
                     activity.event_type === 'page_time' ? <Clock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm truncate">{activity.profiles?.full_name || activity.profiles?.email || 'Anonymous'}</span>
                      <Badge variant="outline" className="text-[10px] uppercase h-4 px-1">{activity.event_type.replace('_', ' ')}</Badge>
                      <span className="text-[10px] text-muted-foreground ml-auto">{new Date(activity.created_at).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      <span className="text-primary font-medium">{activity.path}</span>
                      {activity.metadata?.text ? ` • clicked "${activity.metadata.text}"` : ''}
                      {activity.event_type === 'page_time' ? ` • stayed for ${activity.metadata?.seconds}s` : ''}
                    </p>
                  </div>
                </div>
              ))}
              {filteredActivities.length === 0 && (
                <div className="py-20 text-center text-muted-foreground">No events found matching your search.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-6">
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-4 w-4 text-primary" />
                Popular Destinations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {stats.topPaths?.map(([path, count]: any, i: number) => (
                <div key={path} className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium truncate max-w-[180px]">{path}</span>
                    <span className="font-bold text-primary">{count} events</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full" 
                      style={{ width: `${(count / stats.totalEvents) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Most Active Users
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats.topUsers?.map(([email, count]: any) => (
                <div key={email} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <span className="text-xs font-medium truncate max-w-[150px]">{email}</span>
                  <Badge variant="secondary" className="text-[10px]">{count} actions</Badge>
                </div>
              ))}
              {(!stats.topUsers || stats.topUsers.length === 0) && (
                <p className="text-xs text-center text-muted-foreground py-4">No user data yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
