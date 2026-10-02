import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { addDays, format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell, PageHeader } from "@/components/ss/app-shell";
import { WeeklyBarChart, WeeklyLineChart } from "@/components/ss/charts";
import { Heatmap } from "@/components/ss/heatmap";
import { Panel, SectionTitle, StatCard } from "@/components/ss/primitives";
import { SubjectCards } from "@/components/ss/subject-cards";
import { useUser } from "@/hooks/use-session";
import { useProgress } from "@/hooks/use-progress";
import { pctOf } from "@/lib/data";
import { hours, toStr, weekStart } from "@/lib/dates";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics â€” SkillGrid" },
      { name: "description", content: "Weekly and subject study analytics." },
      { property: "og:title", content: "Analytics â€” SkillGrid" },
      { property: "og:description", content: "Weekly study analytics." },
    ],
  }),
  component: Analytics,
});

function Analytics() {
  const { data: user } = useUser();
  const { data: p } = useProgress(user?.id);
  const [weekStartSelected, setWeekStartSelected] = useState<Date>(() => weekStart());

  const currentWs = weekStart();
  const isCurrentWeek = toStr(weekStartSelected) === toStr(currentWs);
  const selectedWeekEnd = addDays(weekStartSelected, 6);
  const weekLabel = `${format(weekStartSelected, "MMM d")} â€“ ${format(selectedWeekEnd, "MMM d, yyyy")}`;

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = toStr(addDays(weekStartSelected, i));
    return (
      p?.daily.find((w) => w.day === d) ?? {
        day: d,
        planned: 0,
        completed: 0,
        total_tasks: 0,
        done_tasks: 0,
      }
    );
  });

  const sum = (k: "planned" | "completed" | "total_tasks" | "done_tasks") =>
    weekDays.reduce((a, d) => a + d[k], 0);

  const planned = sum("planned");
  const completed = sum("completed");
  const tasks = sum("total_tasks");
  const done = sum("done_tasks");
  const pct = pctOf(completed, planned);

  return (
    <AppShell>
      <PageHeader
        title="Analytics"
        subtitle={isCurrentWeek ? "This week at a glance." : `Performance for ${weekLabel}`}
        action={
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={() => setWeekStartSelected((w) => addDays(w, -7))}
              aria-label="Previous week"
              className="rounded-full size-8 border-border/60"
            >
              <ChevronLeft className="size-4" strokeWidth={1.5} />
            </Button>
            <span className="min-w-36 text-center text-sm font-medium font-mono">{weekLabel}</span>
            <Button
              size="icon"
              variant="outline"
              onClick={() => setWeekStartSelected((w) => addDays(w, 7))}
              aria-label="Next week"
              className="rounded-full size-8 border-border/60"
            >
              <ChevronRight className="size-4" strokeWidth={1.5} />
            </Button>
            {!isCurrentWeek && (
              <Button variant="outline" size="sm" onClick={() => setWeekStartSelected(currentWs)} className="rounded-full border-border/60 px-4 ml-2">
                This Week
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7 mb-8 mt-6">
        <StatCard label="Weekly %" value={`${Math.round(pct)}%`} />
        <StatCard label="Planned" value={`${hours(planned)}h`} />
        <StatCard label="Completed" value={`${hours(completed)}h`} />
        <StatCard label="Tasks done" value={done} />
        <StatCard label="Total tasks" value={tasks} />
        <StatCard label="Streak" value={`${p?.streak.current ?? 0}d`} />
        <StatCard label="Longest" value={`${p?.streak.longest ?? 0}d`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <Panel>
          <SectionTitle index="01">Daily completion</SectionTitle>
          <WeeklyBarChart days={weekDays} />
        </Panel>
        <Panel>
          <SectionTitle index="02">Cumulative hours</SectionTitle>
          <WeeklyLineChart days={weekDays} />
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-1 mb-8">
        <Panel>
          <SectionTitle index="03">Subject Progress</SectionTitle>
          <SubjectCards
            userId={user?.id}
            from={toStr(weekStartSelected)}
            to={toStr(selectedWeekEnd)}
          />
        </Panel>
      </div>

      <Panel className="mb-8">
        <SectionTitle index="04">Consistency</SectionTitle>
        {p && <Heatmap daily={p.daily} />}
      </Panel>
    </AppShell>
  );
}
