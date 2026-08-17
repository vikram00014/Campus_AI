import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <main className="bg-background py-8 sm:py-10">
      <div className="app-shell space-y-10">
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Skeleton className="mb-3 h-4 w-28" />
            <Skeleton className="h-10 w-80 max-w-full" />
            <Skeleton className="mt-3 h-4 w-96 max-w-full" />
          </div>
          <Skeleton className="h-10 w-40 rounded-xl" />
        </header>
        <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="surface-card p-6">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="mt-4 h-8 w-64" />
            <Skeleton className="mt-3 h-4 w-48" />
            <Skeleton className="mt-8 h-2 w-full rounded-full" />
            <Skeleton className="mt-6 h-10 w-32 rounded-xl" />
          </div>
          <div className="surface-card p-6">
            <Skeleton className="h-5 w-56" />
            <div className="mt-6 space-y-2">
              {[1, 2, 3, 4].map((item) => (
                <Skeleton key={item} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </section>
        <section className="grid gap-4 lg:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <Skeleton key={item} className="h-52 rounded-xl" />
          ))}
        </section>
      </div>
    </main>
  );
}
