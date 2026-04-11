"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ShieldCheck, Search, CheckCircle2, AlertCircle, Sparkles, GraduationCap, Lock, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function VerifyPage() {
  const router = useRouter();
  const [verificationId, setVerificationId] = useState("");
  const [touched, setTouched] = useState(false);

  const isValidFormat = /^CAI-[A-Z0-9]{4,}$/i.test(verificationId.trim());
  const showError = touched && verificationId.trim().length > 0 && !isValidFormat;

  const handleVerify = () => {
    const normalized = verificationId.trim().toUpperCase();
    if (!normalized) { setTouched(true); return; }
    router.push(`/verify/${encodeURIComponent(normalized)}`);
  };

  return (
    <div className="relative min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-4 py-16 overflow-hidden bg-[#0b1120]">

      {/* ── Background ── */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <Image src="/bg-hero.png" alt="" fill className="object-cover" style={{ opacity: 0.18 }} />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,12,22,0.38),rgba(10,16,28,0.86))]" />
        <div className="orb orb-cyan   w-[520px] h-[420px] -top-16 left-1/4 opacity-40" />
        <div className="orb orb-purple w-[320px] h-[320px] bottom-0  right-1/4 opacity-12" />
        <div className="absolute inset-0 dot-bg opacity-18" />
      </div>

      {/* ── Hero Icon ── */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1,   opacity: 1  }}
        transition={{ type: "spring", damping: 18, stiffness: 200 }}
        className="mb-8 relative"
      >
        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-full animate-glow-pulse" style={{ background: "rgba(76,215,246,0.15)", transform: "scale(1.5)", filter: "blur(16px)" }} />
        {/* Icon circle */}
        <div
          className="relative w-24 h-24 rounded-3xl flex items-center justify-center shadow-glow-cyan"
          style={{ background: "linear-gradient(135deg, rgba(76,215,246,0.2), rgba(56,189,248,0.15))", border: "1.5px solid rgba(76,215,246,0.35)" }}
        >
          <ShieldCheck className="w-11 h-11 text-[#4cd7f6]" />
        </div>
      </motion.div>

      {/* ── Heading ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0  }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="text-center mb-10 max-w-xl"
      >
        <p className="section-label mb-3">Certificate Verification</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 text-white">
          Verify Authenticity
        </h1>
        <p className="text-[#bcc9cd] text-base leading-relaxed">
          Enter a <strong className="text-[#4cd7f6]">CAMPUS AI</strong> verification ID to confirm a certificate is real and was legitimately earned.
        </p>
      </motion.div>

      {/* ── Verify Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0  }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="w-full max-w-md mb-10"
      >
        <div className="glass rounded-3xl p-8">
          <div className="space-y-4">
            {/* Input */}
            <div>
              <label htmlFor="verifyId" className="text-xs font-semibold text-[#8ea1ab] uppercase tracking-widest mb-2 block">
                Verification ID
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8ea1ab]" />
                <input
                  id="verifyId"
                  value={verificationId}
                  onChange={(e) => setVerificationId(e.target.value)}
                  onBlur={() => setTouched(true)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleVerify(); } }}
                  placeholder="e.g. CAI-AB12CD34"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full pl-11 pr-4 py-3.5 text-sm input-dark uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal"
                  style={{ fontFamily: "monospace" }}
                />
              </div>
              <AnimatePresence>
                {showError && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-xs text-red-400 mt-2 flex items-center gap-1.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    Format should be CAI-XXXXXXXX
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* CTA */}
            <button
              onClick={handleVerify}
              disabled={!verificationId.trim()}
              className="btn-primary w-full py-3.5 font-bold text-sm flex items-center justify-center gap-2 shadow-glow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <ShieldCheck className="w-4 h-4" />
              Verify Certificate
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Trust Badges ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="flex flex-wrap gap-3 justify-center mb-12"
      >
        {[
          { icon: Lock,          label: "Tamper-Proof IDs"     },
          { icon: GraduationCap, label: "University-Grade"     },
          { icon: CheckCircle2,  label: "Instant Verification" },
          { icon: Sparkles,      label: "AI-Verified"          },
        ].map((badge) => (
          <div
            key={badge.label}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-[#bcc9cd] border border-white/8 bg-white/[0.04]"
          >
            <badge.icon className="w-3.5 h-3.5 text-[#4cd7f6]" />
            {badge.label}
          </div>
        ))}
      </motion.div>

      {/* ── How it works ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0  }}
        transition={{ delay: 0.45 }}
        className="w-full max-w-2xl"
      >
        <p className="text-center text-xs text-[#8ea1ab] uppercase tracking-widest font-semibold mb-5">How verification works</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { step: "1", title: "Enter ID",     desc: "Paste the verification ID printed on the certificate." },
            { step: "2", title: "We Lookup",    desc: "Our system checks the secure CAMPUS AI certificate registry." },
            { step: "3", title: "Instant Result", desc: "See the student name, course, and completion date." },
          ].map((item) => (
            <div key={item.step} className="glass rounded-2xl p-5 flex flex-col gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-extrabold text-[#003640]"
                style={{ background: "linear-gradient(135deg,#acedff,#4cd7f6)" }}
              >
                {item.step}
              </div>
              <div>
                <p className="text-sm font-bold mb-1 text-white">{item.title}</p>
                <p className="text-xs text-[#8ea1ab] leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Certificate preview ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-14 w-full max-w-lg"
      >
        <p className="text-center text-xs text-[#8ea1ab] uppercase tracking-widest font-semibold mb-4">Sample Certificate</p>
        <div className="relative rounded-2xl overflow-hidden shadow-[0_22px_50px_rgba(0,0,0,0.22)]" style={{ border: "1px solid rgba(76,215,246,0.16)", background: "rgba(13,18,29,0.86)" }}>
          <Image
            src="/certificate-preview.png"
            alt="CAMPUS AI Course Completion Certificate"
            width={680}
            height={510}
            className="w-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e131f]/20 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-0 right-0 text-center">
            <span className="text-xs font-semibold text-[#4cd7f6] px-3 py-1 rounded-full" style={{ background: "rgba(76,215,246,0.12)", border: "1px solid rgba(76,215,246,0.2)" }}>Sample — your certificate will look like this</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
