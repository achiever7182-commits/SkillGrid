import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { AppShell, PageHeader } from "@/components/ss/app-shell";
import { Panel, SectionTitle, UserAvatar } from "@/components/ss/primitives";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useProfile, useSettings, useUser } from "@/hooks/use-session";
import { applyTheme, getTheme, type ThemeMode } from "@/lib/theme";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — StudySync" },
      { name: "description", content: "Account, privacy and appearance." },
      { property: "og:title", content: "Settings — StudySync" },
      { property: "og:description", content: "Account settings." },
    ],
  }),
  component: SettingsPage,
});

function processAvatarFile(file: File): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please select an image file (PNG, JPG, WebP)"));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read image file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not load image"));
      img.onload = () => {
        const maxSize = 320;
        let w = img.width;
        let h = img.height;
        if (w > h) {
          if (w > maxSize) {
            h = Math.round((h * maxSize) / w);
            w = maxSize;
          }
        } else {
          if (h > maxSize) {
            w = Math.round((w * maxSize) / h);
            h = maxSize;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context unavailable"));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve({ blob, dataUrl });
            else resolve({ blob: file, dataUrl });
          },
          "image/jpeg",
          0.88,
        );
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function SettingsPage() {
  const { data: user } = useUser();
  const { data: profile } = useProfile();
  const { data: settings } = useSettings();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pf, setPf] = useState({
    full_name: "",
    username: "",
    bio: "",
    college: "",
    graduation_year: "",
    avatar_url: "",
    timezone: "",
  });
  const [pw, setPw] = useState({ current: "", next: "" });
  const [theme, setTheme] = useState<ThemeMode>("dark");

  useEffect(() => setTheme(getTheme()), []);
  useEffect(() => {
    if (profile) {
      setPf({
        full_name: profile.full_name,
        username: profile.username,
        bio: profile.bio ?? "",
        college: profile.college ?? "",
        graduation_year: profile.graduation_year?.toString() ?? "",
        avatar_url: profile.avatar_url ?? "",
        timezone: profile.timezone ?? "",
      });
    }
  }, [profile]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file must be smaller than 5MB");
      return;
    }
    setUploading(true);
    try {
      const { blob, dataUrl } = await processAvatarFile(file);
      let finalUrl = dataUrl;
      if (user?.id) {
        try {
          const ext = file.name.split(".").pop() || "jpg";
          const path = `${user.id}/${Date.now()}.${ext}`;
          const { error } = await supabase.storage
            .from("avatars")
            .upload(path, blob, { upsert: true });
          if (!error) {
            const { data } = supabase.storage.from("avatars").getPublicUrl(path);
            if (data?.publicUrl) finalUrl = data.publicUrl;
          }
        } catch {
          // If storage bucket isn't configured, optimized base64 dataUrl is used safely
        }
      }
      setPf((prev) => ({ ...prev, avatar_url: finalUrl }));
      toast.success("Photo loaded! Click 'Save profile' to keep it.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload photo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function saveProfile() {
    if (!/^[a-z0-9_]{3,24}$/.test(pf.username)) {
      toast.error("Username: 3–24 lowercase letters, numbers or _");
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: pf.full_name.slice(0, 60),
        username: pf.username,
        bio: pf.bio.slice(0, 300) || null,
        college: pf.college.slice(0, 80) || null,
        graduation_year: pf.graduation_year ? Number(pf.graduation_year) : null,
        avatar_url: pf.avatar_url || null,
        timezone: pf.timezone || null,
      })
      .eq("id", user!.id);
    if (error) {
      toast.error(error.code === "23505" ? "That username is taken" : error.message);
      return;
    }
    qc.invalidateQueries();
    toast.success("Profile saved");
  }

  async function setSetting(
    patch: Partial<Database["public"]["Tables"]["user_settings"]["Update"]>,
  ) {
    const { error } = await supabase.from("user_settings").update(patch).eq("user_id", user!.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    qc.invalidateQueries();
  }

  async function changePassword() {
    if (pw.next.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    const { error } = await supabase.auth.updateUser({
      password: pw.next,
      current_password: pw.current,
    } as never);
    if (error) {
      toast.error(error.message);
      return;
    }
    setPw({ current: "", next: "" });
    toast.success("Password changed");
  }

  const vis = (
    k: "profile_visibility" | "progress_visibility" | "activity_visibility",
    label: string,
  ) => (
    <div className="flex items-center justify-between gap-3">
      <Label>{label}</Label>
      <Select
        value={settings?.[k] ?? "friends"}
        onValueChange={(v) => {
          void setSetting({ [k]: v });
        }}
      >
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="public">Public</SelectItem>
          <SelectItem value="friends">Friends only</SelectItem>
          <SelectItem value="private">Private</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  const sw = (
    k: "notify_friend_activity" | "notify_streaks" | "daily_reminders",
    label: string,
  ) => (
    <div className="flex items-center justify-between">
      <Label>{label}</Label>
      <Switch
        checked={!!settings?.[k]}
        onCheckedChange={(v) => {
          void setSetting({ [k]: v });
        }}
      />
    </div>
  );

  return (
    <AppShell>
      <PageHeader title="Settings" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="grid gap-3">
          <SectionTitle>Profile</SectionTitle>

          <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/20 p-3.5">
            <div className="flex items-center gap-4">
              <UserAvatar url={pf.avatar_url} name={pf.full_name} size={64} />
              <div className="flex flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-1.5 size-4" />
                    {uploading ? "Uploading..." : "Upload photo"}
                  </Button>
                  {pf.avatar_url && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPf({ ...pf, avatar_url: "" })}
                    >
                      <X className="mr-1 size-3.5" />
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Upload any PNG, JPG, or WebP photo.</p>
              </div>
            </div>

            <div className="space-y-1.5 border-t border-border/40 pt-2.5">
              <Label className="text-xs text-muted-foreground">Or pick a ready-made avatar:</Label>
              <div className="flex flex-wrap gap-1.5">
                {["lorelei", "notionists", "thumbs", "shapes"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() =>
                      setPf({
                        ...pf,
                        avatar_url: `https://api.dicebear.com/9.x/${s}/svg?seed=${pf.username}`,
                      })
                    }
                    className="rounded-full ring-offset-background transition hover:ring-2 hover:ring-primary focus:outline-none"
                    aria-label={`Pick ${s} avatar`}
                  >
                    <img
                      src={`https://api.dicebear.com/9.x/${s}/svg?seed=${pf.username}`}
                      alt={s}
                      className="size-9 rounded-full bg-muted"
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-border/40 pt-2">
              <Input
                placeholder="Or paste an avatar image URL"
                value={pf.avatar_url}
                onChange={(e) => setPf({ ...pf, avatar_url: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label>Full name</Label>
              <Input
                value={pf.full_name}
                onChange={(e) => setPf({ ...pf, full_name: e.target.value })}
              />
            </div>
            <div className="grid gap-1">
              <Label>Username</Label>
              <Input
                value={pf.username}
                onChange={(e) => setPf({ ...pf, username: e.target.value.toLowerCase() })}
              />
            </div>
          </div>
          <div className="grid gap-1">
            <Label>Bio</Label>
            <Textarea value={pf.bio} onChange={(e) => setPf({ ...pf, bio: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1">
              <Label>College</Label>
              <Input
                value={pf.college}
                onChange={(e) => setPf({ ...pf, college: e.target.value })}
              />
            </div>
            <div className="grid gap-1">
              <Label>Grad year</Label>
              <Input
                type="number"
                value={pf.graduation_year}
                onChange={(e) => setPf({ ...pf, graduation_year: e.target.value })}
              />
            </div>
            <div className="grid gap-1">
              <Label>Timezone</Label>
              <Input
                value={pf.timezone}
                onChange={(e) => setPf({ ...pf, timezone: e.target.value })}
              />
            </div>
          </div>
          <Button onClick={saveProfile}>Save profile</Button>
        </Panel>

        <div className="grid gap-4">
          <Panel className="grid gap-3">
            <SectionTitle>Study</SectionTitle>
            <div className="flex items-center justify-between">
              <Label>Streak threshold (%)</Label>
              <Input
                key={settings?.streak_threshold}
                type="number"
                min={1}
                max={100}
                className="w-24"
                defaultValue={settings?.streak_threshold}
                onBlur={(e) =>
                  setSetting({
                    streak_threshold: Math.min(100, Math.max(1, Number(e.target.value))),
                  })
                }
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Edit your weekly schedule from any task's menu in Tasks.
            </p>
          </Panel>

          <Panel className="grid gap-3">
            <SectionTitle>Privacy</SectionTitle>
            {vis("profile_visibility", "Profile")}
            {vis("progress_visibility", "Progress")}
            {vis("activity_visibility", "Activity")}
          </Panel>

          <Panel className="grid gap-3">
            <SectionTitle>Notifications</SectionTitle>
            {sw("notify_friend_activity", "Friend activity")}
            {sw("notify_streaks", "Streak milestones")}
            {sw("daily_reminders", "Daily reminders")}
          </Panel>

          <Panel className="grid gap-3">
            <SectionTitle>Appearance</SectionTitle>
            <div className="flex gap-2">
              {(["light", "dark", "system"] as ThemeMode[]).map((m) => (
                <Button
                  key={m}
                  variant={theme === m ? "default" : "outline"}
                  size="sm"
                  className="capitalize"
                  onClick={() => {
                    applyTheme(m);
                    setTheme(m);
                  }}
                >
                  {m}
                </Button>
              ))}
            </div>
          </Panel>

          <Panel className="grid gap-3">
            <SectionTitle>Account</SectionTitle>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <Input
              type="password"
              placeholder="Current password"
              value={pw.current}
              onChange={(e) => setPw({ ...pw, current: e.target.value })}
            />
            <Input
              type="password"
              placeholder="New password"
              value={pw.next}
              onChange={(e) => setPw({ ...pw, next: e.target.value })}
            />
            <Button variant="outline" onClick={changePassword}>
              Change password
            </Button>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
