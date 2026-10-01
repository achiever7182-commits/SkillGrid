import { format } from "date-fns";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { dayPct, pctOf, type DayStat } from "@/lib/data";
import { hours, parse } from "@/lib/dates";

const axis = { fontSize: 11, fill: "var(--color-muted-foreground)" };
const tipStyle = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 10,
  fontSize: 12,
  color: "var(--color-foreground)",
};

export function WeeklyBarChart({ days }: { days: DayStat[] }) {
  const data = days.map((d) => ({ name: format(parse(d.day), "EEE"), pct: Math.round(dayPct(d)) }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ left: -20, right: 4, top: 8 }}>
        <CartesianGrid vertical={false} stroke="var(--color-border)" />
        <XAxis dataKey="name" tick={axis} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={axis} axisLine={false} tickLine={false} unit="%" />
        <Tooltip
          cursor={{ fill: "var(--color-muted)", opacity: 0.4 }}
          contentStyle={tipStyle}
          formatter={(v) => [`${v}%`, "Completion"]}
        />
        <Bar dataKey="pct" fill="var(--color-primary)" radius={[6, 6, 2, 2]} maxBarSize={36} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function WeeklyLineChart({ days }: { days: DayStat[] }) {
  let p = 0,
    c = 0;
  const data = days.map((d) => {
    p += d.planned;
    c += d.completed;
    return {
      name: format(parse(d.day), "EEE"),
      planned: hours(p),
      completed: hours(c),
      pct: pctOf(c, p),
    };
  });
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ left: -20, right: 4, top: 8 }}>
        <defs>
          <linearGradient id="fillC" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--color-border)" />
        <XAxis dataKey="name" tick={axis} axisLine={false} tickLine={false} />
        <YAxis tick={axis} axisLine={false} tickLine={false} unit="h" />
        <Tooltip contentStyle={tipStyle} />
        <Area
          type="monotone"
          dataKey="planned"
          name="Planned (h)"
          stroke="var(--color-muted-foreground)"
          strokeDasharray="4 4"
          fill="transparent"
        />
        <Area
          type="monotone"
          dataKey="completed"
          name="Completed (h)"
          stroke="var(--color-primary)"
          strokeWidth={2}
          fill="url(#fillC)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
