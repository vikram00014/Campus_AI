"use client";

export default function AnimatedBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-50 overflow-hidden pointer-events-none"
    >
      <div className="absolute -top-[20%] -left-[10%] h-[60vw] w-[60vw] max-w-[800px] max-h-[800px] rounded-full bg-primary/[0.04] dark:bg-primary/[0.07] blur-[80px] transform-gpu" />
      <div className="absolute top-[30%] -right-[15%] h-[50vw] w-[50vw] max-w-[700px] max-h-[700px] rounded-full bg-amber-500/[0.03] dark:bg-indigo-500/[0.05] blur-[90px] transform-gpu" />
      <div className="absolute -bottom-[20%] left-[20%] h-[50vw] w-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-primary/[0.03] dark:bg-cyan-500/[0.04] blur-[80px] transform-gpu" />
    </div>
  );
}

