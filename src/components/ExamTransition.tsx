"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Shield, Cpu, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExamTransitionProps {
  isOpen: boolean;
  onComplete: () => void;
  testTitle: string;
  sectionTitle: string;
}

export default function ExamTransition({
  isOpen,
  onComplete,
  testTitle,
  sectionTitle
}: ExamTransitionProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      const timer1 = setTimeout(() => setStep(2), 2000);
      const timer2 = setTimeout(() => setStep(3), 4000);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    } else {
      setStep(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center overflow-hidden font-sans">
      {/* Background Animation */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#3b82f6_0%,transparent_50%)] animate-pulse" />
        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="text-center space-y-6 max-w-md px-6"
          >
            <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-primary/30">
              <Sparkles className="w-10 h-10 text-primary animate-pulse" />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight leading-tight">
              স্মার্ট থিম পরিবর্তন হচ্ছে...
            </h2>
            <p className="text-gray-400 text-lg">
              আমরা আপনাকে আসল পরীক্ষার অভিজ্ঞতা দিতে <span className="text-primary font-bold">Official Exam Interface</span>-এ সুইচ করছি।
            </p>
            <div className="flex justify-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, x: -100 }}
            className="text-center space-y-8 max-w-lg px-6"
          >
            <div className="flex justify-center gap-6 mb-4">
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center border border-green-500/30">
                  <Shield className="w-6 h-6 text-green-500" />
                </div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Security Enabled</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                  <Cpu className="w-6 h-6 text-blue-500" />
                </div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">CDI Engine Ready</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-primary uppercase tracking-[0.3em]">Environment Ready</h3>
              <h2 className="text-4xl font-black text-white">{sectionTitle}</h2>
              <p className="text-gray-500 font-medium">{testTitle}</p>
            </div>

            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 text-left">
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm text-gray-300 font-medium">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  IDP/British Council Style Interface
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300 font-medium">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  Split-Screen for Reading Passages
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300 font-medium">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  Copy/Paste and Right-click Disabled
                </li>
              </ul>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-8"
          >
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-pulse" />
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">প্রবেশ করুন...</h2>
              <Button 
                onClick={onComplete}
                size="lg"
                className="h-14 px-10 rounded-2xl text-lg font-black bg-primary text-black hover:bg-primary/90 shadow-[0_0_30px_rgba(59,130,246,0.3)] group"
              >
                পরীক্ষা শুরু করুন
                <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
