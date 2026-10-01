import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { addMonths, eachDayOfInterval, endOfMonth, format, startOfMonth } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AppShell, PageHeader } from "@/components/ss/app-shell";
import { Panel } from "@/components/ss/primitives";
import { TaskList } from "@/components/ss/task-list";
import { useUser } from "@/hooks/use-session";
import { useProgress } from "@/hooks/use-progress";
import { dayPct, heatLevel } from "@/lib/data";
import { hours, parse, toStr } from "@/lib/dates";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — StudySync" },
      { name: "description", content: "Monthly study calendar." },
      { property: "og:title", content: "Calendar — StudySync" },
      { property: "og:description", content: "Monthly study calendar." },
    ],
  }),
  component: CalendarPage,
});
const LV = ["bg-heat-0", "bg-heat-1", "bg-heat-2", "bg-heat-3", "bg-heat-4"];

function CalendarPage() {
  const { data: user } = useUser();
  const { data: p } = useProgress(user?.id);
  const [month, setMonth] = useState(new Date());
  const [day, setDay] = useState<string | null>(null);
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const pad = (startOfMonth(month).getDay() + 6) % 7;
  const stat = (d: string) => p?.daily.find((x) => x.day === d);
  const sel = day ? stat(day) : undefined;
  const isCurrentMonth = format(month, "yyyy-MM") === format(new Date(), "yyyy-MM");

  return (
    <AppShell>
      <PageHeader
        title="Calendar"
        action={
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={() => setMonth(addMonths(month, -1))}
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="w-32 text-center font-medium">{format(month, "MMMM yyyy")}</span>
            <Button
              size="icon"
              variant="outline"
              onClick={() => setMonth(addMonths(month, 1))}
              aria-label="Next month"
            >
              <ChevronRight className="size-4" />
            </Button>
            {!isCurrentMonth && (
              <Button variant="outline" size="sm" onClick={() => setMonth(new Date())}>
                Today
              </Button>
            )}
          </div>
        }
      />
      <Panel>
        <div className="grid grid-cols-7 gap-1.5 text-center text-xs text-muted-foreground">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="pb-1">
              {d}
            </div>
          ))}
          {Array.from({ length: pad }).map((_, i) => (
            <div key={`p${i}`} />
          ))}
          {days.map((d) => {
            const s = stat(toStr(d));
            const pct = s ? dayPct(s) : 0;
            return (
              <button
                key={d.toISOString()}
                onClick={() => setDay(toStr(d))}
                className={cn(
                  "flex aspect-square flex-col items-start justify-between rounded-lg p-1.5 text-left transition hover:ring-1 hover:ring-primary",
                  LV[heatLevel(pct, s?.planned ?? 0)],
                  heatLevel(pct, s?.planned ?? 0) >= 3 && "text-primary-foreground",
                )}
              >
                <span className="text-xs font-medium">{format(d, "d")}</span>
                {s && s.planned > 0 && (
                  <span className="font-mono text-[10px]">{Math.round(pct)}%</span>
                )}
              </button>
            );
          })}
        </div>
      </Panel>
      <Dialog open={!!day} onOpenChange={(o) => !o && setDay(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{day && format(parse(day), "EEEE, MMMM d")}</DialogTitle>
          </DialogHeader>
          {sel && (
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{Math.round(dayPct(sel))}%</span> ·{" "}
              {hours(sel.completed)} / {hours(sel.planned)}h completed · {sel.done_tasks}/
              {sel.total_tasks} tasks
            </p>
          )}
          {day && <TaskList date={day} />}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
