import "server-only";

import { generateObject, generateText as generateAiText, jsonSchema } from "ai";
import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";

export type LlmEffort = "low" | "medium" | "high";

export class LlmError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "LlmError";
    }
}

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === "string") {
        return error;
    }
    return "LLM request failed.";
}

export function isLlmConfigured(): boolean {
    return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY) || Boolean(process.env.GROQ_API_KEY);
}

function getAvailableModels() {
    const models = [];
    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        models.push(google("gemini-3.7-flash"));
        models.push(google("gemini-3.6-flash"));
        models.push(google("gemini-flash-latest"));
    }
    if (process.env.GROQ_API_KEY) {
        models.push(groq("qwen/qwen3.6-27b"));
    }
    if (models.length === 0) {
        models.push(google("gemini-3.7-flash"));
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

