"use client";

import React, { useState, useEffect, useRef, Fragment, type MouseEvent as ReactMouseEvent, useMemo, useCallback } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Eye, 
  EyeOff, 
  Flag, 
  Volume2, 
  ArrowRight,
  HelpCircle,
  LogOut,
  Save,
  Plus,
  Trash2,
  Image as ImageIcon,
  Table as TableIcon,
  Type,
  List,
  Layout as LayoutIcon,
  Settings,
  AudioLines,
  FileText,
  Play,
  Pause,
  Wifi,
  Bell,
  Loader2,
  Menu,
  MousePointer2,
  CheckCircle2,
  Layers,
  Copy,
  ChevronDown,
  ChevronUp,
  Upload,
  Minus,
  PenTool
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { FlowchartRenderer, type FlowchartData, type FlowchartStep } from "@/components/FlowchartRenderer";
import PassageEditor from "@/components/PassageEditor";

interface CDIAdminEditorProps {
  testTitle: string;
  section: any;
  parts: any[];
  questions: any[];
  questionOffset?: number;
  onSave: (data: { 
    parts: any[], 
    questions: any[], 
    deletedPartIds: string[], 
    deletedQuestionIds: string[] 
  }) => Promise<void>;
  onExit: () => void;
}

const QUESTION_TYPES = [
    { id: "matching_headings", label: "List of Headings", icon: "🏷️", description: "Drag & drop headings to passage gaps" },
    { id: "paragraph_matching", label: "Paragraph matching", icon: "¶", description: "Match statements to paragraphs (A-G) in a box" },
    { id: "matching_features", label: "Matching Features", icon: "📦", description: "Match items to a list of features in a box (A-H)" },
    { id: "matching_sentence_endings", label: "Matching Sentence Endings", icon: "🔗", description: "Match sentence beginnings to correct endings" },
    { id: "true_false_ng", label: "True False Not Given", icon: "✓✗", description: "True, False, or Not Given" },
    { id: "multiple_choice", label: "MCQ", icon: "◉", description: "Choose one or more correct options" },
    { id: "list_selection", label: "List Selection", icon: "☑", description: "Select correct items from a list" },
    { id: "choosing_a_title", label: "Choosing a Title", icon: "📖", description: "Choose the best title for the passage" },
    { id: "short_answer", label: "Short Answer", icon: "✏", description: "Short text answers to questions" },
    { id: "sentence_completion", label: "Sentence Completion", icon: "___", description: "Individual sentences with gaps" },
    { id: "summary_completion", label: "Summary Completion", icon: "📝", description: "Summary with gaps. Supports drag & drop or text input." },
    { id: "note_completion", label: "Note Completion", icon: "📋", description: "Bullet points with gaps. Similar to summary but in list format." },
    { id: "table_completion", label: "Table Completion", icon: "📊", description: "Fill in blanks in a table" },
    { id: "diagram_completion", label: "Diagram Completion", icon: "🗺️", description: "Label an uploaded image with multiple answer support" },
    { id: "flowchart_completion", label: "Flowchart Completion", icon: "🔄", description: "Complete a flowchart with gaps" },
    { id: "writing_task", label: "Writing Task", icon: "✍️", description: "Writing task with question and image" },
];

  const toRoman = (num: number): string => {

      const roman: Record<string, number> = {
          m: 1000, cm: 900, d: 500, cd: 400, c: 100, xc: 90, l: 50, xl: 40, x: 10, ix: 9, v: 5, iv: 4, i: 1
      };
      let str = "";
      for (let i of Object.keys(roman)) {
          let q = Math.floor(num / roman[i]);
          num -= q * roman[i];
          str += i.repeat(q);
      }
      return str.toUpperCase();
  };

  const uploadToImgBB = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("image", file);
    const response = await fetch(`https://api.imgbb.com/1/upload?key=74ab1b5e9a3dd246d0c7745d5e33d051`, {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    if (data.success) {
      return data.data.url;
    }
    throw new Error("Upload failed");
  };

    const DiagramVisualEditor = ({
      group,
      updateQuestionGroup,
      groupQuestions,
      deleteQuestion,
      updateQuestion,
      theme,
      getGlobalIdx,
      setQuestions,
      currentPart,
      section,
      startNum
    }: {
      group: any;
      updateQuestionGroup: (id: string, updates: any) => void;
      groupQuestions: any[];
      deleteQuestion: (id: string) => void;
      updateQuestion: (id: string, field: string, value: any) => void;
      theme: any;
      getGlobalIdx: (id: string) => number;
      setQuestions: React.Dispatch<React.SetStateAction<any[]>>;
      currentPart: any;
      section: any;
      startNum: number;
    }) => {
      const [isUploading, setIsUploading] = useState(false);
      const fileInputRef = useRef<HTMLInputElement>(null);

      const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
          const url = await uploadToImgBB(file);
          updateQuestionGroup(group.id || group.temp_id, { diagramImage: url });
          toast.success("Image uploaded successfully");
        } catch (err) {
          toast.error("Failed to upload image");
        } finally {
          setIsUploading(false);
        }
      };

      const addField = () => {
        const nextNum = groupQuestions.length + 1;
        const newId = `temp-q-diag-${Date.now()}-${nextNum}`;
        const newQ = {
          temp_id: newId,
          part_id: currentPart.id || currentPart.temp_id,
          section_id: section.id,
          question_type: "diagram_completion",
          question_text: `[[${nextNum}]]`,
          group_id: group.id || group.temp_id,
          correct_answer: "",
          points: 1,
          order_index: nextNum
        };
        setQuestions(prev => [...prev, newQ]);
      };

      return (
        <div className="space-y-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <Input 
              value={group.diagramTitle || ""}
              onChange={(e) => updateQuestionGroup(group.id || group.temp_id, { diagramTitle: e.target.value })}
              className="flex-1 max-w-sm border-gray-200 bg-white rounded-xl h-9 text-[11px] font-bold shadow-sm"
              placeholder="Diagram Title (e.g., A solar-powered water pump)..."
            />
            <div className="flex gap-2">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleUpload}
              />
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="rounded-xl h-9 text-[10px] font-black uppercase tracking-wider"
              >
                {isUploading ? "Uploading..." : <><Upload size={14} className="mr-2" /> Upload Image</>}
              </Button>
              <Button 
                size="sm" 
                onClick={addField}
                className={cn("rounded-xl h-9 text-[10px] font-black uppercase tracking-wider", theme.bg)}
              >
                <Plus size={14} className="mr-2" /> Add Gap
              </Button>
            </div>
          </div>

          {group.diagramImage ? (
            <div className="relative rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 aspect-video flex items-center justify-center group/img">
              <img 
                src={group.diagramImage} 
                alt="Diagram" 
                className="max-w-full max-h-full object-contain"
              />
              <button 
                onClick={() => updateQuestionGroup(group.id || group.temp_id, { diagramImage: "" })}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ) : (
            <div className="aspect-video flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
              <ImageIcon size={48} className="text-gray-300 mb-2" />
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No diagram image uploaded</p>
            </div>
          )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              {groupQuestions.sort((a,b) => (a.order_index || 0) - (b.order_index || 0)).map((q, idx) => {
                const globalIdx = getGlobalIdx(q.id || q.temp_id);
                const gapNum = globalIdx !== -1 ? globalIdx + 1 : (startNum + idx);
                return (
                  <div key={q.id || q.temp_id} className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 flex items-center gap-3">

                  <div className={cn("w-6 h-6 rounded flex items-center justify-center text-white font-black text-[10px] shrink-0", theme.bg)}>
                    {gapNum}
                  </div>
                  <Input 
                    value={q.correct_answer}
                    onChange={(e) => updateQuestion(q.id || q.temp_id, "correct_answer", e.target.value)}
                    className="h-8 text-[11px] font-bold border-white bg-white rounded-lg focus:ring-1 focus:ring-blue-200 flex-1"
                    placeholder="Correct Answer(s) (use / for multiple)..."
                  />
                  <button 
                    onClick={() => deleteQuestion(q.id || q.temp_id)}
                    className="p-1.5 text-red-300 hover:text-red-500 transition-all hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      );
    };


    const MatchingSentenceEndingsVisualEditor = ({
      group,
      updateQuestionGroup,
      groupQuestions,
      deleteQuestion,
      updateQuestion,
      addQuestionToGroup,
      theme,
      getGlobalIdx
    }: any) => {
      const options = group.options || [];
      const optionsTitle = group.optionsTitle || "List of Endings";

      return (
        <div className="space-y-6">
          {/* Endings Box Editor */}
          <div className="p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] max-w-2xl mx-auto shadow-sm relative overflow-hidden group/box">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
            <div className="flex items-center justify-between mb-6">
              <Input 
                value={optionsTitle}
                onChange={(e) => updateQuestionGroup(group.id || group.temp_id, { optionsTitle: e.target.value })}
                className="font-black text-sm uppercase tracking-widest text-gray-700 text-center border-none bg-transparent focus:ring-0 h-8 flex-1"
                placeholder="List of Endings..."
              />
                <button 
                  onClick={() => {
                    const newOpts = [...options, ""];
                    updateQuestionGroup(group.id || group.temp_id, { options: newOpts });
                  }}
                  className="ml-4 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[9px] font-black flex items-center gap-1.5 hover:bg-blue-700 shadow-sm"
                >
                  <Plus size={12} /> ADD LINE
                </button>
              </div>
              <div className="space-y-3 max-w-md mx-auto">
                {options.map((opt: string, idx: number) => (
                  <div key={idx} className="flex gap-3 items-center group/opt">
                    <div className="h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm">
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <Input 
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...options];
                        newOpts[idx] = e.target.value;
                        updateQuestionGroup(group.id || group.temp_id, { options: newOpts });
                      }}
                      className="h-8 border-none bg-white font-bold text-xs focus:ring-1 focus:ring-blue-100 px-3 rounded-xl shadow-sm"
                      placeholder={`Line ${String.fromCharCode(65 + idx)}...`}
                    />
                    <button 
                      onClick={() => {
                        const newOpts = options.filter((_: any, i: number) => i !== idx);
                        updateQuestionGroup(group.id || group.temp_id, { options: newOpts });
                      }}
                      className="opacity-0 group-hover/opt:opacity-100 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Questions Editor */}
            <div className="space-y-3 max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Questions & Answers</h5>
              </div>
              {groupQuestions.map((q: any, idx: number) => {
                const qId = q.id || q.temp_id;
                const globalIdx = getGlobalIdx(qId);
                return (
                  <div key={qId} className="flex items-start gap-4 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm group/sentence hover:border-blue-200 transition-all">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-black text-sm text-white shrink-0 mt-1", theme.bg)}>
                      {globalIdx + 1}
                    </div>
                    <div className="flex-1 space-y-3">
                      <Textarea 
                        value={q.question_text}
                        onChange={(e) => updateQuestion(qId, "question_text", e.target.value)}
                        className="w-full min-h-[50px] border-none bg-gray-50/50 rounded-xl p-3 text-[15px] font-bold text-gray-800 focus:ring-1 focus:ring-blue-100 leading-tight"
                        placeholder="Enter question text..."
                      />
                        <div className="flex items-center gap-4 pt-2 border-t border-gray-50">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Correct Answer:</span>
                          <select 
                            value={q.correct_answer || ""}
                            onChange={(e) => updateQuestion(qId, "correct_answer", e.target.value)}
                            className="h-8 rounded-lg border border-gray-200 text-xs font-bold px-2 focus:ring-1 focus:ring-blue-100 outline-none cursor-pointer"
                          >
                            <option value="">Select Option</option>
                            {options.map((_: any, oIdx: number) => {
                              const label = String.fromCharCode(65 + oIdx);
                              return (
                                <option key={oIdx} value={label}>
                                  {label} {options[oIdx] ? `- ${options[oIdx]}` : ""}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                    </div>
                    <button onClick={() => deleteQuestion(qId)} className="opacity-0 group-hover/sentence:opacity-100 p-2 text-red-300 hover:text-red-500 transition-all hover:bg-red-50 rounded-xl">
                      <Trash2 size={18} />
                    </button>
                  </div>
                );
              })}
              <Button 
                onClick={() => addQuestionToGroup(group.id || group.temp_id, "matching_sentence_endings")}
                className="w-full h-12 border-2 border-dashed bg-white rounded-2xl font-black text-[11px] gap-2 shadow-sm text-gray-400 hover:text-blue-500 hover:border-blue-200 transition-all uppercase tracking-widest"
              >
                <Plus size={18} /> ADD QUESTION
              </Button>
            </div>
          </div>
        );
      };

    const MatchingFeaturesVisualEditor = ({
      group,
      updateQuestionGroup,
      groupQuestions,
      deleteQuestion,
      updateQuestion,
      addQuestionToGroup,
      theme,
      getGlobalIdx
    }: any) => {
      const options = group.options || [];
      const optionsTitle = group.optionsTitle || "List of Features";

      return (
        <div className="space-y-6">
          {/* Features Box Editor */}
          <div className="p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] max-w-2xl mx-auto shadow-sm relative overflow-hidden group/box">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
            <div className="flex items-center justify-between mb-6">
              <Input 
                value={optionsTitle}
                onChange={(e) => updateQuestionGroup(group.id || group.temp_id, { optionsTitle: e.target.value })}
                className="font-black text-sm uppercase tracking-widest text-gray-700 text-center border-none bg-transparent focus:ring-0 h-8 flex-1"
                placeholder="List of Features..."
              />
                <button 
                  onClick={() => {
                    const newOpts = [...options, ""];
                    updateQuestionGroup(group.id || group.temp_id, { options: newOpts });
                  }}
                  className="ml-4 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[9px] font-black flex items-center gap-1.5 hover:bg-blue-700 shadow-sm"
                >
                  <Plus size={12} /> ADD FEATURE
                </button>
              </div>
              <div className="space-y-3 max-w-md mx-auto">
                {options.map((opt: string, idx: number) => (
                  <div key={idx} className="flex gap-3 items-center group/opt">
                    <div className="h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm">
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <Input 
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...options];
                        newOpts[idx] = e.target.value;
                        updateQuestionGroup(group.id || group.temp_id, { options: newOpts });
                      }}
                      className="h-8 border-none bg-white font-bold text-xs focus:ring-1 focus:ring-blue-100 px-3 rounded-xl shadow-sm"
                      placeholder={`Feature ${String.fromCharCode(65 + idx)}...`}
                    />
                    <button 
                      onClick={() => {
                        const newOpts = options.filter((_: any, i: number) => i !== idx);
                        updateQuestionGroup(group.id || group.temp_id, { options: newOpts });
                      }}
                      className="opacity-0 group-hover/opt:opacity-100 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Questions Editor */}
            <div className="space-y-3 max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Questions & Answers</h5>
              </div>
              {groupQuestions.map((q: any, idx: number) => {
                const qId = q.id || q.temp_id;
                const globalIdx = getGlobalIdx(qId);
                return (
                  <div key={qId} className="flex items-start gap-4 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm group/sentence hover:border-blue-200 transition-all">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-black text-sm text-white shrink-0 mt-1", theme.bg)}>
                      {globalIdx + 1}
                    </div>
                    <div className="flex-1 space-y-3">
                      <Textarea 
                        value={q.question_text}
                        onChange={(e) => updateQuestion(qId, "question_text", e.target.value)}
                        className="w-full min-h-[50px] border-none bg-gray-50/50 rounded-xl p-3 text-[15px] font-bold text-gray-800 focus:ring-1 focus:ring-blue-100 leading-tight"
                        placeholder="Enter question text..."
                      />
                        <div className="flex items-center gap-4 pt-2 border-t border-gray-50">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Correct Answer:</span>
                          <select 
                            value={q.correct_answer || ""}
                            onChange={(e) => updateQuestion(qId, "correct_answer", e.target.value)}
                            className="h-8 rounded-lg border border-gray-200 text-xs font-bold px-2 focus:ring-1 focus:ring-blue-100 outline-none cursor-pointer"
                          >
                            <option value="">Select Option</option>
                            {options.map((_: any, oIdx: number) => {
                              const label = String.fromCharCode(65 + oIdx);
                              return (
                                <option key={oIdx} value={label}>
                                  {label} {options[oIdx] ? `- ${options[oIdx]}` : ""}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                    </div>
                    <button onClick={() => deleteQuestion(qId)} className="opacity-0 group-hover/sentence:opacity-100 p-2 text-red-300 hover:text-red-500 transition-all hover:bg-red-50 rounded-xl">
                      <Trash2 size={18} />
                    </button>
                  </div>
                );
              })}
              <Button 
                onClick={() => addQuestionToGroup(group.id || group.temp_id, "matching_features")}
                className="w-full h-12 border-2 border-dashed bg-white rounded-2xl font-black text-[11px] gap-2 shadow-sm text-gray-400 hover:text-blue-500 hover:border-blue-200 transition-all uppercase tracking-widest"
              >
                <Plus size={18} /> ADD QUESTION
              </Button>
            </div>
          </div>
        );
      };

    const FlowchartVisualEditor = ({
    group,
    updateQuestionGroup,
    groupQuestions,
    deleteQuestion,
    updateQuestion,
    addQuestionToGroup,
    theme,
      globalStartIdx,
      getGlobalIdx,
      currentPart,

    section,
    questions,
    setQuestions
  }: {
    group: any;
    updateQuestionGroup: (id: string, updates: any) => void;
    groupQuestions: any[];
    deleteQuestion: (id: string) => void;
    updateQuestion: (id: string, field: string, value: any) => void;
    addQuestionToGroup: (groupId: string, type: string) => void;
    theme: any;
    globalStartIdx: number;
    currentPart: any;
    section: any;
    questions: any[];
    setQuestions: React.Dispatch<React.SetStateAction<any[]>>;
  }) => {
    const sortedGroupQs = useMemo(() => {
      return [...groupQuestions].sort((a, b) => {
        const numA = parseInt((a.question_text || "").match(/\d+/)?.[0] || "0");
        const numB = parseInt((b.question_text || "").match(/\d+/)?.[0] || "0");
        return numA - numB;
      });
    }, [groupQuestions]);

    const flowchartData: FlowchartData = group.flowchartData || {
      type: 'scientific',
      steps: []
    };

    const syncToGroupText = (data: FlowchartData) => {
      let text = "";
      data.steps.forEach(step => {
        if (step.type === 'step') {
          text += step.text + "\n";
        } else if (step.type === 'split' && step.theories) {
          step.theories.forEach(t => {
            text += t.text + "\n";
          });
        }
      });
      return text.trim();
    };

    const skipSyncRef = React.useRef(false);

    const updateData = (updates: Partial<FlowchartData>) => {
      const newData = { ...flowchartData, ...updates };
      updateQuestionGroup(group.id || group.temp_id, { 
        flowchartData: newData,
        groupText: syncToGroupText(newData),
        layout: newData.type === 'boxed' ? 'type2' : 'type1'
      });
      
      if (skipSyncRef.current) {
        skipSyncRef.current = false;
        return;
      }
      
      setTimeout(() => {
        const existingGapTags: string[] = [];
        const seen = new Set<string>();
        newData.steps.forEach((s: FlowchartStep) => {
          const sMatches = (s.text || "").match(/\[f\d+\]/g) || [];
          sMatches.forEach(t => {
            if (!seen.has(t)) {
              existingGapTags.push(t);
              seen.add(t);
            }
          });
          if (s.theories) {
            s.theories.forEach((t: any) => {
              const tMatches = (t.text || "").match(/\[f\d+\]/g) || [];
              tMatches.forEach(m => {
                if (!seen.has(m)) {
                  existingGapTags.push(m);
                  seen.add(m);
                }
              });
            });
          }
        });
        
        const groupId = group.id || group.temp_id;
        setQuestions(prev => prev.filter(q => {
          if (q.group_id !== groupId) return true;
          const qTag = (q.question_text || "").match(/\[f\d+\]/)?.[0];
          if (!qTag) return true;
          return existingGapTags.includes(qTag);
        }));
      }, 2000);
    };

    const addStep = (type: 'step' | 'split' = 'step') => {
      const newStep: FlowchartStep = {
        id: `step-${Date.now()}`,
        text: "New step text...",
        type,
        theories: type === 'split' ? [
          { title: "Theory 1", text: "" },
          { title: "Theory 2", text: "" }
        ] : undefined
      };
      updateData({ steps: [...flowchartData.steps, newStep] });
    };

    const updateStep = (stepId: string, updates: Partial<FlowchartStep>) => {
      const newSteps = flowchartData.steps.map(s => s.id === stepId ? { ...s, ...updates } : s);
      
      const allGapTags: { tag: string, num: number }[] = [];
      const seenTags = new Set<string>();
      
      newSteps.forEach((s: FlowchartStep) => {
        const sMatches = (s.text || "").match(/\[f\d+\]/g) || [];
        sMatches.forEach(tag => {
          if (seenTags.has(tag)) return;
          seenTags.add(tag);
          const num = parseInt(tag.match(/\d+/)?.[0] || "0");
          if (num) allGapTags.push({ tag, num });
        });
        if (s.theories) {
          s.theories.forEach((t: any) => {
            const tMatches = (t.text || "").match(/\[f\d+\]/g) || [];
            tMatches.forEach(tag => {
              if (seenTags.has(tag)) return;
              seenTags.add(tag);
              const num = parseInt(tag.match(/\d+/)?.[0] || "0");
              if (num) allGapTags.push({ tag, num });
            });
          });
        }
      });
      
        const groupId = group.id || group.temp_id;
        const groupQuestions = questions.filter(q => q.group_id === groupId);
        const existingTags = groupQuestions.map(q => (q.question_text || "").match(/\[f\d+\]/)?.[0]).filter(Boolean);
        
        const newTags = allGapTags.filter(item => !existingTags.includes(item.tag));
        
        if (newTags.length > 0) {
          const newQuestions = newTags.map((item, i) => ({
            temp_id: `temp-q-flow-${item.tag}-${Date.now()}-${i}`,
            part_id: currentPart?.id || currentPart?.temp_id,
            section_id: section?.id,
            question_type: "flowchart_completion",
            question_text: item.tag,
            group_id: groupId,
            correct_answer: "",
            points: 1,
            order_index: item.num
          }));


        setQuestions(prev => {
          const latestExistingTags = prev
            .filter(q => q.group_id === groupId)
            .map(q => (q.question_text || "").match(/\[f\d+\]/)?.[0])
            .filter(Boolean);
          
          const filteredNewQs = newQuestions.filter(nq => !latestExistingTags.includes(nq.question_text));
          if (filteredNewQs.length === 0) return prev;
          return [...prev, ...filteredNewQs];
        });
        skipSyncRef.current = true; 
      }
      
      updateData({ steps: newSteps });
    };

      const renderQuestionInput = (text: string) => {
        const matches = text.match(/\[f\d+\]/g) || [];
        return matches.map((tag, idx) => {
          // Use find to get the first question that matches this specific tag
          const q = groupQuestions.find(q => (q.question_text || "") === tag);
          if (!q) return null;
          
          const displayNum = getGlobalIdx(q.id || q.temp_id) + 1;

          return (
            <div key={`${q.id || q.temp_id}-${idx}`} className="mt-2 bg-blue-50/50 p-2 rounded-lg border border-blue-100 flex items-center gap-3">

            <div className={cn("w-5 h-5 rounded flex items-center justify-center text-white font-black text-[10px] shrink-0", theme.bg)}>
              {displayNum}
            </div>
            <Input 
              value={q.correct_answer}
              onChange={(e) => updateQuestion(q.id || q.temp_id, "correct_answer", e.target.value)}
              className="h-7 text-[10px] font-bold border-white bg-white rounded focus:ring-1 focus:ring-blue-200 flex-1"
              placeholder="Correct Ans..."
            />
            <button 
              onClick={() => deleteQuestion(q.id || q.temp_id)}
              className="p-1 text-red-300 hover:text-red-500 transition-all"
            >
              <Trash2 size={12} />
            </button>
          </div>
        );
      });
    };


  const removeStep = (stepId: string) => {
    const newSteps = flowchartData.steps.filter(s => s.id !== stepId);
    updateData({ steps: newSteps });
  };

  const moveStep = (idx: number, direction: 'up' | 'down') => {
    const newSteps = [...flowchartData.steps];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= newSteps.length) return;
    [newSteps[idx], newSteps[targetIdx]] = [newSteps[targetIdx], newSteps[idx]];
    updateData({ steps: newSteps });
  };

  const insertGapAtCursor = (stepId: string, theoryIdx?: number) => {
    const step = flowchartData.steps.find(s => s.id === stepId);
    if (!step) return;

    const textarea = document.getElementById(theoryIdx !== undefined ? `theory-${stepId}-${theoryIdx}` : `step-${stepId}`) as HTMLTextAreaElement;
    let currentText = theoryIdx !== undefined ? step.theories![theoryIdx].text : step.text;
    let insertPos = textarea?.selectionStart ?? currentText.length;

    // Find all existing [f#] gaps within this flowchart group only
    let existingFlowGaps: number[] = [];
    flowchartData.steps.forEach((s: FlowchartStep) => {
      const sMatches = (s.text || "").match(/\[f(\d+)\]/g) || [];
      sMatches.forEach(m => {
        const num = m.match(/\d+/);
        if (num) existingFlowGaps.push(parseInt(num[0]));
      });
      if (s.theories) {
        s.theories.forEach((t: any) => {
          const tMatches = (t.text || "").match(/\[f(\d+)\]/g) || [];
          tMatches.forEach(m => {
            const num = m.match(/\d+/);
            if (num) existingFlowGaps.push(parseInt(num[0]));
          });
        });
      }
    });

    // Find the first available number (fill gaps in sequence)
    let nextNum = 1;
    while (existingFlowGaps.includes(nextNum)) {
      nextNum++;
    }
      
    const gapTag = `[f${nextNum}]`;

    const newText = currentText.slice(0, insertPos) + gapTag + currentText.slice(insertPos);

    // Then update the step text. updateStep will handle auto-creating the question for [fN]
    if (theoryIdx !== undefined) {
      const newTheories = [...step.theories!];
      newTheories[theoryIdx] = { ...newTheories[theoryIdx], text: newText };
      updateStep(stepId, { theories: newTheories });
    } else {
      updateStep(stepId, { text: newText });
    }
    
    toast.success(`Gap [f${nextNum}] added`);
  };

  const addTheory = (stepId: string) => {
    const step = flowchartData.steps.find(s => s.id === stepId);
    if (!step || !step.theories) return;
    const newTheories = [...step.theories, { title: `Theory ${step.theories.length + 1}`, text: "" }];
    updateStep(stepId, { theories: newTheories });
  };

  const removeTheory = (stepId: string, theoryIdx: number) => {
    const step = flowchartData.steps.find(s => s.id === stepId);
    if (!step || !step.theories || step.theories.length <= 1) return;
    const newTheories = step.theories.filter((_, i) => i !== theoryIdx);
    updateStep(stepId, { theories: newTheories });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex items-center gap-2">
            <Label className="text-[8px] font-black uppercase text-gray-400 tracking-widest mr-2">Type:</Label>
            <div className="flex bg-white rounded-lg border border-gray-200 p-0.5 shadow-sm">
              <button 
                onClick={() => updateData({ type: 'scientific' })}
                className={cn(
                  "px-3 py-1 rounded text-[8px] font-black uppercase transition-all",
                  flowchartData.type === 'scientific' ? "bg-blue-600 text-white shadow-sm" : "text-gray-400 hover:text-gray-600"
                )}
              >
                Scientific
              </button>
              <button 
                onClick={() => updateData({ type: 'boxed' })}
                className={cn(
                  "px-3 py-1 rounded text-[8px] font-black uppercase transition-all",
                  flowchartData.type === 'boxed' ? "bg-blue-600 text-white shadow-sm" : "text-gray-400 hover:text-gray-600"
                )}
              >
                Boxed
              </button>
            </div>
          </div>


        <div className="w-full max-w-sm">
          <Input 
            value={group.diagramTitle || ""}
            onChange={(e) => updateQuestionGroup(group.id, { diagramTitle: e.target.value })}
            className="w-full border-gray-200 bg-white rounded-lg h-8 text-[11px] font-bold shadow-sm text-center"
            placeholder="Flowchart Title..."
          />
        </div>
      </div>

      <div className="space-y-1">
          {flowchartData.steps.map((step, idx) => (
            <div key={step.id} className="relative group/step">
              <div className="bg-white border border-gray-200 rounded-lg p-2 shadow-sm hover:border-blue-200 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">
                    Step {idx + 1} {step.type === 'split' && "(Split)"}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover/step:opacity-100 transition-opacity">
                    <button 
                      onClick={() => moveStep(idx, 'up')}
                      disabled={idx === 0}
                      className="p-0.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all disabled:opacity-30"
                    >
                      <ChevronUp size={10} />
                    </button>
                    <button 
                      onClick={() => moveStep(idx, 'down')}
                      disabled={idx === flowchartData.steps.length - 1}
                      className="p-0.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all disabled:opacity-30"
                    >
                      <ChevronDown size={10} />
                    </button>
                    <div className="w-px h-2 bg-gray-100 mx-0.5" />
                    <button 
                      onClick={() => removeStep(step.id)}
                      className="p-0.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>


                {step.type === 'step' ? (
                  <div className="space-y-1">
                    <div className="relative group/ta">
                      <Textarea 
                        id={`step-${step.id}`}
                        value={step.text}
                        onChange={(e) => updateStep(step.id, { text: e.target.value })}
                        className="w-full min-h-[44px] border-none bg-gray-50/50 rounded p-2 text-[11px] font-medium resize-none focus:ring-0 leading-tight"
                        placeholder="Step text..."
                      />
                      <button 
                        onClick={() => insertGapAtCursor(step.id)}
                        className="absolute bottom-1 right-1 bg-white border border-blue-200 text-blue-600 px-1.5 py-0.5 rounded text-[7px] font-black hover:bg-blue-600 hover:text-white shadow-sm transition-all flex items-center gap-1"
                      >
                        <Plus size={8} /> GAP
                      </button>
                    </div>
                    {renderQuestionInput(step.text)}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {(step.theories || []).map((theory, tIdx) => (
                        <div key={tIdx} className="space-y-1 p-1.5 bg-blue-50/20 rounded border border-blue-50 relative group/theory">
                          <div className="flex items-center justify-between gap-1">
                            <Input 
                              value={theory.title}
                              onChange={(e) => {
                                const newTheories = [...step.theories!];
                                newTheories[tIdx] = { ...theory, title: e.target.value };
                                updateStep(step.id, { theories: newTheories });
                              }}
                              className="h-6 border-none bg-white font-black text-[8px] uppercase tracking-widest text-blue-600 focus:ring-0 px-1.5"
                              placeholder={`Theory ${tIdx + 1}...`}
                            />
                            {step.theories!.length > 1 && (
                              <button 
                                onClick={() => removeTheory(step.id, tIdx)}
                                className="opacity-0 group-hover/theory:opacity-100 p-0.5 text-red-300 hover:text-red-500 transition-all"
                              >
                                <Minus size={10} />
                              </button>
                            )}
                          </div>
                          <div className="relative group/ta">
                            <Textarea 
                              id={`theory-${step.id}-${tIdx}`}
                              value={theory.text}
                              onChange={(e) => {
                                const newTheories = [...step.theories!];
                                newTheories[tIdx] = { ...theory, text: e.target.value };
                                updateStep(step.id, { theories: newTheories });
                              }}
                              className="w-full min-h-[44px] border-none bg-white rounded p-1.5 text-[10px] font-medium resize-none focus:ring-0 leading-tight shadow-sm"
                              placeholder="Theory text..."
                            />
                            <button 
                              onClick={() => insertGapAtCursor(step.id, tIdx)}
                              className="absolute bottom-1 right-1 bg-white border border-blue-100 text-blue-500 px-1 py-0.5 rounded text-[6px] font-black hover:bg-blue-500 hover:text-white shadow-sm transition-all flex items-center gap-1"
                            >
                              <Plus size={6} /> GAP
                            </button>
                          </div>
                          {renderQuestionInput(theory.text)}
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={() => addTheory(step.id)}
                      className="w-full py-1 border border-dashed border-blue-100 rounded text-[7px] font-black text-blue-400 uppercase hover:bg-blue-50 transition-all flex items-center justify-center gap-1"
                    >
                      <Plus size={8} /> Add Theory
                    </button>
                  </div>
                )}
              </div>
              {idx < flowchartData.steps.length - 1 && (
                <div className="flex justify-center py-0.5">
                  <div className="w-px h-1.5 bg-gray-200" />
                </div>
              )}
            </div>
          ))}

          <div className="flex items-center gap-2 pt-1">
            <button 
              onClick={() => addStep('step')}
              className="flex-1 py-2 border border-dashed border-gray-200 rounded-lg text-[8px] font-black text-gray-400 uppercase tracking-widest hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-1.5"
            >
              <Plus size={12} /> Step
            </button>
              {flowchartData.type === 'scientific' && (
              <button 
                onClick={() => addStep('split')}
                className="px-3 py-2 border border-dashed border-gray-200 rounded-lg text-[8px] font-black text-gray-400 uppercase tracking-widest hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Plus size={12} /> Split Theories
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };




  const WritingVisualEditor = ({
    currentPart,
    updatePart,
    theme,
  }: {
    currentPart: any;
    updatePart: (id: string, field: string, value: any) => void;
    theme: any;
  }) => {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      try {
        const url = await uploadToImgBB(file);
        updatePart(currentPart.id || currentPart.temp_id, "image_url", url);
        toast.success("Image uploaded successfully");
      } catch (err) {
        toast.error("Failed to upload image");
      } finally {
        setIsUploading(false);
      }
    };

    return (
      <div className="flex flex-col h-full bg-gray-50/50 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto w-full space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl relative overflow-hidden group/card">
            <div className={cn("absolute top-0 left-0 w-2 h-full", theme.bg)} />
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">Writing Task Question</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">This text will be shown on the left panel for students</p>
              </div>
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-500/20", theme.bg)}>
                <PenTool size={24} />
              </div>
            </div>
            <Textarea
              value={currentPart?.passage_text || ""}
              onChange={(e) => updatePart(currentPart.id || currentPart.temp_id, "passage_text", e.target.value)}
              className="w-full min-h-[300px] border-none bg-gray-50/50 rounded-3xl p-8 text-lg font-medium leading-relaxed focus:ring-2 focus:ring-red-100 transition-all resize-none shadow-inner"
              placeholder="Enter your writing task prompt here... (e.g., The chart below shows...)"
            />
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl relative overflow-hidden group/img-card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">Task Reference Image</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Required for Task 1, optional for Task 2</p>
              </div>
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleUpload}
                />
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="rounded-2xl h-12 px-6 text-xs font-black uppercase tracking-widest border-2 hover:bg-gray-50 transition-all gap-2"
                >
                  {isUploading ? <Loader2 className="animate-spin h-4 w-4" /> : <Upload size={16} />}
                  {isUploading ? "Uploading..." : "Upload New Image"}
                </Button>
              </div>
            </div>

            {currentPart?.image_url ? (
              <div className="relative rounded-3xl overflow-hidden border border-gray-100 bg-gray-50 aspect-video flex items-center justify-center group/img shadow-md">
                <img
                  src={currentPart.image_url}
                  alt="Writing Task"
                  className="max-w-full max-h-full object-contain p-4"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => updatePart(currentPart.id || currentPart.temp_id, "image_url", "")}
                    className="rounded-xl h-10 px-4 font-black uppercase tracking-widest"
                  >
                    <Trash2 size={16} className="mr-2" /> Delete
                  </Button>
                </div>
              </div>
            ) : (
              <div className="aspect-video flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50 hover:border-red-200 transition-all cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-gray-300 shadow-sm mb-4">
                  <ImageIcon size={40} />
                </div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">No reference image uploaded</p>
                <p className="text-[10px] text-gray-400 mt-2 font-bold">Click to upload or drag & drop</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

const PreviewMode = ({

  currentPart, 
  partGroups, 
  questions, 
  sortedQuestions,
  questionOffset = 0,
  currentPartIndex, 
  setCurrentPartIndex, 
  parts,
  theme,
  toRoman,
  onBackToEdit
}: { 
  currentPart: any; 
  partGroups: any[]; 
  questions: any[];
  sortedQuestions: any[];
  questionOffset?: number;
  currentPartIndex: number;
  setCurrentPartIndex: (idx: number) => void;
  parts: any[];
  theme: any;
  toRoman: (num: number) => string;
onBackToEdit: () => void;
}) => {
const [previewAnswers, setPreviewAnswers] = useState<Record<string, string>>({});
const [draggedHeading, setDraggedHeading] = useState<{ label: string; text: string; groupId: string } | null>(null);
const [showResults, setShowResults] = useState(false);

  const getGlobalIdx = useCallback((qId: string) => {
    const idx = sortedQuestions.findIndex(q => q.id === qId || q.temp_id === qId);
    return idx === -1 ? -1 : idx + questionOffset;
  }, [sortedQuestions, questionOffset]);

const currentPartId = currentPart?.id || currentPart?.temp_id;
  const partQuestions = useMemo(() => questions.filter(q => {
    const qPartId = q.part_id || q.temp_part_id;
    return qPartId === currentPartId;
  }), [questions, currentPartId]);
    const headingsGroup = partGroups.find((g: any) => g.type === "matching_headings");
    const headingsGroupId = headingsGroup ? (headingsGroup.id || headingsGroup.temp_id) : null;
    const headingsQuestions = headingsGroupId ? partQuestions.filter(q => q.group_id === headingsGroupId) : [];


      const handleDragStart = (e: React.DragEvent, label: string, text: string, groupId: string) => {
        e.dataTransfer.setData('text/plain', label);
        e.dataTransfer.setData('text/heading', label);
        e.dataTransfer.effectAllowed = 'copyMove';
        setDraggedHeading({ label, text, groupId });
      };


    const handleDragEnd = () => {
      setDraggedHeading(null);
    };

      const handleDrop = (questionId: string) => {
        if (draggedHeading) {
          setPreviewAnswers(prev => ({ ...prev, [questionId]: draggedHeading.label }));
          setDraggedHeading(null);
        }
      };

      const handleDropOnGap = (e: React.DragEvent, questionId: string) => {
        e.preventDefault();
        e.stopPropagation();
        const label = draggedHeading?.label || e.dataTransfer.getData('text/heading') || e.dataTransfer.getData('text/plain');
        if (label) {
          setPreviewAnswers(prev => ({ ...prev, [questionId]: label }));
        }
        setDraggedHeading(null);
      };

      const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
      };

      const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
      };

  const clearAnswer = (questionId: string) => {
    setPreviewAnswers(prev => {
      const newAnswers = { ...prev };
      delete newAnswers[questionId];
      return newAnswers;
    });
  };

    const processPassageWithGaps = (text: string) => {
          if (!text) return null;
          
          const isHtml = text.includes('<') && text.includes('>');
          
            if (isHtml) {
                const gapRegex = /<span[^>]*data-heading-gap="(\d+)"[^>]*data-correct-answer="([^"]*)"[^>]*>.*?<\/span>|<span[^>]*data-heading-gap="(\d+)"[^>]*>.*?<\/span>|<span[^>]*data-standard-gap="(\d+)"[^>]*>.*?<\/span>/g;
                const processedHtml = text
                  .replace(gapRegex, (fullMatch, gapNum1, correctAns, gapNum2, gapNum3) => {
                    const gapNum = gapNum1 || gapNum2 || gapNum3;
                    const type = gapNum3 ? 'STANDARD' : 'HEADING';
                    return `__GAP_PLACEHOLDER_${type}_${gapNum}__`;
                  })
                  .replace(/\[H(\d+)\]/g, "__GAP_PLACEHOLDER_HEADING_$1__")
                  .replace(/\[\[(\d+)\]\]/g, "__GAP_PLACEHOLDER_STANDARD_$1__");
  
  
            
            const splitParts = processedHtml.split(/(__GAP_PLACEHOLDER_(?:HEADING|STANDARD)_\d+__)/g);
            
            return (
              <div className="leading-[2] font-serif text-base prose prose-sm max-w-none">
                {splitParts.map((part, i) => {
                  const gapMatch = part.match(/__GAP_PLACEHOLDER_(HEADING|STANDARD)_(\d+)__/);
                  
                  if (gapMatch) {
                    const type = gapMatch[1];
                    const gapNum = parseInt(gapMatch[2]);

                    if (type === 'HEADING') {
                      const gapLetter = String.fromCharCode(96 + gapNum);
                              const q = headingsQuestions.find((hq: any) => {
                                const hqGapNum = typeof hq.gapNum === "number" ? hq.gapNum : null;
                                const qText = hq.question_text || '';
                                const tagMatch = qText.match(/\[H(\d+)\]/);
                                const tagGapNum = tagMatch ? parseInt(tagMatch[1]) : null;
                                const finalGapNum = hqGapNum !== null ? hqGapNum : tagGapNum;
                                return finalGapNum === gapNum;
                              });
                      
                      if (q) {
                        const qId = q.id || q.temp_id;
                        const answer = previewAnswers[qId];
                        const isCorrect = showResults ? checkAnswer(qId) : null;
                        
                        return (
                          <span
                            key={i}
                            onDragOver={handleDragOver}
                            onDragEnter={handleDragEnter}
                            onDrop={(e) => handleDropOnGap(e, qId)}
                            onClick={() => answer && clearAnswer(qId)}
                            className={cn(
                              "inline-flex items-center gap-2 mx-2 my-1 px-4 py-2 border-2 border-dashed rounded-xl transition-all cursor-pointer min-w-[200px] font-sans align-middle",
                              answer 
                                ? showResults
                                  ? isCorrect 
                                    ? "border-green-500 bg-green-50 text-green-700"
                                    : "border-red-500 bg-red-50 text-red-700"
                                  : "border-blue-500 bg-blue-50 text-blue-700"
                                : draggedHeading 
                                  ? "border-blue-400 bg-blue-50/50 ring-4 ring-blue-100 animate-pulse"
                                  : "border-gray-300 bg-gray-50 text-gray-400 hover:border-blue-300"
                            )}
                          >
                            <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black shrink-0">{gapLetter}</span>
                            {answer ? (
                              <span className="font-bold text-sm flex items-center gap-2">
                                <span className="w-6 h-6 rounded bg-current/20 flex items-center justify-center text-[10px] font-black">{answer}</span>
                          {showResults && !isCorrect && (
                            <span className="text-[9px] font-black text-red-500">(Correct: {q.correct_answer || q.correctAnswer})</span>
                          )}
                              </span>
                            ) : (
                              <span className="text-xs font-bold uppercase tracking-wider">Drop Heading Here</span>
                            )}
                          </span>
                        );
                      }
                      return (
                        <span
                          key={i}
                          className="inline-flex items-center gap-2 mx-2 my-1 px-4 py-2 border-2 border-dashed border-orange-300 bg-orange-50 rounded-xl text-orange-600 font-sans align-middle cursor-help"
                        >
                          <span className="w-6 h-6 rounded-lg bg-orange-500 text-white flex items-center justify-center text-xs font-black shrink-0">{gapLetter}</span>
                          <span className="text-xs font-bold whitespace-nowrap">Gap {gapNum} (No question linked)</span>
                        </span>
                      );
                      } else {
                        // Standard gap
                        const q = questions.find((sq: any) => {
                          const qText = sq.question_text || '';
                          return qText.includes(`[[${gapNum}]]`) && (sq.part_id === (currentPart.id || currentPart.temp_id));
                        });
                        const globalIdx = q ? getGlobalIdx(q.id || q.temp_id) : -1;
                        const displayNum = globalIdx !== -1 ? globalIdx + 1 : gapNum;

                        return (
                          <span
                            key={i}
                            className="inline-flex items-center gap-2 mx-2 my-1 px-2 py-1 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-lg font-sans align-middle shadow-sm select-none"
                          >
                            <span className="w-5 h-5 rounded bg-amber-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">{displayNum}</span>
                            <span className="text-[10px] font-bold text-amber-800 px-1 italic">Gap</span>
                          </span>
                        );
                      }

                  }
                  
                  if (part) {
                    return <span key={i} dangerouslySetInnerHTML={{ __html: part }} />;
                  }
                  return null;
                })}
              </div>
            );
          }
          
          const parts = text.split(/(\[H\d+\]|\[\[\d+\]\])/g);
          
          return (
            <div className="leading-[2] font-serif text-base whitespace-pre-wrap">
              {parts.map((item, i) => {
                const headingMatch = item.match(/\[H(\d+)\]/);
                const standardMatch = item.match(/\[\[(\d+)\]\]/);

                if (headingMatch) {
                  const gapNum = parseInt(headingMatch[1]);
                  const gapLetter = String.fromCharCode(96 + gapNum);
                            const q = headingsQuestions.find((hq: any) => {
                              const hqGapNum = typeof hq.gapNum === "number" ? hq.gapNum : null;
                              const hqText = hq.question_text || '';
                              const tagMatch = hqText.match(/\[H(\d+)\]/);
                              const tagGapNum = tagMatch ? parseInt(tagMatch[1]) : null;
                              const finalGapNum = hqGapNum !== null ? hqGapNum : tagGapNum;
                              return finalGapNum === gapNum;
                            });
                  
                  if (q) {
                    const qId = q.id || q.temp_id;
                    const answer = previewAnswers[qId];
                    const isCorrect = showResults ? checkAnswer(qId) : null;
                    
                    return (
                        <span
                          key={i}
                            onDragOver={handleDragOver}
                            onDragEnter={handleDragEnter}
                            onDrop={(e) => handleDropOnGap(e, qId)}
  
                          onClick={() => answer && clearAnswer(qId)}
                          className={cn(
                            "inline-flex items-center gap-2 mx-2 my-1 px-4 py-2 border-2 border-dashed rounded-xl transition-all cursor-pointer min-w-[200px] font-sans",
                            answer 
                              ? showResults
                                ? isCorrect 
                                  ? "border-green-500 bg-green-50 text-green-700"
                                  : "border-red-500 bg-red-50 text-red-700"
                                : "border-blue-500 bg-blue-50 text-blue-700"
                              : draggedHeading 
                                ? "border-blue-400 bg-blue-50/50 ring-4 ring-blue-100 animate-pulse"
                                : "border-gray-300 bg-gray-50 text-gray-400 hover:border-blue-300"
                          )}
                        >
                        <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black shrink-0">{gapLetter}</span>
                        {answer ? (
                          <span className="font-bold text-sm flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-current/20 flex items-center justify-center text-[10px] font-black">{answer}</span>
                            {showResults && !isCorrect && (
                              <span className="text-[9px] font-black text-red-500">(Correct: {q.correct_answer})</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-xs font-bold uppercase tracking-wider">Drop Heading Here</span>
                        )}
                      </span>
                    );
                  }
                  return (
                    <span
                      key={i}
                      className="inline-flex items-center gap-2 mx-2 my-1 px-4 py-2 border-2 border-dashed border-orange-300 bg-orange-50 rounded-xl text-orange-600 font-sans"
                    >
                      <span className="w-6 h-6 rounded-lg bg-orange-500 text-white flex items-center justify-center text-xs font-black shrink-0">{gapLetter}</span>
                      <span className="text-xs font-bold">Gap {gapNum} (No question linked)</span>
                    </span>
                  );
                } else if (standardMatch) {
                  const gapNum = parseInt(standardMatch[1]);
                  return (
                    <span
                      key={i}
                      className="inline-flex items-center gap-2 mx-2 my-1 px-2 py-1 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-lg font-sans align-middle shadow-sm select-none"
                    >
                      <span className="w-5 h-5 rounded bg-amber-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">{gapNum}</span>
                      <span className="text-[10px] font-bold text-amber-800 px-1 italic">Gap</span>
                    </span>
                  );
                }
                return <span key={i}>{item}</span>;
              })}
            </div>
          );
        };


    const checkAnswer = (questionId: string) => {
      const q = questions.find((qq: any) => qq.id === questionId || qq.temp_id === questionId);
      if (!q) return null;
      const userAnswer = (previewAnswers[questionId] || "").trim().toLowerCase();
      if (!userAnswer) return null;
      
      const correctAnswers = (q.correct_answer || "").split("/").map((ans: string) => ans.trim().toLowerCase());
      if (correctAnswers.includes(userAnswer)) return true;

      // Handle Roman vs Full Text matching for headings
      if (headingsGroup && (q.question_type === "matching_headings" || q.group_id === headingsGroupId)) {
        const options = headingsGroup.options || [];
        const romanIdx = options.findIndex((opt: string, idx: number) => toRoman(idx + 1).toLowerCase() === userAnswer);
        const correctRomanIdx = options.findIndex((opt: string, idx: number) => {
          const roman = toRoman(idx + 1).toLowerCase();
          return correctAnswers.includes(roman) || correctAnswers.includes(opt.toLowerCase());
        });
        
        if (romanIdx !== -1 && romanIdx === correctRomanIdx) return true;
      }

      return false;
    };


  return (
    <div className="flex-1 flex flex-col bg-[#f0f2f5] overflow-hidden">
      {/* Preview Header */}
      <div className="h-12 bg-gray-800 text-white flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBackToEdit}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-all"
          >
            <ChevronLeft size={14} /> Back to Edit
          </button>
          <div className="h-4 w-px bg-white/20" />
          <span className="text-sm font-bold">Student Preview Mode</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setPreviewAnswers({});
              setShowResults(false);
            }}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-all"
          >
            Reset Answers
          </button>
          <button 
            onClick={() => setShowResults(!showResults)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
              showResults ? "bg-green-500 text-white" : "bg-white text-gray-800"
            )}
          >
            {showResults ? "Hide Results" : "Check Answers"}
          </button>
        </div>
      </div>

      {/* Main Preview Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Passage */}
        <div className="w-1/2 border-r border-gray-200 bg-white flex flex-col">
          <div className="h-10 bg-gray-100 border-b border-gray-200 px-4 flex items-center text-xs font-bold text-gray-600 uppercase tracking-wider">
            Reading Passage
          </div>
          <div className="flex-1 overflow-y-auto p-8">
            <h2 className="text-2xl font-black mb-8 text-gray-900">{currentPart?.title}</h2>
            {processPassageWithGaps(currentPart?.passage_text)}
          </div>
        </div>

        {/* Right Panel - Questions / List of Headings */}
        <div className="w-1/2 bg-white flex flex-col">
          <div className="h-10 bg-gray-100 border-b border-gray-200 px-4 flex items-center text-xs font-bold text-gray-600 uppercase tracking-wider">
            Questions
          </div>
                <div className="flex-1 overflow-y-auto p-8">
                    {partGroups.map((group, gIdx) => {
                      const groupQs = partQuestions.filter(q => q.group_id === (group.id || group.temp_id));
                      if (groupQs.length === 0 && group.type !== "matching_headings" && group.type !== "flowchart_completion") return null;

                        const isMatchingSentenceEndings = group.type === "matching_sentence_endings";
                        const isFlowChart = group.type === "flowchart_completion";
                        const isDiagram = group.type === "diagram_completion";
                        const isSentenceCompletion = group.type === "sentence_completion";
                        const isTable = group.type === "table_completion";
                        const isTrueFalse = group.type === "true_false_ng";


                      const startNum = getGlobalIdx(groupQs[0]?.id || groupQs[0]?.temp_id) + 1;
                      const endNum = startNum + groupQs.length - 1;

                    return (
                      <div key={group.id || group.temp_id} className="mb-12 last:mb-0">
                        <div className="flex flex-col items-center mb-6">
                           <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                             Questions {startNum > 0 ? (endNum > startNum ? `${startNum}-${endNum}` : startNum) : "Loading..."}
                           </h3>
                           <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 italic text-center w-full max-w-2xl">
                             {group.instructions}
                           </div>
                        </div>


                      {group.type === "matching_headings" && (
                        <div className="space-y-6">
                          {group.groupText && (
                            <div className="text-sm leading-relaxed text-gray-700 font-medium bg-gray-50/50 p-4 rounded-xl border border-gray-100 italic">
                              {group.groupText}
                            </div>
                          )}

                          <div className="p-6 bg-gray-50 border border-gray-200 rounded-2xl">
                            <h4 className="font-black text-sm uppercase tracking-widest text-gray-700 mb-4 text-center">
                              {group.optionsTitle || "List of Headings"}
                            </h4>
                            <div className="space-y-2 max-w-md mx-auto">
                                {(group.options || []).map((opt: string, idx: number) => {
                                  const label = toRoman(idx + 1);
                                  return (
                                    <div
                                      key={idx}
                                      draggable
                                      onDragStart={(e) => handleDragStart(e, label, opt, group.id || group.temp_id)}
                                      onDragEnd={handleDragEnd}
                                      className="flex items-center gap-3 p-3 bg-white border-2 border-gray-200 rounded-xl transition-all cursor-grab active:cursor-grabbing hover:border-blue-300 hover:shadow-md"
                                    >
                                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 bg-blue-600 text-white">
                                        {label}
                                      </div>
                                      <span className="text-sm font-medium text-gray-700">{opt}</span>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>

                          {showResults && (
                            <div className="p-6 bg-gray-800 text-white rounded-2xl">
                              <h4 className="font-black text-sm uppercase tracking-widest mb-4">Results</h4>
                              <div className="grid grid-cols-2 gap-3">
                                {groupQs.map((q: any, idx: number) => {
                                  const qId = q.id || q.temp_id;
                                  const isCorrect = checkAnswer(qId);
                                  const userAnswer = previewAnswers[qId];
                                    return (
                                      <div key={qId} className={cn(
                                        "p-3 rounded-xl",
                                        isCorrect === true ? "bg-green-500/20" : isCorrect === false ? "bg-red-500/20" : "bg-white/10"
                                      )}>
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs font-bold">Heading {userAnswer || "?"} - Passage {String.fromCharCode(96 + (q.gapNum || 0 || idx + 1)).toUpperCase()}</span>
                                          {isCorrect === true && <CheckCircle2 size={14} className="text-green-400" />}
                                          {isCorrect === false && <span className="text-red-400 text-xs font-bold">✗</span>}
                                        </div>
                                        {isCorrect === false && (
                                          <div className="text-[9px] mt-1 text-red-300 font-black uppercase">
                                            Correct: {q.correct_answer}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              <div className="mt-4 pt-4 border-t border-white/20 flex justify-between items-center">
                                <span className="text-sm font-bold">Score:</span>
                                <span className="text-2xl font-black">
                                  {groupQs.filter((q: any) => checkAnswer(q.id || q.temp_id) === true).length} / {groupQs.length}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                          {group.type === "paragraph_matching" && (
                            <div className="space-y-4">
                              <div className="p-8 bg-[#f0f4f8] border border-gray-200 rounded-[2.5rem] max-w-2xl mx-auto shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
                                  <h4 className="font-black text-sm uppercase tracking-widest text-gray-700 mb-6 text-center">
                                    {group.optionsTitle || "List of Options"}
                                  </h4>
                                <div className="grid grid-cols-1 gap-2 max-w-md mx-auto">
                                  {(group.options || []).map((opt, idx) => (
                                    <div key={idx} className="flex items-center gap-4 p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black shrink-0 shadow-sm">
                                        {String.fromCharCode(65 + idx)}
                                      </div>
                                      <span className="text-sm font-bold text-gray-700">{opt}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                                  <div className="space-y-1 max-w-3xl mx-auto">
                                    {groupQs.map((q, qIdx) => {
                                      const qId = q.id || q.temp_id;
                                      const isCorrect = showResults ? checkAnswer(qId) : null;
                                      const qNum = getGlobalIdx(qId) + 1;
                                      return (
                                        <div key={qId} className="flex items-start gap-4 p-2 rounded-xl hover:bg-gray-50/80 transition-colors">
                                          <span className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-md">{qNum}</span>

                                      <p className="flex-1 text-[15px] font-bold text-gray-800 pt-2 leading-tight">
                                        {q.question_text}
                                      </p>
                                      <div className="shrink-0 flex items-center gap-2 pt-1">
                                        <select 
                                          value={previewAnswers[qId] || ""}
                                          onChange={(e) => setPreviewAnswers(prev => ({ ...prev, [qId]: e.target.value }))}
                                          className={cn(
                                            "h-9 w-24 border-2 rounded-xl text-sm font-black px-2 transition-all outline-none cursor-pointer text-center",
                                            previewAnswers[qId] 
                                              ? isCorrect === true ? "border-green-500 bg-green-50 text-green-700"
                                              : isCorrect === false ? "border-red-500 bg-red-50 text-red-700"
                                              : "border-blue-500 bg-blue-50 text-blue-700"
                                              : "border-gray-200 focus:border-blue-500"
                                          )}
                                        >
                                          <option value="">Select</option>
                                          {(group.options || []).map((_, i) => (
                                            <option key={i} value={String.fromCharCode(65 + i)}>{String.fromCharCode(65 + i)}</option>
                                          ))}
                                        </select>
                                        {showResults && isCorrect === false && (
                                          <span className="text-[10px] font-black text-red-500 uppercase bg-red-50 px-2 py-1 rounded-lg border border-red-100">Ans: {q.correct_answer}</span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}


                            {group.type === "multiple_choice" && (
                              <div className="space-y-8 max-w-2xl mx-auto">
                                  {groupQs.map((q, qIdx) => {
                                    const qId = q.id || q.temp_id;
                                    const answer = previewAnswers[qId];
                                    const isCorrect = showResults ? checkAnswer(qId) : null;
                                    const qNum = getGlobalIdx(qId) + 1;

                                    return (
                                      <div key={qId} className="space-y-6">
                                        <div className="flex items-start gap-4">
                                          <div className="w-8 h-8 rounded-full bg-[#d32f2f] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm mt-0.5">
                                            {qNum}
                                          </div>

                                        <div className="text-[16px] font-medium text-gray-800 leading-snug">
                                          {q.question_text}
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-1 gap-2 ml-12">
                                        {(q.options || ["A", "B", "C", "D"]).map((opt, oIdx) => {
                                          const label = String.fromCharCode(65 + oIdx);
                                          const isSelected = answer === label;
                                          
                                          return (
                                            <button
                                              key={oIdx}
                                              onClick={() => setPreviewAnswers(prev => ({ ...prev, [qId]: label }))}
                                              className={cn(
                                                "flex items-start gap-3 p-2 rounded-xl transition-all text-left group/mcq-opt relative",
                                                isSelected 
                                                  ? showResults
                                                    ? isCorrect && label === q.correct_answer
                                                      ? "bg-green-50 text-green-700"
                                                      : "bg-red-50 text-red-700"
                                                    : "bg-blue-50 text-blue-700"
                                                  : "hover:bg-gray-50 text-gray-700"
                                              )}
                                            >
                                              <div className={cn(
                                                "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5",
                                                isSelected
                                                  ? showResults
                                                    ? isCorrect && label === q.correct_answer
                                                      ? "border-green-600"
                                                      : "border-red-600"
                                                    : "border-blue-600"
                                                  : "border-gray-300 group-hover/mcq-opt:border-blue-400"
                                              )}>
                                                {isSelected && (
                                                  <div className={cn(
                                                    "w-2.5 h-2.5 rounded-full",
                                                    showResults
                                                      ? isCorrect && label === q.correct_answer
                                                        ? "bg-green-600"
                                                        : "bg-red-600"
                                                      : "bg-blue-600"
                                                  )} />
                                                )}
                                              </div>
                                              <div className="text-[15px] leading-tight flex gap-2">
                                                <span className="font-black shrink-0">{label}</span>
                                                <span className="font-medium">{opt}</span>
                                              </div>
                                              
                                              {showResults && label === q.correct_answer && !isCorrect && (
                                                <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[9px] font-black border border-green-200 flex items-center gap-1">
                                                  <CheckCircle2 size={10} /> Correct
                                                </div>
                                              )}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}


                              {group.type === "summary_completion" && (
                                <div className="max-w-2xl mx-auto font-serif">
                                  {group.diagramTitle && (
                                    <h4 className="text-xl font-bold mb-6 text-gray-900 border-b-2 border-gray-100 pb-2">{group.diagramTitle}</h4>
                                  )}
                                  <div className="text-[17px] leading-[2.2] text-gray-800 whitespace-pre-wrap">
                                    {(() => {
                                      const text = group.groupText || "";
                                      const parts = text.split(/(\[\[\d+\]\])/g);
                                      return parts.map((part, i) => {
                                        const match = part.match(/\[\[(\d+)\]\]/);
                                        if (match) {
                                          const gapNum = parseInt(match[1]);
                                          const q = groupQs.find((q: any) => q.question_text?.includes(`[[${gapNum}]]`));
                                            if (q) {
                                              const qId = q.id || q.temp_id;
                                              const isCorrect = showResults ? checkAnswer(qId) : null;
                                              const globalIdx = getGlobalIdx(qId);
                                              const displayNum = globalIdx !== -1 ? globalIdx + 1 : gapNum;
                                              return (
                                                <span key={i} className="inline-flex items-center align-baseline mx-1">
                                                  <span className="font-bold mr-1 text-gray-900">{displayNum}</span>
                                                  <Input 

                                                  value={previewAnswers[qId] || ""}
                                                  onChange={(e) => setPreviewAnswers(prev => ({ ...prev, [qId]: e.target.value }))}
                                                  className={cn(
                                                    "w-32 h-8 border-b-2 border-t-0 border-l-0 border-r-0 rounded-none bg-transparent px-1 focus:ring-0 text-sm font-bold text-blue-600 transition-all text-center",
                                                    previewAnswers[qId] 
                                                      ? isCorrect === true ? "border-green-500 text-green-700"
                                                      : isCorrect === false ? "border-red-500 text-red-700"
                                                      : "border-blue-500"
                                                      : "border-gray-300 focus:border-blue-500"
                                                  )}
                                                  placeholder="..........."
                                                />
                                                {showResults && isCorrect === false && (
                                                  <span className="text-[10px] font-black text-red-500 ml-1 uppercase">(Ans: {q.correct_answer})</span>
                                                )}
                                              </span>
                                            );
                                          }
                                          return <span key={i} className="text-red-400 font-bold">[[{gapNum}]]</span>;
                                        }
                                        return <span key={i}>{part}</span>;
                                      });
                                    })()}
                                  </div>
                                </div>
                              )}


                                {group.type === "note_completion" && (
                                  <div className="max-w-2xl mx-auto py-8">
                                    {group.diagramTitle && (
                                      <h4 className="text-xl font-bold mb-8 text-gray-900 border-b-2 border-gray-100 pb-3">{group.diagramTitle}</h4>
                                    )}
                                    <div className="space-y-6">
                                      {(() => {
                                        const text = group.groupText || "";
                                        const lines = text.split("\n");
                                        return lines.map((line, lineIdx) => {
                                          const isBullet = line.trim().startsWith("•");
                                          const content = isBullet ? line.trim().replace(/^•\s*/, "") : line.trim();
                                          if (!content && !isBullet) return <div key={lineIdx} className="h-4" />;
                                          
                                          const parts = content.split(/(\[\[n?\d+\]\])/g);
                                          const renderedLine = parts.map((part, i) => {
                                            const match = part.match(/\[\[n?(\d+)\]\]/);
                                            if (match) {
                                              const gapNum = parseInt(match[1]);
                                              const q = groupQs.find((q: any) => {
                                                const qText = q.question_text || "";
                                                return qText.includes(`[[n${gapNum}]]`) || qText.includes(`[[${gapNum}]]`);
                                              });
                                                if (q) {
                                                  const qId = q.id || q.temp_id;
                                                  const isCorrect = showResults ? checkAnswer(qId) : null;
                                                  const answer = previewAnswers[qId];
                                                  const globalIdx = getGlobalIdx(qId);
                                                  const displayNum = globalIdx !== -1 ? globalIdx + 1 : gapNum;
                                                  return (
                                                    <span key={i} className="inline-flex items-center mx-1 align-baseline relative group/gap">
                                                      <span className="font-black mr-1 text-gray-900 text-sm">{displayNum}</span>
                                                      <div className="relative">

                                                      <Input 
                                                        value={answer || ""}
                                                        onChange={(e) => setPreviewAnswers(prev => ({ ...prev, [qId]: e.target.value }))}
                                                        className={cn(
                                                          "w-36 h-8 border-b-2 border-t-0 border-l-0 border-r-0 rounded-none bg-transparent px-2 focus:ring-0 font-bold transition-all text-center placeholder:text-gray-300",
                                                          answer 
                                                            ? showResults
                                                              ? isCorrect === true ? "border-green-500 text-green-700 bg-green-50/30"
                                                              : "border-red-500 text-red-700 bg-red-50/30"
                                                            : "border-blue-500 text-blue-700 bg-blue-50/10"
                                                            : "border-gray-300 focus:border-blue-500"
                                                        )}
                                                        placeholder="..............."
                                                      />
                                                      {showResults && isCorrect === false && (
                                                        <div className="absolute -bottom-5 left-0 right-0 text-center">
                                                          <span className="text-[9px] text-red-500 font-black whitespace-nowrap bg-white px-1 shadow-sm border border-red-100 rounded">
                                                            Ans: {q.correct_answer}
                                                          </span>
                                                        </div>
                                                      )}
                                                    </div>
                                                  </span>
                                                );
                                              }
                                              return <span key={i} className="text-gray-400 font-medium">{gapNum} ........................</span>;
                                            }
                                            return <span key={i} className="font-bold text-gray-700">{part}</span>;
                                          });

                                          return (
                                            <div key={lineIdx} className={cn("flex gap-6 items-start group/line", isBullet ? "ml-6" : "")}>
                                              {isBullet && (
                                                <div className="shrink-0 w-2 h-2 rounded-full bg-gray-900 mt-[11px] shadow-sm" />
                                              )}
                                              <div className="flex-1 text-[16px] leading-[1.8] tracking-tight">
                                                {renderedLine}
                                              </div>
                                            </div>
                                          );
                                        });
                                      })()}
                                    </div>
                                  </div>
                                )}

                          {group.type === "flowchart_completion" && (
                            <div className="pointer-events-auto">
                              <FlowchartRenderer
                                group={group}
                                groupQs={groupQs}
                                fullQuestions={sortedQuestions}
                                answers={previewAnswers}
                                onAnswerChange={(id, val) => setPreviewAnswers(prev => ({ ...prev, [id]: val }))}
                                showResults={showResults}
                                checkAnswer={checkAnswer}
                              />
                            </div>
                          )}

                          {group.type === "diagram_completion" && (
                            <div className="max-w-2xl mx-auto space-y-8">
                              {group.diagramTitle && (
                                <h4 className="text-xl font-bold text-center text-gray-900 tracking-tight">{group.diagramTitle}</h4>
                              )}
                              
                              {group.diagramImage ? (
                                <div className="rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 shadow-sm">
                                  <img 
                                    src={group.diagramImage} 
                                    alt="Diagram" 
                                    className="w-full h-auto object-contain max-h-[500px]"
                                  />
                                </div>
                              ) : (
                                <div className="aspect-video flex items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                                  <p className="text-gray-400 font-bold italic">Diagram image not available</p>
                                </div>
                              )}

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {groupQs.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0)).map((q: any) => {
                                  const qId = q.id || q.temp_id;
                                  const qNum = getGlobalIdx(qId) + 1;
                                  const answer = previewAnswers[qId];
                                  const isCorrect = showResults ? checkAnswer(qId) : null;

                                  return (
                                    <div key={qId} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                                      <div className={cn("w-8 h-8 rounded-lg text-white flex items-center justify-center text-xs font-black shrink-0", theme.bg)}>
                                        {qNum}
                                      </div>
                                      <div className="relative flex-1">
                                        <input 
                                          value={answer || ""}
                                          onChange={(e) => setPreviewAnswers(prev => ({ ...prev, [qId]: e.target.value }))}
                                          className={cn(
                                            "w-full h-9 border-b-2 border-t-0 border-l-0 border-r-0 rounded-none bg-transparent px-2 focus:ring-0 font-bold transition-all outline-none",
                                            answer 
                                              ? showResults
                                                ? isCorrect === true ? "border-green-500 text-green-700 bg-green-50/30"
                                                : "border-red-500 text-red-700 bg-red-50/30"
                                              : "border-blue-500 text-blue-700 bg-blue-50/10"
                                              : "border-gray-300 focus:border-blue-500"
                                          )}
                                          placeholder="..............."
                                        />
                                        {showResults && isCorrect === false && (
                                          <div className="absolute -bottom-5 left-0 right-0">
                                            <span className="text-[9px] text-red-500 font-black whitespace-nowrap bg-white px-1 shadow-sm border border-red-100 rounded">
                                              Ans: {q.correct_answer}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}





                              {group.type === "sentence_completion" && (
                                <div className="space-y-6 max-w-3xl mx-auto">
                                  {(() => {
                                    const text = group.groupText || "";
                                    const lines = text.split("\n").filter((l: string) => l.trim());
                                    return lines.map((line: string, lineIdx: number) => {
                                      const parts = line.split(/(\[\[\d+\]\])/g);
                                      return (
                                        <div key={lineIdx} className="flex items-start gap-4">
                                          <div className="flex-1 text-lg font-medium leading-relaxed text-gray-800 pt-1">
                                            {parts.map((part, i) => {
                                              const match = part.match(/\[\[(\d+)\]\]/);
                                              if (match) {
                                                const gapNum = parseInt(match[1]);
                                                const q = groupQs.find((q: any) => q.question_text?.includes(`[[${gapNum}]]`));
                                                  if (q) {
                                                    const qId = q.id || q.temp_id;
                                                    const isCorrect = showResults ? checkAnswer(qId) : null;
                                                    const globalIdx = getGlobalIdx(qId);
                                                    const displayNum = globalIdx !== -1 ? globalIdx + 1 : gapNum;
                                                    return (
                                                      <span key={i} className="inline-flex items-center align-middle mx-1">
                                                        <span className="text-sm font-black text-gray-900 mr-2">{displayNum}</span>
                                                        <div className="relative">
                                                          <input 
                                                            value={previewAnswers[qId] || ""}
                                                            onChange={(e) => setPreviewAnswers(prev => ({ ...prev, [qId]: e.target.value }))}
                                                            className={cn(
                                                              "w-48 h-9 border-b-2 border-t-0 border-l-0 border-r-0 rounded-none bg-transparent px-2 focus:ring-0 font-bold transition-all outline-none text-center",
                                                              previewAnswers[qId] 
                                                                ? showResults
                                                                  ? isCorrect === true ? "border-green-500 text-green-700 bg-green-50/30"
                                                                  : "border-red-500 text-red-700 bg-red-50/30"
                                                                : "border-blue-500 text-blue-700 bg-blue-50/10"
                                                                : "border-gray-300 focus:border-blue-500"
                                                            )}
                                                            placeholder="..............."
                                                          />
                                                          {showResults && isCorrect === false && (
                                                            <span className="text-[10px] text-red-500 font-black whitespace-nowrap bg-white px-1 shadow-sm border border-red-100 rounded mt-1 block text-center">
                                                              Ans: {q.correct_answer}
                                                            </span>
                                                          )}
                                                        </div>
                                                      </span>
                                                    );
                                                  }
                                                return <span key={i} className="text-red-400 font-bold">[[{gapNum}]]</span>;
                                              }
                                              return <span key={i}>{part}</span>;
                                            })}
                                          </div>
                                        </div>
                                      );
                                    });
                                  })()}
                                </div>
                              )}

                            {(group.type === "matching_sentence_endings" || group.type === "matching_features") && (
                              <div className="space-y-6">
                                <div className="p-8 bg-[#f8fafc] border-2 border-gray-200 rounded-[2.5rem] max-w-2xl mx-auto shadow-sm relative overflow-hidden group/box">
                                  <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
                                  <h4 className="font-black text-sm uppercase tracking-widest text-gray-700 mb-6 text-center">
                                    {group.optionsTitle || (group.type === "matching_sentence_endings" ? "List of Endings" : "List of Features")}
                                  </h4>
                                  <div className="grid grid-cols-1 gap-2 max-w-md mx-auto">
                                    {(group.options || []).map((opt: string, idx: number) => (
                                       <div key={idx} className="flex items-start gap-4 p-3 bg-white border border-gray-100 rounded-2xl shadow-sm">
                                         <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black shrink-0 shadow-sm mt-0.5">
                                           {String.fromCharCode(65 + idx)}
                                         </div>
                                         <span className="text-sm font-bold text-gray-700 leading-snug">{opt}</span>
                                       </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="space-y-4 max-w-3xl mx-auto">
                                  {groupQs.map((q: any, qIdx: number) => {
                                    const qId = q.id || q.temp_id;
                                    const isCorrect = showResults ? checkAnswer(qId) : null;
                                    return (
                                      <div key={qId} className="flex items-start gap-4 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                        <span className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-md">{startNum + qIdx}</span>
                                        <p className="flex-1 text-[15px] font-bold text-gray-800 pt-2 leading-relaxed">
                                          {q.question_text}
                                        </p>
                                        <div className="shrink-0 flex items-center gap-2 pt-1">
                                          <select 
                                            value={previewAnswers[qId] || ""}
                                            onChange={(e) => setPreviewAnswers(prev => ({ ...prev, [qId]: e.target.value }))}
                                            className={cn(
                                              "h-10 w-28 border-2 rounded-xl text-sm font-black px-2 transition-all outline-none cursor-pointer text-center",
                                              previewAnswers[qId] 
                                                ? isCorrect === true ? "border-green-500 bg-green-50 text-green-700"
                                                : isCorrect === false ? "border-red-500 bg-red-50 text-red-700"
                                                : "border-blue-500 bg-blue-50 text-blue-700"
                                                : "border-gray-200 focus:border-blue-500"
                                            )}
                                          >
                                            <option value="">Select</option>
                                            {(group.options || []).map((_: any, i: number) => (
                                              <option key={i} value={String.fromCharCode(65 + i)}>{String.fromCharCode(65 + i)}</option>
                                            ))}
                                          </select>
                                          {showResults && isCorrect === false && (
                                            <div className="flex flex-col items-center">
                                              <span className="text-[10px] font-black text-red-500 uppercase bg-red-50 px-2 py-1 rounded-lg border border-red-100">Ans: {q.correct_answer}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {isTable && (
                              <div className="max-w-4xl mx-auto py-8">
                                {group.diagramTitle && (
                                  <h4 className="text-xl font-bold mb-8 text-gray-900 border-b-2 border-gray-100 pb-3 tracking-tight text-center">{group.diagramTitle}</h4>
                                )}
                                <div className="overflow-x-auto border border-gray-200 rounded-2xl bg-white shadow-sm">
                                  <table className="w-full border-collapse">
                                    <thead>
                                      <tr className="bg-gray-50/80">
                                        {(group.tableHeaders || []).map((header: string, hIdx: number) => {
                                          const widths = group.tableColumnWidths || (group.tableHeaders || []).map(() => 150);
                                          const width = widths[hIdx] || 150;
                                          return (
                                            <th 
                                              key={hIdx} 
                                              className="p-4 border border-gray-100 text-[11px] font-black uppercase tracking-widest text-gray-500 text-center"
                                              style={{ width: `${width}px` }}
                                            >
                                              {header}
                                            </th>
                                          );
                                        })}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {(group.tableRows || []).map((row: string[], rIdx: number) => (
                                        <tr key={rIdx}>
                                          {row.map((cell: string, cIdx: number) => {
                                            const parts = (cell || "").split(/(\[\[\d+\]\])/g);
                                            return (
                                              <td key={cIdx} className="p-4 border border-gray-100 align-top bg-white">
                                                <div className="text-[13px] font-medium leading-relaxed text-gray-800">
                                                  {parts.map((part, pIdx) => {
                                                    const match = part.match(/\[\[(\d+)\]\]/);
                                                    if (match) {
                                                      const gapNum = parseInt(match[1]);
                                                      const q = groupQs.find((q: any) => q.question_text?.includes(`[[${gapNum}]]`));
                                                          if (q) {
                                                            const qId = q.id || q.temp_id;
                                                            const isCorrect = showResults ? checkAnswer(qId) : null;
                                                            const answer = previewAnswers[qId];
                                                            const globalIdx = getGlobalIdx(qId);
                                                            const displayNum = globalIdx !== -1 ? globalIdx + 1 : gapNum;
                                                            return (
                                                              <span key={pIdx} className="inline-flex items-center align-middle mx-1 relative">
                                                                <span className="text-sm font-black text-gray-900 mr-2">{displayNum}</span>
                                                                <div className="relative">
                                                                  <input 
                                                                    value={answer || ""}
                                                                    onChange={(e) => setPreviewAnswers(prev => ({ ...prev, [qId]: e.target.value }))}
                                                                    className={cn(
                                                                      "w-32 h-8 border-b-2 border-t-0 border-l-0 border-r-0 rounded-none bg-transparent px-2 focus:ring-0 font-bold transition-all text-center placeholder:text-gray-300 outline-none",
                                                                      answer 
                                                                        ? showResults
                                                                          ? isCorrect === true ? "border-green-500 text-green-700 bg-green-50/30"
                                                                          : "border-red-500 text-red-700 bg-red-50/30"
                                                                        : "border-blue-500 text-blue-700 bg-blue-50/10"
                                                                        : "border-gray-300 focus:border-blue-500"
                                                                    )}
                                                                    placeholder="........"
                                                                  />
                                                                  {showResults && isCorrect === false && (
                                                                    <div className="absolute -bottom-5 left-0 right-0 text-center">
                                                                      <span className="text-[9px] text-red-500 font-black whitespace-nowrap bg-white px-1 shadow-sm border border-red-100 rounded">
                                                                        Ans: {q.correct_answer}
                                                                      </span>
                                                                    </div>
                                                                  )}
                                                                </div>
                                                              </span>
                                                            );
                                                          }

                                                      return <span key={pIdx} className="text-red-400 font-bold">[[{gapNum}]]</span>;
                                                    }
                                                    return <span key={pIdx}>{part}</span>;
                                                  })}
                                                </div>
                                              </td>
                                            );
                                          })}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {isTrueFalse && (
                              <div className="space-y-6 max-w-3xl mx-auto">
                                {groupQs.map((q, idx) => {
                                  const qId = q.id || q.temp_id;
                                  const answer = previewAnswers[qId];
                                  const isCorrect = showResults ? checkAnswer(qId) : null;
                                  const qNum = startNum + idx;
                                  return (
                                    <div key={qId} className="flex items-start gap-4 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                      <span className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-md">{qNum}</span>
                                      <div className="flex-1 space-y-4">
                                        <p className="text-[16px] font-bold text-gray-800 leading-relaxed pt-2">
                                          {q.question_text}
                                        </p>
                                        <div className="flex flex-wrap gap-2 pt-2">
                                          {["true", "false", "not-given"].map((opt) => {
                                            const isSelected = answer === opt;
                                            const label = opt === "not-given" ? "NOT GIVEN" : opt.toUpperCase();
                                            return (
                                              <button
                                                key={opt}
                                                onClick={() => setPreviewAnswers(prev => ({ ...prev, [qId]: opt }))}
                                                className={cn(
                                                  "px-4 py-2 rounded-xl text-xs font-black transition-all border-2",
                                                  isSelected
                                                    ? showResults
                                                      ? isCorrect && opt === q.correct_answer
                                                        ? "bg-green-50 border-green-500 text-green-700"
                                                        : "bg-red-50 border-red-500 text-red-700"
                                                      : "bg-blue-50 border-blue-500 text-blue-700"
                                                    : "bg-white border-gray-100 text-gray-400 hover:border-blue-200 hover:text-blue-500"
                                                )}
                                              >
                                                {label}
                                              </button>
                                            );
                                          })}
                                        </div>
                                        {showResults && !isCorrect && (
                                          <div className="flex items-center gap-2 mt-2">
                                            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-50 px-2 py-1 rounded-lg border border-red-100">
                                              Correct: {(q.correct_answer || "").toUpperCase()}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {group.type === "list_selection" && (
                              <div className="space-y-8 max-w-2xl mx-auto">
                                <div className="p-6 bg-amber-50/30 border border-amber-100 rounded-2xl relative overflow-hidden">
                                  <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
                                  <h4 className="font-black text-sm uppercase tracking-widest text-gray-700 mb-4 text-center">
                                    {group.optionsTitle || "List of Options"}
                                  </h4>
                                  <div className="space-y-2 max-w-md mx-auto">
                                    {(group.options || []).map((opt: string, oIdx: number) => {
                                      const label = String.fromCharCode(65 + oIdx);
                                      return (
                                        <div key={oIdx} className="flex items-start gap-4 p-2 rounded-xl hover:bg-white transition-all group/opt">
                                          <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                                            {label}
                                          </div>
                                          <span className="text-sm font-bold text-gray-700 pt-1.5">{opt}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                  {groupQs.map((q, idx) => {
                                    const qId = q.id || q.temp_id;
                                    const answer = previewAnswers[qId];
                                    const isCorrect = showResults ? checkAnswer(qId) : null;
                                    const qNum = startNum + idx;
                                    return (
                                      <div key={qId} className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                                        <span className="w-10 h-10 rounded-full bg-amber-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-md">{qNum}</span>
                                        <div className="flex-1 flex items-center gap-4">
                                          <select 
                                            value={answer || ""}
                                            onChange={(e) => setPreviewAnswers(prev => ({ ...prev, [qId]: e.target.value }))}
                                            className={cn(
                                              "h-10 w-32 border-2 rounded-xl text-sm font-black px-2 transition-all outline-none cursor-pointer text-center",
                                              answer 
                                                ? showResults
                                                  ? isCorrect ? "border-green-500 bg-green-50 text-green-700"
                                                  : "border-red-500 bg-red-50 text-red-700"
                                                  : "border-amber-500 bg-amber-50 text-amber-700"
                                                : "border-gray-200 focus:border-amber-500"
                                            )}
                                          >
                                            <option value="">Select</option>
                                            {(group.options || []).map((_, i) => (
                                              <option key={i} value={String.fromCharCode(65 + i)}>{String.fromCharCode(65 + i)}</option>
                                            ))}
                                          </select>
                                          {showResults && !isCorrect && (
                                            <span className="text-[10px] font-black text-red-500 uppercase bg-red-50 px-2 py-1 rounded-lg border border-red-100">Ans: {q.correct_answer}</span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {group.type === "choosing_a_title" && (
                              <div className="space-y-6 max-w-2xl mx-auto">
                                {groupQs.map((q, idx) => {
                                  const qId = q.id || q.temp_id;
                                  const answer = previewAnswers[qId];
                                  const isCorrect = showResults ? checkAnswer(qId) : null;
                                  const qNum = startNum + idx;
                                  return (
                                    <div key={qId} className="space-y-4">
                                      <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm mt-0.5">
                                          {qNum}
                                        </div>
                                        <div className="text-[16px] font-medium text-gray-800">Choose the best title for the passage:</div>
                                      </div>
                                      <div className="grid grid-cols-1 gap-2 ml-12">
                                        {(q.options || ["A", "B", "C", "D"]).map((opt, oIdx) => {
                                          const label = String.fromCharCode(65 + oIdx);
                                          const isSelected = answer === label;
                                          return (
                                            <button
                                              key={oIdx}
                                              onClick={() => setPreviewAnswers(prev => ({ ...prev, [qId]: label }))}
                                              className={cn(
                                                "flex items-start gap-3 p-3 rounded-xl transition-all text-left relative",
                                                isSelected 
                                                  ? showResults
                                                    ? isCorrect && label === q.correct_answer
                                                      ? "bg-green-50 text-green-700 border-green-200 border"
                                                      : "bg-red-50 text-red-700 border-red-200 border"
                                                    : "bg-purple-50 text-purple-700 border-purple-200 border"
                                                  : "hover:bg-gray-50 text-gray-700 border border-transparent"
                                              )}
                                            >
                                              <div className="font-black shrink-0 w-6">{label}</div>
                                              <div className="font-medium">{opt}</div>
                                              {showResults && label === q.correct_answer && !isCorrect && (
                                                <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[9px] font-black border border-green-200">
                                                  Correct
                                                </div>
                                              )}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {group.type !== "matching_headings" && group.type !== "paragraph_matching" && group.type !== "multiple_choice" && group.type !== "summary_completion" && group.type !== "flowchart_completion" && group.type !== "note_completion" && group.type !== "diagram_completion" && group.type !== "sentence_completion" && group.type !== "matching_sentence_endings" && group.type !== "matching_features" && group.type !== "table_completion" && group.type !== "true_false_ng" && group.type !== "list_selection" && group.type !== "choosing_a_title" && (


                                <div className="space-y-4 max-w-3xl mx-auto">
                                  {groupQs.map((q, qIdx) => (
                                    <div key={q.id || q.temp_id} className="flex items-center gap-4">
                                      <span className="w-8 font-black text-sm text-gray-400 shrink-0">{startNum + qIdx}</span>
                                      <p className="flex-1 text-sm font-medium">{q.question_text}</p>
                                      <Input 
                                        value={previewAnswers[q.id || q.temp_id] || ""}
                                        onChange={(e) => setPreviewAnswers(prev => ({ ...prev, [q.id || q.temp_id]: e.target.value }))}
                                        className="w-40 h-9"
                                        placeholder="Your answer..."
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}
                          </div>
                        );
                      })
                    }
                  </div>
              </div>
          </div>


        {/* Preview Footer */}
        <div className="h-16 bg-gray-100 border-t border-gray-200 flex flex-col shrink-0 overflow-hidden shadow-2xl">
          <div className="flex-1 flex items-center justify-between px-6">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {parts.map((p, idx) => (
                <button
                  key={p.id || p.temp_id}
                  onClick={() => setCurrentPartIndex(idx)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                    currentPartIndex === idx ? "bg-gray-800 text-white shadow-lg" : "bg-white text-gray-600 hover:bg-gray-200 border border-gray-200"
                  )}
                >
                  Part {p.part_number}
                </button>
              ))}
            </div>
            
              {/* Universal Question Navigator */}
              <div className="flex-1 flex justify-center px-8">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-2xl py-1">
                  {partQuestions.map((q) => {
                      const qId = q.id || q.temp_id;
                      const globalIdx = getGlobalIdx(qId);
                      const isAnswered = !!previewAnswers[qId];
                      
                      return (
                        <button
                          key={qId}
                          className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black transition-all border shrink-0 shadow-sm",
                            isAnswered 
                              ? "bg-blue-600 border-blue-600 text-white" 
                              : "bg-white border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-500",
                            !isAnswered && "ring-2 ring-blue-100 border-blue-400"
                          )}
                        >
                          {globalIdx + 1}
                        </button>
                      );
                    })}
              </div>
            </div>

            <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-gray-400">
              <span className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-blue-600 rounded shadow-sm" /> Answered
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-white rounded border border-gray-300 shadow-sm" /> Unanswered
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };


export default function CDIAdminEditor({
  testTitle,
  section,
  parts: initialParts,
  questions: initialQuestions,
  questionOffset = 0,
  onSave,
  onExit
}: CDIAdminEditorProps) {
    const [parts, setParts] = useState(initialParts);
    const [questions, setQuestions] = useState(initialQuestions);
    const [deletedPartIds, setDeletedPartIds] = useState<string[]>([]);
    const [deletedQuestionIds, setDeletedQuestionIds] = useState<string[]>([]);
    const [currentPartIndex, setCurrentPartIndex] = useState(0);

    const sortedQuestions = useMemo(() => {
      return [...questions].sort((a, b) => {
        const aPartId = a.part_id || a.temp_part_id;
        const bPartId = b.part_id || b.temp_part_id;
        const partAIdx = parts.findIndex(p => p.id === aPartId || p.temp_id === aPartId);
        const partBIdx = parts.findIndex(p => p.id === bPartId || p.temp_id === bPartId);
        
        if (partAIdx !== partBIdx) return partAIdx - partBIdx;
        return (a.order_index || 0) - (b.order_index || 0);
      });
    }, [questions, parts]);

    const getGlobalIdx = (qId: string) => {
      const idx = sortedQuestions.findIndex(q => q.id === qId || q.temp_id === qId);
      return idx === -1 ? -1 : idx + questionOffset;
    };

    useEffect(() => {
      setParts(initialParts.length > 0 ? initialParts : []);
      setQuestions(initialQuestions);
      setDeletedPartIds([]);
      setDeletedQuestionIds([]);
      setCurrentPartIndex(0);
    }, [initialParts, initialQuestions]);

    useEffect(() => {
      if (parts.length === 0 && section?.id) {
        const newPartId = `temp-part-${Date.now()}`;
        setParts([{
          id: newPartId,
          temp_id: newPartId,
          section_id: section.id,
          part_number: 1,
          title: "New Part",
          instructions: "",
          passage_text: "",
          order_index: 1,
          question_groups: []
        }]);
      }
    }, [parts.length, section?.id]);

          useEffect(() => {
              // Sync questions with content tags to remove orphaned questions and sync correct answers
                const timer = setTimeout(() => {
                  let tagsInPassage: string[] = [];
                  const headingGapData = new Map<number, { correctAnswer: string }>();
                  parts.forEach(p => {
                    const text = p.passage_text || "";
                    // Match TipTap HTML data-heading-gap="1" data-correct-answer="..."
                    const htmlGapRegex = /data-heading-gap="(\d+)"(?:[^>]*data-correct-answer="([^"]*)")?/g;
                    let match;
                    while ((match = htmlGapRegex.exec(text)) !== null) {
                      const num = parseInt(match[1]);
                      const correct = match[2] || "";
                      tagsInPassage.push(`[H${num}]`);
                      headingGapData.set(num, { correctAnswer: correct });
                    }

                    // Fallback for plain text [H1]
                    const plainRegex = /\[H(\d+)\]/g;
                    while ((match = plainRegex.exec(text)) !== null) {
                      const num = parseInt(match[1]);
                      if (!headingGapData.has(num)) {
                        tagsInPassage.push(`[H${num}]`);
                        headingGapData.set(num, { correctAnswer: "" });
                      }
                    }
                    
                    // Other tags
                    const otherMatches = text.match(/\[\[n?\d+\]\]/g);
                    if (otherMatches) tagsInPassage.push(...otherMatches);
                  });
        
                  let tagsInGroups: Record<string, string[]> = {};
                  const groupTypeById: Record<string, string> = {};
                  parts.forEach(p => {
                    (p.question_groups || []).forEach((g: any) => {
                      let gTags: string[] = [];
                      const processText = (txt: string) => {
                        if (!txt) return;
                        const matches = txt.match(/(\[\[n?\d+\]\]|\[H\d+\]|\[f\d+\]|data-heading-gap="(\d+)")/g);
                        if (matches) {
                          matches.forEach(m => {
                            if (m.startsWith('data-heading-gap')) {
                              const num = m.match(/"(\d+)"/)?.[1];
                              if (num) gTags.push(`[H${num}]`);
                            } else {
                              gTags.push(m);
                            }
                          });
                        }
                      };

                      processText(g.groupText);
                      if (g.tableRows) {
                        g.tableRows.forEach((row: string[]) => {
                          row.forEach((cell: string) => processText(cell));
                        });
                      }
                      if (g.sections) {
                        g.sections.forEach((s: any) => processText(s.content));
                      }
                      
                      // Process flowchartData for [f#] tags
                      if (g.flowchartData && g.flowchartData.steps) {
                        g.flowchartData.steps.forEach((s: any) => {
                          processText(s.text);
                          if (s.theories) {
                            s.theories.forEach((t: any) => processText(t.text));
                          }
                        });
                      }

                      if (g.id) {
                        tagsInGroups[g.id] = gTags;
                        groupTypeById[g.id] = g.type;
                      }
                      if (g.temp_id) {
                        tagsInGroups[g.temp_id] = gTags;
                        groupTypeById[g.temp_id] = g.type;
                      }
                    });
                  });
        
                    setQuestions(prev => {
                      let changed = false;
                      let updatedQuestions = [...prev];

                      // 1. Remove orphaned questions
                      const filteredQuestions = updatedQuestions.filter(q => {
                        const tagMatch = q.question_text?.match(/(\[\[n?\d+\]\]|\[H\d+\]|\[f\d+\])/);
                        const tag = tagMatch?.[0];
                        const headingMatch = tag?.match(/\[H(\d+)\]/);
                        const headingGapNum = typeof q.gapNum === "number" ? q.gapNum : (headingMatch ? parseInt(headingMatch[1]) : null);

                        if (q.question_type === "matching_headings" && headingGapNum == null && !tag) return false;
                        if (!tag && headingGapNum == null) return true;

                        if (!q.group_id) {
                          if (q.question_type === "matching_headings") {
                            return headingGapNum != null ? headingGapData.has(headingGapNum) : (tag ? tagsInPassage.includes(tag) : false);
                          }
                          return tag ? tagsInPassage.includes(tag) : true;
                        }

                        const groupType = groupTypeById[q.group_id];
                        if (groupType === "matching_headings") {
                          return headingGapNum != null ? headingGapData.has(headingGapNum) : (tag ? tagsInPassage.includes(tag) : false);
                        }

                        const groupTags = tagsInGroups[q.group_id] || [];
                        return tag ? groupTags.includes(tag) : true;
                      });

                      if (filteredQuestions.length !== updatedQuestions.length) {
                        updatedQuestions = filteredQuestions;
                        changed = true;
                      }

                      // 2. Add missing questions for tags found in groups (Summary, Note, Flowchart)
                      Object.entries(tagsInGroups).forEach(([groupId, tags]) => {
                        const groupType = groupTypeById[groupId];
                        // Only auto-add for these specific types
                        if (groupType !== "note_completion" && groupType !== "summary_completion" && groupType !== "flowchart_completion") return;

                        tags.forEach(tag => {
                          const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                          const alreadyHas = updatedQuestions.some(q => 
                            q.group_id === groupId && 
                            new RegExp(`${escapedTag}(\\s|$)`).test(q.question_text || "")
                          );
                          if (!alreadyHas) {
                            const numMatch = tag.match(/\d+/);
                            const num = numMatch ? parseInt(numMatch[0]) : 1;
                            
                            // Find parent part/section info
                            let partId = "";
                            let sectionId = section?.id || "";
                            parts.forEach(p => {
                              if ((p.question_groups || []).some((g: any) => (g.id === groupId || g.temp_id === groupId))) {
                                partId = p.id || p.temp_id;
                              }
                            });

                            const newQ = {
                              temp_id: `temp-q-auto-${groupId}-${tag}-${Date.now()}`,
                              part_id: partId,
                              section_id: sectionId,
                              question_type: groupType,
                              question_text: groupType === "note_completion" ? `Gap ${num}: ${tag}` : (groupType === "flowchart_completion" ? tag : `Gap ${num}: ${tag}`),
                              group_id: groupId,
                              correct_answer: "",
                              points: 1,
                              order_index: num // Use the number from the tag as order index
                            };
                            updatedQuestions.push(newQ);
                            changed = true;
                          }
                        });
                      });

                      // 3. Sync heading correct answers
                      updatedQuestions = updatedQuestions.map(q => {
                        if (q.question_type === "matching_headings" || groupTypeById[q.group_id] === "matching_headings") {
                          const tagMatch = q.question_text?.match(/\[H(\d+)\]/);
                          const headingGapNum = typeof q.gapNum === "number" ? q.gapNum : (tagMatch ? parseInt(tagMatch[1]) : null);
                          
                          let updatedQ = { ...q };
                          let localChanged = false;

                          if (headingGapNum != null && q.gapNum !== headingGapNum) {
                            updatedQ.gapNum = headingGapNum;
                            localChanged = true;
                          }

                          if (headingGapNum != null && headingGapData.has(headingGapNum)) {
                            const correctFromHtml = headingGapData.get(headingGapNum)?.correctAnswer || "";
                            if (q.correct_answer !== correctFromHtml) {
                              updatedQ.correct_answer = correctFromHtml;
                              localChanged = true;
                            }
                          }
                          
                          if (localChanged) {
                            changed = true;
                            return updatedQ;
                          }
                        }
                        return q;
                      });

                      if (changed) {
                        const deletedIds = prev
                          .filter(q => !updatedQuestions.find(nq => nq.id === q.id || nq.temp_id === q.temp_id))
                          .map(q => q.id)
                          .filter(id => id && !id.toString().startsWith('temp-'));
                    
                        if (deletedIds.length > 0) {
                          setDeletedQuestionIds(d => [...new Set([...d, ...deletedIds])]);
                        }
                        return updatedQuestions;
                      }
                      return prev;
                    });
    
              }, 2000);

          return () => clearTimeout(timer);
        }, [parts]);

      const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
    const [bulkMode, setBulkMode] = useState(false);
    const [bulkText, setBulkText] = useState("");
    const [leftPanelWidth, setLeftPanelWidth] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const [resizingCol, setResizingCol] = useState<{ groupId: string, colIdx: number, startX: number, startWidth: number, currentDelta?: number } | null>(null);
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [showTableModal, setShowTableModal] = useState(false);
    const [bulkQuestionGroupId, setBulkQuestionGroupId] = useState<string | null>(null);
    const [bulkQuestionText, setBulkQuestionText] = useState("");
  
    const containerRef = useRef<HTMLDivElement>(null);
    const sectionType = section?.section_type || "reading";

    const handleNoteKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, groupId: string) => {
      if (e.key === 'Enter') {
        const textarea = e.currentTarget;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;
        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        const currentLine = value.substring(lineStart, start);
        
        // Always add a bullet on Enter for note completion
        e.preventDefault();
        const nextLine = '\n• ';
        const newValue = value.substring(0, start) + nextLine + value.substring(end);
        updateQuestionGroup(groupId, { groupText: newValue });
        
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + nextLine.length;
        }, 0);
      }
    };
    
    const theme = (() => {
      switch(sectionType) {
        case 'listening':
        case 'reading':
          return {
            primary: "#0072bc",
            bg: "bg-[#0072bc]",
            text: "text-[#0072bc]",
            border: "border-[#0072bc]",
            hoverBg: "hover:bg-[#005a96]",
            lightBg: "bg-blue-50",
            lightBorder: "border-blue-100"
          };
        case 'writing':
          return {
            primary: "#DC2626",
            bg: "bg-[#DC2626]",
            text: "text-[#DC2626]",
            border: "border-[#DC2626]",
            hoverBg: "hover:bg-[#B91C1C]",
            lightBg: "bg-red-50",
            lightBorder: "border-red-100"
          };
        default:
          return {
            primary: "#7c3aed",
            bg: "bg-purple-600",
            text: "text-purple-600",
            border: "border-purple-600",
            hoverBg: "hover:bg-purple-700",
            lightBg: "bg-purple-50",
            lightBorder: "border-purple-100"
          };
      }
    })();

    const themeBg = theme.bg;
    const themeText = theme.text;
    const themeBorder = theme.border;

      const currentPart = parts[currentPartIndex];
      const partQuestions = questions.filter(q => q.part_id === currentPart?.id || (q.temp_part_id && q.temp_part_id === currentPart?.id));
      const partGroups = currentPart?.question_groups || [];
      const matchingHeadingsGroup = partGroups.find((g: any) => g.type === "matching_headings");
      const matchingHeadingsGroupId = matchingHeadingsGroup ? (matchingHeadingsGroup.id || matchingHeadingsGroup.temp_id) : null;
      const matchingHeadingsOptions = matchingHeadingsGroup?.options || [];


    const addPart = () => {
      const newPartId = `temp-part-${Date.now()}`;
      const newPart = {
        id: newPartId,
        temp_id: newPartId,
        section_id: section.id,
        part_number: parts.length + 1,
        title: `Part ${parts.length + 1}`,
        instructions: "",
        passage_text: "",
        order_index: parts.length + 1,
        question_groups: []
      };
      setParts([...parts, newPart]);
      setCurrentPartIndex(parts.length);
      toast.success("New part added");
    };

    const deletePart = (index: number) => {
      if (parts.length <= 1) {
        toast.error("At least one part is required");
        return;
      }
      const partToDelete = parts[index];
      
      if (partToDelete.id && !partToDelete.id.toString().startsWith('temp-')) {
        setDeletedPartIds(prev => [...prev, partToDelete.id]);
        const partQs = questions.filter(q => q.part_id === partToDelete.id);
        const qIds = partQs.map(q => q.id).filter(id => id && !id.toString().startsWith('temp-'));
        setDeletedQuestionIds(prev => [...prev, ...qIds]);
      }

      const newParts = parts.filter((_, i) => i !== index);
      const indexedParts = newParts.map((p, i) => ({ ...p, part_number: i + 1, order_index: i + 1 }));
      setParts(indexedParts);
      setQuestions(prev => prev.filter(q => q.part_id !== partToDelete.id && q.temp_part_id !== partToDelete.id));
      if (currentPartIndex >= indexedParts.length) {
        setCurrentPartIndex(indexedParts.length - 1);
      }
      toast.info("Part removed");
    };

    const addGap = (qId: string) => {
      const q = questions.find(q => q.id === qId || q.temp_id === qId);
      if (!q) return;
      const newText = (q.question_text || "") + " __________ ";
      updateQuestion(qId, "question_text", newText);
      toast.success("Gap added to question");
    };

              const getNextHeadingGapNum = (text: string) => {
                const htmlMatches = Array.from(text.matchAll(/data-heading-gap="(\d+)"/g)).map(match => parseInt(match[1] || "0"));
                const tagMatches = Array.from(text.matchAll(/\[H(\d+)\]/g)).map(match => parseInt(match[1] || "0"));
                const maxNum = Math.max(0, ...htmlMatches, ...tagMatches);
                return maxNum + 1;
              };

                const addHeadingGapQuestion = (gapNum: number, groupId: string) => {
                  if (!currentPart) return;
                  const partId = currentPart.id || currentPart.temp_id;
                  const newId = `temp-q-heading-${Date.now()}-${gapNum}`;
                  const newQ = {
                    temp_id: newId,
                    part_id: partId,
                    gapNum: gapNum,
                    section_id: section.id,
                    question_type: "matching_headings",
                    question_text: `[H${gapNum}]`,
                    group_id: groupId,
                    correct_answer: "",
                    points: 1,
                    order_index: questions.length + 1
                  };
                  setQuestions(prev => [...prev, newQ]);
                };


              const insertHeadingGapToPassage = (groupId: string) => {
                if (!currentPart) return;
                const gapNum = getNextHeadingGapNum(currentPart.passage_text || "");
                addHeadingGapQuestion(gapNum, groupId);
                window.dispatchEvent(
                  new CustomEvent("passage-editor-insert-heading-gap", {
                    detail: { gapNum, correctAnswer: "" },
                  })
                );
                toast.success(`Heading Gap ${gapNum} added`);
              };

              
              const deleteHeadingGap = (gapNum: number) => {
                if (!currentPart) return;
                const passage = currentPart.passage_text || "";
                const newPassage = passage.replace(new RegExp(`\\[H${gapNum}\\]`, 'g'), '');
                updatePart(currentPart.id || currentPart.temp_id, "passage_text", newPassage);
                
                const qToDelete = questions.find(q => q.question_text?.includes(`[H${gapNum}]`));
                if (qToDelete) {
                  setQuestions(questions.filter(q => q.id !== qToDelete.id && q.temp_id !== qToDelete.temp_id));
                }
                toast.info(`Heading Gap ${gapNum} removed`);
              };

        const insertGapToPassage = () => {
          if (!currentPart) return;
          const passage = currentPart.passage_text || "";
          
          const matchingHeadingsGroup = (currentPart.question_groups || []).find((g: any) => g.type === "matching_headings");
          
          if (matchingHeadingsGroup) {
            const gapNum = getNextHeadingGapNum(passage);
            const groupId = matchingHeadingsGroup.id || matchingHeadingsGroup.temp_id;
            addHeadingGapQuestion(gapNum, groupId);
            toast.success(`Heading Gap ${gapNum} added`);
            return { type: 'heading', gapNum, correctAnswer: "" };
          }

          const existingGaps = passage.match(/\[\[(\d+)\]\]/g) || [];
          const nextNum = existingGaps.length > 0 
            ? Math.max(...existingGaps.map(g => parseInt(g.match(/\d+/)?.[0] || "0"))) + 1 
            : 1;
          const gapTag = `[[${nextNum}]]`;
        
          const newId = `temp-q-passage-${Date.now()}`;
          const newQ = {
            id: newId,
            temp_id: newId,
            part_id: currentPart.id,
            temp_part_id: currentPart.id,
            section_id: section.id,
            question_type: "gap_fill",
            question_text: `Gap ${nextNum} from passage: ${gapTag}`,
            group_id: null,
            correct_answer: "",
            points: 1,
            order_index: questions.length + 1
          };
          setQuestions([...questions, newQ]);
          toast.success(`Gap ${nextNum} added to passage`);
          return { type: 'standard', gapNum: nextNum };
        };

      
      const updatePart = (id: string, field: string, value: any) => {
      setParts(prev => prev.map(p => (p.id === id || p.temp_id === id) ? { ...p, [field]: value } : p));
    };
    
    const updateQuestion = (id: string, field: string, value: any) => {
      setQuestions(prev => prev.map(q => (q.id === id || q.temp_id === id) ? { ...q, [field]: value } : q));
    };

    const deleteQuestion = (id: string) => {
      const q = questions.find(q => q.id === id || q.temp_id === id);
      if (q && q.id && !q.id.toString().startsWith('temp-')) {
        setDeletedQuestionIds(prev => [...prev, q.id]);
      }
      setQuestions(prev => prev.filter(q => q.id !== id && q.temp_id !== id));
      toast.info("Question removed");
    };

    const deleteQuestionGroup = (groupId: string) => {
      const groupQs = questions.filter(q => q.group_id === groupId);
      const qIds = groupQs.map(q => q.id).filter(id => id && !id.toString().startsWith('temp-'));
      if (qIds.length > 0) {
        setDeletedQuestionIds(prev => [...prev, ...qIds]);
      }

      const updatedGroups = (currentPart?.question_groups || []).filter((g: any) => g.id !== groupId);
      updatePart(currentPart.id || currentPart.temp_id, "question_groups", updatedGroups);
      setQuestions(prev => prev.filter(q => q.group_id !== groupId));
      toast.info("Question group removed");
    };

    const handleSaveAll = async () => {
      setIsSaving(true);
      try {
        await onSave({ parts, questions, deletedPartIds, deletedQuestionIds });
        setDeletedPartIds([]);
        setDeletedQuestionIds([]);
        toast.success("Changes saved successfully");
      } catch (err) {
        toast.error("Failed to save changes");
      } finally {
        setIsSaving(false);
      }
    };

        const addQuestionGroup = (type: string) => {
          if (!currentPart) return;
          
          const groupId = `group-${Date.now()}`;
          const newGroup = {
            id: groupId,
            type: type,
            title: QUESTION_TYPES.find(t => t.id === type)?.label || "Question Group",
            instructions: getDefaultInstructions(type),
            matchingMode: (type === "matching_paragraph_info" || type === "matching_features" || type === "matching_sentence_endings") ? "dropdown" : undefined,
            groupText: type === "summary_completion" || type === "note_completion" || type === "sentence_completion" ? (type === "note_completion" ? "• Point 1 [[n1]]\n• Point 2 [[n2]]" : "Enter your text here...") : "",
            options: type === "matching_paragraph_info" || type === "matching_features" || type === "matching_sentence_endings" ? ["A", "B", "C", "D", "E", "F", "G"] : 
                     type === "matching_headings" ? [toRoman(1), toRoman(2), toRoman(3), toRoman(4), toRoman(5), toRoman(6), toRoman(7)] :
                     type === "true_false_ng" ? ["TRUE", "FALSE", "NOT GIVEN"] : [],
optionsTitle: type === "matching_features" ? "Sustainable features" : 
                             type === "matching_headings" ? "List of Headings" :
                             type === "matching_sentence_endings" ? "List of Endings" : "",
              headingAnswers: type === "matching_headings" ? {} : undefined,
              diagramTitle: type === "summary_completion" || type === "note_completion" || type === "sentence_completion" || type === "diagram_completion" || type === "flowchart_completion" ? "Enter Title" : "",
              diagramImage: "",
              tableHeaders: type === "table_completion" ? ["Column 1", "Column 2"] : ["Column 1", "Column 2"],
              tableRows: type === "table_completion" ? [["", ""]] : [["", ""]],
              tableColumnWidths: [150, 150],
              useTable: type === "table_completion",
              sections: [],
              labels: [],
                layout: type === "note_completion" ? "bullets" : type === "flowchart_completion" ? "type1" : "normal",
                flowchartData: type === "flowchart_completion" ? {
                  type: 'scientific',
                  steps: [
                    { id: `step-${Date.now()}-1`, text: "First step", type: 'step' },
                    { id: `step-${Date.now()}-2`, text: "Second step", type: 'step' }
                  ]
                } : undefined
              };

          
          const updatedPart = {
            ...currentPart,
            question_groups: [...(currentPart.question_groups || []), newGroup]
          };
          
          setParts(prev => prev.map(p => (p.id === currentPart.id || p.temp_id === currentPart.id) ? updatedPart : p));

          // If note_completion, proactively add the two initial questions
          if (type === "note_completion") {
            const partId = currentPart.id || currentPart.temp_id;
            const q1 = {
              temp_id: `temp-q-note-${Date.now()}-1`,
              part_id: partId,
              section_id: section.id,
              question_type: "note_completion",
              question_text: "Gap 1: [[n1]]",
              group_id: groupId,
              correct_answer: "",
              points: 1,
              order_index: questions.length + 1
            };
            const q2 = {
              temp_id: `temp-q-note-${Date.now()}-2`,
              part_id: partId,
              section_id: section.id,
              question_type: "note_completion",
              question_text: "Gap 2: [[n2]]",
              group_id: groupId,
              correct_answer: "",
              points: 1,
              order_index: questions.length + 2
            };
            setQuestions(prev => [...prev, q1, q2]);
          }

          setShowGroupModal(false);
          return;
        };
  
      const getDefaultInstructions = (type: string) => {
        switch(type) {
          case "true_false_ng": return "Do the following statements agree with the information given in the passage?";
          case "paragraph_matching": return "Look at the following findings and the list of places below. Match each finding with the correct place A-E.";
          case "sentence_completion": return "Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage for each answer.";
          case "multiple_choice": return "Choose the correct letter, A, B, C or D.";
          case "list_selection": return "Choose TWO letters, A-E.";
          case "matching_headings": return "Reading Passage has seven paragraphs, A-G. Choose the correct heading for each paragraph from the list of headings below.";
          case "matching_sentence_endings": return "Complete each sentence with the correct ending, A-G, below.";
            case "summary_completion": return "Complete the summary below. Choose ONE WORD AND/OR A NUMBER from the passage for each answer.";
            case "note_completion": return "Complete the notes below. Choose ONE WORD AND/OR A NUMBER from the passage for each answer.";
            case "matching_features": return "What did each of the following studies find?";
          case "table_completion": return "Complete the table below. Choose NO MORE THAN TWO WORDS from the passage for each answer.";
          case "diagram_completion": return "Label the diagram below. Choose NO MORE THAN TWO WORDS from the passage for each answer.";
          case "flowchart_completion": return "Complete the flow-chart below. Choose NO MORE THAN TWO WORDS from the passage for each answer.";
          case "choosing_a_title": return "Choose the best title for the passage.";
          default: return "Answer the following questions.";
        }
      };

    const updateQuestionGroup = (groupId: string, updates: Record<string, any>) => {
      if (!currentPart) return;
      const updatedGroups = (currentPart.question_groups || []).map((g: any) => 
        g.id === groupId ? { ...g, ...updates } : g
      );
      updatePart(currentPart.id || currentPart.temp_id, "question_groups", updatedGroups);
    };

    const addQuestionToGroup = (groupId: string, type: string, sectionIdx?: number) => {
      const newId = `temp-q-${Date.now()}`;
        const newQ = {
          id: newId,
          temp_id: newId,
          part_id: currentPart.id,
          temp_part_id: currentPart.id,
          section_id: section.id,
          question_type: type,
          question_text: "",
          group_id: groupId,
            sectionIndex: sectionIdx !== undefined ? sectionIdx : undefined,
            options: (type === "multiple_choice" || type === "list_selection" || 
                     type === "matching" || type === "matching_features" || 
                     type === "matching_paragraph_info" || type === "paragraph_matching" || 
                     type === "matching_headings" || type === "matching_sentence_endings" ||
                     type === "drag_drop_matching") 
                     ? (type === "multiple_choice" ? ["Option A", "Option B", "Option C", "Option D"] : ["Option A", "Option B", "Option C"]) : null,
          correct_answer: "",
          points: 1,
          order_index: questions.length + 1
        };
      setQuestions([...questions, newQ]);
      toast.success("Question added to group");
    };

    const bulkAddQuestions = () => {
        if (!bulkQuestionGroupId || !bulkQuestionText.trim()) return;
        
        const group = partGroups.find((g: any) => g.id === bulkQuestionGroupId);
        if (!group) return;

        const lines = bulkQuestionText.split("\n").filter(line => line.trim().length > 0);
        const newQuestions = lines.map((line, idx) => {
            const newId = `temp-q-bulk-${Date.now()}-${idx}`;
            return {
                id: newId,
                temp_id: newId,
                part_id: currentPart.id,
                temp_part_id: currentPart.id,
                section_id: section.id,
                question_type: group.type,
                question_text: line.trim(),
                group_id: bulkQuestionGroupId,
                options: (group.type === "matching" || group.type === "matching_features" || 
                         group.type === "matching_paragraph_info" || group.type === "paragraph_matching" || 
                         group.type === "matching_headings" || group.type === "matching_sentence_endings" ||
                         group.type === "drag_drop_matching") 
                         ? ["Option A", "Option B", "Option C"] : null,
                correct_answer: "",
                points: 1,
                order_index: questions.length + idx + 1
            };
        });

        setQuestions([...questions, ...newQuestions]);
        setBulkQuestionGroupId(null);
        setBulkQuestionText("");
        toast.success(`${newQuestions.length} questions added to group`);
    };

      const addSectionToGroup = (groupId: string) => {
        const group = partGroups.find((g: any) => g.id === groupId);
        if (!group) return;
        const newSection = { 
          id: `section-${Date.now()}`, 
          title: `Section ${(group.sections || []).length + 1}`,
          content: "" 
        };
        updateQuestionGroup(groupId, { sections: [...(group.sections || []), newSection] });
        toast.success("Section added");
      };


      const updateSection = (groupId: string, sectionIdx: number, field: string, value: any) => {
        const group = partGroups.find((g: any) => g.id === groupId);
        if (!group) return;
        const updatedSections = [...(group.sections || [])];
        updatedSections[sectionIdx] = { ...updatedSections[sectionIdx], [field]: value };
        updateQuestionGroup(groupId, { sections: updatedSections });
      };

      const insertGapToSectionContent = (groupId: string, sectionIdx: number) => {
        const group = partGroups.find((g: any) => g.id === groupId);
        if (!group) return;
        
        const section = group.sections[sectionIdx];
        const currentText = section.content || "";
        const textarea = document.querySelector(`textarea[data-section-idx="${groupId}-${sectionIdx}"]`) as HTMLTextAreaElement;
        let newText = currentText;
        let insertPos = currentText.length;

        if (textarea) {
          insertPos = textarea.selectionStart;
        }

        // Find all gaps across all sections in this group to get next number
        let allGaps: string[] = [];
        (group.sections || []).forEach((s: any) => {
          const matches = (s.content || "").match(/\[\[(\d+)\]\]/g);
          if (matches) allGaps.push(...matches);
        });

        const nextNum = allGaps.length > 0 
          ? Math.max(...allGaps.map(g => parseInt(g.match(/\d+/)?.[0] || "0"))) + 1 
          : 1;
        const gapTag = `[[${nextNum}]]`;
        
        newText = currentText.slice(0, insertPos) + gapTag + currentText.slice(insertPos);
        updateSection(groupId, sectionIdx, "content", newText);
        
        const newId = `temp-q-section-${Date.now()}`;
        const newQ = {
          id: newId,
          temp_id: newId,
          part_id: currentPart.id,
          temp_part_id: currentPart.id,
          section_id: section.id,
          question_type: group.type,
          question_text: `Gap ${nextNum} from section ${sectionIdx + 1}: ${gapTag}`,
          group_id: groupId,
          sectionIndex: sectionIdx,
          correct_answer: "",
          points: 1,
          order_index: questions.length + 1
        };
        setQuestions([...questions, newQ]);
        toast.success(`Gap ${nextNum} added to section content`);
      };


    const deleteSection = (groupId: string, sectionIdx: number) => {
      const group = partGroups.find((g: any) => g.id === groupId);
      if (!group || (group.sections || []).length <= 1) {
        toast.error("At least one section required");
        return;
      }
      const updatedSections = (group.sections || []).filter((_: any, i: number) => i !== sectionIdx);
      updateQuestionGroup(groupId, { sections: updatedSections });
      setQuestions(prev => prev.map(q => q.group_id === groupId && q.sectionIndex === sectionIdx ? { ...q, sectionIndex: 0 } : q));
      toast.info("Section removed");
    };

    const addTableColumn = (groupId: string, index?: number, position: 'left' | 'right' = 'right') => {
      const group = partGroups.find((g: any) => g.id === groupId);
      if (!group) return;
      
      const newHeaders = [...(group.tableHeaders || [])];
      const newWidths = [...(group.tableColumnWidths || newHeaders.map(() => 150))];
      
      let insertIndex = newHeaders.length;
      if (typeof index === 'number') {
        insertIndex = position === 'left' ? index : index + 1;
      }
      
      newHeaders.splice(insertIndex, 0, `Column ${newHeaders.length + 1}`);
      newWidths.splice(insertIndex, 0, 150);

      const newRows = (group.tableRows || []).map((row: string[]) => {
        const newRow = [...row];
        newRow.splice(insertIndex, 0, "");
        return newRow;
      });

      updateQuestionGroup(groupId, {
        tableHeaders: newHeaders,
        tableColumnWidths: newWidths,
        tableRows: newRows
      });
      toast.success("Column added");
    };

    const removeTableColumn = (groupId: string, colIdx: number) => {
      const group = partGroups.find((g: any) => g.id === groupId);
      if (!group || (group.tableHeaders || []).length <= 1) return;
      
      const newHeaders = group.tableHeaders.filter((_: any, i: number) => i !== colIdx);
      const newWidths = (group.tableColumnWidths || group.tableHeaders.map(() => 150)).filter((_: any, i: number) => i !== colIdx);
      const newRows = group.tableRows.map((row: string[]) => row.filter((_: any, i: number) => i !== colIdx));
      
      updateQuestionGroup(groupId, {
        tableHeaders: newHeaders,
        tableColumnWidths: newWidths,
        tableRows: newRows
      });
      toast.info("Column removed");
    };

    const addTableRow = (groupId: string, index?: number) => {
      const group = partGroups.find((g: any) => g.id === groupId);
      if (!group) return;
      const newRow = Array(group.tableHeaders.length).fill("");
      const newRows = [...(group.tableRows || [])];
      if (typeof index === 'number') {
        newRows.splice(index + 1, 0, newRow);
      } else {
        newRows.push(newRow);
      }
      updateQuestionGroup(groupId, { tableRows: newRows });
      toast.success("Row added");
    };

    const removeTableRow = (groupId: string, rowIdx: number) => {
      const group = partGroups.find((g: any) => g.id === groupId);
      if (!group || (group.tableRows || []).length <= 1) return;
      const newRows = group.tableRows.filter((_: any, i: number) => i !== rowIdx);
      updateQuestionGroup(groupId, { tableRows: newRows });
      toast.info("Row removed");
    };

    const updateTableCell = (groupId: string, rowIdx: number, colIdx: number, value: string) => {
      const group = partGroups.find((g: any) => g.id === groupId);
      if (!group) return;
      const newRows = [...group.tableRows];
      newRows[rowIdx] = [...newRows[rowIdx]];
      newRows[rowIdx][colIdx] = value;
      updateQuestionGroup(groupId, { tableRows: newRows });
    };

      const insertGapToTableCell = (groupId: string, rowIdx: number, colIdx: number) => {
        const group = partGroups.find((g: any) => g.id === groupId);
        if (!group) return;

        const currentText = group.tableRows[rowIdx][colIdx] || "";
        const textarea = document.querySelector(`textarea[data-cell="${groupId}-${rowIdx}-${colIdx}"]`) as HTMLTextAreaElement;
        let newText = currentText;
        let insertPos = currentText.length;

        if (textarea) {
          insertPos = textarea.selectionStart;
        }

        // Find all existing gaps across all cells in the table to get the next number (MAX + 1)
        const allGaps: string[] = [];
        group.tableRows.forEach((row: string[]) => {
          row.forEach((cell: string) => {
            const gaps = cell.match(/\[\[(\d+)\]\]/g);
            if (gaps) allGaps.push(...gaps);
          });
        });

        const nextNum = allGaps.length > 0 
          ? Math.max(...allGaps.map(g => parseInt(g.match(/\d+/)?.[0] || "0"))) + 1 
          : 1;
        const gapTag = `[[${nextNum}]]`;
        
        newText = currentText.slice(0, insertPos) + gapTag + currentText.slice(insertPos);
        updateTableCell(groupId, rowIdx, colIdx, newText);
        
        const newId = `temp-q-table-${Date.now()}`;
      const newQ = {
        id: newId,
        temp_id: newId,
        part_id: currentPart.id,
        temp_part_id: currentPart.id,
        section_id: section.id,
        question_type: "table_completion",
        question_text: `Gap ${nextNum} from table: ${gapTag}`,
        group_id: groupId,
        correct_answer: "",
        points: 1,
        order_index: questions.length + 1
      };
      setQuestions([...questions, newQ]);
      toast.success(`Gap ${nextNum} added to table cell`);
    };

    const handleMouseDown = (e: ReactMouseEvent) => {
      setIsDragging(true);
      e.preventDefault();
    };

    useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
          if (resizingCol) {
            const deltaX = e.clientX - resizingCol.startX;
            const newWidth = Math.max(50, resizingCol.startWidth + deltaX);
            
            setResizingCol(prev => prev ? { ...prev, currentDelta: deltaX } : null);

            const group = partGroups.find((g: any) => g.id === resizingCol.groupId);
            if (group) {
              const newWidths = [...(group.tableColumnWidths || group.tableHeaders.map(() => 150))];
              newWidths[resizingCol.colIdx] = newWidth;
              updateQuestionGroup(resizingCol.groupId, { tableColumnWidths: newWidths });
            }
            return;
          }

        if (!isDragging || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
        setLeftPanelWidth(Math.max(20, Math.min(80, newWidth)));
      };
      const handleMouseUp = () => {
        setIsDragging(false);
        setResizingCol(null);
      };
      if (isDragging || resizingCol) {
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
      }
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }, [isDragging, resizingCol, partGroups]);

    const insertImageToPassage = (imageUrl: string) => {
      const currentText = currentPart?.passage_text || "";
      const imageTag = `\n[IMAGE:${imageUrl}]\n`;
      updatePart(currentPart.id || currentPart.temp_id, "passage_text", currentText + imageTag);
      setShowImageModal(false);
      toast.success("Image added to passage");
    };

    const insertTableToPassage = (rows: number, cols: number) => {
      const currentText = currentPart?.passage_text || "";
      let tableMarkup = "\n[TABLE]\n";
      for (let r = 0; r < rows; r++) {
        const cells = [];
        for (let c = 0; c < cols; c++) {
          cells.push(r === 0 ? `Header ${c+1}` : `Cell ${r},${c+1}`);
        }
        tableMarkup += `| ${cells.join(" | ")} |\n`;
      }
      tableMarkup += "[/TABLE]\n";
      updatePart(currentPart.id || currentPart.temp_id, "passage_text", currentText + tableMarkup);
      setShowTableModal(false);
      toast.success("Table added to passage");
    };

      const insertGapToGroupText = (groupId: string, startNum: number = 1) => {
        const group = partGroups.find((g: any) => g.id === groupId || g.temp_id === groupId);
        if (!group) return;
        
        const currentText = group.groupText || "";
        const textarea = document.querySelector(`textarea[data-group-id="${groupId}"]`) as HTMLTextAreaElement;
        let newText = currentText;
        let insertPos = currentText.length;

        if (textarea) {
          insertPos = textarea.selectionStart;
        }

        const isNote = group.type === "note_completion";
        const existingGaps = currentText.match(isNote ? /\[\[n(\d+)\]\]/g : /\[\[(\d+)\]\]/g) || [];
        
        let nextNum = startNum;
        if (existingGaps.length > 0) {
          const maxGapNum = Math.max(...existingGaps.map(g => parseInt(g.match(/\d+/)?.[0] || "0")));
          nextNum = maxGapNum + 1;
        }
        
        const gapTag = isNote ? `[[n${nextNum}]]` : `[[${nextNum}]]`;
        
        newText = currentText.slice(0, insertPos) + gapTag + currentText.slice(insertPos);
        updateQuestionGroup(groupId, { groupText: newText });
        
        const newId = `temp-q-group-${Date.now()}`;
        const newQ = {
          id: newId,
          temp_id: newId,
          part_id: currentPart.id || currentPart.temp_id,
          temp_part_id: currentPart.id || currentPart.temp_id,
          section_id: section.id,
          question_type: group.type,
          question_text: isNote ? `Gap ${nextNum}: [[n${nextNum}]]` : `Gap ${nextNum}: ${gapTag}`,
          group_id: groupId,
          correct_answer: "",
          points: 1,
          order_index: questions.length + 1
        };
        setQuestions(prev => [...prev, newQ]);
        toast.success(`Gap ${nextNum} added to group text`);
      };

    const isSplitLayout = sectionType === "reading" || sectionType === "writing";

    const renderQuestionGroup = (group: any, groupIndex: number, startNum: number, endNum: number) => {
      const groupQuestions = questions.filter(q => q.group_id === group.id || q.group_id === group.temp_id);
        const isSummaryOrNote = group.type === "summary_completion" || group.type === "note_completion";
        const isSentenceCompletion = group.type === "sentence_completion";
        const isSummaryOrDragDrop = isSummaryOrNote || group.type === "drag_drop_matching" || isSentenceCompletion;
        
        const globalStartIdx = startNum - 1;
        const globalEndIdx = endNum;

                    const isNote = group.type === "note_completion";
                    const isTableGroup = group.type === "table_completion";
                    const isFlowChart = group.type === "flowchart_completion";
                    const isDiagram = group.type === "diagram_completion";
                    const isParagraphMatching = group.type === "paragraph_matching";
                    const isPassageBased = group.type === "sentence_completion_passage" || 
                                          group.type === "drag_drop_matching" || 
                                          group.type === "gap_fill" || 
                                          group.type === "summary_completion" || 
                                          group.type === "note_completion" || 
                                          group.type === "sentence_completion" ||
                                          group.type === "matching_headings" ||
                                          group.type === "paragraph_matching" ||
                                          group.type === "matching_features" ||
                                          group.type === "matching_sentence_endings" ||
                                          group.type === "matching" ||
                                          group.type === "flowchart_completion";

            const sections = group.sections || [];
            const showTableEditor = isTableGroup || (isPassageBased && group.useTable);
            const hasSections = false; // Flowcharts now use groupText for better design consistency



        return (
          <div key={group.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className={cn("p-3 border-b border-gray-100 flex items-center justify-between", theme.lightBg)}>
              <div className="flex items-center gap-2">
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-xs", themeBg)}>
                  {QUESTION_TYPES.find(t => t.id === group.type)?.icon || "?"}
                </div>
                      <div className="flex flex-col items-center flex-1 pr-12">
                        {globalEndIdx >= startNum ? (
                          <h3 className="font-black text-[12px] uppercase tracking-widest text-gray-800 border-b-2 border-gray-100 pb-1 px-4">
                            Questions {startNum}{endNum > startNum ? `-${endNum}` : ""}
                          </h3>
                        ) : (
                          <h3 className="font-black text-[12px] uppercase tracking-widest text-red-400 border-b-2 border-gray-100 pb-1 px-4">
                            Add Questions
                          </h3>
                        )}
                        {group.type !== "table_completion" && (
                          <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter mt-1">{group.title}</span>
                        )}
                      </div>
              </div>
                  <div className="flex items-center gap-1.5">
                    {(group.type === "matching_features" || group.type === "matching_sentence_endings" || group.type === "sentence_completion" || group.type === "matching") && group.type !== "paragraph_matching" && group.type !== "summary_completion" && (
                          <div className="flex bg-white rounded-lg border border-gray-200 p-0.5 mr-2 shadow-sm">
                      <button 
                        onClick={() => updateQuestionGroup(group.id, { matchingMode: 'dropdown' })}
                        className={cn("px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all", (group.matchingMode === 'dropdown' || !group.matchingMode) ? "bg-[#0072bc] text-white shadow-md" : "text-gray-400 hover:text-gray-600")}
                      >
                        Dropdown
                      </button>
                      <button 
                        onClick={() => updateQuestionGroup(group.id, { matchingMode: 'drag_drop' })}
                        className={cn("px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all", group.matchingMode === 'drag_drop' ? "bg-[#0072bc] text-white shadow-md" : "text-gray-400 hover:text-gray-600")}
                      >
                        Drag & Drop
                      </button>
                      <button 
                        onClick={() => updateQuestionGroup(group.id, { matchingMode: 'radio_grid' })}
                        className={cn("px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all", group.matchingMode === 'radio_grid' ? "bg-[#0072bc] text-white shadow-md" : "text-gray-400 hover:text-gray-600")}
                      >
                        Radio Grid
                      </button>
                    </div>
                  )}





                      {group.type === "matching_headings" && (
                          <button 
                            onClick={() => insertHeadingGapToPassage(group.id || group.temp_id)}

                          className={cn("px-2 py-1 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-1 bg-white border border-blue-200 text-blue-600 shadow-sm hover:bg-blue-50")}
                        >
                          <Plus size={10} /> INSERT HEADING GAP
                        </button>
                      )}
                          {isPassageBased && group.type !== "matching_headings" && group.type !== "paragraph_matching" && group.type !== "multiple_choice" && group.type !== "summary_completion" && group.type !== "diagram_completion" && (
                            <button 
                              onClick={() => updateQuestionGroup(group.id, { useTable: !group.useTable })}
                              className={cn("px-2 py-1 rounded-lg text-[8px] font-black uppercase transition-all flex items-center gap-1", 
                                         group.useTable ? "bg-white text-black shadow-sm" : "bg-black/5 text-gray-400")}
                            >
                              <TableIcon size={10} /> {group.useTable ? "Table Mode" : "Switch to Table"}
                            </button>
                          )}
                    {showTableEditor && (
                      <>
                        <button 
                          onClick={() => addTableRow(group.id)}
                          className={cn("px-2 py-1 rounded-lg transition-colors text-[9px] font-black flex items-center gap-1", theme.lightBg, "hover:bg-opacity-80")}
                        >
                          ADD ROW
                        </button>
                        <button 
                          onClick={() => addTableColumn(group.id)}
                          className={cn("px-2 py-1 rounded-lg transition-colors text-[9px] font-black flex items-center gap-1", theme.lightBg, "hover:bg-opacity-80")}
                        >
                          ADD COLUMN
                        </button>
                      </>
                    )}
                    {hasSections && (
                      <button 
                        onClick={() => addSectionToGroup(group.id)}
                        className={cn("px-2 py-1 rounded-lg transition-colors text-[9px] font-black flex items-center gap-1", theme.lightBg, "hover:bg-opacity-80")}
                      >
                        ADD SECTION
                      </button>
                    )}
                        {!isSummaryOrDragDrop && !isTableGroup && group.type !== "matching_headings" && group.type !== "paragraph_matching" && (
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => addQuestionToGroup(group.id, group.type)}
                              className={cn("px-2 py-1 rounded-lg transition-colors text-[9px] font-black flex items-center gap-1", theme.lightBg, "hover:bg-opacity-80")}
                            >
                              <Plus size={10} /> ADD
                            </button>
                            {group.type !== "multiple_choice" && (
                              <button 
                                onClick={() => setBulkQuestionGroupId(group.id)}
                                className={cn("px-2 py-1 rounded-lg transition-colors text-[9px] font-black flex items-center gap-1 bg-gray-100 text-gray-500 hover:bg-gray-200")}
                              >
                                <List size={10} /> BULK
                              </button>
                            )}
                          </div>
                        )}

                  <button 
                    onClick={() => deleteQuestionGroup(group.id)}
                    className="p-1 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
                    title="Delete group"
                  >
                    <Trash2 size={12} />
                  </button>
            </div>
          </div>

            <div className="p-2 border-b border-gray-100 bg-gray-50/50">
                <Label className="text-[7px] font-black uppercase text-gray-400 tracking-widest mb-1 block">Instructions</Label>
                  <Textarea 
                    value={group.instructions}
                    onChange={(e) => updateQuestionGroup(group.id, { instructions: e.target.value })}
                    className="w-full h-8 border-none bg-transparent text-[11px] italic text-gray-600 font-medium resize-none focus:ring-0 p-0 text-center"
                    placeholder="Enter instructions..."
                  />
              </div>

                {group.type === "paragraph_matching" && (
                  <div className="p-6 bg-[#f0f4f8] border-b border-gray-200">
                    <div className="max-w-md mx-auto bg-white p-6 rounded-xl border border-blue-100 shadow-sm relative overflow-hidden group/box">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                        <Input 
                          value={group.optionsTitle || "List of Options"}
                          onChange={(e) => updateQuestionGroup(group.id, { optionsTitle: e.target.value })}
                          className="font-black text-sm uppercase tracking-widest text-gray-700 mb-4 text-center border-none bg-white focus:ring-1 focus:ring-blue-100 h-8"
                          placeholder="Box Heading (e.g. List of Options)..."
                        />
                        <div className="space-y-3">
                        {(group.options || []).map((opt: string, idx: number) => (
                          <div key={idx} className="flex gap-3 items-center group/opt">
                            <div className="h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm">
                              {String.fromCharCode(65 + idx)}
                            </div>
                            <Input 
                              value={opt}
                              onChange={(e) => {
                                const newOpts = [...group.options];
                                newOpts[idx] = e.target.value;
                                updateQuestionGroup(group.id, { options: newOpts });
                              }}
                              className="h-8 border-none bg-white font-bold text-xs focus:ring-1 focus:ring-blue-100 px-2 rounded-lg"
                              placeholder={`Option ${String.fromCharCode(65 + idx)}...`}
                            />
                            <button 
                              onClick={() => {
                                const newOpts = group.options.filter((_: any, i: number) => i !== idx);
                                updateQuestionGroup(group.id, { options: newOpts });
                              }}
                              className="opacity-0 group-hover/opt:opacity-100 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                        <button 
                          onClick={() => updateQuestionGroup(group.id, { options: [...(group.options || []), ""] })}
                          className="w-full py-2 border border-dashed border-blue-200 rounded-lg text-[9px] font-black text-blue-500 uppercase tracking-widest hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                        >
                          <Plus size={12} /> Add New Option
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                                  {!isDiagram && !isTableGroup && (
                                    <div className="p-4 border-b border-gray-100 bg-emerald-50/20">

                                    {isFlowChart ? (
                                      <FlowchartVisualEditor 
                                        group={group}
                                        updateQuestionGroup={updateQuestionGroup}
                                        groupQuestions={groupQuestions}
                                        deleteQuestion={deleteQuestion}
                                        updateQuestion={updateQuestion}
                                        addQuestionToGroup={addQuestionToGroup}
                                        theme={theme}
                                        globalStartIdx={globalStartIdx}
                                        getGlobalIdx={getGlobalIdx}
                                        currentPart={currentPart}
                                        section={section}
                                        questions={questions}
                                        setQuestions={setQuestions}
                                      />
                                    ) : group.type === "matching_sentence_endings" ? (
                                      <MatchingSentenceEndingsVisualEditor 
                                        group={group}
                                        updateQuestionGroup={updateQuestionGroup}
                                        groupQuestions={groupQuestions}
                                        deleteQuestion={deleteQuestion}
                                        updateQuestion={updateQuestion}
                                        addQuestionToGroup={addQuestionToGroup}
                                        theme={theme}
                                        getGlobalIdx={getGlobalIdx}
                                      />
                                    ) : group.type === "matching_features" ? (
                                      <MatchingFeaturesVisualEditor 
                                        group={group}
                                        updateQuestionGroup={updateQuestionGroup}
                                        groupQuestions={groupQuestions}
                                        deleteQuestion={deleteQuestion}
                                        updateQuestion={updateQuestion}
                                        addQuestionToGroup={addQuestionToGroup}
                                        theme={theme}
                                        getGlobalIdx={getGlobalIdx}
                                      />
                                    ) : (
                                      <>

                                    {isNote && (
                                      <div className="mb-4">
                                        <Label className="text-[10px] font-black uppercase text-emerald-800 tracking-widest mb-1 block">Notes Title</Label>
                                        <Input 
                                          value={group.diagramTitle || ""}
                                          onChange={(e) => updateQuestionGroup(group.id, { diagramTitle: e.target.value })}
                                          className="w-full border-gray-200 bg-white rounded-lg h-9 text-sm font-bold shadow-sm"
                                          placeholder="Enter notes title..."
                                        />
                                      </div>
                                    )}

                                        <div className="flex items-center justify-between mb-2">
                                        <Label className="text-[10px] font-black uppercase text-emerald-800 tracking-widest">
                                          {isNote ? "Notes Content (• for bullets)" : "Content"}
                                        </Label>
                                        <div className="flex items-center gap-2">
                                          <button 
                                            onClick={() => insertGapToGroupText(group.id, startNum)}
                                            className="text-[10px] font-black text-white bg-emerald-600 px-4 py-1.5 rounded-lg hover:bg-emerald-700 flex items-center gap-2 shadow-sm transition-all active:scale-95"
                                          >
                                            <Plus size={14} /> INSERT GAP
                                          </button>
                                        </div>
                                      </div>

                                      <Textarea 
                                        value={group.groupText || ""}
                                        data-group-id={group.id}
                                        onKeyDown={(e) => isNote ? handleNoteKeyDown(e, group.id) : null}
                                        onChange={(e) => updateQuestionGroup(group.id, { groupText: e.target.value })}
                                        className="w-full min-h-[150px] border-gray-200 bg-white rounded-xl p-4 text-sm font-medium leading-relaxed shadow-inner"
                                        placeholder="Type content here..."
                                        />
                                    </>
                                  )}
                                </div>
                              )}




                      {showTableEditor && (
                        <div className="p-6 bg-white border-b border-gray-100">
                             <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white shadow-md relative group/table no-scrollbar min-h-[350px] pt-12 px-12 pb-12">
                                <table className="w-full border-collapse border-hidden table-fixed">
                                  <thead>
                                      <tr className="bg-gray-100">
                                        {(group.tableHeaders || []).map((header: string, colIdx: number) => {
                                          const widths = group.tableColumnWidths || (group.tableHeaders || []).map(() => 150);
                                          const width = widths[colIdx] || 150;
                                          return (
                                              <th 
                                                key={`header-${colIdx}`} 
                                                className="p-0 border border-gray-300 relative group/header bg-gray-100"
                                                style={{ width: `${width}px` }}
                                              >
                                                {/* Column Management Group (More Visible) */}
                                                <div className="absolute -top-10 left-0 right-0 flex justify-center gap-1 opacity-0 group-hover/header:opacity-100 transition-all z-50">
                                                  <button 
                                                    onClick={() => addTableColumn(group.id, colIdx, 'left')}
                                                    className="bg-blue-600 text-white w-7 h-7 rounded-lg shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center group/btn border border-white"
                                                    title="Add column to the left"
                                                  >
                                                    <Plus size={14} />
                                                    <span className="absolute -bottom-7 bg-black text-white text-[8px] px-1.5 py-0.5 rounded opacity-0 group-hover/btn:opacity-100 whitespace-nowrap pointer-events-none font-black uppercase">Add Left</span>
                                                  </button>
                                                  <button 
                                                    onClick={() => removeTableColumn(group.id, colIdx)} 
                                                    className="bg-red-600 text-white w-7 h-7 rounded-lg shadow-xl hover:bg-red-700 transition-all flex items-center justify-center group/btn border border-white"
                                                    title="Delete Column"
                                                  >
                                                    <Trash2 size={14} />
                                                    <span className="absolute -bottom-7 bg-black text-white text-[8px] px-1.5 py-0.5 rounded opacity-0 group-hover/btn:opacity-100 whitespace-nowrap pointer-events-none font-black uppercase">Delete</span>
                                                  </button>
                                                  <button 
                                                    onClick={() => addTableColumn(group.id, colIdx, 'right')}
                                                    className="bg-blue-600 text-white w-7 h-7 rounded-lg shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center group/btn border border-white"
                                                    title="Add column to the right"
                                                  >
                                                    <Plus size={14} />
                                                    <span className="absolute -bottom-7 bg-black text-white text-[8px] px-1.5 py-0.5 rounded opacity-0 group-hover/btn:opacity-100 whitespace-nowrap pointer-events-none font-black uppercase">Add Right</span>
                                                  </button>
                                                </div>

                                                <div className="p-3 min-h-[60px] flex items-center justify-center relative">
                                                  <input 
                                                    value={header}
                                                    onChange={(e) => {
                                                      const newHeaders = [...group.tableHeaders];
                                                      newHeaders[colIdx] = e.target.value;
                                                      updateQuestionGroup(group.id, { tableHeaders: newHeaders });
                                                    }}
                                                    className="w-full bg-transparent border-none font-black text-[11px] text-center outline-none focus:ring-0 placeholder:text-gray-400 uppercase tracking-tighter"
                                                    placeholder="Header..."
                                                  />
                                                </div>


                                              {/* Column Resize Handle */}
                                              <div 
                                                className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-500 transition-colors z-30"
                                                onMouseDown={(e) => {
                                                  setResizingCol({
                                                    groupId: group.id,
                                                    colIdx,
                                                    startX: e.clientX,
                                                    startWidth: width,
                                                    currentDelta: 0
                                                  });
                                                  e.preventDefault();
                                                }}
                                              />
                                            </th>
                                        );
                                      })}
                                    </tr>
                                </thead>
                                <tbody>
                                  {(group.tableRows || []).map((row: string[], rowIdx: number) => (
                                    <tr key={`row-${rowIdx}`} className="group/row">
                                      {row.map((cell: string, colIdx: number) => {
                                        const widths = group.tableColumnWidths || (group.tableHeaders || []).map(() => 150);
                                        const width = widths[colIdx] || 150;
                                        return (
                                          <td 
                                            key={`cell-${rowIdx}-${colIdx}`} 
                                            className="p-0 border border-gray-100 align-top relative group/cell hover:bg-blue-50/10 transition-colors"
                                            style={{ width: `${width}px` }}
                                          >
                                            <Textarea 
                                              data-cell={`${group.id}-${rowIdx}-${colIdx}`}
                                              value={cell}
                                              onChange={(e) => updateTableCell(group.id, rowIdx, colIdx, e.target.value)}
                                              className="w-full min-h-[80px] border-none bg-transparent text-[12px] font-semibold resize-none focus:ring-0 p-4 leading-relaxed"
                                              placeholder="..."
                                            />
                                            <div className="absolute top-2 right-2 opacity-0 group-hover/cell:opacity-100 transition-opacity z-10">
                                              <button 
                                                onClick={() => insertGapToTableCell(group.id, rowIdx, colIdx)}
                                                className="bg-blue-600 text-white p-1.5 rounded-lg shadow-lg hover:scale-110 transition-all"
                                                title="Insert Gap"
                                              >
                                                <Plus size={14} />
                                              </button>
                                            </div>
                                          </td>
                                        );
                                      })}
                                      
                                        {/* Row Actions */}
                                        <td className="w-0 p-0 relative border-none">
                                           {/* Handy Add Row Handle */}
                                           <div className="absolute -left-10 bottom-0 translate-y-1/2 w-40 flex justify-center opacity-0 group-hover/row:opacity-100 transition-all z-40 pointer-events-none">
                                             <button 
                                               onClick={() => addTableRow(group.id, rowIdx)}
                                               className="bg-blue-600 text-white rounded-full px-4 py-2 shadow-xl hover:bg-blue-700 hover:scale-110 transition-all text-[10px] font-black pointer-events-auto flex items-center gap-1"
                                               title="Add row below"
                                             >
                                               <Plus size={12} /> ADD ROW
                                             </button>
                                           </div>
                                           
                                           {/* Delete Row Button */}
                                           <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover/row:opacity-100 transition-all z-20">
                                                  <button 
                                                    onClick={() => removeTableRow(group.id, rowIdx)} 
                                                    className="bg-red-600 hover:bg-red-700 hover:scale-105 transition-all text-[9px] font-black whitespace-nowrap flex items-center gap-1 text-white p-1 rounded"
                                                    title="Delete row"
                                                  >
                                                    <Trash2 size={10} /> DELETE ROW
                                                  </button>
                                           </div>
                                        </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                           </div>
                           <button 
                              onClick={() => addTableRow(group.id)}
                              className="mt-4 w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-[12px] font-black text-gray-400 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-3 uppercase tracking-widest"
                            >
                              <Plus size={18} /> Append New Row
                            </button>

                            {/* Table Answer Key Section */}
                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
                                        <CheckCircle2 size={18} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black uppercase tracking-tight">Table Answer Key</h4>
                                        <p className="text-[10px] text-gray-500 font-bold">Write the correct answers for each gap in the table</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {groupQuestions.map((q, idx) => (
                                        <div key={q.id || q.temp_id} className="flex items-center gap-3 bg-gray-50/50 p-3 rounded-2xl border border-gray-100 group/ans hover:border-green-200 transition-all">
                                            <div className="w-7 h-7 rounded-lg bg-green-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm">
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1">
                                                <Label className="text-[8px] font-black uppercase text-gray-400 mb-1 block">Correct Answer</Label>
                                                <Input 
                                                    value={q.correct_answer}
                                                    onChange={(e) => updateQuestion(q.id || q.temp_id, "correct_answer", e.target.value)}
                                                    className="h-8 text-[11px] font-bold border-gray-200 rounded-xl focus:ring-green-500 focus:border-green-500"
                                                    placeholder="Enter answer..."
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    {groupQuestions.length === 0 && (
                                        <div className="col-span-full py-8 text-center border-2 border-dashed border-gray-100 rounded-2xl">
                                            <p className="text-xs text-gray-400 font-bold">No gaps created yet. Click the + button in table cells to add gaps.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                      )}





                            {group.type === "diagram_completion" && (
                              <DiagramVisualEditor 
                                group={group}
                                updateQuestionGroup={updateQuestionGroup}
                                groupQuestions={groupQuestions}
                                deleteQuestion={deleteQuestion}
                                updateQuestion={updateQuestion}
                                theme={theme}
                                getGlobalIdx={getGlobalIdx}
                                setQuestions={setQuestions}
                                currentPart={currentPart}
                                section={section}
                                startNum={startNum}
                              />
                            )}


                      {isFlowChart && (
                        <div className="p-6 space-y-4 bg-white">
                          <div className="flex items-center justify-center gap-4">
                            <div className="flex bg-gray-100 rounded-xl p-1">
                              <button 
                                onClick={() => updateQuestionGroup(group.id, { layout: 'type1' })}
                                className={cn("px-5 py-2 rounded-lg text-[10px] font-black uppercase transition-all", (group.layout === 'type1' || !group.layout) ? "bg-white text-gray-800 shadow-sm" : "text-gray-400 hover:text-gray-600")}
                              >
                                Type 1 (Rounded)
                              </button>
                              <button 
                                onClick={() => updateQuestionGroup(group.id, { layout: 'type2' })}
                                className={cn("px-5 py-2 rounded-lg text-[10px] font-black uppercase transition-all", group.layout === 'type2' ? "bg-white text-gray-800 shadow-sm" : "text-gray-400 hover:text-gray-600")}
                              >
                                Type 2 (Bordered)
                              </button>
                            </div>
                          </div>
                        </div>
                      )}


                    {group.type === "matching_headings" && (
                      <div className="p-6 bg-white border-b border-gray-100">
                        <div className="space-y-6">
                          {/* List of Headings Editor */}
                          <div className="p-6 bg-blue-50/30 border border-blue-100 rounded-2xl">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h4 className="font-black text-sm text-blue-900 uppercase tracking-widest">{group.optionsTitle || "List of Headings"}</h4>
                                <p className="text-[10px] text-blue-600 font-bold mt-1">These headings will be draggable in the student preview</p>
                              </div>
                              <button 
                                onClick={() => {
                                  const opts = [...(group.options || [])];
                                  opts.push(toRoman(opts.length + 1));
                                  updateQuestionGroup(group.id, { options: opts });
                                }}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[9px] font-black flex items-center gap-1.5 hover:bg-blue-700 shadow-sm"
                              >
                                <Plus size={12} /> ADD HEADING
                              </button>
                            </div>
                            <div className="space-y-2">
                              {(group.options || []).map((opt: string, idx: number) => (
                                <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-blue-100 shadow-sm group/opt">
                                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black shrink-0 shadow-sm">
                                    {toRoman(idx + 1)}
                                  </div>
                                  <Input 
                                    value={opt}
                                    onChange={(e) => {
                                      const newOpts = [...(group.options || [])];
                                      newOpts[idx] = e.target.value;
                                      updateQuestionGroup(group.id, { options: newOpts });
                                    }}
                                    className="flex-1 h-9 border-gray-200 rounded-lg text-sm font-medium"
                                    placeholder={`Heading ${toRoman(idx + 1)} text...`}
                                  />
                                  <button 
                                    onClick={() => {
                                      const newOpts = (group.options || []).filter((_: any, i: number) => i !== idx);
                                      updateQuestionGroup(group.id, { options: newOpts });
                                    }}
                                    className="p-1.5 hover:bg-red-50 rounded-lg text-gray-300 hover:text-red-500 opacity-0 group-hover/opt:opacity-100 transition-all"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                          <div className="p-2.5 space-y-2">
                            {group.type === "paragraph_matching" ? (
                              <div className="space-y-1">
                                {groupQuestions.map((q, idx) => (
                                  <div key={q.id || q.temp_id} className="flex items-start gap-3 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm group/pm-q hover:border-blue-200 transition-all">
                                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-md">
                                      {startNum + idx}
                                    </div>
                                    <div className="flex-1 space-y-3">
                                      <Textarea 
                                        value={q.question_text}
                                        onChange={(e) => updateQuestion(q.id || q.temp_id, "question_text", e.target.value)}
                                        className="w-full border border-gray-100 bg-white font-bold text-sm min-h-[44px] resize-none focus:ring-1 focus:ring-blue-100 p-3 rounded-xl text-gray-800 leading-tight shadow-sm"
                                        placeholder="Enter statement/finding here..."
                                      />
                                      <div className="flex items-center gap-3 pt-2 border-t border-gray-50">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Correct Option:</span>
                                        <div className="flex flex-wrap gap-1">
                                          {(group.options || []).map((_, oIdx) => {
                                            const label = String.fromCharCode(65 + oIdx);
                                            const isCorrect = q.correct_answer === label;
                                            return (
                                              <button
                                                key={oIdx}
                                                onClick={() => updateQuestion(q.id || q.temp_id, "correct_answer", label)}
                                                className={cn(
                                                  "w-7 h-7 rounded-lg text-[10px] font-black transition-all border",
                                                  isCorrect ? "bg-blue-600 text-white border-blue-600 shadow-md scale-110" : "bg-gray-50 text-gray-400 border-gray-100 hover:border-blue-300 hover:text-blue-500"
                                                )}
                                              >
                                                {label}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </div>
                                    <button onClick={() => deleteQuestion(q.id || q.temp_id)} className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover/pm-q:opacity-100 transition-all">
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                ))}
                              <button 
                                onClick={() => addQuestionToGroup(group.id, "paragraph_matching")}
                                className="w-full py-3 mt-4 border-2 border-dashed border-gray-100 rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-widest hover:border-blue-200 hover:text-blue-500 hover:bg-blue-50/30 transition-all flex items-center justify-center gap-2"
                              >
                                <Plus size={14} /> Add New Statement
                              </button>
                            </div>
                          ) : !isFlowChart && !showTableEditor && !isDiagram && group.type !== "matching_headings" && group.type !== "note_completion" && group.type !== "summary_completion" ? (
                            groupQuestions.map((q, idx) => renderQuestionEditor(q, globalStartIdx + idx, group))
                          ) : null}
                        </div>
              </div>
            );
          };


    const renderQuestionEditor = (q: any, globalIdx: number, group: any) => {
      const showGapButton = group.type === "gap_fill" || group.type === "sentence_completion_passage" || group.type === "flow_chart" || group.type === "short_answer";
      
      return (
        <div key={q.id || q.temp_id} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100 group/q">
          <div className={cn("w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5 shadow-sm bg-[#d32f2f] text-white")}>
            {globalIdx + 1}
          </div>
          
          {group.type === "multiple_choice" ? (

              <div className="space-y-4 w-full">
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                   <Label className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2 block">Question Text</Label>
                   <Textarea 
                     value={q.question_text}
                     onChange={(e) => updateQuestion(q.id || q.temp_id, "question_text", e.target.value)}
                     className="w-full border-none bg-white font-bold text-sm min-h-[60px] resize-none focus:ring-1 focus:ring-blue-100 p-3 rounded-xl text-gray-800 leading-tight shadow-inner"
                     placeholder="Enter MCQ question text here..."
                   />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(q.options || ["Option A", "Option B", "Option C", "Option D"]).map((opt: string, oIdx: number) => {
                    const label = String.fromCharCode(65 + oIdx);
                    const isCorrect = q.correct_answer === label;
                    return (
                      <div key={oIdx} className={cn(
                        "flex items-center gap-3 p-3 rounded-2xl border transition-all group/opt relative",
                        isCorrect ? "bg-green-50 border-green-200 shadow-sm" : "bg-white border-gray-100 hover:border-blue-200"
                      )}>
                        <button 
                          onClick={() => updateQuestion(q.id || q.temp_id, "correct_answer", label)}
                          className={cn(
                            "w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-black shrink-0 transition-all",
                            isCorrect ? "bg-green-600 text-white border-green-600 shadow-md scale-110" : "bg-gray-100 text-gray-400 border-gray-200 hover:bg-blue-100 hover:text-blue-600 hover:border-blue-300"
                          )}
                        >
                          {label}
                        </button>
                        <Input 
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...(q.options || [])];
                            newOpts[oIdx] = e.target.value;
                            updateQuestion(q.id || q.temp_id, "options", newOpts);
                          }}
                          className="h-9 text-xs font-bold border-none bg-transparent flex-1 focus:ring-0 p-0"
                          placeholder={`Option ${label}...`}
                        />
                        <button 
                          onClick={() => {
                            const newOpts = (q.options || []).filter((_: any, i: number) => i !== oIdx);
                            updateQuestion(q.id || q.temp_id, "options", newOpts);
                          }}
                          className="opacity-0 group-hover/opt:opacity-100 p-1.5 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                        {isCorrect && (
                           <div className="absolute -top-2 -right-2 bg-green-600 text-white rounded-full p-1 shadow-md">
                             <CheckCircle2 size={10} />
                           </div>
                        )}
                      </div>
                    );
                  })}
                  <button 
                    onClick={() => {
                      const newOpts = [...(q.options || [])];
                      newOpts.push(`Option ${String.fromCharCode(65 + newOpts.length)}`);
                      updateQuestion(q.id || q.temp_id, "options", newOpts);
                    }}
                    className="flex items-center justify-center gap-2 p-3 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-all text-[10px] font-black uppercase tracking-widest"
                  >
                    <Plus size={14} /> Add Option
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 space-y-1.5">
                <div className="relative">
                  <Textarea 
                    value={q.question_text}
                    onChange={(e) => updateQuestion(q.id || q.temp_id, "question_text", e.target.value)}
                    className="w-full border-none bg-transparent font-medium text-xs min-h-[28px] resize-none focus:ring-0 p-0 pr-16"
                    placeholder={getPlaceholderForType(group.type)}
                  />
                  {showGapButton && (
                    <button 
                      onClick={() => addGap(q.id || q.temp_id)}
                      className="absolute right-0 top-0 text-[8px] font-black bg-white border border-gray-200 px-1.5 py-0.5 rounded-md hover:bg-gray-50 shadow-sm flex items-center gap-0.5 transition-all"
                    >
                      GAP
                    </button>
                  )}
                </div>
                
                {group.type === "true_false_ng" && (
                  <div className="flex gap-1.5">
                    {["TRUE", "FALSE", "NG"].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => updateQuestion(q.id || q.temp_id, "correct_answer", opt === "NG" ? "not-given" : opt.toLowerCase())}
                        className={cn(
                          "text-[8px] font-black px-2 py-1 rounded-md border transition-all",
                          (q.correct_answer === opt.toLowerCase() || (opt === "NG" && q.correct_answer === "not-given"))
                            ? "bg-green-500 text-white border-green-500" 
                            : "bg-white text-gray-400 border-gray-200 hover:border-green-300"
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                      {(group.type === "paragraph_matching" || group.type === "matching" || group.type === "matching_features" || group.type === "drag_drop_matching" || group.type === "matching_headings" || group.type === "matching_sentence_endings" || group.type === "matching_paragraph_info") && (
                        <div className="flex flex-col gap-2 bg-white/50 p-2 rounded-lg border border-gray-100">
                          <Label className="text-[8px] font-black uppercase text-gray-400">Correct Answer Selection:</Label>
                            <div className="flex flex-wrap gap-1">
                              {(group.options || ["A", "B", "C", "D", "E", "F", "G"]).map((opt: string, oIdx: number) => {
                                const label = group.type === "matching_headings" ? toRoman(oIdx + 1) : String.fromCharCode(65 + oIdx);
                                const isCorrect = q.correct_answer === label;
                                const displayText = group.type === "matching_headings" ? `${label} - ${opt}` : opt;
                                return (
                                  <button
                                    key={oIdx}
                                    onClick={() => updateQuestion(q.id || q.temp_id, "correct_answer", label)}
                                    className={cn(
                                      "min-h-[28px] px-2 text-[10px] font-bold rounded-md border transition-all flex items-center gap-2 shadow-sm",
                                      isCorrect 
                                        ? "bg-green-600 text-white border-green-700 ring-2 ring-green-100" 
                                        : "bg-white text-gray-600 border-gray-200 hover:border-green-400 hover:bg-green-50"
                                    )}
                                    title={opt}
                                  >
                                    <span className={cn("w-4 h-4 rounded flex items-center justify-center text-[9px] font-black", isCorrect ? "bg-white/20" : "bg-gray-100")}>
                                      {group.type === "matching_headings" ? oIdx + 1 : label}
                                    </span>
                                    <span className="max-w-[150px] truncate">{displayText}</span>
                                  </button>
                                );
                              })}
                            </div>
                          {q.correct_answer && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">Selected:</span>
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold border border-green-200">
                                {(() => {
                                  if (group.type === "matching_headings") {
                                    const selectedIndex = (group.options || []).findIndex((_: any, idx: number) => toRoman(idx + 1) === q.correct_answer);
                                    const headingText = selectedIndex >= 0 ? group.options?.[selectedIndex] : "Unknown";
                                    const displayIndex = selectedIndex >= 0 ? selectedIndex + 1 : "?";
                                    return `${displayIndex} (${q.correct_answer}) - ${headingText}`;
                                  }
                                  const selectedIndex = q.correct_answer ? q.correct_answer.charCodeAt(0) - 65 : -1;
                                  return `${q.correct_answer} - ${group.options?.[selectedIndex] || "Unknown"}`;
                                })()}
                              </span>
                            </div>
                          )}
                        </div>
                      )}


                {(group.type === "gap_fill" || group.type === "sentence_completion_passage" || group.type === "flow_chart" || group.type === "short_answer") && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] font-black text-gray-400 uppercase">Ans:</span>
                    <Input 
                      value={q.correct_answer}
                      onChange={(e) => updateQuestion(q.id || q.temp_id, "correct_answer", e.target.value)}
                      className="h-6 text-[10px] border-gray-200 rounded-md flex-1 max-w-[160px] font-bold"
                      placeholder="Answer(s) (use / for mult)..."
                    />
                  </div>
                )}
              </div>
            )}

          <button onClick={() => deleteQuestion(q.id || q.temp_id)} className="p-1 hover:bg-red-50 rounded text-gray-300 hover:text-red-500 opacity-0 group-hover/q:opacity-100 transition-opacity">
            <Trash2 size={12} />
          </button>
        </div>
      );
    };

    const getPlaceholderForType = (type: string) => {
      switch(type) {
        case "flow_chart": return "e.g., he left __________ for financial reasons";
        case "true_false_ng": return "e.g., The public today has a positive view of frozen foods.";
        case "paragraph_matching": return "e.g., An explanation of the neurological process";
        case "gap_fill": return "e.g., It appears that placebos can treat or reduce the __________ of conditions.";
        case "sentence_completion_passage": return "e.g., Enter sentence text with __________ for blanks";
        case "matching": return "e.g., When did Francis Ronalds achieve a satisfactory result?";
        case "drag_drop_matching": return "e.g., Match the event to the correct person";
        default: return "Enter question text...";
      }
    };

    const ungroupedQuestions = partQuestions.filter(q => !q.group_id);

    return (
      <div className="fixed inset-0 z-[100] bg-white flex flex-col font-sans select-none text-[#333] text-sm" ref={containerRef}>
        <header className="bg-white border-b border-gray-200 px-4 py-1.5 sticky top-0 z-50 shadow-sm shrink-0">
          <div className="w-full flex items-center justify-between h-10">
            <div className="flex items-center space-x-6 flex-1 justify-start min-w-0">
              <h1 className={cn("font-bold text-2xl tracking-wide whitespace-nowrap", themeText)}>IELTS</h1>
              <div className="h-5 w-px bg-gray-200" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none">Visual Editor</span>
                <span className="text-xs font-bold truncate max-w-[200px]">{testTitle}</span>
              </div>
            </div>

            <div className="flex-1 flex justify-center px-2">
              <div className="bg-gray-100 p-0.5 rounded-lg flex items-center shadow-inner">
                <button 
                  onClick={() => setActiveTab("edit")}
                  className={cn(
                    "px-6 py-1.5 rounded-md text-[10px] font-black transition-all flex items-center gap-2",
                    activeTab === "edit" ? cn(themeBg, "text-white shadow-md") : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  <Settings size={14} /> EDIT
                </button>
                <button 
                  onClick={() => setActiveTab("preview")}
                  className={cn(
                    "px-6 py-1.5 rounded-md text-[10px] font-black transition-all flex items-center gap-2",
                    activeTab === "preview" ? cn(themeBg, "text-white shadow-md") : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  <Eye size={14} /> PREVIEW
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-3 flex-1 justify-end min-w-0">
              <Button 
                onClick={handleSaveAll} 
                disabled={isSaving}
                size="sm"
                className={cn("text-white gap-2 font-black px-6 rounded-lg h-9 shadow-md transition-all active:scale-95", themeBg)}
              >
                {isSaving ? "SAVING..." : <><Save size={16} /> SAVE CHANGES</>}
              </Button>
              <button onClick={onExit} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><LogOut className="w-5 h-5" /></button>
            </div>
          </div>
        </header>

        {activeTab === "edit" && (
          <div className="h-9 bg-[#f8f9fa] border-b border-gray-200 flex items-center px-4 shrink-0 gap-4 overflow-x-auto no-scrollbar shadow-inner">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mr-1">Parts:</span>
              <div className="flex items-center gap-1">
                {parts.map((p, idx) => (
                  <div key={p.id || p.temp_id} className="flex items-center group/p relative">
                    <button
                      onClick={() => setCurrentPartIndex(idx)}
                      className={cn(
                        "h-6 px-3 rounded-md text-[9px] font-black uppercase tracking-wider transition-all border flex items-center gap-1.5",
                        currentPartIndex === idx ? cn("bg-white text-[#222] shadow-sm", themeBorder) : "bg-gray-100 border-transparent text-gray-500"
                      )}
                    >
                      PART {p.part_number}
                    </button>
                    <button onClick={() => deletePart(idx)} className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white opacity-0 group-hover/p:opacity-100 flex items-center justify-center hover:bg-red-600 shadow-lg z-10"><Trash2 size={8} /></button>
                  </div>
                ))}
                <button onClick={addPart} className={cn("w-6 h-6 rounded-md text-white flex items-center justify-center shadow-md", themeBg)}><Plus size={12} /></button>
              </div>
            </div>
            <div className="h-4 w-px bg-gray-200 shrink-0" />
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowGroupModal(true)} className="h-6 text-[8px] bg-white gap-1 font-black py-0 px-2 rounded-md">
                <Layers size={10} /> ADD GROUP
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowImageModal(true)} className="h-6 text-[8px] bg-white gap-1 font-black py-0 px-2 rounded-md">
                <ImageIcon size={10} /> IMAGE
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowTableModal(true)} className="h-6 text-[8px] bg-white gap-1 font-black py-0 px-2 rounded-md">
                <TableIcon size={10} /> TABLE
              </Button>
            </div>
          </div>
)}

              <main className="flex-1 flex relative overflow-hidden bg-[#f0f2f5]">
                  {activeTab === "preview" ? (
                    <PreviewMode 
                      currentPart={currentPart}
                      partGroups={partGroups}
                      questions={questions}
                      sortedQuestions={sortedQuestions}
                      questionOffset={questionOffset}
                      currentPartIndex={currentPartIndex}
                      setCurrentPartIndex={setCurrentPartIndex}
                      parts={parts}
                      theme={theme}
                      toRoman={toRoman}
                      onBackToEdit={() => setActiveTab("edit")}
                    />
                ) : sectionType === 'writing' ? (
                  <WritingVisualEditor
                    currentPart={currentPart}
                    updatePart={updatePart}
                    theme={theme}
                  />
                ) : isSplitLayout ? (

            <>
              <div className="overflow-auto border-r border-gray-200 bg-white h-full shadow-lg z-10" style={{ width: `${leftPanelWidth}%` }}>
                  <div className="p-4 max-w-4xl mx-auto space-y-4">
                      <div className={cn("p-3 rounded-xl border flex flex-col gap-1", theme.lightBg, theme.lightBorder)}>
                        <div className="flex items-center justify-between">
                          <Label className={cn("text-[9px] font-black uppercase tracking-widest", themeText)}>Part {currentPart?.part_number} Heading</Label>
                        </div>
                        <input 
                          type="text" 
                          value={currentPart?.title || ""} 
                          onChange={(e) => updatePart(currentPart.id || currentPart.temp_id, "title", e.target.value)}
                          className="text-xl font-black w-full outline-none bg-transparent placeholder:text-gray-300 py-0.5"
                          placeholder="Passage Title..."
                        />
                      </div>
                <PassageEditor 
                  content={currentPart?.passage_text || ""}
                  onChange={(html) => updatePart(currentPart.id || currentPart.temp_id, "passage_text", html)}
                  onInsertGap={insertGapToPassage}
                  headingOptions={matchingHeadingsOptions}
                  placeholder="Type or paste passage content..."
                  className="flex-1"
                />


                  </div>
              </div>
              <div onMouseDown={handleMouseDown} className="w-1 bg-gray-200 hover:bg-[#0072bc] cursor-col-resize flex-shrink-0 z-20" />
              <div className="overflow-auto flex-1 bg-[#f8f9fa] h-full relative">
                {resizingCol && (
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-[100] pointer-events-none"
                    style={{ left: `${(resizingCol.startX - containerRef.current!.getBoundingClientRect().left) + (resizingCol.currentDelta || 0)}px` }}
                  />
                )}
                    <div className="p-4 max-w-6xl mx-auto space-y-4">
                        {(() => {
                          let currentNum = 0;
                          // Calculate total questions in all parts before the current one
                          for (let i = 0; i < currentPartIndex; i++) {
                            const p = parts[i];
                            const pQs = questions.filter(q => q.part_id === p.id || q.part_id === p.temp_id || q.temp_part_id === p.id || q.temp_part_id === p.temp_id);
                            currentNum += pQs.length;
                          }

                          return partGroups.map((group: any, idx: number) => {
                            const groupQs = questions.filter(q => q.group_id === (group.id || group.temp_id));
                            const startNum = currentNum + 1;
                            currentNum += groupQs.length;
                            const endNum = currentNum;
                            return renderQuestionGroup(group, idx, startNum, endNum > startNum ? endNum : startNum);
                          });
                        })()}

                    {ungroupedQuestions.length > 0 && (
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                      <h3 className="font-black text-[10px] uppercase tracking-wide mb-3 text-gray-500">Ungrouped Questions</h3>
                      <div className="space-y-2">
                        {ungroupedQuestions.map((q, idx) => renderQuestionEditor(q, idx, { type: 'short_answer' }))}
                      </div>
                    </div>
                  )}
                  <Button onClick={() => setShowGroupModal(true)} className={cn("w-full h-10 border-2 border-dashed bg-white rounded-xl font-black gap-2 shadow-sm text-xs hover:bg-opacity-5", themeText, themeBorder)}>
                    <Layers size={16} /> ADD QUESTION GROUP
                  </Button>
                </div>
              </div>
            </>
              ) : (
                <div className="flex-1 overflow-auto bg-[#f8f9fa] p-3">
                  <div className="max-w-4xl mx-auto space-y-3">
                    <div className={cn("p-3 rounded-xl text-white shadow-md flex items-center justify-between", themeBg)}>
                    <h2 className="text-base font-black uppercase">Listening Editor</h2>
                    <AudioLines className="h-4 w-4" />
                  </div>
                    <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm space-y-3">
                      <Input value={currentPart?.audio_url || ""} onChange={(e) => updatePart(currentPart.id || currentPart.temp_id, "audio_url", e.target.value)} placeholder="Audio URL" className="h-8 border-gray-100 rounded-lg bg-gray-50/50 text-[11px]" />
                      <Textarea value={currentPart?.instructions || ""} onChange={(e) => updatePart(currentPart.id || currentPart.temp_id, "instructions", e.target.value)} className="w-full h-14 border-gray-100 rounded-lg bg-gray-50/30 text-[11px]" placeholder="Instructions..." />
                    </div>
                      {(() => {
                        let currentNum = 0;
                        // Calculate total questions in all parts before the current one
                        for (let i = 0; i < currentPartIndex; i++) {
                          const p = parts[i];
                          const pQs = questions.filter(q => q.part_id === p.id || q.part_id === p.temp_id || q.temp_part_id === p.id || q.temp_part_id === p.temp_id);
                          currentNum += pQs.length;
                        }

                        return partGroups.map((group: any, idx: number) => {
                          const groupQs = questions.filter(q => q.group_id === group.id || q.group_id === group.temp_id);
                          const startNum = currentNum + 1;
                          currentNum += groupQs.length;
                          const endNum = currentNum;
                          return renderQuestionGroup(group, idx, startNum, endNum);
                        });
                      })()}
                    <Button onClick={() => setShowGroupModal(true)} className={cn("w-full h-10 border-2 border-dashed bg-white rounded-xl font-black text-[10px] gap-2 shadow-sm", themeText, themeBorder)}><Layers size={16} /> ADD QUESTION GROUP</Button>
                </div>
              </div>
            )}
        </main>

        <footer className="bg-[#f8f9fa] border-t border-gray-200 h-10 shrink-0 shadow-lg z-[100]">
          <div className="flex justify-between items-center px-4 h-full gap-4">
            <div className="flex items-center h-full">
              {parts.map((p, idx) => (
                <button key={p.id || p.temp_id} onClick={() => setCurrentPartIndex(idx)} className={cn("h-full px-4 text-[9px] font-black uppercase tracking-widest border-t-2", currentPartIndex === idx ? cn(themeBorder, themeText, "bg-white") : "border-transparent text-gray-400")}>
                  Part {p.part_number}
                </button>
              ))}
            </div>
            <div className="flex-1 flex justify-center gap-1 overflow-x-auto no-scrollbar">
              {partQuestions.map((q, idx) => {
                const qId = q.id || q.temp_id;
                const globalNum = getGlobalIdx(qId) + 1;
                return (
                  <div key={idx} className={cn("min-w-[20px] h-5 rounded-md text-[8px] font-black flex items-center justify-center border-b-2", q.correct_answer ? "bg-[#222] border-black text-white" : "bg-white border-gray-200 text-gray-400")}>
                    {globalNum > 0 ? globalNum : idx + 1}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-2">
              {currentPartIndex < parts.length - 1 ? (
                <button onClick={() => setCurrentPartIndex(prev => prev + 1)} className={cn("text-white px-4 py-1 font-black h-7 text-[9px] rounded-lg shadow-md uppercase", themeBg)}>NEXT</button>
              ) : (
                <button onClick={handleSaveAll} className="bg-[#222] text-white px-4 py-1 font-black h-7 text-[9px] rounded-lg shadow-md uppercase">SAVE</button>
              )}
            </div>
          </div>
        </footer>

        {showGroupModal && (
          <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden">
              <div className={cn("p-6 text-white flex justify-between items-center", themeBg)}>
                <h3 className="text-2xl font-black">Add Question Group</h3>
                <Button variant="ghost" onClick={() => setShowGroupModal(false)} className="text-white hover:bg-white/10 h-10 w-10 rounded-full"><LogOut size={20} /></Button>
              </div>
              <div className="p-6 grid grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto">
                {QUESTION_TYPES.map((type) => (
                  <button key={type.id} onClick={() => addQuestionGroup(type.id)} className="p-4 rounded-2xl border-2 border-gray-100 hover:border-[#0072bc] text-left hover:shadow-lg transition-all">
                    <div className="text-3xl mb-2">{type.icon}</div>
                    <h4 className="font-black text-sm">{type.label}</h4>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {showImageModal && (
          <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-6 space-y-4">
              <h3 className="text-xl font-black">Insert Image</h3>
              <Input id="image-url-input" placeholder="https://example.com/image.png" className="h-12 border-gray-200 rounded-xl" />
              <Button onClick={() => { const val = (document.getElementById('image-url-input') as HTMLInputElement)?.value; if(val) insertImageToPassage(val); }} className="w-full h-12 bg-green-600 hover:bg-green-700 rounded-xl font-black">INSERT</Button>
              <Button variant="ghost" onClick={() => setShowImageModal(false)} className="w-full">CANCEL</Button>
            </div>
          </div>
        )}

          {showTableModal && (
            <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-6 space-y-4">
                <h3 className="text-xl font-black">Insert Table</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Input id="table-rows" type="number" defaultValue={3} className="h-12 rounded-xl" />
                  <Input id="table-cols" type="number" defaultValue={3} className="h-12 rounded-xl" />
                </div>
                <Button onClick={() => { const r = parseInt((document.getElementById('table-rows') as HTMLInputElement)?.value); const c = parseInt((document.getElementById('table-cols') as HTMLInputElement)?.value); insertTableToPassage(r, c); }} className="w-full h-12 bg-purple-600 hover:bg-purple-700 rounded-xl font-black">INSERT</Button>
                <Button variant="ghost" onClick={() => setShowTableModal(false)} className="w-full">CANCEL</Button>
              </div>
            </div>
          )}

          {bulkQuestionGroupId && (
            <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black">Bulk Add Questions</h3>
                  <button onClick={() => setBulkQuestionGroupId(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><Trash2 className="w-5 h-5" /></button>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-gray-400 tracking-widest">Questions (One per line)</Label>
                  <Textarea 
                    value={bulkQuestionText}
                    onChange={(e) => setBulkQuestionText(e.target.value)}
                    className="w-full min-h-[300px] border-2 border-gray-100 rounded-2xl p-4 font-bold text-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter each question on a new line..."
                  />
                </div>
                <div className="flex gap-4">
                  <Button onClick={bulkAddQuestions} className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 rounded-2xl font-black text-white shadow-xl">
                    ADD {bulkQuestionText.split('\n').filter(l => l.trim()).length} QUESTIONS
                  </Button>
                  <Button variant="ghost" onClick={() => setBulkQuestionGroupId(null)} className="h-14 px-8 font-bold">CANCEL</Button>
                </div>
              </div>
            </div>
          )}

      </div>
    );
}
