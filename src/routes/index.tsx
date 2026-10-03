import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Flame, ListChecks, Lock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ss/primitives";

import AirlockHero from "@/components/ui/airlock-spaceship-hero";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SkillGrid — Track study progress with your friends" },
      {
        name: "description",
        content:
          "Daily study checklists, streaks, heatmaps and shared progress for students and their friends.",
      },
      { property: "og:title", content: "SkillGrid — Track study progress with your friends" },
      {
        property: "og:description",
        content:
          "Daily study checklists, streaks, heatmaps and shared progress for students and their friends.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const cells = Array.from({ length: 7 * 26 }, (_, i) => {
    const v = (Math.sin(i * 1.7) + Math.cos(i * 0.37) + 2) / 4;
    return v < 0.2 ? 0 : v < 0.4 ? 1 : v < 0.6 ? 2 : v < 0.8 ? 3 : 4;
  });
  const lv = ["bg-heat-0", "bg-heat-1", "bg-heat-2", "bg-heat-3", "bg-heat-4"];
  return (
    <div className="w-full min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <div className="flex gap-2">
          <Button variant="ghost" asChild>
            <Link to="/auth">Log in</Link>
          </Button>
          <Button asChild>
            <Link to="/auth" search={{ mode: "signup" }}>
              Create account
            </Link>
          </Button>
        </div>
      </header>

      <AirlockHero
        title="SKILLGRID OPENS"
        tagline="Everything you need to master your studies, right here."
      />
      <div className="relative overflow-hidden pt-24">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <main className="relative mx-auto max-w-6xl px-6 pb-24 pt-16 md:pt-24">
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-primary">
          For students who show up daily
        </p>
        <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] md:text-7xl">
          Study every day.
          <br />
          <span className="text-muted-foreground">See it add up.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Plan your week, check off today's tasks, keep your streak alive — and see how your friends
          are doing, without leaderboards.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button size="lg" asChild>
            <Link to="/auth" search={{ mode: "signup" }}>
              Start tracking <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/auth">I have an account</Link>
          </Button>
        </div>

        <div className="glass mt-16 rounded-2xl p-6">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="font-medium">Last 6 months</span>
            <span className="inline-flex items-center gap-1 font-mono text-streak">
              <Flame className="size-4" />
              23-day streak
            </span>
          </div>
          <div className="grid grid-flow-col grid-rows-7 gap-[3px] overflow-hidden">
            {cells.map((c, i) => (
              <div key={i} className={`size-3 rounded-[3px] ${lv[c]}`} />
            ))}
          </div>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: ListChecks,
              t: "Daily checklist",
              b: "Your weekly schedule turns into today's tasks automatically. Completion is measured in real planned hours.",
            },
            {
              icon: Users,
              t: "Friends, not rankings",
              b: "Follow friends' streaks and weekly progress, cheer them on with a reaction. No leaderboard.",
            },
            {
              icon: Lock,
              t: "Private by default",
              b: "Choose who sees your profile, progress and activity. Notes and email are never shared.",
            },
          ].map((f) => (
            <div key={f.t} className="glass rounded-2xl p-6">
              <f.icon className="size-5 text-primary" />
              <h3 className="mt-4 font-semibold">{f.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.b}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
    </div>
  );
}
