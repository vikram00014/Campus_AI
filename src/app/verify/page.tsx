"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function VerifyPage() {
  const router = useRouter();
  const [verificationId, setVerificationId] = useState("");
  const [touched, setTouched] = useState(false);

  const normalized = verificationId.trim().toUpperCase();
  const hasValue = normalized.length > 0;
  const isValidFormat = /^CAI-[A-Z0-9]{4,}$/i.test(normalized);
  const showError = touched && hasValue && !isValidFormat;

  const handleVerify = () => {
    setTouched(true);
    if (!normalized) return;
    router.push(`/verify/${encodeURIComponent(normalized)}`);
  };

  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-background px-4 py-12">
      <section className="w-full max-w-xl text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-card">
          <ShieldCheck className="h-7 w-7 text-primary" />
        </div>
        <p className="section-label">Certificate Verification</p>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Verify a CAMPUS AI certificate.</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-muted-foreground">
          Paste the verification ID from a certificate to confirm the learner, course, and issue date.
        </p>

        <div className="surface-card mt-8 p-6 text-left">
          <label htmlFor="verificationId" className="text-sm font-semibold">
            Verification ID
          </label>
          <div className="relative mt-2">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="verificationId"
              value={verificationId}
              onChange={(event) => setVerificationId(event.target.value)}
              onBlur={() => setTouched(true)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleVerify();
                }
              }}
              autoFocus
              autoComplete="off"
              spellCheck={false}
              placeholder="CAI-AB12CD34"
              className={cn(
                "input-field pl-11 font-mono uppercase tracking-widest placeholder:font-sans placeholder:normal-case placeholder:tracking-normal",
                showError && "border-destructive"
              )}
            />
          </div>
          {showError && (
            <p className="mt-2 text-sm font-medium text-destructive">
              Use the format printed on the certificate, for example CAI-AB12CD34.
            </p>
          )}
          <Button onClick={handleVerify} disabled={!hasValue} className="mt-5 w-full" size="lg">
            Verify certificate
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-8 grid gap-3 text-left sm:grid-cols-3">
          {[
            ["1", "Enter ID"],
            ["2", "Registry lookup"],
            ["3", "View result"],
          ].map(([step, label]) => (
            <div key={step} className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-bold text-primary">{step}</p>
              <p className="mt-1 text-sm font-semibold">{label}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

