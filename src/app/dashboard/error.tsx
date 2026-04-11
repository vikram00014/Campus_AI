"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Dashboard Error Runtime:", error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center p-12 text-center h-[calc(100vh-8rem)]">
            <div className="bg-red-500/10 p-6 rounded-full mb-6">
                <AlertCircle className="w-16 h-16 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Something went wrong!</h2>
            <p className="text-muted-foreground mb-8 max-w-md">
                We encountered an error loading your dashboard data. This might be a temporary hiccup with the database connection.
            </p>
            <div className="flex gap-4">
                <Button onClick={() => reset()} variant="default">
                    Try again
                </Button>
            </div>
        </div>
    );
}
