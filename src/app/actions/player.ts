"use server";

import { createClient } from "@/lib/supabase/server";
import { getTrustedContext } from "@/lib/tavily";
import { searchYouTubeVideos, type YouTubeVideo } from "@/lib/youtube";
import { generateJson, generateText, isLlmConfigured } from "@/lib/llm";
import { getErrorMessage } from "@/lib/utils";

interface CourseRecord {
    id: string;
    user_id: string;
    course_name: string;
    completion_percentage: number;
}

interface TopicRecord {
    id: string;
    module_id: string;
    title: string;
    notes: string | null;
    video_playlist_json: unknown;
    created_at: string;
}

interface ModuleRecord {
    id: string;
    title: string;
    order_index: number;
    estimated_time: number | null;
    status: "locked" | "in_progress" | "completed";
    topics: TopicRecord[] | null;
}

interface ProgressRecord {
    topic_id: string;
    notes_completed: boolean | null;
    video_progress: number | null;
    practice_completed: boolean | null;
}

interface TopicCompletionState {
    isCompleted: boolean;
    notesCompleted: boolean;
    practiceCompleted: boolean;
    videoProgress: number;
}

export interface CourseTopic {
    id: string;
    module_id: string;
    title: string;
    notes: string | null;
    video_playlist_json: unknown;
    created_at: string;
    isCompleted: boolean;
    notesCompleted: boolean;
    practiceCompleted: boolean;
    videoProgress: number;
}

export interface CourseModule {
    id: string;
    title: string;
    order_index: number;
    estimated_time: number | null;
    status: "locked" | "in_progress" | "completed";
    topics: CourseTopic[];
}

export interface CoursePlayerData {
    id: string;
    course_name: string;
    completion_percentage: number;
    modules: CourseModule[];
}

export interface PracticeQuestion {
    question: string;
    options: string[];
    answer: string;
    explanation: string;
}

interface UpdateCourseProgressResult {
    completionPercentage: number;
    modules: CourseModule[];
}

export type MarkTopicAsCompleteResult =
    | {
        success: true;
        completionPercentage: number;
        modules: CourseModule[];
    }
    | {
        success: false;
        error: string;
    };

export type GeneratePracticeResult =
    | {
        success: true;
        questions: PracticeQuestion[];
    }
    | {
        success: false;
        error: string;
    };

export type GenerateTopicNotesResult =
    | {
        success: true;
        notes: string;
    }
    | {
        success: false;
        error: string;
    };

export type FetchTopicVideosResult =
    | {
        success: true;
        videos: YouTubeVideo[];
    }
    | {
        success: false;
        error: string;
    };

const practiceResponseSchema = {
    type: "object",
    properties: {
        questions: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    question: { type: "string" },
                    options: { type: "array", items: { type: "string" } },
                    answer: { type: "string" },
                    explanation: { type: "string" },
                },
                required: ["question", "options", "answer", "explanation"],
            },
        },
    },
    required: ["questions"],
};


function getPracticeFallback(topicTitle: string): PracticeQuestion[] {
    return [
        {
            question: `Which statement best describes ${topicTitle}?`,
            options: [
                `${topicTitle} is a core concept with a defined purpose and scope within this subject.`,
                `${topicTitle} is a purely decorative term with no practical role.`,
                `${topicTitle} applies only outside this field of study.`,
                `${topicTitle} has no relationship to any other topic in this course.`,
            ],
            answer: `${topicTitle} is a core concept with a defined purpose and scope within this subject.`,
            explanation: "Course topics are introduced because they carry a specific purpose and connect to the wider syllabus.",
        },
        {
            question: `Why does the syllabus include ${topicTitle}?`,
            options: [
                "It builds understanding needed for later topics and exam questions.",
                "It removes the need to study any other topic.",
                "It is included only for historical interest.",
                "It replaces the need for practice problems entirely.",
            ],
            answer: "It builds understanding needed for later topics and exam questions.",
            explanation: "Syllabus topics are sequenced so each one supports the material that follows.",
        },
        {
            question: `When writing an exam answer about ${topicTitle}, what should come first?`,
            options: [
                "A precise definition and the purpose of the concept.",
                "Only a worked example with no explanation.",
                "Only the limitations, with no definition.",
                "Only background history, with no technical detail.",
            ],
            answer: "A precise definition and the purpose of the concept.",
            explanation: "A clear definition and objective establish the foundation for further technical discussion.",
        },
        {
            question: `What is the best way to confirm you understand ${topicTitle}?`,
            options: [
                "Apply it to a small worked example and explain each step.",
                "Memorize one sentence without context.",
                "Avoid comparing it with related concepts.",
                "Skip all practice questions on the topic.",
            ],
            answer: "Apply it to a small worked example and explain each step.",
            explanation: "Applying a concept and explaining the steps tests real understanding rather than recall.",
        },
    ];
}

