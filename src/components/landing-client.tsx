"use client";

import Link from "next/link";
import {
  ArrowRight, Sparkles, PlayCircle, Zap, ChevronRight,
  BookOpenCheck, BrainCircuit, ShieldCheck, Youtube, Target, BarChart3,
} from "lucide-react";

/* ── Feature grid — fully self-contained in client so LucideIcons work ── */
const features = [
  {
    icon: BookOpenCheck,
    title: "Syllabus Intelligence",
    desc: "Upload any PDF syllabus and Gemini 2.5 Flash maps it into structured modules & topics in under 30 seconds.",
    color: "cyan",
    stat: "< 30s",
  },
  {
    icon: Youtube,
    title: "Auto Video Playlists",
    desc: "YouTube lectures are auto-curated per topic — no searching, no wasted time. Study-ready instantly.",
    color: "red",
    stat: "YouTube API",
  },
  {
    icon: BrainCircuit,
    title: "AI-Generated Notes",
    desc: "Tavily + Gemini synthesize exam-focused notes from trusted academic sources for every topic.",
    color: "purple",
    stat: "Gemini 2.5",
  },
  {
    icon: Target,
    title: "Adaptive MCQ Practice",
    desc: "Difficulty-aware AI practice questions with timed mock exam mode. Sharpen weak topics fast.",
    color: "amber",
    stat: "5 MCQs/topic",
  },
  {
    icon: BarChart3,
    title: "Smart Study Plans",
    desc: "Today, Tomorrow Exam, and 3-Day Sprint modes with weak-topic radar and XP gamification.",
    color: "emerald",
    stat: "3 modes",
  },
  {
    icon: ShieldCheck,
    title: "Verified Certificates",
    desc: "Complete a course and download a PDF certificate with a unique verification ID for placement.",
    color: "cyan",
    stat: "Unique ID",
  },
];

const colorBg: Record<string, string> = {
  cyan:    "rgba(76,215,246,0.08)",
  red:     "rgba(239,68,68,0.08)",
  purple:  "rgba(168,85,247,0.08)",
  amber:   "rgba(255,186,69,0.08)",
  emerald: "rgba(16,185,129,0.08)",
};
const colorBorder: Record<string, string> = {
  cyan:    "rgba(76,215,246,0.2)",
  red:     "rgba(239,68,68,0.2)",
  purple:  "rgba(168,85,247,0.2)",
  amber:   "rgba(255,186,69,0.2)",
  emerald: "rgba(16,185,129,0.2)",
};
const colorText: Record<string, string> = {
  cyan:    "#4cd7f6",
  red:     "#f87171",
  purple:  "#c084fc",
  amber:   "#ffba45",
  emerald: "#34d399",
};

/* ── Feature grid (client component) ── */
export function FeaturesGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {features.map((f) => (
        <div
          key={f.title}
          className="group rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
          style={{ background: "linear-gradient(180deg, rgba(20,25,38,0.94), rgba(13,18,29,0.92))", border: "1px solid rgba(255,255,255,0.07)", boxShadow: "0 18px 40px rgba(0,0,0,0.18)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.background = "linear-gradient(180deg, rgba(24,31,45,0.98), rgba(16,21,32,0.96))";
            (e.currentTarget as HTMLDivElement).style.borderColor = colorBorder[f.color];
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.background = "linear-gradient(180deg, rgba(20,25,38,0.94), rgba(13,18,29,0.92))";
            (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)";
          }}
        >
          <div className="flex items-start justify-between mb-4">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: colorBg[f.color], border: `1px solid ${colorBorder[f.color]}` }}
            >
              <f.icon className="w-5 h-5" style={{ color: colorText[f.color] }} />
            </div>
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: colorBg[f.color], color: colorText[f.color] }}
            >
              {f.stat}
            </span>
          </div>
          <h3 className="text-base font-bold mb-2 text-white">{f.title}</h3>
          <p className="text-sm text-[#8ea1ab] leading-relaxed">{f.desc}</p>
        </div>
      ))}
    </div>
  );
}

/* ── Hero CTAs ── */
export function HeroCTAs() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: "0.24s" }}>
      <Link href="/courses/create">
        <button className="btn-primary flex items-center gap-2 px-8 py-4 text-base font-bold shadow-glow-sm">
          <Sparkles className="w-5 h-5" />
          Generate Your Course
          <ArrowRight className="w-5 h-5" />
        </button>
      </Link>
      <Link href="/auth">
        <button className="btn-ghost-cyan flex items-center gap-2 px-8 py-4 text-base font-semibold">
          <PlayCircle className="w-5 h-5" />
          View Dashboard
        </button>
      </Link>
    </div>
  );
}

/* ── Final CTA section ── */
export function FinalCTA() {
  return (
    <section className="px-4 mb-24">
      <div
        className="max-w-3xl mx-auto rounded-3xl p-12 text-center relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(17,24,39,0.94), rgba(11,17,32,0.96), rgba(36,24,44,0.9))",
          border: "1px solid rgba(76,215,246,0.14)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
        }}
      >
        <div className="orb orb-cyan w-80 h-80 -top-20 -right-20 opacity-20" />
        <div className="relative z-10">
          <p className="section-label mb-3">Start learning today</p>
          <h2 className="text-4xl font-extrabold mb-4 text-white">Ready to ace your exams?</h2>
          <p className="text-[#bcc9cd] text-lg mb-8 max-w-lg mx-auto">
            Join students who turned their syllabus into a structured AI learning journey. Free to start.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/courses/create">
              <button className="btn-primary flex items-center gap-2 px-8 py-4 text-base font-bold shadow-glow-cyan">
                <Zap className="w-5 h-5" />
                Generate Free Course
                <ChevronRight className="w-5 h-5" />
              </button>
            </Link>
            <Link href="/auth">
              <button className="btn-ghost-cyan flex items-center gap-2 px-8 py-4 text-base font-semibold">
                Sign in to Dashboard
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
