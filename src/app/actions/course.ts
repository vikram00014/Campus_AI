"use server";

import { z } from "zod";
import { searchYouTubeVideos, type YouTubeVideo } from "@/lib/youtube";
import { createClient } from "@/lib/supabase/server";
import { generateJson, isLlmConfigured } from "@/lib/llm";

const courseSyllabusResponseSchema = {
    type: "object",
    properties: {
        modules: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    title: { type: "string" },
                    orderIndex: { type: "number" },
                    topics: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                title: { type: "string" },
                                description: { type: "string" },
                                type: { type: "string", enum: ["video", "notes", "task"] },
                                estimatedMinutes: { type: "number" },
                            },
                            required: ["title", "description", "type", "estimatedMinutes"],
                        },
                    },
                },
                required: ["title", "orderIndex", "topics"],
            },
        },
        totalEstimatedHours: { type: "number" },
        prerequisites: { type: "array", items: { type: "string" } },
    },
    required: ["modules", "totalEstimatedHours", "prerequisites"],
};

// Zod Schema representing the desired Structured Output
const topicSchema = z.object({
    title: z.string().describe("The title of the sub-topic"),
    description: z.string().describe("A brief 1-sentence description of what this topic covers."),
    type: z.enum(["video", "notes", "task"]).describe("The primary medium of this topic chunk"),
    estimatedMinutes: z.number().describe("Estimated minutes to consume this topic"),
});

const moduleSchema = z.object({
    title: z.string().describe("The name of the module/unit"),
    orderIndex: z.number().describe("The ordered index of this module starting from 1"),
    topics: z.array(topicSchema).describe("List of topics covered in this module in chronological learning order"),
});

const courseSyllabusSchema = z.object({
    modules: z.array(moduleSchema).describe("The complete list of modules extracted from the syllabus"),
    totalEstimatedHours: z.number().describe("Total estimated hours to complete the entire course"),
    prerequisites: z.array(z.string()).describe("Any required prior knowledge mentioned in the syllabus"),
});

type ParsedTopic = z.infer<typeof topicSchema>;
type ParsedModule = z.infer<typeof moduleSchema>;
type ParsedCourseSyllabus = z.infer<typeof courseSyllabusSchema>;

type EnrichedTopic = ParsedTopic & {
    videoPlaylists: YouTubeVideo[] | null;
    generatedNotes: null; // Notes are generated on-demand in the player
};

type EnrichedModule = ParsedModule & {
    topics: EnrichedTopic[];
};

export type GenerateCourseResult =
    | {
        success: true;
        courseId: string;
        duplicate: boolean;
        data?: ParsedCourseSyllabus & {
            modules: EnrichedModule[];
        };
    }
    | {
        success: false;
        error: string;
    };

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return "Unknown error";
}

function normalizeText(value: string): string {
    return value.replace(/\s+/g, " ").trim().toLowerCase();
}

/**
 * Server action to parse syllabus raw text and generate the structured course json
 */
