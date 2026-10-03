import { addDays, differenceInCalendarDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { parse, toStr, todayStr } from "./dates";

export const SUBJECT_PRESETS: { name: string; color: string }[] = [
  { name: "DSA", color: "#a3e635" },
  { name: "AI/ML", color: "#38bdf8" },
  { name: "Data Science", color: "#2dd4bf" },
  { name: "Mathematics", color: "#facc15" },
  { name: "Cybersecurity", color: "#f87171" },
  { name: "Game Development", color: "#c084fc" },
  { name: "Web Development", color: "#fb923c" },
  { name: "Science Lecture", color: "#94a3b8" },
];
export const EXTRA_COLORS = ["#f472b6", "#4ade80", "#60a5fa", "#fbbf24", "#e879f9", "#22d3ee"];

const WEEKDAYS = [1, 2, 3, 4, 5];
const WEEKEND = [0, 6];
// Default template: subject -> [days, minutes]
export const DEFAULT_SCHEDULE: { subject: string; days: number[]; minutes: number }[] = [
  { subject: "DSA", days: [...WEEKDAYS, ...WEEKEND], minutes: 150 },
  { subject: "Mathematics", days: [...WEEKDAYS, ...WEEKEND], minutes: 120 },
  { subject: "AI/ML", days: WEEKDAYS, minutes: 120 },
  { subject: "Cybersecurity", days: WEEKEND, minutes: 120 },
  { subject: "Game Development", days: WEEKEND, minutes: 120 },
  { subject: "Science Lecture", days: [...WEEKDAYS, ...WEEKEND], minutes: 30 },
];

export type Task = {
  id: string;
  title: string;
  description: string | null;
  subject_id: string | null;
  planned_minutes: number;
  days_of_week: number[];
  recurring: boolean;
  start_date: string;
  end_date: string | null;
};

function taskAppliesOn(t: Task, date: string) {
  if (date < t.start_date) return false;
  if (t.end_date && date > t.end_date) return false;
  if (!t.recurring) return date === t.start_date;
  return t.days_of_week.includes(parse(date).getDay());
}

/** Generate missing task instances for [from, min(to, today+60d)]. Idempotent. */
export async function ensureInstances(userId: string, from: string, to?: string) {
  const maxHorizon = toStr(addDays(new Date(), 60));
  const end = to ? (to > maxHorizon ? maxHorizon : to) : maxHorizon;
  if (from > end) return;
  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("archived", false);
  if (error) throw error;
  const rows: {
    task_id: string;
    user_id: string;
    subject_id: string | null;
    title: string;
    description: string | null;
    date: string;
    planned_minutes: number;
  }[] = [];
  for (const t of tasks ?? []) {
    const start = t.start_date > from ? t.start_date : from;
    const taskEnd = t.end_date && t.end_date < end ? t.end_date : end;
    if (start > taskEnd) continue;
    const n = differenceInCalendarDays(parse(taskEnd), parse(start));
    for (let i = 0; i <= n; i++) {
      const d = toStr(addDays(parse(start), i));
      if (taskAppliesOn(t, d))
        rows.push({
          task_id: t.id,
          user_id: userId,
          subject_id: t.subject_id,
          title: t.title,
          description: t.description,
          date: d,
          planned_minutes: t.planned_minutes,
        });
    }
  }
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);
    const { error: e } = await supabase
      .from("task_instances")
      .upsert(batch, { onConflict: "task_id,date", ignoreDuplicates: true });
    if (e) {
      // Fallback if description column has not been added to task_instances schema yet
      if (
        e.message?.includes("description") ||
        e.code === "PGRST204" ||
        String((e as any)?.details || "").includes("description")
      ) {
        const fallbackBatch = batch.map(({ description, ...rest }) => rest);
        const { error: fallbackError } = await supabase
          .from("task_instances")
          .upsert(fallbackBatch, { onConflict: "task_id,date", ignoreDuplicates: true });
        if (fallbackError) throw fallbackError;
      } else {
        throw e;
      }
    }
  }
}

export type DayStat = {
  day: string;
  planned: number;
  completed: number;
  total_tasks: number;
  done_tasks: number;
};

export const pctOf = (done: number, total: number) =>
  total > 0 ? Math.round((done / total) * 1000) / 10 : 0;
export const dayPct = (d: Pick<DayStat, "planned" | "completed">) => pctOf(d.completed, d.planned);

export function computeStreaks(stats: DayStat[], threshold: number) {
  const today = todayStr();
  const pastAndToday = stats.filter((d) => d.day <= today);
  const qualifies = (d: DayStat) => d.planned > 0 && dayPct(d) >= threshold;
  let longest = 0,
    run = 0;
  for (const d of pastAndToday) {
    if (d.planned === 0) continue; // rest day: neither counts nor breaks
    if (qualifies(d)) {
      run++;
      longest = Math.max(longest, run);
    } else if (d.day !== today) {
      run = 0;
    }
  }
  let current = 0;
  for (let i = pastAndToday.length - 1; i >= 0; i--) {
    const d = pastAndToday[i];
    if (!d || d.planned === 0) continue;
    if (qualifies(d)) {
      current++;
    } else if (d.day === today) {
      continue; // today still in progress
    } else {
      break;
    }
  }
  return { current, longest };
}

export function heatLevel(pct: number, planned: number) {
  if (planned === 0 || pct === 0) return 0;
  if (pct <= 25) return 1;
  if (pct <= 50) return 2;
  if (pct <= 75) return 3;
  return 4;
}

export async function fetchDailyStats(
  userId: string,
  from: string,
  to: string,
): Promise<DayStat[]> {
  const { data, error } = await supabase.rpc("get_daily_stats", {
    _user: userId,
    _from: from,
    _to: to,
  });
  if (error) throw error;
  return (data ?? []).map((r) => ({ ...r, day: String(r.day) }));
}

export function streakMessage(current: number) {
  if (current === 0) return "Hit today's goal to start a streak.";
  const milestones = [3, 7, 14, 30, 50, 100, 365];
  const next = milestones.find((m) => m > current);
  if (!next) return `${current}-day streak. Remarkable.`;
  const left = next - current;
  return left === 1 ? `One more day to reach ${next}!` : `${left} days to reach ${next}.`;
}
