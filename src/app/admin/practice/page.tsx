"use client";

import { useEffect, useState, useCallback } from "react";
// We use a fresh Supabase client per operation to avoid AbortError or shared state issues
import { createClient } from "@/lib/supabase/client";
import { BookOpen, Plus, MoreVertical, Edit, Trash, ExternalLink, ChevronRight, ChevronDown, Headphones, PenTool } from "lucide-react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Link from "next/link";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Module {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  is_active: boolean;
  display_order: number;
}

interface Test {
  id: string;
  title: string;
  description: string;
  module: string;
  created_at: string;
  slug: string;
}

export default function AdminPracticePage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [testsByModule, setTestsByModule] = useState<Record<string, Test[]>>({});
  const [loading, setLoading] = useState(true);
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});
  
  const [isCreateTestOpen, setIsCreateTestOpen] = useState(false);
  const [currentModule, setCurrentModule] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

    const fetchData = useCallback(async (signal?: AbortSignal) => {
      setLoading(true);
      // Always create a new client per fetch to avoid sharing AbortSignal across requests
      const supabase = createClient();
      try {
        const { data: modulesData, error: modulesError } = await supabase
          .from("practice_modules")
          .select("*")
          .order("display_order")
          .abortSignal(signal!);

        if (signal?.aborted) return;
        if (modulesError) throw modulesError;

        if (modulesData) {
          setModules(modulesData);
          const testsMap: Record<string, Test[]> = {};
          for (const mod of modulesData) {
            if (signal?.aborted) return;
            const { data: tests, error: testsError } = await supabase
              .from("mock_tests")
              .select("id, title, description, module, created_at, slug")
              .eq("test_type", "practice")
              .eq("module", mod.slug)
              .order("created_at", { ascending: false })
              .abortSignal(signal!);
            if (signal?.aborted) return;
            if (testsError) throw testsError;
            testsMap[mod.slug] = tests || [];
          }
          setTestsByModule(testsMap);
        }
      } catch (err: any) {
        if (err.name === "AbortError" || signal?.aborted || err.message?.toLowerCase().includes("abort")) return;
        console.error("Error fetching practice data:", err);
        toast.error("Failed to load practice data");
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentModule) return;
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("mock_tests")
      .insert({
        title,
        description,
        test_type: "practice",
        module: currentModule,
        is_free: false,
        price: 0,
      });
    if (error) {
      toast.error("Failed to create test: " + error.message);
    } else {
      toast.success("Test created successfully");
      setIsCreateTestOpen(false);
      setTitle("");
      setDescription("");
      setCurrentModule(null);
      fetchData();
    }
    setSubmitting(false);
  };

  const [deleteTestId, setDeleteTestId] = useState<string | null>(null);

  const handleDeleteTest = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("mock_tests")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error("Failed to delete test");
    } else {
      toast.success("Test deleted");
      fetchData();
    }
    setDeleteTestId(null);
  };

  const getIcon = (icon: string) => {
    switch(icon) {
      case "headphones": return <Headphones className="h-6 w-6" />;
      case "book-open": return <BookOpen className="h-6 w-6" />;
      case "pen-tool": return <PenTool className="h-6 w-6" />;
      default: return <BookOpen className="h-6 w-6" />;
    }
  };

  const toggleModule = (slug: string) => {
    setOpenModules(prev => ({ ...prev, [slug]: !prev[slug] }));
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-green-500" />
              Practice Management
            </h1>
            <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs mt-1">
              Manage practice modules and tests
            </p>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-green-500" />
            Practice Management
          </h1>
          <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs mt-1">
            Manage practice modules and tests
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {modules.map((module) => (
          <Collapsible
            key={module.id}
            open={openModules[module.slug]}
            onOpenChange={() => toggleModule(module.slug)}
          >
            <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
              <CollapsibleTrigger asChild>
                <button className="w-full p-6 flex items-center justify-between hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center">
                      {getIcon(module.icon)}
                    </div>
                    <div className="text-left">
                      <h3 className="text-xl font-black">{module.name}</h3>
                      <p className="text-sm text-muted-foreground">{module.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary" className="font-bold">
                      {testsByModule[module.slug]?.length || 0} Tests
                    </Badge>
                    {openModules[module.slug] ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </button>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="border-t border-border/50 p-6 bg-secondary/10">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">
                      Tests in {module.name}
                    </h4>
                    <Button
                      size="sm"
                      className="gap-2 bg-green-600 hover:bg-green-700 rounded-xl"
                      onClick={() => {
                        setCurrentModule(module.slug);
                        setIsCreateTestOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      Add Test
                    </Button>
                  </div>

                  {testsByModule[module.slug]?.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p className="font-bold text-sm">No tests in this module</p>
                      <p className="text-xs mt-1">Add your first test to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {testsByModule[module.slug]?.map((test) => (
                        <div
                          key={test.id}
                          className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/30 hover:border-green-500/30 transition-all"
                        >
                          <div className="min-w-0 flex-1">
                            <h5 className="font-bold text-sm truncate">{test.title}</h5>
                            <p className="text-xs text-muted-foreground truncate">
                              {test.description || "No description"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button asChild variant="outline" size="sm" className="rounded-lg">
                              <Link href={`/admin/tests/${test.id}`}>
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Link>
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl">
                                  <DropdownMenuItem asChild>
                                    <Link href={`/practice/${test.module}/${test.slug}`}>
                                      <ExternalLink className="mr-2 h-4 w-4" />
                                      Preview
                                    </Link>
                                  </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => setDeleteTestId(test.id)}
                                  >
                                  <Trash className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        ))}
      </div>

      <Dialog open={isCreateTestOpen} onOpenChange={setIsCreateTestOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2rem]">
          <form onSubmit={handleCreateTest}>
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Create Practice Test</DialogTitle>
              <DialogDescription className="font-medium">
                Add a new test to the {currentModule} module.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="font-bold">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g. Reading Practice Test 1"
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
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" className="rounded-xl h-12" onClick={() => setIsCreateTestOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl h-12 px-8 font-bold bg-green-600 hover:bg-green-700" disabled={submitting}>
                {submitting ? "Creating..." : "Create Test"}
              </Button>
            </DialogFooter>
          </form>
</DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteTestId} onOpenChange={(open) => !open && setDeleteTestId(null)}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-black">Delete Test?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the test.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="rounded-xl bg-destructive hover:bg-destructive/90"
                onClick={() => deleteTestId && handleDeleteTest(deleteTestId)}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }
