"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Clock, Plus, MoreVertical, Edit, Trash, ExternalLink, ChevronRight, Calendar, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import Link from "next/link";

interface MockTest {
  id: string;
  title: string;
  description: string;
  price: number;
  is_free: boolean;
  scheduled_at?: string;
  created_at: string;
  is_published: boolean;
  live_to_previous_minutes: number;
}

export default function AdminMockPage() {
  const [tests, setTests] = useState<MockTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<MockTest | null>(null);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [isFree, setIsFree] = useState(false);
    const [scheduledAt, setScheduledAt] = useState("");
    const [liveToPreviousMinutes, setLiveToPreviousMinutes] = useState("180");
    const [isPublished, setIsPublished] = useState(true);
    const [submitting, setSubmitting] = useState(false);

  const activeTests = tests.filter(t => t.is_published);
  const inactiveTests = tests.filter(t => !t.is_published);

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

    const fetchTests = useCallback(async () => {
    const supabase = createClient();
    setLoading(true);
      try {
        const { data, error } = await supabase
          .from("mock_tests")
          .select("*")
          .eq("test_type", "mock")
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (data) setTests(data);
      } catch (err: any) {
        console.error("Error fetching tests:", err.message || err);
        toast.error("Failed to load mock tests");
      } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

    const handleCreateTest = async (e: React.FormEvent) => {
      e.preventDefault();
      if (submitting) return;
      
      setSubmitting(true);
      const supabase = createClient();
  
        try {
            const { error } = await supabase
              .from("mock_tests")
              .insert({
                title,
                slug: `${slugify(title)}-${Date.now()}`,
                description,
                price: isFree ? 0 : (parseFloat(price) || 0),
                is_free: isFree,
                test_type: "mock",
                scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
                live_to_previous_minutes: parseInt(liveToPreviousMinutes) || 180,
                is_published: isPublished
              });
  
        if (error) throw error;
  
        toast.success("Mock test created successfully");
        setIsCreateOpen(false);
        resetForm();
        fetchTests();
      } catch (err: any) {
        console.error("Create error:", err);
        toast.error("Failed to create mock test: " + (err.message || "Unknown error"));
      } finally {
        setSubmitting(false);
      }
    };
  
    const handleUpdateTest = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingTest || submitting) return;
      
      setSubmitting(true);
      const supabase = createClient();
  
      try {
        const { error } = await supabase
          .from("mock_tests")
            .update({
              title,
              description,
              price: isFree ? 0 : (parseFloat(price) || 0),
              is_free: isFree,
              scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
              live_to_previous_minutes: parseInt(liveToPreviousMinutes) || 180,
              is_published: isPublished
            })
          .eq("id", editingTest.id);
  
        if (error) throw error;
  
        toast.success("Mock test updated successfully");
        setIsEditOpen(false);
        resetForm();
        fetchTests();
      } catch (err: any) {
        console.error("Update error:", err);
        toast.error("Failed to update mock test: " + (err.message || "Unknown error"));
      } finally {
        setSubmitting(false);
      }
    };
  
    const resetForm = () => {
      setTitle("");
      setDescription("");
      setPrice("0");
      setIsFree(false);
      setScheduledAt("");
      setLiveToPreviousMinutes("180");
      setIsPublished(true);
      setEditingTest(null);
    };
  
    const startEditing = (test: MockTest) => {
      setEditingTest(test);
      setTitle(test.title);
      setDescription(test.description || "");
      setPrice(test.price.toString());
      setIsFree(test.is_free);
      setScheduledAt(test.scheduled_at ? new Date(test.scheduled_at).toISOString().slice(0, 16) : "");
      setLiveToPreviousMinutes(test.live_to_previous_minutes?.toString() || "180");
      setIsPublished(test.is_published);
      setIsEditOpen(true);
    };

  const handleDeleteTest = async (id: string) => {
    if (!confirm("Are you sure you want to delete this mock test?")) return;

    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("mock_tests")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Mock test deleted");
      fetchTests();
    } catch (err: any) {
      toast.error("Failed to delete mock test");
    }
  };

  const toggleTestStatus = async (id: string, currentStatus: boolean) => {
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("mock_tests")
        .update({ is_published: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      toast.success(`Mock test ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchTests();
    } catch (err: any) {
      toast.error("Failed to update status");
    }
  };

  if (loading && tests.length === 0) {
    return (
      <div className="space-y-8 font-hind-siliguri">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
              <Clock className="h-8 w-8 text-primary" />
              Mock Test Management
            </h1>
            <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs mt-1">
              Schedule and manage live exams
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-[2.5rem] bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

    return (
      <div className="space-y-8 font-hind-siliguri">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
              <Clock className="h-8 w-8 text-primary" />
              Mock Test Management
            </h1>
            <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs mt-1">
              Schedule and manage live exams
            </p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-lg rounded-xl h-12 px-6 font-bold">
                <Plus className="h-5 w-5" />
                Add New Mock
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-[2rem] font-hind-siliguri">
              <form onSubmit={handleCreateTest}>
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <DialogTitle className="text-2xl font-black">Create Mock Test</DialogTitle>
                  </div>
                  <DialogDescription className="font-medium">
                    Schedule a new live mock test.
                  </DialogDescription>
                </DialogHeader>
                  <div className="grid gap-6 py-6">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="font-bold">Title</Label>
                      <Input 
                        id="title" 
                        placeholder="e.g. Weekly Mock Test #1" 
                        required 
                        className="rounded-xl h-12"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description" className="font-bold">Description</Label>
                      <Textarea 
                        id="description" 
                        placeholder="Brief overview..." 
                        className="h-24 rounded-xl"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="scheduled_at" className="font-bold">Schedule Date & Time</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="scheduled_at" 
                          type="datetime-local" 
                          required
                          className="pl-10 rounded-xl h-12"
                          value={scheduledAt}
                          onChange={(e) => setScheduledAt(e.target.value)}
                        />
                      </div>
                      <p className="text-[10px] font-bold text-primary uppercase tracking-widest">User can only start at this time</p>
                    </div>
                    
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="live_to_previous_minutes" className="font-bold">Transfer to Previous (Mins)</Label>
                          <Input 
                            id="live_to_previous_minutes" 
                            type="number" 
                            placeholder="180"
                            className="rounded-xl h-12"
                            value={liveToPreviousMinutes}
                            onChange={(e) => setLiveToPreviousMinutes(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col justify-end pb-2">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase leading-tight">Mins after start to move to previous section</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/50 border border-border">
                        <Label className="font-bold">Free Access</Label>
                        <Switch checked={isFree} onCheckedChange={setIsFree} />
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/50 border border-border">
                        <Label className="font-bold">Active</Label>
                        <Switch checked={isPublished} onCheckedChange={setIsPublished} />
                      </div>
                    </div>
  
                    {!isFree && (
                    <div className="space-y-2">
                      <Label htmlFor="price" className="font-bold">Price (BDT)</Label>
                      <div className="relative">
                        <span className="absolute left-4 top-3 font-bold text-muted-foreground">৳</span>
                        <Input 
                          id="price" 
                          type="number" 
                          className="pl-10 rounded-xl h-12 font-bold"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" className="rounded-xl h-12" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button type="submit" className="rounded-xl h-12 px-8 font-bold" disabled={submitting}>
                    {submitting ? "Creating..." : "Create Mock"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
  
        <Dialog open={isEditOpen} onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) resetForm();
        }}>
          <DialogContent className="sm:max-w-[500px] rounded-[2rem] font-hind-siliguri">
            <form onSubmit={handleUpdateTest}>
              <DialogHeader>
                <DialogTitle className="text-2xl font-black">Edit Mock Test</DialogTitle>
              </DialogHeader>
                <div className="grid gap-6 py-6">
                  <div className="space-y-2">
                    <Label htmlFor="edit-title" className="font-bold">Title</Label>
                    <Input 
                      id="edit-title" 
                      required 
                      className="rounded-xl h-12"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-description" className="font-bold">Description</Label>
                    <Textarea 
                      id="edit-description" 
                      className="h-24 rounded-xl"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-scheduled_at" className="font-bold">Schedule Date & Time</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="edit-scheduled_at" 
                          type="datetime-local" 
                          className="pl-10 rounded-xl h-12"
                          value={scheduledAt}
                          onChange={(e) => setScheduledAt(e.target.value)}
                        />
                      </div>
                    </div>
  
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-live_to_previous_minutes" className="font-bold">Transfer to Previous (Mins)</Label>
                        <Input 
                          id="edit-live_to_previous_minutes" 
                          type="number" 
                          placeholder="180"
                          className="rounded-xl h-12"
                          value={liveToPreviousMinutes}
                          onChange={(e) => setLiveToPreviousMinutes(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col justify-end pb-2">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase leading-tight">Mins after start to move to previous section</p>
                      </div>
                    </div>
  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/50 border border-border">
                      <Label className="font-bold">Free Access</Label>
                      <Switch checked={isFree} onCheckedChange={setIsFree} />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/50 border border-border">
                      <Label className="font-bold">Active</Label>
                      <Switch checked={isPublished} onCheckedChange={setIsPublished} />
                    </div>
                  </div>
  
                  {!isFree && (
                    <div className="space-y-2">
                      <Label htmlFor="edit-price" className="font-bold">Price (BDT)</Label>
                      <Input 
                        id="edit-price" 
                        type="number" 
                        className="rounded-xl h-12 font-bold"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              <DialogFooter>
                <Button type="button" variant="outline" className="rounded-xl h-12" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                <Button type="submit" className="rounded-xl h-12 px-8 font-bold" disabled={submitting}>
                  {submitting ? "Updating..." : "Update"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
  
        {tests.length === 0 && !loading ? (
          <div className="bg-card border border-border border-dashed p-20 rounded-[3rem] flex flex-col items-center justify-center text-center">
            <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
              <Clock className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-2xl font-black">No Mock Tests</h3>
            <p className="text-muted-foreground mt-2 max-w-xs font-medium">Start by creating your first mock test.</p>
            <Button variant="outline" className="mt-8 rounded-xl font-bold border-2" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-5 w-5 mr-2" />
              Add New Mock
            </Button>
          </div>
        ) : (
          <div className="space-y-12">
            {activeTests.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Badge className="bg-primary text-primary-foreground font-bold px-4 py-1 rounded-full uppercase tracking-widest text-[10px]">Active</Badge>
                  <div className="h-[1px] flex-1 bg-border/50"></div>
                </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {activeTests.map((test) => (
                      <MockTestCard key={test.id} test={test} startEditing={startEditing} handleDeleteTest={handleDeleteTest} toggleTestStatus={toggleTestStatus} />
                    ))}
                  </div>
                </div>
              )}
  
              {inactiveTests.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="font-bold px-4 py-1 rounded-full uppercase tracking-widest text-[10px] opacity-50">Inactive</Badge>
                    <div className="h-[1px] flex-1 bg-border/50"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0 transition-all duration-500">
                    {inactiveTests.map((test) => (
                      <MockTestCard key={test.id} test={test} startEditing={startEditing} handleDeleteTest={handleDeleteTest} toggleTestStatus={toggleTestStatus} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
    </div>
  );
}

function MockTestCard({ test, startEditing, handleDeleteTest, toggleTestStatus }: { 
  test: MockTest, 
  startEditing: (test: MockTest) => void, 
  handleDeleteTest: (id: string) => void, 
  toggleTestStatus: (id: string, status: boolean) => void 
}) {
  const isLive = test.scheduled_at && new Date() >= new Date(test.scheduled_at) && 
                 new Date() <= new Date(new Date(test.scheduled_at).getTime() + (test.live_to_previous_minutes || 180) * 60000);
  
  const isUpcoming = test.scheduled_at && new Date() < new Date(test.scheduled_at);
  const isPrevious = test.scheduled_at && new Date() > new Date(new Date(test.scheduled_at).getTime() + (test.live_to_previous_minutes || 180) * 60000);

  return (
    <Card className="overflow-hidden rounded-[2.5rem] border-border/50 shadow-xl hover:shadow-2xl transition-all duration-500 group bg-card">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start mb-4">
          <Badge variant={isLive ? "default" : "secondary"} className={`font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-widest ${isLive ? 'bg-primary animate-pulse' : ''}`}>
            {isLive ? "Live" : isUpcoming ? "Upcoming" : "Previous"}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl font-hind-siliguri">
              <DropdownMenuItem onClick={() => startEditing(test)} className="gap-2 font-bold cursor-pointer">
                <Edit className="h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleTestStatus(test.id, test.is_published)} className="gap-2 font-bold cursor-pointer">
                {test.is_published ? <X className="h-4 w-4" /> : <Zap className="h-4 w-4" />} 
                {test.is_published ? "Deactivate" : "Activate"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDeleteTest(test.id)} className="gap-2 font-bold text-destructive cursor-pointer">
                <Trash className="h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardTitle className="text-xl font-black line-clamp-1 group-hover:text-primary transition-colors">{test.title}</CardTitle>
        <CardDescription className="font-medium line-clamp-2 mt-1">{test.description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-4 space-y-4">
        <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground bg-secondary/30 p-3 rounded-2xl">
          <Calendar className="h-4 w-4 text-primary" />
          {test.scheduled_at ? new Date(test.scheduled_at).toLocaleString('bn-BD', { 
            dateStyle: 'medium', 
            timeStyle: 'short' 
          }) : "Not Scheduled"}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-secondary/20 p-3 rounded-2xl text-center">
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Price</p>
            <p className="text-sm font-black">{test.is_free ? "FREE" : `৳${test.price}`}</p>
          </div>
          <div className="bg-secondary/20 p-3 rounded-2xl text-center">
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Transfer</p>
            <p className="text-sm font-black">{test.live_to_previous_minutes}m</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0 pb-6 px-6 flex flex-col gap-3">
        <Button asChild className="w-full h-12 rounded-xl font-bold gap-2 shadow-lg shadow-primary/10">
          <Link href={`/admin/tests/${test.id}`}>
            <Edit className="h-4 w-4" />
            Manage Modules
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-full h-12 rounded-xl font-bold gap-2 border-2">
          <Link href={`/admin/mock/${test.id}/results`}>
            <ExternalLink className="h-4 w-4" />
            View Results & Publish
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

