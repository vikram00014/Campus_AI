import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import {
  Clock, PlayCircle, Trophy, BookOpen, Sparkles, Trash2, BrainCircuit,
  CalendarClock, Flame, Target, AlertTriangle, Zap, TrendingUp, Lock,
  BarChart3, Plus,
} from "lucide-react";
import { deleteCourse, fetchDashboardData } from "@/app/actions/dashboard";

interface DashboardCourse {
  id: string;
  branch: string;
  semester: number;
  course_name: string;
  completion_percentage: number;
  created_at: string;
}

function XPLevel(xp: number): { label: string; color: string; bg: string; next: number } {
  if (xp < 150)  return { label: "Rookie",  color: "#bcc9cd", bg: "rgba(188,201,205,0.1)", next: 150 };
  if (xp < 450)  return { label: "Scholar", color: "#34d399", bg: "rgba(52,211,153,0.1)",  next: 450 };
  if (xp < 900)  return { label: "Expert",  color: "#4cd7f6", bg: "rgba(76,215,246,0.1)",  next: 900 };
  if (xp < 2000) return { label: "Master",  color: "#c084fc", bg: "rgba(192,132,252,0.1)", next: 2000 };
  return           { label: "Legend", color: "#ffba45", bg: "rgba(255,186,69,0.1)",  next: Infinity };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; mode?: string }>;
}) {
  const resolvedSearch = await searchParams;
  const rawMode = resolvedSearch.mode || "default";
  const mode = rawMode === "tomorrow" || rawMode === "three_day" ? rawMode : "default";
  const data = await fetchDashboardData(mode);

  if (!data) redirect("/auth");

  const { courses, stats, insights } = data;
  const typedCourses = courses as DashboardCourse[];
  const query  = (resolvedSearch.q || "").trim().toLowerCase();
  const status = resolvedSearch.status || "all";

  const buildHref = (next: { q?: string; status?: string; mode?: string }) => {
    const p = new URLSearchParams();
    const q = next.q ?? resolvedSearch.q ?? "";
    const s = next.status ?? status;
    const m = next.mode ?? mode;
    if (q) p.set("q", q);
    if (s && s !== "all") p.set("status", s);
    if (m && m !== "default") p.set("mode", m);
    const qs = p.toString();
    return qs ? `/dashboard?${qs}` : "/dashboard";
  };

  const filteredCourses = typedCourses.filter((c) => {
    const mQ = !query || c.course_name.toLowerCase().includes(query) || c.branch.toLowerCase().includes(query) || String(c.semester).includes(query);
    const mS = status === "all" || (status === "completed" && c.completion_percentage === 100) || (status === "in_progress" && c.completion_percentage < 100);
    return mQ && mS;
  });

  const level = XPLevel(insights.xpScore);

  const gamificationCards = [
    { label: "Streak",     value: `${insights.streakDays}d`,      icon: Flame,        color: "#f97316" },
    { label: "XP Score",   value: String(insights.xpScore),       icon: Zap,          color: "#4cd7f6" },
    { label: "Level",      value: level.label,                    icon: BarChart3,     color: level.color },
    { label: "Daily Pace", value: `${insights.avgTopicsPerDay}/d`, icon: Target,       color: "#34d399" },
    {
      label: "Finish By",
      value: insights.projectedCompletionDate
        ? new Date(insights.projectedCompletionDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
        : "Done!",
      icon: CalendarClock, color: "#c084fc",
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#0b1120]">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="orb orb-cyan   w-[500px] h-[400px] -top-20 -left-20 opacity-55" />
        <div className="orb orb-amber  w-[350px] h-[350px] bottom-0  right-0  opacity-30" />
        <div className="absolute inset-0 dot-bg opacity-18" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* ── PAGE HEADER ── */}
        <div className="relative mb-10 rounded-3xl overflow-hidden p-8 glass">
          {/* Dashboard header background image */}
          <Image
            src="/bg-dashboard.png"
            alt="Dashboard background"
            fill
            className="object-cover object-center"
            style={{ opacity: 0.28 }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#08111f]/92 via-[#0c1728]/76 to-[#0f1c30]/82" />
          <div className="absolute inset-0 dot-bg opacity-10" />
          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="section-label mb-2">Your learning command center</p>
              <h1 className="text-4xl font-extrabold tracking-tight text-white">My Dashboard</h1>
              <p className="text-[#bcc9cd] mt-1 text-sm">Track progress, study smart, and earn your certificates.</p>
            </div>
            <Link href="/courses/create">
              <button className="btn-primary flex items-center gap-2 px-6 py-3 text-sm font-bold shadow-glow-sm">
                <Plus className="w-4 h-4" /> Generate New Course
              </button>
            </Link>
          </div>
        </div>

        {/* ── PRIMARY STATS (3) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {[
            { icon: Sparkles, label: "Total Courses",    value: stats.totalCourses,    color: "#4cd7f6", sub: `${stats.completedCourses} completed · ${stats.totalCourses - stats.completedCourses} in progress` },
            { icon: Clock,    label: "Learning Hours",   value: stats.learningHours,   color: "#38bdf8", sub: "Estimated from completion rate" },
            { icon: Trophy,   label: "Certificates",     value: stats.completedCourses,color: "#ffba45", sub: "Fully completed courses" },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className="flex items-center gap-2 mb-3 text-sm font-medium" style={{ color: s.color }}>
                <s.icon className="w-4 h-4" />
                {s.label}
              </div>
              <p className="text-5xl font-extrabold tracking-tight mb-2" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-[#8ea1ab]">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* ── GAMIFICATION ROW (5) ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {gamificationCards.map((g) => (
            <div key={g.label} className="rounded-xl p-4 transition-all duration-200" style={{ background: "linear-gradient(180deg, rgba(20,25,38,0.9), rgba(13,18,29,0.88))", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: g.color }}>
                <g.icon className="w-3.5 h-3.5" />
                {g.label}
              </div>
              <p className="text-xl font-extrabold" style={{ color: g.color }}>{g.value}</p>
            </div>
          ))}
        </div>

        {/* ── FALLING BEHIND ALERT ── */}
        {insights.isFallingBehind && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl border border-[rgba(255,186,69,0.2)] bg-[rgba(255,186,69,0.08)]">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-amber-300">You are falling behind schedule</p>
              <p className="text-sm text-amber-200/80 mt-0.5">
                3-Day mode requires <strong>{insights.dailyTargetTopics}</strong> topics/day, but your pace is <strong>{insights.avgTopicsPerDay}</strong>. Consider switching to a lighter plan.
              </p>
            </div>
          </div>
        )}

        {/* ── STUDY PLAN + WEAK TOPICS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-10">
          {/* Study Plan */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="p-6 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <BrainCircuit className="w-5 h-5 text-[#4cd7f6]" />
                <h2 className="text-base font-bold text-white">{insights.planLabel}</h2>
              </div>
              <p className="text-xs text-[#8ea1ab]">
                {insights.todayCompletedTopics} topics done today · {Math.round(insights.weeklyStudyMinutes / 60)} hrs this week
              </p>
            </div>

            {/* Mode toggles */}
            <div className="flex gap-2 px-6 pb-4">
              {[
                { label: "Today Plan",     m: "default"   },
                { label: "Tomorrow Exam",  m: "tomorrow"  },
                { label: "3-Day Sprint",   m: "three_day" },
              ].map((opt) => (
                <Link key={opt.m} href={buildHref({ mode: opt.m })}>
                  <button
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150"
                    style={
                      mode === opt.m
                        ? { background: "rgba(76,215,246,0.15)", color: "#4cd7f6", border: "1px solid rgba(76,215,246,0.3)" }
                        : { color: "#8ea1ab", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(9,14,26,0.78)" }
                    }
                  >
                    {opt.label}
                  </button>
                </Link>
              ))}
            </div>

            <div className="px-3 pb-4">
              <div className="max-h-[360px] overflow-y-auto pr-1 space-y-1">
                {insights.todayPlan.length === 0 ? (
                    <div className="text-center py-8">
                      <TrendingUp className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-emerald-400">All caught up!</p>
                      <p className="text-xs text-[#8ea1ab] mt-1">No pending topics right now.</p>
                    </div>
                  ) : (
                  insights.todayPlan.map((item, idx) => (
                    <Link
                      key={`${item.courseId}-${idx}`}
                      href={`/courses/${item.courseId}`}
                      className="flex items-start justify-between px-4 py-3 rounded-xl transition-all duration-150 group hover:bg-[rgba(76,215,246,0.08)]"
                      style={{ opacity: item.isLocked ? 0.5 : 1, pointerEvents: item.isLocked ? "none" : undefined }}
                    >
                      <div className="overflow-hidden mr-2">
                        <p className="text-sm font-medium text-[#e2edf2] truncate group-hover:text-[#4cd7f6] transition-colors">{item.topicTitle}</p>
                        <p className="text-xs text-[#8ea1ab] mt-0.5 truncate">{item.courseName} · {item.moduleTitle}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.isLocked && <Lock className="w-3 h-3 text-[#8ea1ab]" />}
                        <span className="badge-cyan text-[10px] font-bold px-2.5 py-1">{item.estimatedMinutes}m</span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Weak Topic Radar */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="p-6 pb-4">
              <h2 className="text-base font-bold mb-1 text-white">Weak Topic Radar</h2>
              <p className="text-xs text-[#8ea1ab]">Focus these first for fastest gains.</p>
            </div>
            <div className="px-3 pb-4">
              <div className="max-h-[360px] overflow-y-auto pr-1 space-y-1">
                {insights.weakTopics.length === 0 ? (
                    <div className="text-center py-8">
                      <Trophy className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-amber-400">No weak topics detected!</p>
                      <p className="text-xs text-[#8ea1ab] mt-1">You are on top of everything.</p>
                    </div>
                  ) : (
                  insights.weakTopics.map((item, idx) => (
                    <Link
                      key={`${item.courseId}-${item.topicTitle}-${idx}`}
                      href={`/courses/${item.courseId}`}
                      className="flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-150 group hover:bg-[rgba(255,186,69,0.08)]"
                    >
                      <div className="overflow-hidden mr-2">
                        <p className="text-sm font-medium text-[#e2edf2] truncate group-hover:text-amber-400 transition-colors">{item.topicTitle}</p>
                        <p className="text-xs text-[#8ea1ab] truncate">{item.moduleTitle}</p>
                      </div>
                      <span className="badge-amber text-[10px] font-bold px-2.5 py-1 shrink-0">{item.estimatedMinutes}m</span>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── COURSES LIST ── */}
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <h2 className="text-2xl font-extrabold tracking-tight text-white">Active Courses</h2>
          <form action="/dashboard" method="get" className="flex w-full md:w-auto flex-wrap gap-2">
            <input
              name="q" defaultValue={resolvedSearch.q || ""} placeholder="Search courses…"
              className="h-9 px-3 text-sm rounded-xl w-full sm:w-56 input-dark"
            />
            <select
              name="status" defaultValue={status}
              className="h-9 px-3 rounded-xl text-sm text-[#dee2f3] w-full sm:w-auto"
              style={{ background: "rgba(9,14,26,0.9)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <option value="all">All Status</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <input type="hidden" name="mode" value={mode} />
            <button type="submit" className="h-9 px-4 text-sm font-semibold rounded-xl btn-ghost-cyan">Filter</button>
            <Link href={buildHref({ q: "", status: "all" })}>
              <button type="button" className="h-9 px-4 text-sm font-medium rounded-xl text-[#bcc9cd] transition-all border border-white/10 hover:bg-white/5">
                Reset
              </button>
            </Link>
          </form>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredCourses.length === 0 ? (
            <div className="glass col-span-full flex flex-col items-center text-center rounded-3xl overflow-hidden">
              {/* Preview image */}
              <div className="relative w-full h-52 overflow-hidden">
                <Image
                  src="/dashboard-preview.png"
                  alt="Dashboard preview — your courses will appear here"
                  fill
                  className="object-cover object-top"
                  style={{ opacity: 0.5 }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0e131f]" />
              </div>
              <div className="py-10 px-6">
                <BookOpen className="w-12 h-12 mx-auto mb-4" style={{ color: "#4cd7f6", opacity: 0.5 }} />
                <h3 className="text-xl font-bold mb-2 text-white">{typedCourses.length === 0 ? "No courses yet" : "No matches found"}</h3>
                <p className="text-[#8ea1ab] mb-6 text-sm max-w-sm mx-auto">
                  {typedCourses.length === 0 ? "Generate your first AI course from a syllabus PDF and start learning in seconds!" : "Try a different search or filter."}
                </p>
                {typedCourses.length === 0 ? (
                  <Link href="/courses/create"><button className="btn-primary px-6 py-3 text-sm font-bold">Generate First Course</button></Link>
                ) : (
                  <Link href="/dashboard"><button className="btn-ghost-cyan px-6 py-3 text-sm font-semibold">Clear Filters</button></Link>
                )}
              </div>
            </div>
          ) : (
            filteredCourses.map((course) => {
              const isComplete = course.completion_percentage === 100;
              return (
                <div
                  key={course.id}
                  className="flex flex-col rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
                  style={{
                    background: "linear-gradient(180deg, rgba(20,25,38,0.95), rgba(13,18,29,0.94))",
                    border: `1px solid ${isComplete ? "rgba(255,186,69,0.18)" : "rgba(255,255,255,0.07)"}`,
                    boxShadow: "0 18px 40px rgba(0,0,0,0.18)",
                  }}
                >
                  <div className="p-6 flex-1">
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <span
                        className="text-xs font-bold px-2.5 py-1 rounded-full"
                        style={
                          isComplete
                            ? { background: "rgba(255,186,69,0.12)", color: "#ffba45", border: "1px solid rgba(255,186,69,0.25)" }
                            : { background: "rgba(76,215,246,0.08)", color: "#4cd7f6", border: "1px solid rgba(76,215,246,0.2)" }
                        }
                      >
                        {isComplete ? "✓ Completed" : "In Progress"}
                      </span>
                      <span className="text-xs text-[#8ea1ab] font-mono shrink-0">Sem {course.semester} · {course.branch}</span>
                    </div>
                    <h3 className="text-lg font-bold mb-1 leading-snug text-white">{course.course_name}</h3>
                    <p className="text-xs text-[#8ea1ab] mb-4">
                      Generated {new Date(course.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>

                    {/* Progress bar */}
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-[#8ea1ab]">Completion</span>
                        <span className="font-bold" style={{ color: isComplete ? "#ffba45" : "#4cd7f6" }}>
                          {course.completion_percentage}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${course.completion_percentage}%`,
                            background: isComplete
                              ? "linear-gradient(90deg,#ffba45,#fdddb8)"
                              : "linear-gradient(90deg,#4cd7f6,#acedff)",
                            boxShadow: isComplete
                              ? "0 0 8px rgba(255,186,69,0.4)"
                              : "0 0 8px rgba(76,215,246,0.4)",
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="px-6 py-4 flex gap-2 border-t border-white/8">
                    <Link href={`/courses/${course.id}`} className="flex-1">
                      <button
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
                        style={
                          isComplete
                            ? { background: "rgba(255,186,69,0.08)", color: "#ffba45", border: "1px solid rgba(255,186,69,0.2)" }
                            : { background: "rgba(76,215,246,0.08)", color: "#4cd7f6", border: "1px solid rgba(76,215,246,0.2)" }
                        }
                      >
                        <PlayCircle className="w-4 h-4" />
                        {isComplete ? "Review Course" : "Continue Learning"}
                      </button>
                    </Link>

                    {isComplete && (
                      <a href={`/api/certificates/${course.id}`} target="_blank" rel="noopener noreferrer">
                        <button className="w-11 h-11 rounded-xl flex items-center justify-center transition-all" style={{ background: "rgba(255,186,69,0.07)", border: "1px solid rgba(255,186,69,0.15)" }}>
                          <Trophy className="w-4 h-4 text-amber-400" />
                        </button>
                      </a>
                    )}

                    <form action={deleteCourse}>
                      <input type="hidden" name="courseId" value={course.id} />
                      <button type="submit" className="w-11 h-11 rounded-xl flex items-center justify-center transition-all" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)" }}>
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </form>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
