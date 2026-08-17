"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Application Error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-slate-950 p-6 font-sans text-slate-100 antialiased">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            An unexpected error occurred in the application. Your saved courses and progress remain intact.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => reset()}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-400"
            >
              <RotateCcw className="h-4 w-4" />
              Try again
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-700"
            >
              Return Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
