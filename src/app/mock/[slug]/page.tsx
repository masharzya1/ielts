"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Clock,
  Headphones,
  BookOpen,
  PenTool,
  Loader2,
  CheckCircle2,
  Users,
  Activity,
  Lock,
  AlertCircle,
} from "lucide-react";
import { addMinutes, differenceInSeconds } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import IELTSPracticeBDInterface from "@/components/IELTSPracticeBDInterface";
import Link from "next/link";

interface TestSection {
  id: string;
  section_type: string;
  title: string;
  time_limit: number;
  instructions: string;
  parts?: any[];
}

type Mode =
  | "joining"
  | "exam"
  | "waiting"
  | "submitted_waiting"
  | "finished_waiting"
  | "finished";

export default function MockTestEnginePage({ params }: { params: any }) {
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    async function unwrapParams() {
      const p = await params;
      setSlug(p.slug);
    }
    unwrapParams();
  }, [params]);

  const [test, setTest] = useState<any>(null);
  const [sections, setSections] = useState<TestSection[]>([]);
  const [activeSection, setActiveSection] = useState<TestSection | null>(null);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [parts, setParts] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [mode, setMode] = useState<Mode>("joining");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [presenceCount, setPresenceCount] = useState(0);
  const [isStrict, setIsStrict] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [moduleSubmitted, setModuleSubmitted] = useState<
    Record<string, boolean>
  >({});
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const moduleSubmittedRef = useRef<Record<string, boolean>>({});
  const modeRef = useRef<Mode>("joining");
  const currentIndexRef = useRef<number>(-1);
  const testRef = useRef<any>(null);

  useEffect(() => {
    moduleSubmittedRef.current = moduleSubmitted;
  }, [moduleSubmitted]);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);
  useEffect(() => {
    testRef.current = test;
  }, [test]);

  const enterFullscreen = () => {
    if (typeof document === "undefined") return;
    const element = document.documentElement;
    const requestMethod =
      element.requestFullscreen ||
      (element as any).webkitRequestFullscreen ||
      (element as any).mozRequestFullScreen ||
      (element as any).msRequestFullscreen;

    if (requestMethod) {
      requestMethod.call(element).catch(() => {
        console.warn("Fullscreen request failed");
      });
    }
  };

  useEffect(() => {
    if (isStrict && !isFullscreen) {
      const handleFullscreenChange = () => {
        if (!document.fullscreenElement) {
          setIsFullscreen(false);
          setWarning(
            "CRITICAL: Fullscreen mode exited! Please re-enter fullscreen to continue."
          );
        } else {
          setIsFullscreen(true);
          setWarning(null);
        }
      };
      document.addEventListener("fullscreenchange", handleFullscreenChange);
      return () =>
        document.removeEventListener(
          "fullscreenchange",
          handleFullscreenChange
        );
    }
  }, [isStrict, isFullscreen]);

  const [passageSync, setPassageSync] = useState<Record<string, string>>({});
  const [highlights, setHighlights] = useState<Record<string, any>>({});
  const [notes, setNotes] = useState<any[]>([]);

  const logActivity = async (type: string, testName: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("user_activities").insert({
        user_name: user.user_metadata?.full_name || user.email?.split("@")[0],
        activity_type: type,
        test_name: testName,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Activity logging failed", err);
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (mode === "exam" || mode === "waiting" || mode === "joining") {
        e.preventDefault();
        e.returnValue =
          "আপনি কি সত্যিই পেজ ছেড়ে যেতে চান? আপনার প্রগ্রেস সেভ করা আছে।";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [mode]);

  useEffect(() => {
    if (test?.id) {
      if (Object.keys(answers).length > 0) {
        localStorage.setItem(
          `mock_answers_${test.id}`,
          JSON.stringify(answers)
        );
      }
      if (Object.keys(moduleSubmitted).length > 0) {
        localStorage.setItem(
          `mock_progress_${test.id}`,
          JSON.stringify(moduleSubmitted)
        );
      }
      if (Object.keys(highlights).length > 0) {
        localStorage.setItem(
          `mock_highlights_${test.id}`,
          JSON.stringify(highlights)
        );
      }
      if (notes.length > 0) {
        localStorage.setItem(`mock_notes_${test.id}`, JSON.stringify(notes));
      }
      if (mode === "exam" || mode === "waiting" || mode === "joining") {
        localStorage.setItem(`joined_mock_${test.id}`, "true");
        localStorage.setItem(
          `joined_timestamp_${test.id}`,
          Date.now().toString()
        );
      }
    }
  }, [answers, moduleSubmitted, highlights, notes, mode, test?.id]);

  useEffect(() => {
    if (!test?.id || mode !== "exam") return;

    const syncInterval = setInterval(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("mock_results").upsert(
        {
          user_id: user.id,
          test_id: test.id,
          answers: answers,
          is_published: false,
          overall_band: 0,
          metadata: {
            last_sync: new Date().toISOString(),
            module_progress: moduleSubmitted,
            highlights: highlights,
            notes: notes,
            current_time: timeLeft,
            active_section: activeSection?.id,
            passages: passageSync,
          },
        },
        { onConflict: "user_id,test_id" }
      );
      if (error) {
        console.error("mock_results upsert failed:", error);
      }
    }, 5000);

    return () => clearInterval(syncInterval);
  }, [
    answers,
    moduleSubmitted,
    highlights,
    notes,
    timeLeft,
    activeSection,
    test?.id,
    mode,
    passageSync,
  ]);

  useEffect(() => {
    if (!slug) return; // Wait for slug to be available
    const loadTest = async () => {
      try {
        await fetchInitialData();
      } catch (error) {
        console.error("❌ Failed to load test:", error);
        toast.error("Test load করতে পারছি না। Reload করো।");
        setLoading(false);
      }
    };
    loadTest();
  }, [slug]); // Depend on slug

  async function fetchInitialData() {
    console.log("🔄 Starting test load for slug:", slug);
    try {
      setLoading(true);
      // Use getSession instead of getUser to avoid hanging network request
      const {
        data: { session },
        error: authError,
      } = await supabase.auth.getSession();
      if (authError || !session?.user) {
        router.push("/login");
        return;
      }
      const user = session.user;

      const { data: testData, error: testError } = await supabase
        .from("mock_tests")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (testError || !testData) {
        toast.error("Test not found");
        router.push("/mock");
        return;
      }

      setTest(testData);

      const savedAnswers = localStorage.getItem(`mock_answers_${testData.id}`);
      const savedProgress = localStorage.getItem(
        `mock_progress_${testData.id}`
      );
      const savedHighlights = localStorage.getItem(
        `mock_highlights_${testData.id}`
      );
      const savedNotes = localStorage.getItem(`mock_notes_${testData.id}`);
      const hasJoinedLocal =
        localStorage.getItem(`joined_mock_${testData.id}`) === "true";

      const { data: existingResult } = await supabase
        .from("mock_results")
        .select("*")
        .eq("user_id", user.id)
        .eq("test_id", testData.id)
        .maybeSingle();

      if (existingResult) {
        if (existingResult.answers) setAnswers(existingResult.answers);
        if (existingResult.metadata?.module_progress)
          setModuleSubmitted(existingResult.metadata.module_progress);
        if (existingResult.metadata?.highlights)
          setHighlights(existingResult.metadata.highlights);
        if (existingResult.metadata?.notes)
          setNotes(existingResult.metadata.notes);
      } else {
        if (savedAnswers) setAnswers(JSON.parse(savedAnswers));
        if (savedProgress) setModuleSubmitted(JSON.parse(savedProgress));
        if (savedHighlights) setHighlights(JSON.parse(savedHighlights));
        if (savedNotes) setNotes(JSON.parse(savedNotes));
      }

      const hasJoined = hasJoinedLocal || !!existingResult;

      if (testData.scheduled_at && !hasJoined) {
        const start = new Date(testData.scheduled_at);
        const now = new Date();
        const secondsSinceStart = differenceInSeconds(now, start);
        if (secondsSinceStart > 180) {
          toast.error(
            "এই মক টেস্টে জয়েন করার সময় শেষ হয়ে গেছে (৩ মিনিট সময় পার হয়ে গেছে)"
          );
          router.push("/mock");
          return;
        }
      }

      const { data: sectionsData } = await supabase
        .from("test_sections")
        .select("*")
        .eq("test_id", testData.id)
        .order("order_index");

      if (sectionsData && sectionsData.length > 0) {
        // Sort sections to ensure Listening -> Reading -> Writing
        const orderMap: Record<string, number> = {
          listening: 0,
          reading: 1,
          writing: 2,
        };
        const sortedSections = [...sectionsData].sort((a, b) => {
          const orderA = orderMap[a.section_type.toLowerCase()] ?? 99;
          const orderB = orderMap[b.section_type.toLowerCase()] ?? 99;
          return orderA - orderB;
        });

        setSections(sortedSections);

        const now = new Date();
        const scheduledStart = new Date(testData.scheduled_at);
        const waitingHallEnd = addMinutes(scheduledStart, 3);

        if (now < waitingHallEnd) {
          setMode("joining");
          setTimeLeft(differenceInSeconds(waitingHallEnd, now));
          if (now >= scheduledStart) {
            enterFullscreen();
            setIsStrict(true);
          }
        } else {
          // Calculate where we should be in the global timeline starting from waitingHallEnd
          let currentGlobalTime = waitingHallEnd;
          let foundPosition = false;

          for (let i = 0; i < sortedSections.length; i++) {
            const section = sortedSections[i];
            const sectionEnd = addMinutes(
              currentGlobalTime,
              section.time_limit
            );

            if (now < sectionEnd) {
              const sectionType = section.section_type;
              const progress =
                existingResult?.metadata?.module_progress ||
                (savedProgress ? JSON.parse(savedProgress) : {});

              if (progress[sectionType]) {
                setMode("submitted_waiting");
              } else {
                setMode("exam");
                enterFullscreen();
                await startModule(i, sortedSections);
              }
              setTimeLeft(differenceInSeconds(sectionEnd, now));
              foundPosition = true;
              break;
            }

            currentGlobalTime = sectionEnd;

            if (i < sortedSections.length - 1) {
              const breakEnd = addMinutes(currentGlobalTime, 2);
              if (now < breakEnd) {
                setMode("waiting");
                setCurrentIndex(i + 1);
                setActiveSection(sortedSections[i + 1]);
                setTimeLeft(differenceInSeconds(breakEnd, now));
                foundPosition = true;
                break;
              }
              currentGlobalTime = breakEnd;
            }
          }

          if (!foundPosition) {
            setMode("finished");
          }
        }
      }

      const channel = supabase.channel(`mock_presence_${testData.id}`, {
        config: { presence: { key: user.id } },
      });
      channel
        .on("presence", { event: "sync" }, () => {
          setPresenceCount(Object.keys(channel.presenceState()).length);
        })
        .subscribe(async (status:string) => {
          if (status === "SUBSCRIBED") {
            await channel.track({
              joined_at: new Date().toISOString(),
              email: user.email,
            });
          }
        });

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  useEffect(() => {
    if (mode === "finished" || !test || sections.length === 0) return;

    const interval = setInterval(() => {
      const now = new Date();
      const scheduledStart = new Date(test.scheduled_at);
      const waitingHallEnd = addMinutes(scheduledStart, 3);

      let currentGlobalTime = waitingHallEnd;
      let targetMode: Mode = "joining";
      let targetSectionIdx = -1;
      let targetTimeLeft = 0;

      if (now < waitingHallEnd) {
        targetMode = "joining";
        targetTimeLeft = differenceInSeconds(waitingHallEnd, now);
      } else {
        let found = false;

        for (let i = 0; i < sections.length; i++) {
          const section = sections[i];
          const sectionEnd = addMinutes(currentGlobalTime, section.time_limit);
          const breakEnd =
            i < sections.length - 1 ? addMinutes(sectionEnd, 2) : sectionEnd;

          // Inside module time
          if (now < sectionEnd) {
            targetSectionIdx = i;

            if (moduleSubmittedRef.current[section.section_type]) {
              // If submitted early, show one continuous countdown:
              // remaining module time + (rest time if there's a next module)
              targetMode = "submitted_waiting";
              targetTimeLeft = differenceInSeconds(breakEnd, now);
            } else {
              targetMode = "exam";
              targetTimeLeft = differenceInSeconds(sectionEnd, now);
            }

            found = true;
            break;
          }

          // Break after module (only if there is a next module)
          if (i < sections.length - 1 && now < breakEnd) {
            if (moduleSubmittedRef.current[section.section_type]) {
              // Keep the same submitted_waiting screen during the break as well
              targetMode = "submitted_waiting";
              targetSectionIdx = i;
              targetTimeLeft = differenceInSeconds(breakEnd, now);
            } else {
              targetMode = "waiting";
              targetSectionIdx = i + 1; // next module index
              targetTimeLeft = differenceInSeconds(breakEnd, now);
            }

            found = true;
            break;
          }

          // Move forward in global timeline
          currentGlobalTime = breakEnd;
        }

        if (!found) {
          targetMode = "finished";
          targetTimeLeft = 0;
        }
      }

      // Mode transitions
      if (modeRef.current !== targetMode) {
        const prevMode = modeRef.current;

        // If we're transitioning into finished, submit BEFORE mutating modeRef
        if (targetMode === "finished" && prevMode !== "finished") {
          handleSubmitTest();
        }

        setMode(targetMode);
        modeRef.current = targetMode;

        if (targetMode === "exam" && targetSectionIdx !== -1) {
          startModule(targetSectionIdx, sections);
        }
      }

      // Keep activeSection/currentIndex aligned with what we are showing
      if (targetSectionIdx !== -1) {
        if (currentIndexRef.current !== targetSectionIdx) {
          setCurrentIndex(targetSectionIdx);
          currentIndexRef.current = targetSectionIdx;
        }
        setActiveSection(sections[targetSectionIdx]);
      }

      setTimeLeft(targetTimeLeft);
    }, 1000);

    return () => clearInterval(interval);
  }, [test, sections]);

  const startModule = async (index: number, sectionsList: TestSection[]) => {
    const section = sectionsList[index];
    if (!section) return;

    setLoading(true);

    // simple timeout wrapper (12s)
    const withTimeout = async <T,>(
      promise: Promise<T>,
      ms = 12000
    ): Promise<T> => {
      return await Promise.race([
        promise,
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error("Module load timeout")), ms)
        ),
      ]);
    };

    try {
      // 1) parts
      const partsRes = await withTimeout(
        supabase
          .from("test_parts")
          .select("*")
          .eq("section_id", section.id)
          .order("order_index"), 60000);

      const { data: partsData, error: partsErr } = partsRes as any;
      if (partsErr) throw partsErr;

      const safeParts = (partsData || []).map((p: any) => ({
        ...p,
        question_groups: Array.isArray(p.question_groups)
          ? p.question_groups
          : p.question_groups
            ? [p.question_groups]
            : [],
      }));

      // 2) questions - ONE CALL (fast + less hang)
      const partIds = safeParts.map((p: any) => p.id).filter(Boolean);
      // Supabase query builders are "thenable" but their TS types don't always
      // play nicely with generics like withTimeout(). We cast the awaited result
      // to keep TypeScript happy and avoid "unknown" destructuring errors.
      const qRes = (await withTimeout(
        (supabase
          .from("questions")
          .select("*")
          .in(
            "part_id",
            partIds.length ? partIds : ["00000000-0000-0000-0000-000000000000"]
          )
          .order("order_index") as any),
        60000
      )) as any;
      const { data: allQuestions, error: qErr } = qRes;

      if (qErr) throw qErr;

      setParts(safeParts);
      setQuestions(allQuestions || []);

      setCurrentIndex(index);
      setActiveSection(section);
      setIsStrict(true);
    } catch (err: any) {
      console.error("startModule error:", err);
      toast.error("Module load করতে সমস্যা হচ্ছে। Retry দিন।");

      // IMPORTANT: loading stuck prevent
      // Keep mode as-is but stop overlay and allow retry
    } finally {
      setLoading(false);
    }
  };

  const handleModuleFinish = async () => {
    if (activeSection && test) {
      const type = activeSection.section_type;
      const nextProgress = { ...moduleSubmitted, [type]: true };
      setModuleSubmitted(nextProgress);
      moduleSubmittedRef.current = nextProgress;

      localStorage.setItem(
        `mock_progress_${test.id}`,
        JSON.stringify(nextProgress)
      );

      // If it's a writing module, trigger AI evaluation
      if (type === "writing") {
        const writingQuestions = questions.filter(q => q.question_type === "task1" || q.question_type === "task2");
        if (writingQuestions.length === 0) {
          // If no questions, try finding questions by part_id
          const partIds = parts.map((p) => p.id);
          const fallbackQuestions = questions.filter((q) =>
            partIds.includes(q.part_id)
          );
          writingQuestions.push(...fallbackQuestions);
        }

        for (const q of writingQuestions) {
          const answer = answers[q.id];
          const part = parts.find((p) => p.id === q.part_id);
          const imageUrl = part?.image_url;

          if (answer && answer.trim().length > 50) {
            fetch("/api/ai/evaluate-writing", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                questionId: q.id,
                questionText:
                  q.question_text || part?.passage_text || "IELTS Writing Task",
                taskType: writingQuestions.indexOf(q) === 0 ? "task1" : "task2",
                userAnswer: answer,
                imageUrl: imageUrl,
              }),
            }).catch((err) =>
              console.error("AI Evaluation request failed:", err)
            );
          }
        }
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { error: upsertError } = await supabase
            .from("mock_results")
            .upsert(
              {
                user_id: user.id,
                test_id: test.id,
                answers: answers,
                metadata: {
                  last_sync: new Date().toISOString(),
                  module_progress: nextProgress,
                  highlights: highlights,
                  notes: notes,
                  current_time: timeLeft,
                  active_section: activeSection.id,
                  passages: passageSync,
                  completed_at: new Date().toISOString(),
                },
              },
              { onConflict: "user_id,test_id" }
            );

          if (upsertError) {
            console.error("Failed to upsert mock results:", upsertError);
            toast.error(
              "প্রগ্রেস সেভ করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।"
            );
            return;
          }
        }
      } catch (err) {
        console.error(err);
      }

      setMode("submitted_waiting");
      modeRef.current = "submitted_waiting";
      toast.info(
        `আপনি সফলভাবে ${activeSection.title} জমা দিয়েছেন। সময় শেষ হলে পরবর্তী মডিউল অটোমেটিক শুরু হবে।`
      );

      // If it's the last module, finish the test immediately
      if (currentIndex === sections.length - 1) {
        handleSubmitTest();
      }
    }
  };

  const handleSubmitTest = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Calculate scores for objective sections
      let readingCorrect = 0;
      let listeningCorrect = 0;
      let totalReading = 0;
      let totalListening = 0;

      sections.forEach((s) => {
        const sQs = questions.filter((q) => q.section_id === s.id);
        if (s.section_type === "reading") totalReading += sQs.length;
        if (s.section_type === "listening") totalListening += sQs.length;

        sQs.forEach((q) => {
          const uAns = (answers[q.id] || "").toString().trim().toLowerCase();
          const cAns = (q.correct_answer || "")
            .split(",")
            .map((a: string) => a.trim().toLowerCase());
          if (cAns.includes(uAns) && uAns !== "") {
            if (s.section_type === "reading") readingCorrect++;
            if (s.section_type === "listening") listeningCorrect++;
          }
        });
      });

      const readingBand =
        totalReading > 0 ? (readingCorrect / totalReading) * 9 : 0;
      const listeningBand =
        totalListening > 0 ? (listeningCorrect / totalListening) * 9 : 0;

      // Writing band must come from AI evaluation (not manual/admin input).
      // At submission time we keep it NULL; your AI pipeline can update mock_results.writing_band later.
      const writingBand: number | null = null;

      const overallBand = (() => {
        const parts: number[] = [readingBand, listeningBand];
        if (typeof writingBand === "number") parts.push(writingBand);
        return parts.length ? parts.reduce((a, b) => a + b, 0) / parts.length : 0;
      })();


      const { error: upsertError } = await supabase.from("mock_results").upsert(
        {
          user_id: user.id,
          test_id: test.id,
          answers: answers,
          reading_score: readingCorrect,
          listening_score: listeningCorrect,
          reading_band: readingBand,
          listening_band: listeningBand,
          overall_band: overallBand,
          writing_band: writingBand,
          is_published: false,
          metadata: {
            completed_at: new Date().toISOString(),
            module_progress: moduleSubmitted,
            highlights: highlights,
            notes: notes,
            passages: passageSync,
            total_reading: totalReading,
            total_listening: totalListening,
          },
        },
        { onConflict: "user_id,test_id" }
      );

      if (upsertError) throw upsertError;

      logActivity("completed", test.title);
      toast.success("Test submitted successfully!");
      setMode("finished");
      setIsStrict(false);

      // Exit fullscreen
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(console.error);
      }

      localStorage.removeItem(`mock_answers_${test.id}`);
      localStorage.removeItem(`mock_progress_${test.id}`);
      localStorage.removeItem(`mock_highlights_${test.id}`);
      localStorage.removeItem(`mock_notes_${test.id}`);
      localStorage.removeItem(`joined_mock_${test.id}`);
      localStorage.removeItem(`joined_timestamp_${test.id}`);
    } catch (err) {
      console.error(err);
      toast.error("ফলাফল সেভ করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!isStrict) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block common devtools and navigation shortcuts
      const forbiddenKeys = [
        "F12",
        "F11",
        "F10",
        "F5",
        "r",
        "R",
        "u",
        "U",
        "i",
        "I",
        "j",
        "J",
        "c",
        "C",
        "v",
        "V",
        "s",
        "S",
        "p",
        "P",
      ];
      const isForbidden = forbiddenKeys.includes(e.key);
      const isControlOrMeta = e.ctrlKey || e.metaKey;
      const isAlt = e.altKey;

      if (isForbidden && (isControlOrMeta || e.key.startsWith("F"))) {
        e.preventDefault();
        setWarning("SECURITY ALERT: Forbidden shortcut detected!");
        setTimeout(() => setWarning(null), 3000);
        return false;
      }

      if (e.key === "Tab") {
        e.preventDefault();
        return false;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      setWarning("SECURITY ALERT: Right-click is disabled!");
      setTimeout(() => setWarning(null), 3000);
      return false;
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setWarning(
          "CRITICAL WARNING: Window/Tab switching detected! This event is logged."
        );
        logActivity(
          "tab_switch_warning",
          testRef.current?.title || "Mock Test"
        );
      }
    };

    // DevTools Detection (Heuristic)
    const threshold = 160;
    let devToolsWarningCount = 0;
    const checkDevTools = () => {
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;

      if (widthDiff > threshold || heightDiff > threshold) {
        if (!isDevToolsOpen) {
          setIsDevToolsOpen(true);
          setWarning(
            "SECURITY ALERT: Developer Tools detected! Close them immediately or you will be kicked out in 10 seconds."
          );
          devToolsWarningCount++;

          if (devToolsWarningCount > 10) {
            toast.error(
              "SECURITY VIOLATION: You have been kicked out of the test for using Developer Tools."
            );
            setTimeout(() => router.push("/mock"), 2000);
          }
        }
      } else {
        setIsDevToolsOpen(false);
        devToolsWarningCount = 0;
      }
    };

    const devToolsInterval = setInterval(checkDevTools, 1000);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Prevent dragging text
    const handleDragStart = (e: DragEvent) => e.preventDefault();
    document.addEventListener("dragstart", handleDragStart);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("dragstart", handleDragStart);
      clearInterval(devToolsInterval);
    };
  }, [isStrict, isDevToolsOpen]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading && mode !== "exam") {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">
          Loading test...
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
          className="mt-4"
        >
          Stuck? Reload
        </Button>
      </div>
    );
  }

  if (mode === "joining") {
    const isWaitingHall = test && new Date() >= new Date(test.scheduled_at);
    return (
      <div className="fixed inset-0 z-100 dark:bg-black bg-white flex flex-col items-center justify-center dark:text-white text-black bg p-6 font-hind-siliguri overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full animate-pulse delay-1000" />
        </div>

        <div className="max-w-3xl w-full text-center space-y-12 relative z-10">
          <div className="space-y-4">
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-black dark:text-white drop-shadow-2xl">
              {isWaitingHall ? "WAITING HALL" : "PREPARING"}
            </h1>
            <p className="text-xl md:text-2xl text-primary font-black uppercase tracking-[0.4em] drop-shadow-lg">
              {isWaitingHall
                ? "মক টেস্ট শুরু হতে যাচ্ছে"
                : "মক টেস্ট শুরু হতে বাকি"}
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-12 md:p-20 rounded-[4rem] shadow-2xl relative group transition-all duration-500 hover:border-primary/30">
            <div className="absolute inset-0 bg-primary/5 rounded-[4rem] animate-pulse group-hover:bg-primary/10 transition-colors" />
            <div className="relative space-y-8">
              <div className="text-8xl md:text-[12rem] font-black tracking-tighter dark:text-primary font-mono leading-none flex justify-center items-center gap-2">
                <span className="dark:drop-shadow-[0_0_30px_rgba(116,182,2,0.5)]">
                  {formatTime(timeLeft)}
                </span>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 pt-8 border-t border-white/10">
                <div className="flex items-center gap-4 group/item">
                  <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary group-hover/item:scale-110 transition-transform">
                    <Users className="h-6 w-6" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                      Live Students
                    </p>
                    <p className="text-2xl font-black">{presenceCount}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 group/item">
                  <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary group-hover/item:scale-110 transition-transform">
                    <Activity className="h-6 w-6" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                      Status
                    </p>
                    <p className="text-2xl font-black text-primary">
                      {isWaitingHall ? "Ready" : "Syncing"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 max-w-xl mx-auto">
            {!isFullscreen && isWaitingHall && (
              <Button
                onClick={enterFullscreen}
                size="lg"
                className="w-full h-16 bg-primary text-black font-black rounded-2xl animate-pulse shadow-xl shadow-primary/20"
              >
                পাবলিক এক্সাম মোড চালু করুন
              </Button>
            )}

            <div className="flex items-center justify-center gap-3 py-3 px-6 rounded-full bg-white/5 border border-white/10 animate-bounce">
              <Lock className="h-4 w-4 text-primary" />
              <p className="text-sm font-bold text-white/80">
                Strict Proctoring Enabled: Browser locked to Fullscreen
              </p>
            </div>

            <p className="text-white/60 font-medium text-lg leading-relaxed">
              {isWaitingHall
                ? "সবাই জয়েন করলে একসাথে Listening টেস্ট শুরু হবে। কোথাও ক্লিক করবেন না।"
                : "নির্ধারিত সময়ে জয়েন বাটন আসবে। জয়েন করার পর ৩ মিনিট সময় পাবেন ওয়েটিং হলে থাকতে।"}
            </p>
          </div>
        </div>

        {/* Strict Mode Notice */}
        <div className="fixed bottom-10 left-0 right-0 text-center">
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">
            IELTS Practice BD Secure Browser Engine v2.0
          </p>
        </div>
      </div>
    );
  }

  if (mode === "waiting" || mode === "submitted_waiting") {
    const nextSection = sections[currentIndex];
    const currentSection = activeSection;
    return (
      <div className="fixed inset-0 z-100 dark:bg-black bg-white flex flex-col items-center justify-center dark:text-white text-black bg p-6 font-hind-siliguri  overflow-hidden">
        <div className="max-w-xl w-full text-center space-y-10">
          <Clock className="h-16 w-16 dark:text-[#74b602] text-black mx-auto animate-pulse" />
          <h2 className="text-5xl font-black uppercase">
            {mode === "submitted_waiting" ? "Module Submitted" : "Rest Period"}
          </h2>
          <div className="dark:bg-white/5 bg-black/5 border border-white/10 rounded-[3rem] p-10 space-y-6">
            <p className="text-lg font-bold">
              {mode === "submitted_waiting"
                ? `আপনি সফলভাবে ${currentSection?.title} জমা দিয়েছেন।`
                : `পরবর্তী মডিউল ${nextSection?.title} শুরু হতে যাচ্ছে।`}
            </p>
            {mode === "submitted_waiting" && (
              <div className="bg-[#74b602]/10 border border-[#74b602]/20 py-4 rounded-2xl">
                <p className="text-[#74b602] font-black text-sm uppercase">
                  সময় আরও {formatTime(timeLeft)} বাকি আছে
                </p>
              </div>
            )}
            <p className="dark:text-white/40 text-black/40 text-sm">
              {mode === "submitted_waiting"
                ? "সময় শেষ না হওয়া পর্যন্ত অপেক্ষা করুন। পরবর্তী মডিউল অটোমেটিক শুরু হবে।"
                : "একটু ফ্রেশ হয়ে নিন। সবার একসাথে শুরু হবে।"}
            </p>
          </div>
          <div className="text-8xl font-black tracking-tighter dark:text-[#74b602] text-black font-mono">
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>
    );
  }

  if (mode === "finished") {
    return (
      <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6 font-hind-siliguri text-center">
        <div className="max-w-2xl w-full space-y-10">
          <CheckCircle2 className="h-24 w-24 text-primary mx-auto" />
          <h1 className="text-5xl font-black text-[#222]">অসংখ্য ধন্যবাদ!</h1>
          <p className="text-xl text-muted-foreground font-medium">
            আপনার মক টেস্ট সফলভাবে জমা হয়েছে।
          </p>
          <div className="p-10 rounded-3xl bg-blue-50 border border-blue-200 space-y-4 max-w-md mx-auto">
            <p className="font-bold text-gray-800">
              ✅ রেজাল্ট ইমেইল এবং ড্যাশবোর্ডে জানানো হবে।
            </p>
            <p className="text-sm text-gray-600">
              সাধারণত ২৪-৪৮ ঘণ্টার মধ্যে ফিডব্যাকসহ রেজাল্ট প্রকাশ করা হয়।
            </p>
          </div>
          <Button
            asChild
            size="lg"
            className="h-16 px-12 font-black rounded-2xl shadow-xl hover:scale-105 transition-all"
          >
            <Link href="/dashboard">ড্যাশবোর্ডে ফিরে যান</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {warning && (
        <div className="fixed top-0 left-0 right-0 z-[1000] bg-red-600 text-white p-4 text-center font-black animate-bounce">
          {warning}
        </div>
      )}
      {loading && (
        <div className="fixed inset-0 z-[900] flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 bg-white rounded-2xl px-6 py-4 shadow-xl border border-gray-200">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm font-bold text-gray-700">Loading module…</p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (currentIndexRef.current !== -1)
                  startModule(currentIndexRef.current, sections);
                else if (sections.length) startModule(0, sections);
              }}
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      <IELTSPracticeBDInterface
        testTitle={test?.title || ""}
        sectionType={activeSection?.section_type || ""}
        parts={parts}
        questions={questions}
        timeLeft={timeLeft}
        answers={answers}
        onAnswerChange={(qId, val) =>
          setAnswers((prev) => ({ ...prev, [qId]: val }))
        }
        onPassageChange={(partId, html) =>
          setPassageSync((prev) => ({ ...prev, [partId]: html }))
        }
        onFinish={handleModuleFinish}
        disablePause={true}
        onExit={() => {
          if (window.confirm("Exit test? Progress is saved."))
            router.push("/mock");
        }}
      />
    </div>
  );
}
