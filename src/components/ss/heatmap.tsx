import { useState } from "react";
import { addDays, format } from "date-fns";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { dayPct, heatLevel, type DayStat } from "@/lib/data";
import { hours, parse, toStr } from "@/lib/dates";
import { cn } from "@/lib/utils";

const LEVEL = ["bg-heat-0 border-border/40", "bg-heat-1 border-heat-1", "bg-heat-2 border-heat-2", "bg-heat-3 border-heat-3", "bg-heat-4 border-heat-4"];
const RANGES = { "3M": 91, "6M": 182, "1Y": 364 } as const;

export function Heatmap({ daily }: { daily: DayStat[] }) {
  const [range, setRange] = useState<keyof typeof RANGES>("6M");
  const map = new Map(daily.map((d) => [d.day, d]));
  const today = new Date();
  let start = addDays(today, -RANGES[range]);
  start = addDays(start, -((start.getDay() + 6) % 7)); // align to Monday
  const weeks: string[][] = [];
  for (let d = start; d <= today; d = addDays(d, 1)) {
    const idx = Math.floor((d.getTime() - start.getTime()) / 864e5 / 7);
    (weeks[idx] ??= []).push(toStr(d));
  }
  return (
    <div>
      <div className="mb-6 flex justify-end">
        <div className="flex rounded-md border border-border/60 bg-transparent p-0.5 text-xs">
          {(Object.keys(RANGES) as (keyof typeof RANGES)[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "rounded-sm px-3 py-1 font-mono text-[10px] tracking-widest uppercase transition-colors",
                range === r
                  ? "bg-secondary text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="flex w-max gap-1">
          {weeks.map((w, i) => (
            <div key={i} className="flex flex-col gap-1">
              {w.map((day) => {
                const s = map.get(day);
                const pct = s ? dayPct(s) : 0;
                return (
                  <Tooltip key={day}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "size-3.5 rounded-[2px] border transition-all duration-300 hover:ring-1 hover:ring-primary/40 hover:ring-offset-1 hover:ring-offset-background",
                          LEVEL[heatLevel(pct, s?.planned ?? 0)],
                        )}
                      />
                    </TooltipTrigger>
                    <TooltipContent className="text-xs rounded-lg border-border/60 shadow-sm px-3 py-2">
                      <div className="font-display font-medium text-base mb-1">{format(parse(day), "MMMM d, yyyy")}</div>
                      {s && s.planned > 0 ? (
                        <div className="space-y-1 font-sans text-muted-foreground">
                          <div>Completion: <span className="text-foreground font-medium">{Math.round(pct)}%</span></div>
                          <div>
                            Completed: <span className="text-foreground font-medium">{hours(s.completed)} / {hours(s.planned)}</span> hours
                          </div>
                          <div>
                            Tasks: <span className="text-foreground font-medium">{s.done_tasks} / {s.total_tasks}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-muted-foreground">No planned tasks</div>
                      )}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-end gap-1.5 text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
        Less{" "}
        {LEVEL.map((l) => (
          <span key={l} className={cn("size-2.5 rounded-[1px] border", l)} />
        ))}{" "}
        More
      </div>
    </div>
  );
}