function sanitizePracticeQuestions(questions: unknown): PracticeQuestion[] {
    if (!Array.isArray(questions)) return [];
    return questions.filter((item): item is PracticeQuestion => {
        if (!item || typeof item !== "object") return false;
        const candidate = item as Partial<PracticeQuestion>;
        return (
            typeof candidate.question === "string" &&
            typeof candidate.answer === "string" &&
            typeof candidate.explanation === "string" &&
            Array.isArray(candidate.options) &&
            candidate.options.length >= 2 &&
            candidate.options.every((option) => typeof option === "string") &&
            // A question whose answer isn't among the options can never be scored correctly.
            candidate.options.includes(candidate.answer)
        );
    });
}

async function getOwnedCourseTopic(
    courseId: string,
    topicId: string
): Promise<{ courseName: string; topicTitle: string; topicNotes: string | null } | null> {
    const supabase = await createClient();

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
        return null;
    }

    const { data: ownedCourse } = await supabase
        .from("courses")
        .select("id, course_name")
        .eq("id", courseId)
        .eq("user_id", user.id)
        .single() as { data: { id: string; course_name: string } | null };

    if (!ownedCourse) {
        return null;
    }

    const { data: moduleTopicRows } = await supabase
        .from("modules")
        .select("id, topics(id, title, notes)")
        .eq("course_id", courseId) as {
            data: Array<{
                id: string;
                topics: Array<{ id: string; title: string; notes: string | null }> | null;
            }> | null;
        };

    const topic = (moduleTopicRows || [])
        .flatMap((row) => row.topics || [])
        .find((candidate) => candidate.id === topicId);

    if (!topic) {
        return null;
    }

    return {
        courseName: ownedCourse.course_name,
        topicTitle: topic.title,
        topicNotes: topic.notes,
    };
}

async function validateTopicOwnership(
    courseId: string,
    topicId: string
): Promise<{ userId: string } | { error: string }> {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
        return { error: "You must be logged in to update progress." };
    }

    const { data: ownedCourse } = await supabase
        .from("courses")
        .select("id")
        .eq("id", courseId)
        .eq("user_id", user.id)
        .single();

    if (!ownedCourse) {
        return { error: "Course not found." };
    }

    const { data: moduleTopicRows } = await supabase
        .from("modules")
        .select("id, topics(id)")
        .eq("course_id", courseId);

    const topicIds = (moduleTopicRows || []).flatMap((row) =>
        (row.topics || []).map((topic: { id: string }) => topic.id)
    );

    if (!topicIds.includes(topicId)) {
        return { error: "Topic does not belong to this course." };
    }

    return { userId: user.id };
}

function isTopicCompleted(progress?: ProgressRecord): boolean {
    if (!progress) {
        return false;
    }
    const videoDone = (progress.video_progress || 0) >= 90;
    return Boolean(progress.notes_completed || progress.practice_completed || videoDone);
}

function buildTopicProgressMap(progressList: ProgressRecord[]): Map<string, TopicCompletionState> {
    const progressMap = new Map<string, TopicCompletionState>();
    progressList.forEach((progress) => {
        progressMap.set(progress.topic_id, {
            isCompleted: isTopicCompleted(progress),
            notesCompleted: Boolean(progress.notes_completed),
            practiceCompleted: Boolean(progress.practice_completed),
            videoProgress: progress.video_progress || 0,
        });
    });
    return progressMap;
}

