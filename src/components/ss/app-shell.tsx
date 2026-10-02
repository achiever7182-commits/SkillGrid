import { useEffect, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  Bell,
  CalendarDays,
  History,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Settings,
  User,
  UserPlus,
  Users,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useSettings, useUser } from "@/hooks/use-session";
import { useProgress } from "@/hooks/use-progress";
import { ensureInstances, dayPct } from "@/lib/data";
import { daysAgo, todayStr } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { Logo, UserAvatar } from "./primitives";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/planner", label: "Planner", icon: CalendarDays },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/friends", label: "Friends", icon: Users },
  { to: "/history", label: "History", icon: History },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;
const MOBILE_NAV = NAV.filter((n) =>
  ["/dashboard", "/planner", "/tasks", "/analytics", "/friends"].includes(n.to),
);

export function AppShell({ children }: { children: ReactNode }) {
  const { data: user } = useUser();
  const { data: profile } = useProfile();
  const { data: settings } = useSettings();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (profile && !profile.onboarded && path !== "/onboarding") navigate({ to: "/onboarding" });
  }, [profile, path, navigate]);

  // Generate today's (and any missed) task instances once per session/day.
  const sync = useQuery({
    queryKey: ["sync-instances", user?.id, todayStr()],
    enabled: !!user && !!profile?.onboarded,
    staleTime: Infinity,
    queryFn: async () => {
      await ensureInstances(user!.id, daysAgo(365));
      qc.invalidateQueries({ queryKey: ["progress"] });
      qc.invalidateQueries({ queryKey: ["instances"] });
      return true;
    },
  });

  const progress = useProgress(sync.data ? user?.id : undefined);

  // Daily reminder (opt-in) — once per day in the evening when behind.
  useEffect(() => {
    if (!user || !settings?.daily_reminders || !progress.data) return;
    const t = progress.data.today;
    if (new Date().getHours() >= 18 && t.planned > 0 && dayPct(t) < 50) {
      supabase
        .from("notifications")
        .upsert(
          {
            user_id: user.id,
            type: "reminder",
            message: `You're at ${Math.round(dayPct(t))}% today — a focused session could change that.`,
            link: "/dashboard",
            dedupe_key: `reminder:${todayStr()}`,
          },
          { onConflict: "user_id,dedupe_key", ignoreDuplicates: true },
        )
        .then(() => qc.invalidateQueries({ queryKey: ["notifications"] }));
    }
  }, [user, settings?.daily_reminders, progress.data, qc]);

  // Streak milestone alerts (opt-in) — sends milestone notifications when enabled in settings.
  useEffect(() => {
    if (!user || !settings?.notify_streaks || !progress.data) return;
    const currentStreak = progress.data.streak.current;
    if (currentStreak < 3) return;

    const milestones = [3, 5, 7, 10, 14, 21, 30, 45, 50, 60, 75, 90, 100, 150, 200, 250, 300, 365];
    const isMilestone =
      milestones.includes(currentStreak) || (currentStreak > 30 && currentStreak % 10 === 0);

    if (isMilestone) {
      supabase
        .from("notifications")
        .upsert(
          {
            user_id: user.id,
            type: "streak_milestone",
            message: `🔥 Milestone reached! You've achieved a ${currentStreak}-day study streak! Keep up the momentum.`,
            link: "/dashboard",
            dedupe_key: `streak_milestone:${user.id}:${currentStreak}`,
          },
          { onConflict: "user_id,dedupe_key", ignoreDuplicates: true },
        )
        .then(() => qc.invalidateQueries({ queryKey: ["notifications"] }));
    }
  }, [user, settings?.notify_streaks, progress.data, qc]);

  const notifs = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id,type,read")
        .eq("user_id", user!.id)
        .eq("read", false);
      return data ?? [];
    },
  });
  const unread = notifs.data?.length ?? 0;
  const requests = notifs.data?.filter((n) => n.type === "friend_request").length ?? 0;

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-16 flex-col border-r bg-sidebar px-2 py-4 md:flex lg:w-60 lg:px-4">
        <Link to="/dashboard" className="mb-8 px-1">
          <Logo className="[&>span]:hidden lg:[&>span]:inline" />
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground"
              activeProps={{ className: "bg-sidebar-accent !text-foreground" }}
            >
              <n.icon className="size-4.5 shrink-0" />
              <span className="hidden lg:inline">{n.label}</span>
            </Link>
          ))}
        </nav>
        {profile && (
          <Link
            to="/u/$username"
            params={{ username: profile.username }}
            className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-sidebar-accent"
          >
            <UserAvatar
              url={profile.avatar_url}
              name={profile.full_name || profile.username}
              size={32}
            />
            <div className="hidden min-w-0 lg:block">
              <div className="truncate text-sm font-medium">
                {profile.full_name || profile.username}
              </div>
              <div className="truncate text-xs text-muted-foreground">@{profile.username}</div>
            </div>
          </Link>
        )}
      </aside>

      <div className="md:pl-16 lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur md:px-8">
          <Link to="/dashboard" className="md:hidden">
            <Logo />
          </Link>
          <div className="hidden md:block" />
          <div className="flex items-center gap-1">
            <Link
              to="/friends"
              search={{ tab: "requests" }}
              className="relative grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Friend requests"
            >
              <UserPlus className="size-4.5" />
              {requests > 0 && (
                <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-streak" />
              )}
            </Link>
            <Link
              to="/notifications"
              className="relative grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="size-4.5" />
              {unread > 0 && (
                <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-primary px-1 font-mono text-[10px] font-semibold text-primary-foreground">
                  {unread}
                </span>
              )}
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger className="ml-1 rounded-full" aria-label="Account menu">
                <UserAvatar
                  url={profile?.avatar_url}
                  name={profile?.full_name || profile?.username}
                  size={32}
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="truncate">{user?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {profile && (
                  <DropdownMenuItem asChild>
                    <Link to="/u/$username" params={{ username: profile.username }}>
                      <User className="size-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link to="/settings">
                    <Settings className="size-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/history">
                    <History className="size-4" />
                    Task history
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 md:px-8 md:pb-12">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {MOBILE_NAV.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] text-muted-foreground"
            activeProps={{ className: "!text-primary" }}
          >
            <n.icon className="size-5" />
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-end justify-between gap-3")}>
      <div>
        <h1 className="text-2xl font-semibold md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
