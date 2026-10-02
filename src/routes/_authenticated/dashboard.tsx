import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Clock, Flame, ListChecks, TrendingUp } from "lucide-react";
import { AppShell, PageHeader } from "@/components/ss/app-shell";
import { ActivityFeed } from "@/components/ss/activity-feed";
import { WeeklyBarChart } from "@/components/ss/charts";
import { Heatmap } from "@/components/ss/heatmap";
import { Panel, ProgressRing, SectionTitle, StatCard } from "@/components/ss/primitives";
import { SubjectCards } from "@/components/ss/subject-cards";
import { TaskList } from "@/components/ss/task-list";
import { useProfile, useUser } from "@/hooks/use-session";
import { useProgress } from "@/hooks/use-progress";
import { useRewards } from "@/hooks/use-rewards";
import { dayPct, pctOf, streakMessage } from "@/lib/data";
import { greeting, hours } from "@/lib/dates";
import { Link } from "@tanstack/react-router";
import { Progress } from "@/components/ui/progress";
import { Star, Trophy } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard â€” SkillGrid" },
      { name: "description", content: "Today's study progress." },
      { property: "og:title", content: "Dashboard â€” SkillGrid" },
      { property: "og:description", content: "Today's study progress." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: user } = useUser();
  const { data: profile } = useProfile();
  const { data: p } = useProgress(user?.id);
  const t = p?.today;
  const pct = t ? dayPct(t) : 0;
  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-start justify-between">
        <PageHeader
          title={<>{greeting()},<br/><span className="italic text-primary">{profile?.full_name || profile?.username || "Scholar"}</span>.</>}
          subtitle="Let's make today count."
        />
        <RewardBadge userId={user?.id} />
      </div>

      <div className="grid gap-x-12 gap-y-8 md:grid-cols-4 mb-16 px-2">
        <div className="flex items-center gap-6 md:col-span-1">
          <ProgressRing value={pct} size={110} stroke={3}>
            <span className="font-display text-3xl font-bold">{Math.round(pct)}%</span>
          </ProgressRing>
          <div className="text-sm">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Today</div>
            <div className="font-mono text-base font-medium text-foreground">
              {hours(t?.completed ?? 0)} / {hours(t?.planned ?? 0)}h
            </div>
            <div className="text-xs text-muted-foreground mt-1 font-medium">
              {t?.done_tasks ?? 0}/{t?.total_tasks ?? 0} tasks
            </div>
          </div>
        </div>
        <StatCard
          label="Current streak"
          icon={<Flame className="size-4" />}
          value={`${p?.streak.current ?? 0}`}
          sub={streakMessage(p?.streak.current ?? 0)}
        />
        <StatCard
          label="Hours this week"
          icon={<Clock className="size-4" />}
          value={hours(p?.week.completed ?? 0)}
          sub={`of ${hours(p?.week.planned ?? 0)}h planned`}
        />
        <StatCard
          label="Weekly progress"
          icon={<TrendingUp className="size-4" />}
          value={`${Math.round(p?.week.pct ?? 0)}%`}
          sub={`${p?.week.done ?? 0} tasks done`}
        />
      </div>

      <div className="grid gap-12 lg:grid-cols-5 mb-12">
        <div className="lg:col-span-3">
          <SectionTitle index="01" action={<ListChecks className="size-4 text-muted-foreground" />}>
            Tasks
          </SectionTitle>
          <TaskList />
        </div>
        <div className="lg:col-span-2">
          <SectionTitle index="02">This week</SectionTitle>
          <div className="mt-8">
            {p && <WeeklyBarChart days={p.weekDays} />}
          </div>
        </div>
      </div>

      <div className="grid gap-12 lg:grid-cols-2 mb-12">
        <div>
          <SectionTitle index="03">Subjects</SectionTitle>
          <SubjectCards userId={user?.id} />
        </div>
        <div>
          <SectionTitle index="04">Consistency</SectionTitle>
          {p && <Heatmap daily={p.daily} streakCurrent={p.streak.current} streakLongest={p.streak.longest} />}
        </div>
      </div>

      <div>
        <SectionTitle index="05">Social</SectionTitle>
        <ActivityFeed limit={10} />
      </div>
      </motion.div>
    </AppShell>
  );
}

function RewardBadge({ userId }: { userId?: string }) {
  const { data: rewards } = useRewards(userId);
  if (!rewards) return null;

  return (
    <Link to="/rewards" className="group hidden md:flex items-center gap-4 rounded-full border border-border/60 bg-card/50 px-5 py-2.5 shadow-sm transition-all hover:border-primary/40 hover:bg-card">
      <div className="grid place-items-center text-primary">
        <Star className="size-5" strokeWidth={1.5} />
      </div>
      <div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-display text-lg font-bold text-foreground tracking-tight">Level {rewards.level}</span>
          <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">{rewards.xp.toLocaleString()} XP</span>
        </div>
        <Progress value={rewards.levelProgress} className="h-1 w-32 bg-secondary" />
      </div>
    </Link>
  );
}
