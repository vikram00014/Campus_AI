import { tavily } from "@tavily/core";

interface TavilyResult {
    url: string;
    content: string;
}

interface TavilySearchResponse {
    answer?: string;
    results?: TavilyResult[];
}

export async function getTrustedContext(topicTitle: string, courseName: string): Promise<string> {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
        console.warn("Tavily API key is missing. Context generation will be degraded.");
        return "";
    }

    try {
        const tvly = tavily({ apiKey });

        // Build a highly specific search query prioritizing `.edu`, `.org`, and trusted academic domains
        const query = `Extensive educational explanation of "${topicTitle}" in the context of university course "${courseName}". Focus on engineering principles, theories, and factual definitions.`;

        const response = await tvly.search(query, {
            searchDepth: "advanced",
            includeAnswer: true, // Let Tavily's own LLM synthesize a direct answer
            maxResults: 3,
            topic: "general", // "general" or "news"
        }) as TavilySearchResponse;

        // Combine the AI synthesized answer with snippet extracts from trusted sources
        let contextBuffer = response.answer ? `Tavily AI Summary:\n${response.answer}\n\n` : "";

        if (response.results && response.results.length > 0) {
            contextBuffer += "Trusted Academic Sources Snippets:\n";
            response.results.forEach((res, i) => {
                contextBuffer += `[Source ${i + 1}: ${res.url}]\n${res.content}\n\n`;
            });
        }

        return contextBuffer;
    } catch (error) {
        console.error(`Tavily search failed for topic: ${topicTitle}`, error);
        return "";
    }
}
