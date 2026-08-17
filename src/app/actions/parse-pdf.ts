"use server";

import { PDFParse } from "pdf-parse";

// Polyfill for Node.js environments where pdf-parse needs DOMMatrix / Path2D
const globalWithPdfPolyfills = globalThis as Record<string, unknown>;

if (typeof globalWithPdfPolyfills.DOMMatrix === "undefined") {
    globalWithPdfPolyfills.DOMMatrix = class { };
}
if (typeof globalWithPdfPolyfills.Path2D === "undefined") {
    globalWithPdfPolyfills.Path2D = class { };
}

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

        // Convert Next.js File / Blob to Node.js Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Parse the PDF text using pdf-parse v2 API
        const parser = new PDFParse({ data: buffer });
        const data = await parser.getText();
        await parser.destroy();

        if (!data.text || data.text.trim().length < 20) {
            return {
                success: false,
                error: "We couldn't read text from this PDF. If it's a scanned image, please paste the syllabus text instead.",
            };
        }

        return {
            success: true,
            text: data.text,
            pages: data.total
        };
    } catch (error: unknown) {
        console.error("PDF Parsing Failed:", error);
        return {
            success: false,
            error: "Could not extract text from this PDF. Please paste the syllabus text instead."
        };
    }
}