export async function generateCourseFromSyllabus(
    courseName: string,
    syllabusRawText: string,
    academicInfo: { year: string, branch: string, semester: number }
): Promise<GenerateCourseResult> {
    try {
        const supabase = await createClient();

        // Ensure user is authed
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error("You must be logged in to generate a course.");
        }

        // Prevent duplicate course generation for same user + course metadata + syllabus content.
        const { data: candidateCourses } = await supabase
            .from("courses")
            .select("id, course_name, year, branch, semester, syllabus_text")
            .eq("user_id", user.id)
            .eq("semester", academicInfo.semester);

        const normalizedCourseName = normalizeText(courseName);
        const normalizedSyllabus = normalizeText(syllabusRawText);
        const normalizedYear = normalizeText(academicInfo.year);
        const normalizedBranch = normalizeText(academicInfo.branch);
        const duplicateCourse = (candidateCourses || []).find((course) => {
            const sameYear = normalizeText(course.year || "") === normalizedYear;
            const sameBranch = normalizeText(course.branch || "") === normalizedBranch;
            const sameCourseName = normalizeText(course.course_name || "") === normalizedCourseName;
            const sameSyllabus = normalizeText(course.syllabus_text || "") === normalizedSyllabus;
            return sameYear && sameBranch && sameCourseName && sameSyllabus;
        });

        if (duplicateCourse) {
            return {
                success: true,
                duplicate: true,
                courseId: duplicateCourse.id,
            };
        }

        const cleanSyllabus = syllabusRawText.trim().slice(0, 12000);
        const prompt = `
You are an expert curriculum designer for university engineering students.
Given the following syllabus for "${courseName}", extract the hierarchical structure of Modules and Topics.
Break down each module into atomic topics (15-45 minutes each).
Return strictly the requested JSON structure.

SYLLABUS:
${cleanSyllabus}
`;

        // 1. Generate Structured Course Skeleton
        if (!isLlmConfigured()) {
            throw new Error("The AI service is not configured. Please contact support.");
        }

        let extractionResult: ParsedCourseSyllabus;
        try {
            const raw = await generateJson<unknown>({
                prompt,
                schema: courseSyllabusResponseSchema,
                toolName: "emit_course_structure",
                maxTokens: 4096,
            });
            extractionResult = courseSyllabusSchema.parse(raw);
        } catch (llmError: unknown) {
            console.error("Course extraction error:", llmError);
            throw new Error("We could not turn this syllabus into modules. Check that the text lists units or topics, then try again.");
        }

        // 2. Augment with YouTube videos only (notes are generated on-demand in the player).
        // To conserve YouTube quota (100 units/call, 10k/day), only fetch a video for the
        // FIRST topic in each module. Remaining topics get videos on-demand in the player.
        const enrichedModules: EnrichedModule[] = [];
        for (const mod of extractionResult.modules) {
            const enrichedTopics: EnrichedTopic[] = await Promise.all(
                mod.topics.map(async (topic, topicIndex): Promise<EnrichedTopic> => {
                    if (topicIndex !== 0) {
                        // Skip YouTube for topics after the first — saves ~25 calls/course
                        return { ...topic, videoPlaylists: null, generatedNotes: null };
                    }
                    const videos = await searchYouTubeVideos(topic.title, courseName, 2).catch((error) => {
                        console.error(`Failed to fetch videos for ${topic.title}:`, error);
                        return [];
                    });
                    return {
                        ...topic,
                        videoPlaylists: videos.length > 0 ? videos : null,
                        generatedNotes: null,
                    };
                })
            );
            enrichedModules.push({ ...mod, topics: enrichedTopics });
        }

        // 3. Persist to Database
        // Insert Course
        const { data: courseData, error: courseErr } = await supabase.from('courses').insert({
            user_id: user.id,
            year: academicInfo.year,
            branch: academicInfo.branch,
            semester: academicInfo.semester,
            course_name: courseName,
            syllabus_text: syllabusRawText,
            completion_percentage: 0
        }).select('id').single();

        if (courseErr || !courseData) throw new Error("Failed to save course to database: " + courseErr?.message);

        // Insert Modules and Topics
        for (const mod of enrichedModules) {
            const modTopics = mod.topics as EnrichedTopic[];

            const { data: moduleData, error: modErr } = await supabase.from('modules').insert({
                course_id: courseData.id,
                title: mod.title,
                order_index: mod.orderIndex,
                estimated_time: modTopics.reduce((acc, topic) => acc + topic.estimatedMinutes, 0),
                status: mod.orderIndex === 1 ? 'in_progress' : 'locked' // unlock first module
            }).select('id').single();

            if (modErr || !moduleData) continue;

            const topicsToInsert = modTopics.map((topic) => ({
                module_id: moduleData.id,
                title: topic.title,
                notes: topic.generatedNotes,
                video_playlist_json: topic.videoPlaylists
            }));

            if (topicsToInsert.length > 0) {
                await supabase.from('topics').insert(topicsToInsert);
            }
        }

        return {
            success: true,
            duplicate: false,
            courseId: courseData.id,
            data: {
                ...extractionResult,
                modules: enrichedModules
            }
        };

    } catch (error: unknown) {
        console.error("Failed to generate course:", error);
        return { success: false, error: getErrorMessage(error) || "Failed to parse syllabus and generate course logic." };
    }
}
