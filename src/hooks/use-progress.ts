import { useQuery } from "@tanstack/react-query";
import { addDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { computeStreaks, fetchDailyStats, pctOf } from "@/lib/data";
import { daysAgo, todayStr, toStr, weekStart } from "@/lib/dates";

/** Full progress summary for any user the viewer is allowed to see (RLS + RPC enforce privacy). */
export function useProgress(userId: string | undefined) {
  return useQuery({
    queryKey: ["progress", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [daily, thr] = await Promise.all([
        fetchDailyStats(userId!, daysAgo(370), todayStr()),
        supabase.rpc("get_streak_threshold", { _user: userId! }),
      ]);
      const visible = daily.length > 0 && thr.data != null;
      const threshold = thr.data ?? 70;
      const streak = computeStreaks(daily, threshold);
      const ws = toStr(weekStart());
      const week = daily.filter((d) => d.day >= ws);
      const month = daily.filter((d) => d.day >= daysAgo(29));
      const sum = (arr: typeof daily, k: "planned" | "completed" | "total_tasks" | "done_tasks") =>
        arr.reduce((a, d) => a + d[k], 0);
      const today = daily[daily.length - 1] ?? { day: todayStr(), planned: 0, completed: 0, total_tasks: 0, done_tasks: 0 };
      return {
        visible,
        threshold,
        daily,
        today,
        streak,
        weekDays: Array.from({ length: 7 }, (_, i) => {
          const d = toStr(addDays(weekStart(), i));
          return week.find((w) => w.day === d) ?? { day: d, planned: 0, completed: 0, total_tasks: 0, done_tasks: 0 };
        }),
        week: {
          planned: sum(week, "planned"),
          completed: sum(week, "completed"),
          tasks: sum(week, "total_tasks"),
          done: sum(week, "done_tasks"),
          pct: pctOf(sum(week, "completed"), sum(week, "planned")),
        },
        month: { pct: pctOf(sum(month, "completed"), sum(month, "planned")) },
        totalMinutes: sum(daily, "completed"),
      };
    },
  });
}

export function useSubjectStats(userId: string | undefined, from: string, to: string) {
  return useQuery({
    queryKey: ["subject-stats", userId, from, to],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_subject_stats", { _user: userId!, _from: from, _to: to });
      if (error) throw error;
      return data ?? [];
    },
  });
}
