"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Props = {
  onComplete: () => void;
};

export function IELTSInfoForm({ onComplete }: Props) {
  const supabase = createClient();

  const [loading, setLoading] = useState(false);

  const [targetScore, setTargetScore] = useState<string>("");
  const [testType, setTestType] = useState<string>("Academic");
  const [examDate, setExamDate] = useState<string>("");
  const [currentLevel, setCurrentLevel] = useState<string>("Beginner");
  const [phone, setPhone] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedTarget = Number(targetScore);

    if (!parsedTarget || parsedTarget < 4 || parsedTarget > 9) {
      toast.error("Target score must be between 4.0 and 9.0");
      return;
    }

    try {
      setLoading(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        toast.error("You are not logged in.");
        setLoading(false);
        return;
      }

      // ✅ This prevents silent "0 rows updated" issue
      const { data, error } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            target_score: parsedTarget,
            test_type: testType,
            exam_date: examDate ? examDate : null,
            current_level: currentLevel,
            phone: phone || null,
          },
          { onConflict: "id" }
        )
        .select()
        .single();

      if (error) {
        console.error("Profile upsert error:", error);
        toast.error(error.message || "Failed to save profile.");
        setLoading(false);
        return;
      }

      if (!data?.id) {
        toast.error("Profile was not saved (no row returned).");
        setLoading(false);
        return;
      }

      toast.success("Saved!");
      onComplete();
      setLoading(false);
    } catch (err: any) {
      console.error("Unexpected error:", err);
      toast.error("Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle>IELTS Profile</CardTitle>
        <CardDescription>
          আপনার টার্গেট এবং পরীক্ষার তথ্য দিন—এই তথ্য দিয়ে আমরা ড্যাশবোর্ড সাজাবো।
        </CardDescription>
      </CardHeader>

      <CardContent className="px-0">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="target">Target Band Score</Label>
            <Input
              id="target"
              type="number"
              step="0.5"
              min="4"
              max="9"
              value={targetScore}
              onChange={(e) => setTargetScore(e.target.value)}
              placeholder="e.g. 7.0"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="testType">Test Type</Label>
            <select
              id="testType"
              value={testType}
              onChange={(e) => setTestType(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="Academic">Academic</option>
              <option value="General Training">General Training</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="examDate">Exam Date (optional)</Label>
            <Input
              id="examDate"
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="level">Current Level</Label>
            <select
              id="level"
              value={currentLevel}
              onChange={(e) => setCurrentLevel(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
