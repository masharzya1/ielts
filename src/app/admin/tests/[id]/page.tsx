"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Edit, 
  Headphones, 
  BookOpen, 
  PenTool, 
  MessageSquare,
  Save,
  ChevronRight,
  FileText,
  Clock,
  Layers,
  Music,
  Type,
  Info,
  Eye
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import AdminQuestionBuilder from "@/components/AdminQuestionBuilder";

interface MockTest {
  id: string;
  title: string;
  description: string;
  price: number;
  is_free: boolean;
  test_type?: "mock" | "practice";
}

interface TestSection {
  id: string;
  test_id: string;
  section_type: "listening" | "reading" | "writing" | "speaking";
  title: string;
  content: any;
  time_limit: number;
  order_index: number;
  instructions: string;
}

interface TestPart {
  id: string;
  section_id: string;
  part_number: number;
  title: string;
  instructions: string;
  passage_text?: string;
  audio_url?: string;
  image_url?: string;
  pdf_url?: string;
  order_index: number;
}

interface Question {
  id: string;
  section_id: string;
  part_id: string | null;
  question_type: string;
  question_text: string;
  options: string[] | null;
  correct_answer: string;
  order_index: number;
  passage_text?: string;
  audio_url?: string;
  image_url?: string;
  word_limit?: number;
  points: number;
  explanation?: string;
}

const SECTION_ICONS = {
  listening: Headphones,
  reading: BookOpen,
  writing: PenTool,
  speaking: MessageSquare,
};

const SECTION_COLORS = {
  listening: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  reading: "bg-green-500/10 text-green-500 border-green-500/20",
  writing: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  speaking: "bg-purple-500/10 text-purple-500 border-purple-500/20",
};

const QUESTION_TYPES = {
  listening: [
    { value: "multiple_choice", label: "MCQ" },
    { value: "gap_fill", label: "Gap Fill (Fields in Text)" },
    { value: "matching", label: "Matching" },
    { value: "sentence_completion", label: "Sentence Completion" },
  ],
  reading: [
    { value: "multiple_choice", label: "MCQ" },
    { value: "gap_fill", label: "Gap Fill (Fields in Text)" },
    { value: "true_false_ng", label: "True/False/Not Given" },
    { value: "yes_no_ng", label: "Yes/No/Not Given" },
    { value: "matching_headings", label: "Matching Headings" },
    { value: "short_answer", label: "Short Answer" },
  ],
  writing: [
    { value: "task1", label: "Task 1" },
    { value: "task2", label: "Task 2" },
  ],
  speaking: [
    { value: "part1", label: "Part 1" },
    { value: "part2", label: "Part 2" },
    { value: "part3", label: "Part 3" },
  ],
};

