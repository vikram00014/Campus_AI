import { Skeleton } from "@/components/ui/skeleton";

export default function CoursePlayerLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden">
      {/* Sidebar Skeleton */}
      <div className="hidden w-72 shrink-0 flex-col border-r border-border bg-card/50 md:flex">
        <div className="shrink-0 border-b border-border p-4">
          <div className="mb-3 flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-5 w-44" />
          </div>
          <div className="mb-1 flex items-center gap-2">
            <Skeleton className="h-1.5 flex-1 rounded-full" />
            <Skeleton className="h-4 w-8" />
          </div>
          <Skeleton className="mt-1 h-3 w-20" />
        </div>

        <div className="flex-1 space-y-3 p-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center gap-3 rounded-xl bg-muted/40 px-3 py-2.5">
                <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-2.5 w-16" />
                </div>
              </div>
              {i === 1 && (
                <div className="ml-10 space-y-1 border-l border-primary/20 pl-2">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="flex items-center gap-2 px-2 py-1.5">
                      <Skeleton className="h-3.5 w-3.5 shrink-0 rounded-full" />
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
      <div className="flex flex-1 flex-col overflow-hidden bg-background">
        <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-3 md:px-5">
          <div className="flex items-center gap-2">
            <Skeleton className="hidden h-4 w-32 sm:block" />
            <Skeleton className="hidden h-4 w-4 rounded-full sm:block" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-8 w-32 rounded-xl" />
        </header>

        <div className="flex-1 overflow-auto p-6 md:p-8">
          <div className="mx-auto w-full max-w-4xl space-y-6">
            {/* Title + badges */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <Skeleton className="h-8 w-72 max-w-full" />
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Skeleton className="h-9 w-20 rounded-xl" />
                <Skeleton className="h-9 w-20 rounded-xl" />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex w-full gap-1 rounded-xl border border-border bg-muted p-1">
              <Skeleton className="h-8 flex-1 rounded-lg" />
              <Skeleton className="h-8 flex-1 rounded-lg" />
              <Skeleton className="h-8 flex-1 rounded-lg" />
            </div>

            {/* Video area */}
            <div className="surface-card overflow-hidden">
              <Skeleton className="aspect-video w-full rounded-none" />
              <div className="space-y-2 p-5">
                <Skeleton className="h-5 w-64 max-w-full" />
                <Skeleton className="h-4 w-80 max-w-full" />
              </div>
            </div>

            {/* Notes preview */}
            <div className="surface-card space-y-3 p-6">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-[90%]" />
              <Skeleton className="h-3.5 w-[80%]" />
              <Skeleton className="h-3.5 w-[85%]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

