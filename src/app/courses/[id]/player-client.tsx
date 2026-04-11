"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    CheckCircle2,
    Lock,
    PlayCircle,
    FileText,
    CheckSquare,
    ChevronRight,
    Check,
    Loader2,
    ArrowLeft,
    ArrowRight,
    Timer,
    Zap,
    Brain,
    MessageCircle,
    X,
    Send,
    Menu,
    Keyboard,
    GraduationCap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
    markTopicAsComplete,
    generatePracticeQuestions,
    generateTopicNotesOnDemand,
    fetchTopicVideosOnDemand,
    updateTopicProgress,
    type CourseModule,
    type CoursePlayerData,
    type CourseTopic,
    type PracticeQuestion,
} from "@/app/actions/player";
import { askTopicQuestion } from "@/app/actions/ai-chat";

interface PlayerProps {
    courseData: CoursePlayerData;
}

interface PlaylistVideo {
    videoId: string;
    title?: string;
    url?: string;
}

interface TopicPointer {
    moduleId: string;
    topicId: string;
}

type TopicTab = "watch" | "read" | "practice";
type VideoDepth = "short" | "medium" | "full";
type PracticeDifficulty = "easy" | "medium" | "hard";

const LAST_TOPIC_KEY_PREFIX = "campus-ai-last-topic-";
const DEFAULT_MOCK_SECONDS = 10 * 60;

function parseJsonSafe(value: string): unknown {
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}

function asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== "object") {
        return null;
    }
    return value as Record<string, unknown>;
}

function asString(value: unknown): string | undefined {
    return typeof value === "string" ? value : undefined;
}

function extractYouTubeVideoId(raw?: string): string | undefined {
    if (!raw) {
        return undefined;
    }

    const cleaned = raw.trim();
    const idPattern = /^[a-zA-Z0-9_-]{11}$/;
    if (idPattern.test(cleaned)) {
        return cleaned;
    }

    try {
        const url = new URL(cleaned);
        const v = url.searchParams.get("v");
        if (v && idPattern.test(v)) {
            return v;
        }

        const pathParts = url.pathname.split("/").filter(Boolean);
        const lastPart = pathParts[pathParts.length - 1];
        if (lastPart && idPattern.test(lastPart)) {
            return lastPart;
        }
    } catch {
        return undefined;
    }

    return undefined;
}

function normalizeRawPlaylist(topic?: CourseTopic): unknown[] {
    if (!topic) {
        return [];
    }

    const raw = topic.video_playlist_json;
    if (Array.isArray(raw)) {
        return raw;
    }

    if (typeof raw === "string") {
        const parsed = parseJsonSafe(raw);
        if (Array.isArray(parsed)) {
            return parsed;
        }
        if (parsed) {
            return [parsed];
        }
        return [];
    }

    if (raw && typeof raw === "object") {
        return [raw];
    }

    return [];
}

function normalizePlaylistItem(item: unknown): PlaylistVideo | null {
    const record = asRecord(item);
    if (!record) {
        return null;
    }

    const rawVideoId = asString(record.videoId) || asString(record.id) || extractYouTubeVideoId(asString(record.url));
    const videoId = extractYouTubeVideoId(rawVideoId);
    if (!videoId) {
        return null;
    }

    return {
        videoId,
        title: asString(record.title),
        url: asString(record.url),
    };
}

function getTopicVideos(topic?: CourseTopic): PlaylistVideo[] {
    const normalized = normalizeRawPlaylist(topic)
        .map(normalizePlaylistItem)
        .filter((item): item is PlaylistVideo => item !== null);

    const deduped = new Map<string, PlaylistVideo>();
    normalized.forEach((video) => {
        if (!deduped.has(video.videoId)) {
            deduped.set(video.videoId, video);
        }
    });

    return Array.from(deduped.values());
}

function getPreferredTab(topic?: CourseTopic): TopicTab {
    const hasVideos = getTopicVideos(topic).length > 0;
    if (hasVideos) {
        return "watch";
    }
    if (topic?.notes) {
        return "read";
    }
    return "practice";
}

function getDepthVideoIndex(depth: VideoDepth, count: number): number {
    if (count <= 0) {
        return -1;
    }
    if (depth === "short") {
        return 0;
    }
    if (depth === "medium") {
        return Math.min(1, count - 1);
    }
    return count - 1;
}

