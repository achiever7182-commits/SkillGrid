import { addDays, format, parseISO, startOfWeek } from "date-fns";

export const toStr = (d: Date) => format(d, "yyyy-MM-dd");
export const todayStr = () => toStr(new Date());
export const daysAgo = (n: number) => toStr(addDays(new Date(), -n));
export const parse = (s: string) => parseISO(s);
export const weekStart = (d = new Date()) => startOfWeek(d, { weekStartsOn: 1 });
export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function fmtMinutes(m: number) {
  if (m < 60) return `${m}m`;
  const h = m / 60;
  return `${Number.isInteger(h) ? h : h.toFixed(1)}h`;
}
export const hours = (m: number) => Math.round((m / 60) * 10) / 10;

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
