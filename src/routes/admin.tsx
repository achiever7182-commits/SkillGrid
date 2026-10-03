import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  ShieldCheck,
  LogOut,
  Activity,
  TrendingUp,
  BookOpen,
  Star,
  Eye,
  EyeOff,
  Search,
  Calendar,
  Clock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — SkillGrid" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const ADMIN_USERNAME = "Admin@9700";
const ADMIN_PASSWORD = "Admin@123#nin";
const SESSION_KEY = "sg_admin_auth";

function AdminPage() {
  const [authed, setAuthed] = useState(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      return false;
    }
  });

  function handleLogin() {
    sessionStorage.setItem(SESSION_KEY, "1");
    setAuthed(true);
  }

  function handleLogout() {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthed(false);
  }

  if (!authed) return <AdminLogin onLogin={handleLogin} />;
  return <AdminDashboard onLogout={handleLogout} />;
}

/* ─── Login ──────────────────────────────────────────────────────────── */
function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setTimeout(() => {
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        onLogin();
      } else {
        setError("Invalid admin credentials.");
      }
      setLoading(false);
    }, 600);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <div className="size-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 shadow-lg shadow-primary/10">
            <ShieldCheck className="size-8 text-primary" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">Admin Access</h1>
          <p className="text-sm text-muted-foreground mt-1">SkillGrid Control Panel</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-7 shadow-sm flex flex-col gap-5"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="admin-username" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Username
            </label>
            <input
              id="admin-username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-10 rounded-md border border-border/60 bg-background px-3 text-sm font-mono text-foreground outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all"
              placeholder="Admin username"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="admin-password" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Password
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 w-full rounded-md border border-border/60 bg-background px-3 pr-10 text-sm text-foreground outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all"
                placeholder="Password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-destructive rounded-md bg-destructive/10 px-3 py-2 border border-destructive/20">
              {error}
            </p>
          )}

          <button
            id="admin-login-btn"
            type="submit"
            disabled={loading}
            className="h-10 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.99] disabled:opacity-60 transition-all mt-1"
          >
            {loading ? "Verifying…" : "Sign in as Admin"}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Restricted access — authorized personnel only
        </p>
      </div>
    </div>
  );
}

