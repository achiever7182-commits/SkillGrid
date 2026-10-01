import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/ss/app-shell";
import { WeeklyBarChart, WeeklyLineChart } from "@/components/ss/charts";
import { Heatmap } from "@/components/ss/heatmap";
import { Panel, SectionTitle, StatCard } from "@/components/ss/primitives";
import { SubjectCards } from "@/components/ss/subject-cards";
import { useUser } from "@/hooks/use-session";
import { useProgress } from "@/hooks/use-progress";
import { hours } from "@/lib/dates";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Analytics — StudySync" }, { name: "description", content: "Weekly and subject study analytics." }, { property: "og:title", content: "Analytics — StudySync" }, { property: "og:description", content: "Weekly study analytics." }] }),
  component: Analytics,
});

function Analytics() {
  const { data: user } = useUser();
  const { data: p } = useProgress(user?.id);
  return (
    <AppShell>
      <PageHeader title="Analytics" subtitle="This week at a glance." />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Weekly %" value={`${Math.round(p?.week.pct ?? 0)}%`} />
        <StatCard label="Planned" value={`${hours(p?.week.planned ?? 0)}h`} />
        <StatCard label="Completed" value={`${hours(p?.week.completed ?? 0)}h`} />
        <StatCard label="Tasks done" value={p?.week.done ?? 0} />
        <StatCard label="Streak" value={`${p?.streak.current ?? 0}d`} />
        <StatCard label="Longest" value={`${p?.streak.longest ?? 0}d`} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel><SectionTitle>Daily completion</SectionTitle>{p && <WeeklyBarChart days={p.weekDays} />}</Panel>
        <Panel><SectionTitle>Cumulative hours</SectionTitle>{p && <WeeklyLineChart days={p.weekDays} />}</Panel>
      </div>
      <Panel className="mt-4"><SectionTitle>Subject Progress</SectionTitle><SubjectCards userId={user?.id} /></Panel>
      <Panel className="mt-4">{p && <Heatmap daily={p.daily} />}</Panel>
    </AppShell>
  );
}
