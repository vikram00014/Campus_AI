import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock,
  Flame,
  Lock,
  PlayCircle,
  Plus,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { fetchDashboardData, type StudyPlanMode } from "@/app/actions/dashboard";
import { Button } from "@/components/ui/button";
import { CourseDeleteButton } from "@/components/course-delete-button";
import { cn } from "@/lib/utils";

interface DashboardCourse {
  id: string;
  branch: string;
  semester: number;
  course_name: string;
  completion_percentage: number;
  created_at: string;
}

function getLevel(xp: number): { label: string; next: number } {
  if (xp < 150) return { label: "Rookie", next: 150 };
  if (xp < 450) return { label: "Scholar", next: 450 };
  if (xp < 900) return { label: "Expert", next: 900 };
  if (xp < 2000) return { label: "Master", next: 2000 };
  return { label: "Legend", next: Infinity };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; mode?: string }>;
}) {
  const resolvedSearch = await searchParams;
  const rawMode = resolvedSearch.mode || "default";
  const mode: StudyPlanMode = rawMode === "tomorrow" || rawMode === "three_day" ? rawMode : "default";
  const data = await fetchDashboardData(mode);

  if (!data) redirect("/auth");

  const { courses, stats, insights } = data;
  const typedCourses = courses as DashboardCourse[];
  const query = (resolvedSearch.q || "").trim().toLowerCase();
  const status = resolvedSearch.status || "all";

  const buildHref = (next: { q?: string; status?: string; mode?: string }) => {
    const params = new URLSearchParams();
    const q = next.q ?? resolvedSearch.q ?? "";
    const s = next.status ?? status;
    const m = next.mode ?? mode;
    if (q) params.set("q", q);
    if (s && s !== "all") params.set("status", s);
    if (m && m !== "default") params.set("mode", m);
    const qs = params.toString();
    return qs ? `/dashboard?${qs}` : "/dashboard";
  };

  const filteredCourses = typedCourses.filter((course) => {
    const matchesQuery =
      !query ||
      course.course_name.toLowerCase().includes(query) ||
      course.branch.toLowerCase().includes(query) ||
      String(course.semester).includes(query);
    const matchesStatus =
      status === "all" ||
      (status === "completed" && course.completion_percentage === 100) ||
      (status === "in_progress" && course.completion_percentage < 100);
    return matchesQuery && matchesStatus;
  });

  const continueCourse = typedCourses.find((course) => course.completion_percentage < 100) || typedCourses[0];
  const level = getLevel(insights.xpScore);

  return (
    <main className="bg-background py-8 sm:py-10">
      <div className="app-shell space-y-10">
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="section-label">Dashboard</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">What should you study next?</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Your plan is ordered by unlocked topics, weak spots, and the study mode you choose.
            </p>
          </div>
          <Button asChild>
            <Link href="/courses/create">
              <Plus className="h-4 w-4" />
              Generate course
            </Link>
          </Button>
        </header>

        <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="surface-card p-6">
            <p className="text-sm font-semibold text-muted-foreground">Continue studying</p>
            {continueCourse ? (
              <>
                <h2 className="mt-3 text-2xl font-bold">{continueCourse.course_name}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Semester {continueCourse.semester} · {continueCourse.branch}
                </p>
                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Course progress</span>
                    <span className="font-bold tabular">{continueCourse.completion_percentage}%</span>
                  </div>
                  <div
                    className="progress-track"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={continueCourse.completion_percentage}
                  >
                    <div
                      className={continueCourse.completion_percentage === 100 ? "progress-fill-complete" : "progress-fill"}
                      style={{ width: `${continueCourse.completion_percentage}%` }}
                    />
                  </div>
                </div>
                <Button asChild className="mt-6 w-full sm:w-auto">
                  <Link href={`/courses/${continueCourse.id}`}>
                    <PlayCircle className="h-4 w-4" />
                    Continue
                  </Link>
                </Button>
              </>
            ) : (
              <EmptyState
                icon={BookOpen}
                title="No course yet"
                text="Generate your first course from a syllabus and your next topic will appear here."
                actionHref="/courses/create"
                actionLabel="Generate course"
              />
            )}
          </div>

          <div className="surface-card overflow-hidden">
            <div className="border-b border-border p-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Today’s plan</p>
                  <h2 className="mt-1 text-xl font-bold">{insights.planLabel}</h2>
                </div>
                <div className="grid grid-cols-3 rounded-xl bg-muted p-1">
                  {[
                    { label: "Default", value: "default" },
                    { label: "Exam", value: "tomorrow" },
                    { label: "3 days", value: "three_day" },
                  ].map((option) => (
                    <Link
                      key={option.value}
                      href={buildHref({ mode: option.value })}
                      className={cn(
                        "rounded-lg px-3 py-2 text-center text-xs font-bold text-muted-foreground transition-colors",
                        mode === option.value && "bg-card text-foreground shadow-sm"
                      )}
                    >
                      {option.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-3">
              {insights.isFallingBehind && (
                <div className="m-3 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
                  <div className="flex gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                    <p>
                      3-day mode needs {insights.dailyTargetTopics} topics per day. Your current pace is{" "}
                      {insights.avgTopicsPerDay} topics per day.
                    </p>
                  </div>
                </div>
              )}
              {insights.todayPlan.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  title="All caught up"
                  text="No pending unlocked topics right now. Review a course or generate a new one."
                  actionHref="/courses/create"
                  actionLabel="Generate another course"
                />
              ) : (
                <div className="space-y-1">
                  {insights.todayPlan.map((item, index) => (
                    <Link
                      key={`${item.courseId}-${item.topicTitle}-${index}`}
                      href={`/courses/${item.courseId}`}
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-muted",
                        item.isLocked && "pointer-events-none opacity-55"
                      )}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">{item.topicTitle}</p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {item.courseName} · {item.moduleTitle}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 text-xs font-bold text-muted-foreground">
                        {item.isLocked && <Lock className="h-3.5 w-3.5" />}
                        {item.estimatedMinutes}m
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-bold">Courses</h2>
              <p className="mt-1 text-sm text-muted-foreground">Filter, continue, review, or download certificates.</p>
            </div>
            <form action="/dashboard" method="get" className="flex w-full flex-wrap gap-2 md:w-auto">
              <input name="q" defaultValue={resolvedSearch.q || ""} placeholder="Search courses" className="input-field h-10 w-full py-2 sm:w-56" />
              <select name="status" defaultValue={status} className="input-field h-10 w-full py-2 sm:w-auto">
                <option value="all">All status</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
              </select>
              <input type="hidden" name="mode" value={mode} />
              <Button type="submit" variant="outline">Filter</Button>
              <Button asChild variant="ghost">
                <Link href={buildHref({ q: "", status: "all" })}>Reset</Link>
              </Button>
            </form>
          </div>

          {filteredCourses.length === 0 ? (
            <div className="surface-card">
              <EmptyState
                icon={BookOpen}
                title={typedCourses.length === 0 ? "No courses yet" : "No matching courses"}
                text={typedCourses.length === 0 ? "Generate your first AI-guided course from a syllabus." : "Try a different search term or status filter."}
                actionHref={typedCourses.length === 0 ? "/courses/create" : "/dashboard"}
                actionLabel={typedCourses.length === 0 ? "Generate course" : "Clear filters"}
              />
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {filteredCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="surface-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Weak topics</p>
                <h2 className="mt-1 text-xl font-bold">Focus these first</h2>
              </div>
              <Target className="h-5 w-5 text-warning" />
            </div>
            {insights.weakTopics.length === 0 ? (
              <EmptyState
                icon={Trophy}
                title="No weak topics detected"
                text="Once you have pending topics, the most useful revision targets will show here."
                actionHref="/courses/create"
                actionLabel="Generate course"
              />
            ) : (
              <div className="space-y-1">
                {insights.weakTopics.map((item, index) => (
                  <Link
                    key={`${item.courseId}-${item.topicTitle}-${index}`}
                    href={`/courses/${item.courseId}`}
                    className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-muted"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{item.topicTitle}</p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{item.moduleTitle}</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-warning/30 bg-warning/10 px-2.5 py-1 text-xs font-bold text-warning">
                      {item.estimatedMinutes}m
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="surface-card p-6">
            <p className="text-sm font-semibold text-muted-foreground">Momentum</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <MiniStat icon={Flame} label="Streak" value={`${insights.streakDays}d`} />
              <MiniStat icon={Zap} label="XP" value={String(insights.xpScore)} />
              <MiniStat icon={BarChart3} label="Level" value={level.label} />
              <MiniStat icon={Clock} label="This week" value={`${Math.round(insights.weeklyStudyMinutes / 60)}h`} />
            </div>
            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              Remaining topics: {insights.remainingTopics}. Daily pace: {insights.avgTopicsPerDay} topics/day.
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard icon={BookOpen} label="Total courses" value={stats.totalCourses} context={`${stats.completedCourses} completed`} />
          <StatCard icon={Clock} label="Learning hours" value={stats.learningHours} context="Estimated from course progress" />
          <StatCard icon={Trophy} label="Certificates" value={stats.completedCourses} context="Unlocked at 100% completion" />
        </section>
      </div>
    </main>
  );
}

function CourseCard({ course }: { course: DashboardCourse }) {
  const complete = course.completion_percentage === 100;
  return (
    <article className="surface-card overflow-hidden">
      <div className="p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <span
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-bold",
              complete
                ? "border-success/30 bg-success/10 text-success"
                : "border-primary/30 bg-primary/10 text-primary"
            )}
          >
            {complete ? "Completed" : "In progress"}
          </span>
          <span className="shrink-0 text-xs font-semibold text-muted-foreground">
            Sem {course.semester} · {course.branch}
          </span>
        </div>
        <h3 className="text-lg font-bold leading-snug">{course.course_name}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Generated {new Date(course.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </p>
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Completion</span>
            <span className="font-bold tabular">{course.completion_percentage}%</span>
          </div>
          <div
            className="progress-track"
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
        </div>
      </div>
      <div className="flex items-center gap-2 border-t border-border p-4">
        <Button asChild variant="outline" className="flex-1">
          <Link href={`/courses/${course.id}`}>
            <PlayCircle className="h-4 w-4" />
            {complete ? "Review" : "Continue"}
          </Link>
        </Button>
        {complete && (
          <Button asChild variant="outline" size="icon" aria-label={`Download certificate for ${course.course_name}`}>
            <a href={`/api/certificates/${course.id}`} target="_blank" rel="noopener noreferrer">
              <Trophy className="h-4 w-4 text-success" />
            </a>
          </Button>
        )}
        <CourseDeleteButton courseId={course.id} courseName={course.course_name} />
      </div>
    </article>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="text-xl font-bold tabular">{value}</p>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, context }: { icon: LucideIcon; label: string; value: number; context: string }) {
  return (
    <div className="surface-card p-6">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Icon className="h-4 w-4 text-primary" />
        {label}
      </div>
      <p className="text-4xl font-bold tabular">{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{context}</p>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  text,
  actionHref,
  actionLabel,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-bold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{text}</p>
      <Button asChild variant="outline" className="mt-5">
        <Link href={actionHref}>
          {actionLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

