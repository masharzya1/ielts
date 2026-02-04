"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
// Use per-call Supabase client instead of shared instance to avoid AbortError issues
import { createClient } from "@/lib/supabase/client";
import { BookOpen, Plus, MoreVertical, Edit, Trash, ExternalLink, Lock, CheckCircle2, Clock, ChevronRight, Calendar } from "lucide-react";
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import Link from "next/link";

interface MockTest {
  id: string;
  title: string;
  description: string;
  price: number;
  is_free: boolean;
  thumbnail_url?: string;
  created_at: string;
  test_type: "mock" | "practice";
  scheduled_at?: string;
  module?: string;
  test_category?: string;
  is_cambridge?: boolean;
  is_micro?: boolean;
}

function AdminTestsContent() {
  const searchParams = useSearchParams();
  const type = (searchParams.get("type") as "mock" | "practice") || "mock";
  
  const [tests, setTests] = useState<MockTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<MockTest | null>(null);
  
  // Form State
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("0");
    const [isFree, setIsFree] = useState(true);
    const [scheduledAt, setScheduledAt] = useState("");
    const [module, setModule] = useState("");
    const [testCategory, setTestCategory] = useState("");
    const [isCambridge, setIsCambridge] = useState(false);
    const [isMicro, setIsMicro] = useState(false);
    const [liveToPreviousMinutes, setLiveToPreviousMinutes] = useState("180");
    const [submitting, setSubmitting] = useState(false);

    // Fetch tests based on the current type. Defined with useCallback so it can be reused
    const fetchTests = useCallback(async (signal?: AbortSignal) => {
      setLoading(true);
      const supabase = createClient();
      try {
        const { data, error } = await supabase
          .from("mock_tests")
          .select("*")
          .eq("test_type", type)
          .order("created_at", { ascending: false })
          .abortSignal(signal!);
        if (error) throw error;
        if (data) setTests(data);
      } catch (err: any) {
        if (err.name === "AbortError" || signal?.aborted) return;
        console.error("Error fetching tests:", err.message || err);
        toast.error("Failed to load tests");
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    }, [type]);

    useEffect(() => {
      const controller = new AbortController();
      fetchTests(controller.signal);
      return () => controller.abort();
    }, [fetchTests]);

    const slugify = (text: string) => {
      return text
        .toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');
    };

    const handleCreateTest = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);

      const generatedSlug = slugify(title);

      const supabase = createClient();
      const { data, error } = await supabase
        .from("mock_tests")
        .insert({
          title,
          slug: generatedSlug,
          description,
          price: isFree ? 0 : parseFloat(price),
          is_free: isFree,
          test_type: type,
          scheduled_at: type === "mock" && scheduledAt ? new Date(scheduledAt).toISOString() : null,
          module: type === "practice" ? module : null,
          test_category: testCategory || (type === "practice" ? "practice" : "mock"),
          is_cambridge: isCambridge,
          is_micro: isMicro,
          live_to_previous_minutes: type === "mock" ? parseInt(liveToPreviousMinutes) || 180 : null,
          is_published: true,
        })
        .select()
        .maybeSingle();

      if (error) {
        toast.error("Failed to create test: " + error.message);
      } else {
        toast.success(`${type === "mock" ? "Mock" : "Practice"} created successfully`);
        setIsCreateOpen(false);
        resetForm();
        fetchTests();
      }
      setSubmitting(false);
    };

    const handleUpdateTest = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingTest) return;
      setSubmitting(true);

      const supabase = createClient();
      const { error } = await supabase
        .from("mock_tests")
        .update({
          title,
          description,
          price: isFree ? 0 : (parseFloat(price) || 0),
          is_free: isFree,
          scheduled_at: type === "mock" && scheduledAt ? new Date(scheduledAt).toISOString() : null,
          module: type === "practice" ? module : null,
          test_category: testCategory || (type === "practice" ? "practice" : "mock"),
          is_cambridge: isCambridge,
          is_micro: isMicro,
          live_to_previous_minutes: type === "mock" ? parseInt(liveToPreviousMinutes) || 180 : null,
          is_published: true,
        })
        .eq("id", editingTest.id);

      if (error) {
        toast.error("Failed to update test: " + error.message);
      } else {
        toast.success("Updated successfully");
        setIsEditOpen(false);
        resetForm();
        fetchTests();
      }
      setSubmitting(false);
    };

    const resetForm = () => {
      setTitle("");
      setDescription("");
      setPrice("0");
      setIsFree(true);
      setScheduledAt("");
      setModule("");
      setTestCategory("");
      setIsCambridge(false);
      setIsMicro(false);
      setLiveToPreviousMinutes("180");
      setEditingTest(null);
    };

    const startEditing = (test: any) => {
      setEditingTest(test);
      setTitle(test.title);
      setDescription(test.description || "");
      setPrice(test.price.toString());
      setIsFree(test.is_free);
      setScheduledAt(test.scheduled_at ? new Date(test.scheduled_at).toISOString().slice(0, 16) : "");
      setModule(test.module || "");
      setTestCategory(test.test_category || "");
      setIsCambridge(test.is_cambridge || false);
      setIsMicro(test.is_micro || false);
      setLiveToPreviousMinutes(test.live_to_previous_minutes?.toString() || "180");
      setIsEditOpen(true);
    };

  const handleDeleteTest = async (id: string) => {
    if (!confirm("Are you sure you want to delete this?")) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("mock_tests")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete");
    } else {
      toast.success("Deleted");
      fetchTests();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            {type === "mock" ? <Clock className="h-8 w-8 text-primary" /> : <BookOpen className="h-8 w-8 text-green-500" />}
            {type === "mock" ? "Mock Test Management" : "Practice Management"}
          </h1>
          <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs mt-1">
            {type === "mock" ? "Schedule and price live exams" : "Manage 1-year access materials"}
          </p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className={`gap-2 shadow-lg rounded-xl h-12 px-6 font-bold ${type === 'practice' ? 'bg-green-600 hover:bg-green-700' : ''}`}>
              <Plus className="h-5 w-5" />
              Add New {type === "mock" ? "Mock" : "Practice"}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-[2rem]">
            <form onSubmit={handleCreateTest}>
              <DialogHeader>
                <DialogTitle className="text-2xl font-black">Create {type === "mock" ? "Mock" : "Practice"}</DialogTitle>
                <DialogDescription className="font-medium">
                  Fill in the details for the new IELTS content.
                </DialogDescription>
              </DialogHeader>
                <div className="grid gap-6 py-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="font-bold">Title</Label>
                    <Input 
                      id="title" 
                      placeholder={type === 'mock' ? "e.g. Next Week Mock" : "e.g. Reading Practice Set 1"} 
                      required 
                      className="rounded-xl h-12"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  {type === "practice" && (
                    <div className="space-y-2">
                      <Label htmlFor="module" className="font-bold">Module</Label>
                      <Select value={module} onValueChange={setModule}>
                        <SelectTrigger className="rounded-xl h-12">
                          <SelectValue placeholder="Select Module" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="listening">Listening</SelectItem>
                          <SelectItem value="reading">Reading</SelectItem>
                          <SelectItem value="writing">Writing</SelectItem>
                          <SelectItem value="speaking">Speaking</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="test_category" className="font-bold">Test Category (Internal slug)</Label>
                    <Input 
                      id="test_category" 
                      placeholder="e.g. practice, real_sample, cambridge" 
                      className="rounded-xl h-12"
                      value={testCategory}
                      onChange={(e) => setTestCategory(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 border border-border">
                      <Label className="text-xs font-bold">Cambridge</Label>
                      <Switch checked={isCambridge} onCheckedChange={setIsCambridge} />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 border border-border">
                      <Label className="text-xs font-bold">Micro Test</Label>
                      <Switch checked={isMicro} onCheckedChange={setIsMicro} />
                    </div>
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

                  {type === "mock" && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                      <Label htmlFor="scheduled_at" className="font-bold">Schedule Date & Time</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="scheduled_at" 
                          type="datetime-local" 
                          required={type === 'mock'}
                          className="pl-10 rounded-xl h-12"
                          value={scheduledAt}
                          onChange={(e) => setScheduledAt(e.target.value)}
                        />
                      </div>
                      <p className="text-[10px] font-bold text-primary uppercase tracking-widest">User can only start at this time</p>
                    </div>
                  )}

                  {type === "mock" && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                      <Label htmlFor="live_to_previous_minutes" className="font-bold">Minutes until move to Previous</Label>
                      <Input 
                        id="live_to_previous_minutes" 
                        type="number" 
                        className="rounded-xl h-12"
                        value={liveToPreviousMinutes}
                        onChange={(e) => setLiveToPreviousMinutes(e.target.value)}
                        placeholder="Default: 180"
                      />
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Test moves from Live to Previous after this many minutes</p>
                    </div>
                  )}

                <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/50 border border-border">
                  <div className="space-y-0.5">
                    <Label className="font-bold">Free Access</Label>
                    <p className="text-xs text-muted-foreground font-medium">Make this available without payment.</p>
                  </div>
                  <Switch checked={isFree} onCheckedChange={(checked) => setIsFree(checked)} />
                </div>

                {!isFree && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
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
                <Button type="submit" className={`rounded-xl h-12 px-8 font-bold ${type === 'practice' ? 'bg-green-600 hover:bg-green-700' : ''}`} disabled={submitting}>
                  {submitting ? "Processing..." : "Create"}
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
        <DialogContent className="sm:max-w-[500px] rounded-[2rem]">
          <form onSubmit={handleUpdateTest}>
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Edit Details</DialogTitle>
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

                {type === "mock" && (
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
                )}

                {type === "mock" && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-live_to_previous_minutes" className="font-bold">Minutes until move to Previous</Label>
                    <Input 
                      id="edit-live_to_previous_minutes" 
                      type="number" 
                      className="rounded-xl h-12"
                      value={liveToPreviousMinutes}
                      onChange={(e) => setLiveToPreviousMinutes(e.target.value)}
                      placeholder="Default: 180"
                    />
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Test moves from Live to Previous after this many minutes</p>
                  </div>
                )}

              <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/50 border border-border">
                <div className="space-y-0.5">
                  <Label className="font-bold">Free Access</Label>
                </div>
                <Switch checked={isFree} onCheckedChange={(checked) => setIsFree(checked)} />
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
              <Button type="submit" className={`rounded-xl h-12 px-8 font-bold ${type === 'practice' ? 'bg-green-600 hover:bg-green-700' : ''}`} disabled={submitting}>
                {submitting ? "Updating..." : "Update"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-[2.5rem] bg-muted animate-pulse" />
          ))}
        </div>
      ) : tests.length === 0 ? (
        <div className="bg-card border border-border border-dashed p-20 rounded-[3rem] flex flex-col items-center justify-center text-center">
          <div className={`h-20 w-20 rounded-3xl ${type === 'mock' ? 'bg-primary/10' : 'bg-green-500/10'} flex items-center justify-center mb-6`}>
            {type === 'mock' ? <Clock className="h-10 w-10 text-primary" /> : <BookOpen className="h-10 w-10 text-green-500" />}
          </div>
          <h3 className="text-2xl font-black">No {type === "mock" ? "Mock Tests" : "Practice Material"}</h3>
          <p className="text-muted-foreground mt-2 max-w-xs font-medium">Start by adding your first content to show up for users.</p>
          <Button variant="outline" className="mt-8 rounded-xl font-bold border-2" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-5 w-5 mr-2" />
            Add New
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tests.map((test) => (
            <Card key={test.id} className="group overflow-hidden rounded-[2.5rem] border-border/40 hover:border-primary/30 hover:shadow-2xl transition-all duration-500 bg-card/50 backdrop-blur-sm">
              <div className={`h-40 ${type === 'mock' ? 'bg-primary/5' : 'bg-green-500/5'} border-b border-border/50 flex items-center justify-center relative overflow-hidden`}>
                <div className={`absolute inset-0 opacity-10 ${type === 'mock' ? 'bg-primary' : 'bg-green-500'} blur-3xl -translate-y-1/2 scale-150 group-hover:opacity-20 transition-opacity`}></div>
                {type === 'mock' ? <Clock className="h-16 w-16 text-primary/20 group-hover:scale-110 transition-transform duration-700" /> : <BookOpen className="h-16 w-16 text-green-500/20 group-hover:scale-110 transition-transform duration-700" />}
                
                <div className="absolute top-6 right-6 flex gap-2">
                  {test.is_free ? (
                    <Badge className="bg-black dark:bg-primary text-white dark:text-black font-black px-4 py-1.5 rounded-full border-none">FREE</Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-background/90 backdrop-blur-md font-black px-4 py-1.5 rounded-full shadow-sm text-base">
                      ৳{test.price}
                    </Badge>
                  )}
                </div>

                {type === "mock" && test.scheduled_at && (
                  <div className="absolute bottom-4 left-6 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20 backdrop-blur-md">
                    <Calendar className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      {new Date(test.scheduled_at).toLocaleDateString()} at {new Date(test.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
              </div>
              
              <CardHeader className="p-8">
                <div className="flex justify-between items-start gap-4 mb-4">
                  <CardTitle className="text-2xl font-black leading-tight line-clamp-2 min-h-[4rem]">{test.title}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-secondary">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[160px] shadow-2xl">
                        <DropdownMenuItem asChild>
                          <Link 
                            href={test.test_type === "practice" ? `/practice/${test.module}/${test.slug}` : `/mock/${test.slug}`} 
                            className="cursor-pointer rounded-xl font-bold py-3"
                          >
                            <ExternalLink className="mr-3 h-4 w-4" />
                            View Page
                          </Link>
                        </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="cursor-pointer rounded-xl font-bold py-3" 
                        onSelect={(e) => {
                          e.preventDefault();
                          startEditing(test);
                        }}
                      >
                        <Edit className="mr-3 h-4 w-4" />
                        Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="cursor-pointer rounded-xl font-bold py-3 text-destructive focus:text-destructive focus:bg-destructive/10"
                        onClick={() => handleDeleteTest(test.id)}
                      >
                        <Trash className="mr-3 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription className="text-sm font-medium text-muted-foreground leading-relaxed line-clamp-3 min-h-[3rem]">
                  {test.description || "No description provided."}
                </CardDescription>
              </CardHeader>

              <CardFooter className="px-8 pb-8 pt-0">
                <Button asChild variant="default" className={`w-full rounded-2xl h-14 font-black text-base shadow-lg transition-all duration-300 group ${type === 'practice' ? 'bg-green-600 hover:bg-green-700 shadow-green-500/20' : 'shadow-primary/20 hover:scale-[1.02]'}`}>
                  <Link href={`/admin/tests/${test.id}`} className="flex items-center justify-center gap-2">
                    Manage Modules
                    <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminTestsPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center font-black">Loading content...</div>}>
      <AdminTestsContent />
    </Suspense>
  );
}
