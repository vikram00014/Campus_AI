"use server";

import { createClient } from "@/lib/supabase/server";
import { getTrustedContext } from "@/lib/tavily";
import { generateText, isLlmConfigured } from "@/lib/llm";

export type AskTopicResult =
  | { success: true; answer: string }
  | { success: false; error: string };

export async function askTopicQuestion(
  courseId: string,
  topicId: string,
  question: string
): Promise<{ success: true; answer: string } | { success: false; error: string }> {
  try {
    const trimmedQuestion = question.trim().slice(0, 1000);
    if (!trimmedQuestion) {
      return { success: false, error: "Please type a question first." };
    }

    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return { success: false, error: "You must be logged in." };

    // Verify ownership
    const { data: ownedCourse } = await supabase
      .from("courses")
      .select("id, course_name")
      .eq("id", courseId)
      .eq("user_id", user.id)
      .single() as { data: { id: string; course_name: string } | null };

    if (!ownedCourse) return { success: false, error: "Course not found." };

    // Get topic details
    const { data: moduleRows } = await supabase
      .from("modules")
      .select("id, topics(id, title, notes)")
      .eq("course_id", courseId) as {
        data: Array<{ id: string; topics: Array<{ id: string; title: string; notes: string | null }> | null }> | null
      };

    const topic = (moduleRows || [])
      .flatMap((row) => row.topics || [])
      .find((t) => t.id === topicId);

    if (!topic) return { success: false, error: "Topic not found." };

    if (!isLlmConfigured()) {
      return { success: false, error: "The AI tutor is unavailable right now. Notes and practice still work." };
    }

    // Build context from notes + trusted search
    let context = topic.notes?.trim() || "";
    if (!context) {
      context = await getTrustedContext(topic.title, ownedCourse.course_name).catch(() => "");
    }

    const systemPrompt = `You are an expert AI tutor helping a student understand "${topic.title}" from the course "${ownedCourse.course_name}".

Topic Context:
${context.slice(0, 1800) || "No additional context available."}

Guidelines:
- Answer clearly and concisely in 2-4 sentences
- Use a short example if helpful
- Focus on exam-relevance
- Format in clean Markdown`;

    const answer = await generateText({
      system: systemPrompt,
      prompt: trimmedQuestion,
      maxTokens: 600,
      effort: "low",
    });

    return { success: true, answer };
  } catch (error: unknown) {
    console.error("AI chat error:", error);
    return { success: false, error: "The tutor couldn't answer that just now. Please try again." };
  }
}
