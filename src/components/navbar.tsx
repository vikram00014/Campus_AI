"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  UserCircle2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { User } from "@supabase/supabase-js";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/courses/create", label: "Generate Course", icon: BookOpen, authRequired: true },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, authRequired: true },
  { href: "/profile", label: "Profile", icon: UserCircle2, authRequired: true },
  { href: "/verify", label: "Verify", icon: ShieldCheck, authRequired: false },
];

export default function Navbar({ user }: { user: User | null }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const visibleLinks = navLinks.filter((link) => !link.authRequired || user);
  const initials =
    (user?.user_metadata?.full_name as string)?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "S";
  const displayName = (user?.user_metadata?.full_name as string) || user?.email || "Student";

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="app-shell flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/20">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="text-base font-bold tracking-tight">
              CAMPUS <span className="text-primary">AI</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {visibleLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(`${link.href}/`));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground",
                    isActive && "bg-muted text-foreground font-semibold shadow-xs"
                  )}
                >
                  <link.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle />
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/profile"
                  className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-1.5 text-sm font-medium transition-all hover:border-primary/40 hover:shadow-xs"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                    {initials}
                  </span>
                  <span className="max-w-36 truncate font-medium">{displayName}</span>
                </Link>
                <form action={logout}>
                  <Button type="submit" variant="ghost" size="icon" aria-label="Sign out" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/auth">Log in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/auth">Get started</Link>
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 md:hidden">
            <ThemeToggle />
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => setMobileOpen((open) => !open)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close menu backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-xs md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="fixed right-0 top-0 z-50 flex h-full w-72 max-w-[85vw] flex-col border-l border-border bg-background shadow-xl md:hidden"
            >
              <div className="flex h-16 items-center justify-between border-b border-border px-5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <GraduationCap className="h-4 w-4" />
                  </span>
                  <span className="font-bold tracking-tight">CAMPUS AI</span>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <nav className="flex-1 space-y-1 p-3">
                {visibleLinks.map((link) => {
                  const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(`${link.href}/`));
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                        isActive && "bg-muted text-foreground font-semibold"
                      )}
                    >
                      <link.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="border-t border-border p-4">
                {user ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {initials}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{displayName}</p>
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <form action={logout}>
                      <Button type="submit" variant="outline" className="w-full justify-center">
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </Button>
                    </form>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    <Button asChild variant="outline" className="w-full justify-center">
                      <Link href="/auth">Log in</Link>
                    </Button>
                    <Button asChild className="w-full justify-center">
                      <Link href="/auth">Get started</Link>
                    </Button>
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}


