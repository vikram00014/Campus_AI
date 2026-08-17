"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  FileText,
  ShieldCheck,
  Sparkles,
  Target,
  Youtube,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: FileText,
    title: "Syllabus Becomes Structure",
    desc: "AI parses raw syllabus text into structured modules, logical topics, and an actionable roadmap.",
    tag: "Core Engine",
  },
  {
    icon: Youtube,
    title: "Curated Lecture Videos",
    desc: "Top educational lectures are matched topic by topic so students can start watching immediately.",
    tag: "Video Integration",
  },
  {
    icon: BrainCircuit,
    title: "Structured Notes & MCQs",
    desc: "Generate comprehensive revision notes and practice question sets with instant explanations.",
    tag: "On-Demand",
  },
  {
    icon: BarChart3,
    title: "Personalized Study Plan",
    desc: "Your dashboard surfaces actionable recommendations, study streaks, and XP points.",
    tag: "Analytics",
  },
  {
    icon: Target,
    title: "Weak Topic Intelligence",
    desc: "Identifies challenging concepts and surfaces revision alerts ahead of exam deadlines.",
    tag: "Exam Ready",
  },
  {
    icon: ShieldCheck,
    title: "Verifiable Certificates",
    desc: "Earn formal PDF certificates upon course completion with cryptographic verification IDs.",
    tag: "Credential",
  },
];

export function FeaturesGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {features.map((feature) => (
        <article key={feature.title} className="surface-card-interactive p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <feature.icon className="h-5 w-5" />
              </span>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted px-2 py-0.5 rounded-md">
                {feature.tag}
              </span>
            </div>
            <h3 className="text-base font-bold text-foreground">{feature.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.desc}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

export function HeroCTAs() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button asChild size="lg" className="shadow-md shadow-primary/20">
        <Link href="/courses/create">
          <Sparkles className="h-4 w-4" />
          Generate Course Now
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
      <Button asChild size="lg" variant="outline">
        <Link href="/verify">Verify Certificate</Link>
      </Button>
    </div>
  );
}

export function FinalCTA() {
  return (
    <section className="app-shell pb-16">
      <div className="surface-card relative overflow-hidden flex flex-col items-start justify-between gap-6 p-8 md:p-10 md:flex-row md:items-center">
        <div className="max-w-2xl">
          <p className="section-label">Start Your Semester Ahead</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Turn syllabus panic into structured mastery.</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Upload your syllabus PDF and get an organized course with videos, notes, practice MCQs, and progress tracking in under 60 seconds.
          </p>
        </div>
        <Button asChild size="lg" className="shrink-0 shadow-md shadow-primary/20">
          <Link href="/courses/create">
            <Sparkles className="h-4 w-4" />
            Generate My Course
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}


