import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, FileText, GraduationCap, Layers3, Sparkles } from "lucide-react";
import { FeaturesGrid, FinalCTA, HeroCTAs } from "@/components/landing-client";
import { Button } from "@/components/ui/button";

const steps = [
  {
    icon: FileText,
    title: "1. Upload or paste your syllabus",
    desc: "Use your university's official PDF or paste raw topic outlines directly.",
  },
  {
    icon: Layers3,
    title: "2. Generate your structured roadmap",
    desc: "AI organizes the curriculum into modules, curated video lectures, notes, and MCQ quizzes.",
  },
  {
    icon: GraduationCap,
    title: "3. Master topics and certify",
    desc: "Track mastery topic by topic, review weak areas, and unlock verifiable certificates.",
  },
];

export default function LandingPage() {
  return (
    <div className="bg-background">
      <section className="app-shell grid min-h-[calc(100vh-64px)] items-center gap-10 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            Autonomous Course Engine for Students
          </div>
          <h1 className="text-4xl font-bold leading-[1.15] text-balance sm:text-5xl lg:text-6xl tracking-tight">
            Your university syllabus, converted into a course you can actually finish.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
            CAMPUS AI transforms dense syllabus documents into an interactive study companion with structured modules,
            top-educator video lectures, generated notes, diagnostic MCQs, and cryptographic certificates.
          </p>
          <div className="mt-8">
            <HeroCTAs />
          </div>
          <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
            {["Instant Generation", "Topic-First Player", "Verified Certificates"].map((item) => (
              <div key={item} className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="surface-card overflow-hidden shadow-lg">
            <div className="relative aspect-[4/3]">
              <Image
                src="/syllabus-transform.png"
                alt="A syllabus transformed into a structured course"
                fill
                priority
                className="object-cover"
              />
            </div>
            <div className="border-t border-border p-4 sm:p-5 bg-card/60">
              <div className="grid gap-3 sm:grid-cols-3">
                <PreviewItem label="Input" value="PDF Syllabus" />
                <PreviewItem label="AI Engine" value="Modules + Topics" />
                <PreviewItem label="Study Suite" value="Videos, Notes, MCQs" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="app-shell py-16 sm:py-20 border-t border-border/50">
        <div className="mb-10 max-w-2xl">
          <p className="section-label">How it works</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">One clear path from syllabus to complete mastery.</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Zero friction, no endless searching for study materials. Everything is organized and ready to study.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {steps.map((step) => (
            <article key={step.title} className="surface-card-interactive p-6 flex flex-col justify-between">
              <div>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-5">
                  <step.icon className="h-5 w-5" />
                </span>
                <h3 className="text-base font-bold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="app-shell py-16 sm:py-20 border-t border-border/50">
        <div className="mb-10 max-w-2xl">
          <p className="section-label">Study Tools</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Designed for focused sessions and exam prep.</h2>
        </div>
        <FeaturesGrid />
      </section>

      <section className="app-shell grid gap-8 py-16 sm:py-20 lg:grid-cols-[0.95fr_1.05fr] lg:items-center border-t border-border/50">
        <div className="surface-card overflow-hidden shadow-md">
          <Image
            src="/certificate-preview.png"
            alt="CAMPUS AI certificate preview"
            width={900}
            height={650}
            className="w-full object-cover"
          />
        </div>
        <div>
          <p className="section-label">Credible Proof of Work</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Formal certificates with public cryptographic verification.</h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Students earn an official downloadable PDF certificate upon completing all topics and quizzes in a course. Anyone can verify the authenticity from the public verification portal using the unique ID.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/verify">
              Verify a Certificate
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <FinalCTA />
    </div>
  );
}

function PreviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-muted/70 p-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-xs font-bold text-foreground">{value}</p>
    </div>
  );
}

