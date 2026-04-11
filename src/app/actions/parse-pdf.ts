"use server";

import path from "node:path";
import { pathToFileURL } from "node:url";
import { PDFParse } from "pdf-parse";

// Polyfill for Node.js environments where pdf-parse (pdfjs-dist) fails
// We run this immediately on module load.
const globalWithPdfPolyfills = globalThis as Record<string, unknown>;

if (typeof globalWithPdfPolyfills.DOMMatrix === "undefined") {
    globalWithPdfPolyfills.DOMMatrix = class { };
}
if (typeof globalWithPdfPolyfills.Path2D === "undefined") {
    globalWithPdfPolyfills.Path2D = class { };
}

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return "Unknown error";
}

function configurePdfWorker() {
    const workerPath = path.join(
        process.cwd(),
        "node_modules",
        "pdfjs-dist",
        "legacy",
        "build",
        "pdf.worker.mjs"
    );
    const workerFileUrl = pathToFileURL(workerPath).toString();
    PDFParse.setWorker(workerFileUrl);
}

/**
 * Parses the raw text out of an uploaded Syllabus PDF buffer.
 */
export async function extractTextFromPDF(formData: FormData) {
    try {
        const file = formData.get("file") as File;
        if (!file) {
            throw new Error("No file uploaded");
        }

        // Convert Next.js File / Blob to Node.js Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Next.js dev SSR can resolve worker path incorrectly unless we pin it.
        configurePdfWorker();

        // Parse the PDF text using pdf-parse v2 API.
        const parser = new PDFParse({ data: buffer });
        const data = await parser.getText();
        await parser.destroy();

        return {
            success: true,
            text: data.text,
            pages: data.total
        };
    } catch (error: unknown) {
        console.error("PDF Parsing Failed:", error);
        return {
            success: false,
            error: `Could not read the PDF properly. Please ensure it is a valid text-based PDF. (${getErrorMessage(error)})`
        };
    }
}
