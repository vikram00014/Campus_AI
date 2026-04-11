"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GraduationCap, BookOpen, LayoutDashboard, LogOut,
  ShieldCheck, UserCircle2, Menu, X, Sparkles, ChevronDown,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { logout } from "@/app/actions/auth";
import type { User } from "@supabase/supabase-js";

const navLinks = [
  { href: "/courses/create", label: "Generate Course", icon: BookOpen,       authRequired: true  },
  { href: "/dashboard",      label: "Dashboard",       icon: LayoutDashboard, authRequired: true  },
  { href: "/profile",        label: "Profile",         icon: UserCircle2,    authRequired: true  },
  { href: "/verify",         label: "Verify",          icon: ShieldCheck,    authRequired: false },
];

export default function Navbar({ user }: { user: User | null }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled,   setScrolled]   = useState(false);
  const pathname = usePathname();

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const visibleLinks = navLinks.filter((l) => !l.authRequired || !!user);
  const initials =
    (user?.user_metadata?.full_name as string)?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() || "U";
  const displayName = (user?.user_metadata?.full_name as string) || user?.email || "";

  return (
    <>
      {/* ── HEADER ── */}
      <motion.header
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0,   opacity: 1  }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="sticky top-0 z-50 w-full transition-all duration-300"
        style={{
          background: scrolled ? "rgba(14,19,31,0.92)" : "rgba(14,19,31,0.6)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
          boxShadow: "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
              style={{ background: "rgba(76,215,246,0.12)", border: "1px solid rgba(76,215,246,0.2)" }}
            >
              <GraduationCap className="w-5 h-5 text-[#4cd7f6]" />
            </div>
            <span className="font-extrabold text-lg tracking-tight">
              CAMPUS <span className="text-[#4cd7f6]">AI</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {visibleLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                  style={{
                    color: isActive ? "#4cd7f6" : "#bcc9cd",
                    background: isActive ? "rgba(76,215,246,0.14)" : "transparent",
                    border: isActive ? "1px solid rgba(76,215,246,0.2)" : "1px solid transparent",
                  }}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                {/* Avatar pill */}
                <div
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-full cursor-default"
                  style={{ background: "rgba(76,215,246,0.07)", border: "1px solid rgba(76,215,246,0.15)" }}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-[#003640]"
                    style={{ background: "linear-gradient(135deg,#acedff,#4cd7f6)" }}
                  >
                    {initials}
                  </div>
                  <span className="text-sm font-medium text-[#dee2f3] hidden sm:block max-w-[120px] truncate">
                    {displayName}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#bcc9cd]" />
                </div>

                {/* Logout */}
                <form action={logout}>
                  <button
                    type="submit"
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:bg-red-500/10 hover:border-red-400/30"
                    style={{ border: "1px solid rgba(239,68,68,0.15)" }}
                    title="Sign out"
                  >
                    <LogOut className="w-4 h-4 text-red-400" />
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth">
                  <button
                    className="px-4 py-2 rounded-xl text-sm font-medium text-[#bcc9cd] transition-all duration-200 hover:bg-white/5 hover:text-[#dee2f3]"
                    style={{ border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    Log in
                  </button>
                </Link>
                <Link href="/auth">
                  <button className="btn-primary flex items-center gap-1.5 px-4 py-2 text-sm font-bold">
                    <Sparkles className="w-4 h-4" />
                    Get Started
                  </button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center transition-all"
            style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </motion.header>

      {/* ── MOBILE DRAWER ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 z-50 h-full w-72 flex flex-col md:hidden"
              style={{
                background: "rgba(14,19,31,0.97)",
                backdropFilter: "blur(24px)",
                borderLeft: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(76,215,246,0.12)", border: "1px solid rgba(76,215,246,0.25)" }}>
                    <GraduationCap className="w-4 h-4 text-[#4cd7f6]" />
                  </div>
                  <span className="font-extrabold">CAMPUS <span className="text-[#4cd7f6]">AI</span></span>
                </div>
                <button onClick={() => setMobileOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Nav links */}
              <nav className="flex-1 p-5 space-y-1 overflow-y-auto">
                {visibleLinks.map((link) => {
                  const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
                      style={{
                        color: isActive ? "#4cd7f6" : "#bcc9cd",
                        background: isActive ? "rgba(76,215,246,0.12)" : "transparent",
                        border: isActive ? "1px solid rgba(76,215,246,0.18)" : "1px solid transparent",
                      }}
                    >
                      <link.icon className="w-4 h-4" />
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              {/* Drawer footer */}
              <div className="p-5 space-y-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                {user ? (
                  <>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "rgba(76,215,246,0.05)", border: "1px solid rgba(76,215,246,0.1)" }}>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-[#003640]" style={{ background: "linear-gradient(135deg,#acedff,#4cd7f6)" }}>
                        {initials}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-semibold truncate">{displayName}</p>
                        <p className="text-xs text-[#bcc9cd] truncate">{user.email}</p>
                      </div>
                    </div>
                    <form action={logout} className="w-full">
                      <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-400 transition-all hover:bg-red-500/10" style={{ border: "1px solid rgba(239,68,68,0.2)" }}>
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Link href="/auth" className="block">
                      <button className="w-full py-2.5 rounded-xl text-sm font-medium text-[#dee2f3] transition-all hover:bg-white/5" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                        Log In
                      </button>
                    </Link>
                    <Link href="/auth" className="block">
                      <button className="btn-primary w-full py-2.5 text-sm font-bold flex items-center justify-center gap-2">
                        <Sparkles className="w-4 h-4" /> Sign Up Free
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
