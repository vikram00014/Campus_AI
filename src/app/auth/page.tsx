"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Eye, EyeOff, GraduationCap, LayoutDashboard, Loader2, LogOut, User } from "lucide-react";
import { login, logout, signup } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [currentUser, setCurrentUser] = useState<{ email?: string; name?: string } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    async function checkCurrentSession() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUser({
            email: user.email,
            name: (user.user_metadata?.full_name as string) || user.email?.split("@")[0] || "Student",
          });
        }
      } catch (err) {
        console.error("Session check error:", err);
      } finally {
        setCheckingAuth(false);
      }
    }
    checkCurrentSession();
  }, []);

  async function handleAuth(formData: FormData) {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      if (mode === "signup" && name.trim()) {
        formData.set("name", name.trim());
      }
      const result = mode === "login" ? await login(formData) : await signup(formData);
      
      if (result?.error) {
        setErrorMsg(result.error);
        setLoading(false);
        return;
      }

      if (result?.needsConfirmation) {
        setSuccessMsg(result.message || "Account created! Please check your email to confirm your account.");
        setLoading(false);
        return;
      }

      window.location.href = "/dashboard";
    } catch (error) {
      setErrorMsg(getErrorMessage(error));
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-background px-4 py-12">
      <section className="w-full max-w-[420px]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card shadow-sm">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">CAMPUS AI</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {currentUser
              ? "You are currently signed in."
              : "Sign in to access your autonomous courses, notes, and study plans."}
          </p>
        </div>

        {/* If already logged in, show active session panel with quick actions */}
        {!checkingAuth && currentUser ? (
          <div className="surface-card space-y-6 p-6">
            <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/40 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                {currentUser.name?.[0]?.toUpperCase() || "S"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{currentUser.name}</p>
                <p className="truncate text-xs text-muted-foreground">{currentUser.email}</p>
              </div>
            </div>

            <div className="space-y-3">
              <Button asChild className="w-full" size="lg">
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                  Go to Dashboard
                </Link>
              </Button>
              <form action={logout}>
                <Button type="submit" variant="outline" className="w-full">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        ) : (
          <div className="surface-card p-6">
            <div className="mb-6 grid grid-cols-2 rounded-xl bg-muted p-1">
              {(["login", "signup"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setMode(item);
                    setErrorMsg("");
                    setSuccessMsg("");
                  }}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors",
                    mode === item && "bg-card text-foreground shadow-sm"
                  )}
                >
                  {item === "login" ? "Log in" : "Sign up"}
                </button>
              ))}
            </div>

            {successMsg ? (
              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold">Verification Sent</h3>
                <p className="text-sm leading-6 text-muted-foreground">{successMsg}</p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setMode("login");
                    setSuccessMsg("");
                  }}
                >
                  Return to Log in
                </Button>
              </div>
            ) : (
              <form action={handleAuth} className="space-y-4">
                {mode === "signup" && (
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-semibold">
                      Full Name
                    </label>
                    <div className="relative">
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required={mode === "signup"}
                        autoComplete="name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Vikram Kadam"
                        className="input-field pl-10"
                      />
                      <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-semibold">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="student@college.edu"
                    className={cn("input-field", errorMsg && "border-destructive")}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-semibold">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder={mode === "signup" ? "At least 6 characters" : "Enter your password"}
                      className={cn("input-field pr-12", errorMsg && "border-destructive")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {errorMsg && (
                  <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                    {errorMsg}
                  </p>
                )}

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {mode === "login" ? "Signing in..." : "Creating account..."}
                    </>
                  ) : (
                    <>
                      {mode === "login" ? "Continue" : "Create account"}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>
        )}

        <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">
          Your courses and progress are protected with Supabase authentication and row-level security.
        </p>
      </section>
    </main>
  );
}

