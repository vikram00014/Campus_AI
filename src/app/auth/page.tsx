"use client";

import { useState } from "react";
import Image from "next/image";
import {
  GraduationCap, Loader2, Sparkles, BookOpenCheck,
  BrainCircuit, ShieldCheck, Eye, EyeOff, ArrowRight,
} from "lucide-react";
import { login, signup } from "@/app/actions/auth";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred";
}

const features = [
  { icon: BookOpenCheck,  title: "Course Structuring",    description: "Auto module/topic breakdown from your university syllabus in seconds." },
  { icon: BrainCircuit,   title: "Adaptive Practice",     description: "Difficulty-aware MCQ generation with timed mock exam support." },
  { icon: Sparkles,       title: "Smart Insights",        description: "Weak-topic detection and personalized daily study plans." },
  { icon: ShieldCheck,    title: "Verified Certificates", description: "Completion certificates with unique verification IDs for placement." },
];

export default function AuthPage() {
  const router = useRouter();
  const [loading,      setLoading      ] = useState(false);
  const [errorMsg,     setErrorMsg     ] = useState("");
  const [activeTab,    setActiveTab    ] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword ] = useState(false);

  async function handleAuth(action: "login" | "signup", formData: FormData) {
    setLoading(true);
    setErrorMsg("");
    try {
      const result = action === "login" ? await login(formData) : await signup(formData);
      if (result?.error) { setErrorMsg(result.error); setLoading(false); }
      else { router.push("/dashboard"); router.refresh(); }
    } catch (e: unknown) { setErrorMsg(getErrorMessage(e)); setLoading(false); }
  }

  return (
    <div className="relative min-h-[calc(100vh-64px)] flex items-center justify-center overflow-hidden px-4 py-12">
      {/* Background orbs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="orb orb-cyan    w-[600px] h-[500px] -top-24 -left-32" />
        <div className="orb orb-amber   w-[400px] h-[400px] bottom-0  right-0 opacity-60" />
        <div className="orb orb-purple  w-[300px] h-[300px] top-1/2  left-1/2 opacity-40" />
        <div className="absolute inset-0 dot-bg opacity-50" />
      </div>

      <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1.15fr_0.85fr] items-center">
        {/* ── LEFT BRANDING PANEL ── */}
        <motion.section
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0  }}
          transition={{ duration: 0.5 }}
          className="hidden lg:block rounded-3xl relative overflow-hidden"
          style={{ border: "1px solid rgba(76,215,246,0.15)", minHeight: "560px" }}
        >
          {/* Background image */}
          <Image
            src="/bg-hero.png"
            alt=""
            fill
            className="object-cover"
            style={{ opacity: 0.42 }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#090e1a]/72 via-[#0e131f]/68 to-[#0e131f]/44" />
          <div className="absolute inset-0 dot-bg opacity-22" />

          <div className="relative z-10 p-10 flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-10">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: "rgba(76,215,246,0.12)", border: "1px solid rgba(76,215,246,0.3)" }}>
                <GraduationCap className="w-6 h-6 text-[#4cd7f6]" />
              </div>
              <div>
                <p className="text-xl font-extrabold">CAMPUS <span className="text-[#4cd7f6]">AI</span></p>
                <p className="text-xs text-[#bcc9cd]">Autonomous course engine</p>
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-4xl xl:text-5xl font-extrabold leading-[1.1] tracking-tight mb-5">
              Learn faster with
              <span className="block gradient-text-hero mt-1">AI-structured courses,</span>
              videos &amp; revision plans.
            </h1>
            <p className="text-[#bcc9cd] text-base leading-relaxed mb-10 max-w-md">
              Build complete learning journeys from your syllabus, track weak topics,
              and optimize for exams with adaptive AI practice.
            </p>

            {/* Feature grid */}
            <div className="grid grid-cols-2 gap-3 mt-auto">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="rounded-2xl p-4 transition-colors"
                  style={{ background: "rgba(26,31,44,0.7)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <f.icon className="w-4 h-4 text-[#4cd7f6]" />
                    <span className="text-sm font-semibold">{f.title}</span>
                  </div>
                  <p className="text-xs text-[#bcc9cd] leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ── RIGHT FORM PANEL ── */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0  }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-md mx-auto"
        >
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(76,215,246,0.12)", border: "1px solid rgba(76,215,246,0.25)" }}>
              <GraduationCap className="w-5 h-5 text-[#4cd7f6]" />
            </div>
            <span className="font-extrabold text-xl">CAMPUS <span className="text-[#4cd7f6]">AI</span></span>
          </div>

          <div className="mb-8 text-center">
            <h2 className="text-2xl font-extrabold mb-1">Access Your Learning Workspace</h2>
            <p className="text-sm text-[#bcc9cd]">Use your email and password to continue.</p>
          </div>

          {/* Tab switcher */}
          <div className="flex rounded-2xl p-1 mb-6" style={{ background: "#161b28" }}>
            {(["login", "signup"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setErrorMsg(""); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                style={
                  activeTab === tab
                    ? { background: "rgba(76,215,246,0.15)", color: "#4cd7f6", border: "1px solid rgba(76,215,246,0.25)" }
                    : { color: "#bcc9cd" }
                }
              >
                {tab === "login" ? "Log In" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* Form card */}
          <div className="rounded-3xl p-8 shadow-[0_22px_70px_rgba(0,0,0,0.22)]" style={{ background: "rgba(26,31,44,0.84)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}>
            {activeTab === "login" ? (
              <>
                <h3 className="text-lg font-bold mb-1">Welcome back</h3>
                <p className="text-sm text-[#bcc9cd] mb-6">Enter your credentials to continue your courses.</p>
                <form action={(fd) => handleAuth("login", fd)} className="space-y-4">
                  <InputField id="email-login" name="email" type="email" label="Email" placeholder="student@college.edu" />
                  <PasswordField id="password-login" name="password" showPassword={showPassword} toggle={() => setShowPassword((v) => !v)} />
                  {errorMsg && <ErrorMsg msg={errorMsg} />}
                  <PrimaryButton loading={loading} label="Sign In" loadingLabel="Signing In..." />
                </form>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold mb-1">Create your account</h3>
                <p className="text-sm text-[#bcc9cd] mb-6">Start generating AI-powered courses in minutes.</p>
                <form action={(fd) => handleAuth("signup", fd)} className="space-y-4">
                  <InputField id="name-signup"  name="name"  type="text"  label="Full Name"  placeholder="Vikram Singh" />
                  <InputField id="email-signup" name="email" type="email" label="Email"      placeholder="student@college.edu" />
                  <PasswordField id="password-signup" name="password" showPassword={showPassword} toggle={() => setShowPassword((v) => !v)} />
                  {errorMsg && <ErrorMsg msg={errorMsg} />}
                  <PrimaryButton loading={loading} label="Create Free Account" loadingLabel="Creating Account..." isSignup />
                </form>
              </>
            )}
          </div>

          <p className="text-center text-xs text-[#869397] mt-5 leading-relaxed">
            By continuing, you agree to our Terms of Service.<br />
            Your data is protected by Supabase Row Level Security.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */
function InputField({ id, name, type = "text", label, placeholder }: { id: string; name: string; type?: string; label: string; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-[#dee2f3]">{label}</label>
      <input
        id={id} name={name} type={type} required placeholder={placeholder}
        className="w-full px-4 py-3 text-sm input-dark"
      />
    </div>
  );
}

function PasswordField({ id, name, showPassword, toggle }: { id: string; name: string; showPassword: boolean; toggle: () => void }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-[#dee2f3]">Password</label>
      <div className="relative">
        <input
          id={id} name={name} type={showPassword ? "text" : "password"} required
        autoComplete={id.includes("login") ? "current-password" : "new-password"}
        className="w-full px-4 py-3 pr-11 text-sm input-dark"
        />
        <button
          type="button"
          onClick={toggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#bcc9cd] hover:text-[#dee2f3] transition-colors"
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function ErrorMsg({ msg }: { msg: string }) {
  return (
    <p className="text-sm text-red-400 font-medium px-4 py-3 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
      {msg}
    </p>
  );
}

function PrimaryButton({ loading, label, loadingLabel, isSignup }: { loading: boolean; label: string; loadingLabel: string; isSignup?: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 text-sm mt-2 disabled:opacity-60"
    >
      {loading
        ? <><Loader2 className="w-4 h-4 animate-spin" />{loadingLabel}</>
        : isSignup
          ? <><Sparkles className="w-4 h-4" />{label}</>
          : <><ArrowRight className="w-4 h-4" />{label}</>
      }
    </button>
  );
}
