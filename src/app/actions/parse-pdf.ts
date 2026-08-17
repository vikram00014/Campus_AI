"use server";

import { extractText } from "unpdf";

const MAX_PDF_BYTES = 10 * 1024 * 1024;

/**
 * Parses the raw text out of an uploaded Syllabus PDF buffer.
 */
export async function extractTextFromPDF(formData: FormData) {
    try {
        const file = formData.get("file") as File;
        if (!file) {
            return { success: false, error: "No file uploaded." };
        }
        if (file.type !== "application/pdf") {
            return { success: false, error: "That file isn't a PDF. Upload a PDF syllabus or paste the text instead." };
        }
        if (file.size > MAX_PDF_BYTES) {
            return { success: false, error: "That PDF is larger than 10 MB. Try a smaller file or paste the syllabus text." };
        }

        // Convert Next.js File / Blob to Uint8Array for unpdf
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        const { text, totalPages } = await extractText(uint8Array, { mergePages: true });
        const fullText = Array.isArray(text) ? text.join("\n") : String(text || "");

        if (!fullText || fullText.trim().length < 20) {
            return {
                success: false,
                error: "We couldn't read text from this PDF. If it's a scanned image, please paste the syllabus text instead.",
            };
        }

        return {
            success: true,
            text: fullText,
            pages: totalPages || 1,
        };
    } catch (error: unknown) {
        console.error("PDF Parsing Failed:", error);
        return {
            success: false,
            error: "Could not extract text from this PDF. Please paste the syllabus text instead.",
        };
    }
}

