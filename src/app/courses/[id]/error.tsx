"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function CoursePlayerError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Course Player Error:", error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] text-center p-6 bg-background">
            <div className="bg-amber-500/10 p-6 rounded-full mb-6 border border-amber-500/20">
                <AlertTriangle className="w-16 h-16 text-amber-500" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Course Unavailable</h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                We could not load this autonomous course right now. The AI generated data might be corrupted or you no longer have access to this resource.
            </p>
            <div className="flex gap-4">
                <Button onClick={() => reset()} variant="outline">
                    Retry Loading
                </Button>
                <Link href="/dashboard">
                    <Button>Return to Dashboard</Button>
                </Link>
            </div>
        </div>
    );
}
