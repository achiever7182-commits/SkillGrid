import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="font-display text-2xl font-bold tracking-tight text-primary">
        SkillGrid.
      </div>
    </div>
  );
}

export function Panel({ className, children, noBorder = false }: { className?: string; children: ReactNode; noBorder?: boolean }) {
  return <div className={cn("rounded-xl p-6", !noBorder && "bg-card border border-border/60 shadow-sm", className)}>{children}</div>;
}

export function SectionTitle({ children, action, index }: { children: ReactNode; action?: ReactNode; index?: string }) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4 border-b border-border/60 pb-3">
      <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/90">
        {index ? `${index} — ` : ""}{children}
      </h2>
      {action}
    </div>
  );
}

export function ProgressRing({
  value,
  size = 140,
  stroke = 3,
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (v / 100) * c}
          style={{ transition: "stroke-dashoffset 700ms cubic-bezier(.2,.8,.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-primary font-display font-bold">{children}</div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 py-4">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
        {icon && <span className="opacity-50">{icon}</span>}
      </div>
      <div className="font-display text-5xl lg:text-6xl font-bold text-primary tracking-tight mt-2 mb-3">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground uppercase tracking-widest font-semibold">{sub}</div>}
    </div>
  );
}

export function UserAvatar({
  url,
  name,
  size = 36,
}: {
  url?: string | null | undefined;
  name?: string | null | undefined;
  size?: number;
}) {
  const initials = (name || "?")
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return url ? (
    <img
      src={url}
      alt={name ?? "avatar"}
      width={size}
      height={size}
      className="shrink-0 rounded-full border border-border/50 object-cover"
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className="grid shrink-0 place-items-center rounded-full bg-secondary border border-border/60 font-sans text-xs font-semibold text-secondary-foreground"
      style={{ width: size, height: size }}
    >
      {initials}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border/50 bg-secondary/20 px-8 py-16 text-center">
      {icon && <div className="text-primary/60 mb-2">{icon}</div>}
      <h3 className="font-display text-2xl font-bold text-foreground">{title}</h3>
      {body && <p className="max-w-md text-sm text-muted-foreground leading-relaxed">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
