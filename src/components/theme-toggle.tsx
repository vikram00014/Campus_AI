"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const activeTheme = theme === "system" ? resolvedTheme : theme;

    return (
        <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full border-cyan-500/30 hover:bg-cyan-500/10"
            onClick={() => setTheme(activeTheme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
        >
            {!mounted ? (
                <Sun className="h-4 w-4" />
            ) : activeTheme === "dark" ? (
                <Sun className="h-4 w-4" />
            ) : (
                <Moon className="h-4 w-4" />
            )}
        </Button>
    );
}

