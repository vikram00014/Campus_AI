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
 * Uses full Flash models first for higher accuracy, then falls back to Lite (500 RPD free).
 */
function getJsonModels() {
    const models = [];
    const google = getGeminiClient();
    const groq = getGroqClient();

    if (google) {
        models.push(google("gemini-flash-latest"));   // Gemini 3.7 Flash  — 20 RPD
        models.push(google("gemini-3.6-flash"));      // Gemini 3.6 Flash  — 20 RPD
        models.push(google("gemini-3.5-flash-lite")); // Gemini 3.5 Flash Lite — 500 RPD 🟢
        models.push(google("gemini-3.1-flash-lite")); // Gemini 3.1 Flash Lite — 500 RPD 🟢
    }
    if (groq) {
        models.push(groq("llama-3.3-70b-versatile")); // Groq fallback — generous free tier
        models.push(groq("llama-3.1-8b-instant"));
    }
    if (models.length === 0) {
        const g = createGoogleGenerativeAI({ apiKey: "" });
        models.push(g("gemini-flash-latest"));
    }
    return models;
}

/**
 * Models for text generation (notes, practice questions, AI chat).
 * Starts with Lite models (500 RPD free) to preserve the scarce 20-RPD Flash quota.
 */
function getTextModels() {
    const models = [];
    const google = getGeminiClient();
    const groq = getGroqClient();

    if (google) {
        models.push(google("gemini-3.5-flash-lite")); // Gemini 3.5 Flash Lite — 500 RPD 🟢 (start here!)
        models.push(google("gemini-3.1-flash-lite")); // Gemini 3.1 Flash Lite — 500 RPD 🟢
        models.push(google("gemini-3.6-flash"));      // Gemini 3.6 Flash — 20 RPD (fallback only)
        models.push(google("gemini-flash-latest"));   // Gemini 3.7 Flash — 20 RPD (last resort)
    }
    if (groq) {
        models.push(groq("llama-3.3-70b-versatile"));
        models.push(groq("llama-3.1-8b-instant"));
    }
    if (models.length === 0) {
        const g = createGoogleGenerativeAI({ apiKey: "" });
        models.push(g("gemini-3.5-flash-lite"));
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

