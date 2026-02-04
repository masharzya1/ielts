"use client";

import React, { useState, useEffect, useRef, Fragment, useMemo } from "react";
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
    MoreVertical,
    LogOut,
    Maximize2,
    GripHorizontal,
    MousePointer2,
    CheckCircle2
  } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CDIExamInterfaceProps {
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

export default function CDIExamInterface({
  testTitle,
  sectionType,
  parts,
  questions,
  timeLeft,
  answers,
  onAnswerChange,
  onFinish,
  onExit
}: CDIExamInterfaceProps) {
  const [currentPartIndex, setCurrentPartIndex] = useState(0);
  const [showTimer, setShowTimer] = useState(true);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [fontSize, setFontSize] = useState<"standard" | "large" | "extra-large">("standard");
  const [volume, setVolume] = useState(80);
  
    const [selectedMatchingHeading, setSelectedMatchingHeading] = useState<{ label: string, groupId: string } | null>(null);
    const [selectedSummaryOption, setSelectedSummaryOption] = useState<{ label: string, groupId: string } | null>(null);

    const sortedQuestions = useMemo(() => {
      return [...questions].sort((a, b) => {
        const partAIdx = parts.findIndex(p => p.id === a.part_id);
        const partBIdx = parts.findIndex(p => p.id === b.part_id);
        if (partAIdx !== partBIdx) return partAIdx - partBIdx;
        return (a.order_index || 0) - (b.order_index || 0);
      });
    }, [questions, parts]);

  const getGlobalIdx = (qId: string) => {
    return sortedQuestions.findIndex(q => (q.id || q.temp_id) === qId);
  };

    const currentPart = parts[currentPartIndex];
    const partQuestions = sortedQuestions.filter(q => q.part_id === currentPart?.id);

  const toggleFlag = (id: string) => {
    setFlaggedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

    const isAnswered = (questionId: string) => {
      const ans = answers[questionId];
      return ans !== undefined && ans !== "" && ans !== null;
    };

      const TableCompletion = ({ group, questionsInGroup }: { group: any, questionsInGroup: any[] }) => {
        return (
          <div className="space-y-6">
            <div className="p-8 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden font-sans">
              {group.diagramTitle && <h4 className="font-bold text-lg text-center mb-8 uppercase tracking-widest text-gray-800">{group.diagramTitle}</h4>}
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100/50">
                      {(group.tableHeaders || []).map((header: string, i: number) => (
                        <th key={i} className="p-4 border border-gray-300 text-left font-black text-sm text-gray-700 uppercase tracking-tight">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(group.tableRows || []).map((row: string[], rIdx: number) => (
                      <tr key={rIdx}>
                        {row.map((cell: string, cIdx: number) => (
                          <td key={cIdx} className="p-4 border border-gray-300 align-top">
                            <div className="text-sm leading-relaxed text-gray-700 space-y-2">
                              {cell.split('\n').map((para: string, pIdx: number) => (
                                <p key={pIdx}>
                                  {para.split(/(\[\[\d+\]\]|\[H\d+\])/g).map((item, i) => {
                                    const match = item.match(/\[\[(\d+)\]\]|\[(H\d+)\]/);
                                    if (match) {
                                      const tag = match[0];
                                      const q = questionsInGroup.find(q => q.question_text.includes(tag));
                                      if (q) {
                                        const globalIdx = getGlobalIdx(q.id || q.temp_id);
                                        const displayNum = globalIdx !== -1 ? globalIdx + 1 : q.order_index;
                                        return (
                                          <span key={i} className="inline-flex items-center gap-2 mx-1">
                                            <span className="text-sm font-black text-gray-900">{displayNum}</span>
                                            <input
                                              type="text"
                                              className="w-28 h-8 border-b-2 border-t-0 border-l-0 border-r-0 border-gray-400 bg-transparent focus:border-[#0072bc] outline-none px-2 text-sm font-medium text-center"
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
                                </p>
                              ))}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      };
  
            const RadioGridMatching = ({ group, questionsInGroup }: { group: any, questionsInGroup: any[] }) => {
              return (
                <div className="space-y-6">
                  {group.groupText && (
                    <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm text-sm leading-relaxed mb-4 whitespace-pre-wrap">
                      {group.groupText}
                    </div>
                  )}
                  <div className="space-y-4">
                    {questionsInGroup.map((q, qIdx) => {
                      const options = q.options || [];
                      return (
                        <div key={q.id} className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all">
                          <div className="flex items-start gap-4 mb-4">
                            <span className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center text-[11px] font-black shrink-0 shadow-sm">{q.order_index}</span>
                            <span className="text-base font-bold text-gray-800 leading-tight pt-1">{q.question_text}</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-12">
                            {options.map((opt: string, i: number) => {
                              const label = group.type === "matching_headings" ? toRoman(i + 1) : String.fromCharCode(65 + i);
                              const isChecked = answers[q.id] === label;
                              return (
                                <button
                                  key={i}
                                  onClick={() => onAnswerChange(q.id, label)}
                                  className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left",
                                    isChecked 
                                      ? "border-[#0072bc] bg-blue-50 text-[#0072bc] shadow-sm" 
                                      : "border-gray-100 bg-gray-50 hover:border-blue-200 text-gray-600"
                                  )}
                                >
                                  <div className={cn(
                                    "w-6 h-6 rounded flex items-center justify-center text-[10px] font-black shrink-0",
                                    isChecked ? "bg-[#0072bc] text-white" : "bg-gray-200 text-gray-500"
                                  )}>
                                    {label}
                                  </div>
                                  <span className="text-sm font-bold">{opt}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            };
      
            const DropdownMatching = ({ group, questionsInGroup }: { group: any, questionsInGroup: any[] }) => {
              return (
                <div className="space-y-4">
                  {group.groupText && (
                    <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm text-sm leading-relaxed mb-4 whitespace-pre-wrap">
                      {group.groupText}
                    </div>
                  )}
                  {questionsInGroup.map((q) => (
                    <div key={q.id} className="flex items-center justify-between gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all group">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center text-[11px] font-black shrink-0 shadow-sm">{q.order_index}</div>
                        <div className="text-sm font-bold text-gray-700 leading-tight pr-4">{q.question_text}</div>
                      </div>
                      <div className="relative shrink-0">
                        <select
                          value={answers[q.id] || ""}
                          onChange={(e) => onAnswerChange(q.id, e.target.value)}
                          className="w-24 h-10 border-2 border-gray-300 bg-white text-sm font-black px-3 rounded-lg outline-none focus:border-[#0072bc] focus:ring-4 focus:ring-blue-100 shadow-sm appearance-none cursor-pointer hover:border-gray-400 transition-all bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%22%20fill%3D%22none%22%20stroke%3D%22%23666%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E')] bg-[length:14px_14px] bg-[right_10px_center] bg-no-repeat text-center pr-8"
                        >
                          <option value="">{q.order_index}</option>
                            {(q.options || []).map((opt: any, idx: number) => {
                              const label = group.type === "matching_headings" ? toRoman(idx + 1) : String.fromCharCode(65 + idx);
                              return (
                                <option key={idx} value={label} className="text-left font-sans font-medium">
                                  {label} - {opt}
                                </option>
                              );
                            })}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
);
              };
    
        const ListOfHeadingsDragDrop = ({ group, questionsInGroup }: { group: any, questionsInGroup: any[] }) => {
          return (
            <div className="space-y-6">
              <div className="p-6 bg-gray-50 border border-gray-200 rounded-2xl">
                <h4 className="font-black text-sm uppercase tracking-widest text-gray-700 mb-4">
                  {group.optionsTitle || "List of Headings"}
                </h4>
                <p className="text-[10px] text-gray-500 font-bold mb-4">Drag headings to the gaps in the passage on the left, or click a heading then click a gap</p>
                <div className="space-y-2">
                  {(group.options || []).map((opt: string, idx: number) => {
                    const label = toRoman(idx + 1);
                    const isUsed = questionsInGroup.some(q => answers[q.id] === label);
                    const isSelected = selectedMatchingHeading?.label === label && selectedMatchingHeading?.groupId === group.id;
                    
                    return (
                      <div
                        key={idx}
                        draggable={!isUsed}
                        onDragStart={(e) => {
                          if (!isUsed) {
                            e.dataTransfer.setData("text/plain", label);
                            e.dataTransfer.effectAllowed = "copyMove";
                            setSelectedMatchingHeading({ label, groupId: group.id });
                          }
                        }}
                        onDragEnd={() => {
                          setSelectedMatchingHeading(null);
                        }}
                        onClick={() => {
                          if (!isUsed) {
                            if (isSelected) {
                              setSelectedMatchingHeading(null);
                            } else {
                              setSelectedMatchingHeading({ label, groupId: group.id });
                            }
                          }
                        }}
                        className={cn(
                          "flex items-center gap-3 p-3 bg-white border-2 rounded-xl transition-all",
                          isUsed 
                            ? "opacity-40 cursor-not-allowed border-gray-100" 
                            : isSelected
                              ? "cursor-pointer border-blue-500 bg-blue-50 ring-4 ring-blue-100 shadow-md"
                              : "cursor-grab active:cursor-grabbing border-gray-200 hover:border-blue-300 hover:shadow-md"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0",
                          isUsed ? "bg-gray-200 text-gray-400" : isSelected ? "bg-blue-600 text-white" : "bg-blue-600 text-white"
                        )}>
                          {label}
                        </div>
                        <span className={cn(
                          "text-sm font-medium flex-1",
                          isUsed ? "text-gray-400 line-through" : "text-gray-700"
                        )}>{opt}</span>
                        {isUsed && (
                          <span className="text-[9px] font-bold text-gray-400 uppercase">Used</span>
                        )}
                        {isSelected && !isUsed && (
                          <span className="text-[9px] font-bold text-blue-600 uppercase animate-pulse">Selected - Click a gap</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        };

          const DragDropMatching = ({ group, questionsInGroup }: { group: any, questionsInGroup: any[] }) => {
        const [selectedOption, setSelectedOption] = useState<{label: string, questionId: string} | null>(null);
        
          return (
            <div className="space-y-6">
              {group.groupText && (
                <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm text-sm leading-relaxed mb-4 whitespace-pre-wrap">
                  {group.groupText}
                </div>
              )}
              
              <div className="space-y-8">
                {questionsInGroup.map((q) => {
                  const options = q.options || [];
                  const currentAnswer = answers[q.id] || "";
                  const isThisQuestionSelected = selectedOption?.questionId === q.id;

                  return (
                    <div key={q.id} className="p-8 bg-white border border-[#eee] rounded-[2rem] shadow-sm space-y-6 relative overflow-hidden group hover:border-blue-100 transition-all">
                      <div className="flex items-start gap-4 mb-2">
                        <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center text-[11px] font-black shrink-0 shadow-sm">{q.order_index}</div>
                        <div className="flex-1">
                          <p className="font-bold text-base text-gray-800 leading-tight">
                            {q.question_text.split(/(\[\[\d+\]\]|\[H\d+\])/g).map((item, i) => {
                              const match = item.match(/\[\[(\d+)\]\]|\[(H\d+)\]/);
                              if (match) {
                                return (
                                  <span 
                                    key={i} 
                                    onClick={() => {
                                      if (selectedOption && selectedOption.questionId === q.id) {
                                        onAnswerChange(q.id, selectedOption.label);
                                        setSelectedOption(null);
                                      } else if (currentAnswer) {
                                        onAnswerChange(q.id, "");
                                      }
                                    }}
                                    className={cn(
                                      "inline-flex items-center gap-2 mx-1 px-3 py-1 border-2 border-dashed rounded-lg transition-all cursor-pointer min-w-[80px] justify-center align-middle h-9",
                                      currentAnswer 
                                        ? "border-[#0072bc] bg-blue-50 text-[#0072bc] font-black shadow-sm" 
                                        : (isThisQuestionSelected ? "border-blue-400 bg-blue-50 ring-4 ring-blue-100 animate-pulse" : "border-gray-200 bg-gray-50 text-gray-400 hover:border-gray-300")
                                    )}
                                  >
                                    {currentAnswer ? (
                                      <span className="animate-in fade-in zoom-in duration-300">{currentAnswer}</span>
                                    ) : (
                                      <span className="text-[10px] font-black uppercase tracking-tighter">Gap</span>
                                    )}
                                  </span>
                                );
                              }
                              return <span key={i}>{item}</span>;
                            })}
                          </p>
                        </div>
                        {(!q.question_text.includes("[[")) && (
                          <div 
                            onClick={() => {
                              if (selectedOption && selectedOption.questionId === q.id) {
                                onAnswerChange(q.id, selectedOption.label);
                                setSelectedOption(null);
                              } else if (currentAnswer) {
                                onAnswerChange(q.id, "");
                              }
                            }}
                            className={cn(
                              "w-24 h-10 border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer transition-all shrink-0",
                              currentAnswer 
                                ? "border-[#0072bc] bg-blue-50 text-[#0072bc] font-black shadow-sm" 
                                : (isThisQuestionSelected ? "border-blue-400 bg-blue-50 ring-4 ring-blue-100 animate-pulse" : "border-gray-200 bg-white text-gray-300 hover:border-gray-400")
                            )}
                          >
                            {currentAnswer || "DROP"}
                          </div>
                        )}
                      </div>

                      <div className="pl-12">
                        <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-3">Available Options for {q.order_index}:</p>
                        <div className="flex flex-wrap gap-2">
                          {options.map((opt: string, idx: number) => {
                            const label = group.type === "matching_headings" ? toRoman(idx + 1) : String.fromCharCode(65 + idx);
                            const isSelected = selectedOption?.questionId === q.id && selectedOption?.label === label;
                            
                            return (
                              <motion.div
                                key={idx}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setSelectedOption(isSelected ? null : { label, questionId: q.id })}
                                className={cn(
                                  "px-3 py-2 bg-white border-2 rounded-xl shadow-sm cursor-pointer flex items-center gap-2 transition-all",
                                  isSelected ? "border-[#0072bc] bg-blue-50 ring-2 ring-blue-100 shadow-md" : "border-gray-100 hover:border-blue-200"
                                )}
                              >
                                <span className={cn(
                                  "w-6 h-6 rounded flex items-center justify-center text-[10px] font-black shadow-sm",
                                  isSelected ? "bg-[#0072bc] text-white" : "bg-gray-100 text-gray-500"
                                )}>{label}</span>
                                <span className="text-xs font-bold text-gray-700 truncate max-w-[150px]">{opt}</span>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        };



      const DiagramLabeling = ({ group, questionsInGroup }: { group: any, questionsInGroup: any[] }) => {
        return (
          <div className="space-y-6">
            <div className="p-8 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden font-sans">
              {group.diagramTitle && <h4 className="font-bold text-lg text-center mb-8 uppercase tracking-widest text-gray-800">{group.diagramTitle}</h4>}
              
              <div className="relative inline-block mx-auto w-full">
                <img src={group.diagramImage} className="w-full h-auto rounded-xl border border-gray-100 shadow-sm" alt="Diagram" />
                {questionsInGroup.map((q: any) => q.coords && (
                  <div 
                    key={q.id}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group"
                    style={{ left: `${q.coords.x}%`, top: `${q.coords.y}%` }}
                  >
                    <div className="relative">
                      <div className="w-8 h-8 bg-[#0072bc] text-white rounded-full flex items-center justify-center text-xs font-black border-2 border-white shadow-lg z-10">
                        {q.order_index}
                      </div>
                      <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-20">
                        <input
                          type="text"
                          className="w-24 h-8 border border-gray-300 bg-white focus:border-[#0072bc] outline-none px-2 text-[11px] font-sans text-center shadow-md rounded"
                          placeholder="Answer..."
                          value={answers[q.id] || ""}
                          onChange={(e) => onAnswerChange(q.id, e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      };

      const renderQuestionItem = (q: any, group?: any, hideNumber: boolean = false) => {
        const isShortAnswerStyle = q.question_type === "short_answer" || group?.type === "short_answer";
        
        return (
          <div key={q.id} id={`q-${q.id}`} className="space-y-4 group">
            <div className="flex items-start gap-4">
              {!hideNumber && (
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div className="w-8 h-8 rounded-full bg-[#DC2626] flex items-center justify-center font-black text-xs text-white shadow-md">
                    {q.order_index}
                  </div>
                  <button 
                    onClick={() => toggleFlag(q.id)}
                    className={cn(
                      "p-1 rounded transition-colors",
                      flaggedQuestions.has(q.id) ? "text-[#ff4d4d]" : "text-[#ccc] hover:text-[#999]"
                    )}
                    title="Review"
                  >
                    <Flag size={14} fill={flaggedQuestions.has(q.id) ? "currentColor" : "none"} />
                  </button>
                </div>
              )}
  
              <div className="flex-1 pt-0.5">
                <div className={cn("font-bold text-[#000] mb-4 text-sm md:text-base leading-relaxed", isShortAnswerStyle && "text-gray-800")}>
                  {q.question_text.includes("[[") ? (
                    <div className="flex flex-wrap items-center gap-1">
                      {q.question_text.split(/(\[\[H?\d+\]\])/g).map((part, i) => {
                        const match = part.match(/\[\[(H?\d+)\]\]/);
                        if (match) {
                          const allPlaceholders = q.question_text.match(/\[\[H?\d+\]\]/g) || [];
                          const pIndex = allPlaceholders.indexOf(part);
                          return <Fragment key={i}>{renderGapFill(q.id, pIndex, q.order_index)}</Fragment>;
                        }
                        return <span key={i}>{part}</span>;
                      })}
                    </div>
                  ) : (
                    q.question_text
                  )}
                </div>
  
                {q.question_type === "multiple_choice" && (
                  <RadioGroup 
                    onValueChange={(val) => onAnswerChange(q.id, val)}
                    value={answers[q.id]}
                    className="space-y-2"
                  >
                    {q.options?.map((opt: string, i: number) => (
                      <div 
                        key={i} 
                        className={cn(
                          "flex items-center space-x-3 p-3 border rounded transition-all cursor-pointer",
                          answers[q.id] === opt 
                            ? "border-[#0072bc] bg-[#eef6fc] shadow-sm" 
                            : "border-[#eee] hover:border-[#ccc] bg-white"
                        )}
                        onClick={() => onAnswerChange(q.id, opt)}
                      >
                        <RadioGroupItem value={opt} id={`${q.id}-${i}`} className="text-[#0072bc] h-4 w-4 border-[#ccc]" />
                        <Label htmlFor={`${q.id}-${i}`} className="flex-grow cursor-pointer font-medium text-sm">
                          <span className="mr-2 font-bold text-[#999]">{String.fromCharCode(65 + i)}.</span>
                          {opt}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
  
                    {(q.question_type === "matching" || q.question_type === "paragraph_matching" || q.question_type === "matching_features" || q.question_type === "matching_headings" || q.question_type === "matching_sentence_endings") && (
                      <div className="flex items-center gap-3">
                        <select
                          value={answers[q.id] || ""}
                          onChange={(e) => onAnswerChange(q.id, e.target.value)}
                          className="w-24 h-10 border-2 border-gray-300 bg-white text-sm font-black px-3 rounded-lg outline-none focus:border-[#0072bc] focus:ring-4 focus:ring-blue-100 shadow-sm appearance-none cursor-pointer hover:border-gray-400 transition-all bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%22%20fill%3D%22none%22%20stroke%3D%22%23666%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E')] bg-[length:14px_14px] bg-[right_10px_center] bg-no-repeat text-center pr-8"
                        >
                          <option value="">{q.order_index}</option>
                          {(q.options || group?.options || ["A", "B", "C", "D", "E", "F", "G", "H"]).map((opt: any, idx: number) => {
                            const label = group?.type === "matching_headings" ? toRoman(idx + 1) : String.fromCharCode(65 + idx);
                            const isTextOption = group?.type === "matching_sentence_endings" || group?.type === "summary_completion" || group?.type === "matching_features" || group?.type === "matching_paragraph_info" || group?.type === "matching";
                            return (
                              <option key={idx} value={label} className="text-left font-sans font-medium">
                                {label} {isTextOption && opt !== label ? ` - ${opt}` : ''}
                              </option>
                            );
                          })}
                        </select>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          {group?.type === "matching_headings" ? "Roman numeral" : `Choose A-${String.fromCharCode(64 + (group?.options?.length || 8))}`}
                        </p>
                      </div>
                    )}
    
                  {(q.question_type === "short_answer" || (q.question_type !== "multiple_choice" && q.question_type !== "drag_drop_matching" && q.question_type !== "matching" && q.question_type !== "paragraph_matching" && q.question_type !== "matching_features" && q.question_type !== "matching_headings" && q.question_type !== "matching_sentence_endings" && !q.question_text.includes("[["))) && (


              <input
                type="text"
                className="w-full max-w-sm h-10 border border-[#ccc] bg-white focus:border-[#0072bc] outline-none px-4 text-sm font-sans rounded shadow-inner"
                placeholder="Type your answer here..."
                value={answers[q.id] || ""}
                onChange={(e) => onAnswerChange(q.id, e.target.value)}
              />
            )}
          </div>
            </div>
          </div>
        );
      };

      const scrollToQuestion = (id: string) => {
    const el = document.getElementById(`q-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

    const renderGapFill = (qId: string, placeholderIndex: number, orderIndex: number, isSummary: boolean = false) => {
      const currentVal = answers[qId] || "";
      const answerParts = typeof currentVal === 'string' ? currentVal.split(",") : [];
      
      const q = questions.find(q => q.id === qId);
      const group = q?.group_id ? currentPart?.question_groups?.find((g: any) => g.id === q.group_id) : null;
  
      if (isSummary) {
        const hasOptions = group?.options && group.options.length > 0;
        if (hasOptions) {
          return renderSummaryDropTarget(qId, placeholderIndex, orderIndex);
        }
        return (
          <div className="relative inline-block mx-1 align-middle">
            <input
              type="text"
              className="w-32 h-10 border border-[#999] bg-white focus:border-[#0072bc] outline-none px-2 text-sm font-sans text-center shadow-inner relative z-10"
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
            />
            {!answerParts[placeholderIndex] && (
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#ccc] pointer-events-none z-0">
                {orderIndex}
              </span>
            )}
          </div>
        );
      }
  
      return (
        <input
          type="text"
          className="w-24 h-7 inline-block mx-1 border border-[#999] bg-white focus:border-[#0072bc] outline-none px-2 text-sm font-sans"
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
        />
      );
    };

  const renderHeadingDropTarget = (qId: string, gapNum: number) => {
    const currentAnswer = answers[qId] || "";
    const gapLetter = String.fromCharCode(96 + gapNum);
    
    return (
        <span 
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const label = selectedMatchingHeading?.label || e.dataTransfer.getData("text/plain");
            if (label) {
              onAnswerChange(qId, label);
            }
            setSelectedMatchingHeading(null);
          }}
          onClick={() => {
            if (selectedMatchingHeading) {
              onAnswerChange(qId, selectedMatchingHeading.label);
              setSelectedMatchingHeading(null);
            } else if (currentAnswer) {
              onAnswerChange(qId, "");
            }
          }}
        className={cn(
          "inline-flex items-center gap-2 mx-2 my-1 px-4 py-2 border-2 border-dashed rounded-xl transition-all cursor-pointer min-w-[180px] justify-center align-middle font-sans",
          currentAnswer 
            ? "border-[#0072bc] bg-blue-50 text-[#0072bc] font-black shadow-sm" 
            : selectedMatchingHeading 
              ? "border-blue-400 bg-blue-50/50 ring-4 ring-blue-100 animate-pulse"
              : "border-gray-300 bg-gray-50 text-gray-400 hover:border-[#0072bc] hover:bg-blue-50/30"
        )}
      >
        <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black shrink-0">{gapLetter}</span>
        {currentAnswer ? (
          <span className="animate-in fade-in zoom-in duration-300 font-bold">
            {currentAnswer}
          </span>
        ) : (
          <span className="text-xs font-bold uppercase tracking-wider">Drop Heading Here</span>
        )}
      </span>
    );
  };

    const renderSummaryDropTarget = (qId: string, placeholderIndex: number, orderIndex: number) => {
      const currentVal = answers[qId] || "";
      const answerParts = typeof currentVal === 'string' ? currentVal.split(",") : [];
      const currentAnswer = answerParts[placeholderIndex] || "";
  
      return (
        <span 
          onClick={() => {
            if (selectedSummaryOption) {
              const q = questions.find(q => q.id === qId);
              if (!q) return;
              const allPlaceholders = q.question_text.match(/(\[\[\d+\]\]|\[H\d+\])/g) || [];
              const newAnswers = [...answerParts];
              while (newAnswers.length < allPlaceholders.length) newAnswers.push("");
              newAnswers[placeholderIndex] = selectedSummaryOption.label;
              onAnswerChange(qId, newAnswers.join(","));
              setSelectedSummaryOption(null);
            } else if (currentAnswer) {
              const q = questions.find(q => q.id === qId);
              if (!q) return;
              const allPlaceholders = q.question_text.match(/(\[\[\d+\]\]|\[H\d+\])/g) || [];
              const newAnswers = [...answerParts];
              newAnswers[placeholderIndex] = "";
              onAnswerChange(qId, newAnswers.join(","));
            }
          }}
          className={cn(
            "inline-flex items-center gap-2 mx-1 px-3 py-1 border-2 border-dashed rounded-lg transition-all cursor-pointer min-w-[80px] justify-center align-middle h-9",
            currentAnswer 
              ? "border-emerald-600 bg-emerald-50 text-emerald-700 font-black shadow-sm" 
              : "border-gray-300 bg-gray-50 text-gray-400 hover:border-emerald-500 hover:bg-emerald-50/30"
          )}
        >
          <span className="text-[10px] opacity-50 font-sans">{orderIndex}</span>
          {currentAnswer ? (
            <span className="animate-in fade-in zoom-in duration-300">
              {currentAnswer}
            </span>
          ) : (
            <span className="text-[9px] font-black uppercase tracking-tighter font-sans">Drop Answer</span>
          )}
        </span>
      );
    };
  
  const processTextWithGaps = (text: string, partId: string) => {
    if (!text) return null;
    const textParts = text.split(/(\[\[\d+\]\]|\[H\d+\])/g);
    return (
      <div className="leading-relaxed">
        {textParts.map((item, i) => {
          const match = item.match(/\[\[(\d+)\]\]|\[(H(\d+))\]/);
            if (match) {
              const tag = match[0];
              const q = questions.find(q => q.part_id === partId && q.question_text.includes(tag));
              if (q) {
                if (q.question_type === "matching_headings") {
                  const headingMatch = tag.match(/\[H(\d+)\]/);
                  const gapNum = headingMatch ? parseInt(headingMatch[1]) : 1;
                  return <React.Fragment key={i}>{renderHeadingDropTarget(q.id, gapNum)}</React.Fragment>;
                }
                const allPlaceholders = q.question_text.match(/(\[\[\d+\]\]|\[H\d+\])/g) || [];
                const pIndex = allPlaceholders.indexOf(tag);
                return <Fragment key={i}>{renderGapFill(q.id, pIndex, q.order_index)}</Fragment>;
              }
              return <span key={i} className="font-bold text-[#0072bc]">[{match[1] || match[2]}]</span>;
            }

          return <span key={i}>{item}</span>;
        })}
      </div>
    );
  };

  return (
    <div className={cn(
      "fixed inset-0 z-[100] bg-[#f0f2f5] flex flex-col font-sans text-[#333]",
      fontSize === "large" && "text-lg",
      fontSize === "extra-large" && "text-xl"
    )}
    onContextMenu={(e) => e.preventDefault()}
    >
      {/* CDI TOP HEADER */}
      <header className="h-14 bg-[#333] text-white flex items-center justify-between px-6 shrink-0 border-b border-[#000]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-[#ccc] text-xs font-bold uppercase tracking-wider">Candidate:</span>
            <span className="font-bold text-sm">TEST TAKER (000001)</span>
          </div>
          <div className="h-4 w-px bg-white/20" />
          <h1 className="font-bold text-sm uppercase tracking-wide">IELTS {sectionType}</h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowTimer(!showTimer)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              title={showTimer ? "Hide Timer" : "Show Timer"}
            >
              {showTimer ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
            <div className={cn(
              "flex items-center gap-2 px-3 py-1 bg-[#444] rounded border border-white/10 min-w-[100px] justify-center",
              !showTimer && "opacity-0 pointer-events-none"
            )}>
              <Clock size={16} className="text-[#00c5ff]" />
              <span className="font-mono text-lg font-bold text-[#00c5ff]">
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={onExit}
                  className="flex items-center gap-2 text-xs font-bold text-[#ff4d4d] hover:bg-[#ff4d4d]/10 px-2 py-1 rounded border border-[#ff4d4d]/20 transition-colors"
                >
                  <LogOut size={14} />
                  EXIT TEST
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Quit and lose progress for this section</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </header>

      {/* CDI TOOLBAR */}
      <div className="h-10 bg-[#e1e4e8] border-b border-[#ccc] flex items-center justify-between px-6 shrink-0 shadow-sm">
        <div className="flex items-center gap-2">
          <button className="text-[11px] font-bold px-3 py-1 bg-white border border-[#ccc] hover:bg-[#f9f9f9] transition-colors rounded shadow-sm">
            Highlight
          </button>
          <button className="text-[11px] font-bold px-3 py-1 bg-white border border-[#ccc] hover:bg-[#f9f9f9] transition-colors rounded shadow-sm">
            Notes
          </button>
        </div>

        <div className="flex items-center gap-4">
          {sectionType === "listening" && (
            <div className="flex items-center gap-3 bg-white/50 px-3 py-1 rounded-full border border-[#ccc]">
              <Volume2 size={14} className="text-[#666]" />
              <input 
                type="range" 
                min="0" max="100" 
                value={volume}
                onChange={(e) => setVolume(parseInt(e.target.value))}
                className="w-24 h-1 bg-[#ccc] rounded-lg appearance-none cursor-pointer accent-[#0072bc]"
              />
            </div>
          )}
          <div className="flex items-center gap-1 bg-white border border-[#ccc] rounded p-0.5 shadow-sm">
            {(["standard", "large", "extra-large"] as const).map((size) => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                className={cn(
                  "px-2 py-0.5 text-[10px] font-bold rounded transition-all",
                  fontSize === size ? "bg-[#0072bc] text-white" : "hover:bg-[#f0f0f0] text-[#666]"
                )}
              >
                {size === "standard" ? "A" : size === "large" ? "A+" : "A++"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: Passage / Audio */}
        <div className="w-1/2 border-r border-[#ccc] bg-white flex flex-col">
          <div className="h-8 bg-[#f5f5f5] border-b border-[#ccc] px-4 flex items-center text-[11px] font-bold text-[#666] uppercase tracking-wider">
            {sectionType === "reading" ? "Reading Passage" : "Listening Audio"}
          </div>
          <div className="flex-1 overflow-y-auto p-10 leading-[1.8] font-serif text-[#111]">
            <h2 className="text-2xl font-bold mb-8 text-[#000]">{currentPart?.title}</h2>
            
            {sectionType === "listening" && currentPart?.audio_url && (
              <div className="mb-10 p-6 bg-[#f8f9fa] border-2 border-dashed border-[#ccc] rounded-xl flex flex-col items-center gap-4">
                <div className="p-4 bg-white rounded-full shadow-md">
                  <Volume2 size={32} className="text-[#0072bc]" />
                </div>
                <audio 
                  controls 
                  className="w-full"
                  volume={volume / 100}
                >
                  <source src={currentPart.audio_url} type="audio/mpeg" />
                </audio>
                <p className="text-xs text-[#999] font-sans font-bold uppercase tracking-widest">Recording for {currentPart?.title}</p>
              </div>
            )}

              <div className="whitespace-pre-wrap">
                {currentPart?.passage_text && processTextWithGaps(currentPart.passage_text, currentPart.id)}
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: Questions */}
          <div className="w-1/2 bg-[#fff] flex flex-col">
            <div className="h-8 bg-[#f5f5f5] border-b border-[#ccc] px-4 flex items-center text-[11px] font-bold text-[#666] uppercase tracking-wider">
              Questions
            </div>
            <div className="flex-1 overflow-y-auto p-10 bg-[#fafafa]">
              <div className="max-w-xl mx-auto space-y-12 pb-20">
                <div className="p-5 bg-white border border-[#eee] rounded shadow-sm text-sm italic text-[#555] leading-relaxed">
                  <p className="font-bold text-[#000] mb-2 not-italic text-xs uppercase tracking-wider">Instructions:</p>
                  {currentPart?.instructions || "Answer the following questions based on the passage."}
                </div>

                          {(currentPart?.question_groups || []).map((group: any) => {
                            const groupQuestions = (() => {
                              const list = [
                                ...(questions || []).filter(q => {
                                  const qId = q.id || q.temp_id;
                                  if (!qId) return false;
                                  return q.group_id === group.id || q.group_id === group.temp_id;
                                }),
                                ...((group.questions || []).filter((q: any) => q?.id || q?.temp_id))
                              ];
                              const seen = new Set<string>();
                              return list.filter(q => {
                                const qId = q.id || q.temp_id;
                                if (!qId || seen.has(qId)) return false;
                                seen.add(qId);
                                return true;
                              });
                            })();
                            if (groupQuestions.length === 0 && !group.groupText) return null;

                            const isMatching = group.type === "matching_headings" || group.type === "paragraph_matching" || group.type === "matching_features" || group.type === "matching_sentence_endings" || group.type === "matching";
                            const isSummary = group.type === "summary_completion";
                            const isSentenceCompletion = group.type === "sentence_completion";
                            const isGapFill = isSummary || isSentenceCompletion;
                            const isGapFillWithTable = (isGapFill || group.type === "table_completion") && group.useTable;
                            const isFlowChart = group.type === "flowchart_completion";
                            const isParagraphMatching = group.type === "paragraph_matching";
                            const hasGroupText = group.groupText && group.groupText.trim().length > 0;

                            const firstQ = groupQuestions[0];
                            const firstQId = firstQ?.id || firstQ?.temp_id;
                            const startNum = firstQId ? getGlobalIdx(firstQId) + 1 : 1;
                            const endNum = startNum + groupQuestions.length - 1;


                        return (
                            <div key={group.id} className="space-y-6 border-t pt-8 first:border-t-0 first:pt-0">
                                <div className="text-center space-y-4 mb-10">
                                  <h3 className="font-black text-2xl text-gray-900 tracking-tight uppercase border-b-2 border-gray-100 pb-2 inline-block px-10">Questions {startNum}-{endNum}</h3>
                                  <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl text-sm italic text-gray-700 max-w-lg mx-auto leading-relaxed">
                                    {group.instructions}
                                  </div>
                                </div>

                                {isParagraphMatching && (
                                  <div className="p-10 bg-[#f0f4f8] border border-gray-200 rounded-[2.5rem] space-y-10">
                                    <div className="max-w-md mx-auto bg-white p-10 rounded-3xl border border-blue-100 shadow-xl relative overflow-hidden">
                                      <div className="absolute top-0 left-0 w-2.5 h-full bg-blue-500" />
                                      <h4 className="font-black text-base uppercase tracking-[0.2em] text-gray-800 mb-8 text-center border-b border-gray-50 pb-4">
                                        {group.optionsTitle || "List of Paragraphs"}
                                      </h4>
                                      <div className="grid grid-cols-1 gap-5">
                                        {(group.options || []).map((opt: string, idx: number) => (
                                          <div key={idx} className="flex gap-4 items-start group/opt">
                                            <div className="h-8 w-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-[11px] font-black shrink-0 shadow-md group-hover/opt:scale-110 transition-transform">
                                              {String.fromCharCode(65 + idx)}
                                            </div>
                                            <span className="text-sm font-bold text-gray-700 leading-tight pt-1.5">{opt}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    <div className="space-y-4 pt-4 max-w-2xl mx-auto">
                                      {groupQuestions.map((q) => (
                                        <div key={q.id} id={`q-${q.id}`} className="flex items-center justify-between gap-6 p-6 bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-xl transition-all group">
                                          <div className="flex items-start gap-5 flex-1">
                                            <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center text-xs font-black shrink-0 shadow-lg">{getGlobalIdx(q.id || q.temp_id) + 1}</div>
                                            <div className="text-base font-bold text-gray-700 leading-tight pt-2.5">{q.question_text}</div>
                                          </div>
                                          <div className="relative shrink-0">
                                            <select
                                              value={answers[q.id] || ""}
                                              onChange={(e) => onAnswerChange(q.id, e.target.value)}
                                              className={cn(
                                                "w-24 h-12 border-2 bg-white text-base font-black px-3 rounded-2xl outline-none shadow-sm appearance-none cursor-pointer transition-all text-center",
                                                answers[q.id] 
                                                  ? "border-blue-500 text-blue-700 bg-blue-50"
                                                  : "border-gray-200 hover:border-blue-400"
                                              )}
                                            >
                                              <option value="">...</option>
                                              {(group.options || []).map((_: any, idx: number) => {
                                                const label = String.fromCharCode(65 + idx);
                                                return (
                                                  <option key={idx} value={label}>
                                                    {label}
                                                  </option>
                                                );
                                              })}
                                            </select>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

{isMatching && group.type === "matching_headings" ? (
                                      <ListOfHeadingsDragDrop group={group} questionsInGroup={groupQuestions} />
                                    ) : isMatching && group.matchingMode === 'radio_grid' ? (
                                      <RadioGridMatching group={group} questionsInGroup={groupQuestions} />
                                    ) : isMatching && group.matchingMode === 'drag_drop' ? (
                                      <DragDropMatching group={group} questionsInGroup={groupQuestions} />
                                    ) : isMatching && (group.matchingMode === 'dropdown' || !group.matchingMode) ? (
                                      <DropdownMatching group={group} questionsInGroup={groupQuestions} />
                                    ) : (group.type === "table_completion" || isGapFillWithTable) ? (

                                <TableCompletion group={group} questionsInGroup={groupQuestions} />
) : group.type === "diagram_completion" ? (
                                  <DiagramLabeling group={group} questionsInGroup={groupQuestions} />
) : isFlowChart ? (
                                    <div className="flex justify-center">
                                      <div className="w-full max-w-2xl">
                                        {(() => {
                                          const text = group.groupText || "";

                                          const renderGapInput = (gapNumInText: number) => {
                                            const q = groupQuestions.find((q: any, idx: number) => idx + 1 === gapNumInText);
                                            if (!q) return (
                                              <span className="inline-flex items-center">
                                                <span className="font-bold mr-0.5">{gapNumInText}</span>
                                                <span className="tracking-[0.1em]">................</span>
                                              </span>
                                            );
                                            const qId = q.id || q.temp_id;
                                            const value = answers[qId] || "";

                                            return (
                                              <span className="inline-flex items-center mx-1">
                                                <span className="font-bold mr-0.5">{gapNumInText}</span>
                                                <input
                                                  value={value}
                                                  onChange={(e) => onAnswerChange(qId, e.target.value)}
                                                  className="w-24 h-7 border-b border-gray-500 border-t-0 border-l-0 border-r-0 bg-transparent px-1 text-sm text-center outline-none font-medium"
                                                  placeholder="................"
                                                />
                                              </span>
                                            );
                                          };

                                          const renderContent = (content: string) => {
                                            const parts = content.split(/(\d+\.{2,}|\.{2,}\(\d+\)|\(\d+\)\.{2,})/g);
                                            return parts.map((part, i) => {
                                              const gapMatch = part.match(/(\d+)\.{2,}|\.{2,}\((\d+)\)|\((\d+)\)\.{2,}/);
                                              if (gapMatch) {
                                                const num = parseInt(gapMatch[1] || gapMatch[2] || gapMatch[3]);
                                                return <React.Fragment key={i}>{renderGapInput(num)}</React.Fragment>;
                                              }
                                              return <span key={i}>{part}</span>;
                                            });
                                          };

                                          if (group.layout === "type2") {
                                            const lines = text.split("\n").filter(l => l.trim());
                                            return (
                                              <div className="border border-gray-800 bg-white">
                                                {group.diagramTitle && (
                                                  <div className="border-b-2 border-gray-800 py-3 px-4">
                                                    <h3 className="text-center font-bold text-[15px]">{group.diagramTitle}</h3>
                                                  </div>
                                                )}
                                                {lines.map((line, idx) => (
                                                  <React.Fragment key={idx}>
                                                    <div className={cn("border-b border-gray-300 px-4 py-3 text-[13px] leading-relaxed text-center", idx === lines.length - 1 && "border-b-0")}>
                                                      {renderContent(line)}
                                                    </div>
                                                    {idx < lines.length - 1 && (
                                                      <div className="flex justify-center py-1 border-b border-gray-300">
                                                        <span className="text-gray-600 text-lg">↓</span>
                                                      </div>
                                                    )}
                                                  </React.Fragment>
                                                ))}
                                              </div>
                                            );
                                          }

                                          const lines = text.split("\n").filter(l => l.trim());
                                          const branchStartIdx = lines.findIndex(l => l.toLowerCase().startsWith("theory") || l.toLowerCase().includes("[branch]"));
                                          const hasBranch = branchStartIdx !== -1;
                                          const topLines = hasBranch ? lines.slice(0, branchStartIdx) : lines;
                                          const branchLines = hasBranch ? lines.slice(branchStartIdx).filter(l => !l.toLowerCase().includes("[/branch]") && !l.toLowerCase().includes("[branch]")) : [];

                                          const leftBranch: string[] = [];
                                          const rightBranch: string[] = [];
                                          let currentSide = "left";
                                          branchLines.forEach(line => {
                                            if (line.toLowerCase().includes("theory 1:") || line.toLowerCase().includes("[left]")) {
                                              currentSide = "left";
                                              if (!line.toLowerCase().includes("[left]")) leftBranch.push(line);
                                            } else if (line.toLowerCase().includes("theory 2:") || line.toLowerCase().includes("[right]")) {
                                              currentSide = "right";
                                              if (!line.toLowerCase().includes("[right]")) rightBranch.push(line);
                                            } else {
                                              if (currentSide === "left") leftBranch.push(line);
                                              else rightBranch.push(line);
                                            }
                                          });

                                          return (
                                            <div className="text-center">
                                              {group.diagramTitle && (
                                                <h3 className="font-bold text-[15px] text-[#0072bc] mb-6">{group.diagramTitle}</h3>
                                              )}
                                              {topLines.map((line, idx) => (
                                                <React.Fragment key={idx}>
                                                  <div className="text-[13px] leading-relaxed text-center py-1">
                                                    {renderContent(line)}
                                                  </div>
                                                  {idx < topLines.length - 1 && (
                                                    <div className="flex justify-center py-1">
                                                      <span className="text-gray-500 text-lg">↓</span>
                                                    </div>
                                                  )}
                                                </React.Fragment>
                                              ))}
                                              {hasBranch && topLines.length > 0 && (
                                                <div className="flex justify-center py-1">
                                                  <span className="text-gray-500 text-lg">↓</span>
                                                </div>
                                              )}
                                              {hasBranch && (leftBranch.length > 0 || rightBranch.length > 0) && (
                                                <div className="grid grid-cols-2 gap-8 mt-4">
                                                  <div className="text-left space-y-1">
                                                    {leftBranch.map((line, idx) => (
                                                      <div key={idx} className="text-[13px] leading-relaxed">
                                                        {renderContent(line)}
                                                      </div>
                                                    ))}
                                                  </div>
                                                  <div className="text-left space-y-1">
                                                    {rightBranch.map((line, idx) => (
                                                      <div key={idx} className="text-[13px] leading-relaxed">
                                                        {renderContent(line)}
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    </div>
                                  ) : group.type === "note_completion" ? (
                                  <div className="max-w-2xl mx-auto text-sm text-gray-800 leading-relaxed">
                                    {(() => {
                                      const text = group.groupText || "";
                                      const lines = text.split("\n");

                                        const updateAnswer = (qId: string, placeholderIndex: number, value: string) => {
                                          const q = groupQuestions.find(q => (q.id || q.temp_id) === qId);
                                          if (!q) return;
                                          const allPlaceholders = q.question_text.match(/(\[\[\d+\]\]|\[H\d+\])/g) || q.question_text.match(/(\[\[\d+\]\])/g) || [];
                                          const current = (answers[qId] || "").split(",");
                                          const next = [...current];
                                          while (next.length < allPlaceholders.length) next.push("");
                                          next[placeholderIndex] = value;
                                          onAnswerChange(qId, next.join(","));
                                        };

                                        const renderGapInput = (gapNumInText: number) => {
                                          const tag = `[[${gapNumInText}]]`;
                                          const q = groupQuestions.find(q => q.question_text?.includes(tag));
                                          if (!q) return <span className="text-gray-400">({gapNumInText}) ................</span>;
                                          const qId = q.id || q.temp_id;
                                          const allPlaceholders = q.question_text.match(/(\[\[\d+\]\]|\[H\d+\])/g) || q.question_text.match(/(\[\[\d+\]\])/g) || [];
                                          const placeholderIndex = allPlaceholders.indexOf(tag);
                                          const currentParts = (answers[qId] || "").split(",");
                                          const value = currentParts[placeholderIndex] || "";

                                          return (
                                            <span className="inline-flex items-center mx-1 align-baseline">
                                              <span className="text-xs mr-1">({gapNumInText})</span>
                                              <input
                                                value={value}
                                                onChange={(e) => updateAnswer(qId, placeholderIndex, e.target.value)}
                                                className="min-w-[110px] h-7 border-b border-gray-500 border-t-0 border-l-0 border-r-0 bg-transparent px-1 text-sm text-center outline-none"
                                                placeholder="................"
                                              />
                                            </span>
                                          );
                                        };

                                      return lines.map((line, lineIdx) => {
                                        const isBullet = line.trim().startsWith("•");
                                        const content = isBullet ? line.trim().replace(/^•\s*/, "") : line.trim();
                                        if (!content) return null;

                                        const parts = content.split(/(\[\[\d+\]\])/g);
                                        const renderedLine = parts.map((part, i) => {
                                          const match = part.match(/\[\[(\d+)\]\]/);
                                          if (match) return <React.Fragment key={i}>{renderGapInput(parseInt(match[1]))}</React.Fragment>;
                                          return <span key={i}>{part}</span>;
                                        });

                                        return (
                                          <div key={lineIdx} className="flex gap-3 mb-2 items-start">
                                            {isBullet && <span className="shrink-0">•</span>}
                                            <div className="flex-1">{renderedLine}</div>
                                          </div>
                                        );
                                      });
                                    })()}
                                  </div>
                                ) : group.type === "list_selection" ? (
                                  <div className="space-y-6">
                                  {groupQuestions.map((q) => (
                                    <div key={q.id} className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm space-y-4">
                                      <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-[#DC2626] flex items-center justify-center font-black text-xs text-white shadow-md shrink-0">
                                          {q.order_index}
                                        </div>
                                        <div className="flex-1">
                                          <p className="font-bold text-gray-800 mb-4">{q.question_text}</p>
                                          <div className="grid grid-cols-1 gap-2">
                                            {(q.options || ["A", "B", "C", "D", "E"]).map((opt: string, i: number) => {
                                              const label = String.fromCharCode(65 + i);
                                              const currentAnswers = (answers[q.id] || "").split(",").map((s: string) => s.trim()).filter(Boolean);
                                              const isChecked = currentAnswers.includes(label);
                                              return (
                                                <div 
                                                  key={i} 
                                                  onClick={() => {
                                                    let newAnswers = isChecked 
                                                      ? currentAnswers.filter((a: string) => a !== label)
                                                      : [...currentAnswers, label];
                                                    onAnswerChange(q.id, newAnswers.sort().join(", "));
                                                  }}
                                                  className={cn(
                                                    "flex items-center space-x-3 p-3 border rounded transition-all cursor-pointer",
                                                    isChecked ? "border-[#0072bc] bg-[#eef6fc]" : "border-gray-100 hover:border-gray-200"
                                                  )}
                                                >
                                                  <div className={cn(
                                                    "w-4 h-4 rounded border flex items-center justify-center transition-all",
                                                    isChecked ? "bg-[#0072bc] border-[#0072bc]" : "border-gray-300"
                                                  )}>
                                                    {isChecked && <CheckCircle2 size={12} className="text-white" />}
                                                  </div>
                                                  <span className="text-sm font-medium">
                                                    <span className="mr-2 font-bold text-gray-400">{label}.</span>
                                                    {opt}
                                                  </span>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                  </div>
                                     ) : (isGapFill && hasGroupText) ? (

                                <div className="space-y-6">
                                  <div className="p-10 bg-white border border-gray-200 rounded-lg shadow-sm">
                                    {group.diagramTitle && <h4 className="font-bold text-lg text-center mb-6 uppercase tracking-wider">{group.diagramTitle}</h4>}
                                    <div className="text-sm md:text-base leading-loose text-gray-800 space-y-4 font-sans">
                                      {group.groupText.split('\n').map((para: string, pIdx: number) => (
                                        <p key={pIdx}>
                                          {para.split(/(\[\[\d+\]\]|\[H\d+\])/g).map((item, i) => {
                                            const match = item.match(/\[\[(\d+)\]\]|\[(H\d+)\]/);
                                            if (match) {
                                              const tag = match[0];
                                              const q = groupQuestions.find(q => q.question_text.includes(tag));
                                              if (q) {
                                                const allPlaceholders = q.question_text.match(/(\[\[\d+\]\]|\[H\d+\])/g) || [];
                                                const pIndex = allPlaceholders.indexOf(tag);
                                                if (group.options && group.options.length > 0) {
                                                  return <React.Fragment key={i}>{renderSummaryDropTarget(q.id, pIndex, q.order_index)}</React.Fragment>;
                                                }
                                                return <React.Fragment key={i}>{renderGapFill(q.id, pIndex, q.order_index, true)}</React.Fragment>;
                                              }
                                              return <span key={i} className="font-bold text-[#0072bc]">[{match[1] || match[2]}]</span>;
                                            }
                                            return <span key={i}>{item}</span>;
                                          })}
                                        </p>
                                      ))}
                                    </div>
                                  </div>

                                  {group.options && group.options.length > 0 && (
                                    <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl shadow-inner">
                                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">
                                        {selectedSummaryOption ? "Now click a 'Drop Answer' box above" : "Options (Click to select, then click a gap):"}
                                      </p>
                                      <div className="flex flex-wrap gap-3">
                                        {group.options.map((opt: string, idx: number) => {
                                          const label = String.fromCharCode(65 + idx);
                                          const isSelected = selectedSummaryOption?.label === label;
                                          return (
                                            <motion.div
                                              key={idx}
                                              whileHover={{ scale: 1.02 }}
                                              whileTap={{ scale: 0.98 }}
                                              onClick={() => setSelectedSummaryOption(isSelected ? null : { label, groupId: group.id })}
                                              className={cn(
                                                "px-4 py-2 bg-white border-2 rounded-xl shadow-sm cursor-pointer flex items-center gap-3 transition-all",
                                                isSelected ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100" : "border-gray-100 hover:border-gray-300"
                                              )}
                                            >
                                              <span className={cn(
                                                "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shadow-sm",
                                                isSelected ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-500"
                                              )}>{label}</span>
                                              <span className="text-sm font-bold text-gray-700">{opt}</span>
                                            </motion.div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                              <div className="space-y-8">
                                {groupQuestions.map((q) => renderQuestionItem(q, group))}
                              </div>
                            )}
                          </div>
                        );
                      })}


                {/* Render Ungrouped Questions */}
                {partQuestions.filter(q => !q.group_id).map((q) => renderQuestionItem(q))}
              </div>
            </div>
          </div>
        </main>

      {/* CDI BOTTOM NAVIGATION */}
      <footer className="h-20 bg-[#f5f5f5] border-t border-[#ccc] flex items-center px-6 shrink-0 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-[80vw] no-scrollbar">
            {questions.map((q) => (
              <button
                key={q.id}
                onClick={() => {
                  const partIdx = parts.findIndex(p => p.id === q.part_id);
                  if (partIdx !== -1) setCurrentPartIndex(partIdx);
                  setTimeout(() => scrollToQuestion(q.id), 100);
                }}
                className={cn(
                  "min-w-[32px] h-8 rounded border-b-2 flex items-center justify-center text-[11px] font-bold transition-all relative",
                  isAnswered(q.id) 
                    ? "bg-[#0072bc] border-[#005a96] text-white" 
                    : "bg-white border-[#ccc] text-[#666] hover:bg-[#eee]"
                )}
              >
                {q.order_index}
                {flaggedQuestions.has(q.id) && (
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#ff4d4d] rounded-full border border-white" />
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 text-[10px] font-bold text-[#999] uppercase tracking-widest">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-[#0072bc] rounded-sm" /> Answered</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-white border border-[#ccc] rounded-sm" /> Unanswered</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-[#ff4d4d] rounded-full" /> Review</div>
          </div>
        </div>

        <div className="flex items-center gap-4 pl-6 border-l border-[#ccc] ml-6">
          <Button 
            variant="outline"
            disabled={currentPartIndex === 0}
            onClick={() => setCurrentPartIndex(prev => prev - 1)}
            className="bg-white border-[#ccc] text-[#333] hover:bg-[#eee] h-10 px-6 font-bold rounded shadow-sm"
          >
            <ChevronLeft size={18} className="mr-1" /> BACK
          </Button>

          {currentPartIndex < parts.length - 1 ? (
            <Button 
              onClick={() => setCurrentPartIndex(prev => prev + 1)}
              className="bg-[#0072bc] hover:bg-[#005a96] text-white h-10 px-6 font-bold rounded shadow-sm"
            >
              NEXT <ChevronRight size={18} className="ml-1" />
            </Button>
          ) : (
            <Button 
              onClick={onFinish}
              className="bg-[#28a745] hover:bg-[#218838] text-white h-10 px-8 font-bold rounded shadow-sm"
            >
              FINISH SECTION <ArrowRight size={18} className="ml-2" />
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}
