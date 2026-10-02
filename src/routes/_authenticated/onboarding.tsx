import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ss/primitives";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/use-session";
import { DEFAULT_SCHEDULE, EXTRA_COLORS, SUBJECT_PRESETS, ensureInstances } from "@/lib/data";
import { DAY_NAMES, fmtMinutes, todayStr } from "@/lib/dates";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Get started â€” SkillGrid" },
      { name: "description", content: "Set up your subjects and weekly schedule." },
      { property: "og:title", content: "Get started â€” SkillGrid" },
      { property: "og:description", content: "Set up your study schedule." },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const { data: user } = useUser();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [picked, setPicked] = useState<string[]>([
    "DSA",
    "Mathematics",
    "AI/ML",
    "Cybersecurity",
    "Game Development",
    "Science Lecture",
  ]);
  const [custom, setCustom] = useState("");
  const [saving, setSaving] = useState(false);
  const all = [
    ...SUBJECT_PRESETS.map((s) => s.name),
    ...picked.filter((p) => !SUBJECT_PRESETS.some((s) => s.name === p)),
  ];
  const toggle = (n: string) =>
    setPicked((p) => (p.includes(n) ? p.filter((x) => x !== n) : [...p, n]));

  async function finish() {
    if (!user || picked.length === 0) {
      toast.error("Pick at least one subject");
      return;
    }
    setSaving(true);
    try {
      const rows = picked.map((name, i) => ({
        user_id: user.id,
        name,
        color:
          SUBJECT_PRESETS.find((s) => s.name === name)?.color ??
          EXTRA_COLORS[i % EXTRA_COLORS.length] ??
          "#10b981",
      }));
      const { data: subs, error } = await supabase
        .from("subjects")
        .upsert(rows, { onConflict: "user_id,name" })
        .select("id,name");
      if (error) throw error;
      const tasks = picked.map((name) => {
        const d = DEFAULT_SCHEDULE.find((x) => x.subject === name);
        return {
          user_id: user.id,
          subject_id: subs!.find((s) => s.name === name)!.id,
          title: name,
          planned_minutes: d?.minutes ?? 60,
          days_of_week: d?.days ?? [1, 2, 3, 4, 5],
          start_date: todayStr(),
        };
      });
      const { error: e2 } = await supabase.from("tasks").insert(tasks);
      if (e2) throw e2;
      await supabase
        .from("profiles")
        .update({ onboarded: true, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone })
        .eq("id", user.id);
      await ensureInstances(user.id, todayStr());
      await qc.invalidateQueries();
      navigate({ to: "/dashboard" });
    } catch (e) {
      toast.error((e as any)?.message || "Setup failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Logo />
      <h1 className="mt-10 text-3xl font-semibold">What are you learning?</h1>
      <p className="mt-2 text-muted-foreground">
        We'll build a starting weekly schedule. You can change everything later in Tasks.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        {all.map((n) => (
          <button
            key={n}
            onClick={() => toggle(n)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm transition",
              picked.includes(n)
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:bg-muted",
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <Input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="Add a custom subject"
          maxLength={40}
        />
        <Button
          variant="outline"
          onClick={() => {
            if (custom.trim()) {
              setPicked([...picked, custom.trim()]);
              setCustom("");
            }
          }}
        >
          Add
        </Button>
      </div>
      <div className="glass mt-8 rounded-2xl p-5">
        <h2 className="mb-3 font-semibold">Your starting schedule</h2>
        <ul className="space-y-2 text-sm">
          {picked.map((n) => {
            const d = DEFAULT_SCHEDULE.find((x) => x.subject === n);
            return (
              <li key={n} className="flex justify-between">
                <span>{n}</span>
                <span className="font-mono text-muted-foreground">
                  {fmtMinutes(d?.minutes ?? 60)} Â·{" "}
                  {(d?.days ?? [1, 2, 3, 4, 5]).map((x) => DAY_NAMES[x]).join(" ")}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
      <Button size="lg" className="mt-8 w-full" onClick={finish} disabled={saving}>
        {saving ? "Setting upâ€¦" : "Start studying"}
      </Button>
    </div>
  );
}
