import { Skeleton } from "@/components/ui/skeleton";

export default function VerifyLoading() {
  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-background px-4 py-12">
      <section className="w-full max-w-xl text-center">
        <Skeleton className="mx-auto mb-6 h-14 w-14 rounded-xl" />
        <Skeleton className="mx-auto h-4 w-36" />
        <Skeleton className="mx-auto mt-3 h-9 w-80 max-w-full" />
        <Skeleton className="mx-auto mt-4 h-4 w-96 max-w-full" />

        <div className="surface-card mt-8 p-6 text-left">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-2 h-12 w-full rounded-xl" />
          <Skeleton className="mt-5 h-12 w-full rounded-xl" />
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((step) => (
            <div key={step} className="rounded-xl border border-border bg-card p-4 text-left">
              <Skeleton className="h-3 w-6" />
              <Skeleton className="mt-2 h-4 w-24" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
