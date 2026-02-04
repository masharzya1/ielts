"use client";

import React, { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { FlowchartRenderer } from "@/components/FlowchartRenderer";

export interface HeadingOption {
  label: string;
  text: string;
}

export interface Question {
  id: string;
  gapNum?: number;
  correctAnswer: string;
  order_index?: number;
  orderIndex?: number;
  question_text?: string;
  question_type?: string;
  options?: string[];
}

export interface QuestionGroup {
  id: string;
  type: string;
  title: string;
  instructions: string;
  options?: string[];
  optionsTitle?: string;
  diagramTitle?: string;
  diagramImage?: string;
  groupText?: string;
  tableHeaders?: string[];
  tableRows?: string[][];
  tableColumnWidths?: number[];
  useTable?: boolean;
  questions: Question[];
}

export interface StudentPassageViewerProps {
  passageHtml: string;
  passageTitle?: string;
  headingOptions?: HeadingOption[];
  questions?: Question[];
  questionGroups?: QuestionGroup[];
  answers: Record<string, string>;
  onAnswerChange: (questionId: string, answer: string) => void;
  showResults?: boolean;
  mode?: "preview" | "exam";
  onClearAnswer?: (questionId: string) => void;
  className?: string;
  optionalText?: string;
  instructions?: string;
}

const toRoman = (num: number): string => {
  const roman: Record<string, number> = {
    m: 1000, cm: 900, d: 500, cd: 400, c: 100, xc: 90, l: 50, xl: 40, x: 10, ix: 9, v: 5, iv: 4, i: 1
  };
  let str = "";
  for (const i of Object.keys(roman)) {
    const q = Math.floor(num / roman[i]);
    num -= q * roman[i];
    str += i.repeat(q);
  }
  return str.toUpperCase();
};

export function useStudentAnswers(initialAnswers: Record<string, string> = {}) {
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [showResults, setShowResults] = useState(false);

  const setAnswer = useCallback((questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  }, []);

  const clearAnswer = useCallback((questionId: string) => {
    setAnswers(prev => {
      const newAnswers = { ...prev };
      delete newAnswers[questionId];
      return newAnswers;
    });
  }, []);

  const resetAllAnswers = useCallback(() => {
    setAnswers({});
    setShowResults(false);
  }, []);

  const checkAnswer = useCallback((questionId: string, correctAnswer: string) => {
    const userAnswer = (answers[questionId] || "").trim().toLowerCase();
    if (!userAnswer) return null;
    const correctAnswers = (correctAnswer || "").split("/").map(ans => ans.trim().toLowerCase());
    return correctAnswers.includes(userAnswer);
  }, [answers]);

  const getScore = useCallback((questions: Question[]) => {
    let correct = 0;
    questions.forEach(q => {
      const qId = q.id || q.temp_id;
      const userAnswer = (answers[qId] || "").trim().toLowerCase();
      const correctAnswers = (q.correctAnswer || "").split("/").map(ans => ans.trim().toLowerCase());
      if (qId && correctAnswers.includes(userAnswer)) correct++;
    });
    return { correct, total: questions.length };
  }, [answers]);

  return {
    answers,
    showResults,
    setShowResults,
    setAnswer,
    clearAnswer,
    resetAllAnswers,
    checkAnswer,
    getScore,
  };
}

export default function StudentPassageViewer({
  passageHtml,
  passageTitle,
  headingOptions,
  questions,
  answers,
  onAnswerChange,
  showResults = false,
  mode = "preview",
    onClearAnswer,
    className,
    optionalText,
    instructions,
  }: StudentPassageViewerProps) {
    const [draggedHeading, setDraggedHeading] = useState<HeadingOption | null>(null);


  const handleDragStart = (e: React.DragEvent, option: HeadingOption) => {
    e.dataTransfer.setData("text/plain", option.label);
    e.dataTransfer.setData("text/heading-label", option.label);
    e.dataTransfer.effectAllowed = "copyMove";
    setDraggedHeading(option);
  };

  const handleDragEnd = () => {
    setDraggedHeading(null);
  };

  const handleDropOnGap = (e: React.DragEvent, questionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const label = e.dataTransfer.getData("text/heading-label") || e.dataTransfer.getData("text/plain") || draggedHeading?.label;
    if (label) {
      onAnswerChange(questionId, label);
    }
    setDraggedHeading(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const getQuestionByGapNum = (gapNum: number) => {
    return questions.find(q => q.gapNum === gapNum || q.question_text === `[H${gapNum}]` || q.question_text?.includes(`[H${gapNum}]`));
  };

  const checkAnswer = (questionId: string) => {
    const q = questions.find(qq => (qq.id || qq.temp_id) === questionId);
    if (!q) return null;
    const userAnswer = (answers[questionId] || "").trim().toLowerCase();
    if (!userAnswer) return null;
    const correctAnswers = (q.correctAnswer || "").split("/").map(ans => ans.trim().toLowerCase());
    return correctAnswers.includes(userAnswer);
  };

  const processPassageWithGaps = () => {
    if (!passageHtml) return null;

    const gapRegex = /<span[^>]*data-heading-gap="(\d+)"[^>]*data-correct-answer="([^"]*)"[^>]*>.*?<\/span>|<span[^>]*data-heading-gap="(\d+)"[^>]*>.*?<\/span>|<span[^>]*data-standard-gap="(\d+)"[^>]*>.*?<\/span>/g;
    
    const processedHtml = passageHtml
      .replace(gapRegex, (fullMatch, gapNum1, correctAns, gapNum2, gapNum3) => {
        const gapNum = gapNum1 || gapNum2 || gapNum3;
        const type = gapNum3 ? 'STANDARD' : 'HEADING';
        return `__GAP_PLACEHOLDER_${type}_${gapNum}__`;
      })
      .replace(/\[H(\d+)\]/g, "__GAP_PLACEHOLDER_HEADING_$1__")
      .replace(/\[\[(\d+)\]\]/g, "__GAP_PLACEHOLDER_STANDARD_$1__");

    const splitParts = processedHtml.split(/(__GAP_PLACEHOLDER_(?:HEADING|STANDARD)_\d+__)/g);

    const parts: React.ReactNode[] = [];

    splitParts.forEach((part, idx) => {
      const gapMatch = part.match(/__GAP_PLACEHOLDER_(HEADING|STANDARD)_(\d+)__/);
      
      if (gapMatch) {
        const type = gapMatch[1];
        const gapNum = parseInt(gapMatch[2]);
        
        if (type === 'HEADING') {
          const gapLetter = String.fromCharCode(96 + gapNum);
          const q = getQuestionByGapNum(gapNum);

          if (q) {
            const qId = q.id || q.temp_id;
            const answer = answers[qId];
            const isCorrect = showResults ? checkAnswer(qId) : null;

            parts.push(
              <span
                key={`gap-heading-${idx}-${gapNum}`}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDrop={(e) => handleDropOnGap(e, qId)}
                onClick={() => answer && onClearAnswer?.(qId)}
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
                <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                  {gapLetter}
                </span>
                {answer ? (
                  <span className="font-bold text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-current/20 flex items-center justify-center text-[10px] font-black">
                      {answer}
                    </span>
                    {showResults && !isCorrect && (
                      <span className="text-[9px] font-black text-red-500">
                        (Correct: {q.correctAnswer})
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Drop Heading Here
                  </span>
                )}
              </span>
            );
          } else {
            parts.push(
              <span
                key={`gap-orphan-${idx}-${gapNum}`}
                className="inline-flex items-center gap-2 mx-2 my-1 px-4 py-2 border-2 border-dashed border-orange-300 bg-orange-50 rounded-xl text-orange-600 font-sans align-middle cursor-help"
              >
                <span className="w-6 h-6 rounded-lg bg-orange-500 text-white flex items-center justify-center text-xs font-black shrink-0">
                  {gapLetter}
                </span>
                <span className="text-xs font-bold whitespace-nowrap">
                  Gap {gapNum} (No question linked)
                </span>
              </span>
            );
          }
        } else {
          // Standard gap
          parts.push(
              <span
                key={`gap-standard-${idx}-${gapNum}`}
                className="inline-flex items-center gap-2 mx-2 my-1 px-2 py-1 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-lg font-sans align-middle shadow-sm"
              >
              <span className="w-5 h-5 rounded bg-amber-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                {gapNum}
              </span>
              <span className="text-[10px] font-bold text-amber-800 px-1 italic">Gap</span>
            </span>
          );
        }

      } else if (part) {
        parts.push(
          <span
            key={`text-${idx}`}
            dangerouslySetInnerHTML={{ __html: part }}
          />
        );
      }
    });

    return (
      <div className="leading-[2] font-serif text-base whitespace-pre-wrap prose prose-sm max-w-none">
        {parts}
      </div>
    );
  };

  return (
    <div className={cn("flex h-full", className)}>
      <div className="w-1/2 border-r border-gray-200 bg-white flex flex-col">
        <div className="h-10 bg-gray-100 border-b border-gray-200 px-4 flex items-center text-xs font-bold text-gray-600 uppercase tracking-wider">
          Reading Passage
        </div>
        <div className="flex-1 overflow-y-auto p-8">
          {passageTitle && (
            <h2 className="text-2xl font-black mb-8 text-gray-900">{passageTitle}</h2>
          )}
          {processPassageWithGaps()}
        </div>
      </div>

      <div className="w-1/2 bg-white flex flex-col">
        <div className="h-10 bg-gray-100 border-b border-gray-200 px-4 flex items-center text-xs font-bold text-gray-600 uppercase tracking-wider">
          Questions
        </div>
          <div className="flex-1 overflow-y-auto p-8 space-y-12">
                {(questionGroups || []).map((group, gIdx) => {
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
                  const hasQuestions = groupQuestions.length > 0;
                const firstQ = groupQuestions[0];
                const firstQId = firstQ?.id || firstQ?.temp_id;
                const startNum = hasQuestions ? (questions || []).findIndex(q => (q.id || q.temp_id) === firstQId) + 1 : 1;
                const endNum = hasQuestions ? startNum + groupQuestions.length - 1 : 1;

                if (!hasQuestions && !group.groupText) return null;

                return (
                  <div key={group.id} className="space-y-8">
                    <div className="text-center space-y-4">
                      {hasQuestions && (
                        <h3 className="font-black text-xl text-gray-900 tracking-tight uppercase border-b-2 border-gray-100 pb-2 inline-block px-8">Questions {startNum}{endNum > startNum ? `-${endNum}` : ""}</h3>
                      )}
                      <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl text-sm text-blue-800 italic max-w-lg mx-auto leading-relaxed">
                        {group.instructions}
                      </div>
                    </div>

                  {group.type === "paragraph_matching" && (
                    <div className="p-8 bg-[#f0f4f8] border border-gray-200 rounded-[2.5rem] space-y-8">
                      <div className="max-w-md mx-auto bg-white p-8 rounded-2xl border border-blue-100 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-2 h-full bg-blue-500" />
                        <h4 className="font-black text-base uppercase tracking-[0.2em] text-gray-800 mb-6 text-center border-b border-gray-50 pb-4">
                          {group.optionsTitle || "List of Paragraphs"}
                        </h4>
                        <div className="grid grid-cols-1 gap-3">
                          {(group.options || []).map((opt, idx) => (
                            <div key={idx} className="flex gap-4 items-start group/opt">
                              <div className="h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm group-hover/opt:scale-110 transition-transform">
                                {String.fromCharCode(65 + idx)}
                              </div>
                              <span className="text-sm font-bold text-gray-700 leading-tight pt-1">{opt}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1 pt-4 max-w-2xl mx-auto">
                        {groupQuestions.map((q) => {
                          const qId = q.id || q.temp_id;
                          const answer = answers[qId];
                          const isCorrect = showResults ? checkAnswer(qId) : null;
                          const qNum = (questions || []).findIndex(qq => (qq.id || qq.temp_id) === qId) + 1;

                          return (
                            <div key={qId} className="flex items-center justify-between gap-6 p-2 bg-white rounded-xl shadow-sm hover:bg-gray-50 transition-all group">
                              <div className="flex items-start gap-4 flex-1">
                                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-black shrink-0 shadow-md">{qNum}</div>
                                <div className="text-[15px] font-bold text-gray-800 leading-tight pt-2">{q.question_text}</div>
                              </div>
                              <div className="relative shrink-0 flex items-center gap-2">
                                <select
                                  value={answer || ""}
                                  onChange={(e) => onAnswerChange(qId, e.target.value)}
                                  className={cn(
                                    "w-24 h-9 border-2 bg-white text-sm font-black px-2 rounded-xl outline-none shadow-sm appearance-none cursor-pointer transition-all text-center",
                                    answer 
                                      ? showResults
                                        ? isCorrect 
                                          ? "border-green-500 text-green-700 bg-green-50"
                                          : "border-red-500 text-red-700 bg-red-50"
                                        : "border-blue-500 text-blue-700 bg-blue-50"
                                      : "border-gray-200 hover:border-blue-400"
                                  )}
                                >
                                  <option value="">Select</option>
                                  {(group.options || []).map((_, idx) => {
                                    const label = String.fromCharCode(65 + idx);
                                    return (
                                      <option key={idx} value={label}>
                                        {label}
                                      </option>
                                    );
                                  })}
                                </select>
                                {showResults && !isCorrect && (
                                  <div className="text-[10px] font-black text-red-500 uppercase bg-red-50 px-2 py-1 rounded-lg border border-red-100 whitespace-nowrap">
                                    Ans: {q.correctAnswer}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {group.type === "matching_headings" && (
                  <div className="space-y-6">
                    <div className="p-6 bg-gray-50 border border-gray-200 rounded-2xl">
                      <h4 className="font-black text-sm uppercase tracking-widest text-gray-700 mb-4">
                        {group.optionsTitle || "List of Headings"}
                      </h4>
                      <div className="space-y-2">
                        {(group.options || []).map((opt, idx) => {
                          const label = toRoman(idx + 1);
                          return (
                            <div
                              key={idx}
                              draggable
                              onDragStart={(e) => handleDragStart(e, { label, text: opt })}
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
                    {/* Results for headings would go here if needed, or handled via passage gaps */}
                  </div>
                )}

                    {group.type === "multiple_choice" && (
                      <div className="space-y-8 max-w-2xl mx-auto">
                        {groupQuestions.map((q, qIdx) => {
                          const qId = q.id || q.temp_id;
                          const answer = answers[qId];
                          const isCorrect = showResults ? checkAnswer(qId) : null;
                          const qNum = (questions || []).findIndex(qq => (qq.id || qq.temp_id) === qId) + 1;

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
                                      onClick={() => onAnswerChange(qId, label)}
                                      className={cn(
                                        "flex items-start gap-3 p-2 rounded-xl transition-all text-left group/mcq-opt relative",
                                        isSelected 
                                          ? showResults
                                            ? isCorrect && label === q.correctAnswer
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
                                            ? isCorrect && label === q.correctAnswer
                                              ? "border-green-600"
                                              : "border-red-600"
                                            : "border-blue-600"
                                          : "border-gray-300 group-hover/mcq-opt:border-blue-400"
                                      )}>
                                        {isSelected && (
                                          <div className={cn(
                                            "w-2.5 h-2.5 rounded-full",
                                            showResults
                                              ? isCorrect && label === q.correctAnswer
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
                                      
                                      {showResults && label === q.correctAnswer && !isCorrect && (
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


                    {group.type === "flowchart_completion" && (
                      <FlowchartRenderer
                        group={group}
                        groupQs={groupQuestions}
                        fullQuestions={questions}
                        answers={answers}
                        onAnswerChange={onAnswerChange}
                        showResults={showResults}
                        checkAnswer={checkAnswer}
                      />
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
                          {groupQuestions.map((q: any) => {
                            const qId = q.id || q.temp_id;
                            const isCorrect = showResults ? checkAnswer(qId) : null;
                            const qNum = (questions || []).findIndex(qq => (qq.id || qq.temp_id) === qId) + 1;

                            return (
                              <div key={qId} className="flex items-start gap-4 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                <span className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-md">{qNum}</span>
                                <p className="flex-1 text-[15px] font-bold text-gray-800 pt-2 leading-relaxed">
                                  {q.question_text}
                                </p>
                                <div className="shrink-0 flex items-center gap-2 pt-1">
                                  <select 
                                    value={answers[qId] || ""}
                                    onChange={(e) => onAnswerChange(qId, e.target.value)}
                                    className={cn(
                                      "h-10 w-28 border-2 rounded-xl text-sm font-black px-2 transition-all outline-none cursor-pointer text-center",
                                      answers[qId] 
                                        ? showResults
                                          ? isCorrect === true ? "border-green-500 bg-green-50 text-green-700"
                                          : "border-red-500 bg-red-50 text-red-700"
                                          : "border-blue-500 bg-blue-50 text-blue-700"
                                          : "border-gray-200 focus:border-blue-500"
                                    )}
                                  >
                                    <option value="">Select</option>
                                    {(group.options || []).map((_: any, i: number) => (
                                      <option key={i} value={String.fromCharCode(65 + i)}>{String.fromCharCode(65 + i)}</option>
                                    ))}
                                  </select>
                                  {showResults && !isCorrect && (
                                    <div className="flex flex-col items-center">
                                      <span className="text-[10px] font-black text-red-500 uppercase bg-red-50 px-2 py-1 rounded-lg border border-red-100">Ans: {q.correctAnswer}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
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
                            <p className="text-gray-400 font-bold">Diagram image not available</p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {groupQuestions.sort((a,b) => (a.order_index || 0) - (b.order_index || 0)).map((q) => {
                            const qId = q.id || q.temp_id;
                            const qNum = (questions || []).findIndex(qq => (qq.id || qq.temp_id) === qId) + 1;
                            const answer = answers[qId];
                            const isCorrect = showResults ? checkAnswer(qId) : null;

                            return (
                              <div key={qId} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                                  {qNum}
                                </div>
                                <div className="relative flex-1">
                                  <input 
                                    value={answer || ""}
                                    onChange={(e) => onAnswerChange(qId, e.target.value)}
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
                                        Ans: {q.correctAnswer}
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

                    {group.type === "note_completion" && (
                      <div className="max-w-2xl mx-auto py-8">
                        {group.diagramTitle && (
                          <h4 className="text-xl font-bold mb-8 text-gray-900 border-b-2 border-gray-100 pb-3 tracking-tight">{group.diagramTitle}</h4>
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
                                  const q = groupQuestions.find((q: any) => {
                                    const qText = q.question_text || "";
                                    return qText.includes(`[[n${gapNum}]]`) || qText.includes(`[[${gapNum}]]`);
                                  });
                                    if (q) {
                                      const qId = q.id || q.temp_id;
                                      const isCorrect = showResults ? checkAnswer(qId) : null;
                                      const answer = answers[qId];
                                      const globalIdx = questions.findIndex(qq => (qq.id || qq.temp_id) === qId);
                                      const displayNum = globalIdx !== -1 ? globalIdx + 1 : gapNum;
                                      return (
                                        <span key={i} className="inline-flex items-center mx-1 align-baseline relative group/gap">
                                          <span className="font-black mr-1 text-gray-900 text-sm">{displayNum}</span>
                                          <div className="relative">

                                          <input 
                                            value={answer || ""}
                                            onChange={(e) => onAnswerChange(qId, e.target.value)}
                                            className={cn(
                                              "w-36 h-8 border-b-2 border-t-0 border-l-0 border-r-0 rounded-none bg-transparent px-2 focus:ring-0 font-bold transition-all text-center placeholder:text-gray-300 outline-none",
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
                                                Ans: {q.correctAnswer}
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

                    {group.type === "summary_completion" && (
                      <div className="text-[17px] leading-[2.2] text-gray-800 max-w-2xl mx-auto py-8 font-serif">
                        {group.diagramTitle && (
                          <h4 className="text-xl font-bold mb-6 text-gray-900 border-b-2 border-gray-100 pb-2 tracking-tight">{group.diagramTitle}</h4>
                        )}
                        <div className="whitespace-pre-wrap leading-relaxed">
                          {(() => {
                            const text = group.groupText || "";
                            const parts = text.split(/(\[\[n?\d+\]\])/g);
                            return parts.map((part, i) => {
                              const match = part.match(/\[\[n?(\d+)\]\]/);
                              if (match) {
                                const gapNum = parseInt(match[1]);
                                const q = groupQuestions.find((q: any) => {
                                  const qText = q.question_text || "";
                                  return qText.includes(`[[n${gapNum}]]`) || qText.includes(`[[${gapNum}]]`);
                                });
                                
                                  if (q) {
                                    const qId = q.id || q.temp_id;
                                    const answer = answers[qId];
                                    const isCorrect = showResults ? checkAnswer(qId) : null;
                                    const globalIdx = questions.findIndex(qq => (qq.id || qq.temp_id) === qId);
                                    const displayNum = globalIdx !== -1 ? globalIdx + 1 : gapNum;
                                    return (
                                      <span key={i} className="inline-flex items-center align-baseline mx-1 relative">
                                        <span className="font-bold mr-1 text-gray-900">{displayNum}</span>
                                        <input 

                                        value={answer || ""}
                                        onChange={(e) => onAnswerChange(qId, e.target.value)}
                                        className={cn(
                                          "w-36 h-8 border-b-2 border-t-0 border-l-0 border-r-0 rounded-none bg-transparent px-2 focus:ring-0 text-sm font-bold transition-all text-center outline-none",
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
                                            Ans: {q.correctAnswer}
                                          </span>
                                        </div>
                                      )}
                                    </span>
                                  );
                                }
                                return <span key={i} className="text-gray-400 font-medium">({gapNum}) ........................</span>;
                              }
                              return <span key={i} className="font-bold text-gray-700 leading-relaxed">{part}</span>;
                            });
                          })()}
                        </div>
                      </div>
                    )}

                      {group.type === "table_completion" && (
                        <div className="max-w-4xl mx-auto py-8">
                          {group.diagramTitle && (
                            <h4 className="text-xl font-bold mb-8 text-gray-900 border-b-2 border-gray-100 pb-3 tracking-tight text-center">{group.diagramTitle}</h4>
                          )}
                          <div className="overflow-x-auto border border-gray-200 rounded-2xl bg-white shadow-sm">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="bg-gray-50/80">
                                  {((group as any).tableHeaders || []).map((header: string, hIdx: number) => {
                                    const widths = (group as any).tableColumnWidths || ((group as any).tableHeaders || []).map(() => 150);
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
                                {((group as any).tableRows || []).map((row: string[], rIdx: number) => (
                                  <tr key={rIdx}>
                                    {row.map((cell: string, cIdx: number) => {
                                      const parts = (cell || "").split(/(\[\[n?\d+\]\])/g);
                                      return (
                                        <td key={cIdx} className="p-4 border border-gray-100 align-top bg-white">
                                          <div className="text-[13px] font-medium leading-relaxed text-gray-800">
                                            {parts.map((part, pIdx) => {
                                              const match = part.match(/\[\[n?(\d+)\]\]/);
                                              if (match) {
                                                const gapNum = parseInt(match[1]);
                                                const q = groupQuestions.find((q: any) => {
                                                  const qText = q.question_text || "";
                                                  return qText.includes(`[[n${gapNum}]]`) || qText.includes(`[[${gapNum}]]`);
                                                });
                                                  if (q) {
                                                    const qId = q.id || q.temp_id;
                                                    const isCorrect = showResults ? checkAnswer(qId) : null;
                                                    const answer = answers[qId];
                                                    const globalIdx = questions.findIndex(qq => (qq.id || qq.temp_id) === qId);
                                                    const displayNum = globalIdx !== -1 ? globalIdx + 1 : gapNum;
                                                    return (
                                                      <span key={pIdx} className="inline-flex items-center align-middle mx-1 relative">
                                                        <span className="text-[13px] font-black text-gray-900 mr-2">{displayNum}</span>
                                                        <div className="relative">
                                                          <input 
                                                            value={answer || ""}
                                                            onChange={(e) => onAnswerChange(qId, e.target.value)}
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
                                                                Ans: {q.correctAnswer}
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
                                      const q = groupQuestions.find((q: any) => (q.question_text || "").includes(`[[${gapNum}]]`));
                                        if (q) {
                                          const qId = q.id || q.temp_id;
                                          const isCorrect = showResults ? checkAnswer(qId) : null;
                                          const globalIdx = questions.findIndex(qq => (qq.id || qq.temp_id) === qId);
                                          const displayNum = globalIdx !== -1 ? globalIdx + 1 : gapNum;
                                          return (
                                            <span key={i} className="inline-flex items-center align-middle mx-1">
                                              <span className="text-[15px] font-black text-gray-900 mr-2">{displayNum}</span>
                                              <div className="relative">
                                                <input 
                                                  value={answers[qId] || ""}
                                                  onChange={(e) => onAnswerChange(qId, e.target.value)}
                                                  className={cn(
                                                    "w-48 h-9 border-b-2 border-t-0 border-l-0 border-r-0 rounded-none bg-transparent px-2 focus:ring-0 font-bold transition-all outline-none text-center",
                                                    answers[qId] 
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
                                                    Ans: {q.correctAnswer}
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

                    {group.type === "true_false_ng" && (
                      <div className="space-y-6 max-w-3xl mx-auto">
                        {groupQuestions.map((q) => {
                          const qId = q.id || q.temp_id;
                          const answer = answers[qId];
                          const isCorrect = showResults ? checkAnswer(qId) : null;
                          const qNum = (questions || []).findIndex(qq => (qq.id || qq.temp_id) === qId) + 1;
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
                                        onClick={() => onAnswerChange(qId, opt)}
                                        className={cn(
                                          "px-4 py-2 rounded-xl text-xs font-black transition-all border-2",
                                          isSelected
                                            ? showResults
                                              ? isCorrect && opt === q.correctAnswer
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
                                      Correct: {(q.correctAnswer || "").toUpperCase()}
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
                          {groupQuestions.map((q) => {
                            const qId = q.id || q.temp_id;
                            const answer = answers[qId];
                            const isCorrect = showResults ? checkAnswer(qId) : null;
                            const qNum = (questions || []).findIndex(qq => (qq.id || qq.temp_id) === qId) + 1;
                            return (
                              <div key={qId} className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                                <span className="w-10 h-10 rounded-full bg-amber-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-md">{qNum}</span>
                                <div className="flex-1 flex items-center gap-4">
                                  <select 
                                    value={answer || ""}
                                    onChange={(e) => onAnswerChange(qId, e.target.value)}
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
                                    <span className="text-[10px] font-black text-red-500 uppercase bg-red-50 px-2 py-1 rounded-lg border border-red-100">Ans: {q.correctAnswer}</span>
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
                        {groupQuestions.map((q) => {
                          const qId = q.id || q.temp_id;
                          const answer = answers[qId];
                          const isCorrect = showResults ? checkAnswer(qId) : null;
                          const qNum = (questions || []).findIndex(qq => (qq.id || qq.temp_id) === qId) + 1;
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
                                      onClick={() => onAnswerChange(qId, label)}
                                      className={cn(
                                        "flex items-start gap-3 p-3 rounded-xl transition-all text-left relative",
                                        isSelected 
                                          ? showResults
                                            ? isCorrect && label === q.correctAnswer
                                              ? "bg-green-50 text-green-700 border-green-200 border"
                                              : "bg-red-50 text-red-700 border-red-200 border"
                                            : "bg-purple-50 text-purple-700 border-purple-200 border"
                                          : "hover:bg-gray-50 text-gray-700 border border-transparent"
                                      )}
                                    >
                                      <div className="font-black shrink-0 w-6">{label}</div>
                                      <div className="font-medium">{opt}</div>
                                      {showResults && label === q.correctAnswer && !isCorrect && (
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

                        {group.type !== "matching_headings" && group.type !== "paragraph_matching" && group.type !== "multiple_choice" && group.type !== "summary_completion" && group.type !== "flowchart_completion" && group.type !== "note_completion" && group.type !== "table_completion" && group.type !== "sentence_completion" && group.type !== "true_false_ng" && group.type !== "matching_features" && group.type !== "matching_sentence_endings" && group.type !== "diagram_completion" && group.type !== "list_selection" && group.type !== "choosing_a_title" && (

                      <div className="space-y-4 max-w-3xl mx-auto">
                        {groupQuestions.map((q, qIdx) => {
                          const qId = q.id || q.temp_id;
                          const qNum = (questions || []).findIndex(qq => (qq.id || qq.temp_id) === qId) + 1;
                          const isCorrect = showResults ? checkAnswer(qId) : null;
                          return (
                            <div key={qId} className="flex items-center gap-4">
                              <span className="w-8 font-black text-sm text-gray-400 shrink-0">{qNum}</span>
                              <p className="flex-1 text-sm font-medium">{q.question_text}</p>
                              <div className="flex items-center gap-2">
                                <input
                                  value={answers[qId] || ""}
                                  onChange={(e) => onAnswerChange(qId, e.target.value)}
                                  className={cn(
                                    "w-40 h-9 border rounded-lg px-3 text-sm transition-all",
                                    answers[qId]
                                      ? showResults
                                        ? isCorrect ? "border-green-500 bg-green-50 text-green-700" : "border-red-500 bg-red-50 text-red-700"
                                        : "border-blue-500"
                                      : "border-gray-200"
                                  )}
                                  placeholder="Your answer..."
                                />
                                {showResults && isCorrect === false && (
                                  <span className="text-[10px] font-black text-red-500 uppercase bg-red-50 px-2 py-1 rounded-lg border border-red-100">Ans: {q.correctAnswer}</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                  {/* Other group types would be handled here */}
              </div>
            );
          })}

          {/* Fallback for legacy heading-only view */}
          {(!questionGroups || questionGroups.length === 0) && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800 italic">
                {instructions || "Reading Passage has several paragraphs. Choose the correct heading for each paragraph from the list of headings below."}
              </div>
              {optionalText && (
                <div className="text-sm leading-relaxed text-gray-700 font-medium bg-gray-50/50 p-4 rounded-xl border border-gray-100 italic">
                  {optionalText}
                </div>
              )}
              {headingOptions && headingOptions.length > 0 && (
                <div className="p-6 bg-gray-50 border border-gray-200 rounded-2xl">
                  <h4 className="font-black text-sm uppercase tracking-widest text-gray-700 mb-4">List of Headings</h4>
                  <div className="space-y-2">
                    {headingOptions.map((opt, idx) => {
                      const label = toRoman(idx + 1);
                      return (
                        <div
                          key={idx}
                          draggable
                          onDragStart={(e) => handleDragStart(e, { label, text: opt.text })}
                          onDragEnd={handleDragEnd}
                          className="flex items-center gap-3 p-3 bg-white border-2 border-gray-200 rounded-xl transition-all cursor-grab active:cursor-grabbing hover:border-blue-300 hover:shadow-md"
                        >
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 bg-blue-600 text-white">
                            {label}
                          </div>
                          <span className="text-sm font-medium text-gray-700">{opt.text}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function StudentPassageViewerPreviewWrapper({
  passageHtml,
  passageTitle,
  headingOptions,
  questions,
  currentPartIndex,
  parts,
  onPartChange,
  onBackToEdit,
}: {
  passageHtml: string;
  passageTitle?: string;
  headingOptions: HeadingOption[];
  questions: Question[];
  currentPartIndex: number;
  parts: { id: string; part_number: number }[];
  onPartChange: (index: number) => void;
  onBackToEdit: () => void;
  optionalText?: string;
  instructions?: string;
}) {
  const {
    answers,
    showResults,
    setShowResults,
    setAnswer,
    clearAnswer,
    resetAllAnswers,
  } = useStudentAnswers();

  return (
    <div className="flex-1 flex flex-col bg-[#f0f2f5] overflow-hidden">
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
            onClick={resetAllAnswers}
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

      <div className="flex-1 overflow-hidden">
        <StudentPassageViewer
          passageHtml={passageHtml}
          passageTitle={passageTitle}
          headingOptions={headingOptions}
          questions={questions}
          answers={answers}
          onAnswerChange={setAnswer}
          onClearAnswer={clearAnswer}
          showResults={showResults}
          mode="preview"
          optionalText={optionalText}
          instructions={instructions}
        />
      </div>

      <div className="h-12 bg-gray-100 border-t border-gray-200 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-2">
          {parts.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => onPartChange(idx)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                currentPartIndex === idx
                  ? "bg-gray-800 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-200"
              )}
            >
              Part {p.part_number}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded" /> Answered
          </span>
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-300 rounded border border-dashed border-gray-400" /> Unanswered
          </span>
        </div>
      </div>
    </div>
  );
}
