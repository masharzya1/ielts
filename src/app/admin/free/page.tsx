"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";

interface FreeTest {
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

export default function AdminFreeTestsPage() {
  const [tests, setTests] = useState<FreeTest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTests = useCallback(async () => {
    const supabase = createClient();
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("mock_tests")
        .select("*")
        .eq("test_type", "free")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setTests((data || []) as any);
    } catch (err: any) {
      console.error("Error fetching free tests:", err);
      toast.error("Failed to load free tests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 font-hind-siliguri max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <Link
            href={`/admin`}
            className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Free Tests
          </Link>
          <h1 className="text-3xl font-black tracking-tight">Free Tests</h1>
          <p className="text-muted-foreground font-medium">Manage all free tests (Cambridge, Real, Micro)</p>
        </div>
        {/* Add create functionality if needed */}
      </div>
      <div className="grid gap-6">
        {tests.map((test) => (
          <Card key={test.id} className="p-6 rounded-2xl border-border/50">
            <CardHeader className="p-0 mb-2">
              <CardTitle className="text-xl font-bold">{test.title}</CardTitle>
              <CardDescription>{test.description || ""}</CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-2">
              {test.scheduled_at && (
                <p className="text-sm text-muted-foreground">
                  Scheduled: {new Date(test.scheduled_at).toLocaleString()}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Published: {test.is_published ? "Yes" : "No"}
              </p>
            </CardContent>
            <CardFooter className="flex items-center justify-between pt-4">
              <div className="flex gap-2">
                {/* You can add edit/delete here if needed */}
              </div>
              <Link href={`/admin/mock/${test.id}`} className="text-primary hover:underline flex items-center gap-1 text-sm">
                Manage <ChevronRight className="h-4 w-4" />
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}