"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Volume2,
  Wifi,
  Bell,
  Menu,
  HighlighterIcon,
  X,
  Check,
  ChevronDown,
  ArrowDown,
  AlertTriangle,
  Play,
  Pause
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FlowchartRenderer } from "@/components/FlowchartRenderer";
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

interface IDPExamInterfaceProps {
  testTitle: string;
  sectionType: string;
  parts: any[];
  questions: any[];
  timeLeft: number;
  answers: Record<string, any>;
  onAnswerChange: (questionId: string, answer: any) => void;
  onFinish: () => void;
  onExit: () => void;
}

export default function IDPExamInterface({
  testTitle,
  sectionType,
  parts,
  questions,
  timeLeft,
  answers,
  onAnswerChange,
  onFinish,
  onExit
}: IDPExamInterfaceProps) {
  const [currentPartIndex, setCurrentPartIndex] = useState(0);
  const [leftPanelWidth, setLeftPanelWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [highlights, setHighlights] = useState<{text: string, color: string}[]>([]);
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [highlightPosition, setHighlightPosition] = useState({x: 0, y: 0});
  const [selectedText, setSelectedText] = useState("");
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState<{text: string, note: string}[]>([]);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const passageRef = useRef<HTMLDivElement>(null);
  
  const currentPart = parts[currentPartIndex];
  const partQuestions = questions.filter(q => q.part_id === currentPart?.id);
  const partGroups = currentPart?.question_groups || [];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftPanelWidth(Math.max(25, Math.min(75, newWidth)));
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectedText(selection.toString().trim());
      setHighlightPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      });
      setShowHighlightMenu(true);
    } else {
      setShowHighlightMenu(false);
    }
  }, []);

  const applyHighlight = (color: string) => {
    if (selectedText) {
      if (color === 'clear') {
        setHighlights(prev => prev.filter(h => h.text !== selectedText));
        setNotes(prev => prev.filter(n => n.text !== selectedText));
      } else {
        setHighlights(prev => [...prev, { text: selectedText, color }]);
      }
      setShowHighlightMenu(false);
      window.getSelection()?.removeAllRanges();
    }
  };

  const handleAddNote = () => {
    setShowHighlightMenu(false);
    setShowNoteDialog(true);
  };

  const saveNote = () => {
    if (selectedText && noteText) {
      setNotes(prev => [...prev, { text: selectedText, note: noteText }]);
      setNoteText("");
      setShowNoteDialog(false);
      window.getSelection()?.removeAllRanges();
    }
  };

  const renderPassageWithHighlights = (text: string) => {
    if (!text) return text;
    let result = text;
    
    const sortedHighlights = [...highlights].sort((a, b) => b.text.length - a.text.length);
    sortedHighlights.forEach((h) => {
      const regex = new RegExp(`(${h.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      result = result.replace(regex, `<mark class="highlight-${h.color}">$1</mark>`);
    });

    notes.forEach((n, idx) => {
      const regex = new RegExp(`(${n.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      result = result.replace(regex, `<span class="note-target group relative border-b-2 border-dashed border-blue-400">$1<span class="note-tooltip invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-black text-white text-[11px] font-medium rounded-lg shadow-2xl z-50 leading-relaxed border border-white/10">${n.note}</span></span>`);
    });
    
    return result;
  };

  const renderPassageContent = (text: string) => {
    if (!text) return null;
    
    let processedText = renderPassageWithHighlights(text);
    
    processedText = processedText.replace(/\[H(\d+)\]/g, (match, num) => {
      const q = questions.find(q => q.question_type === 'matching_headings' && q.question_text.includes(`[H${num}]`));
      if (q) {
        const val = answers[q.id] || "";
        return `<span class="inline-flex items-center mx-1"><span class="w-8 h-8 flex items-center justify-center bg-gray-100 border-2 border-blue-200 rounded-md font-black text-blue-600 text-xs shadow-sm">${val || num}</span></span>`;
      }
      return `<span class="inline-flex items-center mx-1"><span class="w-8 h-8 flex items-center justify-center bg-gray-100 border border-gray-300 rounded-md font-bold text-gray-400 text-xs">${num}</span></span>`;
    });

    processedText = processedText.replace(/\[\[(\d+)\]\]/g, (match, num) => {
      const q = questions.find(q => q.question_type === 'gap_fill' && q.question_text.includes(`[[${num}]]`));
      if (q) {
        const val = answers[q.id] || "";
        return `<span class="inline-flex items-center mx-1"><span class="px-2 min-w-[32px] h-8 flex items-center justify-center bg-white border-2 border-red-200 rounded-md font-black text-red-600 text-xs shadow-sm">${val || num}</span></span>`;
      }
      return `<span class="inline-flex items-center mx-1"><span class="px-2 min-w-[32px] h-8 flex items-center justify-center bg-gray-50 border border-gray-300 rounded-md font-bold text-gray-400 text-xs">${num}</span></span>`;
    });
    
    processedText = processedText.replace(/\[TABLE\]([\s\S]*?)\[\/TABLE\]/g, (match, tableContent) => {
      const rows = tableContent.trim().split('\n').filter((r: string) => r.trim());
      let tableHtml = '<table class="my-6 w-full border-collapse border border-gray-300 text-[15px] font-medium">';
      rows.forEach((row: string, idx: number) => {
        const cells = row.split('|').filter((c: string) => c.trim());
        const tag = idx === 0 ? 'th' : 'td';
        const bgClass = idx === 0 ? 'bg-gray-100 font-black text-gray-700' : 'text-gray-600';
        tableHtml += '<tr>';
        cells.forEach((cell: string) => {
          tableHtml += `<${tag} class="border border-gray-300 px-4 py-3 ${bgClass}">${cell.trim()}</${tag}>`;
        });
        tableHtml += '</tr>';
      });
      tableHtml += '</table>';
      return tableHtml;
    });
    
    return processedText;
  };

  const isAnswered = (questionId: string) => {
    const ans = answers[questionId];
    return ans !== undefined && ans !== "" && ans !== null;
  };

  const scrollToQuestion = (id: string) => {
    const el = document.getElementById(`q-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const isSplitLayout = sectionType === "reading" || sectionType === "writing";

  const getQuestionRange = (partIndex: number) => {
    const part = parts[partIndex];
    if (!part) return 1;
    const previousParts = parts.slice(0, partIndex).map(p => p.id);
    const questionsBefore = questions.filter(q => previousParts.includes(q.part_id)).length;
    return questionsBefore + 1;
  };

  const partStartNum = getQuestionRange(currentPartIndex);
  const qStart = partStartNum;
  const qEnd = partStartNum + partQuestions.length - 1;

  const getGroupQuestions = (groupId: string) => {
    return questions.filter(q => q.group_id === groupId);
  };

  const getGlobalIdx = (qId: string) => {
    return questions.findIndex(q => q.id === qId) + 1;
  };

  const renderTableCompletion = (group: any, groupStartIdx: number) => {
    const groupQuestions = getGroupQuestions(group.id);
    const headers = group.tableHeaders || [];
    const rows = group.tableRows || [];

    return (
      <div key={group.id} className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <h3 className="font-bold text-lg text-[#222]">Questions {groupStartIdx + 1}–{groupStartIdx + groupQuestions.length}</h3>
          <div className="h-px flex-1 bg-gray-200" />
        </div>
        
        <p className="text-[15px] font-bold text-gray-700 mb-6">{group.instructions}</p>
        
        <div className="overflow-x-auto rounded-xl border-2 border-gray-200 shadow-sm bg-white">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                {headers.map((header: string, i: number) => (
                  <th key={i} className="border border-gray-200 px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-gray-600">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row: string[], rIdx: number) => (
                <tr key={rIdx} className="hover:bg-gray-50/50 transition-colors">
                  {row.map((cell: string, cIdx: number) => (
                    <td key={cIdx} className="border border-gray-200 px-6 py-5 text-[15px] leading-relaxed text-gray-800 align-top">
                        {cell.split(/(\[\[H?\d+\]\])/g).map((item, i) => {
                          const match = item.match(/\[\[(H?\d+)\]\]/);
                          if (match) {
                            const placeholderTag = match[0];
                            const q = groupQuestions.find(q => q.question_text.includes(placeholderTag));
                            if (q) {
                              const displayNum = getGlobalIdx(q.id);
                              return (
                                <span key={i} className="inline-flex items-center gap-2 mx-2">
                                  <span className="text-[15px] font-black text-blue-600">{displayNum}</span>
                                  <input 
                                    type="text"
                                    className="w-28 h-10 px-3 border-b-2 border-t-0 border-l-0 border-r-0 border-gray-300 bg-transparent focus:border-blue-600 outline-none text-center font-bold transition-all"
                                    value={answers[q.id] || ""}
                                    onChange={(e) => onAnswerChange(q.id, e.target.value)}
                                    placeholder="........"
                                  />
                                </span>
                              );
                            }
                          }
                          return <span key={i}>{item}</span>;
                        })}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderQuestionGroup = (group: any, groupStartIdx: number) => {
    if (group.useTable || group.type === "table_completion") {
      return renderTableCompletion(group, groupStartIdx);
    }

    const element = (() => {
      switch(group.type) {
        case "flow_chart":
        case "flowchart_completion":
          return (
            <FlowchartRenderer
              group={group}
              groupQs={getGroupQuestions(group.id)}
              answers={answers}
              onAnswerChange={onAnswerChange}
            />
          );
        case "sentence_completion_passage":
        case "gap_fill":
        case "summary_completion":
          const groupQs = getGroupQuestions(group.id);
          return (
            <div key={group.id} className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <h3 className="font-bold text-lg text-[#222]">Questions {groupStartIdx + 1}–{groupStartIdx + groupQs.length}</h3>
                <div className="h-px flex-1 bg-gray-200" />
              </div>
              <p className="text-[15px] font-bold text-gray-700 mb-6">{group.instructions}</p>
              <div className="p-10 bg-white border border-gray-200 rounded-[2rem] shadow-sm leading-relaxed text-[16px] text-gray-800 font-medium space-y-4">
                {group.groupText?.split('\n').map((para: string, pIdx: number) => (
                  <p key={pIdx} className="mb-4">
                    {para.split(/(\[\[H?\d+\]\])/g).map((item, i) => {
                      const match = item.match(/\[\[(H?\d+)\]\]/);
                      if (match) {
                        const placeholderTag = match[0];
                        const q = groupQs.find(q => q.question_text.includes(placeholderTag));
                        if (q) {
                          const displayNum = getGlobalIdx(q.id);
                          return (
                            <span key={i} className="inline-flex items-center mx-2 relative group/input">
                              <span className="text-[15px] font-black text-red-600 mr-1">{displayNum}</span>
                              <input 
                                type="text"
                                className="w-32 h-10 px-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-red-500 bg-white text-center font-bold transition-all shadow-sm"
                                value={answers[q.id] || ""}
                                onChange={(e) => onAnswerChange(q.id, e.target.value)}
                                placeholder=""
                              />
                            </span>
                          );
                        }
                      }
                      return <span key={i}>{item}</span>;
                    })}
                  </p>
                ))}
              </div>
            </div>
          );
        case "multiple_choice":
          const mcQs = getGroupQuestions(group.id);
          return (
            <div key={group.id} className="mb-12">
              <h3 className="font-bold text-lg mb-6">Questions {groupStartIdx + 1}–{groupStartIdx + mcQs.length}</h3>
              <p className="text-[15px] font-bold text-gray-700 mb-8">{group.instructions}</p>
              <div className="space-y-10">
                {mcQs.map((q: any, idx: number) => (
                  <div key={q.id} id={`q-${q.id}`}>
                    <div className="flex items-start gap-4 mb-6">
                      <span className="w-9 h-9 bg-red-600 text-white rounded-full flex items-center justify-center font-black text-sm shrink-0 shadow-lg shadow-red-900/20">
                        {groupStartIdx + idx + 1}
                      </span>
                      <p className="text-[16px] font-bold text-gray-800 pt-1.5">{q.question_text}</p>
                    </div>
                    <div className="space-y-3 ml-13">
                      {(q.options || []).map((opt: string, oIdx: number) => (
                        <label 
                          key={oIdx}
                          className={cn(
                            "flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all border-2",
                            answers[q.id] === opt 
                              ? "border-blue-600 bg-blue-50 shadow-md shadow-blue-100" 
                              : "border-gray-100 hover:border-gray-200 hover:bg-white"
                          )}
                        >
                          <div className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                            answers[q.id] === opt ? "border-blue-600 bg-blue-600" : "border-gray-300"
                          )}>
                            {answers[q.id] === opt && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                          </div>
                          <input 
                            type="radio" 
                            name={`q-${q.id}`} 
                            value={opt}
                            checked={answers[q.id] === opt}
                            onChange={() => onAnswerChange(q.id, opt)}
                            className="sr-only"
                          />
                          <span className="font-black text-gray-400 mr-2">{String.fromCharCode(65 + oIdx)}</span>
                          <span className="text-[15px] font-medium text-gray-700">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        default:
          const shortQs = getGroupQuestions(group.id);
          return (
            <div key={group.id} className="mb-12">
              <h3 className="font-bold text-lg mb-6">Questions {groupStartIdx + 1}–{groupStartIdx + shortQs.length}</h3>
              <p className="text-[15px] font-bold text-gray-700 mb-8">{group.instructions}</p>
              <div className="space-y-8">
                {shortQs.map((q: any, idx: number) => (
                  <div key={q.id} id={`q-${q.id}`} className="flex items-start gap-4">
                    <span className="w-9 h-9 bg-red-600 text-white rounded-full flex items-center justify-center font-black text-sm shrink-0 shadow-lg shadow-red-900/20">
                      {groupStartIdx + idx + 1}
                    </span>
                    <div className="flex-1 pt-1.5">
                      <p className="text-[16px] font-bold text-gray-800 mb-4">{q.question_text}</p>
                      <input 
                        type="text"
                        className="w-full max-w-lg h-12 px-5 border-2 border-gray-200 rounded-xl text-[15px] font-bold focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50/50 bg-white transition-all shadow-sm"
                        value={answers[q.id] || ""}
                        onChange={(e) => onAnswerChange(q.id, e.target.value)}
                        placeholder="Type your answer here..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
      }
    })();

    return (
      <div key={group.id} className="mb-12">
        {group.groupText && group.type !== "summary_completion" && group.type !== "sentence_completion_passage" && (
          <div className="text-[15px] leading-relaxed text-gray-700 font-medium bg-white/50 p-6 rounded-2xl border border-gray-100 italic mb-10 shadow-sm">
            {group.groupText}
          </div>
        )}
        {element}
      </div>
    );
  };

  let runningQuestionIdx = qStart - 1;

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col font-outfit text-gray-900" ref={containerRef}>
      {/* Header redesigned based on HTML */}
      <header className="bg-white border-b border-gray-200 px-6 py-1 sticky top-0 z-50 shadow-sm">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center space-x-8 flex-1 justify-start min-w-0">
            <div className="flex items-center gap-2 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#74b602] text-white font-black text-2xl">I</div>
              <span className="text-2xl font-black tracking-tighter hidden sm:block">
                ielts<span className="text-[#74b602]">practice</span>bd
              </span>
            </div>
            <div className="h-8 w-px bg-gray-200 hidden sm:block" />
            <span className="text-gray-500 text-sm font-medium whitespace-nowrap hidden sm:block">Test taker ID</span>
          </div>

          <div className="flex-1 flex justify-center px-4">
            <span className="text-sm text-[#74b602] font-black uppercase tracking-widest hidden md:block">ieltspracticebd</span>
          </div>

          <div className="flex items-center space-x-3 flex-1 justify-end min-w-0">
            <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1 rounded-lg whitespace-nowrap border border-gray-100 shadow-sm">
              <Clock className="w-4 h-4 text-gray-500" />
              <div className="flex items-center space-x-1">
                <button className="text-sm font-mono font-black text-gray-700 hover:text-gray-900 cursor-pointer transition-colors">
                  {formatTime(timeLeft)}
                </button>
                <button 
                  onClick={() => setIsTimerPaused(!isTimerPaused)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                >
                  {isTimerPaused ? <Play className="w-3 h-3 text-gray-500" /> : <Pause className="w-3 h-3 text-gray-500" />}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><Wifi className="w-5 h-5 text-gray-500" /></button>
              <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><Bell className="w-5 h-5 text-gray-500" /></button>
              <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" onClick={onExit}><LogOut className="w-5 h-5 text-gray-500" /></button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        {isSplitLayout ? (
          <>
            <div 
              id="left-panel"
              className="h-full overflow-y-auto bg-white border-r border-gray-100"
              style={{ width: `${leftPanelWidth}%` }}
            >
              <div className="p-6 md:p-10 max-w-4xl mx-auto">
                <div className="bg-gray-50 p-6 rounded-xl mb-10 border border-gray-100 shadow-sm">
                  <h2 className="font-black text-lg text-gray-900 mb-2 uppercase tracking-tight">Part {currentPartIndex + 1}</h2>
                  <p className="text-sm text-gray-600 font-medium leading-relaxed">
                    You should spend about 20 minutes on Questions {qStart}-{qEnd} which are based on Reading Passage {currentPartIndex + 1}.
                  </p>
                </div>

                <div className="mb-10">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase leading-tight max-w-2xl">
                      {currentPart?.title || "READING PASSAGE"}
                    </h3>
                    <div className="flex items-center space-x-2 text-[10px] font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-full border border-blue-100 uppercase tracking-widest shadow-sm">
                      <HighlighterIcon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Select text to highlight</span>
                    </div>
                  </div>

                  <div 
                    ref={passageRef}
                    className="text-[18px] leading-[1.8] text-gray-800 space-y-8 select-text passage-container font-medium text-justify"
                    onMouseUp={handleTextSelection}
                    dangerouslySetInnerHTML={{ 
                      __html: currentPart?.passage_text?.split('\n').map((para: string) => 
                        `<p className="mb-8">${renderPassageContent(para)}</p>`
                      ).join('') || ''
                    }}
                  />
                </div>
              </div>
            </div>

            <div 
              onMouseDown={handleMouseDown}
              className="w-1.5 bg-gray-200 hover:bg-[#74b602] cursor-col-resize transition-all shrink-0 z-20 flex items-center justify-center group"
            >
              <div className="w-1 h-12 bg-gray-400 rounded-full group-hover:bg-white transition-colors" />
            </div>

              {/* Right Panel */}
              <div className="flex-1 h-full overflow-y-auto bg-white" onMouseUp={handleTextSelection}>
              <div className="p-6 md:p-10 min-h-full">
                {partGroups.length > 0 ? (
                  partGroups.map((group: any) => {
                    const groupQuestions = getGroupQuestions(group.id);
                    const element = renderQuestionGroup(group, runningQuestionIdx);
                    runningQuestionIdx += groupQuestions.length;
                    return element;
                  })
                ) : (
                  <div className="space-y-8">
                    {partQuestions.map((q: any, idx: number) => (
                      <div key={q.id} id={`q-${q.id}`} className="flex items-start gap-5 p-7 bg-gray-50/50 rounded-2xl border border-gray-100 shadow-sm hover:bg-white hover:border-[#74b602]/30 transition-all">
                        <span className="w-9 h-9 bg-[#74b602] text-white rounded-full flex items-center justify-center font-black text-sm shrink-0 shadow-lg shadow-[#74b602]/20">
                          {qStart + idx}
                        </span>
                        <div className="flex-1 pt-1.5">
                          <p className="text-[17px] font-bold text-gray-800 mb-4 leading-relaxed">{q.question_text}</p>
                          <input 
                            type="text"
                            className="w-full max-w-lg h-12 px-5 border-2 border-gray-200 rounded-xl text-[16px] font-bold focus:outline-none focus:border-[#74b602] bg-white transition-all shadow-inner"
                            value={answers[q.id] || ""}
                            onChange={(e) => onAnswerChange(q.id, e.target.value)}
                            placeholder={`Type answer for ${qStart + idx}...`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 h-full overflow-y-auto bg-white">
            <div className="bg-gray-50 border-b border-gray-100 px-10 py-10 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-[#74b602] uppercase tracking-[0.4em] mb-2 block">Part {currentPartIndex + 1}</span>
                <h2 className="text-3xl font-black text-black tracking-tighter">IELTS {sectionType.charAt(0).toUpperCase() + sectionType.slice(1)}</h2>
                <p className="text-sm font-bold text-gray-500 mt-2 uppercase tracking-widest">Questions {qStart}-{qEnd}</p>
              </div>
            </div>

            <div className="px-10 py-12 max-w-5xl mx-auto">
              {partGroups.length > 0 ? (
                partGroups.map((group: any) => {
                  const groupQuestions = getGroupQuestions(group.id);
                  const element = renderQuestionGroup(group, runningQuestionIdx);
                  runningQuestionIdx += groupQuestions.length;
                  return element;
                })
              ) : (
                <div className="space-y-8">
                  {partQuestions.map((q: any, idx: number) => (
                    <div key={q.id} id={`q-${q.id}`} className="flex items-start gap-5 p-7 bg-gray-50/50 rounded-3xl border border-gray-100 shadow-sm hover:bg-white hover:border-[#74b602]/30 transition-all">
                      <span className="w-10 h-10 bg-[#74b602] text-white rounded-full flex items-center justify-center font-black text-sm shrink-0 shadow-lg shadow-[#74b602]/20">
                        {qStart + idx}
                      </span>
                      <div className="flex-1 pt-2">
                        <p className="text-[18px] font-bold text-gray-800 mb-6 leading-relaxed">{q.question_text}</p>
                        <textarea 
                          className="w-full h-64 p-6 border-2 border-gray-100 rounded-3xl text-[16px] font-medium focus:outline-none focus:border-[#74b602] bg-white transition-all shadow-inner resize-none"
                          value={answers[q.id] || ""}
                          onChange={(e) => onAnswerChange(q.id, e.target.value)}
                          placeholder="Type your response here..."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer redesigned based on HTML */}
      <footer className="bg-white border-t border-gray-200 sticky bottom-0 z-50">
        <div className="flex items-center justify-between px-4 py-1.5 h-14">
          <div className="flex items-center space-x-4 mr-6">
            <button 
              onClick={() => setCurrentPartIndex(prev => Math.max(0, prev - 1))}
              disabled={currentPartIndex === 0}
              className="w-8 h-8 bg-[#74b602] hover:bg-[#86d102] rounded-full text-white disabled:opacity-30 flex items-center justify-center transition-all shadow-md shadow-[#74b602]/20 active:scale-90"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setCurrentPartIndex(prev => Math.min(parts.length - 1, prev + 1))}
              disabled={currentPartIndex === parts.length - 1}
              className="w-8 h-8 bg-[#74b602] hover:bg-[#86d102] rounded-full text-white disabled:opacity-30 flex items-center justify-center transition-all shadow-md shadow-[#74b602]/20 active:scale-90"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 flex items-center gap-6 overflow-hidden">
            <div className="flex items-center gap-6 border-r border-gray-100 pr-6">
              {parts.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => setCurrentPartIndex(idx)}
                  className={cn(
                    "text-sm font-black uppercase tracking-widest transition-all whitespace-nowrap",
                    currentPartIndex === idx ? "text-[#74b602] border-b-2 border-[#74b602]" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  Part {idx + 1}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => {
                    const pIdx = parts.findIndex(p => p.id === q.part_id);
                    if (pIdx !== -1) {
                      setCurrentPartIndex(pIdx);
                      setTimeout(() => scrollToQuestion(q.id), 100);
                    }
                  }}
                  className={cn(
                    "w-7 h-7 flex items-center justify-center text-[10px] font-black rounded-lg transition-all border shrink-0",
                    isAnswered(q.id) 
                      ? "bg-[#74b602] text-white border-[#74b602] shadow-md shadow-[#74b602]/20" 
                      : "bg-white text-gray-400 border-gray-200 hover:border-gray-400"
                  )}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={() => setShowFinishConfirm(true)}
            className="bg-[#74b602] text-white px-6 h-9 font-black hover:bg-[#86d102] text-xs rounded-xl ml-4 shadow-lg shadow-[#74b602]/20 transition-all active:scale-95 uppercase tracking-widest border border-[#74b602]/20"
          >
            Submit Test
          </button>
        </div>
      </footer>

        <AlertDialog open={showFinishConfirm} onOpenChange={setShowFinishConfirm}>
          <AlertDialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
            <AlertDialogHeader className="p-0">
              <div className="bg-[#74b602] p-10 flex flex-col items-center text-center text-white">
                <div className="w-20 h-20 rounded-3xl bg-white/20 flex items-center justify-center mb-6 animate-pulse">
                  <AlertTriangle className="w-10 h-10 text-white" />
                </div>
                <AlertDialogTitle className="text-3xl font-black uppercase tracking-tight mb-3">Finish Test?</AlertDialogTitle>
                <AlertDialogDescription className="text-white/80 font-bold text-base leading-relaxed">
                  Are you sure you want to end your test? You won't be able to change your answers after submitting.
                </AlertDialogDescription>
              </div>
            </AlertDialogHeader>
            <div className="p-8 bg-gray-50 flex gap-4">
            <AlertDialogCancel className="flex-1 h-14 rounded-2xl border-2 border-gray-200 text-gray-400 font-black uppercase tracking-widest text-xs hover:bg-gray-100 transition-all">
              Review
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={onFinish}
              className="flex-1 h-14 rounded-2xl bg-[#74b602] hover:bg-[#86d102] text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-[#74b602]/20 transition-all active:scale-95 border-none"
            >
              Submit Now
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {showHighlightMenu && (
        <div 
          className="fixed z-[300] bg-[#1a1a1a] text-white rounded-2xl shadow-2xl border border-white/10 p-2.5 flex gap-2 animate-in fade-in zoom-in slide-in-from-bottom-2 duration-300"
          style={{ 
            left: highlightPosition.x, 
            top: highlightPosition.y,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <button onClick={() => applyHighlight('yellow')} className="w-9 h-9 rounded-xl bg-yellow-300 hover:scale-110 shadow-lg transition-all" />
          <button onClick={() => applyHighlight('green')} className="w-9 h-9 rounded-xl bg-green-300 hover:scale-110 shadow-lg transition-all" />
          <button onClick={() => applyHighlight('blue')} className="w-9 h-9 rounded-xl bg-blue-300 hover:scale-110 shadow-lg transition-all" />
          <div className="w-px h-9 bg-white/10 mx-1" />
          <button onClick={handleAddNote} className="px-5 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest flex items-center justify-center transition-colors">
            Add Note
          </button>
          <button onClick={() => applyHighlight('clear')} className="px-5 h-9 rounded-xl bg-red-600/10 hover:bg-red-600 text-[10px] font-black uppercase tracking-widest flex items-center justify-center transition-colors text-red-500 hover:text-white">
            Clear
          </button>
        </div>
      )}

      {showNoteDialog && (
        <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in slide-in-from-bottom-8 duration-500">
            <div className="bg-[#1a1a1a] p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#74b602] flex items-center justify-center">
                  <span className="text-white font-black">N</span>
                </div>
                <h3 className="text-white text-xs font-black uppercase tracking-[0.2em]">Personal Note</h3>
              </div>
              <button onClick={() => setShowNoteDialog(false)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors"><X size={18} /></button>
            </div>
            <div className="p-10">
              <div className="mb-6 bg-gray-50 p-6 rounded-[1.5rem] border border-gray-100 italic text-[16px] leading-relaxed text-gray-500 relative">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#74b602]/20 rounded-l-[1.5rem]" />
                "{selectedText}"
              </div>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="w-full h-44 p-6 border-2 border-gray-100 rounded-[1.5rem] focus:outline-none focus:border-[#74b602] text-[17px] font-medium resize-none transition-all shadow-inner bg-gray-50/30"
                placeholder="Type your notes here..."
                autoFocus
              />
              <div className="mt-8 flex gap-4">
                <button 
                  onClick={() => setShowNoteDialog(false)}
                  className="flex-1 px-6 py-4 bg-gray-100 text-gray-400 rounded-2xl text-[14px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveNote}
                  className="flex-1 px-6 py-4 bg-[#1a1a1a] text-white rounded-2xl text-[14px] font-black uppercase tracking-widest hover:bg-black shadow-2xl transition-all active:scale-95"
                >
                  Save Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        body { overflow: hidden; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .highlight-yellow { background-color: #fef08a; padding: 0 4px; border-radius: 4px; cursor: help; border-bottom: 2px solid #fde047; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .highlight-green { background-color: #bbf7d0; padding: 0 4px; border-radius: 4px; cursor: help; border-bottom: 2px solid #86efac; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .highlight-blue { background-color: #bfdbfe; padding: 0 4px; border-radius: 4px; cursor: help; border-bottom: 2px solid #93c5fd; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .highlight-pink { background-color: #fbcfe8; padding: 0 4px; border-radius: 4px; cursor: help; border-bottom: 2px solid #f9a8d4; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .passage-container p { margin-bottom: 2rem; text-align: justify; }
        .note-tooltip { pointer-events: none; opacity: 0; transform: translate(-50%, 10px); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .note-target:hover .note-tooltip { opacity: 1; transform: translate(-50%, 0); }
      `}</style>
    </div>
  );
}

import { LogOut } from "lucide-react";
