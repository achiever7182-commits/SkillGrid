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
  Trophy,
  User,
  UserPlus,
  Users,
  MessageSquare,
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
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/rewards", label: "Rewards", icon: Trophy },
  { to: "/history", label: "History", icon: History },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;
const MOBILE_NAV = NAV.filter((n) =>
  ["/dashboard", "/planner", "/tasks", "/messages", "/friends"].includes(n.to),
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
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-16 flex-col border-r border-border/60 bg-sidebar px-2 py-6 md:flex lg:w-64 lg:px-6">
        <Link to="/dashboard" className="mb-12 px-1 flex items-center gap-2">
          <Logo className="[&>span]:hidden lg:[&>span]:inline" />
        </Link>
        <p className="hidden lg:block text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase mb-4 px-2">Menu</p>
        <nav className="flex flex-1 flex-col gap-1.5">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium text-muted-foreground transition-all duration-300 hover:bg-secondary/50 hover:text-foreground"
              activeProps={{ className: "bg-accent/20 !text-primary font-semibold" }}
            >
              <n.icon className="size-4 shrink-0" strokeWidth={1.5} />
              <span className="hidden lg:inline">{n.label}</span>
            </Link>
          ))}
        </nav>
        {profile && (
          <div className="pt-6 border-t border-border/60 mt-auto">
            <Link
              to="/u/$username"
              params={{ username: profile.username }}
              className="flex items-center gap-3 rounded-md p-2 hover:bg-secondary/50 transition-colors"
            >
              <UserAvatar
                url={profile.avatar_url}
                name={profile.full_name || profile.username}
                size={36}
              />
              <div className="hidden min-w-0 lg:block">
                <div className="truncate text-sm font-medium text-foreground">
                  {profile.full_name || profile.username}
                </div>
                <div className="truncate text-xs text-muted-foreground">@{profile.username}</div>
              </div>
            </Link>
          </div>
        )}
      </aside>

      <div className="md:pl-16 lg:pl-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/60 bg-background/95 px-4 backdrop-blur-md md:px-8">
          <Link to="/dashboard" className="md:hidden">
            <Logo />
          </Link>
          <div className="hidden md:block" />
          <div className="flex items-center gap-2">
            <Link
              to="/friends"
              search={{ tab: "requests" }}
              className="relative grid size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Friend requests"
            >
              <UserPlus className="size-4" strokeWidth={1.5} />
              {requests > 0 && (
                <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-streak" />
              )}
            </Link>
            <Link
              to="/notifications"
              className="relative grid size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="size-4" strokeWidth={1.5} />
              {unread > 0 && (
                <span className="absolute right-0.5 top-0.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 font-mono text-[9px] font-semibold text-primary-foreground">
                  {unread}
                </span>
              )}
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger className="ml-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary ring-offset-2 ring-offset-background" aria-label="Account menu">
                <UserAvatar
                  url={profile?.avatar_url}
                  name={profile?.full_name || profile?.username}
                  size={32}
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl p-2 border-border/60 shadow-sm">
                <DropdownMenuLabel className="truncate font-normal text-xs text-muted-foreground">{user?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1 border-border/60" />
                {profile && (
                  <DropdownMenuItem asChild className="rounded-md cursor-pointer">
                    <Link to="/u/$username" params={{ username: profile.username }}>
                      <User className="size-4 mr-2" strokeWidth={1.5} />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild className="rounded-md cursor-pointer">
                  <Link to="/settings">
                    <Settings className="size-4 mr-2" strokeWidth={1.5} />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-md cursor-pointer">
                  <Link to="/history">
                    <History className="size-4 mr-2" strokeWidth={1.5} />
                    Task history
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1 border-border/60" />
                <DropdownMenuItem onClick={signOut} className="rounded-md cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                  <LogOut className="size-4 mr-2" strokeWidth={1.5} />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-10 md:px-8 md:pb-16 flex-1">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-border/60 bg-background/95 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur-md md:hidden">
        {MOBILE_NAV.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className="flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium text-muted-foreground transition-colors"
            activeProps={{ className: "!text-primary" }}
          >
            <n.icon className="size-5" strokeWidth={1.5} />
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
    <div className={cn("mb-10 pb-6 border-b border-border/60 flex flex-wrap items-end justify-between gap-6")}>
      <div className="max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground tracking-tight">{title}</h1>
        {subtitle && <p className="mt-3 text-base text-muted-foreground leading-relaxed">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
