import { useQuery } from "@tanstack/react-query";
import { addDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { computeStreaks, fetchDailyStats, pctOf } from "@/lib/data";
import { daysAgo, todayStr, toStr, weekStart } from "@/lib/dates";

export type SubjectStat = {
  subject_id: string | null;
  name: string;
  color: string;
  planned: number;
  completed: number;
  total_tasks: number;
  done_tasks: number;
};

/** Full progress summary for any user the viewer is allowed to see (RLS + RPC enforce privacy). */
export function useProgress(userId: string | undefined) {
  return useQuery({
    queryKey: ["progress", userId],
    enabled: !!userId,
    queryFn: async () => {
      const futureHorizon = toStr(addDays(new Date(), 60));
      const [daily, thr] = await Promise.all([
        fetchDailyStats(userId!, daysAgo(370), futureHorizon),
        supabase.rpc("get_streak_threshold", { _user: userId! }),
      ]);
      const visible = daily.length > 0 && thr.data != null;
      const threshold = thr.data ?? 70;
      const streak = computeStreaks(daily, threshold);
      const ws = toStr(weekStart());
      const week = daily.filter((d) => d.day >= ws && d.day <= toStr(addDays(weekStart(), 6)));
      const month = daily.filter((d) => d.day >= daysAgo(29) && d.day <= todayStr());
      const pastAndToday = daily.filter((d) => d.day <= todayStr());
      const sum = (arr: typeof daily, k: "planned" | "completed" | "total_tasks" | "done_tasks") =>
        arr.reduce((a, d) => a + d[k], 0);
      const today = daily.find((d) => d.day === todayStr()) ?? {
        day: todayStr(),
        planned: 0,
        completed: 0,
        total_tasks: 0,
        done_tasks: 0,
      };
      return {
        visible,
        threshold,
        daily,
        today,
        streak,
        weekDays: Array.from({ length: 7 }, (_, i) => {
          const d = toStr(addDays(weekStart(), i));
          return (
            daily.find((w) => w.day === d) ?? {
              day: d,
              planned: 0,
              completed: 0,
              total_tasks: 0,
              done_tasks: 0,
            }
          );
        }),
        week: {
          planned: sum(week, "planned"),
          completed: sum(week, "completed"),
          tasks: sum(week, "total_tasks"),
          done: sum(week, "done_tasks"),
          pct: pctOf(sum(week, "completed"), sum(week, "planned")),
        },
        month: { pct: pctOf(sum(month, "completed"), sum(month, "planned")) },
        totalMinutes: sum(pastAndToday, "completed"),
      };
    },
  });
}

export function useSubjectStats(userId: string | undefined, from: string, to: string) {
  return useQuery({
    queryKey: ["subject-stats", userId, from, to],
    enabled: !!userId,
    queryFn: async (): Promise<SubjectStat[]> => {
      const { data, error } = await supabase.rpc("get_subject_stats", {
        _user: userId!,
        _from: from,
        _to: to,
      });
      if (error) throw error;
      const subjects = data ?? [];

      // Query task counts for this range to provide total and completed task numbers
      const { data: instances } = await supabase
        .from("task_instances")
        .select("subject_id, completed")
        .eq("user_id", userId!)
        .gte("date", from)
        .lte("date", to);

      const countMap = new Map<string, { total: number; done: number }>();
      for (const inst of instances ?? []) {
        const sid = inst.subject_id ?? "other";
        const entry = countMap.get(sid) ?? { total: 0, done: 0 };
        entry.total++;
        if (inst.completed) entry.done++;
        countMap.set(sid, entry);
      }

      return subjects.map((s) => {
        const counts = countMap.get(s.subject_id ?? "other");
        return {
          ...s,
          total_tasks: counts?.total ?? 0,
          done_tasks: counts?.done ?? 0,
        };
      });
    },
  });
}
