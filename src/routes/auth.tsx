import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ss/primitives";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { RobotMascot } from "@/components/ui/robot-hero";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { mode?: "signup" } =>
    s["mode"] === "signup" ? { mode: "signup" } : {},
  head: () => ({
    meta: [
      { title: "Log in or sign up â€” SkillGrid" },
      {
        name: "description",
        content:
          "Log in to SkillGrid or create a free account to start tracking your study progress.",
      },
      { property: "og:title", content: "Log in or sign up â€” SkillGrid" },
      { property: "og:description", content: "Log in to SkillGrid or create a free account." },
    ],
  }),
  component: AuthPage,
});

const signupSchema = z
  .object({
    fullName: z.string().trim().min(1, "Enter your name").max(60),
    username: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9_]{3,24}$/, "Username: 3â€“24 letters, numbers or _"),
    email: z.string().trim().email("Enter a valid email").max(255),
    password: z.string().min(8, "Password must be at least 8 characters").max(72),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "Passwords don't match", path: ["confirm"] });

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const { signIn, signUp, user: authUser } = useAuth();
  const [isSignup, setIsSignup] = useState(mode === "signup");
  const [f, setF] = useState({ fullName: "", username: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [lookState, setLookState] = useState<"idle" | "email" | "password">("idle");
  const [loginSuccess, setLoginSuccess] = useState(false);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    if (authUser) {
      navigate({ to: "/dashboard" });
    }
  }, [authUser, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignup) {
        const p = signupSchema.safeParse(f);
        if (!p.success) throw new Error(p.error.issues[0]?.message ?? "Invalid sign up details");
        const { data: free } = await supabase.rpc("username_available", {
          _username: p.data.username,
        });
        if (!free) throw new Error("That username is taken");
        const { data, error } = await signUp({
          email: p.data.email,
          password: p.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/onboarding`,
            data: { full_name: p.data.fullName, username: p.data.username },
          },
        });
        if (error) throw error;
        if (data.session) {
          setLoginSuccess(true);
          setTimeout(() => navigate({ to: "/onboarding" }), 1000);
        }
        else setSent(true);
      } else {
        const { error } = await signIn({ email: f.email.trim(), password: f.password });
        if (error) throw error;
        setLoginSuccess(true);
        setTimeout(() => navigate({ to: "/dashboard" }), 1000);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      if (
        msg.toLowerCase().includes("email signups are disabled") ||
        msg.toLowerCase().includes("signups not allowed")
      ) {
        toast.error(
          "Email signups are disabled in your Supabase project. Enable 'Allow new users to sign up' in Supabase Dashboard â†’ Authentication â†’ Providers â†’ Email.",
          {
            duration: 8000,
          },
        );
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen grid lg:grid-cols-2 grid-cols-1 overflow-hidden bg-background">
      {/* Left Editorial Side */}
      <div className="hidden lg:flex flex-col justify-center px-12 lg:px-24 bg-background z-10 relative">
        <div className="absolute top-12 left-12 lg:top-24 lg:left-24">
          <Logo />
        </div>
        <div className="max-w-md mt-16">
          <p className="text-xs font-bold tracking-[0.15em] text-primary/80 uppercase mb-6">01 — Welcome</p>
          <h1 className="font-display text-5xl lg:text-7xl font-bold leading-[1.05] tracking-tight text-foreground">
            Discipline <br />
            <span className="text-primary">becomes</span> <br />
            momentum.
          </h1>
          <p className="mt-8 text-muted-foreground text-lg leading-relaxed max-w-sm font-sans">
            Turn your daily effort into measurable progress. A private space designed for your continuous growth.
          </p>
        </div>
      </div>

      {/* Right Form Side */}
      <div className="flex items-center justify-center relative bg-secondary/30">
        <div className="absolute inset-0 z-20 pointer-events-none">
          <RobotMascot lookState={lookState} success={loginSuccess} />
        </div>

        <div className="w-full max-w-[26rem] z-10 relative px-6 py-12 lg:p-0">
          <div className="lg:hidden mb-12 flex justify-center">
            <Logo />
          </div>
          
          <div className="bg-card/95 backdrop-blur-sm border border-border/60 rounded-xl p-8 shadow-sm relative">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-full flex justify-center pointer-events-none z-10">
              <div
                className={`whitespace-nowrap rounded-full bg-background border border-border/50 px-4 py-1.5 text-xs text-muted-foreground shadow-sm transition-all duration-300 ${
                  lookState === "password"
                    ? "translate-y-0 opacity-100"
                    : "translate-y-2 opacity-0"
                }`}
              >
                🙈 I'll look away while you type.
              </div>
            </div>
            {sent ? (
              <div className="text-center">
                <h2 className="font-display text-2xl font-bold">Check your email</h2>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  We sent a confirmation link to <span className="font-medium text-foreground">{f.email}</span>. Open it to finish creating your account.
                </p>
              </div>
            ) : (
              <>
                <h2 className="font-display text-2xl font-bold text-foreground">
                  {isSignup ? "Create your account" : "Welcome back"}
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {isSignup ? "Start tracking your study days." : "Log in to continue your streak."}
                </p>
                <form onSubmit={submit} className="mt-8 grid gap-4">
                  {isSignup && (
                    <>
                      <div className="grid gap-2">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Full name</Label>
                        <Input
                          value={f.fullName}
                          onChange={set("fullName")}
                          onFocus={() => setLookState("email")}
                          onBlur={() => setLookState("idle")}
                          autoComplete="name"
                          className="rounded-md border-border/80 focus-visible:ring-primary shadow-none"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Username</Label>
                        <Input
                          value={f.username}
                          onChange={set("username")}
                          onFocus={() => setLookState("email")}
                          onBlur={() => setLookState("idle")}
                          placeholder="kaif_codes"
                          autoComplete="username"
                          className="rounded-md border-border/80 focus-visible:ring-primary shadow-none"
                        />
                      </div>
                    </>
                  )}
                  <div className="grid gap-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Email</Label>
                    <Input
                      type="email"
                      value={f.email}
                      onChange={set("email")}
                      onFocus={() => setLookState("email")}
                      onBlur={() => setLookState("idle")}
                      autoComplete="email"
                      required
                      className="rounded-md border-border/80 focus-visible:ring-primary shadow-none"
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Password</Label>
                      {!isSignup && (
                        <Link
                          to="/forgot-password"
                          className="text-[11px] text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider"
                        >
                          Forgot password?
                        </Link>
                      )}
                    </div>
                    <Input
                      type="password"
                      value={f.password}
                      onChange={set("password")}
                      onFocus={() => setLookState("password")}
                      onBlur={() => setLookState("idle")}
                      autoComplete={isSignup ? "new-password" : "current-password"}
                      required
                      className="rounded-md border-border/80 focus-visible:ring-primary shadow-none"
                    />
                  </div>
                  {isSignup && (
                    <div className="grid gap-2">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Confirm password</Label>
                      <Input
                        type="password"
                        value={f.confirm}
                        onChange={set("confirm")}
                        onFocus={() => setLookState("password")}
                        onBlur={() => setLookState("idle")}
                        autoComplete="new-password"
                        className="rounded-md border-border/80 focus-visible:ring-primary shadow-none"
                      />
                    </div>
                  )}
                  <Button type="submit" className="mt-4 rounded-md shadow-none hover:-translate-y-[1px] transition-transform duration-300" disabled={loading}>
                    {loading ? "Please waitâ€¦" : isSignup ? "Create account" : "Log in"}
                  </Button>
                </form>
                <p className="mt-8 text-center text-sm text-muted-foreground">
                  {isSignup ? "Already have an account?" : "New to SkillGrid?"}{" "}
                  <button
                    onClick={() => setIsSignup(!isSignup)}
                    className="font-medium text-foreground hover:text-primary transition-colors underline decoration-border underline-offset-4 hover:decoration-primary"
                  >
                    {isSignup ? "Log in" : "Create account"}
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
