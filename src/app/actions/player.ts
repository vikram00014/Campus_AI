"use server";

import { createClient } from "@/lib/supabase/server";
import { GoogleGenAI, Type } from "@google/genai";
import { getTrustedContext } from "@/lib/tavily";
import { searchYouTubeVideos, type YouTubeVideo } from "@/lib/youtube";

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
    type: Type.OBJECT,
    properties: {
        questions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    answer: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                },
                required: ["question", "options", "answer", "explanation"],
            },
        },
    },
    required: ["questions"],
};

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return "Unknown error";
}

async function withTimeout<T>(promise: Promise<T>, ms: number, timeoutMessage: string): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
        return await Promise.race([
            promise,
            new Promise<T>((_, reject) => {
                timer = setTimeout(() => reject(new Error(timeoutMessage)), ms);
            }),
        ]);
    } finally {
        if (timer) {
            clearTimeout(timer);
        }
    }
}

function getPracticeFallback(topicTitle: string): PracticeQuestion[] {
    return [
        {
            question: `Which statement best defines ${topicTitle}?`,
            options: [
                `${topicTitle} is only a theoretical concept with no training objective.`,
                `${topicTitle} is a core concept used to improve model learning behavior.`,
                `${topicTitle} is unrelated to optimization in neural networks.`,
                `${topicTitle} cannot be applied in modern deep learning systems.`,
            ],
            answer: `${topicTitle} is a core concept used to improve model learning behavior.`,
            explanation: "This option captures the general role of deep learning topics in training and model performance.",
        },
        {
            question: `Why is ${topicTitle} important in practical deep learning?`,
            options: [
                "It helps models generalize, converge, or represent patterns effectively.",
                "It permanently removes the need for data preprocessing.",
                "It guarantees zero loss in every epoch.",
                "It replaces all activation functions automatically.",
            ],
            answer: "It helps models generalize, converge, or represent patterns effectively.",
            explanation: "Most major deep learning topics improve learning dynamics, representation quality, or generalization.",
        },
        {
            question: `In an exam answer about ${topicTitle}, what should be included first?`,
            options: [
                "A precise definition and objective of the method.",
                "Only implementation code and no concept explanation.",
                "Only drawbacks and no use cases.",
                "Only historical background and no technical detail.",
            ],
            answer: "A precise definition and objective of the method.",
            explanation: "A clear definition and objective establish the foundation for further technical discussion.",
        },
        {
            question: `What is the best way to validate understanding of ${topicTitle}?`,
            options: [
                "Apply it in a small example and analyze training behavior.",
                "Memorize one formula without context.",
                "Avoid comparing it with related techniques.",
                "Ignore evaluation metrics entirely.",
            ],
            answer: "Apply it in a small example and analyze training behavior.",
            explanation: "Practical experimentation plus interpretation gives stronger understanding than rote memorization.",
        },
    ];
}

async function getOwnedCourseTopic(
    courseId: string,
    topicId: string
): Promise<{ courseName: string; topicTitle: string; topicNotes: string | null } | null> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
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
    const {
        data: { user },
    } = await supabase.auth.getUser();
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

    const {
        data: { user },
    } = await supabase.auth.getUser();
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

        if (!process.env.VERTEX_API_KEY) {
            return { success: true, questions: getPracticeFallback(owned.topicTitle) };
        }

        const ai = new GoogleGenAI({
            apiKey: process.env.VERTEX_API_KEY,
            vertexai: true,
            httpOptions: { timeout: 120_000 },
        });

        const context = owned.topicNotes?.trim()
            ? owned.topicNotes.slice(0, 6000)
            : await getTrustedContext(owned.topicTitle, owned.courseName).catch((contextError) => {
                console.warn("Trusted context fetch failed for practice generation:", contextError);
                return "";
            });

        const prompt = `
You are an expert exam setter for university engineering courses.
Create a concise MCQ practice set for:
Course: ${owned.courseName}
Topic: ${owned.topicTitle}

Use this context:
${context || "No additional context available."}

Requirements:
- Create 5 MCQs.
- Each question must have exactly 4 options.
- "answer" must match one of the options exactly.
- Keep questions concept-focused and exam-relevant.
- Target difficulty: ${difficulty}.
`;

        try {
            const aiResponse = await withTimeout(
                ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: prompt,
                    config: {
                        temperature: 0.2,
                        responseMimeType: "application/json",
                        responseSchema: practiceResponseSchema,
                    },
                }),
                30_000,
                "Practice generation timed out."
            );
            const parsed = JSON.parse(aiResponse.text ?? "{}");
            return { success: true, questions: parsed.questions };
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

        if (!process.env.VERTEX_API_KEY) {
            return { success: false, error: "Vertex AI API key is missing. Cannot generate notes now." };
        }

        const ai = new GoogleGenAI({
            apiKey: process.env.VERTEX_API_KEY,
            vertexai: true,
            httpOptions: { timeout: 120_000 },
        });

        const trustedContext = await getTrustedContext(owned.topicTitle, owned.courseName);
        const aiResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `
You are an expert professor.
Write complete Markdown notes for:
Course: ${owned.courseName}
Topic: ${owned.topicTitle}

Include:
- Core concept summary
- Important equations/definitions
- Examples
- Revision bullets

Context:
${trustedContext || "No external context provided."}
`,
            config: { temperature: 0.5 },
        });

        const notes = aiResponse.text ?? "";

        const supabase = await createClient();
        await supabase.from("topics").update({ notes }).eq("id", topicId);

        return { success: true, notes };
    } catch (error: unknown) {
        console.error("Failed to generate topic notes:", error);
        return { success: false, error: getErrorMessage(error) || "Could not generate notes." };
    }
}

export async function fetchTopicVideosOnDemand(
    courseId: string,
    topicId: string
): Promise<FetchTopicVideosResult> {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: "You must be logged in." };
        }

        // Verify course ownership
        const { data: ownedCourse } = await supabase
            .from("courses")
            .select("id, course_name")
            .eq("id", courseId)
            .eq("user_id", user.id)
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