async function recalculateCourseProgress(
    courseId: string,
    userId: string
): Promise<UpdateCourseProgressResult> {
    const supabase = await createClient();

    const { data: rawModules } = await supabase
        .from("modules")
        .select("id, title, order_index, estimated_time, status, topics(id, module_id, title, notes, video_playlist_json, created_at)")
        .eq("course_id", courseId)
        .order("order_index", { ascending: true }) as { data: ModuleRecord[] | null };

    const modules = rawModules || [];
    const allTopicIds = modules.flatMap((module) => (module.topics || []).map((topic) => topic.id));

    const { data: rawProgress } = allTopicIds.length
        ? await supabase
            .from("progress")
            .select("topic_id, notes_completed, video_progress, practice_completed")
            .eq("user_id", userId)
            .in("topic_id", allTopicIds) as { data: ProgressRecord[] | null }
        : { data: [] as ProgressRecord[] };

    const progressMap = buildTopicProgressMap(rawProgress || []);

    const hydratedModules: CourseModule[] = modules.map((module) => ({
        id: module.id,
        title: module.title,
        order_index: module.order_index,
        estimated_time: module.estimated_time,
        status: module.status,
        topics: (module.topics || [])
            .sort(
                (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            )
            .map((topic) => ({
                ...topic,
                isCompleted: progressMap.get(topic.id)?.isCompleted ?? false,
                notesCompleted: progressMap.get(topic.id)?.notesCompleted ?? false,
                practiceCompleted: progressMap.get(topic.id)?.practiceCompleted ?? false,
                videoProgress: progressMap.get(topic.id)?.videoProgress ?? 0,
            })),
    }));

    let allowUnlocked = true;
    for (const courseModule of hydratedModules) {
        const allTopicsCompleted =
            courseModule.topics.length > 0 && courseModule.topics.every((topic) => topic.isCompleted);

        if (allTopicsCompleted && allowUnlocked) {
            courseModule.status = "completed";
        } else if (allowUnlocked) {
            courseModule.status = "in_progress";
            allowUnlocked = false;
        } else {
            courseModule.status = "locked";
        }
    }

    await Promise.all(
        hydratedModules.map((module) =>
            supabase.from("modules").update({ status: module.status }).eq("id", module.id)
        )
    );

    const totalTopics = hydratedModules.reduce((acc, module) => acc + module.topics.length, 0);
    const completedTopics = hydratedModules.reduce(
        (acc, module) => acc + module.topics.filter((topic) => topic.isCompleted).length,
        0
    );
    const completionPercentage = totalTopics
        ? Math.round((completedTopics / totalTopics) * 100)
        : 0;

    await supabase
        .from("courses")
        .update({ completion_percentage: completionPercentage })
        .eq("id", courseId)
        .eq("user_id", userId);

    return {
        completionPercentage,
        modules: hydratedModules,
    };
}

export async function fetchCourseData(courseId: string): Promise<CoursePlayerData | null> {
    const supabase = await createClient();

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
        return null;
    }

    const { data: course, error: courseErr } = await supabase
        .from("courses")
        .select("id, user_id, course_name, completion_percentage")
        .eq("id", courseId)
        .eq("user_id", user.id)
        .single() as { data: CourseRecord | null; error: unknown };

    if (courseErr || !course) {
        return null;
    }

    const recalculated = await recalculateCourseProgress(courseId, user.id);

    return {
        id: course.id,
        course_name: course.course_name,
        completion_percentage: recalculated.completionPercentage,
        modules: recalculated.modules,
    };
}

