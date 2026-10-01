import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/use-session";
import { cn } from "@/lib/utils";
import { EmptyState, UserAvatar } from "./primitives";

const REACTIONS = ["🔥", "👏", "💪", "🎯"] as const;

export function ActivityFeed({ limit = 20 }: { limit?: number }) {
  const { data: user } = useUser();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["feed", user?.id, limit],
    enabled: !!user,
    queryFn: async () => {
      // RLS only returns activities whose owner's privacy settings allow us to see them.
      const { data: acts, error } = await supabase
        .from("activities")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      const ids = [...new Set((acts ?? []).map((a) => a.user_id))];
      const [{ data: people }, { data: reacts }] = await Promise.all([
        supabase.rpc("basic_profiles", { _ids: ids }),
        acts?.length
          ? supabase
              .from("reactions")
              .select("*")
              .in(
                "activity_id",
                acts.map((a) => a.id),
              )
          : Promise.resolve({ data: [] }),
      ]);
      return (acts ?? []).map((a) => ({
        ...a,
        person: people?.find((p) => p.id === a.user_id),
        reactions: (reacts ?? []).filter((r) => r.activity_id === a.id),
      }));
    },
  });

  async function react(activityId: string, r: string, mine: boolean) {
    if (!user) return;
    if (mine)
      await supabase
        .from("reactions")
        .delete()
        .eq("activity_id", activityId)
        .eq("user_id", user.id)
        .eq("reaction", r);
    else
      await supabase
        .from("reactions")
        .insert({ activity_id: activityId, user_id: user.id, reaction: r });
    qc.invalidateQueries({ queryKey: ["feed"] });
  }

  if (isLoading)
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((k) => (
          <div key={k} className="h-14 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  if (!data?.length)
    return (
      <EmptyState
        icon={<Activity className="size-6" />}
        title="No activity yet"
        body="Completed tasks and milestones from you and your friends show up here."
      />
    );

  return (
    <ul className="divide-y">
      {data.map((a) => {
        const name = a.person?.full_name || a.person?.username || "Someone";
        const isMe = a.user_id === user?.id;
        return (
          <li key={a.id} className="flex gap-3 py-3">
            <UserAvatar url={a.person?.avatar_url} name={name} size={32} />
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                {a.person ? (
                  <Link
                    to="/u/$username"
                    params={{ username: a.person.username }}
                    className="font-semibold hover:underline"
                  >
                    {isMe ? "You" : name}
                  </Link>
                ) : (
                  <span className="font-semibold">{name}</span>
                )}{" "}
                <span className="text-muted-foreground">{a.message}</span>
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1">
                {REACTIONS.map((r) => {
                  const count = a.reactions.filter((x) => x.reaction === r).length;
                  const mine = a.reactions.some((x) => x.reaction === r && x.user_id === user?.id);
                  return (
                    <button
                      key={r}
                      onClick={() => react(a.id, r, mine)}
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-xs transition hover:bg-muted",
                        mine && "border-primary/50 bg-primary/10",
                        !count && "opacity-60 hover:opacity-100",
                      )}
                    >
                      {r}
                      {count > 0 && <span className="ml-1 font-mono">{count}</span>}
                    </button>
                  );
                })}
                <span className="ml-auto text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
