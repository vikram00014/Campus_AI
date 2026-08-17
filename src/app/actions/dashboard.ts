"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface CourseRecord {
    id: string;
    user_id: string;
    year: string;
    branch: string;
    semester: number;
    course_name: string;
    syllabus_text: string | null;
    completion_percentage: number;
    created_at: string;
}

interface ModuleRecord {
    id: string;
    course_id: string;
    title: string;
    order_index: number;
    estimated_time: number | null;
    status: "locked" | "in_progress" | "completed";
    topics: TopicRecord[] | null;
}

interface TopicRecord {
    id: string;
    module_id: string;
    title: string;
    created_at: string;
}

interface ProgressRecord {
    topic_id: string;
    notes_completed: boolean | null;
    video_progress: number | null;
    practice_completed: boolean | null;
    created_at: string;
    updated_at: string | null;
}

function progressDayKey(progress: ProgressRecord): string {
    return new Date(progress.updated_at || progress.created_at).toISOString().slice(0, 10);
}

function dayKeyOffset(days: number): string {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export interface TopicPlanItem {
    courseId: string;
    courseName: string;
    moduleTitle: string;
    topicTitle: string;
    estimatedMinutes: number;
    isLocked: boolean;
}

export interface DashboardInsights {
    weakTopics: TopicPlanItem[];
    todayPlan: TopicPlanItem[];
    planLabel: string;
    remainingTopics: number;
    avgTopicsPerDay: number;
    projectedCompletionDate: string | null;
    isFallingBehind: boolean;
    dailyTargetTopics: number | null;
    streakDays: number;
    xpScore: number;
    todayCompletedTopics: number;
    weeklyStudyMinutes: number;
}

export type StudyPlanMode = "default" | "tomorrow" | "three_day";

function isProgressCompleted(progress?: ProgressRecord): boolean {
    if (!progress) {
        return false;
    }
    const videoDone = (progress.video_progress || 0) >= 90;
    return Boolean(progress.notes_completed || progress.practice_completed || videoDone);
}

function getModeConfig(
    mode: StudyPlanMode,
    remainingTopics: number
): { planLabel: string; planCount: number; dailyTargetTopics: number | null } {
    if (mode === "tomorrow") {
        return {
            planLabel: "Exam Countdown Plan (Tomorrow Focus)",
            planCount: Math.min(10, Math.max(4, remainingTopics)),
            dailyTargetTopics: remainingTopics,
        };
    }
    if (mode === "three_day") {
        const dailyTarget = Math.max(1, Math.ceil(remainingTopics / 3));
        return {
            planLabel: "3-Day Completion Plan",
            planCount: Math.min(12, dailyTarget),
            dailyTargetTopics: dailyTarget,
        };
    }
    return {
        planLabel: "Today's Personalized Study Plan",
        planCount: Math.min(6, Math.max(3, remainingTopics)),
        dailyTargetTopics: null,
    };
}

export async function fetchDashboardData(mode: StudyPlanMode = "default") {
    const supabase = await createClient();

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return null;

    const { data: courses } = await supabase
        .from("courses")
        .select("id, user_id, year, branch, semester, course_name, completion_percentage, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }) as { data: CourseRecord[] | null };

    const safeCourses = courses || [];
    const courseIds = safeCourses.map((course) => course.id);
    const courseById = new Map(safeCourses.map((course) => [course.id, course]));
    const modulesByCourseId = new Map<string, number>();

    let moduleRows: ModuleRecord[] = [];
    if (courseIds.length > 0) {
        const { data: modules } = await supabase
            .from("modules")
            .select("id, course_id, title, order_index, estimated_time, status, topics(id, module_id, title, created_at)")
            .in("course_id", courseIds)
            .order("order_index", { ascending: true }) as { data: ModuleRecord[] | null };
        moduleRows = modules || [];

        moduleRows.forEach((module) => {
            const currentMinutes = modulesByCourseId.get(module.course_id) || 0;
            modulesByCourseId.set(module.course_id, currentMinutes + (module.estimated_time || 0));
        });
    }

    const { data: progressRows } = await supabase
        .from("progress")
        .select("topic_id, notes_completed, video_progress, practice_completed, created_at, updated_at")
        .eq("user_id", user.id) as { data: ProgressRecord[] | null };
    const safeProgress = progressRows || [];
    const progressMap = new Map(safeProgress.map((progress) => [progress.topic_id, progress]));

    const totalCompletedMinutes = safeCourses.reduce((acc, course) => {
        const totalMinutes = modulesByCourseId.get(course.id) || 0;
        const completedFraction = Math.max(0, Math.min(100, course.completion_percentage)) / 100;
        return acc + totalMinutes * completedFraction;
    }, 0);
    const totalHours = Math.floor(totalCompletedMinutes / 60);

    const incompleteTopicItems: TopicPlanItem[] = [];
    const topicEstimatedMinutes = new Map<string, number>();
    moduleRows
        .sort((a, b) => a.order_index - b.order_index)
        .forEach((module) => {
            const course = courseById.get(module.course_id);
            if (!course) return;

            const sortedTopics = (module.topics || [])
                .slice()
                .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            const perTopicMinutes = Math.max(
                10,
                Math.round((module.estimated_time || sortedTopics.length * 20) / Math.max(1, sortedTopics.length))
            );

            sortedTopics.forEach((topic) => {
                topicEstimatedMinutes.set(topic.id, perTopicMinutes);
                const isCompleted = isProgressCompleted(progressMap.get(topic.id));
                if (isCompleted) return;
                incompleteTopicItems.push({
                    courseId: course.id,
                    courseName: course.course_name,
                    moduleTitle: module.title,
                    topicTitle: topic.title,
                    estimatedMinutes: perTopicMinutes,
                    isLocked: module.status === "locked",
                });
            });
        });

    const unlockedIncompleteTopics = incompleteTopicItems.filter((item) => !item.isLocked);
    const weakTopicsPool = unlockedIncompleteTopics.length > 0 ? unlockedIncompleteTopics : incompleteTopicItems;
    const weakTopics = weakTopicsPool.slice(0, 6);

    const remainingTopics = incompleteTopicItems.length;
    const completedTopicsCount = safeProgress.filter((progress) => isProgressCompleted(progress)).length;
    const completedDays = new Set(
        safeProgress
            .filter((progress) => isProgressCompleted(progress))
            .map(progressDayKey)
    );
    const avgTopicsPerDayRaw =
        completedDays.size > 0 ? completedTopicsCount / completedDays.size : 0;
    const avgTopicsPerDay = Math.max(0.5, Number(avgTopicsPerDayRaw.toFixed(2)) || 0.5);

    const projectedDays = remainingTopics > 0 ? Math.ceil(remainingTopics / avgTopicsPerDay) : 0;
    const projectedCompletionDate = projectedDays > 0
        ? new Date(Date.now() + projectedDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

    const modeConfig = getModeConfig(mode, remainingTopics);
    const todayPlanPool = unlockedIncompleteTopics.length > 0 ? unlockedIncompleteTopics : incompleteTopicItems;
    const todayPlan = todayPlanPool.slice(0, modeConfig.planCount);

    const isFallingBehind =
        mode === "three_day" &&
        modeConfig.dailyTargetTopics !== null &&
        remainingTopics > 0 &&
        avgTopicsPerDay < modeConfig.dailyTargetTopics;

    const completedDates = Array.from(completedDays).sort((a, b) => b.localeCompare(a));
    const todayKey = dayKeyOffset(0);
    const yesterdayKey = dayKeyOffset(1);

    // A streak stays alive until a full day is missed, so anchor on yesterday when
    // today has no activity yet rather than resetting the count to zero.
    let streakDays = 0;
    if (completedDates.includes(todayKey) || completedDates.includes(yesterdayKey)) {
        let cursor = completedDates.includes(todayKey) ? todayKey : yesterdayKey;
        let offset = completedDates.includes(todayKey) ? 0 : 1;
        while (completedDates.includes(cursor)) {
            streakDays += 1;
            offset += 1;
            cursor = dayKeyOffset(offset);
        }
    }

    const todayCompletedTopics = safeProgress.filter(
        (progress) => isProgressCompleted(progress) && progressDayKey(progress) === todayKey
    ).length;

    const weeklyCutoffKey = dayKeyOffset(6);
    const weeklyStudyMinutes = safeProgress.reduce((total, progress) => {
        if (!isProgressCompleted(progress)) {
            return total;
        }
        if (progressDayKey(progress) < weeklyCutoffKey) {
            return total;
        }
        return total + (topicEstimatedMinutes.get(progress.topic_id) || 0);
    }, 0);

    const xpScore =
        completedTopicsCount * 15 +
        safeCourses.filter((course) => course.completion_percentage === 100).length * 150;

    const insights: DashboardInsights = {
        weakTopics,
        todayPlan,
        planLabel: modeConfig.planLabel,
        remainingTopics,
        avgTopicsPerDay,
        projectedCompletionDate,
        isFallingBehind,
        dailyTargetTopics: modeConfig.dailyTargetTopics,
        streakDays,
        xpScore,
        todayCompletedTopics,
        weeklyStudyMinutes,
    };

    return {
        user,
        courses: safeCourses,
        stats: {
            totalCourses: safeCourses.length,
            completedCourses: safeCourses.filter((course) => course.completion_percentage === 100).length,
            learningHours: totalHours,
        },
        insights,
    };
}

export async function deleteCourse(formData: FormData): Promise<void> {
    const courseId = formData.get("courseId");
    if (typeof courseId !== "string" || !courseId.trim()) {
        return;
    }

    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
        return;
    }

    const { error } = await supabase
        .from("courses")
        .delete()
        .eq("id", courseId)
        .eq("user_id", user.id);

    if (error) {
        console.error("Failed to delete course:", error.message);
        return;
    }

    revalidatePath("/dashboard");
}
