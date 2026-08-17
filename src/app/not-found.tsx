import Link from "next/link";
import { ArrowLeft, FileQuestion, LayoutDashboard, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-background px-4 py-16">
      <section className="w-full max-w-lg text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
          <FileQuestion className="h-8 w-8 text-primary" />
        </div>

        <p className="section-label">404 Error</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Page Not Found</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-muted-foreground">
          The page or course you are looking for does not exist, has been removed, or is temporarily unavailable.
        </p>

        <div className="surface-card mt-8 p-6 text-left">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Suggested Destinations</p>
          <div className="mt-4 grid gap-3">
            <Button asChild variant="outline" className="justify-start">
              <Link href="/dashboard">
                <LayoutDashboard className="h-4 w-4" />
                Return to Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/courses/create">
                <Sparkles className="h-4 w-4" />
                Generate New Course
              </Link>
            </Button>
            <Button asChild variant="ghost" className="justify-start">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
