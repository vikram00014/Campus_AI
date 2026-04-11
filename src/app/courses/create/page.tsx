"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadCloud, CheckCircle2, ArrowRight, Loader2, Sparkles, FileText, Type, AlertCircle, RefreshCw } from "lucide-react";
import { extractTextFromPDF } from "@/app/actions/parse-pdf";
import { generateCourseFromSyllabus } from "@/app/actions/course";
import { useRouter } from "next/navigation";

const DRAFT_KEY = "campus-ai-create-draft-v1";
const JOB_KEY = "campus-ai-create-job-v1";

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

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return "An unexpected error occurred during generation.";
}

const stepLabels = ["Academic Info", "Subject", "Syllabus"];

const generatingPhases = [
    "Analyzing syllabus structure...",
    "AI mapping modules & topics...",
    "Curating YouTube lectures...",
    "Persisting your course...",
];

export default function CourseCreatePage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isGenerating, setIsGenerating] = useState(false);
    const [loadingPhase, setLoadingPhase] = useState("Analyzing Syllabus...");
    const [generationError, setGenerationError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        year: "",
        branch: "",
        semester: "",
        courseName: "",
        syllabusFile: null as File | null,
        syllabusText: "",
    });
    const hasRestoredState = useRef(false);

    const handleNext = () => setStep((s) => Math.min(s + 1, 3));
    const handleBack = () => setStep((s) => Math.max(s - 1, 1));

    const saveDraft = (draft: PersistedDraft) => {
        if (typeof window === "undefined") return;
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    };

    const saveJob = (job: PersistedJob) => {
        if (typeof window === "undefined") return;
        localStorage.setItem(JOB_KEY, JSON.stringify(job));
    };

    const clearJob = () => {
        if (typeof window === "undefined") return;
        localStorage.removeItem(JOB_KEY);
    };

    // Rotate loading phase messages
    useEffect(() => {
        if (!isGenerating) return;
        const interval = setInterval(() => {
            setLoadingPhase((current) => {
                const currentIndex = generatingPhases.indexOf(current);
                const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % generatingPhases.length;
                return generatingPhases[nextIndex];
            });
        }, 5000);
        return () => clearInterval(interval);
    }, [isGenerating]);

    const runGeneration = useCallback(async (payload: GenerationPayload) => {
        setIsGenerating(true);
        setGenerationError(null);
        setLoadingPhase(generatingPhases[0]);
        setStep(3);
        saveJob({ status: "running", payload, updatedAt: Date.now() });

        try {
            const courseGenRes = await generateCourseFromSyllabus(
                payload.courseName,
                payload.syllabusText,
                { year: payload.year, branch: payload.branch, semester: payload.semester }
            );
            if (!courseGenRes.success) throw new Error(courseGenRes.error);

            clearJob();
            router.push(`/courses/${courseGenRes.courseId}`);
        } catch (error: unknown) {
            console.error("Generation failed:", error);
            const errorMessage = getErrorMessage(error);
            setGenerationError(errorMessage);
            saveJob({ status: "error", payload, error: errorMessage, updatedAt: Date.now() });
            setIsGenerating(false);
        }
    }, [router]);

    const handleGenerate = async () => {
        if ((!formData.syllabusFile && !formData.syllabusText.trim()) || !formData.courseName) return;

        setIsGenerating(true);
        setGenerationError(null);
        setLoadingPhase(generatingPhases[0]);

        try {
            let extractedText = formData.syllabusText;

            if (formData.syllabusFile && !formData.syllabusText.trim()) {
                setLoadingPhase("Extracting text from PDF...");
                const pdfData = new FormData();
                pdfData.append("file", formData.syllabusFile);
                const extractRes = await extractTextFromPDF(pdfData);
                if (!extractRes.success || !extractRes.text) throw new Error(extractRes.error || "Failed text extraction.");
                extractedText = extractRes.text;
            }

            const payload: GenerationPayload = {
                year: formData.year,
                branch: formData.branch,
                semester: parseInt(formData.semester) || 1,
                courseName: formData.courseName,
                syllabusText: extractedText,
            };

            await runGeneration(payload);
        } catch (error: unknown) {
            const errorMessage = getErrorMessage(error);
            setGenerationError(errorMessage);
            setIsGenerating(false);
        }
    };

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
                const parsedDraft = JSON.parse(rawDraft) as PersistedDraft;
                setFormData((prev) => ({
                    ...prev,
                    year: parsedDraft.year || prev.year,
                    branch: parsedDraft.branch || prev.branch,
                    semester: parsedDraft.semester || prev.semester,
                    courseName: parsedDraft.courseName || prev.courseName,
                    syllabusText: parsedDraft.syllabusText || prev.syllabusText,
                    syllabusFile: null,
                }));
            } catch {
                localStorage.removeItem(DRAFT_KEY);
            }
        }

        const rawJob = localStorage.getItem(JOB_KEY);
        if (!rawJob) return;

        try {
            const parsedJob = JSON.parse(rawJob) as PersistedJob;
            setFormData((prev) => ({
                ...prev,
                year: parsedJob.payload.year || prev.year,
                branch: parsedJob.payload.branch || prev.branch,
                semester: String(parsedJob.payload.semester || prev.semester),
                courseName: parsedJob.payload.courseName || prev.courseName,
                syllabusText: parsedJob.payload.syllabusText || prev.syllabusText,
                syllabusFile: null,
            }));
            setStep(3);

            if (parsedJob.status === "running") {
                setLoadingPhase("Resuming course generation...");
                void runGeneration(parsedJob.payload);
            } else if (parsedJob.status === "error") {
                setGenerationError(parsedJob.error || "Previous generation failed. You can retry.");
            }
        } catch {
            localStorage.removeItem(JOB_KEY);
        }
    }, [runGeneration]);

    return (
        <div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-[#0b1120] px-4 py-8 sm:px-6 sm:py-10">
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-[360px] bg-[radial-gradient(circle_at_top,rgba(76,215,246,0.18),transparent_58%)]" />
                <div className="orb orb-cyan w-[520px] h-[420px] -top-20 -left-24 opacity-70" />
                <div className="orb orb-amber w-[340px] h-[320px] bottom-0 right-0 opacity-50" />
                <div className="absolute inset-0 dot-bg opacity-25" />
            </div>

            <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
                <motion.section
                    initial={{ opacity: 0, x: -18 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative overflow-hidden rounded-[2rem] glass"
                >
                    <div className="absolute inset-0">
                        <Image
                            src="/bg-hero.png"
                            alt="Course generation background"
                            fill
                            priority
                            className="object-cover object-center"
                            style={{ opacity: 0.28 }}
                        />
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,12,22,0.56),rgba(10,16,28,0.88))]" />
                    </div>

                    <div className="relative p-7 sm:p-10">
                        <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold" style={{ background: "rgba(76,215,246,0.12)", color: "#0891b2", border: "1px solid rgba(76,215,246,0.2)" }}>
                            <Sparkles className="w-4 h-4" />
                            AI Course Generator
                        </div>

                        <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                            Create New Course
                        </h1>
                        <p className="mt-4 max-w-xl text-base leading-7 text-[#bcc9cd] sm:text-lg">
                            From your official university syllabus in under 30 seconds. We structure the subject, organize modules, and prepare a ready-to-study learning flow for you.
                        </p>

                        <div className="mt-8 grid gap-4 sm:grid-cols-3">
                            {[
                                { title: "Academic Info", desc: "Year, branch, semester" },
                                { title: "Subject", desc: "Exact course name" },
                                { title: "Syllabus", desc: "PDF or pasted outline" },
                            ].map((item, index) => (
                                <div key={item.title} className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold" style={{ background: "rgba(76,215,246,0.14)", color: "#0891b2" }}>
                                        {String(index + 1).padStart(2, "0")}
                                    </div>
                                    <p className="text-sm font-bold text-white">{item.title}</p>
                                    <p className="mt-1 text-xs leading-5 text-[#8ea1ab]">{item.desc}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 overflow-hidden rounded-[1.75rem] border border-cyan-400/15 bg-white/[0.03] shadow-[0_16px_36px_rgba(0,0,0,0.18)]">
                            <div className="relative h-[240px] sm:h-[300px]">
                                <Image
                                    src="/syllabus-transform.png"
                                    alt="Syllabus becomes an AI course"
                                    fill
                                    className="object-cover"
                                    style={{ opacity: 0.92 }}
                                />
                                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04),rgba(10,16,28,0.86))]" />
                                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                                    <p className="text-sm font-bold text-cyan-300">AI-Powered Course Structuring</p>
                                    <p className="mt-1 text-sm text-[#d5e5ee]">Upload a syllabus once and let the platform turn it into modules, topics, notes, practice, and guided progress.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="rounded-[2rem] glass overflow-hidden"
                >
                    <div className="border-b border-white/8 bg-white/[0.03] px-6 py-6 sm:px-8">
                        <div className="mb-6 flex justify-between gap-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="relative flex flex-1 flex-col items-center gap-2">
                                    {i < 3 && (
                                        <div className="absolute left-[calc(50%+20px)] right-[-50%] top-5 h-[2px] bg-white/10" />
                                    )}
                                    {i < step && (
                                        <div
                                            className="absolute left-[calc(50%+20px)] right-[-50%] top-5 h-[2px]"
                                            style={{ background: "linear-gradient(90deg,#4cd7f6,#acedff)" }}
                                        />
                                    )}
                                    <div
                                        className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all duration-300"
                                        style={{
                                            background: i < step ? "linear-gradient(135deg,#acedff,#4cd7f6)" : step === i ? "rgba(9,14,26,0.95)" : "rgba(255,255,255,0.08)",
                                            color: i < step ? "#003640" : step === i ? "#4cd7f6" : "#8ea1ab",
                                            border: step === i ? "2px solid rgba(76,215,246,0.8)" : "2px solid transparent",
                                            boxShadow: step === i ? "0 0 0 6px rgba(76,215,246,0.08)" : "none",
                                        }}
                                    >
                                        {i < step ? <CheckCircle2 className="w-4 h-4" /> : i}
                                    </div>
                                    <span className="text-center text-[11px] font-semibold uppercase tracking-wide" style={{ color: step >= i ? "#4cd7f6" : "#8ea1ab" }}>
                                        {stepLabels[i - 1]}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <h2 className="text-2xl font-bold text-white">
                            {isGenerating ? "Crafting Your Curriculum" : step === 1 ? "Academic Details" : step === 2 ? "Course Info" : "Upload Syllabus"}
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-[#bcc9cd]">
                            {isGenerating
                                ? "Gemini 2.5 Flash is organizing your course structure and connecting the best study material."
                                : step === 1
                                    ? "Help us tailor the generated content to your year, branch, and semester."
                                    : step === 2
                                        ? "Use the official course or subject name for the strongest AI matching."
                                        : "Upload your syllabus PDF or paste the text directly to begin."}
                        </p>
                    </div>

                    <div className="relative min-h-[420px] px-6 pb-6 pt-6 sm:px-8">
                        {generationError && (
                            <div className="mb-5 flex gap-3 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="font-semibold mb-1">Generation failed</p>
                                    <p className="text-xs opacity-80">{generationError}</p>
                                </div>
                                <button onClick={() => setGenerationError(null)} className="flex items-center gap-1 text-xs opacity-60 hover:opacity-100 transition-opacity shrink-0">
                                    <RefreshCw className="w-3 h-3" /> Retry
                                </button>
                            </div>
                        )}

                        <AnimatePresence mode="wait">
                            {/* LOADING OVERLAY */}
                            {isGenerating && (
                                <motion.div
                                    key="generating"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-[1.5rem] bg-[#0e131f]/92 py-12 text-center"
                                    style={{ backdropFilter: "blur(16px)" }}
                                >
                                    <div className="relative mb-8">
                                        <div className="absolute inset-0 rounded-full animate-glow-pulse" style={{ background: "rgba(76,215,246,0.16)", filter: "blur(20px)" }} />
                                        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10">
                                            <Loader2 className="w-10 h-10 text-[#4cd7f6] animate-spin" />
                                        </div>
                                    </div>
                                    <h3 className="mb-3 text-2xl font-extrabold text-white">Building your course...</h3>
                                    <p className="mb-1 animate-pulse text-sm font-semibold text-cyan-600">{loadingPhase}</p>
                                    <p className="mb-8 text-xs text-[#8ea1ab]">Powered by Gemini 2.5 Flash + YouTube API</p>
                                    <div className="flex gap-2">
                                        {[0, 1, 2].map((d) => (
                                            <div key={d} className="w-2.5 h-2.5 rounded-full animate-bounce" style={{ background: "#4cd7f6", opacity: 0.7, animationDelay: `${d * 0.18}s` }} />
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 1 */}
                            {!isGenerating && step === 1 && (
                                <motion.div key="step1" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-4 pt-2">
                                    <FieldGroup id="year" label="Current Year" placeholder="e.g. TE (Third Year)" value={formData.year} onChange={(v) => setFormData({ ...formData, year: v })} />
                                    <FieldGroup id="branch" label="Branch / Major" placeholder="e.g. Computer Science, AIML" value={formData.branch} onChange={(v) => setFormData({ ...formData, branch: v })} />
                                    <FieldGroup id="semester" label="Semester" placeholder="e.g. 6" type="number" value={formData.semester} onChange={(v) => setFormData({ ...formData, semester: v })} />
                                </motion.div>
                            )}

                            {/* STEP 2 */}
                            {!isGenerating && step === 2 && (
                                <motion.div key="step2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-4 pt-2">
                                    <FieldGroup id="courseName" label="Course / Subject Name" placeholder="e.g. Deep Learning, Data Structures" autoFocus value={formData.courseName} onChange={(v) => setFormData({ ...formData, courseName: v })} />
                                    <div className="flex items-start gap-3 rounded-2xl border border-cyan-400/15 bg-cyan-400/10 p-4 text-sm">
                                        <span className="text-lg shrink-0 mt-0.5">💡</span>
                                        <div>
                                            <p className="mb-0.5 font-semibold text-white">Pro tip</p>
                                            <p className="text-[#bcc9cd]">Use the exact course name from your syllabus for best AI matching.</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 3 */}
                            {!isGenerating && step === 3 && (
                                <motion.div key="step3" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-4 pt-2">
                                    <Tabs defaultValue="upload" className="w-full">
                                        <TabsList className="mb-4 grid w-full grid-cols-2 rounded-2xl border border-white/8 bg-white/5 p-1">
                                            <TabsTrigger value="upload" className="flex items-center gap-2 rounded-xl text-[#8ea1ab] data-[state=active]:bg-[#0b1120] data-[state=active]:text-[#4cd7f6] data-[state=active]:shadow-sm">
                                                <UploadCloud className="w-4 h-4" /> Upload PDF
                                            </TabsTrigger>
                                            <TabsTrigger value="paste" className="flex items-center gap-2 rounded-xl text-[#8ea1ab] data-[state=active]:bg-[#0b1120] data-[state=active]:text-[#4cd7f6] data-[state=active]:shadow-sm">
                                                <Type className="w-4 h-4" /> Paste Text
                                            </TabsTrigger>
                                        </TabsList>

                                        <TabsContent value="upload">
                                            <label htmlFor="file-upload" className="flex flex-col items-center justify-center text-center cursor-pointer rounded-2xl h-52 transition-all"
                                                style={{ border: "2px dashed rgba(76,215,246,0.25)", background: "rgba(255,255,255,0.03)" }}
                                                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(76,215,246,0.45)"; (e.currentTarget as HTMLElement).style.background = "rgba(76,215,246,0.06)"; }}
                                                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(76,215,246,0.25)"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
                                            >
                                                {formData.syllabusFile ? (
                                                    <>
                                                        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10">
                                                            <FileText className="w-7 h-7 text-blue-400" />
                                                        </div>
                                                        <p className="mb-1 max-w-xs truncate text-sm font-semibold text-white">{formData.syllabusFile.name}</p>
                                                        <p className="text-xs text-[#8ea1ab]">Click to change PDF</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10">
                                                            <UploadCloud className="w-7 h-7 text-[#4cd7f6]" />
                                                        </div>
                                                        <p className="mb-1.5 font-semibold text-white">Drop PDF Syllabus here</p>
                                                        <p className="mb-4 text-sm text-[#8ea1ab]">or click to browse files</p>
                                                        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1.5 text-sm font-semibold text-cyan-300">Browse Files</span>
                                                    </>
                                                )}
                                                <Input id="file-upload" type="file" accept="application/pdf" className="hidden"
                                                    onChange={(e) => {
                                                        if (e.target.files?.[0]) setFormData({ ...formData, syllabusFile: e.target.files[0], syllabusText: "" });
                                                    }}
                                                />
                                            </label>
                                        </TabsContent>

                                        <TabsContent value="paste">
                                            <textarea
                                                placeholder={"Paste your syllabus modules and topics here...\n\nUnit I: Introduction to Machine Learning...\nUnit II: Linear Models..."}
                                                className="input-dark h-52 w-full resize-none rounded-2xl p-4 text-sm font-mono"
                                                value={formData.syllabusText}
                                                onChange={(e) => setFormData({ ...formData, syllabusText: e.target.value, syllabusFile: null })}
                                            />
                                        </TabsContent>
                                    </Tabs>

                                    <div className="flex items-center gap-2.5 rounded-2xl border border-cyan-400/15 bg-cyan-400/10 p-3.5 text-sm">
                                        <Sparkles className="w-4 h-4 shrink-0 text-[#4cd7f6]" />
                                        <p className="text-[#bcc9cd]">AI will extract modules, map topics, and auto-curate the best YouTube lectures for each topic.</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/8 bg-white/[0.03] px-6 pb-6 pt-5 sm:px-8">
                        <button
                            onClick={handleBack}
                            disabled={step === 1 || isGenerating}
                            className="rounded-xl border border-white/8 px-5 py-2.5 text-sm font-semibold text-[#bcc9cd] transition-all disabled:opacity-30 hover:bg-white/5"
                        >
                            Back
                        </button>

                        {step < 3 ? (
                            <button
                                onClick={handleNext}
                                disabled={
                                    (step === 1 && (!formData.year || !formData.branch || !formData.semester)) ||
                                    (step === 2 && !formData.courseName)
                                }
                                className="btn-primary flex items-center gap-2 px-6 py-2.5 text-sm font-bold disabled:opacity-40"
                            >
                                Continue <ArrowRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || (!formData.syllabusFile && !formData.syllabusText.trim())}
                                className="btn-primary flex items-center gap-2 px-6 py-2.5 text-sm font-bold disabled:opacity-40 shadow-glow-sm"
                            >
                                {isGenerating ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                                ) : (
                                    <><Sparkles className="w-4 h-4" /> Generate Course ✨</>
                                )}
                            </button>
                        )}
                    </div>
                </motion.section>
            </div>
        </div>
    );
}

/* ── Helper field component ── */
function FieldGroup({
    id, label, placeholder, value, onChange, type = "text", autoFocus,
}: {
    id: string; label: string; placeholder?: string; value: string;
    onChange: (v: string) => void; type?: string; autoFocus?: boolean;
}) {
    return (
        <div className="space-y-1.5">
            <label htmlFor={id} className="block text-sm font-semibold text-[#d5e5ee]">{label}</label>
            <input
                id={id} type={type} placeholder={placeholder} value={value} autoFocus={autoFocus}
                onChange={(e) => onChange(e.target.value)}
                className="input-dark w-full px-4 py-3 text-sm"
            />
        </div>
    );
}
