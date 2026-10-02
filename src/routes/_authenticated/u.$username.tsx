import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { AppShell } from "@/components/ss/app-shell";
import { Heatmap } from "@/components/ss/heatmap";
import { EmptyState, Panel, SectionTitle, StatCard, UserAvatar } from "@/components/ss/primitives";
import { SubjectCards } from "@/components/ss/subject-cards";
import { ChatButton } from "@/components/ss/chat-button";
import { supabase } from "@/integrations/supabase/client";
import { useProgress } from "@/hooks/use-progress";
import { hours } from "@/lib/dates";

export const Route = createFileRoute("/_authenticated/u/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `@${params.username} â€” SkillGrid` },
      { name: "description", content: "Study profile on SkillGrid." },
      { property: "og:title", content: `@${params.username} â€” SkillGrid` },
      { property: "og:description", content: "Study profile on SkillGrid." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { username } = Route.useParams();
  const { data: id } = useQuery({
    queryKey: ["uid", username],
    queryFn: async () =>
      (await supabase.rpc("profile_id_by_username", { _username: username })).data,
  });
  const { data: profile, isLoading } = useQuery({
    queryKey: ["public-profile", id],
    enabled: !!id,
    queryFn: async () =>
      (
        await supabase
          .from("profiles")
          .select("id,username,full_name,avatar_url,bio,college,graduation_year")
          .eq("id", id!)
          .maybeSingle()
      ).data,
  });
  const { data: p } = useProgress(id ?? undefined);
  return (
    <AppShell>
      {!isLoading && !profile ? (
        <EmptyState
          icon={<Lock className="size-6" />}
          title="This profile is private"
          body="The user limits who can see their profile."
        />
      ) : (
        <>
          <div className="mb-6 flex items-center gap-4">
            <UserAvatar url={profile?.avatar_url} name={profile?.full_name || username} size={72} />
            <div>
              <h1 className="text-2xl font-semibold">{profile?.full_name || username}</h1>
              <p className="text-sm text-muted-foreground">
                @{username}
                {profile?.college && ` Â· ${profile.college}`}
                {profile?.graduation_year && ` '${String(profile.graduation_year).slice(2)}`}
              </p>
              {profile?.bio && <p className="mt-1 max-w-xl text-sm">{profile.bio}</p>}
            </div>
            {id && <div className="ml-auto"><ChatButton friendId={id} /></div>}
          </div>
          {p?.visible ? (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                <StatCard label="Streak" value={`${p.streak.current}d`} />
                <StatCard label="Longest" value={`${p.streak.longest}d`} />
                <StatCard label="Weekly" value={`${Math.round(p.week.pct)}%`} />
                <StatCard label="Monthly" value={`${Math.round(p.month.pct)}%`} />
                <StatCard label="Total hours" value={hours(p.totalMinutes)} />
              </div>
              <Panel className="mt-4">
                <Heatmap daily={p.daily} streakCurrent={p.streak.current} streakLongest={p.streak.longest} />
              </Panel>
              <Panel className="mt-4">
                <SectionTitle>Subject Progress</SectionTitle>
                <SubjectCards userId={id ?? undefined} />
              </Panel>
            </>
          ) : (
            <EmptyState icon={<Lock className="size-6" />} title="Progress is private" />
          )}
        </>
      )}
    </AppShell>
  );
}
