export interface YouTubeVideo {
    videoId: string;
    id: string;
    title: string;
    channelTitle: string;
    thumbnail: string;
    url: string;
}

interface YouTubeSearchResponse {
    items?: Array<{
        id?: {
            videoId?: string;
        };
        snippet?: {
            title?: string;
            channelTitle?: string;
            thumbnails?: {
                medium?: {
                    url?: string;
                };
                default?: {
                    url?: string;
                };
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
 * YouTube integration service to find the most relevant top-educator videos.
 */
export async function searchYouTubeVideos(
    topicTitle: string,
    courseName: string,
    maxResults = 3
): Promise<YouTubeVideo[]> {
    const youtubeApiKey = process.env.YOUTUBE_API_KEY;

    if (!youtubeApiKey) {
        return [buildSearchStub(topicTitle, courseName)];
    }

    const query = encodeURIComponent(`${courseName} ${topicTitle} lecture tutorial`);

    try {
        const res = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=${maxResults}&q=${query}&type=video&key=${youtubeApiKey}&videoDuration=medium&relevanceLanguage=en`
        );

        if (!res.ok) {
            const errBody = await res.text().catch(() => "");
            console.error(`YouTube API error ${res.status}:`, errBody);
            throw new Error(`YouTube API returned ${res.status}: ${errBody.slice(0, 300)}`);
        }

        const data = (await res.json()) as YouTubeSearchResponse;
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
    } catch (error) {
        console.error("Failed to fetch from YouTube:", error);
        return [buildSearchStub(topicTitle, courseName)];
    }
}

/**
 * Builds a fallback "search stub" video when the YouTube API is unavailable or
 * quota-exhausted. The stub has no videoId (so no iframe is shown) but carries
 * a direct YouTube search URL the player can surface as a button.
 */
function buildSearchStub(topicTitle: string, courseName: string): YouTubeVideo {
    const query = encodeURIComponent(`${courseName} ${topicTitle} lecture tutorial`);
    return {
        videoId: "",   // empty = player knows this is a search stub, not an embed
        id: `search-${topicTitle}`,
        title: `Find videos: ${topicTitle}`,
        channelTitle: "YouTube Search",
        thumbnail: "",
        url: `https://www.youtube.com/results?search_query=${query}`,
    };
}

