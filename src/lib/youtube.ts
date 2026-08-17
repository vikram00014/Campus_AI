export interface YouTubeVideo {
    videoId: string;
    id: string;
    title: string;
    channelTitle: string;
    thumbnail: string;
    url: string;
}

interface YouTubeSearchApiResponse {
    items?: Array<{
        id?: {
            videoId?: string;
        };
        snippet?: {
            title?: string;
            channelTitle?: string;
            thumbnails?: {
                medium?: { url?: string };
                default?: { url?: string };
            };
        };
    }>;
}

function decodeHtmlEntities(raw: string): string {
    return raw
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)));
}

/**
 * Searches YouTube using official Data API v3 when a key is available.
 */
async function searchViaOfficialApi(
    query: string,
    apiKey: string,
    maxResults: number,
    topicTitle: string,
    courseName: string
): Promise<YouTubeVideo[]> {
    const encodedQuery = encodeURIComponent(query);
    const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=${maxResults}&q=${encodedQuery}&type=video&key=${apiKey}&videoDuration=medium&relevanceLanguage=en`,
        { next: { revalidate: 86400 } }
    );

    if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        throw new Error(`YouTube API returned ${res.status}: ${errBody.slice(0, 200)}`);
    }

    const data = (await res.json()) as YouTubeSearchApiResponse;
    const rawItems = Array.isArray(data.items) ? data.items : [];

    return rawItems
        .filter((item): item is typeof item & { id: { videoId: string }; snippet: { title: string } } =>
            Boolean(item?.id?.videoId && item?.snippet?.title)
        )
        .map((item) => {
            const videoId = item.id.videoId;
            const rawTitle = item.snippet?.title || `${topicTitle} - ${courseName}`;
            const title = decodeHtmlEntities(rawTitle);
            const rawChannel = item.snippet?.channelTitle || "Educator";
            const channelTitle = decodeHtmlEntities(rawChannel);
            const thumbnail =
                item.snippet?.thumbnails?.medium?.url ||
                item.snippet?.thumbnails?.default?.url ||
                `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

            return {
                videoId,
                id: videoId,
                title,
                channelTitle,
                thumbnail,
                url: `https://www.youtube.com/watch?v=${videoId}`,
            };
        });
}

/**
 * Searches YouTube directly without requiring any API key or consuming quota.
 * Parses public search results to extract real, top-ranking tutorial videos.
 */
async function searchViaPublicWeb(
    query: string,
    maxResults: number,
    topicTitle: string
): Promise<YouTubeVideo[]> {
    const encodedQuery = encodeURIComponent(query);
    const res = await fetch(`https://www.youtube.com/results?search_query=${encodedQuery}`, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
        },
        next: { revalidate: 86400 },
    });

    if (!res.ok) {
        throw new Error(`YouTube public search returned ${res.status}`);
    }

    const html = await res.text();

    // 1. Try to extract structured ytInitialData from page script
    const match = html.match(/var ytInitialData = ({[\s\S]*?});<\/script>/) || html.match(/ytInitialData = ({[\s\S]*?});/);
    if (match) {
        try {
            const json = JSON.parse(match[1]) as {
                contents?: {
                    twoColumnSearchResultsRenderer?: {
                        primaryContents?: {
                            sectionListRenderer?: {
                                contents?: Array<{
                                    itemSectionRenderer?: {
                                        contents?: Array<{
                                            videoRenderer?: {
                                                videoId?: string;
                                                title?: { runs?: Array<{ text?: string }> };
                                                ownerText?: { runs?: Array<{ text?: string }> };
                                            };
                                        }>;
                                    };
                                }>;
                            };
                        };
                    };
                };
            };

            const sections = json.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
            const videos: YouTubeVideo[] = [];

            for (const section of sections) {
                const items = section.itemSectionRenderer?.contents || [];
                for (const item of items) {
                    const vr = item.videoRenderer;
                    if (vr?.videoId) {
                        const videoId = vr.videoId;
                        const title = vr.title?.runs?.[0]?.text || topicTitle;
                        const channelTitle = vr.ownerText?.runs?.[0]?.text || "Top Educator";
                        videos.push({
                            videoId,
                            id: videoId,
                            title: decodeHtmlEntities(title),
                            channelTitle: decodeHtmlEntities(channelTitle),
                            thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
                            url: `https://www.youtube.com/watch?v=${videoId}`,
                        });
                        if (videos.length >= maxResults) break;
                    }
                }
                if (videos.length >= maxResults) break;
            }

            if (videos.length > 0) {
                return videos;
            }
        } catch {
            // Fall through to regex extraction
        }
    }

    // 2. Fallback: regex scan for video IDs in the raw HTML
    const idMatches = [...html.matchAll(/\/watch\?v=([a-zA-Z0-9_-]{11})/g)].map((m) => m[1]);
    const uniqueIds = [...new Set(idMatches)].filter((id) => id.length === 11);

    if (uniqueIds.length > 0) {
        return uniqueIds.slice(0, maxResults).map((videoId, idx) => ({
            videoId,
            id: videoId,
            title: `${topicTitle} - Part ${idx + 1}`,
            channelTitle: "University Lecture",
            thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
            url: `https://www.youtube.com/watch?v=${videoId}`,
        }));
    }

    throw new Error("No video IDs found in public search response.");
}

/**
 * Builds a fallback "search stub" video when network is offline.
 */
function buildSearchStub(topicTitle: string, courseName: string): YouTubeVideo {
    const query = encodeURIComponent(`${courseName} ${topicTitle} lecture tutorial`);
    return {
        videoId: "",
        id: `search-${topicTitle}`,
        title: `Find videos: ${topicTitle}`,
        channelTitle: "YouTube Search",
        thumbnail: "",
        url: `https://www.youtube.com/results?search_query=${query}`,
    };
}

/**
 * Primary YouTube search service.
 * 1. Uses official API if key provided.
 * 2. Seamlessly falls back to direct public YouTube search (no key needed, no quota).
 * 3. Falls back to YouTube search stub if offline.
 */
export async function searchYouTubeVideos(
    topicTitle: string,
    courseName: string,
    maxResults = 3
): Promise<YouTubeVideo[]> {
    const searchQuery = `${courseName} ${topicTitle} lecture tutorial`;
    const youtubeApiKey = process.env.YOUTUBE_API_KEY;

    // 1. Try official API first if key exists
    if (youtubeApiKey) {
        try {
            const apiResults = await searchViaOfficialApi(searchQuery, youtubeApiKey, maxResults, topicTitle, courseName);
            if (apiResults.length > 0) {
                return apiResults;
            }
        } catch (apiError) {
            console.warn("YouTube API failed or exhausted, falling back to direct search:", apiError);
        }
    }

    // 2. Direct public YouTube search (works with 0 keys, 0 quota limitations)
    try {
        const publicResults = await searchViaPublicWeb(searchQuery, maxResults, topicTitle);
        if (publicResults.length > 0) {
            return publicResults;
        }
    } catch (webError) {
        console.error("YouTube public web search failed:", webError);
    }

    // 3. Fallback stub with direct search query link
    return [buildSearchStub(topicTitle, courseName)];
}
