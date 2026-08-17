import "server-only";

import { generateObject, generateText as generateAiText, jsonSchema } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { getErrorMessage } from "@/lib/utils";

export type LlmEffort = "low" | "medium" | "high";

export class LlmError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "LlmError";
    }
}

export function isLlmConfigured(): boolean {
    const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;
    return Boolean(geminiKey) || Boolean(groqKey);
}

function getGeminiClient() {
    const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    return geminiKey ? createGoogleGenerativeAI({ apiKey: geminiKey }) : null;
}

function getGroqClient() {
    const groqKey = process.env.GROQ_API_KEY;
    return groqKey ? createGroq({ apiKey: groqKey }) : null;
}

/**
 * Models for structured JSON generation (course parsing).
 * Ordered by remaining free quota so the app never stops.
 * Groq is placed after Lite models because generateObject structured output
 * is more reliable on Gemini than Groq for complex schemas.
 */
function getJsonModels() {
    const models = [];
    const google = getGeminiClient();
    const groq = getGroqClient();

    if (google) {
        models.push(google("gemini-3.1-flash-lite")); // 500 RPD — 0 used  🟢 most quota
        models.push(google("gemini-3.5-flash-lite")); // 500 RPD — 2 used  🟢
        models.push(google("gemini-3.6-flash"));      //  20 RPD — 7 used  🟡
        models.push(google("gemini-flash-latest"));   //  20 RPD — 19 used 🔴 last resort
    }
    if (groq) {
        models.push(groq("llama-3.3-70b-versatile")); // no daily limit    🟢
        models.push(groq("llama-3.1-8b-instant"));    // no daily limit    🟢
    }
    if (models.length === 0) {
        const g = createGoogleGenerativeAI({ apiKey: "" });
        models.push(g("gemini-3.1-flash-lite"));
    }
    return models;
}

/**
 * Models for text generation (notes, practice questions, AI chat).
 * Ordered by remaining free quota — Groq has no daily cap so sits
 * between the two Lite pools and the near-exhausted Flash models.
 */
function getTextModels() {
    const models = [];
    const google = getGeminiClient();
    const groq = getGroqClient();

    if (google) {
        models.push(google("gemini-3.1-flash-lite")); // 500 RPD — 0 used  🟢 most quota
        models.push(google("gemini-3.5-flash-lite")); // 500 RPD — 2 used  🟢
    }
    if (groq) {
        models.push(groq("llama-3.3-70b-versatile")); // no daily limit    🟢
        models.push(groq("llama-3.1-8b-instant"));    // no daily limit    🟢
    }
    if (google) {
        models.push(google("gemini-3.6-flash"));      //  20 RPD — 7 used  🟡
        models.push(google("gemini-flash-latest"));   //  20 RPD — 19 used 🔴 last resort
    }
    if (models.length === 0) {
        const g = createGoogleGenerativeAI({ apiKey: "" });
        models.push(g("gemini-3.1-flash-lite"));
    }
    return models;
}


export async function generateText(options: {
    prompt: string;
    system?: string;
    maxTokens?: number;
    effort?: LlmEffort;
}): Promise<string> {
    const models = getTextModels();

    let lastError: unknown = null;
    for (const model of models) {
        try {
            const { text } = await generateAiText({
                model,
                system: options.system,
                prompt: options.prompt,
                // @ts-expect-error: Vercel AI SDK version parameter mapping
                maxTokens: options.maxTokens ?? 4096,
            });

            if (!text) throw new LlmError("LLM returned an empty response.");
            return text;
        } catch (error: unknown) {
            lastError = error;
            console.error("LLM Error for model:", error);
            // continue to fallback
        }
    }

    throw new LlmError(getErrorMessage(lastError));
}

export async function generateJson<T>(options: {
    prompt: string;
    system?: string;
    schema: Record<string, unknown>;
    toolName?: string;
    maxTokens?: number;
}): Promise<T> {
    const models = getJsonModels();

    let lastError: unknown = null;
    for (const model of models) {
        try {
            const { object } = await generateObject({
                model,
                system: options.system,
                prompt: options.prompt,
                schema: jsonSchema(options.schema as Record<string, unknown>),
                // @ts-expect-error: Vercel AI SDK version parameter mapping
                maxTokens: options.maxTokens ?? 8192,
            });

            return object as T;
        } catch (error: unknown) {
            lastError = error;
            console.error("LLM Error for model:", error);
            // continue to fallback
        }
    }

    throw new LlmError(getErrorMessage(lastError));
}