function formatTimer(totalSeconds: number): string {
    const clamped = Math.max(0, totalSeconds);
    const minutes = Math.floor(clamped / 60).toString().padStart(2, "0");
    const seconds = (clamped % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
}

export default function CoursePlayerClient({ courseData }: PlayerProps) {
    const initialModule =
        courseData.modules.find((module) => module.status === "in_progress" || module.status === "completed") ||
        courseData.modules[0];
    const initialTopic = initialModule?.topics[0];

    const [courseState, setCourseState] = useState<CoursePlayerData>(courseData);
    const [activeModule, setActiveModule] = useState<CourseModule | undefined>(initialModule);
    const [activeTopic, setActiveTopic] = useState<CourseTopic | undefined>(initialTopic);
    const [activeTab, setActiveTab] = useState<TopicTab>(getPreferredTab(initialTopic));
    const [isCompleting, setIsCompleting] = useState(false);
    const [isSyncingProgress, setIsSyncingProgress] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const [isGeneratingPractice, setIsGeneratingPractice] = useState(false);
    const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
    const [isFetchingVideos, setIsFetchingVideos] = useState(false);
    const [practiceError, setPracticeError] = useState<string | null>(null);
    const [notesError, setNotesError] = useState<string | null>(null);
    const [videosError, setVideosError] = useState<string | null>(null);
    const [practiceByTopic, setPracticeByTopic] = useState<Record<string, PracticeQuestion[]>>({});
    const [videoDepth, setVideoDepth] = useState<VideoDepth>("medium");
    const [manualVideoIndex, setManualVideoIndex] = useState<number | null>(null);
    const [practiceDifficulty, setPracticeDifficulty] = useState<PracticeDifficulty>("medium");
    const [isMockStarted, setIsMockStarted] = useState(false);
    const [isMockSubmitted, setIsMockSubmitted] = useState(false);
    const [mockSecondsLeft, setMockSecondsLeft] = useState(DEFAULT_MOCK_SECONDS);
    const [mockAnswers, setMockAnswers] = useState<Record<number, string>>({});
    const topicButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
    const hasRestoredTopicRef = useRef(false);

    // AI Chat overlay state
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatQuestion, setChatQuestion] = useState("");
    const [isChatLoading, setIsChatLoading] = useState(false);
    const chatInputRef = useRef<HTMLInputElement>(null);
    const chatEndRef   = useRef<HTMLDivElement>(null);
    interface ChatMessage { id: string; role: "user" | "ai"; content: string; }
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

    // Mobile sidebar state
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Keyboard shortcuts modal
    const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

    const lastTopicKey = `${LAST_TOPIC_KEY_PREFIX}${courseState.id}`;

    useEffect(() => {
        setActiveTab(getPreferredTab(activeTopic));
    }, [activeTopic]);

    useEffect(() => {
        setPracticeError(null);
        setNotesError(null);
        setVideosError(null);
        setManualVideoIndex(null);
        setIsMockStarted(false);
        setIsMockSubmitted(false);
        setMockSecondsLeft(DEFAULT_MOCK_SECONDS);
        setMockAnswers({});
    }, [activeTopic?.id]);

    const moduleMap = useMemo(
        () => new Map(courseState.modules.map((module) => [module.id, module])),
        [courseState.modules]
    );

    const topicPointers = useMemo<TopicPointer[]>(() => {
        return courseState.modules
            .filter((module) => module.status !== "locked")
            .flatMap((module) =>
                module.topics.map((topic) => ({
                    moduleId: module.id,
                    topicId: topic.id,
                }))
            );
    }, [courseState.modules]);

    const currentTopicIndex = useMemo(() => {
        if (!activeTopic) {
            return -1;
        }
        return topicPointers.findIndex((pointer) => pointer.topicId === activeTopic.id);
    }, [activeTopic, topicPointers]);

    const canGoPrev = currentTopicIndex > 0;
    const canGoNext = currentTopicIndex >= 0 && currentTopicIndex < topicPointers.length - 1;

    const moveToPointer = useCallback((targetIndex: number) => {
        const pointer = topicPointers[targetIndex];
        if (!pointer) {
            return;
        }

        const nextModule = moduleMap.get(pointer.moduleId);
        const nextTopic = nextModule?.topics.find((topic) => topic.id === pointer.topicId);
        if (!nextModule || !nextTopic) {
            return;
        }

        setActiveModule(nextModule);
        setActiveTopic(nextTopic);
    }, [moduleMap, topicPointers]);

    const handlePreviousTopic = useCallback(() => {
        if (!canGoPrev) {
            return;
        }
        moveToPointer(currentTopicIndex - 1);
    }, [canGoPrev, currentTopicIndex, moveToPointer]);

    const handleNextTopic = useCallback(() => {
        if (!canGoNext) {
            return;
        }
        moveToPointer(currentTopicIndex + 1);
    }, [canGoNext, currentTopicIndex, moveToPointer]);

    useEffect(() => {
        if (typeof window === "undefined" || hasRestoredTopicRef.current) {
            return;
        }
        hasRestoredTopicRef.current = true;

        const rawSaved = window.localStorage.getItem(lastTopicKey);
        if (!rawSaved) {
            return;
        }

        try {
            const parsed = JSON.parse(rawSaved) as { moduleId?: string; topicId?: string };
            const savedModule = parsed.moduleId ? moduleMap.get(parsed.moduleId) : undefined;
            const fallbackModule = courseState.modules.find((module) =>
                module.topics.some((topic) => topic.id === parsed.topicId)
            );
            const moduleToUse = savedModule || fallbackModule;
            const topicToUse = moduleToUse?.topics.find((topic) => topic.id === parsed.topicId);
            if (moduleToUse && topicToUse && moduleToUse.status !== "locked") {
                setActiveModule(moduleToUse);
                setActiveTopic(topicToUse);
            }
        } catch {
            window.localStorage.removeItem(lastTopicKey);
        }
    }, [courseState.modules, lastTopicKey, moduleMap]);

    useEffect(() => {
        if (typeof window === "undefined" || !activeModule || !activeTopic) {
            return;
        }
        window.localStorage.setItem(
            lastTopicKey,
            JSON.stringify({
                moduleId: activeModule.id,
                topicId: activeTopic.id,
                savedAt: Date.now(),
            })
        );
    }, [activeModule, activeTopic, lastTopicKey]);

    useEffect(() => {
        if (!activeTopic) {
            return;
        }
        const node = topicButtonRefs.current[activeTopic.id];
        if (node) {
            node.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
    }, [activeTopic]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.defaultPrevented) {
                return;
            }
            const target = event.target as HTMLElement | null;
            const tag = target?.tagName;
            const isTypingElement =
                tag === "INPUT" ||
                tag === "TEXTAREA" ||
                tag === "SELECT" ||
                Boolean(target?.isContentEditable);
            if (isTypingElement) {
                return;
            }

            if (event.key === "ArrowLeft") {
                event.preventDefault();
                handlePreviousTopic();
            }
            if (event.key === "ArrowRight") {
                event.preventDefault();
                handleNextTopic();
            }
            if (event.key === "?") {
                event.preventDefault();
                setIsShortcutsOpen(true);
            }
            if (event.key === "Escape") {
                setIsShortcutsOpen(false);
                setIsChatOpen(false);
                setIsSidebarOpen(false);
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [handleNextTopic, handlePreviousTopic]);

    useEffect(() => {
        if (!isMockStarted || isMockSubmitted) {
            return;
        }
        if (mockSecondsLeft <= 0) {
            setIsMockStarted(false);
            setIsMockSubmitted(true);
            return;
        }

        const timer = window.setInterval(() => {
            setMockSecondsLeft((prev) => Math.max(0, prev - 1));
        }, 1000);
        return () => window.clearInterval(timer);
    }, [isMockStarted, isMockSubmitted, mockSecondsLeft]);

    const activeTopicVideos = useMemo(() => getTopicVideos(activeTopic), [activeTopic]);
    const depthVideoIndex = useMemo(
        () => getDepthVideoIndex(videoDepth, activeTopicVideos.length),
        [videoDepth, activeTopicVideos.length]
    );
    const selectedVideoIndex = manualVideoIndex ?? depthVideoIndex;
    const primaryVideo = selectedVideoIndex >= 0 ? activeTopicVideos[selectedVideoIndex] : undefined;
    const primaryVideoId = primaryVideo?.videoId;
    const hasNextVideo = selectedVideoIndex >= 0 && selectedVideoIndex < activeTopicVideos.length - 1;
    const hasPrevVideo = selectedVideoIndex > 0;
    const activePracticeQuestions = useMemo(
        () => (activeTopic ? (practiceByTopic[activeTopic.id] || []) : []),
        [activeTopic, practiceByTopic]
    );

    const mockScore = useMemo(() => {
        return activePracticeQuestions.reduce((score, question, index) => {
            return score + (mockAnswers[index] === question.answer ? 1 : 0);
        }, 0);
    }, [activePracticeQuestions, mockAnswers]);
    const mockPercent = activePracticeQuestions.length
        ? Math.round((mockScore / activePracticeQuestions.length) * 100)
        : 0;

    const applyProgressResult = useCallback((
        modules: CourseModule[],
        completionPercentage: number,
        options?: { keepCurrentTopic?: boolean; jumpToNextIncomplete?: boolean }
    ) => {
        setCourseState((prev) => ({
            ...prev,
            completion_percentage: completionPercentage,
            modules,
        }));

        let nextModule =
            modules.find((module) => module.id === activeModule?.id) ||
            modules.find((module) => module.status === "in_progress") ||
            modules[0];

        let nextTopic = options?.keepCurrentTopic
            ? nextModule?.topics.find((topic) => topic.id === activeTopic?.id)
            : undefined;

        if (!nextTopic && options?.jumpToNextIncomplete) {
            const firstIncompleteUnlocked = modules
                .filter((module) => module.status !== "locked")
                .flatMap((module) => module.topics.map((topic) => ({ module, topic })))
                .find(({ topic }) => !topic.isCompleted);
            if (firstIncompleteUnlocked) {
                nextModule = firstIncompleteUnlocked.module;
                nextTopic = firstIncompleteUnlocked.topic;
            }
        }

        if (!nextTopic) {
            nextTopic =
                nextModule?.topics.find((topic) => topic.id === activeTopic?.id) ||
                nextModule?.topics.find((topic) => !topic.isCompleted) ||
                nextModule?.topics[0];
        }

        setActiveModule(nextModule);
        setActiveTopic(nextTopic);
    }, [activeModule?.id, activeTopic?.id]);

    const syncTopicProgress = useCallback(async (updates: {
        notesCompleted?: boolean;
        practiceCompleted?: boolean;
        videoProgress?: number;
    }) => {
        if (!activeTopic || isSyncingProgress) {
            return;
        }

        setActionError(null);
        setIsSyncingProgress(true);
        const result = await updateTopicProgress(courseState.id, activeTopic.id, updates);
        setIsSyncingProgress(false);

        if (!result.success) {
            setActionError(result.error);
            return;
        }

        applyProgressResult(result.modules, result.completionPercentage, { keepCurrentTopic: true });
    }, [activeTopic, applyProgressResult, courseState.id, isSyncingProgress]);

    const handleMarkComplete = async () => {
        if (!activeTopic || activeTopic.isCompleted || isCompleting) {
            return;
        }

        setActionError(null);
        setIsCompleting(true);
        const result = await markTopicAsComplete(courseState.id, activeTopic.id);
        setIsCompleting(false);

        if (!result.success) {
            setActionError(result.error);
            return;
        }

        applyProgressResult(result.modules, result.completionPercentage, { jumpToNextIncomplete: true });
    };

    const handleGeneratePractice = async () => {
        if (!activeTopic || isGeneratingPractice) {
            return;
        }

        setPracticeError(null);
        setIsGeneratingPractice(true);
        const result = await generatePracticeQuestions(courseState.id, activeTopic.id, practiceDifficulty);
        setIsGeneratingPractice(false);

        if (!result.success) {
            setPracticeError(result.error);
            return;
        }

        setPracticeByTopic((prev) => ({
            ...prev,
            [activeTopic.id]: result.questions,
        }));
        setIsMockStarted(false);
        setIsMockSubmitted(false);
        setMockSecondsLeft(DEFAULT_MOCK_SECONDS);
        setMockAnswers({});
    };

    const handleFetchVideos = async () => {
        if (!activeTopic || isFetchingVideos) {
            return;
        }

        setVideosError(null);
        setIsFetchingVideos(true);
        const result = await fetchTopicVideosOnDemand(courseState.id, activeTopic.id);
        setIsFetchingVideos(false);

        if (!result.success) {
            setVideosError(result.error);
            return;
        }

        if (result.videos.length === 0) {
            setVideosError("No YouTube videos found for this topic.");
            return;
        }

        setCourseState((prev) => ({
            ...prev,
            modules: prev.modules.map((mod) => ({
                ...mod,
                topics: mod.topics.map((topic) =>
                    topic.id === activeTopic.id
                        ? { ...topic, video_playlist_json: result.videos }
                        : topic
                ),
            })),
        }));
        setActiveTopic((prev) =>
            prev ? { ...prev, video_playlist_json: result.videos } : prev
        );
    };

    const handleGenerateNotes = async () => {
        if (!activeTopic || isGeneratingNotes) {
            return;
        }

        setNotesError(null);
        setIsGeneratingNotes(true);
        const result = await generateTopicNotesOnDemand(courseState.id, activeTopic.id);
        setIsGeneratingNotes(false);

        if (!result.success) {
            setNotesError(result.error);
            return;
        }

        setCourseState((prev) => ({
            ...prev,
            modules: prev.modules.map((module) => ({
                ...module,
                topics: module.topics.map((topic) =>
                    topic.id === activeTopic.id ? { ...topic, notes: result.notes } : topic
                ),
            })),
        }));
        setActiveTopic((prev) => (prev ? { ...prev, notes: result.notes } : prev));
        setActiveTab("read");
    };

    const handleSubmitMock = async () => {
        setIsMockStarted(false);
        setIsMockSubmitted(true);
        if (!activeTopic?.practiceCompleted) {
            await syncTopicProgress({ practiceCompleted: true });
        }
    };

    const handleStartMock = () => {
        if (activePracticeQuestions.length === 0) {
            return;
        }
        setIsMockStarted(true);
        setIsMockSubmitted(false);
        setMockSecondsLeft(DEFAULT_MOCK_SECONDS);
        setMockAnswers({});
    };

    const handleAskAI = async (overrideQuestion?: string) => {
        const q = (overrideQuestion ?? chatQuestion).trim();
        if (!activeTopic || !q || isChatLoading) return;
        const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", content: q };
        setChatMessages((prev) => [...prev, userMsg]);
        setChatQuestion("");
        setIsChatLoading(true);
        const result = await askTopicQuestion(courseState.id, activeTopic.id, q);
        setIsChatLoading(false);
        if (!result.success) {
            const errMsg: ChatMessage = { id: `e-${Date.now()}`, role: "ai", content: `❌ ${result.error}` };
            setChatMessages((prev) => [...prev, errMsg]);
        } else {
            const aiMsg: ChatMessage = { id: `a-${Date.now()}`, role: "ai", content: result.answer };
            setChatMessages((prev) => [...prev, aiMsg]);
        }
    };

    // Scroll to bottom of chat when messages update
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages, isChatLoading]);

    useEffect(() => {
        if (!activeTopic) return;
        setChatQuestion("");
        setChatMessages([]);
    }, [activeTopic]);

    useEffect(() => {
        if (isChatOpen) chatInputRef.current?.focus();
    }, [isChatOpen]);

    if (!courseState.modules.length) {
        return <div className="p-8 text-center text-muted-foreground">Course content is currently generating or unavailable.</div>;
    }

    // Sidebar content (reusable for desktop + mobile drawer)
    const SidebarContent = (
        <>
            <div className="p-4 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-2 mb-3">
                    <GraduationCap className="w-4 h-4 shrink-0" style={{ color: "#4cd7f6" }} />
                    <h2 className="font-bold text-base truncate" style={{ color: "#dee2f3" }} title={courseState.course_name}>{courseState.course_name}</h2>
                </div>
                <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div className="h-1.5 rounded-full progress-glow transition-all duration-500" style={{ width: `${courseState.completion_percentage}%` }} />
                    </div>
                    <span className="text-xs font-mono font-semibold" style={{ color: "#4cd7f6" }}>{courseState.completion_percentage}%</span>
                </div>
                <p className="text-xs" style={{ color: "#bcc9cd" }}>{courseState.modules.length} modules</p>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-3 space-y-3">
                    {courseState.modules.map((module, i) => {
                        const isModuleActive = activeModule?.id === module.id;
                        return (
                            <div key={module.id} className="space-y-1">
                                <button
                                    onClick={() => {
                                        if (module.status !== "locked") {
                                            setActiveModule(module);
                                            setIsSidebarOpen(false);
                                            if (activeTopic?.module_id !== module.id) {
                                                setActiveTopic(module.topics[0]);
                                            }
                                        }
                                    }}
                                    className="w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between transition-all duration-200"
                                    style={{
                                        background: isModuleActive ? "rgba(76,215,246,0.1)" : "transparent",
                                        border: isModuleActive ? "1px solid rgba(76,215,246,0.2)" : "1px solid transparent",
                                        color: isModuleActive ? "#4cd7f6" : "#bcc9cd",
                                        opacity: module.status === "locked" ? 0.5 : 1,
                                        cursor: module.status === "locked" ? "not-allowed" : "pointer",
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold"
                                            style={{
                                                background: module.status === "completed"
                                                    ? "linear-gradient(135deg,#acedff,#4cd7f6)"
                                                    : isModuleActive || module.status === "in_progress"
                                                        ? "rgba(76,215,246,0.12)"
                                                        : "rgba(255,255,255,0.06)",
                                                color: module.status === "completed" ? "#003640" : isModuleActive ? "#4cd7f6" : "#bcc9cd",
                                                border: (isModuleActive || module.status === "in_progress") && module.status !== "completed" ? "2px solid rgba(76,215,246,0.4)" : "2px solid transparent",
                                            }}
                                        >
                                            {module.status === "completed" ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className={`font-medium text-sm truncate max-w-[170px] ${
                                                module.status === "locked" ? "text-muted-foreground" : ""
                                            }`}>{module.title}</p>
                                            <p className="text-xs text-muted-foreground">{module.estimated_time || 0}m</p>
                                        </div>
                                    </div>
                                    {module.status === "locked" && <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                                </button>

                                {isModuleActive && module.status !== "locked" && (
                                <div className="ml-10 space-y-0.5 pl-2" style={{ borderLeft: "1px solid rgba(76,215,246,0.15)" }}>
                                        {module.topics.map((topic) => {
                                            const isTopicActive = activeTopic?.id === topic.id;
                                            const hasTopicVideos = getTopicVideos(topic).length > 0;
                                            return (
                                                <button
                                                    key={topic.id}
                                                    ref={(node) => { topicButtonRefs.current[topic.id] = node; }}
                                                    onClick={() => {
                                                        setActiveModule(module);
                                                        setActiveTopic(topic);
                                                        setIsSidebarOpen(false);
                                                    }}
                                                    className="w-full text-left px-2 py-1.5 rounded-lg text-sm flex items-center gap-2 transition-all duration-150"
                                                    style={{
                                                        background: isTopicActive ? "rgba(76,215,246,0.12)" : "transparent",
                                                        border: isTopicActive ? "1px solid rgba(76,215,246,0.2)" : "1px solid transparent",
                                                        color: isTopicActive ? "#dee2f3" : "#bcc9cd",
                                                        fontWeight: isTopicActive ? 600 : 400,
                                                    }}
                                                >
                                                    {topic.isCompleted
                                                        ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: "#34d399" }} />
                                                        : hasTopicVideos
                                                            ? <PlayCircle className="w-3.5 h-3.5 shrink-0" style={{ color: "rgba(76,215,246,0.6)" }} />
                                                            : topic.notes
                                                                ? <FileText className="w-3.5 h-3.5 shrink-0" style={{ color: "#bcc9cd" }} />
                                                                : <CheckSquare className="w-3.5 h-3.5 shrink-0" style={{ color: "#bcc9cd" }} />
                                                    }
                                                    <span className="truncate max-w-[150px]">{topic.title}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>
        </>
    );

    return (
        <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden relative">
            {/* Desktop Sidebar */}
            <div className="w-72 flex-col h-full hidden md:flex shrink-0" style={{ borderRight: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                {SidebarContent}
            </div>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
                            onClick={() => setIsSidebarOpen(false)}
                        />
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 28, stiffness: 300 }}
                            className="fixed top-16 left-0 bottom-0 z-50 w-72 bg-background/95 backdrop-blur-xl border-r border-white/10 flex flex-col md:hidden"
                        >
                            <div className="flex items-center justify-between p-3 border-b border-white/[0.08]">
                                <span className="text-sm font-semibold">Course Navigator</span>
                                <button onClick={() => setIsSidebarOpen(false)} className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            {SidebarContent}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: "#0e131f" }}>
                <header className="h-14 flex items-center px-3 md:px-5 justify-between shrink-0 gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="flex items-center gap-2 min-w-0">
                        {/* Mobile sidebar toggle */}
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl border border-white/10 hover:bg-white/[0.06] shrink-0"
                        >
                            <Menu className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-1.5 text-sm min-w-0" style={{ color: "#bcc9cd" }}>
                            <span className="truncate max-w-[120px] hidden sm:block">{activeModule?.title}</span>
                            <ChevronRight className="w-3.5 h-3.5 shrink-0 hidden sm:block" />
                            <span className="font-semibold truncate max-w-[180px] sm:max-w-xs" style={{ color: "#dee2f3" }}>{activeTopic?.title}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => setIsShortcutsOpen(true)}
                            className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
                            style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#bcc9cd" }}
                            title="Keyboard Shortcuts (?)"
                        >
                            <Keyboard className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={handleMarkComplete}
                            disabled={!activeTopic || activeTopic.isCompleted || isCompleting}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                            style={activeTopic?.isCompleted
                                ? { background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", color: "#34d399" }
                                : { background: "rgba(76,215,246,0.1)", border: "1px solid rgba(76,215,246,0.25)", color: "#4cd7f6" }
                            }
                        >
                            {isCompleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            {activeTopic?.isCompleted ? "Completed ✓" : "Mark Complete"}
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-6 md:p-8">
                    <div className="max-w-4xl mx-auto w-full">
                        {actionError ? (
                            <div className="mb-4 text-sm rounded-xl px-4 py-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                                {actionError}
                            </div>
                        ) : null}

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: "#dee2f3" }}>{activeTopic?.title}</h1>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={activeTopic?.videoProgress && activeTopic.videoProgress >= 90 ? { background: "rgba(16,185,129,0.12)", color: "#34d399", border: "1px solid rgba(16,185,129,0.25)" } : { background: "rgba(76,215,246,0.08)", color: "#4cd7f6", border: "1px solid rgba(76,215,246,0.2)" }}>
                                        Video {activeTopic?.videoProgress || 0}%
                                    </span>
                                    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={activeTopic?.notesCompleted ? { background: "rgba(16,185,129,0.12)", color: "#34d399", border: "1px solid rgba(16,185,129,0.25)" } : { background: "rgba(255,255,255,0.05)", color: "#bcc9cd", border: "1px solid rgba(255,255,255,0.08)" }}>
                                        Notes {activeTopic?.notesCompleted ? "✓ done" : "pending"}
                                    </span>
                                    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={activeTopic?.practiceCompleted ? { background: "rgba(16,185,129,0.12)", color: "#34d399", border: "1px solid rgba(16,185,129,0.25)" } : { background: "rgba(255,255,255,0.05)", color: "#bcc9cd", border: "1px solid rgba(255,255,255,0.08)" }}>
                                        Practice {activeTopic?.practiceCompleted ? "✓ done" : "pending"}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handlePreviousTopic}
                                    disabled={!canGoPrev}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
                                    style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#bcc9cd" }}
                                >
                                    <ArrowLeft className="w-4 h-4" /> Prev
                                </button>
                                <button
                                    onClick={handleNextTopic}
                                    disabled={!canGoNext}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
                                    style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#bcc9cd" }}
                                >
                                    Next <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TopicTab)} className="w-full">
                            <TabsList className="grid w-full grid-cols-3 mb-8">
                                <TabsTrigger value="watch"><PlayCircle className="w-4 h-4 mr-2" /> Watch</TabsTrigger>
                                <TabsTrigger value="read"><FileText className="w-4 h-4 mr-2" /> Read Notes</TabsTrigger>
                                <TabsTrigger value="practice"><CheckSquare className="w-4 h-4 mr-2" /> Practice</TabsTrigger>
                            </TabsList>

                            <TabsContent value="watch" className="mt-0 outline-none">
                                {primaryVideoId ? (
                                    <>
                                        <div className="mb-4 flex flex-wrap gap-2 items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#bcc9cd" }}>Depth:</label>
                                                <div className="flex rounded-xl overflow-hidden text-sm" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                                                    {(["short", "medium", "full"] as VideoDepth[]).map((d) => (
                                                        <button
                                                            key={d}
                                                            onClick={() => { setVideoDepth(d); setManualVideoIndex(null); }}
                                                            className="px-3 py-1.5 text-xs font-semibold capitalize transition-all"
                                                            style={videoDepth === d
                                                                ? { background: "rgba(76,215,246,0.15)", color: "#4cd7f6", borderLeft: "1px solid rgba(76,215,246,0.25)", borderRight: "1px solid rgba(76,215,246,0.25)" }
                                                                : { color: "#bcc9cd" }
                                                            }
                                                        >{d}</button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setManualVideoIndex((prev) => (prev === null ? depthVideoIndex : Math.max(0, prev - 1)))}
                                                    disabled={!hasPrevVideo}
                                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40"
                                                    style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#bcc9cd" }}
                                                >
                                                    <ArrowLeft className="w-3.5 h-3.5" /> Prev Video
                                                </button>
                                                <button
                                                    onClick={() => setManualVideoIndex((prev) => {
                                                        const current = prev ?? depthVideoIndex;
                                                        return Math.min(activeTopicVideos.length - 1, current + 1);
                                                    })}
                                                    disabled={!hasNextVideo}
                                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40"
                                                    style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#bcc9cd" }}
                                                >
                                                    Next Video <ArrowRight className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl relative" style={{ background: "#000", border: "1px solid rgba(255,255,255,0.08)" }}>
                                            <iframe
                                                width="100%"
                                                height="100%"
                                                src={`https://www.youtube.com/embed/${primaryVideoId}?autoplay=0&rel=0`}
                                                title={activeTopic?.title}
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                                className="absolute inset-0 w-full h-full border-0"
                                            />
                                        </div>
                                        <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                            <div>
                                                <h3 className="text-base font-semibold" style={{ color: "#dee2f3" }}>{primaryVideo?.title || activeTopic?.title}</h3>
                                                <p className="text-sm mt-1" style={{ color: "#bcc9cd" }}>Authoritative source automatically curated for you.</p>
                                            </div>
                                            <button
                                                onClick={() => syncTopicProgress({ videoProgress: 100 })}
                                                disabled={isSyncingProgress || Boolean(activeTopic?.videoProgress && activeTopic.videoProgress >= 90)}
                                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                                                style={{ border: "1px solid rgba(76,215,246,0.25)", color: "#4cd7f6", background: "rgba(76,215,246,0.06)" }}
                                            >
                                                {isSyncingProgress ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                                {activeTopic?.videoProgress && activeTopic.videoProgress >= 90 ? "Marked Understood" : "Mark as Understood"}
                                            </button>
                                        </div>

                                        <div className="mt-6 rounded-2xl p-5" style={{ background: "rgba(22,27,40,0.85)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="font-semibold" style={{ color: "#dee2f3" }}>Notes + Video Combined View</h4>
                                                <button onClick={() => setActiveTab("read")} className="text-xs font-semibold px-3 py-1 rounded-lg transition-all" style={{ color: "#4cd7f6" }}>
                                                    Open Full Notes
                                                </button>
                                            </div>
                                            {activeTopic?.notes ? (
                                                <div className="prose prose-invert max-w-none text-sm">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                        {activeTopic.notes}
                                                    </ReactMarkdown>
                                                </div>
                                            ) : (
                                                <div className="text-sm flex items-center gap-3" style={{ color: "#bcc9cd" }}>
                                                    Notes are not available yet.
                                                    <button onClick={handleGenerateNotes} disabled={isGeneratingNotes} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all" style={{ background: "rgba(76,215,246,0.1)", border: "1px solid rgba(76,215,246,0.2)", color: "#4cd7f6" }}>
                                                        {isGeneratingNotes ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                                                        Generate Notes
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="rounded-2xl p-12 text-center flex flex-col items-center justify-center" style={{ background: "rgba(22,27,40,0.85)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                        <PlayCircle className="w-12 h-12 mb-4 opacity-30" style={{ color: "#4cd7f6" }} />
                                        <h3 className="text-xl font-semibold mb-2" style={{ color: "#dee2f3" }}>No Video Loaded</h3>
                                        <p className="mb-6 max-w-xs" style={{ color: "#bcc9cd" }}>Videos are fetched on-demand to save quota. Load one now.</p>
                                        {videosError ? (
                                            <p className="text-sm mb-3" style={{ color: "#f87171" }}>{videosError}</p>
                                        ) : null}
                                        <button onClick={handleFetchVideos} disabled={isFetchingVideos} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all disabled:opacity-50" style={{ background: "linear-gradient(135deg,#acedff,#4cd7f6)", color: "#003640" }}>
                                            {isFetchingVideos ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                                            {isFetchingVideos ? "Finding Videos..." : "Load Videos"}
                                        </button>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="read" className="mt-0 outline-none">
                                {activeTopic?.notes ? (
                                    <div className="prose prose-invert max-w-none">
                                        <div className="p-6 sm:p-10 rounded-2xl" style={{ background: "rgba(22,27,40,0.85)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {activeTopic.notes}
                                            </ReactMarkdown>
                                            <div className="mt-6">
                                                <button
                                                    onClick={() => syncTopicProgress({ notesCompleted: true })}
                                                    disabled={isSyncingProgress || Boolean(activeTopic.notesCompleted)}
                                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                                                    style={activeTopic.notesCompleted ? { background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", color: "#34d399" } : { border: "1px solid rgba(76,215,246,0.25)", color: "#4cd7f6", background: "rgba(76,215,246,0.06)" }}
                                                >
                                                    {isSyncingProgress ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                                                    {activeTopic.notesCompleted ? "Notes Completed ✓" : "Mark Notes Done"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-2xl p-12 text-center flex flex-col items-center justify-center" style={{ background: "rgba(22,27,40,0.85)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                        <FileText className="w-12 h-12 mb-4 opacity-30" style={{ color: "#4cd7f6" }} />
                                        <h3 className="text-xl font-semibold mb-2" style={{ color: "#dee2f3" }}>No Notes Available</h3>
                                        <p className="mb-6 max-w-xs" style={{ color: "#bcc9cd" }}>Generate AI notes for this topic to study without leaving the page.</p>
                                        {notesError ? (
                                            <p className="text-sm mb-3" style={{ color: "#f87171" }}>{notesError}</p>
                                        ) : null}
                                        <button onClick={handleGenerateNotes} disabled={isGeneratingNotes} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all disabled:opacity-50" style={{ background: "linear-gradient(135deg,#acedff,#4cd7f6)", color: "#003640" }}>
                                            {isGeneratingNotes ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                            {isGeneratingNotes ? "Generating..." : "Generate Notes"}
                                        </button>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="practice" className="mt-0 outline-none">
                                <div className="p-6 sm:p-8 rounded-2xl" style={{ background: "rgba(22,27,40,0.85)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                    <div className="flex flex-col gap-4 mb-6">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                            <div>
                                                <h3 className="text-xl font-semibold mb-1" style={{ color: "#dee2f3" }}>Practice Mode</h3>
                                                <p className="text-sm" style={{ color: "#bcc9cd" }}>Timed mock with instant feedback and adaptive difficulty.</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <label className="text-sm" style={{ color: "#bcc9cd" }}>Difficulty</label>
                                                <select
                                                    value={practiceDifficulty}
                                                    onChange={(event) => setPracticeDifficulty(event.target.value as PracticeDifficulty)}
                                                    className="h-9 rounded-xl px-3 text-sm outline-none"
                                                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#dee2f3" }}
                                                >
                                                    <option value="easy">Easy</option>
                                                    <option value="medium">Medium</option>
                                                    <option value="hard">Hard</option>
                                                </select>
                                                <button onClick={handleGeneratePractice} disabled={!activeTopic || isGeneratingPractice} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50" style={{ background: "linear-gradient(135deg,#acedff,#4cd7f6)", color: "#003640" }}>
                                                    {isGeneratingPractice ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                                                    {activePracticeQuestions.length > 0 ? "Regenerate Set" : "Generate Set"}
                                                </button>
                                            </div>
                                        </div>
                                        {activePracticeQuestions.length > 0 ? (
                                            <div className="flex flex-wrap items-center gap-2">
                                                <button
                                                    onClick={handleStartMock}
                                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                                                    style={isMockStarted ? { background: "rgba(76,215,246,0.12)", border: "1px solid rgba(76,215,246,0.25)", color: "#4cd7f6" } : { border: "1px solid rgba(255,255,255,0.1)", color: "#bcc9cd" }}
                                                >
                                                    <Timer className="w-4 h-4" />
                                                    {isMockStarted ? "Running" : "Start Timed Mock"}
                                                </button>
                                                <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.05)", color: "#bcc9cd", border: "1px solid rgba(255,255,255,0.08)" }}>Timer: {formatTimer(mockSecondsLeft)}</span>
                                                {isMockSubmitted ? (
                                                    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={mockPercent >= 70 ? { background: "rgba(16,185,129,0.12)", color: "#34d399", border: "1px solid rgba(16,185,129,0.25)" } : { background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}>
                                                        Score: {mockScore}/{activePracticeQuestions.length} ({mockPercent}%)
                                                    </span>
                                                ) : null}
                                            </div>
                                        ) : null}
                                    </div>

                                    {practiceError ? (
                                        <p className="text-sm mb-4" style={{ color: "#f87171" }}>{practiceError}</p>
                                    ) : null}

                                    {activePracticeQuestions.length === 0 ? (
                                        <div className="text-center py-10 rounded-xl" style={{ border: "1px dashed rgba(255,255,255,0.1)" }}>
                                            <CheckSquare className="w-10 h-10 mx-auto mb-3" style={{ color: "#4cd7f6", opacity: 0.4 }} />
                                            <p style={{ color: "#bcc9cd" }}>No practice set generated yet.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {activePracticeQuestions.map((question, index) => {
                                                const selectedAnswer = mockAnswers[index];
                                                const isCorrect = selectedAnswer === question.answer;
                                                return (
                                                    <div key={`${question.question}-${index}`} className="rounded-xl p-4" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                                                        <p className="font-medium mb-3" style={{ color: "#dee2f3" }}>{index + 1}. {question.question}</p>
                                                        <div className="space-y-2 text-sm">
                                                            {question.options.map((option, optionIndex) => {
                                                                const optionLabel = `${String.fromCharCode(65 + optionIndex)}. ${option}`;
                                                                const isSelected = selectedAnswer === option;
                                                                const showCorrect = isMockSubmitted && option === question.answer;
                                                                const showWrongSelection = isMockSubmitted && isSelected && option !== question.answer;
                                                                return (
                                                                    <button
                                                                        key={`${option}-${optionIndex}`}
                                                                        onClick={() => {
                                                                            if (!isMockSubmitted) {
                                                                                setMockAnswers((prev) => ({ ...prev, [index]: option }));
                                                                            }
                                                                        }}
                                                                        disabled={isMockSubmitted}
                                                                        className="w-full text-left rounded-xl px-3 py-2.5 transition-all text-sm"
                                                                        style={{
                                                                            border: showCorrect ? "1px solid rgba(16,185,129,0.5)" : showWrongSelection ? "1px solid rgba(239,68,68,0.5)" : isSelected && !isMockSubmitted ? "1px solid rgba(76,215,246,0.35)" : "1px solid rgba(255,255,255,0.07)",
                                                                            background: showCorrect ? "rgba(16,185,129,0.08)" : showWrongSelection ? "rgba(239,68,68,0.08)" : isSelected && !isMockSubmitted ? "rgba(76,215,246,0.08)" : "transparent",
                                                                            color: "#bcc9cd",
                                                                        }}
                                                                    >
                                                                        {optionLabel}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                        {isMockSubmitted ? (
                                                            <div className="mt-3 text-sm">
                                                                <p style={{ color: isCorrect ? "#34d399" : "#ffba45" }}>
                                                                    {isCorrect ? "Correct ✓" : `Incorrect. Correct: ${question.answer}`}
                                                                </p>
                                                                {!isCorrect ? <p className="mt-1" style={{ color: "#bcc9cd" }}>{question.explanation}</p> : null}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {activePracticeQuestions.length > 0 && !isMockSubmitted ? (
                                        <div className="mt-6 text-center">
                                            <button onClick={handleSubmitMock} className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-all" style={{ background: "linear-gradient(135deg,#acedff,#4cd7f6)", color: "#003640" }}>
                                                Submit Mock Test
                                            </button>
                                        </div>
                                    ) : null}

                                    <div className="mt-8 flex flex-wrap gap-3 justify-center">
                                        <button
                                            onClick={() => syncTopicProgress({ practiceCompleted: true })}
                                            disabled={isSyncingProgress || Boolean(activeTopic?.practiceCompleted)}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                                            style={activeTopic?.practiceCompleted ? { background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", color: "#34d399" } : { border: "1px solid rgba(76,215,246,0.25)", color: "#4cd7f6", background: "rgba(76,215,246,0.06)" }}
                                        >
                                            {isSyncingProgress ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckSquare className="w-4 h-4" />}
                                            {activeTopic?.practiceCompleted ? "Practice Completed ✓" : "Mark Practice Done"}
                                        </button>
                                        <button
                                            onClick={handleMarkComplete}
                                            disabled={!activeTopic || activeTopic.isCompleted || isCompleting}
                                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
                                            style={{ background: "linear-gradient(135deg,#acedff,#4cd7f6)", color: "#003640" }}
                                        >
                                            {activeTopic?.isCompleted ? "Already Completed ✓" : "Complete This Topic"}
                                        </button>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>

            {/* ── AI Chat Overlay ── */}
            <AnimatePresence>
                {isChatOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 24, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0,  scale: 1    }}
                        exit={{ opacity: 0, y: 24, scale: 0.96 }}
                        transition={{ type: "spring", damping: 24, stiffness: 280 }}
                        className="fixed inset-x-4 bottom-4 z-50 flex flex-col overflow-hidden rounded-[1.6rem] shadow-2xl shadow-black/60 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[420px]"
                        style={{ background: "linear-gradient(180deg,rgba(14,19,31,0.98) 0%, rgba(12,17,28,0.96) 100%)", border: "1px solid rgba(76,215,246,0.2)", backdropFilter: "blur(24px)", maxHeight: "calc(100vh - 120px)" }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3.5 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "linear-gradient(180deg,rgba(76,215,246,0.08) 0%, rgba(76,215,246,0.02) 100%)" }}>
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg,#4cd7f6,#38bdf8)" }}>
                                    <Brain className="w-4 h-4 text-[#003640]" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold leading-none">AI Tutor</p>
                                    <p className="text-[11px] text-[#bcc9cd] mt-0.5 truncate max-w-[240px]">{activeTopic?.title}</p>
                                </div>
                            </div>
                            <button onClick={() => setIsChatOpen(false)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#bcc9cd] hover:bg-white/10 transition-colors shrink-0">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Suggested prompts (show only when no messages) */}
                        {chatMessages.length === 0 && !isChatLoading && (
                            <div className="px-4 pt-4 pb-2 shrink-0">
                                <p className="text-[10px] text-[#bcc9cd] uppercase tracking-widest font-semibold mb-2.5">Quick questions</p>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        "Explain this topic simply",
                                        "Give me 3 MCQs",
                                        "Summarize the key points",
                                        "Create a revision plan",
                                    ].map((prompt) => (
                                        <button
                                            key={prompt}
                                            onClick={() => handleAskAI(prompt)}
                                            disabled={isChatLoading}
                                            className="text-[11px] font-medium px-3 py-1.5 rounded-full transition-all hover:scale-105"
                                            style={{ background: "rgba(76,215,246,0.08)", border: "1px solid rgba(76,215,246,0.18)", color: "#9ae9ff" }}
                                        >
                                            {prompt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ minHeight: 140, background: "linear-gradient(180deg,rgba(255,255,255,0.015) 0%, rgba(255,255,255,0) 100%)" }}>
                            {chatMessages.length === 0 && !isChatLoading && (
                                <div className="text-center py-8">
                                    <MessageCircle className="w-9 h-9 mx-auto mb-2" style={{ color: "rgba(76,215,246,0.25)" }} />
                                    <p className="text-sm text-[#bcc9cd]">Ask anything about this topic.</p>
                                    <p className="text-xs text-[#869397] mt-1">AI answers using notes + trusted sources.</p>
                                </div>
                            )}

                            {chatMessages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex gap-2.5 ${ msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                                >
                                    {/* Avatar */}
                                    {msg.role === "ai" && (
                                        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "linear-gradient(135deg,#4cd7f6,#38bdf8)" }}>
                                            <Brain className="w-3 h-3 text-[#003640]" />
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-[82%] px-3.5 py-2.5 text-sm leading-relaxed ${
                                            msg.role === "user" ? "chat-bubble-user animate-chat-right" : "chat-bubble-ai animate-chat-left"
                                        }`}
                                    >
                                        {msg.role === "ai" ? (
                                            <div className="prose-chat">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                            </div>
                                        ) : (
                                            <span className="text-[#dee2f3] font-medium">{msg.content}</span>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Typing indicator */}
                            {isChatLoading && (
                                <div className="flex gap-2.5">
                                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg,#4cd7f6,#38bdf8)" }}>
                                        <Brain className="w-3 h-3 text-[#003640]" />
                                    </div>
                                    <div className="chat-bubble-ai px-4 py-3 flex items-center gap-1">
                                        <span className="typing-dot" />
                                        <span className="typing-dot" />
                                        <span className="typing-dot" />
                                    </div>
                                </div>
                            )}

                            <div ref={chatEndRef} />
                        </div>

                        {/* Input */}
                        <div className="flex gap-2 p-3 shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
                            <input
                                ref={chatInputRef}
                                value={chatQuestion}
                                onChange={(e) => setChatQuestion(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAskAI(); } }}
                                placeholder="Ask about this topic…"
                                disabled={isChatLoading}
                                className="flex-1 text-sm px-3.5 py-2.5 rounded-xl outline-none disabled:opacity-50"
                                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#dee2f3" }}
                            />
                            <button
                                onClick={() => handleAskAI()}
                                disabled={!chatQuestion.trim() || isChatLoading}
                                className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105"
                                style={{ background: "linear-gradient(135deg,#4cd7f6,#38bdf8)" }}
                            >
                                <Send className="w-4 h-4 text-[#003640]" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Ask AI Button */}
            {!isChatOpen && (
                <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    onClick={() => setIsChatOpen(true)}
                    className="fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-2xl shadow-glow-cyan"
                    style={{ background: "linear-gradient(135deg,#4cd7f6,#38bdf8)" }}
                    title="Ask AI about this topic"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <span className="flex h-14 w-14 items-center justify-center">
                        <MessageCircle className="w-6 h-6 text-[#003640]" />
                    </span>
                    <span className="hidden pr-5 text-sm font-bold text-[#003640] sm:block">Ask AI Tutor</span>
                    {chatMessages.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-[#003640]" style={{ background: "#ffba45" }}>
                            {chatMessages.filter(m => m.role === "ai").length}
                        </span>
                    )}
                </motion.button>
            )}

            {/* Keyboard Shortcuts Modal */}
            <AnimatePresence>
                {isShortcutsOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        onClick={() => setIsShortcutsOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded-2xl border border-white/10 bg-background/95 backdrop-blur-xl p-6 w-full max-w-sm shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-lg flex items-center gap-2"><Keyboard className="w-5 h-5 text-cyan-400" /> Keyboard Shortcuts</h3>
                                <button onClick={() => setIsShortcutsOpen(false)} className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center"><X className="w-4 h-4" /></button>
                            </div>
                            <div className="space-y-2">
                                {[
                                    { key: "←", desc: "Previous topic" },
                                    { key: "→", desc: "Next topic" },
                                    { key: "?", desc: "Open shortcuts" },
                                    { key: "Esc", desc: "Close overlays" },
                                ].map(({ key, desc }) => (
                                    <div key={key} className="flex items-center justify-between py-2 border-b border-white/[0.06]">
                                        <span className="text-sm text-muted-foreground">{desc}</span>
                                        <kbd className="px-2 py-1 rounded bg-white/[0.08] border border-white/10 text-xs font-mono">{key}</kbd>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
