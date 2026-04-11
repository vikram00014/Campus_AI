import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { updateProfile } from "@/app/actions/profile";
import Link from "next/link";
import Image from "next/image";
import {
  BookOpen, Trophy, UserCircle2, Building2, Mail, Link2,
  Target, Sparkles, CheckCircle2, GraduationCap, Clock,
  BarChart3, Edit3, Save, ExternalLink, TrendingUp,
} from "lucide-react";

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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: courseRows } = await supabase
    .from("courses")
    .select("id, course_name, completion_percentage, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const courses = (courseRows || []) as ProfileCourse[];
  const completedCourses = courses.filter((c) => c.completion_percentage === 100).length;
  const inProgressCourses = courses.filter((c) => c.completion_percentage < 100).length;
  const avgProgress = courses.length > 0
    ? Math.round(courses.reduce((a, c) => a + c.completion_percentage, 0) / courses.length)
    : 0;

  const resolvedSearch = await searchParams;
  const isUpdated = resolvedSearch.updated === "1";
  const hasError = resolvedSearch.error;

  const fullName     = String(user.user_metadata?.full_name     || user.email?.split("@")[0] || "");
  const college      = String(user.user_metadata?.college       || "");
  const learningGoal = String(user.user_metadata?.learning_goal || "");
  const bio          = String(user.user_metadata?.bio           || "");
  const linkedinUrl  = String(user.user_metadata?.linkedin_url  || "");
  const focusArea    = String(user.user_metadata?.focus_area    || "");

  const initials = fullName
    .split(" ")
    .map((p) => p.trim()[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "ST";

  const statCards = [
    { icon: BarChart3, label: "Total Courses",  value: courses.length,    color: "#4cd7f6", bg: "rgba(76,215,246,0.08)",   border: "rgba(76,215,246,0.15)"  },
    { icon: BookOpen,  label: "In Progress",    value: inProgressCourses, color: "#38bdf8", bg: "rgba(56,189,248,0.08)",   border: "rgba(56,189,248,0.15)"  },
    { icon: Trophy,    label: "Completed",      value: completedCourses,  color: "#ffba45", bg: "rgba(255,186,69,0.08)",   border: "rgba(255,186,69,0.15)"  },
    { icon: TrendingUp,label: "Avg Progress",   value: `${avgProgress}%`, color: "#c084fc", bg: "rgba(192,132,252,0.08)", border: "rgba(192,132,252,0.15)" },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b1120] pb-24">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="orb orb-cyan w-[520px] h-[420px] -top-24 -left-24 opacity-60" />
        <div className="orb orb-amber w-[320px] h-[300px] top-[28rem] right-0 opacity-40" />
        <div className="absolute inset-0 dot-bg opacity-20" />
      </div>

      {/* ════════════ HERO BANNER ════════════ */}
      <div className="relative overflow-hidden h-[250px] sm:h-[300px]">
        <Image
          src="/bg-profile.png"
          alt="Profile banner"
          fill
          priority
          className="object-cover object-center"
          style={{ opacity: 0.44 }}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(7,12,22,0.36) 0%, rgba(9,14,26,0.58) 52%, rgba(11,17,32,0.96) 100%)" }} />
        {/* Side orbs */}
        <div className="orb orb-cyan   w-96 h-72 -top-20 -left-16 opacity-30" />
        <div className="orb orb-purple w-64 h-64  top-0   right-10 opacity-10" />
        <div className="absolute inset-0 dot-bg opacity-15" />

        {/* Avatar + name moved higher in the banner */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 h-full flex items-start sm:items-center pt-10 sm:pt-12">
          <div className="flex items-center gap-5 sm:gap-6 w-full">
            {/* Large avatar */}
            <div
              className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-[1.4rem] sm:rounded-3xl flex-shrink-0 flex items-center justify-center text-2xl sm:text-4xl font-extrabold"
              style={{
                background: "linear-gradient(135deg,#acedff,#4cd7f6)",
                border: "4px solid rgba(255,255,255,0.12)",
                color: "#003640",
                boxShadow: "0 16px 40px rgba(14,165,233,0.24)",
              }}
            >
              {initials}
              {/* Online indicator */}
              <span
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2"
                style={{ background: "#10b981", borderColor: "#0e131f" }}
              />
            </div>

            {/* Name + email row */}
            <div className="flex-1 min-w-0">
              <p className="section-label mb-1 text-[#4cd7f6]">Student Profile</p>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight break-words text-white">
                {fullName || "Student"}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-1.5">
                <span className="flex items-center gap-1.5 text-sm text-[#d5e5ee]">
                  <Mail className="w-3.5 h-3.5 text-[#4cd7f6]" />
                  {user.email}
                </span>
                {college && (
                  <span className="flex items-center gap-1.5 text-sm text-[#d5e5ee]">
                    <Building2 className="w-3.5 h-3.5 text-[#4cd7f6]" />
                    {college}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════ MAIN CONTENT ════════════ */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10">

        {/* Toast notifications */}
        {isUpdated && (
          <div className="mb-6 flex items-center gap-2.5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-3.5 text-sm font-semibold text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> Profile updated successfully!
          </div>
        )}
        {hasError && (
          <div className="mb-6 flex items-center gap-2.5 rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-3.5 text-sm font-semibold text-red-300">
            Could not update profile. Please try again.
          </div>
        )}

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl p-5 flex flex-col items-center text-center transition-all hover:-translate-y-0.5"
              style={{ background: "linear-gradient(180deg, rgba(20,25,38,0.94), rgba(13,18,29,0.92))", border: `1px solid ${s.border}` }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: s.bg }}>
                <s.icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <p className="text-3xl font-extrabold leading-none mb-1" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs font-medium text-[#8ea1ab]">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          {/* ── PROFILE LAYOUT ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── LEFT SIDEBAR ── */}
            <div className="lg:col-span-1 space-y-5">

            {/* Identity card */}
            <div className="glass rounded-2xl overflow-hidden">
              <div className="px-5 py-4 flex items-center gap-2.5 border-b border-white/8 bg-white/5">
                <GraduationCap className="w-4 h-4 text-[#4cd7f6]" />
                <h2 className="text-sm font-bold tracking-widest uppercase" style={{ color: "#4cd7f6" }}>Identity</h2>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { icon: Building2,   label: "College",    value: college      || "Not set",     accent: "#4cd7f6" },
                  { icon: Target,      label: "Focus Area", value: focusArea    || "Not set",     accent: "#c084fc" },
                  { icon: Sparkles,    label: "Goal",       value: learningGoal || "Not set",     accent: "#ffba45" },
                  { icon: UserCircle2, label: "Bio",        value: bio          || "No bio yet.", accent: "#34d399" },
                ].map((row) => (
                  <div key={row.label} className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${row.accent}15` }}>
                      <row.icon className="w-3.5 h-3.5" style={{ color: row.accent }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#8ea1ab]">{row.label}</p>
                      <p className="text-sm font-medium leading-relaxed" style={{ color: row.value.includes("Not set") || row.value === "No bio yet." ? "#8ea1ab" : "#e2edf2" }}>
                        {row.value}
                      </p>
                    </div>
                  </div>
                ))}
                {linkedinUrl && (
                  <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center gap-2 rounded-xl border border-cyan-400/20 px-3 py-2.5 text-sm font-semibold text-cyan-300 transition-all hover:bg-cyan-400/10"
                  >
                    <Link2 className="w-4 h-4" />
                    View LinkedIn
                    <ExternalLink className="w-3 h-3 ml-auto opacity-60" />
                  </a>
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div className="glass rounded-2xl overflow-hidden">
              <div className="px-5 py-4 flex items-center gap-2.5 border-b border-white/8">
                <h2 className="text-sm font-bold tracking-widest uppercase text-[#8ea1ab]">Quick Links</h2>
              </div>
              <div className="p-3 space-y-1">
                {[
                  { href: "/dashboard",      icon: BarChart3,  label: "Dashboard",       color: "#4cd7f6" },
                  { href: "/courses/create", icon: Sparkles,   label: "Generate Course",  color: "#c084fc" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[#d5e5ee] transition-all hover:-translate-x-0.5 hover:bg-white/5"
                  >
                    <link.icon className="w-4 h-4" style={{ color: link.color }} />
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            </div>

            {/* ── RIGHT: Edit Form ── */}
            <div className="lg:col-span-2">

              {/* Edit Profile form */}
              <div className="glass rounded-2xl overflow-hidden">
                {/* Form header */}
                <div className="flex items-center gap-3 border-b border-white/8 bg-white/5 px-6 py-5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(76,215,246,0.1)", border: "1px solid rgba(76,215,246,0.2)" }}>
                    <Edit3 className="w-4 h-4 text-[#4cd7f6]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Edit Profile</h2>
                    <p className="text-xs text-[#8ea1ab]">Keep your academic identity and goals up to date.</p>
                  </div>
                </div>

                <form action={updateProfile} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label htmlFor="fullName" className="text-xs font-semibold uppercase tracking-wide text-[#8ea1ab]">Full Name</label>
                    <input
                      id="fullName" name="fullName" defaultValue={fullName} required
                      placeholder="Your full name" autoComplete="name"
                      className="w-full px-4 py-3 text-sm input-dark"
                    />
                  </div>

                  {/* Email (readonly) */}
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide text-[#8ea1ab]">Email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#4cd7f6" }} />
                      <input
                        id="email" value={user.email || ""} disabled autoComplete="email"
                        className="w-full pl-10 pr-4 py-3 text-sm input-dark opacity-70 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* College */}
                  <div className="space-y-2">
                    <label htmlFor="college" className="text-xs font-semibold uppercase tracking-wide text-[#8ea1ab]">College / University</label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#4cd7f6" }} />
                      <input
                        id="college" name="college" defaultValue={college}
                        placeholder="e.g. PCCOE, IIT Bombay"
                        className="w-full pl-10 pr-4 py-3 text-sm input-dark"
                      />
                    </div>
                  </div>

                  {/* Focus Area */}
                  <div className="space-y-2">
                    <label htmlFor="focusArea" className="text-xs font-semibold uppercase tracking-wide text-[#8ea1ab]">Primary Focus Area</label>
                    <div className="relative">
                      <Target className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#c084fc" }} />
                      <input
                        id="focusArea" name="focusArea" defaultValue={focusArea}
                        placeholder="e.g. Deep Learning, DSA, Cloud"
                        className="w-full pl-10 pr-4 py-3 text-sm input-dark"
                      />
                    </div>
                  </div>

                  {/* Learning Goal */}
                  <div className="space-y-2 md:col-span-2">
                    <label htmlFor="learningGoal" className="text-xs font-semibold uppercase tracking-wide text-[#8ea1ab]">Current Learning Goal</label>
                    <div className="relative">
                      <Sparkles className="w-4 h-4 absolute left-3.5 top-3.5" style={{ color: "#ffba45" }} />
                      <textarea
                        id="learningGoal" name="learningGoal" defaultValue={learningGoal}
                        placeholder="e.g. Crack end-sem deep learning exam with distinction"
                        rows={3}
                        className="w-full pl-10 pr-4 py-3 text-sm input-dark resize-none"
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="space-y-2 md:col-span-2">
                    <label htmlFor="bio" className="text-xs font-semibold uppercase tracking-wide text-[#8ea1ab]">Short Bio</label>
                    <textarea
                      id="bio" name="bio" defaultValue={bio}
                      placeholder="Tell us about your interests, strengths, and learning style."
                      rows={3}
                      className="w-full px-4 py-3 text-sm input-dark resize-none"
                    />
                  </div>

                  {/* LinkedIn */}
                  <div className="space-y-2 md:col-span-2">
                    <label htmlFor="linkedinUrl" className="text-xs font-semibold uppercase tracking-wide text-[#8ea1ab]">
                      LinkedIn URL <span className="normal-case font-normal text-[#748690]">(optional)</span>
                    </label>
                    <div className="relative">
                      <Link2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#4cd7f6" }} />
                      <input
                        id="linkedinUrl" name="linkedinUrl" defaultValue={linkedinUrl}
                        placeholder="https://linkedin.com/in/your-profile"
                        className="w-full pl-10 pr-4 py-3 text-sm input-dark"
                        type="url"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 pt-1">
                    <button
                      type="submit"
                      className="btn-primary flex items-center gap-2.5 px-8 py-3.5 font-bold text-sm shadow-glow-sm"
                    >
                      <Save className="w-4 h-4" />
                      Save Profile
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="glass rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/8 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,186,69,0.1)", border: "1px solid rgba(255,186,69,0.2)" }}>
                    <Clock className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Recent Activity</h2>
                    <p className="text-xs text-[#8ea1ab]">Your latest course progress snapshots.</p>
                  </div>
                </div>
                {courses.length > 0 && (
                  <Link href="/dashboard">
                    <span className="text-xs font-semibold transition-colors" style={{ color: "#4cd7f6" }}>View All →</span>
                  </Link>
                )}
              </div>

              <div className="p-6">
                {courses.length === 0 ? (
                  <div className="text-center py-10">
                    <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: "#bcc9cd" }} />
                    <p className="mb-4 text-sm text-[#8ea1ab]">No courses yet — generate one!</p>
                    <Link href="/courses/create">
                      <button className="btn-primary px-6 py-2.5 text-sm font-bold">Generate First Course</button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {courses.slice(0, 5).map((course) => {
                      const isComplete = course.completion_percentage === 100;
                      const pct = course.completion_percentage;
                      return (
                        <Link key={course.id} href={`/courses/${course.id}`}>
                          <div
                            className="flex items-center gap-4 p-4 rounded-2xl transition-all hover:-translate-y-0.5 hover:shadow-lg"
                            style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${isComplete ? "rgba(255,186,69,0.18)" : "rgba(76,215,246,0.14)"}` }}
                          >
                            {/* Icon */}
                            <div
                              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                              style={{
                                background: isComplete ? "rgba(255,186,69,0.1)" : "rgba(76,215,246,0.1)",
                                border: `1px solid ${isComplete ? "rgba(255,186,69,0.25)" : "rgba(76,215,246,0.2)"}`,
                              }}
                            >
                              {isComplete
                                ? <Trophy className="w-5 h-5 text-amber-400" />
                                : <BookOpen className="w-5 h-5 text-[#4cd7f6]" />
                              }
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="mb-2 truncate text-sm font-semibold text-white">{course.course_name}</p>
                              <div className="flex items-center gap-3">
                                <div className="flex-1 h-1.5 rounded-full bg-white/10">
                                  <div
                                    className="h-1.5 rounded-full transition-all duration-500"
                                    style={{
                                      width: `${pct}%`,
                                      background: isComplete
                                        ? "linear-gradient(90deg,#ffba45,#fdddb8)"
                                        : "linear-gradient(90deg,#4cd7f6,#acedff)",
                                      boxShadow: isComplete
                                        ? "0 0 6px rgba(255,186,69,0.4)"
                                        : "0 0 6px rgba(76,215,246,0.4)",
                                    }}
                                  />
                                </div>
                                <span
                                  className="text-xs font-bold shrink-0 tabular-nums"
                                  style={{ color: isComplete ? "#ffba45" : "#4cd7f6" }}
                                >
                                  {pct}%
                                </span>
                              </div>
                            </div>

                            {/* Badge */}
                            <span
                              className="text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0"
                              style={isComplete
                                ? { background: "rgba(255,186,69,0.12)", color: "#ffba45", border: "1px solid rgba(255,186,69,0.3)" }
                                : { background: "rgba(76,215,246,0.08)", color: "#4cd7f6", border: "1px solid rgba(76,215,246,0.2)" }
                              }
                            >
                              {isComplete ? "✓ Done" : "Active"}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