export async function markTopicAsComplete(
    courseId: string,
    topicId: string
): Promise<MarkTopicAsCompleteResult> {
    try {
        const supabase = await createClient();
        const ownership = await validateTopicOwnership(courseId, topicId);
        if ("error" in ownership) {
            return { success: false, error: ownership.error };
        }

        const { error: upsertError } = await supabase.from("progress").upsert(
            {
                user_id: ownership.userId,
                topic_id: topicId,
                notes_completed: true,
                video_progress: 100,
                practice_completed: true,
            },
            { onConflict: "user_id,topic_id" }
        );

        if (upsertError) {
            return { success: false, error: upsertError.message };
        }

        const recalculated = await recalculateCourseProgress(courseId, ownership.userId);

        return {
            success: true,
            completionPercentage: recalculated.completionPercentage,
            modules: recalculated.modules,
        };
    } catch (error: unknown) {
        console.error("Failed to mark topic complete:", error);
        return {
            success: false,
            error: getErrorMessage(error) || "Could not update progress.",
        };
    }
}

export async function updateTopicProgress(
    courseId: string,
    topicId: string,
    updates: {
        notesCompleted?: boolean;
        practiceCompleted?: boolean;
        videoProgress?: number;
    }
): Promise<MarkTopicAsCompleteResult> {
    try {
        const ownership = await validateTopicOwnership(courseId, topicId);
        if ("error" in ownership) {
            return { success: false, error: ownership.error };
        }

        const supabase = await createClient();
        const { data: existing } = await supabase
            .from("progress")
            .select("notes_completed, video_progress, practice_completed")
            .eq("user_id", ownership.userId)
            .eq("topic_id", topicId)
            .maybeSingle() as {
                data: {
                    notes_completed: boolean | null;
                    video_progress: number | null;
                    practice_completed: boolean | null;
                } | null;
            };

        const videoProgressValue = updates.videoProgress !== undefined
            ? Math.max(0, Math.min(100, Math.round(updates.videoProgress)))
            : (existing?.video_progress || 0);

        const payload = {
            user_id: ownership.userId,
            topic_id: topicId,
            notes_completed: updates.notesCompleted ?? existing?.notes_completed ?? false,
            practice_completed: updates.practiceCompleted ?? existing?.practice_completed ?? false,
            video_progress: videoProgressValue,
        };

        const { error: upsertError } = await supabase
            .from("progress")
            .upsert(payload, { onConflict: "user_id,topic_id" });

        if (upsertError) {
            return { success: false, error: upsertError.message };
        }

        const recalculated = await recalculateCourseProgress(courseId, ownership.userId);
        return {
            success: true,
            completionPercentage: recalculated.completionPercentage,
            modules: recalculated.modules,
        };
    } catch (error: unknown) {
        console.error("Failed to update topic progress:", error);
        return {
            success: false,
            error: getErrorMessage(error) || "Could not update topic progress.",
        };
    }
}

export async function generatePracticeQuestions(
    courseId: string,
    topicId: string,
    difficulty: "easy" | "medium" | "hard" = "medium"
): Promise<GeneratePracticeResult> {
    try {
        const owned = await getOwnedCourseTopic(courseId, topicId);
        if (!owned) {
            return { success: false, error: "Topic not found for this course." };
        }

        if (!isLlmConfigured()) {
            return { success: true, questions: getPracticeFallback(owned.topicTitle) };
        }

        const context = owned.topicNotes?.trim()
            ? owned.topicNotes.slice(0, 2500)
            : await getTrustedContext(owned.topicTitle, owned.courseName).catch((contextError) => {
                console.warn("Trusted context fetch failed for practice generation:", contextError);
                return "";
            });

        const prompt = `
You are an expert exam setter for university engineering courses.
Create a concise MCQ practice set for:
Course: ${owned.courseName}
Topic: ${owned.topicTitle}

Context:
${context || "No additional context available."}

Requirements:
- Create 5 MCQs.
- Each question must have exactly 4 options.
- "answer" must match one of the options exactly.
- Keep questions concept-focused and exam-relevant.
- Target difficulty: ${difficulty}.
`;

        try {
            const parsed = await generateJson<{ questions?: unknown }>({
                prompt,
                schema: practiceResponseSchema,
                toolName: "emit_practice_questions",
                maxTokens: 1200,
            });
            const questions = sanitizePracticeQuestions(parsed.questions);
            if (questions.length === 0) {
                return { success: true, questions: getPracticeFallback(owned.topicTitle) };
            }
            return { success: true, questions };
        } catch (modelParseError: unknown) {
            console.error("Structured practice generation failed, using fallback:", modelParseError);
            return { success: true, questions: getPracticeFallback(owned.topicTitle) };
        }
    } catch (error: unknown) {
        console.error("Failed to generate practice questions:", error);
        return { success: true, questions: getPracticeFallback("this topic") };
    }
}

