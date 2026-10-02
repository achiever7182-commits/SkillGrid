import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ss/primitives";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password â€” SkillGrid" },
      { name: "description", content: "Get a link to reset your SkillGrid password." },
      { property: "og:title", content: "Reset your password â€” SkillGrid" },
      { property: "og:description", content: "Get a link to reset your SkillGrid password." },
    ],
  }),
  component: Forgot,
});

function Forgot() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  }
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex justify-center">
          <Logo />
        </Link>
        <div className="glass rounded-2xl p-6">
          <h1 className="text-xl font-semibold">Forgot your password?</h1>
          {sent ? (
            <p className="mt-2 text-sm text-muted-foreground">
              If an account exists for {email}, a reset link is on its way.
            </p>
          ) : (
            <form onSubmit={submit} className="mt-4 grid gap-3">
              <Input
                type="email"
                placeholder="you@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button disabled={loading}>{loading ? "Sendingâ€¦" : "Send reset link"}</Button>
            </form>
          )}
          <Link
            to="/auth"
            className="mt-4 block text-center text-sm text-muted-foreground hover:text-foreground"
          >
            Back to log in
          </Link>
        </div>
      </div>
    </div>
  );
}
