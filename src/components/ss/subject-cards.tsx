import { addDays } from "date-fns";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useSubjectStats } from "@/hooks/use-progress";
import { pctOf } from "@/lib/data";
import { hours, todayStr, toStr, weekStart } from "@/lib/dates";
import { EmptyState } from "./primitives";

export function SubjectCards({ userId, compact }: { userId: string | undefined; compact?: boolean }) {
  const ws = weekStart();
  const { data: cur = [], isLoading } = useSubjectStats(userId, toStr(ws), todayStr());
  const { data: prev = [] } = useSubjectStats(userId, toStr(addDays(ws, -7)), toStr(addDays(ws, -1)));
  if (isLoading) return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((k) => <div key={k} className="h-28 animate-pulse rounded-xl bg-muted" />)}</div>;
  if (cur.length === 0) return <EmptyState title="No subject data this week yet" body="Subject progress appears once tasks are scheduled." />;
  return (
    <div className={compact ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3" : "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"}>
      {cur.map((s) => {
        const pct = pctOf(s.completed, s.planned);
        const p = prev.find((x) => x.subject_id === s.subject_id);
        const delta = p ? Math.round(pct - pctOf(p.completed, p.planned)) : null;
        return (
          <div key={s.subject_id ?? "other"} className="rounded-xl border bg-background/40 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-medium">
                <span className="size-2.5 rounded-full" style={{ background: s.color }} />{s.name}
              </div>
              <span className="font-mono text-sm font-semibold tabular-nums">{Math.round(pct)}%</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: s.color }} />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-mono">{hours(s.completed)} / {hours(s.planned)}h</span>
              {delta !== null && (
                <span className="inline-flex items-center gap-1">
                  {delta >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                  {delta >= 0 ? "+" : ""}{delta}% vs last wk
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
