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
      { title: "Calendar â€” SkillGrid" },
      { name: "description", content: "Monthly study calendar." },
      { property: "og:title", content: "Calendar â€” SkillGrid" },
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
              className="rounded-full size-8 border-border/60"
            >
              <ChevronLeft className="size-4" strokeWidth={1.5} />
            </Button>
            <span className="w-36 text-center font-medium font-mono text-sm tracking-wide uppercase">{format(month, "MMMM yyyy")}</span>
            <Button
              size="icon"
              variant="outline"
              onClick={() => setMonth(addMonths(month, 1))}
              aria-label="Next month"
              className="rounded-full size-8 border-border/60"
            >
              <ChevronRight className="size-4" strokeWidth={1.5} />
            </Button>
            {!isCurrentMonth && (
              <Button variant="outline" size="sm" onClick={() => setMonth(new Date())} className="rounded-full border-border/60 px-4 ml-2">
                Today
              </Button>
            )}
          </div>
        }
      />
      <Panel className="mb-8">
        <div className="grid grid-cols-7 gap-3 text-center text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-4 mt-2">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="pb-2 border-b border-border/40">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: pad }).map((_, i) => (
            <div key={`p${i}`} className="min-h-16" />
          ))}
          {days.map((d) => {
            const s = stat(toStr(d));
            const pct = s ? dayPct(s) : 0;
            const level = heatLevel(pct, s?.planned ?? 0);
            return (
              <button
                key={d.toISOString()}
                onClick={() => setDay(toStr(d))}
                className={cn(
                  "flex min-h-16 flex-col items-start justify-between rounded-md p-2.5 text-left transition-all duration-300 border border-border/20 hover:border-primary/50 hover:shadow-sm",
                  LV[level],
                  level >= 3 && "text-primary-foreground border-transparent",
                  !s?.planned && "bg-transparent border-border/40 hover:bg-secondary/30"
                )}
              >
                <span className="text-sm font-display font-bold">{format(d, "d")}</span>
                {s && s.planned > 0 && (
                  <span className="font-mono text-[10px] opacity-80 mt-1">{Math.round(pct)}%</span>
                )}
              </button>
            );
          })}
        </div>
      </Panel>
      <Dialog open={!!day} onOpenChange={(o) => !o && setDay(null)}>
        <DialogContent className="max-w-xl rounded-xl">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-2xl">{day && format(parse(day), "EEEE, MMMM d")}</DialogTitle>
          </DialogHeader>
          {sel && (
            <p className="text-sm text-muted-foreground uppercase tracking-widest font-mono text-[11px] font-bold flex items-center gap-2">
              <span className="text-primary text-sm">{Math.round(dayPct(sel))}%</span> <span className="opacity-50">Â·</span>{" "}
              {hours(sel.completed)} / {hours(sel.planned)}h completed <span className="opacity-50">Â·</span> {sel.done_tasks}/
              {sel.total_tasks} tasks
            </p>
          )}
          {day && <TaskList date={day} />}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
