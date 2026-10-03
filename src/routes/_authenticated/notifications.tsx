import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell, PageHeader } from "@/components/ss/app-shell";
import { EmptyState, Panel } from "@/components/ss/primitives";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/use-session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — SkillGrid" },
      { name: "description", content: "Your notifications." },
      { property: "og:title", content: "Notifications — SkillGrid" },
      { property: "og:description", content: "Your notifications." },
    ],
  }),
  component: Notifs,
});

function Notifs() {
  const { data: user } = useUser();
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["notifications", user?.id, "all"],
    enabled: !!user,
    queryFn: async () =>
      (
        await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(100)
      ).data ?? [],
  });
  async function markAll() {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user!.id)
      .eq("read", false);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }

  async function markOne(id: string) {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <AppShell>
      <PageHeader
        title="Notifications"
        action={
          <Button variant="outline" size="sm" onClick={markAll}>
            Mark all read
          </Button>
        }
      />
      <Panel>
        {data.length === 0 ? (
          <EmptyState icon={<Bell className="size-6" />} title="You're all caught up" />
        ) : (
          <ul className="divide-y">
            {data.map((n) => (
              <li
                key={n.id}
                className={cn(
                  "flex items-center justify-between gap-3 py-3 text-sm",
                  !n.read && "font-medium",
                )}
              >
                <Link
                  to={(n.link as "/friends") ?? "/dashboard"}
                  onClick={() => {
                    if (!n.read) void markOne(n.id);
                  }}
                  className="hover:underline"
                >
                  {!n.read && <span className="mr-2 inline-block size-2 rounded-full bg-primary" />}
                  {n.message}
                </Link>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </AppShell>
  );
}
