import { Check } from "lucide-react";
import ContributionSkyline from "@/components/ui/contribution-skyline";
import { dayPct, heatLevel, pctOf, type DayStat } from "@/lib/data";
import { hours } from "@/lib/dates";

export function Heatmap({ daily, streakCurrent = 0, streakLongest = 0 }: { daily: DayStat[], streakCurrent?: number, streakLongest?: number }) {
  const skylineData = daily.map((d) => ({
    date: d.day,
    count: heatLevel(dayPct(d), d.planned),
  }));

  const dailyMap = new Map(daily.map((d) => [d.day, d]));
  const totalCompletedMinutes = daily.reduce((acc, d) => acc + d.completed, 0);
  const activeDays = daily.filter(d => pctOf(d.completed, d.planned) > 0).length;

  return (
    <div className="w-full">
      <ContributionSkyline 
        data={skylineData} 
        statCurrentStreak={streakCurrent}
        statLongestStreak={streakLongest}
        statActiveDays={activeDays}
        statTotalTime={`${hours(totalCompletedMinutes)}h`}
        renderTooltip={(cell) => {
          if (!cell) return null;
          const stat = dailyMap.get(cell.date);
          const p = stat ? pctOf(stat.completed, stat.planned) : 0;
          return (
            <div className="flex flex-col gap-1.5 min-w-[120px]">
              {stat && stat.completed > 0 ? (
                <>
                  <div className="font-semibold text-primary-foreground text-sm flex items-center gap-1.5">
                    {hours(stat.completed)}h productive
                  </div>
                  <div className="text-muted-foreground">Goal: {hours(stat.planned)}h</div>
                  <div className="text-muted-foreground">{Math.round(p)}% of goal</div>
                  {p >= 100 && (
                    <div className="text-[11px] font-bold tracking-wide uppercase mt-0.5 flex items-center gap-1 text-[#D7A7B1]">
                      <Check className="size-3" strokeWidth={3} /> Goal completed
                    </div>
                  )}
                </>
              ) : (
                <div className="text-muted-foreground">No tracked activity</div>
              )}
            </div>
          );
        }}
      />
    </div>
  );
}
