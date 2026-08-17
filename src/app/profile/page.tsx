import Link from "next/link";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Building2,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  Link2,
  Mail,
  Save,
  Sparkles,
  Target,
  Trophy,
  UserCircle2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { updateProfile } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";

interface ProfileCourse {
  id: string;
  course_name: string;
  completion_percentage: number;
  created_at: string;
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string; error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: courseRows } = await supabase
    .from("courses")
    .select("id, course_name, completion_percentage, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const courses = (courseRows || []) as ProfileCourse[];
  const completedCourses = courses.filter((course) => course.completion_percentage === 100).length;
  const inProgressCourses = courses.filter((course) => course.completion_percentage < 100).length;
  const avgProgress = courses.length
    ? Math.round(courses.reduce((total, course) => total + course.completion_percentage, 0) / courses.length)
    : 0;

  const resolvedSearch = await searchParams;
  const isUpdated = resolvedSearch.updated === "1";
  const hasError = resolvedSearch.error;

  const fullName = String(user.user_metadata?.full_name || user.email?.split("@")[0] || "");
  const college = String(user.user_metadata?.college || "");
  const learningGoal = String(user.user_metadata?.learning_goal || "");
  const bio = String(user.user_metadata?.bio || "");
  const linkedinUrl = String(user.user_metadata?.linkedin_url || "");
  const focusArea = String(user.user_metadata?.focus_area || "");

  const initials =
    fullName
      .split(" ")
      .map((part) => part.trim()[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "ST";

  return (
    <main className="bg-background py-8 sm:py-10">
      <div className="app-shell space-y-8">
        <header className="surface-card p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="section-label">Student Profile</p>
              <h1 className="mt-2 truncate text-3xl font-bold sm:text-4xl">{fullName || "Student"}</h1>
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  {user.email}
                </span>
                {college && (
                  <span className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    {college}
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        {isUpdated && (
          <div className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-semibold text-success">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Profile updated successfully.
            </div>
          </div>
        )}
        {hasError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
            Could not update profile. Please try again.
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard icon={BarChart3} label="Total courses" value={courses.length} />
          <StatCard icon={BookOpen} label="In progress" value={inProgressCourses} />
          <StatCard icon={Trophy} label="Completed" value={completedCourses} />
          <StatCard icon={Target} label="Average progress" value={`${avgProgress}%`} />
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <aside className="space-y-6">
            <div className="surface-card p-6">
              <div className="mb-5 flex items-center gap-3">
                <GraduationCap className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">Identity</h2>
              </div>
              <div className="space-y-3">
                <InfoRow icon={Building2} label="College" value={college || "Not set"} />
                <InfoRow icon={Target} label="Focus area" value={focusArea || "Not set"} />
                <InfoRow icon={Sparkles} label="Learning goal" value={learningGoal || "Not set"} />
                <InfoRow icon={UserCircle2} label="Bio" value={bio || "No bio yet."} />
              </div>
              {linkedinUrl && (
                <Button asChild variant="outline" className="mt-5 w-full">
                  <a href={linkedinUrl} target="_blank" rel="noopener noreferrer">
                    <Link2 className="h-4 w-4" />
                    LinkedIn
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              )}
            </div>

            <div className="surface-card p-6">
              <h2 className="text-lg font-bold">Quick links</h2>
              <div className="mt-4 grid gap-2">
                <Button asChild variant="outline" className="justify-start">
                  <Link href="/dashboard">
                    <BarChart3 className="h-4 w-4" />
                    Dashboard
                  </Link>
                </Button>
                <Button asChild variant="outline" className="justify-start">
                  <Link href="/courses/create">
                    <Sparkles className="h-4 w-4" />
                    Generate course
                  </Link>
                </Button>
              </div>
            </div>
          </aside>

          <div className="surface-card overflow-hidden">
            <div className="border-b border-border p-6">
              <h2 className="text-xl font-bold">Edit profile</h2>
              <p className="mt-1 text-sm text-muted-foreground">Keep your academic identity and learning goals current.</p>
            </div>
            <form action={updateProfile} className="grid gap-5 p-6 md:grid-cols-2">
              <Field label="Full name">
                <input name="fullName" defaultValue={fullName} required autoComplete="name" className="input-field" />
              </Field>
              <Field label="Email">
                <input value={user.email || ""} disabled autoComplete="email" className="input-field opacity-70" />
              </Field>
              <Field label="College / University">
                <input name="college" defaultValue={college} placeholder="PCCOE, IIT Bombay" className="input-field" />
              </Field>
              <Field label="Primary focus area">
                <input name="focusArea" defaultValue={focusArea} placeholder="Deep Learning, DSA, Cloud" className="input-field" />
              </Field>
              <Field label="Current learning goal" className="md:col-span-2">
                <textarea
                  name="learningGoal"
                  defaultValue={learningGoal}
                  rows={3}
                  placeholder="Crack the end-sem exam with distinction"
                  className="input-field resize-none"
                />
              </Field>
              <Field label="Short bio" className="md:col-span-2">
                <textarea
                  name="bio"
                  defaultValue={bio}
                  rows={3}
                  placeholder="Your interests, strengths, and learning style"
                  className="input-field resize-none"
                />
              </Field>
              <Field label="LinkedIn URL" className="md:col-span-2">
                <input
                  name="linkedinUrl"
                  defaultValue={linkedinUrl}
                  type="url"
                  placeholder="https://linkedin.com/in/your-profile"
                  className="input-field"
                />
              </Field>
              <div className="md:col-span-2">
                <Button type="submit">
                  <Save className="h-4 w-4" />
                  Save profile
                </Button>
              </div>
            </form>
          </div>
        </section>

        <section className="surface-card overflow-hidden">
          <div className="border-b border-border p-6">
            <h2 className="text-xl font-bold">Recent activity</h2>
            <p className="mt-1 text-sm text-muted-foreground">Latest course progress snapshots.</p>
          </div>
          <div className="p-6">
            {courses.length === 0 ? (
              <div className="py-8 text-center">
                <Sparkles className="mx-auto h-9 w-9 text-primary" />
                <h3 className="mt-4 text-base font-bold">No courses yet</h3>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                  Generate a course and your study activity will appear here.
                </p>
                <Button asChild className="mt-5">
                  <Link href="/courses/create">Generate first course</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {courses.slice(0, 5).map((course) => {
                  const complete = course.completion_percentage === 100;
                  return (
                    <Link
                      key={course.id}
                      href={`/courses/${course.id}`}
                      className="flex items-center gap-4 rounded-xl border border-border/80 bg-card p-4 transition-all hover:bg-muted hover:border-primary/40"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-primary">
                        {complete ? <Trophy className="h-5 w-5 text-success" /> : <BookOpen className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">{course.course_name}</p>
                        <div className="mt-2 flex items-center gap-3">
                          <div
                            className="progress-track flex-1"
                            role="progressbar"
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={course.completion_percentage}
                          >
                            <div
                              className={complete ? "progress-fill-complete" : "progress-fill"}
                              style={{ width: `${course.completion_percentage}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold tabular">{course.completion_percentage}%</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string | number }) {
  return (
    <div className="surface-card p-5 text-center">
      <Icon className="mx-auto h-5 w-5 text-primary" />
      <p className="mt-3 text-3xl font-bold tabular">{value}</p>
      <p className="mt-1 text-xs font-semibold text-muted-foreground">{label}</p>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted p-4">
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-1 break-words text-sm font-semibold">{value}</p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block space-y-2 ${className || ""}`}>
      <span className="text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}

