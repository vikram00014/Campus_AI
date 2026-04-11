"use server";

import { GoogleGenAI } from "@google/genai";
import { createClient } from "@/lib/supabase/server";
import { getTrustedContext } from "@/lib/tavily";

export type AskTopicResult =
  | { success: true; answer: string }
  | { success: false; error: string };

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unknown error";
}

export async function askTopicQuestion(
  courseId: string,
  topicId: string,
  question: string
): Promise<{ success: true; answer: string } | { success: false; error: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
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

    if (!process.env.VERTEX_API_KEY) {
      return { success: false, error: "AI service is not configured." };
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.VERTEX_API_KEY,
      vertexai: true,
      httpOptions: { timeout: 60_000 },
    });

    // Build context from notes + trusted search
    let context = topic.notes?.trim() || "";
    if (!context) {
      context = await getTrustedContext(topic.title, ownedCourse.course_name).catch(() => "");
    }

    const systemPrompt = `You are an expert AI tutor helping a student understand "${topic.title}" 
from the course "${ownedCourse.course_name}".

Topic Context:
${context.slice(0, 4000) || "No additional context available."}

Guidelines:
- Answer clearly and precisely in 2-5 sentences max unless a detailed explanation is needed
- Use examples when helpful
- Focus on exam-relevance
- If the question is unrelated to the topic, gently redirect
- Format your response in clean Markdown
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `${systemPrompt}\n\nStudent Question: ${question}`,
      config: { temperature: 0.4 },
    });

    const answer = response.text?.trim() || "I couldn't generate an answer. Please try again.";
    return { success: true, answer };
  } catch (error: unknown) {
    console.error("AI chat error:", error);
    return { success: false, error: getErrorMessage(error) || "Failed to get AI answer." };
  }
}
