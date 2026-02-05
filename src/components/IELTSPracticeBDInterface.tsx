"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo, Fragment } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Wifi, 
  Bell, 
  Menu, 
  Volume2,
  X,
  AlertTriangle,
  Image as ImageIcon,
  Upload,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
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
import { toast } from "sonner";

interface IELTSPracticeBDInterfaceProps {
  testTitle: string;
  sectionType: string; // "reading", "listening", "writing"
  parts: any[];
  questions: any[];
  timeLeft: number;
  answers: Record<string, any>;
  onAnswerChange: (questionId: string, answer: any) => void;
  onPassageChange?: (partId: string, html: string) => void;
  onFinish: () => void;
  onExit: () => void;
  disablePause?: boolean;
}

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
  return str;
};

export default function IELTSPracticeBDInterface({
  testTitle,
  sectionType,
  parts,
  questions,
  timeLeft,
  answers,
  onAnswerChange,
  onFinish,
  onExit,
  disablePause
}: IELTSPracticeBDInterfaceProps) {
  const [currentPartIndex, setCurrentPartIndex] = useState(0);
  const [leftPanelWidth, setLeftPanelWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submittingModule, setSubmittingModule] = useState(false);
  const [highlightMenu, setHighlightMenu] = useState<{ x: number, y: number, show: boolean, selectedRange: Range | null }>({
    x: 0, y: 0, show: false, selectedRange: null
  });
  const [clearHighlightMenu, setClearHighlightMenu] = useState<{ x: number, y: number, show: boolean, highlightId: string | null }>({
    x: 0, y: 0, show: false, highlightId: null
  });
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [passageHtml, setPassageHtml] = useState<string>("");
  // Writing reference image: prevent layout jump + handle slow loading
  const [writingImageLoaded, setWritingImageLoaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [writingDrafts, setWritingDrafts] = useState<Record<string, string>>({});
  
  const containerRef = useRef<HTMLDivElement>(null);
  const currentPart = parts[currentPartIndex];

  const writingQuestionId = useMemo(() => {
    if (sectionType !== "writing") return "";
    // Primary: writing question linked to the current part
    const byPart = questions.find((q: any) => q.part_id === currentPart?.id);
    if (byPart?.id) return byPart.id;
    // Fallback: some schemas link writing questions only by section_id
    const bySection = questions.find((q: any) => q.section_id && q.section_id === currentPart?.section_id);
    return bySection?.id || "";
  }, [sectionType, questions, currentPart?.id, currentPart?.section_id]);

  // Reset writing reference image loaded state when part/image changes
  useEffect(() => {
    if (sectionType !== "writing") return;
    setWritingImageLoaded(false);
  }, [sectionType, currentPartIndex, currentPart?.image_url]);

  useEffect(() => {
    if (!currentPart?.id) return;
    const key = `mock_passage_${currentPart.id}`;
    const saved = localStorage.getItem(key);
    setPassageHtml(saved || currentPart.passage_text || "");
  }, [currentPart?.id, currentPart?.passage_text]);

  const savePassageHtml = useCallback(() => {
    if (!currentPart?.id) return;
    const el = document.querySelector(".tiptap-content");
    if (el) {
      const html = el.innerHTML;
      setPassageHtml(html);
      localStorage.setItem(`mock_passage_${currentPart.id}`, html);
    }
  }, [currentPart?.id]);

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
      setLeftPanelWidth(Math.max(20, Math.min(80, newWidth)));
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

  const handleTextSelection = useCallback((e: React.MouseEvent) => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      const selected = selection.toString().trim();
      if (selected.length > 0) {
        const range = selection.getRangeAt(0);
        setSelectedText(selected);
        const rect = range.getBoundingClientRect();
        setHighlightMenu({
          x: rect.right,
          y: rect.top,
          show: true,
          selectedRange: range.cloneRange()
        });
        setClearHighlightMenu(prev => ({ ...prev, show: false }));
        return;
      }
    }
    setHighlightMenu(prev => ({ ...prev, show: false }));
  }, []);

  const addHighlight = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    const highlightId = `hl-${Date.now()}`;
    try {
      const range = selection.getRangeAt(0);
      const span = document.createElement("span");
      span.className = "bg-yellow-200 cursor-pointer highlight-item transition-all hover:bg-yellow-300 px-0.5 rounded select-text";
      span.id = highlightId;
      span.addEventListener("click", (e) => {
        e.preventDefault(); e.stopPropagation();
        const rect = span.getBoundingClientRect();
        setClearHighlightMenu({ x: rect.right, y: rect.top, show: true, highlightId });
      });
      range.surroundContents(span);
      window.getSelection()?.removeAllRanges();
      setHighlightMenu(prev => ({ ...prev, show: false }));
      savePassageHtml();
    } catch (err) {
      const range = highlightMenu.selectedRange;
      if (!range) return;
      const span = document.createElement("span");
      span.className = "bg-yellow-200 cursor-pointer highlight-item transition-all hover:bg-yellow-300 px-0.5 rounded select-text";
      span.id = highlightId;
      const contents = range.extractContents();
      span.appendChild(contents);
      range.insertNode(span);
      span.addEventListener("click", (e) => {
        e.preventDefault(); e.stopPropagation();
        const rect = span.getBoundingClientRect();
        setClearHighlightMenu({ x: rect.right, y: rect.top, show: true, highlightId });
      });
      savePassageHtml();
      window.getSelection()?.removeAllRanges();
      setHighlightMenu(prev => ({ ...prev, show: false }));
    }
  };

  const handleAddNote = () => {
    setShowNoteDialog(true);
    setHighlightMenu(prev => ({ ...prev, show: false }));
  };

  const saveNote = () => {
    if (!highlightMenu.selectedRange || !noteText) return;
    const range = highlightMenu.selectedRange;
    const noteId = `note-${Date.now()}`;
    const span = document.createElement("span");
    span.className = "border-b-2 border-dashed border-red-400 cursor-help note-item group relative inline-block";
    span.id = noteId;
    try {
      const content = range.extractContents();
      span.appendChild(content);
      const tooltip = document.createElement("span");
      tooltip.className = "invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-[10px] rounded shadow-xl z-50 text-center font-medium leading-tight";
      tooltip.textContent = noteText;
      span.appendChild(tooltip);
      range.insertNode(span);
      span.addEventListener("click", (e) => {
        e.preventDefault(); e.stopPropagation();
        setClearHighlightMenu({ x: e.clientX, y: e.clientY - 20, show: true, highlightId: noteId });
      });
      savePassageHtml();
      window.getSelection()?.removeAllRanges();
      setShowNoteDialog(false);
      setNoteText("");
    } catch (err) { console.error(err); }
  };

  const removeHighlight = () => {
    if (!clearHighlightMenu.highlightId) return;
    const el = document.getElementById(clearHighlightMenu.highlightId);
    if (el) {
      const parent = el.parentNode;
      const tooltip = el.querySelector('.group-hover\\:visible');
      if (tooltip) el.removeChild(tooltip);
      while (el.firstChild) parent?.insertBefore(el.firstChild, el);
      parent?.removeChild(el);
      parent?.normalize();
      savePassageHtml();
    }
    setClearHighlightMenu(prev => ({ ...prev, show: false }));
  };

  const isAnswered = (questionId: string) => {
    const ans = answers[questionId];
    return ans !== undefined && ans !== "" && ans !== null;
  };

  const sortedQuestions = useMemo(() => {
    return [...questions].sort((a, b) => {
      const pA = parts.findIndex(p => p.id === a.part_id);
      const pB = parts.findIndex(p => p.id === b.part_id);
      if (pA !== pB) return pA - pB;
      return (a.order_index || 0) - (b.order_index || 0);
    });
  }, [questions, parts]);

  const getGlobalIdx = (qId: string) => {
    const idx = sortedQuestions.findIndex(q => q.id === qId);
    return idx === -1 ? 0 : idx + 1;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      // Using a temporary/public key for demonstration if none in env.
      // Ideally this should be in an API route to hide the key.
      const apiKey = "22510b66532822a90198031557053530"; // Example key
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: "POST",
        body: formData
      });
      const data = await response.json();
      if (data.success) {
        const imageUrl = data.data.url;
        const qId = questions.find(q => q.part_id === currentPart?.id)?.id;
        if (qId) {
          const currentVal = answers[qId] || "";
          // Store image URL in metadata or as part of the answer if needed
          // For now, let's store it in a specific field if we had one, or a JSON string
          onAnswerChange(`${qId}_image`, imageUrl);
          toast.success("Image uploaded successfully!");
        }
      } else {
        toast.error("Upload failed");
      }
    } catch (err) {
      toast.error("Upload error");
    } finally {
      setIsUploading(false);
    }
  };

  const renderGapFill = (qId: string, placeholderIndex: number, orderIndex: number) => {
    const currentVal = answers[qId] || "";
    const answerParts = typeof currentVal === 'string' ? currentVal.split(",") : [];
    return (
      <input
        type="text"
        className="inline-block w-32 h-7 border-2 border-gray-400 text-center text-sm bg-white outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 rounded px-2 mx-1"
        value={answerParts[placeholderIndex] || ""}
        onChange={(e) => {
          const q = questions.find(q => q.id === qId);
          if (!q) return;
          const allPlaceholders = q.question_text.match(/(\[\[\d+\]\]|\[H\d+\])/g) || [];
          const newAnswers = [...answerParts];
          while (newAnswers.length < allPlaceholders.length) newAnswers.push("");
          newAnswers[placeholderIndex] = e.target.value;
          onAnswerChange(qId, newAnswers.join(","));
        }}
        placeholder={orderIndex.toString()}
      />
    );
  };

  const renderQuestionItem = (q: any, group?: any) => {
    const displayNum = getGlobalIdx(q.id);
    return (
      <div key={q.id} id={`q-${q.id}`} className="mb-6">
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-1 shrink-0">{displayNum}</div>
          <div className="flex-1">
            <div className="text-sm font-medium mb-3 text-gray-800">
              {q.question_text.includes("[[") ? (
                <div className="flex flex-wrap items-center gap-1">
                  {q.question_text.split(/(\[\[\d+\]\])/g).map((part: string, i: number) => {
                    const match = part.match(/\[\[(\d+)\]\]/);
                    if (match) {
                      const allPlaceholders = q.question_text.match(/\[\[\d+\]\]/g) || [];
                      const pIndex = allPlaceholders.indexOf(part);
                      return <Fragment key={i}>{renderGapFill(q.id, pIndex, displayNum)}</Fragment>;
                    }
                    return <span key={i}>{part}</span>;
                  })}
                </div>
              ) : q.question_text}
            </div>
            {q.question_type === "multiple_choice" && (
              <div className="space-y-2 mt-2">
                {q.options?.map((opt: string, i: number) => (
                  <label key={i} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <input type="radio" name={`q-${q.id}`} value={opt} checked={answers[q.id] === opt} onChange={() => onAnswerChange(q.id, opt)} className="w-4 h-4 text-red-600 focus:ring-red-500" />
                    <span className="text-sm font-medium text-gray-700"><span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>{opt}</span>
                  </label>
                ))}
              </div>
            )}
            {(q.question_type === "matching" || q.question_type === "paragraph_matching" || q.question_type === "matching_headings") && (
              <div className="flex items-center space-x-3 mt-2">
                <select value={answers[q.id] || ""} onChange={(e) => onAnswerChange(q.id, e.target.value)} className="w-24 h-9 border-2 border-gray-400 bg-white text-sm font-bold px-2 rounded outline-none focus:border-red-500">
                  <option value="">{displayNum}</option>
                  {(q.options || group?.options || ["A", "B", "C", "D", "E", "F", "G", "H"]).map((opt: any, idx: number) => {
                    const label = group?.type === "matching_headings" || q.question_type === "matching_headings" ? toRoman(idx + 1) : String.fromCharCode(65 + idx);
                    return <option key={idx} value={label}>{label}</option>;
                  })}
                </select>
              </div>
            )}
            {(q.question_type === "short_answer" || (!q.question_text.includes("[[") && q.question_type !== "multiple_choice" && q.question_type !== "matching" && q.question_type !== "paragraph_matching" && q.question_type !== "matching_headings")) && (
              <input type="text" className="w-full max-w-sm h-10 border-2 border-gray-400 text-sm bg-white outline-none focus:border-red-500 rounded px-3 mt-2" placeholder="Type your answer..." value={answers[q.id] || ""} onChange={(e) => onAnswerChange(q.id, e.target.value)} />
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderFlowChartGroup = (group: any) => {
    const groupQs = questions.filter(q => q.group_id === group.id);
    if (groupQs.length === 0) return null;
    const startNum = getGlobalIdx(groupQs[0].id);
    const endNum = startNum + groupQs.length - 1;
    return (
      <div key={group.id} className="mb-10">
        <h3 className="font-bold mb-4">Questions {startNum}–{endNum}</h3>
        <p className="text-sm text-gray-700 mb-4">{group.instructions}</p>
        <div className="bg-gray-50 p-6 rounded border border-gray-200 shadow-sm text-left space-y-4">
          {group.diagramTitle && <div className="bg-white p-3 text-center border border-gray-200 rounded font-bold shadow-sm uppercase tracking-wide">{group.diagramTitle}</div>}
          <div className="space-y-6">{group.groupText?.split('\n\n').map((para: string, pIdx: number) => (
            <div key={pIdx} className="bg-white p-5 border border-gray-200 rounded shadow-sm relative">
              {pIdx > 0 && <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xl text-gray-400">↓</div>}
              <ul className="flow-chart-list">{para.split('\n').map((line, lIdx) => (
                <li key={lIdx} className={cn("text-sm leading-relaxed mb-2", (line.trim().startsWith("•") || line.trim().startsWith("*")) ? "pl-5 relative before:content-['●'] before:text-red-600 before:absolute before:left-0 before:top-0 before:text-base" : "")}>
                  {line.trim().replace(/^[•*]\s*/, "").split(/(\[\[\d+\]\])/g).map((item, i) => {
                    const match = item.match(/\[\[(\d+)\]\]/);
                    if (match) {
                      const q = groupQs.find(q => q.question_text.includes(match[0]));
                      if (q) return <Fragment key={i}>{renderGapFill(q.id, (q.question_text.match(/\[\[\d+\]\]/g) || []).indexOf(match[0]), getGlobalIdx(q.id))}</Fragment>;
                    }
                    return <span key={i}>{item}</span>;
                  })}
                </li>
              ))}</ul>
            </div>
          ))}</div>
        </div>
      </div>
    );
  };

  const renderTableGroup = (group: any) => {
    const groupQs = questions.filter(q => q.group_id === group.id);
    if (groupQs.length === 0) return null;
    const startNum = getGlobalIdx(groupQs[0].id);
    const endNum = startNum + groupQs.length - 1;
    return (
      <div key={group.id} className="mb-10">
        <h3 className="font-bold mb-4">Questions {startNum}–{endNum}</h3>
        <p className="text-sm text-gray-700 mb-4">{group.instructions}</p>
        <div className="overflow-x-auto border-2 border-gray-300 rounded shadow-sm">
          <table className="w-full border-collapse">
            <thead><tr className="bg-gray-100">{(group.tableHeaders || []).map((h: string, i: number) => <th key={i} className="border border-gray-300 p-3 text-left font-bold text-xs uppercase tracking-wider text-gray-700">{h}</th>)}</tr></thead>
            <tbody>{(group.tableRows || []).map((row: string[], rIdx: number) => (
              <tr key={rIdx} className="hover:bg-gray-50 transition-colors">{row.map((cell: string, cIdx: number) => (
                <td key={cIdx} className="border border-gray-300 p-4 text-sm align-top leading-relaxed text-gray-800">
                  {cell.split(/(\[\[\d+\]\])/g).map((item, i) => {
                    const match = item.match(/\[\[(\d+)\]\]/);
                    if (match) {
                      const q = groupQs.find(q => q.question_text.includes(match[0]));
                      if (q) return <Fragment key={i}>{renderGapFill(q.id, (q.question_text.match(/\[\[\d+\]\]/g) || []).indexOf(match[0]), getGlobalIdx(q.id))}</Fragment>;
                    }
                    return <span key={i}>{item}</span>;
                  })}
                </td>
              ))}</tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col font-sans text-gray-900 select-none" ref={containerRef}>
      <header className="bg-white border-b border-gray-200 px-6 py-1 sticky top-0 z-50 shadow-sm select-none">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center space-x-8 flex-1 justify-start min-w-0">
            <h1 className="text-red-600 font-bold text-2xl tracking-wide whitespace-nowrap">IELTS</h1>
            <div className="h-6 w-px bg-gray-200 hidden sm:block" />
            <span className="text-gray-500 text-sm font-medium whitespace-nowrap hidden sm:block">{testTitle}</span>
          </div>
          <div className="flex-1 flex justify-center px-4"><span className="text-sm text-red-600 font-black tracking-widest hidden md:block uppercase">ieltspracticebd</span></div>
          <div className="flex items-center space-x-3 flex-1 justify-end min-w-0">
            <div className="flex items-center space-x-2 bg-red-50 px-4 py-2 rounded-lg whitespace-nowrap border border-red-100">
              <Clock className="w-5 h-5 text-red-600" /><span className="text-lg font-mono font-black text-red-600">{formatTime(timeLeft)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <button className="p-1.5 hover:bg-gray-100 rounded-lg"><Wifi className="w-5 h-5 text-gray-500" /></button>
              <button className="p-1.5 hover:bg-gray-100 rounded-lg"><Bell className="w-5 h-5 text-gray-500" /></button>
              <button className="p-1.5 hover:bg-gray-100 rounded-lg" onClick={onExit}><Menu className="w-5 h-5 text-gray-500" /></button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative select-none" style={{ height: "calc(100vh - 100px)" }}>
        {sectionType === "reading" || sectionType === "writing" ? (
          <>
            <div id="left-panel" className="h-full overflow-y-auto border-r border-gray-200 bg-gray-50/30 select-text" style={{ width: `${leftPanelWidth}%` }} onMouseUp={handleTextSelection}>
              <div className="p-10 max-w-4xl mx-auto">
                  {sectionType === "writing" ? (
                    <div className="space-y-8">
                      <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden group/prompt">
                        <div className="absolute top-0 left-0 w-1 h-full bg-red-600" />
                        <h2 className="font-black text-red-600 mb-4 uppercase tracking-[0.2em] text-[10px]">Writing Task {currentPartIndex + 1} Prompt</h2>
                        <div className="prose max-w-none text-gray-800 font-medium leading-relaxed whitespace-pre-wrap text-lg">
                          {currentPart?.passage_text || "No question text provided."}
                        </div>
                      </div>
                      
                      {currentPart?.image_url && (
                        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
                          <h3 className="font-black text-gray-400 uppercase tracking-[0.2em] text-[10px]">Reference Diagram</h3>
                          <div className="relative w-full aspect-video rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
                            {!writingImageLoaded && (
                              <div className="absolute inset-0 animate-pulse bg-gray-100" />
                            )}
                            <img
                              src={currentPart.image_url}
                              alt="Writing Task Reference"
                              loading="eager"
                              onLoad={() => setWritingImageLoaded(true)}
                              onError={() => setWritingImageLoaded(true)}
                              className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ${writingImageLoaded ? "opacity-100" : "opacity-0"}`}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (

                  <div className="prose max-w-none">
                    <div className="bg-gray-100 p-6 rounded mb-8 border border-gray-200">
                      <h2 className="font-bold text-gray-900 mb-2">Part {currentPartIndex + 1}</h2>
                      <p className="text-sm text-gray-700 leading-relaxed">{currentPart?.instructions}</p>
                    </div>
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-bold text-gray-900 uppercase">{currentPart?.title}</h3>
                      <div className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">Select text to highlight</div>
                    </div>
                    <div className="text-base leading-relaxed text-gray-800 select-text text-justify tiptap-content" dangerouslySetInnerHTML={{ __html: passageHtml || currentPart?.passage_text || "" }} />
                  </div>
                )}
              </div>
            </div>

            <div onMouseDown={handleMouseDown} className="w-2 bg-gray-200 hover:bg-gray-300 cursor-col-resize transition-all shrink-0 z-20 flex items-center justify-center group"><div className="w-1 h-8 bg-gray-400 rounded-full group-hover:bg-gray-500" /></div>

            <div id="right-panel" className="flex-1 h-full overflow-y-auto bg-white select-text" onMouseUp={handleTextSelection}>
              <div className="p-10 min-h-full">
                {sectionType === "writing" ? (
                  <div className="max-w-3xl mx-auto h-full flex flex-col">
                    <div className="bg-gray-900 p-8 rounded-[2rem] text-white shadow-2xl mb-10 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 blur-[60px] rounded-full" />
                      <h4 className="font-black uppercase tracking-[0.2em] text-[10px] text-red-500 mb-2">Your Answer</h4>
                      <p className="text-sm font-medium text-white/60 leading-relaxed italic">Write at least {currentPartIndex === 0 ? "150" : "250"} words. Auto-saving is active.</p>
                    </div>
                    <textarea 
                      onMouseUp={(e) => e.stopPropagation()}
                      className="flex-1 min-h-[500px] w-full p-10 border-2 border-gray-100 rounded-[2.5rem] text-lg font-medium focus:outline-none focus:border-red-600 bg-gray-50/30 transition-all resize-none leading-relaxed shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]"
                      placeholder="Start writing your amazing response here..."
                      value={writingQuestionId ? (answers[writingQuestionId] || "") : (writingDrafts[currentPart?.id || ""] || "")}
                      onChange={(e) => {
                        if (writingQuestionId) {
                          onAnswerChange(writingQuestionId, e.target.value);
                        } else if (currentPart?.id) {
                          setWritingDrafts(prev => ({ ...prev, [currentPart.id]: e.target.value }));
                        }
                      }}
                    />
                    {!writingQuestionId && (
                      <div className="mt-4 text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                        Writing prompt loaded, but the writing question is still loading. Your typing is saved locally and will sync automatically.
                      </div>
                    )}
                    <div className="mt-8 flex items-center justify-between px-6">
                      <div className="flex items-center gap-4">
                        <div className="bg-gray-100 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500">
                          Words: {((writingQuestionId ? (answers[writingQuestionId] || "") : (writingDrafts[currentPart?.id || ""] || "")) as string).trim().split(/\s+/).filter(Boolean).length}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-300">
                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" /> Live Sync Active
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-2xl mx-auto space-y-12 select-text">
                    {questions.length === 0 && (
                      <div className="flex items-center justify-center py-24 gap-3 text-gray-500 font-bold">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span>Loading questions…</span>
                      </div>
                    )}
                    {(currentPart?.question_groups || []).map((group: any) => {
                      if (group.type === "flowchart_completion" || group.type === "flow_chart") return renderFlowChartGroup(group);
                      if (group.type === "table_completion") return renderTableGroup(group);
                      const groupQs = questions.filter(q => q.group_id === group.id);
                      return (
                        <div key={group.id} className="mb-10">
                          {groupQs.length > 0 && <h3 className="font-bold mb-4">Questions {getGlobalIdx(groupQs[0]?.id)}–{getGlobalIdx(groupQs[0]?.id) + groupQs.length - 1}</h3>}
                          <p className="text-sm text-gray-700 mb-8 font-medium bg-blue-50/50 p-4 rounded border border-blue-100 italic">{group.instructions}</p>
                          <div className="space-y-6">{groupQs.map(q => renderQuestionItem(q, group))}</div>
                        </div>
                      );
                    })}
                    {questions.filter(q => q.part_id === currentPart?.id && !q.group_id).map(q => renderQuestionItem(q))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 h-full overflow-y-auto bg-white select-text" onMouseUp={handleTextSelection}>
            <div className="p-10 max-w-5xl mx-auto">
              <div className="bg-gray-100 p-8 rounded-lg mb-12 border border-gray-200 flex items-center justify-between shadow-sm">
                <div className="flex-1 pr-10">
                  <h2 className="font-bold text-xl text-gray-900 mb-3 uppercase tracking-tighter">IELTS LISTENING</h2>
                  <p className="text-base text-gray-700 font-medium leading-relaxed">{currentPart?.title}</p>
                  <p className="text-sm text-gray-500 mt-2 italic">{currentPart?.instructions}</p>
                </div>
                {currentPart?.audio_url && (
                  <div className="shrink-0 bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-center gap-6 group hover:border-red-200 transition-all">
                    <div className="w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg"><Volume2 className="w-6 h-6" /></div>
                    <audio controls className="w-64 accent-red-600 h-8"><source src={currentPart.audio_url} type="audio/mpeg" /></audio>
                  </div>
                )}
              </div>
              <div className="space-y-16 pb-20">
                {questions.length === 0 && (
                  <div className="flex items-center justify-center py-24 gap-3 text-gray-500 font-bold">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Loading questions…</span>
                  </div>
                )}
                {(currentPart?.question_groups || []).map((group: any) => {
                  if (group.type === "flowchart_completion" || group.type === "flow_chart") return renderFlowChartGroup(group);
                  if (group.type === "table_completion") return renderTableGroup(group);
                  const groupQs = questions.filter(q => q.group_id === group.id);
                  return (
                    <div key={group.id} className="mb-10">
                      {groupQs.length > 0 && <h3 className="font-bold mb-4 text-xl">Questions {getGlobalIdx(groupQs[0]?.id)}–{getGlobalIdx(groupQs[0]?.id) + groupQs.length - 1}</h3>}
                      <p className="text-sm text-gray-700 mb-10 font-medium italic bg-blue-50/50 p-5 rounded border border-blue-100 max-w-2xl">{group.instructions}</p>
                      <div className="space-y-10">{groupQs.map(q => renderQuestionItem(q, group))}</div>
                    </div>
                  );
                })}
                {questions.filter(q => q.part_id === currentPart?.id && !q.group_id).map(q => renderQuestionItem(q))}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 sticky bottom-0 z-50">
        <div className="flex items-center justify-between px-6 h-12">
          <div className="flex items-center space-x-4 mr-10">
            <button onClick={() => setCurrentPartIndex(prev => Math.max(0, prev - 1))} disabled={currentPartIndex === 0} className="w-8 h-8 bg-red-600 hover:bg-red-700 rounded-full text-white disabled:opacity-30 flex items-center justify-center transition-all shadow active:scale-90"><ChevronLeft className="w-5 h-5" /></button>
            <button onClick={() => setCurrentPartIndex(prev => Math.min(parts.length - 1, prev + 1))} disabled={currentPartIndex === parts.length - 1} className="w-8 h-8 bg-red-600 hover:bg-red-700 rounded-full text-white disabled:opacity-30 flex items-center justify-center transition-all shadow active:scale-90"><ChevronRight className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 flex items-center justify-between gap-4 relative overflow-hidden">
            <div className="flex items-center gap-6 border-r border-gray-100 pr-6">
              {parts.map((p, idx) => (
                <button key={p.id} onClick={() => setCurrentPartIndex(idx)} className={cn("text-sm font-bold uppercase transition-all whitespace-nowrap py-1 border-b-2", currentPartIndex === idx ? "text-red-600 border-red-600" : "text-gray-400 border-transparent hover:text-gray-600")}>Part {idx + 1}</button>
              ))}
            </div>
            <div className="flex-1 flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth">
              {questions.map((q, idx) => (
                <button key={q.id} onClick={() => {
                  const pIdx = parts.findIndex(p => p.id === q.part_id);
                  if (pIdx !== -1) { setCurrentPartIndex(pIdx); setTimeout(() => { const el = document.getElementById(`q-${q.id}`); if (el) el.scrollIntoView({ behavior: "smooth", block: "center" }); }, 100); }
                }} className={cn("w-6 h-6 flex items-center justify-center text-[10px] font-bold rounded-full transition-all border shrink-0", isAnswered(q.id) ? "bg-red-600 text-white border-red-600 shadow-sm" : "bg-white text-gray-500 border-gray-200 hover:border-gray-400")}>{idx + 1}</button>
              ))}
            </div>
          </div>
          <button onClick={() => setShowSubmitConfirm(true)} disabled={submittingModule} className="bg-red-600 text-white px-6 h-8 font-bold hover:bg-red-700 text-xs rounded ml-8 shadow transition-all active:scale-95 uppercase tracking-wide disabled:opacity-50">{submittingModule ? "Submitting..." : "Submit Module"}</button>
        </div>
      </footer>

      {highlightMenu.show && (
        <div className="fixed z-[300] bg-gray-900 text-white border border-white/10 px-1 py-1 rounded-xl shadow-2xl flex items-center gap-1 animate-in fade-in zoom-in duration-200" style={{ left: highlightMenu.x, top: highlightMenu.y, transform: 'translate(-50%, -100%)' }}>
          <button onClick={addHighlight} className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 rounded-lg transition-colors">Highlight</button>
          <div className="w-px h-4 bg-white/10" /><button onClick={handleAddNote} className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 rounded-lg transition-colors">Add Note</button>
        </div>
      )}
      {clearHighlightMenu.show && (
        <div className="fixed z-[300] bg-gray-900 text-white border border-white/10 px-1 py-1 rounded-xl shadow-2xl flex items-center gap-1 animate-in fade-in zoom-in duration-200" style={{ left: clearHighlightMenu.x, top: clearHighlightMenu.y, transform: 'translate(-50%, -100%)' }}>
          <button onClick={removeHighlight} className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">Clear</button>
        </div>
      )}
      {showNoteDialog && (
        <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in slide-in-from-bottom-8 duration-500">
            <div className="bg-gray-900 p-6 flex items-center justify-between"><h3 className="text-white text-xs font-black uppercase tracking-[0.2em]">Add Personal Note</h3><button onClick={() => setShowNoteDialog(false)} className="text-white/60 hover:text-white transition-colors"><X size={18} /></button></div>
            <div className="p-8">
              <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100 italic text-sm text-gray-500">"{selectedText}"</div>
              <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} className="w-full h-40 p-4 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-red-600 text-base font-medium resize-none transition-all" placeholder="Type your notes here..." autoFocus />
              <div className="mt-8 flex gap-4"><button onClick={() => setShowNoteDialog(false)} className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-xl text-xs font-black uppercase tracking-widest">Cancel</button><button onClick={saveNote} className="flex-1 py-3 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-700 shadow-xl shadow-red-600/20">Save Note</button></div>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
        <AlertDialogContent className="max-w-md rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden bg-white font-hind-siliguri">
          <AlertDialogHeader className="p-0">
            <div className="bg-red-600 p-10 flex flex-col items-center text-center text-white">
              <div className="w-20 h-20 rounded-3xl bg-white/20 flex items-center justify-center mb-6"><AlertTriangle className="w-10 h-10 text-white" /></div>
              <AlertDialogTitle className="text-2xl font-black uppercase tracking-tight mb-3">মডিউল সাবমিট করবেন?</AlertDialogTitle>
              <AlertDialogDescription className="text-white/80 font-bold text-base leading-relaxed">আপনি কি নিশ্চিত? জমা দেওয়ার পর ফিরে আসতে পারবেন না।<br/><br/>সময় বাকি: <strong className="text-white">{formatTime(timeLeft)}</strong></AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="p-8 bg-gray-50 flex sm:flex-row gap-4">
            <AlertDialogCancel className="flex-1 h-14 rounded-2xl border-2 border-gray-200 text-gray-400 font-black uppercase tracking-widest text-[10px] hover:bg-gray-100 transition-all m-0">না, আরো চেক করি</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setSubmittingModule(true); savePassageHtml(); setShowSubmitConfirm(false); setTimeout(() => onFinish(), 500); }} className="flex-1 h-14 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-red-600/20 transition-all active:scale-95 border-none m-0">হ্যাঁ, সাবমিট করুন</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <style jsx global>{`
        body { overflow: hidden; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .tiptap-content table { border-collapse: collapse; width: 100%; margin: 1em 0; }
        .tiptap-content td, .tiptap-content th { border: 1px solid #ddd; padding: 8px; }
      `}</style>
    </div>
  );
}
