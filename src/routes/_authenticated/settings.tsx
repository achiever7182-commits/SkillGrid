import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { AppShell, PageHeader } from "@/components/ss/app-shell";
import { Panel, SectionTitle, UserAvatar } from "@/components/ss/primitives";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useSettings, useUser } from "@/hooks/use-session";
import { applyTheme, getTheme, type ThemeMode } from "@/lib/theme";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — StudySync" }, { name: "description", content: "Account, privacy and appearance." }, { property: "og:title", content: "Settings — StudySync" }, { property: "og:description", content: "Account settings." }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { data: user } = useUser();
  const { data: profile } = useProfile();
  const { data: settings } = useSettings();
  const qc = useQueryClient();
  const [pf, setPf] = useState({ full_name: "", username: "", bio: "", college: "", graduation_year: "", avatar_url: "", timezone: "" });
  const [pw, setPw] = useState({ current: "", next: "" });
  const [theme, setTheme] = useState<ThemeMode>("dark");
  useEffect(() => setTheme(getTheme()), []);
  useEffect(() => {
    if (profile) setPf({ full_name: profile.full_name, username: profile.username, bio: profile.bio ?? "", college: profile.college ?? "", graduation_year: profile.graduation_year?.toString() ?? "", avatar_url: profile.avatar_url ?? "", timezone: profile.timezone ?? "" });
  }, [profile]);

  async function saveProfile() {
    if (!/^[a-z0-9_]{3,24}$/.test(pf.username)) return toast.error("Username: 3–24 lowercase letters, numbers or _");
    const { error } = await supabase.from("profiles").update({
      full_name: pf.full_name.slice(0, 60), username: pf.username, bio: pf.bio.slice(0, 300) || null, college: pf.college.slice(0, 80) || null,
      graduation_year: pf.graduation_year ? Number(pf.graduation_year) : null, avatar_url: pf.avatar_url || null, timezone: pf.timezone || null,
    }).eq("id", user!.id);
    if (error) return toast.error(error.code === "23505" ? "That username is taken" : error.message);
    qc.invalidateQueries(); toast.success("Profile saved");
  }
  async function setSetting(patch: Record<string, unknown>) {
    const { error } = await supabase.from("user_settings").update(patch).eq("user_id", user!.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries();
  }
  async function changePassword() {
    if (pw.next.length < 8) return toast.error("Password must be at least 8 characters");
    const { error } = await supabase.auth.updateUser({ password: pw.next, current_password: pw.current } as never);
    if (error) return toast.error(error.message);
    setPw({ current: "", next: "" }); toast.success("Password changed");
  }
  const vis = (k: "profile_visibility" | "progress_visibility" | "activity_visibility", label: string) => (
    <div className="flex items-center justify-between gap-3"><Label>{label}</Label>
      <Select value={settings?.[k]} onValueChange={(v) => setSetting({ [k]: v })}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="public">Public</SelectItem><SelectItem value="friends">Friends only</SelectItem><SelectItem value="private">Private</SelectItem></SelectContent></Select></div>
  );
  const sw = (k: "notify_friend_activity" | "notify_streaks" | "daily_reminders", label: string) => (
    <div className="flex items-center justify-between"><Label>{label}</Label><Switch checked={!!settings?.[k]} onCheckedChange={(v) => setSetting({ [k]: v })} /></div>
  );

  return (
    <AppShell>
      <PageHeader title="Settings" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="grid gap-3">
          <SectionTitle>Profile</SectionTitle>
          <div className="flex items-center gap-3"><UserAvatar url={pf.avatar_url} name={pf.full_name} size={56} />
            <div className="flex flex-wrap gap-1">{["lorelei", "notionists", "thumbs", "shapes"].map((s) => (
              <button key={s} onClick={() => setPf({ ...pf, avatar_url: `https://api.dicebear.com/9.x/${s}/svg?seed=${pf.username}` })}><img src={`https://api.dicebear.com/9.x/${s}/svg?seed=${pf.username}`} alt={s} className="size-9 rounded-full bg-muted" /></button>))}</div></div>
          <Input placeholder="Avatar image URL" value={pf.avatar_url} onChange={(e) => setPf({ ...pf, avatar_url: e.target.value })} />
          <div className="grid grid-cols-2 gap-3"><div className="grid gap-1"><Label>Full name</Label><Input value={pf.full_name} onChange={(e) => setPf({ ...pf, full_name: e.target.value })} /></div>
            <div className="grid gap-1"><Label>Username</Label><Input value={pf.username} onChange={(e) => setPf({ ...pf, username: e.target.value.toLowerCase() })} /></div></div>
          <div className="grid gap-1"><Label>Bio</Label><Textarea value={pf.bio} onChange={(e) => setPf({ ...pf, bio: e.target.value })} /></div>
          <div className="grid grid-cols-3 gap-3"><div className="grid gap-1"><Label>College</Label><Input value={pf.college} onChange={(e) => setPf({ ...pf, college: e.target.value })} /></div>
            <div className="grid gap-1"><Label>Grad year</Label><Input type="number" value={pf.graduation_year} onChange={(e) => setPf({ ...pf, graduation_year: e.target.value })} /></div>
            <div className="grid gap-1"><Label>Timezone</Label><Input value={pf.timezone} onChange={(e) => setPf({ ...pf, timezone: e.target.value })} /></div></div>
          <Button onClick={saveProfile}>Save profile</Button>
        </Panel>
        <div className="grid gap-4">
          <Panel className="grid gap-3"><SectionTitle>Study</SectionTitle>
            <div className="flex items-center justify-between"><Label>Streak threshold (%)</Label>
              <Input key={settings?.streak_threshold} type="number" min={1} max={100} className="w-24" defaultValue={settings?.streak_threshold} onBlur={(e) => setSetting({ streak_threshold: Math.min(100, Math.max(1, Number(e.target.value))) })} /></div>
            <p className="text-xs text-muted-foreground">Edit your weekly schedule from any task's menu in Tasks.</p></Panel>
          <Panel className="grid gap-3"><SectionTitle>Privacy</SectionTitle>{vis("profile_visibility", "Profile")}{vis("progress_visibility", "Progress")}{vis("activity_visibility", "Activity")}</Panel>
          <Panel className="grid gap-3"><SectionTitle>Notifications</SectionTitle>{sw("notify_friend_activity", "Friend activity")}{sw("notify_streaks", "Streak milestones")}{sw("daily_reminders", "Daily reminders")}</Panel>
          <Panel className="grid gap-3"><SectionTitle>Appearance</SectionTitle>
            <div className="flex gap-2">{(["light", "dark", "system"] as ThemeMode[]).map((m) => <Button key={m} variant={theme === m ? "default" : "outline"} size="sm" className="capitalize" onClick={() => { applyTheme(m); setTheme(m); }}>{m}</Button>)}</div></Panel>
          <Panel className="grid gap-3"><SectionTitle>Account</SectionTitle>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <Input type="password" placeholder="Current password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
            <Input type="password" placeholder="New password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
            <Button variant="outline" onClick={changePassword}>Change password</Button></Panel>
        </div>
      </div>
    </AppShell>
  );
}