export async function generateTopicNotesOnDemand(
    courseId: string,
    topicId: string
): Promise<GenerateTopicNotesResult> {
    try {
        const owned = await getOwnedCourseTopic(courseId, topicId);
        if (!owned) {
            return { success: false, error: "Topic not found for this course." };
        }

        if (owned.topicNotes && owned.topicNotes.trim().length > 0) {
            return { success: true, notes: owned.topicNotes };
        }

        if (!isLlmConfigured()) {
            return { success: false, error: "Notes generation is unavailable right now. Videos and practice still work." };
        }

        const trustedContext = await getTrustedContext(owned.topicTitle, owned.courseName).catch(() => "");
        const cleanContext = trustedContext ? trustedContext.slice(0, 3000) : "";

        const notes = await generateText({
            system: "You are an expert professor who writes clear, exam-focused Markdown study notes.",
            prompt: `
Write concise, high-yield Markdown notes for:
Course: ${owned.courseName}
Topic: ${owned.topicTitle}

Include:
- Core concept summary
- Key equations/definitions
- 1 concise worked example
- Quick revision bullets

Context:
${cleanContext || "No external context provided."}
`,
            maxTokens: 2500,
            effort: "low",
        });

        if (!notes.trim()) {
            return { success: false, error: "We couldn't generate notes for this topic. Videos and practice are still available." };
        }

        const supabase = await createClient();
        await supabase.from("topics").update({ notes }).eq("id", topicId);

        return { success: true, notes };
    } catch (error: unknown) {
        console.error("Failed to generate topic notes:", error);
        return { success: false, error: "We couldn't generate notes for this topic. Videos and practice are still available." };
    }
}

export async function fetchTopicVideosOnDemand(
    courseId: string,
    topicId: string
): Promise<FetchTopicVideosResult> {
    try {
        const ownership = await validateTopicOwnership(courseId, topicId);
        if ("error" in ownership) {
            return { success: false, error: ownership.error };
        }

        const supabase = await createClient();

        // Fetch course name for the YouTube search query
        const { data: ownedCourse } = await supabase
            .from("courses")
            .select("id, course_name")
            .eq("id", courseId)
            .eq("user_id", ownership.userId)
            .single() as { data: { id: string; course_name: string } | null };

        if (!ownedCourse) {
            return { success: false, error: "Course not found." };
        }

        // Fetch the topic to check for existing videos and get its title
        const { data: topicRow } = await supabase
            .from("topics")
            .select("id, title, video_playlist_json")
            .eq("id", topicId)
            .single() as {
                data: { id: string; title: string; video_playlist_json: unknown } | null;
            };

        if (!topicRow) {
            return { success: false, error: "Topic not found." };
        }

        // Return cached videos if they already exist
        if (Array.isArray(topicRow.video_playlist_json) && topicRow.video_playlist_json.length > 0) {
            return { success: true, videos: topicRow.video_playlist_json as YouTubeVideo[] };
        }

        const videos = await searchYouTubeVideos(topicRow.title, ownedCourse.course_name, 3);

        await supabase
            .from("topics")
            .update({ video_playlist_json: videos })
            .eq("id", topicId);

        return { success: true, videos };
    } catch (error: unknown) {
        console.error("Failed to fetch topic videos:", error);
        return { success: false, error: getErrorMessage(error) || "Could not fetch videos." };
    }
}

