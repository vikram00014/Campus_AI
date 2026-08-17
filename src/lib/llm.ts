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

function getAvailableModels() {
    const models = [];
    const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    if (geminiKey) {
        const googleClient = createGoogleGenerativeAI({ apiKey: geminiKey });
        models.push(googleClient("gemini-flash-latest"));
        models.push(googleClient("gemini-3.6-flash"));
        models.push(googleClient("gemini-3.5-flash"));
    }
    if (groqKey) {
        const groqClient = createGroq({ apiKey: groqKey });
        models.push(groqClient("openai/gpt-oss-120b"));
        models.push(groqClient("openai/gpt-oss-20b"));
    }
    if (models.length === 0) {
        const defaultGoogle = createGoogleGenerativeAI({ apiKey: geminiKey || "" });
        models.push(defaultGoogle("gemini-flash-latest"));
    }
    return models;
}

export async function generateText(options: {
    prompt: string;
    system?: string;
    maxTokens?: number;
    effort?: LlmEffort;
}): Promise<string> {
    const models = getAvailableModels();

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
    const models = getAvailableModels();

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

