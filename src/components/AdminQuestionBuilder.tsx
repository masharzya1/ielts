"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  HelpCircle, 
  Table as TableIcon, 
  Image as ImageIcon,
  Layout,
  Type,
  List
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface AdminQuestionBuilderProps {
  initialData?: any;
  onSave: (data: any) => void;
  sectionType: string;
}

export default function AdminQuestionBuilder({
  initialData,
  onSave,
  sectionType
}: AdminQuestionBuilderProps) {
  const [data, setData] = useState({
    question_type: initialData?.question_type || "multiple_choice",
    question_text: initialData?.question_text || "",
    options: initialData?.options || ["", "", "", ""],
    correct_answer: initialData?.correct_answer || "",
    points: initialData?.points || 1,
    explanation: initialData?.explanation || "",
    ...initialData
  });

  const questionPresets = [
    { label: "MCQ", type: "multiple_choice", icon: <List className="h-4 w-4" /> },
    { label: "Sentence Completion", type: "gap_fill", icon: <Type className="h-4 w-4" /> },
    { label: "True / False / Not Given", type: "true_false_ng", icon: <HelpCircle className="h-4 w-4" /> },
    { label: "Matching / Classification", type: "matching", icon: <Layout className="h-4 w-4" /> },
  ];

  const applyPreset = (preset: any) => {
    let newData = { ...data, question_type: preset.type };
    
    if (preset.type === "true_false_ng") {
      newData.options = ["True", "False", "Not Given"];
      newData.question_text = "Do the following statements agree with the information given in the Reading Passage?";
    } else if (preset.type === "multiple_choice") {
      newData.options = ["", "", "", ""];
    } else if (preset.type === "gap_fill") {
      newData.options = [];
      if (!newData.question_text.includes("[[")) {
        newData.question_text += " Complete the sentence below: [[1]]";
      }
    }
    
    setData(newData);
    toast.info(`Applied ${preset.label} preset`);
  };

    const placeholders = data.question_text.match(/\[\[H?\d+\]\]/g) || [];

    const handleGapFillAnswerChange = (index: number, val: string) => {
      const currentAnswers = data.correct_answer.split(",").map(s => s.trim());
      while (currentAnswers.length < placeholders.length) currentAnswers.push("");
      currentAnswers[index] = val;
      setData({ ...data, correct_answer: currentAnswers.join(", ") });
    };

  const insertTable = () => {
    const tableHtml = `
<table class="border-collapse border border-gray-300 w-full my-4">
  <thead>
    <tr class="bg-gray-100">
      <th class="border border-gray-300 p-2 text-left">Header 1</th>
      <th class="border border-gray-300 p-2 text-left">Header 2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="border border-gray-300 p-2">Data 1</td>
      <td class="border border-gray-300 p-2">Data 2</td>
    </tr>
  </tbody>
</table>`;
    setData({ ...data, question_text: data.question_text + tableHtml });
  };

  return (
    <div className="space-y-6">
      {/* PRESETS */}
      <div className="space-y-3">
        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Quick Presets</Label>
        <div className="flex flex-wrap gap-2">
          {questionPresets.map(preset => (
            <Button
              key={preset.type}
              variant={data.question_type === preset.type ? "default" : "outline"}
              size="sm"
              onClick={() => applyPreset(preset)}
              className="gap-2"
            >
              {preset.icon}
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Question Type</Label>
            <Select value={data.question_type} onValueChange={(v) => setData({ ...data, question_type: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                <SelectItem value="gap_fill">Gap Fill</SelectItem>
                <SelectItem value="true_false_ng">True/False/Not Given</SelectItem>
                <SelectItem value="yes_no_ng">Yes/No/Not Given</SelectItem>
                    <SelectItem value="matching">Matching (Generic)</SelectItem>
                    <SelectItem value="matching_headings">Matching Headings</SelectItem>
                    <SelectItem value="paragraph_matching">Paragraph matching</SelectItem>
                    <SelectItem value="matching_features">Matching Features</SelectItem>
                    <SelectItem value="matching_sentence_endings">Matching Sentence Endings</SelectItem>

                <SelectItem value="short_answer">Short Answer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Question Text</Label>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={insertTable} title="Insert Table">
                  <TableIcon className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setData({...data, question_text: data.question_text + "[[1]]"})} title="Insert Placeholder">
                  <Type className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <Textarea 
              value={data.question_text} 
              onChange={e => setData({ ...data, question_text: e.target.value })}
              className="min-h-[120px] font-sans text-sm leading-relaxed"
              placeholder="Enter question text here... use [[1]] for gaps."
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Points</Label>
            <Input 
              type="number" 
              value={data.points} 
              onChange={e => setData({ ...data, points: parseInt(e.target.value) })} 
            />
          </div>

          {data.question_type === "multiple_choice" || data.question_type === "true_false_ng" || data.question_type === "yes_no_ng" ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Options</Label>
                {data.question_type === "multiple_choice" && (
                  <Button variant="ghost" size="sm" onClick={() => setData({ ...data, options: [...data.options, ""] })} className="h-6 px-2 text-[10px]">
                    <Plus className="h-3 w-3 mr-1" /> ADD OPTION
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                {data.options.map((opt: string, i: number) => (
                  <div key={i} className="flex gap-2 items-center">
                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                      {String.fromCharCode(65 + i)}
                    </div>
                    <Input 
                      value={opt} 
                      onChange={e => {
                        const newOpts = [...data.options];
                        newOpts[i] = e.target.value;
                        setData({ ...data, options: newOpts });
                      }}
                      className="h-9 text-sm"
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => {
                        const newOpts = data.options.filter((_: any, idx: number) => idx !== i);
                        setData({ ...data, options: newOpts });
                      }}
                      className="h-8 w-8 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="space-y-2 mt-4 pt-4 border-t">
                <Label className="text-xs font-bold text-primary">Correct Option</Label>
                <Select value={data.correct_answer} onValueChange={v => setData({ ...data, correct_answer: v })}>
                  <SelectTrigger className="h-9 border-primary/20">
                    <SelectValue placeholder="Select correct option" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.options.map((opt: string, i: number) => (
                      <SelectItem key={i} value={opt || `Option ${i+1}`}>{opt || `Option ${i+1}`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : data.question_type === "gap_fill" ? (
            <div className="space-y-4">
              <Label>Correct Answers for Gaps</Label>
              {placeholders.length > 0 ? (
                <div className="space-y-3">
                  {placeholders.map((p, i) => (
                    <div key={i} className="space-y-1">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase">{p}</Label>
                      <Input 
                        placeholder={`Answer for gap ${i + 1}`}
                        value={data.correct_answer.split(",").map(s => s.trim())[i] || ""}
                        onChange={e => handleGapFillAnswerChange(i, e.target.value)}
                        className="h-9"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-destructive/10 text-destructive text-xs rounded-lg border border-destructive/20 italic">
                  No [[n]] placeholders found in question text. Please add them to define where the input boxes should appear.
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Correct Answer</Label>
              <Input 
                value={data.correct_answer} 
                onChange={e => setData({ ...data, correct_answer: e.target.value })}
                placeholder="Type the exact correct answer"
              />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2 pt-4 border-t">
        <Label>Explanation (Visible in results)</Label>
        <Textarea 
          value={data.explanation} 
          onChange={e => setData({ ...data, explanation: e.target.value })}
          className="min-h-[80px] text-sm"
          placeholder="Explain why this answer is correct..."
        />
      </div>

      <Button onClick={() => onSave(data)} className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20">
        <Plus className="h-4 w-4 mr-2" /> {initialData ? "Update Question" : "Add to Test"}
      </Button>
    </div>
  );
}
