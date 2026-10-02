import { addDays } from "date-fns";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useSubjectStats } from "@/hooks/use-progress";
import { pctOf } from "@/lib/data";
import { hours, todayStr, toStr, weekStart } from "@/lib/dates";
import { EmptyState } from "./primitives";

export function SubjectCards({
  userId,
  compact,
  from,
  to,
}: {
  userId: string | undefined;
  compact?: boolean;
  from?: string;
  to?: string;
}) {
  const ws = weekStart();
  const effectiveFrom = from ?? toStr(ws);
  const effectiveTo = to ?? todayStr();
  const { data: cur = [], isLoading } = useSubjectStats(userId, effectiveFrom, effectiveTo);
  const { data: prev = [] } = useSubjectStats(
    userId,
    toStr(addDays(ws, -7)),
    toStr(addDays(ws, -1)),
  );
  if (isLoading)
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((k) => (
          <div key={k} className="h-28 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  if (cur.length === 0)
    return (
      <EmptyState
        title="No subject data for this period"
        body="Subject progress appears once tasks are scheduled."
      />
    );
  return (
    <div
      className={
        compact
          ? "grid gap-4 sm:grid-cols-2"
          : "grid gap-6 sm:grid-cols-2"
      }
    >
      {cur.map((s) => {
        const pct = pctOf(s.completed, s.planned);
        const p = prev.find((x) => x.subject_id === s.subject_id);
        const delta = p ? Math.round(pct - pctOf(p.completed, p.planned)) : null;
        return (
          <div key={s.subject_id ?? "other"} className="border-b border-border/60 pb-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} />
                <h3 className="font-display text-2xl font-medium tracking-tight text-foreground leading-none">{s.name}</h3>
              </div>
              <span className="font-mono text-lg font-medium opacity-80">
                {Math.round(pct)}%
              </span>
            </div>
            
            <div className="flex items-center justify-between text-[11px] uppercase font-bold tracking-widest text-muted-foreground mb-3">
              <span className="font-mono">
                {hours(s.completed)} / {hours(s.planned)}h
              </span>
              <span className="font-mono">
                {s.done_tasks}/{s.total_tasks} tasks
              </span>
              {delta !== null && (
                <span className="inline-flex items-center gap-1 opacity-80">
                  {delta >= 0 ? (
                    <TrendingUp className="size-3" strokeWidth={2.5} />
                  ) : (
                    <TrendingDown className="size-3" strokeWidth={2.5} />
                  )}
                  {delta >= 0 ? "+" : ""}
                  {delta}% vs last wk
                </span>
              )}
            </div>

            <div className="h-0.5 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, backgroundColor: s.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
