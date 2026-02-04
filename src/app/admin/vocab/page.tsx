"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Brain, Plus, Trash2, Edit, Loader2, Search, CheckCircle2, X, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Word {
  id: string;
  word: string;
  meaning_bn: string;
  meaning_en: string;
  example_sentence: string;
  pronunciation: string;
  part_of_speech: string;
  is_free: boolean;
}

export default function AdminVocabPage() {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [formData, setFormData] = useState({
    word: "",
    meaning_bn: "",
    meaning_en: "",
    example_sentence: "",
    pronunciation: "",
    part_of_speech: "noun",
    is_free: true
  });

    const fetchWords = useCallback(async (signal?: AbortSignal) => {
      const supabase = createClient();
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("vocabulary_words")
          .select("*")
          .order("created_at", { ascending: false })
          .abortSignal(signal!);
        
        if (signal?.aborted) return;
        if (error) throw error;
        if (data) setWords(data);
      } catch (err: any) {
        if (err.name === "AbortError" || signal?.aborted || err.message?.toLowerCase().includes("abort")) return;
        console.error("Error fetching words:", err);
        toast.error("Failed to load vocabulary");
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchWords(controller.signal);
    return () => controller.abort();
  }, [fetchWords]);

  const filteredWords = words.filter(w => 
    w.word.toLowerCase().includes(search.toLowerCase()) ||
    w.meaning_bn.includes(search) ||
    w.meaning_en.toLowerCase().includes(search.toLowerCase())
  );

  const openModal = (word?: Word) => {
    if (word) {
      setEditingWord(word);
      setFormData({
        word: word.word,
        meaning_bn: word.meaning_bn,
        meaning_en: word.meaning_en,
        example_sentence: word.example_sentence,
        pronunciation: word.pronunciation,
        part_of_speech: word.part_of_speech,
        is_free: word.is_free
      });
    } else {
      setEditingWord(null);
      setFormData({
        word: "",
        meaning_bn: "",
        meaning_en: "",
        example_sentence: "",
        pronunciation: "",
        part_of_speech: "noun",
        is_free: true
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.word || !formData.meaning_bn) {
      toast.error("শব্দ ও বাংলা অর্থ আবশ্যক");
      return;
    }

    const supabase = createClient();

    if (editingWord) {
      const { error } = await supabase
        .from("vocabulary_words")
        .update(formData)
        .eq("id", editingWord.id);
      
      if (error) {
        toast.error("আপডেট করতে সমস্যা হয়েছে");
      } else {
        toast.success("শব্দ আপডেট হয়েছে");
        fetchWords();
        setShowModal(false);
      }
    } else {
      const { error } = await supabase
        .from("vocabulary_words")
        .insert(formData);
      
      if (error) {
        toast.error("যোগ করতে সমস্যা হয়েছে");
      } else {
        toast.success("নতুন শব্দ যোগ হয়েছে");
        fetchWords();
        setShowModal(false);
      }
    }
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("vocabulary_words")
      .delete()
      .eq("id", id);
    
    if (error) {
      toast.error("ডিলিট করতে সমস্যা হয়েছে");
    } else {
      toast.success("শব্দ ডিলিট হয়েছে");
      fetchWords();
    }
  };

  const toggleFree = async (word: Word) => {
    const supabase = createClient();
    await supabase
      .from("vocabulary_words")
      .update({ is_free: !word.is_free })
      .eq("id", word.id);
    fetchWords();
  };

  const freeCount = words.filter(w => w.is_free).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
            <Brain className="h-7 w-7 text-purple-500" />
            ভোকাবুলারি
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            মোট {words.length}টি শব্দ | {freeCount}টি ফ্রি
          </p>
        </div>
        <Button onClick={() => openModal()} className="h-11 px-6 font-bold rounded-xl">
          <Plus className="h-4 w-4 mr-2" />
          নতুন শব্দ
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="শব্দ খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 rounded-xl"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWords.map((word) => (
          <div key={word.id} className="p-5 rounded-2xl border border-border/50 bg-card hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold">{word.word}</h3>
                <p className="text-xs text-muted-foreground">{word.pronunciation}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleFree(word)}
                  className={`text-xs font-bold px-2 py-1 rounded-full ${
                    word.is_free 
                      ? "bg-green-500/10 text-green-500" 
                      : "bg-orange-500/10 text-orange-500"
                  }`}
                >
                  {word.is_free ? "ফ্রি" : "প্রিমিয়াম"}
                </button>
              </div>
            </div>
            <p className="text-sm font-bold text-primary mb-1">{word.meaning_bn}</p>
            <p className="text-xs text-muted-foreground mb-3">{word.meaning_en}</p>
            <p className="text-xs text-muted-foreground italic mb-4 line-clamp-2">
              &quot;{word.example_sentence}&quot;
            </p>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {word.part_of_speech}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openModal(word)}
                  className="h-8 w-8 rounded-lg bg-secondary/50 text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(word.id)}
                  className="h-8 w-8 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">
                {editingWord ? "শব্দ এডিট করুন" : "নতুন শব্দ যোগ করুন"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold mb-2 block">শব্দ (English)</label>
                <Input
                  value={formData.word}
                  onChange={(e) => setFormData({ ...formData, word: e.target.value })}
                  placeholder="e.g., Ubiquitous"
                  className="h-11 rounded-xl"
                />
              </div>

              <div>
                <label className="text-sm font-bold mb-2 block">উচ্চারণ</label>
                <Input
                  value={formData.pronunciation}
                  onChange={(e) => setFormData({ ...formData, pronunciation: e.target.value })}
                  placeholder="e.g., /juːˈbɪkwɪtəs/"
                  className="h-11 rounded-xl"
                />
              </div>

              <div>
                <label className="text-sm font-bold mb-2 block">বাংলা অর্থ</label>
                <Input
                  value={formData.meaning_bn}
                  onChange={(e) => setFormData({ ...formData, meaning_bn: e.target.value })}
                  placeholder="সর্বব্যাপী"
                  className="h-11 rounded-xl"
                />
              </div>

              <div>
                <label className="text-sm font-bold mb-2 block">English Meaning</label>
                <Input
                  value={formData.meaning_en}
                  onChange={(e) => setFormData({ ...formData, meaning_en: e.target.value })}
                  placeholder="Present everywhere"
                  className="h-11 rounded-xl"
                />
              </div>

              <div>
                <label className="text-sm font-bold mb-2 block">উদাহরণ বাক্য</label>
                <Textarea
                  value={formData.example_sentence}
                  onChange={(e) => setFormData({ ...formData, example_sentence: e.target.value })}
                  placeholder="Smartphones have become ubiquitous in modern society."
                  className="rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold mb-2 block">Part of Speech</label>
                  <select
                    value={formData.part_of_speech}
                    onChange={(e) => setFormData({ ...formData, part_of_speech: e.target.value })}
                    className="w-full h-11 rounded-xl border border-border bg-background px-3"
                  >
                    <option value="noun">Noun</option>
                    <option value="verb">Verb</option>
                    <option value="adjective">Adjective</option>
                    <option value="adverb">Adverb</option>
                    <option value="preposition">Preposition</option>
                    <option value="conjunction">Conjunction</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-bold mb-2 block">স্ট্যাটাস</label>
                  <select
                    value={formData.is_free ? "free" : "premium"}
                    onChange={(e) => setFormData({ ...formData, is_free: e.target.value === "free" })}
                    className="w-full h-11 rounded-xl border border-border bg-background px-3"
                  >
                    <option value="free">ফ্রি</option>
                    <option value="premium">প্রিমিয়াম</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1 h-11 rounded-xl font-bold">
                  বাতিল
                </Button>
                <Button onClick={handleSave} className="flex-1 h-11 rounded-xl font-bold">
                  {editingWord ? "আপডেট করুন" : "যোগ করুন"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
