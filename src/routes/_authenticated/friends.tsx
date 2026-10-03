import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Flame, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppShell, PageHeader } from "@/components/ss/app-shell";
import { ActivityFeed } from "@/components/ss/activity-feed";
import { EmptyState, Panel, SectionTitle, UserAvatar } from "@/components/ss/primitives";
import { ChatButton } from "@/components/ss/chat-button";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/use-session";
import { useProgress } from "@/hooks/use-progress";
import { hours } from "@/lib/dates";

export const Route = createFileRoute("/_authenticated/friends")({
  validateSearch: (s: Record<string, unknown>): { tab?: string } =>
    typeof s["tab"] === "string" ? { tab: s["tab"] } : {},
  head: () => ({
    meta: [
      { title: "Friends — SkillGrid" },
      { name: "description", content: "Your friends' study progress." },
      { property: "og:title", content: "Friends — SkillGrid" },
      { property: "og:description", content: "Your friends' study progress." },
    ],
  }),
  component: Friends,
});

type Basic = { id: string; username: string; full_name: string; avatar_url: string | null };

function FriendCard({ f }: { f: Basic }) {
  const { data: p } = useProgress(f.id);
  return (
    <Link
      to="/u/$username"
      params={{ username: f.username }}
      className="glass flex items-center gap-3 rounded-xl p-4 transition hover:border-primary/40"
    >
      <UserAvatar url={f.avatar_url} name={f.full_name || f.username} size={44} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{f.full_name || f.username}</div>
        {p?.visible ? (
          <div className="text-xs text-muted-foreground">
            <span className="text-streak">
              <Flame className="inline size-3" /> {p.streak.current} day streak
            </span>{" "}
            · {Math.round(p.week.pct)}% weekly · {hours(p.week.completed)}h
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">Progress is private</div>
        )}
      </div>
      <div className="ml-auto" onClick={(e) => e.preventDefault()}>
        <ChatButton friendId={f.id} />
      </div>
    </Link>
  );
}

function Friends() {
  const { tab } = Route.useSearch();
  const { data: user } = useUser();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const { data } = useQuery({
    queryKey: ["friendships", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: fs } = await supabase.from("friendships").select("*");
      const ids = [...new Set((fs ?? []).flatMap((f) => [f.requester_id, f.receiver_id]))];
      const { data: people } = await supabase.rpc("basic_profiles", { _ids: ids });
      const get = (id: string) => people?.find((p) => p.id === id);
      return { fs: fs ?? [], get };
    },
  });
  const search = useQuery({
    queryKey: ["search", q],
    enabled: q.trim().length >= 2,
    queryFn: async () => (await supabase.rpc("search_users", { _q: q })).data ?? [],
  });
  const fs = data?.fs ?? [];
  const other = (f: (typeof fs)[number]) =>
    f.requester_id === user?.id ? f.receiver_id : f.requester_id;
  const friends = fs
    .filter((f) => f.status === "accepted")
    .map((f) => data!.get(other(f)))
    .filter(Boolean) as Basic[];
  const incoming = fs.filter((f) => f.status === "pending" && f.receiver_id === user?.id);
  const outgoing = fs.filter((f) => f.status === "pending" && f.requester_id === user?.id);
  const refresh = () => qc.invalidateQueries();

  async function send(id: string) {
    const { error } = await supabase
      .from("friendships")
      .insert({ requester_id: user!.id, receiver_id: id });
    if (error) {
      toast.error("Request already exists");
      return;
    }
    toast.success("Friend request sent");
    refresh();
  }
  async function respond(id: string, accept: boolean) {
    if (accept) await supabase.from("friendships").update({ status: "accepted" }).eq("id", id);
    else await supabase.from("friendships").delete().eq("id", id);
    refresh();
  }

  return (
    <AppShell>
      <PageHeader title="Friends" subtitle="Cheer each other on — no rankings." />
      <Tabs defaultValue={tab ?? "friends"}>
        <TabsList>
          <TabsTrigger value="friends">Friends</TabsTrigger>
          <TabsTrigger value="requests">
            Requests {incoming.length > 0 && `(${incoming.length})`}
          </TabsTrigger>
          <TabsTrigger value="find">Find</TabsTrigger>
        </TabsList>
        <TabsContent value="friends" className="mt-4">
          {friends.length === 0 ? (
            <EmptyState title="No friends yet" body="Search by username or name in the Find tab." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {friends.map((f) => (
                <FriendCard key={f.id} f={f} />
              ))}
            </div>
          )}
          <Panel className="mt-4">
            <SectionTitle>Activity</SectionTitle>
            <ActivityFeed />
          </Panel>
        </TabsContent>
        <TabsContent value="requests" className="mt-4 space-y-2">
          {incoming.length + outgoing.length === 0 && <EmptyState title="No pending requests" />}
          {incoming.map((f) => {
            const p = data!.get(f.requester_id);
            return (
              <Panel key={f.id} className="flex items-center gap-3 p-3">
                <UserAvatar url={p?.avatar_url} name={p?.full_name} />
                <div className="flex-1">
                  {p?.full_name} <span className="text-muted-foreground">@{p?.username}</span>
                </div>
                <Button size="sm" onClick={() => respond(f.id, true)}>
                  Accept
                </Button>
                <Button size="sm" variant="ghost" onClick={() => respond(f.id, false)}>
                  Reject
                </Button>
              </Panel>
            );
          })}
          {outgoing.map((f) => {
            const p = data!.get(f.receiver_id);
            return (
              <Panel key={f.id} className="flex items-center gap-3 p-3">
                <UserAvatar url={p?.avatar_url} name={p?.full_name} />
                <div className="flex-1">
                  {p?.full_name} <span className="text-muted-foreground">· pending</span>
                </div>
                <Button size="sm" variant="ghost" onClick={() => respond(f.id, false)}>
                  Cancel
                </Button>
              </Panel>
            );
          })}
        </TabsContent>
        <TabsContent value="find" className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search username or name"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="mt-3 space-y-2">
            {(search.data ?? []).map((u) => {
              const rel = fs.find((f) => other(f) === u.id);
              return (
                <Panel key={u.id} className="flex items-center gap-3 p-3">
                  <UserAvatar url={u.avatar_url} name={u.full_name} />
                  <div className="flex-1">
                    {u.full_name} <span className="text-muted-foreground">@{u.username}</span>
                  </div>
                  {rel ? (
                    <span className="text-xs text-muted-foreground">
                      {rel.status === "accepted" ? "Friends" : "Pending"}
                    </span>
                  ) : (
                    <Button size="sm" onClick={() => send(u.id)}>
                      Add friend
                    </Button>
                  )}
                </Panel>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
