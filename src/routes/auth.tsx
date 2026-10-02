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
        if (data.session) navigate({ to: "/onboarding" });
        else setSent(true);
      } else {
        const { error } = await signIn({ email: f.email.trim(), password: f.password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
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
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex justify-center">
          <Logo />
        </Link>
        <div className="glass rounded-2xl p-6">
          {sent ? (
            <div className="text-center">
              <h1 className="text-xl font-semibold">Check your email</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                We sent a confirmation link to {f.email}. Open it to finish creating your account.
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-semibold">
                {isSignup ? "Create your account" : "Welcome back"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {isSignup ? "Start tracking your study days." : "Log in to continue your streak."}
              </p>
              <form onSubmit={submit} className="mt-6 grid gap-3">
                {isSignup && (
                  <>
                    <div className="grid gap-1.5">
                      <Label>Full name</Label>
                      <Input value={f.fullName} onChange={set("fullName")} autoComplete="name" />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Username</Label>
                      <Input
                        value={f.username}
                        onChange={set("username")}
                        placeholder="kaif_codes"
                        autoComplete="username"
                      />
                    </div>
                  </>
                )}
                <div className="grid gap-1.5">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={f.email}
                    onChange={set("email")}
                    autoComplete="email"
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <div className="flex justify-between">
                    <Label>Password</Label>
                    {!isSignup && (
                      <Link
                        to="/forgot-password"
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Forgot password?
                      </Link>
                    )}
                  </div>
                  <Input
                    type="password"
                    value={f.password}
                    onChange={set("password")}
                    autoComplete={isSignup ? "new-password" : "current-password"}
                    required
                  />
                </div>
                {isSignup && (
                  <div className="grid gap-1.5">
                    <Label>Confirm password</Label>
                    <Input
                      type="password"
                      value={f.confirm}
                      onChange={set("confirm")}
                      autoComplete="new-password"
                    />
                  </div>
                )}
                <Button type="submit" className="mt-2" disabled={loading}>
                  {loading ? "Please waitâ€¦" : isSignup ? "Create account" : "Log in"}
                </Button>
              </form>
              <p className="mt-5 text-center text-sm text-muted-foreground">
                {isSignup ? "Already have an account?" : "New to SkillGrid?"}{" "}
                <button
                  onClick={() => setIsSignup(!isSignup)}
                  className="font-medium text-foreground hover:underline"
                >
                  {isSignup ? "Log in" : "Create account"}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
