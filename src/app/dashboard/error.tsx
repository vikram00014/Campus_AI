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
        <div className="flex h-[calc(100vh-8rem)] flex-col items-center justify-center bg-background p-12 text-center">
            <div className="mb-6 rounded-xl bg-destructive/10 p-5 text-destructive">
                <AlertCircle className="h-10 w-10" />
            </div>
            <h2 className="mb-2 text-2xl font-bold">Dashboard could not load</h2>
            <p className="mb-8 max-w-md text-sm leading-6 text-muted-foreground">
                Your courses are still safe. The dashboard data could not be loaded right now.
            </p>
            <Button onClick={() => reset()}>Try again</Button>
        </div>
    );
}
