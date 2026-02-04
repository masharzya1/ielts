"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Headphones, 
  Volume2, 
  Wifi, 
  Bell, 
  Menu, 
  ChevronLeft, 
  ChevronRight,
  Info,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  X,
  CheckCircle2,
  ExternalLink,
  Clipboard,
  Heart,
  LogOut,
  Settings,
  AlertTriangle,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
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

interface ListeningTestInterfaceProps {
  testTitle: string;
  parts: any[];
  questions: any[];
  timeLeft: number;
  answers: Record<string, any>;
  onAnswerChange: (questionId: string, answer: any) => void;
  onFinish: () => void;
  onExit: () => void;
}

export default function ListeningTestInterface({
  testTitle,
  parts,
  questions,
  timeLeft,
  answers,
  onAnswerChange,
  onFinish,
  onExit
}: ListeningTestInterfaceProps) {
  const [currentPartIndex, setCurrentPartIndex] = useState(0);
  const [audioStatus, setAudioStatus] = useState("Audio is paused");
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [resultsData, setResultsData] = useState<any>(null);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentPart = parts[currentPartIndex];
  const partQuestions = questions.filter(q => q.part_id === currentPart?.id);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
    }
  };

  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.duration, audioRef.current.currentTime + 10);
    }
  };

  const handleAudioPlay = () => setAudioStatus("Audio is playing");
  const handleAudioPause = () => setAudioStatus("Audio is paused");

  const isAnswered = (questionId: string) => {
    const ans = answers[questionId];
    return ans !== undefined && ans !== "" && ans !== null;
  };

  const scrollToQuestion = (id: string) => {
    const el = document.getElementById(`q-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col font-outfit text-gray-900 overflow-hidden" onContextMenu={(e) => e.preventDefault()}>
      {/* Redesigned Header for Branding Consistency */}
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

          <div className="flex-1 flex justify-center items-center gap-4">
            <div className="flex items-center gap-3 bg-gray-50 px-4 py-1.5 rounded-2xl border border-gray-100 shadow-inner">
              <button onClick={skipBackward} className="hover:bg-gray-200 p-1.5 rounded-full transition-all text-gray-500"><RotateCcw size={16} /></button>
              <audio 
                ref={audioRef}
                src={currentPart?.audio_url}
                onPlay={handleAudioPlay}
                onPause={handleAudioPause}
                controls
                className="h-8 w-40 md:w-56"
              />
              <button onClick={skipForward} className="hover:bg-gray-200 p-1.5 rounded-full transition-all text-gray-500"><RotateCw size={16} /></button>
            </div>
          </div>

          <div className="flex items-center space-x-3 flex-1 justify-end min-w-0">
            <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1 rounded-lg whitespace-nowrap border border-gray-100 shadow-sm">
              <Clock className="w-4 h-4 text-gray-500" />
              <div className="flex items-center space-x-1">
                <span className="text-sm font-mono font-black text-gray-700">
                  {formatTime(timeLeft)}
                </span>
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

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-white" onMouseUp={handleTextSelection}>
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="bg-gray-50 p-6 rounded-2xl mb-10 border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <h2 className="font-black text-xl text-gray-900 mb-1 uppercase tracking-tight">Part {currentPartIndex + 1}</h2>
              <p className="text-sm text-gray-600 font-medium">Questions {questions.indexOf(partQuestions[0]) + 1}-{questions.indexOf(partQuestions[partQuestions.length - 1]) + 1}</p>
            </div>
            <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-full border border-blue-100 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] shadow-sm">
              <Info className="w-3.5 h-3.5" />
              Listen and answer
            </div>
          </div>

          <div className="space-y-12">
            <div className="p-8 bg-white border-2 border-dashed border-gray-200 rounded-3xl">
              <p className="text-[15px] font-black text-gray-800 mb-4 uppercase tracking-widest flex items-center gap-2">
                <Clipboard className="w-4 h-4 text-[#74b602]" />
                Instructions
              </p>
              <p className="text-[16px] leading-relaxed text-gray-700 font-medium">
                Complete the notes below. Write <strong className="text-[#d32f2f]">ONE WORD AND/OR A NUMBER</strong> for each answer.
              </p>
            </div>

            <div className="space-y-8">
              {partQuestions.map((q, idx) => (
                <div key={q.id} id={`q-${q.id}`} className="group flex items-start gap-6 p-8 bg-gray-50/50 hover:bg-white rounded-3xl border border-gray-100 transition-all hover:border-[#74b602]/30 shadow-sm hover:shadow-xl hover:-translate-y-1">
                  <div className="w-10 h-10 rounded-2xl bg-[#74b602] flex items-center justify-center font-black text-white shadow-lg shadow-[#74b602]/20 shrink-0">
                    {questions.indexOf(q) + 1}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-[18px] font-bold text-gray-800 mb-6 leading-relaxed">{q.question_text}</p>
                    {q.question_type === 'multiple_choice' ? (
                      <div className="grid sm:grid-cols-2 gap-4">
                        {(q.options || []).map((opt: string, oIdx: number) => (
                          <label key={oIdx} className={cn(
                            "flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all",
                            answers[q.id] === opt 
                              ? "bg-[#74b602]/5 border-[#74b602] shadow-md shadow-[#74b602]/10" 
                              : "bg-white border-gray-100 hover:border-gray-200"
                          )}>
                            <div className={cn(
                              "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                              answers[q.id] === opt ? "border-[#74b602] bg-[#74b602]" : "border-gray-300"
                            )}>
                              {answers[q.id] === opt && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                            <input 
                              type="radio" 
                              name={`q-${q.id}`}
                              checked={answers[q.id] === opt}
                              onChange={() => onAnswerChange(q.id, opt)}
                              className="sr-only"
                            />
                            <span className="text-[15px] font-bold text-gray-700">{opt}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="relative max-w-lg">
                        <input 
                          type="text"
                          className="w-full h-14 px-6 bg-white border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#74b602] transition-all font-black text-[17px] text-gray-900 shadow-inner"
                          value={answers[q.id] || ""}
                          onChange={(e) => onAnswerChange(q.id, e.target.value)}
                          placeholder="Type your answer..."
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer redesigned based on Reading/Writing style */}
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

      {/* Highlighting Tools */}
      {highlightMenu.show && (
        <div 
          className="fixed z-[300] bg-gray-900 text-white border border-white/10 px-1 py-1 rounded-xl shadow-2xl flex items-center gap-1 animate-in fade-in zoom-in duration-200"
          style={{ left: highlightMenu.x, top: highlightMenu.y, transform: 'translate(-50%, -100%)' }}
        >
          <button 
            onClick={addHighlight}
            className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
          >
            Highlight
          </button>
          <div className="w-px h-4 bg-white/10" />
          <button 
            onClick={handleAddNote}
            className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
          >
            Add Note
          </button>
        </div>
      )}

      {clearHighlightMenu.show && (
        <div 
          className="fixed z-[300] bg-gray-900 text-white border border-white/10 px-1 py-1 rounded-xl shadow-2xl flex items-center gap-1 animate-in fade-in zoom-in duration-200"
          style={{ left: clearHighlightMenu.x, top: clearHighlightMenu.y, transform: 'translate(-50%, -100%)' }}
        >
          <button 
            onClick={removeHighlight}
            className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-400/10 rounded-lg transition-colors flex items-center gap-2"
          >
            Clear
          </button>
        </div>
      )}

      {/* Note Dialog */}
      {showNoteDialog && (
        <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in slide-in-from-bottom-8 duration-500">
            <div className="bg-gray-900 p-6 flex items-center justify-between">
              <h3 className="text-white text-xs font-black uppercase tracking-[0.2em]">Add Personal Note</h3>
              <button onClick={() => setShowNoteDialog(false)} className="text-white/60 hover:text-white transition-colors"><X size={18} /></button>
            </div>
            <div className="p-8">
              <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100 italic text-sm text-gray-500">
                "{selectedText}"
              </div>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="w-full h-40 p-4 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-red-600 text-base font-medium resize-none transition-all"
                placeholder="Type your notes here..."
                autoFocus
              />
              <div className="mt-8 flex gap-4">
                <button 
                  onClick={() => setShowNoteDialog(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveNote}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all"
                >
                  Save Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      <style jsx global>{`
        audio::-webkit-media-controls-enclosure { background-color: transparent; }
        audio::-webkit-media-controls-panel { background-color: transparent; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