export default function TestContentPage({ params }: { params: any }) {
  const [testId, setTestId] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    async function unwrapParams() {
      const p = await params;
      setTestId(p.id);
    }
    unwrapParams();
  }, [params]);

  const [test, setTest] = useState<MockTest | null>(null);
  const [sections, setSections] = useState<TestSection[]>([]);
  const [parts, setParts] = useState<Record<string, TestPart[]>>({});
  const [questions, setQuestions] = useState<Record<string, Question[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("listening");

  // Navigation View State
  const [view, setView] = useState<"sections" | "parts" | "questions">("sections");
  const [currentSection, setCurrentSection] = useState<TestSection | null>(null);
  const [currentPart, setCurrentPart] = useState<TestPart | null>(null);

  // Dialog States
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [isAddPartOpen, setIsAddPartOpen] = useState(false);
  const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false);
  
  const [editingSection, setEditingSection] = useState<TestSection | null>(null);
  const [editingPart, setEditingPart] = useState<TestPart | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // New Item States
  const [newSection, setNewSection] = useState({
    section_type: "listening" as const,
    title: "",
    time_limit: 30,
    instructions: "",
  });

  const [newPart, setNewPart] = useState({
    part_number: 1,
    title: "",
    instructions: "",
    passage_text: "",
    audio_url: "",
    pdf_url: "",
  });

  const [newQuestion, setNewQuestion] = useState({
    question_type: "multiple_choice",
    question_text: "",
    options: ["", "", "", ""],
    correct_answer: "",
    points: 1,
    explanation: "",
    word_limit: 0,
  });

  const getGapFillPlaceholders = (text: string) => {
    const matches = text.match(/\[\[\d+\]\]/g);
    if (!matches) return [];
    return Array.from(new Set(matches)).sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)![0]);
      const numB = parseInt(b.match(/\d+/)![0]);
      return numA - numB;
    });
  };

  const gapFillPlaceholders = getGapFillPlaceholders(newQuestion.question_text);
  const editingGapFillPlaceholders = editingQuestion ? getGapFillPlaceholders(editingQuestion.question_text) : [];

  useEffect(() => {
    if (!testId) return;
    fetchTestData();
  }, [testId]);

  // Sync question type when activeTab changes
  useEffect(() => {
    const types = QUESTION_TYPES[activeTab as keyof typeof QUESTION_TYPES];
    if (types && types.length > 0) {
      setNewQuestion(prev => ({ ...prev, question_type: types[0].value }));
    }
  }, [activeTab]);

  async function fetchTestData() {
    setLoading(true);
    try {
      const { data: testData } = await supabase.from("mock_tests").select("*").eq("id", testId).maybeSingle();
      if (testData) setTest(testData);

      const { data: sectionsData } = await supabase.from("test_sections").select("*").eq("test_id", testId).order("order_index");
      if (sectionsData) {
        setSections(sectionsData);
        const sectionIds = sectionsData.map(s => s.id);
        
        if (sectionIds.length > 0) {
          const { data: partsData } = await supabase.from("test_parts").select("*").in("section_id", sectionIds).order("order_index");
          if (partsData) {
            const pbs: Record<string, TestPart[]> = {};
            partsData.forEach(p => {
              if (!pbs[p.section_id]) pbs[p.section_id] = [];
              pbs[p.section_id].push(p);
            });
            setParts(pbs);

            const partIds = partsData.map(p => p.id);
            if (partIds.length > 0) {
              const { data: qData } = await supabase.from("questions").select("*").in("part_id", partIds).order("order_index");
              if (qData) {
                const qbp: Record<string, Question[]> = {};
                qData.forEach(q => {
                  if (q.part_id) {
                    if (!qbp[q.part_id]) qbp[q.part_id] = [];
                    qbp[q.part_id].push(q);
                  }
                });
                setQuestions(qbp);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("Error fetching test data:", err);
      toast.error("Failed to load test data");
    } finally {
      setLoading(false);
    }
  }

  // --- Section Actions ---
  const handleAddSection = async () => {
    if (!testId) {
      toast.error("Test ID is missing");
      return;
    }
    
    try {
      const { error } = await supabase.from("test_sections").insert({
        test_id: testId,
        section_type: newSection.section_type,
        title: newSection.title || `${newSection.section_type.toUpperCase()} Section`,
        time_limit: newSection.time_limit,
        instructions: newSection.instructions,
        order_index: sections.length,
      });
      
      if (error) {
        console.error("Supabase error adding section:", error);
        toast.error("Failed to add section: " + error.message);
      } else { 
        toast.success("Section added"); 
        setIsAddSectionOpen(false); 
        fetchTestData(); 
        
        // Redirect to visual editor after adding
        const { data: newSections } = await supabase.from("test_sections").select("id").eq("test_id", testId).eq("section_type", newSection.section_type).order("created_at", { ascending: false }).limit(1);
        if (newSections && newSections[0]) {
          router.push(`/admin/tests/${testId}/editor?sectionId=${newSections[0].id}`);
        }
      }
    } catch (err: any) {
      console.error("Error adding section:", err);
      toast.error("An unexpected error occurred");
    }
  };

  const handleUpdateSection = async () => {
    if (!editingSection) return;
    const { error } = await supabase.from("test_sections").update({
      title: editingSection.title,
      time_limit: editingSection.time_limit,
      instructions: editingSection.instructions,
    }).eq("id", editingSection.id);
    if (error) toast.error("Failed to update section");
    else { toast.success("Section updated"); setEditingSection(null); fetchTestData(); }
  };

  const handleDeleteSection = async (id: string) => {
    if (!confirm("Delete this section and all its contents?")) return;
    const { error } = await supabase.from("test_sections").delete().eq("id", id);
    if (error) toast.error("Failed to delete section");
    else { toast.success("Section deleted"); fetchTestData(); }
  };

  // --- Part Actions ---
  const handleAddPart = async () => {
    if (!currentSection?.id) {
      toast.error("No section selected");
      return;
    }
    const { error } = await supabase.from("test_parts").insert({
      section_id: currentSection.id,
      part_number: newPart.part_number,
      title: newPart.title || `Part ${newPart.part_number}`,
      instructions: newPart.instructions,
      passage_text: newPart.passage_text,
      audio_url: newPart.audio_url,
      pdf_url: newPart.pdf_url,
      order_index: (parts[currentSection.id]?.length || 0),
    });
    if (error) toast.error("Failed to add part: " + error.message);
    else { 
      toast.success("Part added"); 
      setIsAddPartOpen(false); 
      setNewPart({
        part_number: (parts[currentSection.id]?.length || 0) + 2,
        title: "",
        instructions: "",
        passage_text: "",
        audio_url: "",
      });
      fetchTestData(); 
    }
  };

  const handleUpdatePart = async () => {
    if (!editingPart) return;
    const { error } = await supabase.from("test_parts").update({
      title: editingPart.title,
      part_number: editingPart.part_number,
      instructions: editingPart.instructions,
      passage_text: editingPart.passage_text,
      audio_url: editingPart.audio_url,
      pdf_url: editingPart.pdf_url,
    }).eq("id", editingPart.id);
    if (error) toast.error("Failed to update part");
    else { toast.success("Part updated"); setEditingPart(null); fetchTestData(); }
  };

  const handleDeletePart = async (id: string) => {
    if (!confirm("Delete this part and all its questions?")) return;
    const { error } = await supabase.from("test_parts").delete().eq("id", id);
    if (error) toast.error("Failed to delete part");
    else { toast.success("Part deleted"); fetchTestData(); }
  };

  // --- Question Actions ---
  const handleAddQuestion = async () => {
    if (!currentPart?.id || !currentSection?.id) {
      toast.error("Missing section or part information");
      return;
    }
    
    if (!newQuestion.question_text.trim()) {
      toast.error("Question text is required");
      return;
    }

    const { error } = await supabase.from("questions").insert({
      section_id: currentSection.id,
      part_id: currentPart.id,
      question_type: newQuestion.question_type,
      question_text: newQuestion.question_text,
      options: newQuestion.options.filter(o => o.trim()),
      correct_answer: newQuestion.correct_answer,
      points: newQuestion.points,
      explanation: newQuestion.explanation,
      word_limit: newQuestion.word_limit || null,
      order_index: (questions[currentPart.id]?.length || 0) + 1,
    });
    
    if (error) {
      toast.error("Failed to add question: " + error.message);
    } else { 
      toast.success("Question added"); 
      setIsAddQuestionOpen(false); 
      // Reset question state but keep the type
      setNewQuestion({
        ...newQuestion,
        question_text: "",
        options: ["", "", "", ""],
        correct_answer: "",
        points: 1,
        explanation: "",
        word_limit: 0,
      });
      fetchTestData(); 
    }
  };

  const handleUpdateQuestion = async () => {
    if (!editingQuestion) return;
    const { error } = await supabase.from("questions").update({
      question_type: editingQuestion.question_type,
      question_text: editingQuestion.question_text,
      options: editingQuestion.options,
      correct_answer: editingQuestion.correct_answer,
      points: editingQuestion.points,
      explanation: editingQuestion.explanation,
      word_limit: editingQuestion.word_limit,
    }).eq("id", editingQuestion.id);
    if (error) toast.error("Failed to update question");
    else { toast.success("Question updated"); setEditingQuestion(null); fetchTestData(); }
  };

  const handleDeleteQuestion = async (id: string) => {
    const { error } = await supabase.from("questions").delete().eq("id", id);
    if (error) toast.error("Failed to delete question");
    else { toast.success("Question deleted"); fetchTestData(); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;

  return (
    <div className="space-y-6">
      {/* Breadcrumbs / Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button variant="ghost" size="sm" asChild className="h-auto p-0 hover:bg-transparent">
            <Link href="/admin/tests" className="flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" /> All Tests
            </Link>
          </Button>
          <ChevronRight className="h-3 w-3" />
          <span 
            className={`cursor-pointer hover:text-primary ${view === 'sections' ? 'text-primary font-bold' : ''}`}
            onClick={() => setView('sections')}
          >
            {test?.title}
          </span>
          {currentSection && (
            <>
              <ChevronRight className="h-3 w-3" />
              <span 
                className={`cursor-pointer hover:text-primary ${view === 'parts' ? 'text-primary font-bold' : ''}`}
                onClick={() => setView('parts')}
              >
                {currentSection.section_type.toUpperCase()}
              </span>
            </>
          )}
          {currentPart && (
            <>
              <ChevronRight className="h-3 w-3" />
              <span className="text-primary font-bold">Part {currentPart.part_number}</span>
            </>
          )}
        </div>
        
        <div className="flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold">
            Select Module
          </h1>
        </div>
      </div>

      {view === 'sections' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(['listening', 'reading', 'writing', 'speaking'] as const).map((type) => {
            const section = sections.find(s => s.section_type === type);
            const Icon = SECTION_ICONS[type];
            return (
              <Card 
                key={type} 
                className={`cursor-pointer hover:border-primary/50 transition-all group relative overflow-hidden ${!section ? 'opacity-60 grayscale' : ''}`}
                onClick={() => {
                  if (section) {
                    setCurrentSection(section);
                    setView('parts');
                  } else {
                    setNewSection({ ...newSection, section_type: type });
                    setIsAddSectionOpen(true);
                  }
                }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br opacity-5 ${
                  type === 'listening' ? 'from-blue-500' :
                  type === 'reading' ? 'from-green-500' :
                  type === 'writing' ? 'from-orange-500' : 'from-purple-500'
                }`} />
                <CardContent className="p-8 text-center flex flex-col items-center gap-4 relative z-10">
                  <div className={`h-16 w-16 rounded-2xl flex items-center justify-center ${SECTION_COLORS[type]}`}>
                    <Icon className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold capitalize">{type}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {section ? `${parts[section.id]?.length || 0} Parts Added` : 'Not started yet'}
                    </p>
                  </div>
                  {section ? (
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="mt-2 w-full font-bold shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/admin/tests/${testId}/editor?sectionId=${section.id}`);
                      }}
                    >
                      <PenTool className="h-3 w-3 mr-1" /> Visual Editor
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" className="mt-2 w-full">
                      <Plus className="h-3 w-3 mr-1" /> Initial Setup
                    </Button>
                  )}
                </CardContent>
                {section && (
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setEditingSection(section); }}><Edit className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteSection(section.id); }}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* VIEW: Parts List */}
      {view === 'parts' && currentSection && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Available Parts</h2>
            <Button variant="outline" size="sm" onClick={() => setIsAddPartOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add Part
            </Button>
          </div>
          <div className="grid gap-4">
            {(parts[currentSection.id] || []).length === 0 ? (
              <Card className="border-dashed"><CardContent className="py-12 text-center text-muted-foreground italic">No parts added yet. Click "Add Part" to begin.</CardContent></Card>
            ) : (
              (parts[currentSection.id] || []).map(part => (
                <Card 
                  key={part.id} 
                  className="cursor-pointer hover:border-primary/50 group"
                  onClick={() => {
                    setCurrentPart(part);
                    setView('questions');
                  }}
                >
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl">
                        {part.part_number}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">{part.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">{part.instructions}</p>
                        <div className="flex gap-3 mt-2">
                          <Badge variant="secondary" className="text-[10px] font-normal">{questions[part.id]?.length || 0} Questions</Badge>
                          {part.audio_url && <Badge variant="outline" className="text-[10px] text-blue-500 border-blue-500/20">Audio</Badge>}
                          {part.passage_text && <Badge variant="outline" className="text-[10px] text-green-500 border-green-500/20">Passage</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setEditingPart(part); }}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={(e) => { e.stopPropagation(); handleDeletePart(part.id); }}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

        {/* VIEW: Questions List */}
        {view === 'questions' && currentPart && (
          <div className="space-y-6">
            <div className="bg-secondary/20 p-6 rounded-2xl border border-border flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                <h3 className="font-bold mb-2 flex items-center gap-2 text-sm uppercase tracking-wider"><Info className="h-4 w-4" /> Visual Editor Recommended</h3>
                <p className="text-sm text-muted-foreground italic">For better experience adding gaps, diagrams, flowcharts and matching questions, please use the Visual Editor.</p>
              </div>
              <Button asChild size="lg" className="shrink-0 font-black gap-2 shadow-xl">
                <Link href={`/admin/tests/${testId}/editor?sectionId=${currentSection?.id}`}>
                  <PenTool size={18} /> OPEN VISUAL EDITOR
                </Link>
              </Button>
            </div>

            <div className="space-y-4">
            {(questions[currentPart.id] || []).length === 0 ? (
              <Card className="border-dashed"><CardContent className="py-20 text-center text-muted-foreground italic">No questions in this part yet.</CardContent></Card>
            ) : (
              (questions[currentPart.id] || []).map((q, idx) => (
                <Card key={q.id} className="group overflow-hidden border-border/50">
                  <CardContent className="p-6 flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0 mt-1">
                        {idx + 1}
                      </div>
                      <div className="space-y-2 flex-1">
                        <p className="text-lg font-medium leading-relaxed">{q.question_text}</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="capitalize">{q.question_type.replace("_", " ")}</Badge>
                          <Badge className="bg-primary/10 text-primary border-none">{q.points} Points</Badge>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 border-l pl-2 ml-1">
                            <span className="font-bold">Ans:</span> {q.correct_answer}
                          </div>
                        </div>
                        {q.options && q.options.length > 0 && (
                          <div className="grid sm:grid-cols-2 gap-2 mt-4">
                            {q.options.map((opt, i) => (
                              <div key={i} className={`p-2 rounded border text-sm ${q.correct_answer === opt ? 'bg-green-500/10 border-green-500/30 text-green-700' : 'bg-secondary/30'}`}>
                                <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span> {opt}
                              </div>
                            ))}
                          </div>
                        )}
                        {q.explanation && (
                          <div className="text-xs text-muted-foreground bg-secondary/10 p-2 rounded mt-2 italic">
                            <span className="font-bold non-italic mr-1">Explanation:</span> {q.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <Button variant="outline" size="icon" onClick={() => setEditingQuestion(q)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteQuestion(q.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* --- DIALOGS --- */}

      {/* Add Section */}
      <Dialog open={isAddSectionOpen} onOpenChange={setIsAddSectionOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add {newSection.section_type.toUpperCase()} Section</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Title</Label><Input value={newSection.title} onChange={e => setNewSection({...newSection, title: e.target.value})} placeholder="e.g. Listening Module" /></div>
            <div className="space-y-2"><Label>Time Limit (mins)</Label><Input type="number" value={newSection.time_limit} onChange={e => setNewSection({...newSection, time_limit: parseInt(e.target.value)})} /></div>
            <div className="space-y-2"><Label>Instructions</Label><Textarea value={newSection.instructions} onChange={e => setNewSection({...newSection, instructions: e.target.value})} rows={3} /></div>
          </div>
          <DialogFooter><Button onClick={handleAddSection}>Add Section</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Part */}
      <Dialog open={isAddPartOpen} onOpenChange={setIsAddPartOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Add New Part</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Part Number</Label><Input type="number" value={newPart.part_number} onChange={e => setNewPart({...newPart, part_number: parseInt(e.target.value)})} /></div>
              <div className="space-y-2"><Label>Part Title</Label><Input value={newPart.title} onChange={e => setNewPart({...newPart, title: e.target.value})} placeholder="e.g. Part 1: Social Context" /></div>
            </div>
            <div className="space-y-2"><Label>Instructions</Label><Textarea value={newPart.instructions} onChange={e => setNewPart({...newPart, instructions: e.target.value})} rows={3} /></div>
              <div className="space-y-2"><Label>Audio URL (for Listening)</Label><Input value={newPart.audio_url} onChange={e => setNewPart({...newPart, audio_url: e.target.value})} /></div>
              {test?.test_type === "practice" && (
                <div className="space-y-2"><Label>PDF URL (for Practice Materials)</Label><Input value={newPart.pdf_url} onChange={e => setNewPart({...newPart, pdf_url: e.target.value})} /></div>
              )}

            <div className="space-y-2"><Label>Passage/Text (for Reading)</Label><Textarea value={newPart.passage_text} onChange={e => setNewPart({...newPart, passage_text: e.target.value})} rows={10} placeholder="For gap-fill questions, use [[1]], [[2]] etc. as placeholders in the text." /></div>
          </div>
          <DialogFooter><Button onClick={handleAddPart}>Add Part</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Question */}
      <Dialog open={isAddQuestionOpen} onOpenChange={setIsAddQuestionOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Question</DialogTitle>
            <DialogDescription>
              Create a new question for Part {currentPart?.part_number}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <AdminQuestionBuilder 
              sectionType={currentSection?.section_type || ""}
              onSave={async (data) => {
                const { error } = await supabase.from("questions").insert({
                  section_id: currentSection?.id,
                  part_id: currentPart?.id,
                  question_type: data.question_type,
                  question_text: data.question_text,
                  options: data.options,
                  correct_answer: data.correct_answer,
                  points: data.points,
                  explanation: data.explanation,
                  order_index: (questions[currentPart?.id || ""]?.length || 0) + 1,
                });
                
                if (error) toast.error("Failed to add question");
                else {
                  toast.success("Question added successfully");
                  setIsAddQuestionOpen(false);
                  fetchTestData();
                }
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Question */}
      <Dialog open={!!editingQuestion} onOpenChange={open => !open && setEditingQuestion(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
          </DialogHeader>
          {editingQuestion && (
            <div className="py-4">
              <AdminQuestionBuilder 
                initialData={editingQuestion}
                sectionType={currentSection?.section_type || ""}
                onSave={async (data) => {
                  const { error } = await supabase.from("questions").update({
                    question_type: data.question_type,
                    question_text: data.question_text,
                    options: data.options,
                    correct_answer: data.correct_answer,
                    points: data.points,
                    explanation: data.explanation,
                  }).eq("id", editingQuestion.id);
                  
                  if (error) toast.error("Failed to update question");
                  else {
                    toast.success("Question updated successfully");
                    setEditingQuestion(null);
                    fetchTestData();
                  }
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
