export interface YouTubeVideo {
    videoId: string;
    id: string;
    title: string;
    channelTitle: string;
    thumbnail: string;
    url: string;
}

interface YouTubeSearchResponse {
    items: Array<{
        id: {
            videoId: string;
        };
        snippet: {
            title: string;
            channelTitle: string;
            thumbnails: {
                medium: {
                    url: string;
                };
            };
        };
    }>;
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
        console.warn("YOUTUBE_API_KEY is not set. Returning mock videos.");
        return [
            {
                videoId: "mock1",
                id: "mock1",
                title: `${topicTitle} Explained | ${courseName}`,
                channelTitle: "Mock Educator Channel",
                thumbnail: "https://via.placeholder.com/320x180",
                url: "https://www.youtube.com/watch?v=mock1",
            },
        ];
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

        return data.items.map((item) => ({
            videoId: item.id.videoId,
            id: item.id.videoId,
            title: item.snippet.title,
            channelTitle: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails.medium.url,
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        }));
    } catch (error) {
        console.error("Failed to fetch from YouTube:", error);
        return [];
    }
}
