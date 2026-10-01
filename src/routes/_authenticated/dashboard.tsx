import { createFileRoute } from "@tanstack/react-router";
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
import { dayPct, pctOf, streakMessage } from "@/lib/data";
import { greeting, hours } from "@/lib/dates";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — StudySync" }, { name: "description", content: "Today's study progress." }, { property: "og:title", content: "Dashboard — StudySync" }, { property: "og:description", content: "Today's study progress." }] }),
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
      <PageHeader title={`${greeting()}, ${(profile?.full_name || profile?.username || "").split(" ")[0]} 👋`} subtitle="Let's make today count." />
      <div className="grid gap-4 md:grid-cols-4">
        <Panel className="flex items-center gap-4 md:col-span-1">
          <ProgressRing value={pct} size={96} stroke={9}><span className="font-mono text-xl font-semibold">{Math.round(pct)}%</span></ProgressRing>
          <div className="text-sm">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Today</div>
            <div className="font-mono">{hours(t?.completed ?? 0)} / {hours(t?.planned ?? 0)}h</div>
            <div className="text-xs text-muted-foreground">{t?.done_tasks ?? 0}/{t?.total_tasks ?? 0} tasks · {Math.round(pctOf(t?.done_tasks ?? 0, t?.total_tasks ?? 0))}%</div>
          </div>
        </Panel>
        <StatCard label="Current streak" icon={<Flame className="size-4 text-streak" />} value={`${p?.streak.current ?? 0}d`} sub={streakMessage(p?.streak.current ?? 0)} />
        <StatCard label="Hours this week" icon={<Clock className="size-4" />} value={hours(p?.week.completed ?? 0)} sub={`of ${hours(p?.week.planned ?? 0)}h planned`} />
        <StatCard label="Weekly progress" icon={<TrendingUp className="size-4" />} value={`${Math.round(p?.week.pct ?? 0)}%`} sub={`${p?.week.done ?? 0} tasks done · longest streak ${p?.streak.longest ?? 0}d`} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Panel className="lg:col-span-3"><SectionTitle action={<ListChecks className="size-4 text-muted-foreground" />}>Today's Tasks</SectionTitle><TaskList /></Panel>
        <Panel className="lg:col-span-2"><SectionTitle>This week</SectionTitle>{p && <WeeklyBarChart days={p.weekDays} />}</Panel>
      </div>
      <Panel className="mt-4"><SectionTitle>Subject Progress</SectionTitle><SubjectCards userId={user?.id} /></Panel>
      <Panel className="mt-4">{p && <Heatmap daily={p.daily} />}</Panel>
      <Panel className="mt-4"><SectionTitle>Friends Activity</SectionTitle><ActivityFeed limit={10} /></Panel>
    </AppShell>
  );
}
