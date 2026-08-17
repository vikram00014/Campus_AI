"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

type ToastTone = "success" | "error" | "info";

interface Toast {
    id: number;
    message: string;
    tone: ToastTone;
}

interface ToastContextValue {
    showToast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_ICON = {
    success: CheckCircle2,
    error: AlertTriangle,
    info: Info,
} as const;

const TONE_COLOR = {
    success: "hsl(var(--success))",
    error: "hsl(var(--destructive))",
    info: "hsl(var(--primary))",
} as const;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const nextId = useRef(0);

    const dismiss = useCallback((id: number) => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback(
        (message: string, tone: ToastTone = "info") => {
            nextId.current += 1;
            const id = nextId.current;
            setToasts((current) => [...current, { id, message, tone }]);
            setTimeout(() => dismiss(id), 4000);
        },
        [dismiss]
    );

    const value = useMemo(() => ({ showToast }), [showToast]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div
                className="pointer-events-none fixed bottom-4 left-1/2 z-[100] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4 sm:left-auto sm:right-4 sm:translate-x-0"
                role="status"
                aria-live="polite"
            >
                <AnimatePresence initial={false}>
                    {toasts.map((toast) => {
                        const Icon = TONE_ICON[toast.tone];
                        return (
                            <motion.div
                                key={toast.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 8 }}
                                transition={{ duration: 0.18, ease: "easeOut" }}
                                className="surface-card pointer-events-auto flex items-start gap-3 p-4"
                            >
                                <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: TONE_COLOR[toast.tone] }} />
                                <p className="flex-1 text-sm leading-6">{toast.message}</p>
                                <button
                                    type="button"
                                    onClick={() => dismiss(toast.id)}
                                    aria-label="Dismiss notification"
                                    className="rounded-lg p-1 text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export function useToast(): ToastContextValue {
    const context = useContext(ToastContext);
    if (!context) {
        // Toasts are non-essential feedback, so a missing provider shouldn't crash a page.
        return { showToast: () => undefined };
    }
    return context;
}
