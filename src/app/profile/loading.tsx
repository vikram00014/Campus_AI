import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <main className="bg-background py-8 sm:py-10">
      <div className="app-shell space-y-8">
        <div className="surface-card p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <Skeleton className="h-20 w-20 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-60 max-w-full" />
              <div className="flex gap-4 pt-1">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="surface-card p-5 text-center">
              <Skeleton className="mx-auto h-5 w-5 rounded-full" />
              <Skeleton className="mx-auto mt-3 h-8 w-16" />
              <Skeleton className="mx-auto mt-2 h-3 w-24" />
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-6">
            <div className="surface-card space-y-4 p-6">
              <Skeleton className="h-6 w-32" />
              {[1, 2, 3, 4].map((item) => (
                <Skeleton key={item} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          </div>
          <div className="surface-card space-y-4 p-6">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-72 max-w-full" />
            <div className="grid gap-4 pt-4 md:grid-cols-2">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl md:col-span-2" />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
