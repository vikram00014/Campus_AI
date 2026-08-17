"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Loader2,
  RotateCcw,
  Trash2,
  Type,
  UploadCloud,
} from "lucide-react";
import { extractTextFromPDF } from "@/app/actions/parse-pdf";
import { generateCourseFromSyllabus } from "@/app/actions/course";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, getErrorMessage } from "@/lib/utils";

const DRAFT_KEY = "campus-ai-create-draft-v1";
const JOB_KEY = "campus-ai-create-job-v1";
const MAX_PDF_BYTES = 10 * 1024 * 1024;

interface GenerationPayload {
  year: string;
  branch: string;
  semester: number;
  courseName: string;
  syllabusText: string;
}

interface PersistedDraft {
  year: string;
  branch: string;
  semester: string;
  courseName: string;
  syllabusText: string;
}

interface PersistedJob {
  status: "running" | "error";
  payload: GenerationPayload;
  error?: string;
  updatedAt: number;
}

const stepLabels = ["Academic Info", "Course Name", "Syllabus"];
const generatingPhases = ["Reading syllabus", "Structuring modules", "Finding videos", "Saving your course"];




function formatFileSize(file: File): string {
  const mb = file.size / (1024 * 1024);
  return `${mb.toFixed(mb >= 1 ? 1 : 2)} MB`;
}