/* ─── Dashboard ──────────────────────────────────────────────────────── */
function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [search, setSearch] = useState("");

  const { data: members, isLoading } = useQuery({
    queryKey: ["admin-members"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, username, full_name, college, graduation_year, created_at, onboarded, avatar_url, bio",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: activityData } = useQuery({
    queryKey: ["admin-activity"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activities")
        .select("user_id, created_at")
        .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString());
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: taskData } = useQuery({
    queryKey: ["admin-tasks"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_instances")
        .select("user_id, completed, date")
        .gte("date", new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10));
      if (error) throw error;
      return data ?? [];
    },
  });

  const activeUserIds = new Set(activityData?.map((a) => a.user_id) ?? []);
  const taskUserIds = new Set(taskData?.map((t) => t.user_id) ?? []);
  const completedTasks = taskData?.filter((t) => t.completed).length ?? 0;

  const totalMembers = members?.length ?? 0;
  const onboardedMembers = members?.filter((m) => m.onboarded).length ?? 0;
  const activeThisWeek = members?.filter((m) => activeUserIds.has(m.id)).length ?? 0;

  const filtered = (members ?? []).filter(
    (m) =>
      !search ||
      m.username.toLowerCase().includes(search.toLowerCase()) ||
      m.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (m.college ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const stats = [
    {
      label: "Total Members",
      value: totalMembers,
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      border: "border-blue-400/20",
    },
    {
      label: "Onboarded",
      value: onboardedMembers,
      icon: Star,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      border: "border-emerald-400/20",
    },
    {
      label: "Active This Week",
      value: activeThisWeek,
      icon: Activity,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      border: "border-amber-400/20",
    },
    {
      label: "Tasks Completed (7d)",
      value: completedTasks,
      icon: TrendingUp,
      color: "text-violet-400",
      bg: "bg-violet-400/10",
      border: "border-violet-400/20",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/60 bg-background/95 px-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <ShieldCheck className="size-4 text-primary" strokeWidth={1.5} />
          </div>
          <div>
            <span className="text-sm font-bold text-foreground">SkillGrid Admin</span>
            <span className="ml-2 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
              Control Panel
            </span>
          </div>
        </div>
        <button
          id="admin-logout-btn"
          onClick={onLogout}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors rounded-md px-3 py-1.5 hover:bg-destructive/10"
        >
          <LogOut className="size-4" strokeWidth={1.5} />
          Sign out
        </button>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 md:px-8">
        {/* Page title */}
        <div className="mb-10 pb-6 border-b border-border/60">
          <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">
            Members Overview
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            Real-time member activity and platform statistics
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {stats.map((s) => (
            <div
              key={s.label}
              className={`rounded-xl border ${s.border} bg-card/50 p-5 flex flex-col gap-3`}
            >
              <div className={`size-9 rounded-lg ${s.bg} border ${s.border} flex items-center justify-center`}>
                <s.icon className={`size-4 ${s.color}`} strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-3xl font-display font-bold text-foreground">
                  {isLoading ? "—" : s.value.toLocaleString()}
                </div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Member Table */}
        <div className="rounded-2xl border border-border/60 bg-card/30 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 border-b border-border/60">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              All Members ({filtered.length})
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                id="admin-member-search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, username, college…"
                className="h-8 w-64 rounded-md border border-border/60 bg-background pl-8 pr-3 text-sm text-foreground outline-none focus:border-primary/60 transition-all placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
              Loading members…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
              No members found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    <th className="text-left px-5 py-3">Member</th>
                    <th className="text-left px-4 py-3 hidden md:table-cell">College</th>
                    <th className="text-left px-4 py-3 hidden lg:table-cell">Joined</th>
                    <th className="text-center px-4 py-3">Onboarded</th>
                    <th className="text-center px-4 py-3">Active (7d)</th>
                    <th className="text-center px-4 py-3 hidden lg:table-cell">Tasks (7d)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filtered.map((m) => {
                    const isActive = activeUserIds.has(m.id);
                    const hasTasks = taskUserIds.has(m.id);
                    const memberTasks = taskData?.filter((t) => t.user_id === m.id) ?? [];
                    const memberCompleted = memberTasks.filter((t) => t.completed).length;
                    const joinedDate = new Date(m.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    });

                    return (
                      <tr key={m.id} className="hover:bg-secondary/20 transition-colors">
                        {/* Member info */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            {m.avatar_url ? (
                              <img
                                src={m.avatar_url}
                                alt={m.username}
                                className="size-8 rounded-full bg-muted border border-border/60 shrink-0 object-cover"
                              />
                            ) : (
                              <div className="size-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-[11px] font-bold text-primary uppercase">
                                {(m.full_name || m.username).charAt(0)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-medium text-foreground truncate max-w-[160px]">
                                {m.full_name || m.username}
                              </div>
                              <div className="text-xs text-muted-foreground font-mono">
                                @{m.username}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* College */}
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            {m.college ? (
                              <>
                                <BookOpen className="size-3 shrink-0" strokeWidth={1.5} />
                                <span className="truncate max-w-[150px] text-xs">{m.college}</span>
                                {m.graduation_year && (
                                  <span className="text-[10px] text-muted-foreground/60">
                                    &apos;{String(m.graduation_year).slice(-2)}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-muted-foreground/40 text-xs">—</span>
                            )}
                          </div>
                        </td>

                        {/* Joined */}
                        <td className="px-4 py-3.5 hidden lg:table-cell">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="size-3" strokeWidth={1.5} />
                            {joinedDate}
                          </div>
                        </td>

                        {/* Onboarded */}
                        <td className="px-4 py-3.5 text-center">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                              m.onboarded
                                ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20"
                                : "bg-secondary/50 text-muted-foreground border border-border/40"
                            }`}
                          >
                            {m.onboarded ? "Yes" : "No"}
                          </span>
                        </td>

                        {/* Active this week */}
                        <td className="px-4 py-3.5 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                              isActive
                                ? "bg-amber-400/10 text-amber-400 border border-amber-400/20"
                                : "bg-secondary/50 text-muted-foreground/50 border border-border/40"
                            }`}
                          >
                            <span className={`size-1.5 rounded-full ${isActive ? "bg-amber-400" : "bg-muted-foreground/30"}`} />
                            {isActive ? "Active" : "Idle"}
                          </span>
                        </td>

                        {/* Tasks completed */}
                        <td className="px-4 py-3.5 text-center hidden lg:table-cell">
                          {hasTasks ? (
                            <div className="flex items-center justify-center gap-1 text-xs">
                              <Clock className="size-3 text-muted-foreground" strokeWidth={1.5} />
                              <span className="font-mono text-foreground font-medium">
                                {memberCompleted}
                              </span>
                              <span className="text-muted-foreground">/ {memberTasks.length}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/40 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground/50 mt-8">
          Member data fetched live from Supabase · Passwords and private info are never shown
        </p>
      </main>
    </div>
  );
}
