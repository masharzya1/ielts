"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import CDIAdminEditor from "@/components/CDIAdminEditor";
import { Loader2, Headphones, BookOpen, PenTool, MessageSquare, ArrowRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminTestEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const [testId, setTestId] = useState<string>("");
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    async function unwrapParams() {
      const p = await params;
      setTestId(p.id);
    }
    unwrapParams();
  }, [params]);

  const sectionIdFromUrl = searchParams.get("sectionId");

  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [parts, setParts] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  useEffect(() => {
    if (sectionIdFromUrl) {
      setActiveSectionId(sectionIdFromUrl);
    }
  }, [sectionIdFromUrl]);

  useEffect(() => {
    if (!testId) return;
    fetchTestData();
  }, [testId]);

    async function fetchTestData(silent = false) {
      if (!silent) setLoading(true);
      try {
      const { data: testData } = await supabase.from("mock_tests").select("*").eq("id", testId).maybeSingle();
      if (!testData) {
        router.push("/admin/tests");
        return;
      }
      setTest(testData);

      const { data: sectionsData } = await supabase.from("test_sections").select("*").eq("test_id", testId).order("order_index");
      if (sectionsData) {
        setSections(sectionsData);
        // Initially, we stay in the "Modules Overview" if activeSectionId is null

        const sectionIds = sectionsData.map(s => s.id);
        const [partsRes, questionsRes] = await Promise.all([
          supabase.from("test_parts").select("*").in("section_id", sectionIds).order("order_index"),
          supabase.from("questions").select("*").in("section_id", sectionIds).order("order_index")
        ]);

        if (partsRes.data) setParts(partsRes.data);
          if (questionsRes.data) {
            // Map section_index from DB to sectionIndex for frontend
            const mappedQuestions = questionsRes.data.map((q: any) => ({
              ...q,
              sectionIndex: q.section_index !== null ? q.section_index : undefined
            }));
            setQuestions(mappedQuestions);
          }
      }
    } catch (err) {
      console.error("Error fetching test data:", err);
      toast.error("Failed to load test data");
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async (data: {
    parts: any[];
    questions: any[];
    deletedPartIds?: string[];
    deletedQuestionIds?: string[];
  }) => {
    try {
      // -----------------------------------------
      // Helpers: UUID check + group id normalization
      // -----------------------------------------
      const isUuid = (v: unknown) =>
        typeof v === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          v
        );
  
      // maps "group-xxxx" => "uuid"
      const groupIdMap = new Map<string, string>();
  
      const makeUuid = () => {
        // browser randomUUID if available
        if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  
        // fallback uuid v4-like
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      };
  
      const normalizeGroupId = (raw: any) => {
        if (!raw || typeof raw !== "string") return null;
        if (isUuid(raw)) return raw;
  
        // convert "group-<timestamp>" => uuid
        if (!groupIdMap.has(raw)) groupIdMap.set(raw, makeUuid());
        return groupIdMap.get(raw)!;
      };
  
      const normalizePartGroups = (groups: any) => {
        if (!Array.isArray(groups)) return [];
        return groups.map((g: any) => ({
          ...g,
          id: normalizeGroupId(g?.id) ?? g?.id, // convert group id to uuid
        }));
      };
  
      // -----------------------------------------
      // 1) Handle deletions first
      // -----------------------------------------
      if (data.deletedQuestionIds && data.deletedQuestionIds.length > 0) {
        const { error: delQErr } = await supabase
          .from("questions")
          .delete()
          .in("id", data.deletedQuestionIds);
        if (delQErr) throw delQErr;
      }
  
      if (data.deletedPartIds && data.deletedPartIds.length > 0) {
        const { error: delPErr } = await supabase
          .from("test_parts")
          .delete()
          .in("id", data.deletedPartIds);
        if (delPErr) throw delPErr;
      }
  
      // -----------------------------------------
      // 2) Process parts (upsert existing + insert new)
      // -----------------------------------------
      const partIdMap: Record<string, string> = {};
  
      const existingParts = data.parts.filter(
        (p) => p.id && !p.id.toString().startsWith("temp-")
      );
      const newParts = data.parts.filter(
        (p) => !p.id || p.id.toString().startsWith("temp-")
      );
  
      // Upsert existing parts
      if (existingParts.length > 0) {
        const partsToUpdate = existingParts.map((p) => ({
          id: p.id,
          section_id: p.section_id,
          part_number: p.part_number,
          title: p.title,
          instructions: p.instructions,
          passage_text: p.passage_text,
          audio_url: p.audio_url,
          image_url: p.image_url,
          order_index: p.order_index ?? 0,
          question_groups: normalizePartGroups(p.question_groups),
        }));
  
        const { error: upPErr } = await supabase
          .from("test_parts")
          .upsert(partsToUpdate);
        if (upPErr) throw upPErr;
  
        existingParts.forEach((p) => {
          partIdMap[p.id.toString()] = p.id.toString();
        });
      }
  
      // Insert new parts (batch) + map temp id -> new db id
      if (newParts.length > 0) {
        // Ensure each new part has a stable temp key for mapping
        const newPartsWithKey = newParts.map((p, idx) => ({
          ...p,
          __tempKey: (p.id ? p.id.toString() : `temp-auto-${idx}`) as string,
        }));
  
        const partsToInsert = newPartsWithKey.map((part) => ({
          section_id: part.section_id,
          part_number: part.part_number,
          title: part.title,
          instructions: part.instructions,
          passage_text: part.passage_text,
          audio_url: part.audio_url,
          image_url: part.image_url,
          order_index: part.order_index ?? 0,
          question_groups: normalizePartGroups(part.question_groups),
        }));
  
        const { data: insertedParts, error: insPErr } = await supabase
          .from("test_parts")
          .insert(partsToInsert)
          .select("id, section_id, part_number, title, order_index");
  
        if (insPErr) throw insPErr;
  
        if (insertedParts && insertedParts.length > 0) {
          // Robust matching: section_id + order_index + part_number (and fallback to position)
          newPartsWithKey.forEach((p, idx) => {
            const match =
              insertedParts.find(
                (ip) =>
                  ip.section_id === p.section_id &&
                  ip.order_index === (p.order_index ?? 0) &&
                  ip.part_number === p.part_number
              ) ||
              insertedParts.find(
                (ip) =>
                  ip.section_id === p.section_id &&
                  ip.order_index === (p.order_index ?? 0) &&
                  ip.title === p.title
              ) ||
              insertedParts[idx];
  
            if (match) {
              partIdMap[p.__tempKey] = match.id;
            }
          });
        }
      }
  
      // -----------------------------------------
      // 3) Process questions (normalize part_id + group_id + section_index)
      // -----------------------------------------
  
      const questionsToUpsert = data.questions.map((q) => {
        // Map temp part id to real part id
        const rawPartKey = q.part_id?.toString() || q.temp_part_id?.toString();
        const finalPartId = (rawPartKey && partIdMap[rawPartKey]) || q.part_id;
  
        const qData: any = {
          section_id: q.section_id,
          part_id: finalPartId,
          question_type: q.question_type,
          question_text: q.question_text,
          options: q.options,
          correct_answer: q.correct_answer,
          points: q.points,
          order_index: q.order_index ?? 0,
  
          // ✅ critical fix: ensure uuid or null
          group_id: normalizeGroupId(q.group_id),
  
          // Option 1 (Recommended): keep section_index only if column exists in DB
          // If you've added the column, keep this line:
          section_index:
            q.sectionIndex !== undefined
              ? q.sectionIndex
              : q.section_index !== undefined
              ? q.section_index
              : null,
        };
  
        // ✅ If you DID NOT add `section_index` column yet, comment out the section_index block above.
  
        if (q.id && !q.id.toString().startsWith("temp-")) {
          qData.id = q.id;
        }
  
        return qData;
      });
  
      const existingQs = questionsToUpsert.filter((q) => q.id);
      const newQs = questionsToUpsert.filter((q) => !q.id);
  
      if (existingQs.length > 0) {
        const { error: upQErr } = await supabase
          .from("questions")
          .upsert(existingQs);
        if (upQErr) throw upQErr;
      }
  
      if (newQs.length > 0) {
        const { error: insQErr } = await supabase
          .from("questions")
          .insert(newQs);
        if (insQErr) throw insQErr;
      }
  
      toast.success("Changes saved successfully");
      fetchTestData(true);
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save changes. Please try again.");
    }
  };
  

    const activeSection = sections.find(s => s.id === activeSectionId);
    const questionOffset = useMemo(() => {
      if (!activeSection) return 0;
      return questions
        .filter(q => {
          const s = sections.find(sec => sec.id === q.section_id);
          return s && s.order_index < activeSection.order_index;
        })
        .length;
    }, [activeSection, questions, sections]);

    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-[#1a1a1a] gap-6">
          <div className="relative">
            <div className="h-24 w-24 rounded-full border-4 border-[#0072bc]/10 animate-pulse"></div>
            <Loader2 className="h-12 w-12 animate-spin text-[#0072bc] absolute inset-0 m-auto" />
          </div>
          <div className="text-center">
            <p className="text-xl font-black tracking-tighter text-[#222] dark:text-white">OPENING VISUAL EDITOR</p>
            <p className="text-[#666] dark:text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Applying IDP Standard Theme...</p>
          </div>
        </div>
      );
    }

    // Dashboard / Module Selection View
  if (!activeSectionId) {
    return (
      <div className="fixed inset-0 bg-[#f8f9fa] dark:bg-[#1a1a1a] flex flex-col font-hind-siliguri">
        <header className="h-16 bg-white dark:bg-[#222] border-b dark:border-[#333] flex items-center justify-between px-8 shadow-sm">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-black text-[#DC2626]">IELTS</h1>
            <div className="h-8 w-px bg-gray-200 dark:bg-[#444]" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Visual Test Editor</span>
              <span className="text-lg font-black text-[#222] dark:text-white truncate max-w-[300px]">{test?.title}</span>
            </div>
          </div>
          <button 
            onClick={() => router.push(`/admin/tests/${testId}`)}
            className="flex items-center gap-2 px-6 h-10 bg-white dark:bg-[#333] border border-gray-200 dark:border-[#444] rounded-xl text-sm font-black hover:bg-gray-50 dark:hover:bg-[#444] transition-all shadow-sm dark:text-white"
          >
            EXIT EDITOR
          </button>
        </header>

        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col mb-12">
              <h2 className="text-4xl font-black text-[#222] dark:text-white tracking-tighter">Test Modules</h2>
              <p className="text-muted-foreground font-bold text-sm uppercase tracking-widest mt-2">Select a module to begin visual editing</p>
            </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {sections.map(s => {
                  const sectionParts = parts.filter(p => p.section_id === s.id);
                  const sectionQuestions = questions.filter(q => q.section_id === s.id);
                  const isBlue = s.section_type === 'reading' || s.section_type === 'listening';
                  const isRed = s.section_type === 'writing';
                  const themeColor = isBlue ? "#0072bc" : isRed ? "#DC2626" : "#7c3aed";
                  const themeBg = isBlue ? "bg-[#0072bc]" : isRed ? "bg-[#DC2626]" : "bg-[#7c3aed]";
                  const themeLightBg = isBlue ? "bg-[#0072bc]/5" : isRed ? "bg-[#DC2626]/5" : "bg-[#7c3aed]/5";
                  
                  return (
                    <button
                      key={s.id}
                      onClick={() => setActiveSectionId(s.id)}
                      className={cn(
                        "group bg-white dark:bg-[#222] p-8 rounded-[2rem] border-2 border-transparent shadow-xl hover:shadow-2xl transition-all duration-500 text-left relative overflow-hidden flex flex-col items-start",
                        isBlue ? "hover:border-[#0072bc]" : isRed ? "hover:border-[#DC2626]" : "hover:border-[#7c3aed]"
                      )}
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="text-6xl font-black uppercase dark:text-white">{s.section_type[0]}</span>
                      </div>
                      
                      <div className={cn(
                        "h-16 w-16 rounded-2xl flex items-center justify-center mb-8 transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3 group-hover:text-white",
                        themeLightBg,
                        isBlue ? "text-[#0072bc] group-hover:bg-[#0072bc]" : 
                        isRed ? "text-[#DC2626] group-hover:bg-[#DC2626]" : 
                        "text-[#7c3aed] group-hover:bg-[#7c3aed]"
                      )}>
                        {s.section_type === 'listening' ? <Headphones size={32}/> : 
                         s.section_type === 'reading' ? <BookOpen size={32}/> : 
                         s.section_type === 'writing' ? <PenTool size={32}/> : 
                         <MessageSquare size={32}/>}
                      </div>

                      <h3 className={cn(
                        "text-2xl font-black uppercase tracking-tight mb-2 transition-colors dark:text-white",
                        isBlue ? "group-hover:text-[#0072bc]" : isRed ? "group-hover:text-[#DC2626]" : "group-hover:text-[#7c3aed]"
                      )}>{s.section_type}</h3>
                      
                      <div className="mt-auto space-y-1">
                        <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                          <div className={cn("w-1.5 h-1.5 rounded-full", isBlue ? "bg-[#0072bc]" : isRed ? "bg-[#DC2626]" : "bg-[#7c3aed]")} />
                          {sectionParts.length} Parts
                        </div>
                        <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                          {sectionQuestions.length} Questions
                        </div>
                      </div>

                      <div className="absolute bottom-6 right-6 h-10 w-10 rounded-full bg-gray-50 dark:bg-[#333] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0 shadow-lg border border-gray-100 dark:border-[#444]">
                        <ArrowRight size={18} className={isBlue ? "text-[#0072bc]" : isRed ? "text-[#DC2626]" : "text-[#7c3aed]"} />
                      </div>
                    </button>
                  );
                })}
              </div>
          </div>
        </main>
      </div>
    );
  }

  // Inside a Module - Modules + Parts flow
  return (
    <div className="fixed inset-0 bg-white flex flex-col font-hind-siliguri overflow-hidden">
      {/* Mini Module Switcher */}
      <div className="h-12 bg-[#222] text-white flex items-center px-6 gap-2 shrink-0 overflow-x-auto no-scrollbar border-b border-black">
        <button 
          onClick={() => setActiveSectionId(null)}
          className="mr-4 text-[10px] font-black uppercase tracking-widest text-[#999] hover:text-white flex items-center gap-2 transition-colors"
        >
          <ChevronLeft size={12} /> ALL MODULES
        </button>
        <div className="h-4 w-px bg-white/10 mr-4" />
        {sections.map(s => {
          const isBlue = s.section_type === 'reading' || s.section_type === 'listening';
          const isRed = s.section_type === 'writing';
          const activeColor = isBlue ? "bg-[#0072bc]" : isRed ? "bg-[#DC2626]" : "bg-[#7c3aed]";
          
          return (
            <button
              key={s.id}
              onClick={() => setActiveSectionId(s.id)}
              className={cn(
                "h-8 px-5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-2",
                activeSectionId === s.id 
                  ? cn(activeColor, "text-white shadow-lg") 
                  : "text-[#999] hover:text-white hover:bg-white/5"
              )}
            >
              {s.section_type === 'listening' ? <Headphones size={10}/> : 
               s.section_type === 'reading' ? <BookOpen size={10}/> : 
               s.section_type === 'writing' ? <PenTool size={10}/> : 
               <MessageSquare size={10}/>}
              {s.section_type}
            </button>
          );
        })}
      </div>

        <CDIAdminEditor
          key={activeSectionId}
          testTitle={test?.title}
          section={activeSection}
          parts={parts.filter(p => p.section_id === activeSectionId)}
          questions={questions.filter(q => q.section_id === activeSectionId)}
          questionOffset={questionOffset}
          onSave={handleSave}
          onExit={() => setActiveSectionId(null)}
        />
    </div>
  );
}
