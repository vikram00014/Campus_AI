import Link from "next/link";
import Image from "next/image";
import {
  GraduationCap, FileText, Sparkles, Trophy,
  CheckCircle2, Clock, Users, Brain, Play, Star,
} from "lucide-react";
import { FeaturesGrid, HeroCTAs, FinalCTA } from "@/components/landing-client";

const steps = [
  { n: "01", title: "Upload Your Syllabus",  desc: "Drop a PDF or paste raw text from your university syllabus.", icon: FileText   },
  { n: "02", title: "AI Builds Your Course", desc: "Gemini 2.5 Flash structures modules, maps topics, and fetches YouTube videos.", icon: Sparkles },
  { n: "03", title: "Study & Track Progress", desc: "Watch, read AI notes, practice MCQs, and earn your certificate.", icon: Trophy  },
];

const stats = [
  { value: "500+",       label: "Courses Created" },
  { value: "< 30s",     label: "Generation Time" },
  { value: "Gemini 2.5", label: "Flash AI Model"  },
  { value: "50+",       label: "Institutions"    },
];

const testimonials = [
  { name: "Arjun Mehta", role: "B.Tech CSE, IIT Delhi", text: "Generated my entire OS syllabus course in 28 seconds. The MCQs actually matched past papers perfectly.", stars: 5 },
  { name: "Priya Sharma", role: "M.Sc Data Science, BITS", text: "The AI notes saved me 40 hours of manual note-taking. Cleared my semester with distinction.", stars: 5 },
  { name: "Rahul Verma", role: "MBA, IIM Bangalore", text: "Used it for case study prep. The YouTube curation is insanely relevant. Highly recommended.", stars: 5 },
];

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden pb-2">
      {/* ── GLOBAL ORB DECORATIONS ── */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="orb orb-cyan   w-[700px] h-[600px] -top-32 -left-40" />
        <div className="orb orb-purple w-[500px] h-[500px] top-1/3  -right-20" />
        <div className="orb orb-amber  w-[400px] h-[400px] bottom-0  left-1/4" />
        <div className="absolute inset-0 dot-bg opacity-35" />
      </div>

      {/* ════════════════════════════════
          HERO SECTION
      ════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-24 sm:py-28">
        {/* Hero background image */}
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src="/bg-hero.png"
            alt="Campus AI — AI transforms syllabus into course"
            fill
            priority
            className="object-cover object-center"
            style={{ opacity: 0.58 }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,19,31,0.08),transparent_34%),linear-gradient(to_bottom,rgba(14,19,31,0.28),rgba(14,19,31,0.18)_32%,rgba(14,19,31,0.82)_100%)]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-sm mb-8 animate-fade-in-up">
            <div className="w-2 h-2 rounded-full bg-[#4cd7f6] animate-glow-pulse" />
            <span className="text-sm font-medium text-[#bcc9cd]">Powered by</span>
            <span className="text-sm font-bold text-[#4cd7f6]">Gemini 2.5 Flash</span>
            <span className="text-[#bcc9cd]">·</span>
            <span className="text-sm font-medium text-[#bcc9cd]">Tavily AI</span>
            <span className="text-[#bcc9cd]">·</span>
            <span className="text-sm font-medium text-[#bcc9cd]">YouTube API</span>
          </div>

          {/* Headline */}
          <h1
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.06] tracking-tight mb-6 animate-fade-in-up text-balance"
            style={{ animationDelay: "0.08s" }}
          >
            Your Syllabus.
            <br />
            <span className="gradient-text-hero">Autonomous LMS.</span>
          </h1>

          <p
            className="text-lg sm:text-xl text-[#bcc9cd] max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up"
            style={{ animationDelay: "0.16s" }}
          >
            Upload a university syllabus PDF and AI instantly builds a complete learning
            path — structured modules, YouTube playlists, exam notes, MCQ practice,
            and a verified certificate. All in under 30 seconds.
          </p>

          {/* CTAs — client component */}
          <HeroCTAs />

          {/* Feature chips */}
          <div
            className="flex flex-wrap justify-center gap-2 mt-10 animate-fade-in-up"
            style={{ animationDelay: "0.32s" }}
          >
            {["PDF Upload", "AI Notes", "YouTube Curation", "MCQ Practice", "Certificates", "Study Plans"].map((tag) => (
              <span key={tag} className="badge-cyan text-xs font-semibold px-3 py-1.5">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════
          STATS BAR
      ════════════════════════════════ */}
      <section className="px-4 mb-24">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px rounded-3xl overflow-hidden glass shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col items-center justify-center p-8 text-center" style={{ background: "rgba(26,31,44,0.7)" }}>
                <p className="text-3xl font-extrabold gradient-text mb-1">{s.value}</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#bcc9cd]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════
          HOW IT WORKS  — with illustration
      ════════════════════════════════ */}
      <section className="px-4 mb-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="section-label mb-3">The process</p>
            <h2 className="text-4xl font-extrabold tracking-tight">How it works</h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            {/* Illustration */}
          <div className="relative rounded-3xl overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.18)]" style={{ border: "1px solid rgba(76,215,246,0.15)" }}>
              <Image
                src="/syllabus-transform.png"
                alt="Syllabus transforms into AI course"
                width={700}
                height={394}
                className="w-full object-cover"
                style={{ opacity: 0.9 }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0e131f]/80 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-sm font-semibold text-[#4cd7f6]">AI-Powered Course Generation</p>
                <p className="text-xs text-[#bcc9cd] mt-1">PDF → Structured modules in under 30 seconds</p>
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-6">
              {steps.map((step) => (
                <div key={step.n} className="flex gap-5 items-start group">
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-glow-sm transition-transform group-hover:-translate-y-1" style={{ background: "linear-gradient(135deg,#acedff,#4cd7f6)" }}>
                      <step.icon className="w-7 h-7 text-[#003640]" />
                    </div>
                    <span className="absolute -top-2 -right-2 text-xs font-extrabold text-[#4cd7f6] bg-[#0e131f] border border-[#4cd7f6]/30 rounded-lg px-1.5 py-0.5">
                      {step.n}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-1">{step.title}</h3>
                    <p className="text-sm text-[#bcc9cd] leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════
          FEATURES GRID
      ════════════════════════════════ */}
      <section className="px-4 mb-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="section-label mb-3">Everything you need</p>
            <h2 className="text-4xl font-extrabold tracking-tight mb-4">
              Built for exam-season survival
            </h2>
            <p className="text-[#bcc9cd] text-lg max-w-xl mx-auto">
              Every feature engineered to take you from confused to confident, fast.
            </p>
          </div>

          {/* Client component — all hover & icon logic is self-contained */}
          <FeaturesGrid />
        </div>
      </section>

      {/* ════════════════════════════════
          AI BRAIN VISUAL SECTION
      ════════════════════════════════ */}
      <section className="px-4 mb-24">
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden" style={{ border: "1px solid rgba(76,215,246,0.15)", background: "rgba(14,19,31,0.7)" }}>
            <div className="grid md:grid-cols-2 items-center gap-0">
              {/* Text side */}
              <div className="p-10 md:p-14">
                <p className="section-label mb-4">Powered by Gemini 2.5 Flash</p>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-6">
                  The smartest AI curriculum engine ever built
                </h2>
                <p className="text-[#bcc9cd] leading-relaxed mb-8">
                  Our AI doesn&apos;t just parse text - it understands educational structure,
                  maps prerequisite relationships, curates the most authoritative
                  YouTube content, and generates adaptive MCQs calibrated to your
                  university&apos;s exam pattern.
                </p>
                <div className="space-y-3">
                  {[
                    { icon: Brain,        text: "Deep semantic understanding of syllabus topics" },
                    { icon: Play,         text: "YouTube curation with educational relevance scoring" },
                    { icon: CheckCircle2, text: "Adaptive MCQs with difficulty calibration" },
                    { icon: Trophy,       text: "Blockchain-verifiable course certificates" },
                  ].map((item) => (
                    <div key={item.text} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(76,215,246,0.12)" }}>
                        <item.icon className="w-3 h-3 text-[#4cd7f6]" />
                      </div>
                      <p className="text-sm text-[#bcc9cd]">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Image side */}
              <div className="relative h-80 md:h-full min-h-[380px]">
                <Image
                  src="/ai-brain-orb.png"
                  alt="AI brain powering Campus AI"
                  fill
                  className="object-cover opacity-95"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0e131f]/55 via-[#0e131f]/8 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════
          STUDENTS PHOTO ROW
      ════════════════════════════════ */}
      <section className="px-4 mb-24">
        <div className="max-w-6xl mx-auto rounded-3xl overflow-hidden" style={{ border: "1px solid rgba(76,215,246,0.15)" }}>
          <div className="relative h-72">
            <Image
              src="/students-studying.png"
              alt="Students using Campus AI in a futuristic library"
              fill
              className="object-cover"
              style={{ opacity: 0.82 }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#090e1a]/88 via-[#090e1a]/24 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <p className="text-2xl font-extrabold mb-1">Trusted by students across India</p>
              <p className="text-[#bcc9cd]">From IITs to state universities — Campus AI has you covered.</p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 divide-x divide-white/[0.05] glass">
            {[
              { icon: Clock,         v: "< 30s", l: "Generation" },
              { icon: CheckCircle2,  v: "100%",  l: "Auto-structured" },
              { icon: Users,         v: "500+",  l: "Courses built" },
            ].map((d) => (
              <div key={d.l} className="flex items-center gap-4 p-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(76,215,246,0.1)" }}>
                  <d.icon className="w-5 h-5 text-[#4cd7f6]" />
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-[#4cd7f6]">{d.v}</p>
                  <p className="text-xs text-[#bcc9cd] font-medium">{d.l}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════
          TESTIMONIALS
      ════════════════════════════════ */}
      <section className="px-4 mb-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="section-label mb-3">What students say</p>
            <h2 className="text-4xl font-extrabold tracking-tight">Loved by top students</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="glass rounded-2xl p-6 flex flex-col gap-4" style={{ border: "1px solid rgba(76,215,246,0.08)" }}>
                <div className="flex gap-1">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#ffba45] text-[#ffba45]" />
                  ))}
                </div>
                <p className="text-[#bcc9cd] text-sm leading-relaxed flex-1">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <p className="font-bold text-sm" style={{ color: "#dee2f3" }}>{t.name}</p>
                  <p className="text-xs text-[#bcc9cd]">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════
          CERTIFICATE PREVIEW
      ════════════════════════════════ */}
      <section className="px-4 mb-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="section-label mb-4">Course Certificates</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-6">
                Earn a verifiable certificate upon completion
              </h2>
              <p className="text-[#bcc9cd] leading-relaxed mb-8">
                Every completed course generates a unique, tamper-proof certificate
                that can be verified instantly online. Share it on LinkedIn or
                attach it to job applications.
              </p>
              <div className="space-y-3">
                {[
                  "Auto-generated after 100% module completion",
                  "Unique verification ID for each certificate",
                  "Shareable link + downloadable PDF",
                  "Instantly verifiable at campus-ai/verify",
                ].map((point) => (
                  <div key={point} className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-[#4cd7f6]" />
                    <p className="text-sm text-[#bcc9cd]">{point}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link
                  href="/verify"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{ border: "1px solid rgba(76,215,246,0.3)", color: "#4cd7f6", background: "rgba(76,215,246,0.06)" }}
                >
                  Verify a Certificate →
                </Link>
              </div>
            </div>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl" style={{ border: "1px solid rgba(76,215,246,0.2)" }}>
              <Image
                src="/certificate-preview.png"
                alt="Campus AI Course Completion Certificate"
                width={600}
                height={450}
                className="w-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0e131f]/36 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA — client component */}
      <FinalCTA />

      {/* ════════════════════════════════
          FOOTER
      ════════════════════════════════ */}
      <footer className="px-4 py-10 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(76,215,246,0.12)", border: "1px solid rgba(76,215,246,0.25)" }}>
              <GraduationCap className="w-5 h-5 text-[#4cd7f6]" />
            </div>
            <span className="font-bold text-base">CAMPUS <span className="text-[#4cd7f6]">AI</span></span>
          </div>
          <div className="flex items-center gap-6 text-sm text-[#bcc9cd]">
            <Link href="/verify"    className="hover:text-[#4cd7f6] transition-colors">Verify Certificate</Link>
            <Link href="/dashboard" className="hover:text-[#4cd7f6] transition-colors">Dashboard</Link>
            <Link href="/auth"      className="hover:text-[#4cd7f6] transition-colors">Sign In</Link>
          </div>
          <p className="text-xs text-[#869397]">© 2026 CAMPUS AI. Built for Indian college students.</p>
        </div>
      </footer>
    </div>
  );
}