export default function CourseCreatePage() {
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [formData, setFormData] = useState({
    year: "",
    branch: "",
    semester: "",
    courseName: "",
    syllabusFile: null as File | null,
    syllabusText: "",
  });
  const hasRestoredState = useRef(false);

  const saveDraft = (draft: PersistedDraft) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }
  };

  const saveJob = (job: PersistedJob) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(JOB_KEY, JSON.stringify(job));
    }
  };

  const clearJob = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(JOB_KEY);
    }
  };

  const runGeneration = useCallback(
    async (payload: GenerationPayload) => {
      setIsGenerating(true);
      setGenerationError(null);
      setPhaseIndex(0);
      setStep(3);
      saveJob({ status: "running", payload, updatedAt: Date.now() });

      try {
        const result = await generateCourseFromSyllabus(payload.courseName, payload.syllabusText, {
          year: payload.year,
          branch: payload.branch,
          semester: payload.semester,
        });

        if (!result.success) throw new Error(result.error);

        clearJob();
        window.location.href = `/courses/${result.courseId}`;
      } catch (error) {
        const message = getErrorMessage(error);
        setGenerationError(message);
        clearJob();
        setIsGenerating(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!isGenerating) return;
    const timer = window.setInterval(() => {
      setPhaseIndex((current) => Math.min(current + 1, generatingPhases.length - 1));
    }, 5000);
    return () => window.clearInterval(timer);
  }, [isGenerating]);

  useEffect(() => {
    saveDraft({
      year: formData.year,
      branch: formData.branch,
      semester: formData.semester,
      courseName: formData.courseName,
      syllabusText: formData.syllabusText,
    });
  }, [formData.year, formData.branch, formData.semester, formData.courseName, formData.syllabusText]);

  useEffect(() => {
    if (typeof window === "undefined" || hasRestoredState.current) return;
    hasRestoredState.current = true;

    const rawDraft = localStorage.getItem(DRAFT_KEY);
    if (rawDraft) {
      try {
        const parsed = JSON.parse(rawDraft) as PersistedDraft;
        setFormData((previous) => ({
          ...previous,
          year: parsed.year || previous.year,
          branch: parsed.branch || previous.branch,
          semester: parsed.semester || previous.semester,
          courseName: parsed.courseName || previous.courseName,
          syllabusText: parsed.syllabusText || previous.syllabusText,
        }));
      } catch {
        localStorage.removeItem(DRAFT_KEY);
      }
    }

    const rawJob = localStorage.getItem(JOB_KEY);
    if (!rawJob) return;

    try {
      const parsed = JSON.parse(rawJob) as PersistedJob;
      setFormData((previous) => ({
        ...previous,
        year: parsed.payload.year || previous.year,
        branch: parsed.payload.branch || previous.branch,
        semester: String(parsed.payload.semester || previous.semester),
        courseName: parsed.payload.courseName || previous.courseName,
        syllabusText: parsed.payload.syllabusText || previous.syllabusText,
        syllabusFile: null,
      }));
      setStep(3);

      if (parsed.status === "running") {
        void runGeneration(parsed.payload);
      }
    } catch {
      localStorage.removeItem(JOB_KEY);
    }
  }, [runGeneration]);

  const canContinue =
    (step === 1 && formData.year && formData.branch && formData.semester) ||
    (step === 2 && formData.courseName) ||
    (step === 3 && (formData.syllabusFile || formData.syllabusText.trim()));

  const handleGenerate = async () => {
    if (!canContinue || isGenerating) return;
    setIsGenerating(true);
    setGenerationError(null);
    setPhaseIndex(0);

    try {
      let extractedText = formData.syllabusText;
      if (formData.syllabusFile && !formData.syllabusText.trim()) {
        const pdfData = new FormData();
        pdfData.append("file", formData.syllabusFile);
        const extractResult = await extractTextFromPDF(pdfData);
        if (!extractResult.success || !extractResult.text) {
          throw new Error(extractResult.error || "Could not read this PDF.");
        }
        extractedText = extractResult.text;
      }

      await runGeneration({
        year: formData.year,
        branch: formData.branch,
        semester: parseInt(formData.semester, 10) || 1,
        courseName: formData.courseName,
        syllabusText: extractedText,
      });
    } catch (error) {
      setGenerationError(getErrorMessage(error));
      setIsGenerating(false);
    }
  };

  const setFile = (file?: File) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setGenerationError("That file isn't a PDF. Upload a PDF syllabus or paste the text instead.");
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setGenerationError("That PDF is larger than 10 MB. Try a smaller file or paste the syllabus text.");
      return;
    }
    setGenerationError(null);
    setFormData((previous) => ({ ...previous, syllabusFile: file, syllabusText: "" }));
  };

  return (
    <main className="bg-background py-8 sm:py-12">
      <div className="app-shell grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="section-label">Course Generator</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">Build a course from your syllabus.</h1>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Three focused decisions: academic context, official course name, and syllabus input.
            Your entries are preserved while you move back and forth.
          </p>

          <div className="mt-8 space-y-3">
            {stepLabels.map((label, index) => {
              const number = index + 1;
              const complete = step > number;
              const active = step === number;
              return (
                <div
                  key={label}
                  className={cn(
                    "flex items-center gap-3.5 rounded-xl border border-border/80 bg-card p-4 transition-all",
                    active && "border-primary/60 bg-primary/[0.04] shadow-xs"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full border border-border text-xs font-bold transition-all",
                      complete && "border-emerald-600 bg-emerald-600 text-white dark:bg-emerald-500",
                      active && !complete && "border-primary bg-primary text-primary-foreground shadow-xs shadow-primary/30",
                      !active && !complete && "text-muted-foreground"
                    )}
                  >
                    {complete ? <CheckCircle2 className="h-4 w-4" /> : number}
                  </span>
                  <div>
                    <p className={cn("text-sm font-semibold", active ? "text-foreground" : "text-muted-foreground")}>{label}</p>
                    <p className="text-xs text-muted-foreground">
                      {complete ? "Completed" : active ? `Step ${number} of 3` : "Upcoming"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        <section className="surface-card overflow-hidden">
          <div className="border-b border-border p-6">
            <p className="text-sm font-semibold text-muted-foreground">{step} / 3</p>
            <h2 className="mt-2 text-2xl font-bold">
              {isGenerating
                ? "Generating your course"
                : step === 1
                  ? "Which academic context should this course follow?"
                  : step === 2
                    ? "What is the official course name?"
                    : "Where should CAMPUS AI read the syllabus from?"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {isGenerating
                ? "This usually takes 30-60 seconds. Keep this page open while the course is assembled."
                : step === 1
                  ? "This helps the AI shape examples and pacing for your semester."
                  : step === 2
                    ? "Use the name exactly as it appears in your syllabus for better matching."
                    : "Upload a PDF or paste the syllabus text. Accepted format: PDF."}
            </p>
          </div>

          <div className="min-h-[420px] p-6">
            {generationError && !isGenerating && (
              <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                <div className="flex gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-bold">Course generation did not finish.</p>
                    <p className="mt-1 leading-6">
                      We kept your syllabus and details. You can retry without entering them again.
                    </p>
                    <p className="mt-2 text-xs opacity-80">{generationError}</p>
                  </div>
                </div>
              </div>
            )}

            <AnimatePresence mode="wait">
              {isGenerating ? (
                <motion.div
                  key="generating"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex min-h-[360px] flex-col justify-center"
                >
                  <div className="mx-auto w-full max-w-lg">
                    <div className="mb-8 flex items-center justify-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-border bg-muted">
                        <Loader2 className="h-7 w-7 animate-spin text-primary" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      {generatingPhases.map((phase, index) => (
                        <div key={phase} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                          <span
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-full border border-border text-xs font-bold",
                              index < phaseIndex && "border-success bg-success text-success-foreground",
                              index === phaseIndex && "border-primary bg-primary text-primary-foreground"
                            )}
                          >
                            {index < phaseIndex ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm font-bold">{phase}</p>
                            <p className="text-xs text-muted-foreground">
                              {index === phaseIndex ? "In progress" : index < phaseIndex ? "Done" : "Waiting"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : step === 1 ? (
                <StepMotion key="step-1">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Current year">
                      <Input
                        value={formData.year}
                        onChange={(event) => setFormData({ ...formData, year: event.target.value })}
                        placeholder="Third Year"
                      />
                    </Field>
                    <Field label="Semester">
                      <Input
                        type="number"
                        value={formData.semester}
                        onChange={(event) => setFormData({ ...formData, semester: event.target.value })}
                        placeholder="6"
                      />
                    </Field>
                    <Field label="Branch or major" className="sm:col-span-2">
                      <Input
                        value={formData.branch}
                        onChange={(event) => setFormData({ ...formData, branch: event.target.value })}
                        placeholder="Computer Science"
                      />
                    </Field>
                  </div>
                </StepMotion>
              ) : step === 2 ? (
                <StepMotion key="step-2">
                  <Field label="Course name">
                    <Input
                      autoFocus
                      value={formData.courseName}
                      onChange={(event) => setFormData({ ...formData, courseName: event.target.value })}
                      placeholder="Operating Systems"
                    />
                  </Field>
                  <div className="mt-5 rounded-xl border border-border bg-muted p-4 text-sm leading-6 text-muted-foreground">
                    Exact names help the AI retrieve better videos and avoid mixing similar subjects.
                  </div>
                </StepMotion>
              ) : (
                <StepMotion key="step-3">
                  <Tabs defaultValue="upload">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="upload">
                        <UploadCloud className="h-4 w-4" />
                        Upload PDF
                      </TabsTrigger>
                      <TabsTrigger value="paste">
                        <Type className="h-4 w-4" />
                        Paste Text
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="upload" className="pt-4">
                      <label
                        htmlFor="file-upload"
                        onDragOver={(event) => {
                          event.preventDefault();
                          setDragActive(true);
                        }}
                        onDragLeave={() => setDragActive(false)}
                        onDrop={(event) => {
                          event.preventDefault();
                          setDragActive(false);
                          setFile(event.dataTransfer.files?.[0]);
                        }}
                        className={cn(
                          "flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted p-6 text-center transition-colors",
                          dragActive && "border-primary bg-primary/5"
                        )}
                      >
                        <UploadCloud className="h-9 w-9 text-primary" />
                        <p className="mt-4 text-sm font-bold">Drop your PDF syllabus here</p>
                        <p className="mt-1 text-xs text-muted-foreground">Accepted format: PDF</p>
                        <input
                          id="file-upload"
                          type="file"
                          accept="application/pdf"
                          className="sr-only"
                          onChange={(event) => setFile(event.target.files?.[0])}
                        />
                      </label>
                      {formData.syllabusFile && (
                        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <FileText className="h-5 w-5 shrink-0 text-primary" />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold">{formData.syllabusFile.name}</p>
                              <p className="text-xs text-muted-foreground">{formatFileSize(formData.syllabusFile)}</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setFormData({ ...formData, syllabusFile: null })}
                            aria-label="Remove selected file"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="paste" className="pt-4">
                      <textarea
                        value={formData.syllabusText}
                        onChange={(event) =>
                          setFormData({ ...formData, syllabusText: event.target.value, syllabusFile: null })
                        }
                        placeholder="Paste units, modules, and topics here..."
                        className="input-field min-h-56 resize-none font-mono leading-6"
                      />
                    </TabsContent>
                  </Tabs>
                </StepMotion>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border p-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((current) => Math.max(current - 1, 1))}
              disabled={step === 1 || isGenerating}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            {step < 3 ? (
              <Button
                type="button"
                onClick={() => setStep((current) => Math.min(current + 1, 3))}
                disabled={!canContinue}
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" onClick={handleGenerate} disabled={!canContinue || isGenerating}>
                {generationError ? <RotateCcw className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                {generationError ? "Retry" : "Generate course"}
              </Button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function StepMotion({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block space-y-2", className)}>
      <span className="text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}

