import { Skeleton } from "@/components/ui/skeleton";

export default function CoursePlayerLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden">
      {/* Sidebar Skeleton */}
      <div
        className="w-72 flex-col h-full hidden md:flex shrink-0"
        style={{ borderRight: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}
      >
        <div className="p-4 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-5 w-44" />
          </div>
          <div className="flex items-center gap-2 mb-1">
            <Skeleton className="h-1.5 flex-1 rounded-full" />
            <Skeleton className="h-4 w-8" />
          </div>
          <Skeleton className="h-3 w-20 mt-1" />
        </div>

        <div className="flex-1 p-3 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                <Skeleton className="w-7 h-7 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-2.5 w-16" />
                </div>
              </div>
              {i === 1 && (
                <div className="ml-10 space-y-0.5 pl-2" style={{ borderLeft: "1px solid rgba(76,215,246,0.12)" }}>
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="flex items-center gap-2 px-2 py-1.5 rounded-lg">
                      <Skeleton className="w-3.5 h-3.5 rounded-full shrink-0" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: "#0e131f" }}>
        <header
          className="h-14 flex items-center px-3 md:px-5 justify-between shrink-0 gap-2"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-32 hidden sm:block" />
            <Skeleton className="h-4 w-4 rounded-full hidden sm:block" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-8 w-32 rounded-xl" />
        </header>

        <div className="flex-1 overflow-auto p-6 md:p-8">
          <div className="max-w-4xl mx-auto w-full space-y-6">
            {/* Title + badges */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <Skeleton className="h-8 w-72" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Skeleton className="h-9 w-32 rounded-xl" />
                <Skeleton className="h-9 w-28 rounded-xl" />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl w-full" style={{ background: "#090e1a", border: "1px solid rgba(255,255,255,0.06)" }}>
              <Skeleton className="h-8 flex-1 rounded-lg" />
              <Skeleton className="h-8 flex-1 rounded-lg" />
              <Skeleton className="h-8 flex-1 rounded-lg" />
            </div>

            {/* Video area */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: "rgba(22,27,40,0.85)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <Skeleton className="aspect-video w-full" style={{ borderRadius: 0 }} />
              <div className="p-5 space-y-2">
                <Skeleton className="h-5 w-64" />
                <Skeleton className="h-4 w-80" />
              </div>
            </div>

            {/* Notes preview */}
            <div
              className="rounded-2xl p-6 space-y-3"
              style={{ background: "rgba(22,27,40,0.85)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-[90%]" />
              <Skeleton className="h-3 w-[80%]" />
              <Skeleton className="h-3 w-[85%]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
