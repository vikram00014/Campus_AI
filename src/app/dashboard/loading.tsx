import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="orb orb-cyan   w-[500px] h-[400px] -top-20 -left-20 opacity-50" />
        <div className="orb orb-amber  w-[350px] h-[350px] bottom-0  right-0  opacity-40" />
        <div className="absolute inset-0 dot-bg opacity-30" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Header skeleton */}
        <div className="relative mb-10 rounded-3xl p-8" style={{ background: "rgba(22,27,40,0.8)", border: "1px solid rgba(76,215,246,0.12)" }}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-40 mb-1" />
              <Skeleton className="h-10 w-56" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-11 w-48 rounded-2xl" />
          </div>
        </div>

        {/* Stat cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl p-6" style={{ background: "#161b28", border: "1px solid rgba(255,255,255,0.06)" }}>
              <Skeleton className="h-4 w-32 mb-3" />
              <Skeleton className="h-14 w-20 mb-2" />
              <Skeleton className="h-3 w-40" />
            </div>
          ))}
        </div>

        {/* Gamification row skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-xl p-4" style={{ background: "#161b28", border: "1px solid rgba(255,255,255,0.05)" }}>
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-7 w-12" />
            </div>
          ))}
        </div>

        {/* Two column panels skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-10">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-2xl overflow-hidden" style={{ background: "#161b28", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="p-6 pb-4">
                <Skeleton className="h-5 w-40 mb-2" />
                <Skeleton className="h-3 w-56" />
              </div>
              <div className="px-3 pb-4 space-y-2">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <div className="space-y-1.5">
                      <Skeleton className="h-3.5 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-8 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Courses section skeleton */}
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-44 rounded-xl" />
            <Skeleton className="h-9 w-28 rounded-xl" />
            <Skeleton className="h-9 w-20 rounded-xl" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl overflow-hidden" style={{ background: "#1a1f2c", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="p-6">
                <div className="flex justify-between items-start gap-2 mb-3">
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-6 w-48 mb-1" />
                <Skeleton className="h-3 w-36 mb-4" />
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              </div>
              <div className="px-6 py-4 flex gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <Skeleton className="h-10 flex-1 rounded-xl" />
                <Skeleton className="h-10 w-11 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
