import { useState } from "react";
import { addDays, format } from "date-fns";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { dayPct, heatLevel, type DayStat } from "@/lib/data";
import { hours, parse, toStr } from "@/lib/dates";
import { cn } from "@/lib/utils";

const LEVEL = ["bg-heat-0", "bg-heat-1", "bg-heat-2", "bg-heat-3", "bg-heat-4"];
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
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold">Activity</h2>
        <div className="flex rounded-lg bg-muted p-0.5 text-xs">
          {(Object.keys(RANGES) as (keyof typeof RANGES)[]).map((r) => (
            <button key={r} onClick={() => setRange(r)}
              className={cn("rounded-md px-2.5 py-1 font-medium transition", range === r ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto pb-1">
        <div className="flex w-max gap-[3px]">
          {weeks.map((w, i) => (
            <div key={i} className="flex flex-col gap-[3px]">
              {w.map((day) => {
                const s = map.get(day);
                const pct = s ? dayPct(s) : 0;
                return (
                  <Tooltip key={day}>
                    <TooltipTrigger asChild>
                      <div className={cn("size-3 rounded-[3px] transition hover:ring-1 hover:ring-foreground/40", LEVEL[heatLevel(pct, s?.planned ?? 0)])} />
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">
                      <div className="font-semibold">{format(parse(day), "MMMM d, yyyy")}</div>
                      {s && s.planned > 0 ? (
                        <>
                          <div>Completion: {Math.round(pct)}%</div>
                          <div>Completed: {hours(s.completed)} / {hours(s.planned)} hours</div>
                          <div>Tasks: {s.done_tasks} / {s.total_tasks}</div>
                        </>
                      ) : <div>No planned tasks</div>}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
        Less {LEVEL.map((l) => <span key={l} className={cn("size-2.5 rounded-[2px]", l)} />)} More
      </div>
    </div>
  );
}
