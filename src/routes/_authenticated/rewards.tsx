import { useState } from "react";
import { toast } from "sonner";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/ss/app-shell";
import { useUser } from "@/hooks/use-session";
import { useRewards } from "@/hooks/use-rewards";
import { Panel, SectionTitle } from "@/components/ss/primitives";
import { Trophy, Star, Target, Flame, Gift } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

function PersonalRewards() {
  const { data: user } = useUser();
  const qc = useQueryClient();
  const { data: rewardsStats } = useRewards(user?.id);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [xpRequired, setXpRequired] = useState(1000);
  const [icon, setIcon] = useState("🎁");

  const { data: personalRewards } = useQuery({
    queryKey: ["personal_rewards", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("personal_rewards")
        .select(`
          *,
          reward_redemptions ( id )
        `)
        .eq("user_id", user!.id)
        .order("xp_required", { ascending: true });
      return data || [];
    }
  });

  async function createReward(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    
    const { error } = await supabase.from("personal_rewards").insert({
      user_id: user.id,
      title,
      description,
      icon,
      xp_required: xpRequired
    });
    
    if (error) {
      toast.error("Failed to create reward");
    } else {
      toast.success("Reward created!");
      setTitle("");
      setDescription("");
      qc.invalidateQueries({ queryKey: ["personal_rewards"] });
    }
  }

  async function redeemReward(reward: any) {
    if (!user) return;
    if (rewardsStats && rewardsStats.xp < reward.xp_required) {
      toast.error("Not enough XP!");
      return;
    }
    
    const { error } = await supabase.from("reward_redemptions").insert({
      user_id: user.id,
      reward_id: reward.id
    });
    
    if (error) {
      toast.error("Failed to redeem reward");
    } else {
      toast.success(`${reward.title} redeemed! Enjoy!`);
      qc.invalidateQueries({ queryKey: ["personal_rewards"] });
    }
  }

  async function deleteReward(id: string) {
    const { error } = await supabase.from("personal_rewards").delete().eq("id", id);
    if (!error) qc.invalidateQueries({ queryKey: ["personal_rewards"] });
  }

  return (
    <div className="space-y-4">
      <form onSubmit={createReward} className="bg-card p-4 rounded-xl border space-y-3">
        <h3 className="font-semibold text-sm">Create New Reward</h3>
        <div className="grid grid-cols-4 gap-2">
          <input 
            className="col-span-3 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
            placeholder="Reward (e.g. Movie night)" 
            value={title} onChange={e => setTitle(e.target.value)} 
            required 
          />
          <input 
            className="col-span-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
            type="number" min="10" placeholder="XP" 
            value={xpRequired} onChange={e => setXpRequired(parseInt(e.target.value))} 
            required 
          />
        </div>
        <button type="submit" className="w-full bg-primary text-primary-foreground h-9 px-4 py-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors">
          Add Reward
        </button>
      </form>

      <div className="space-y-3">
        {personalRewards?.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">No personal rewards. Set a goal for yourself!</div>
        ) : (
          personalRewards?.map(r => {
            const isRedeemed = r.reward_redemptions && r.reward_redemptions.length > 0;
            const canAfford = rewardsStats && rewardsStats.xp >= r.xp_required;
            
            return (
              <div key={r.id} className={`p-3 rounded-lg border flex flex-col gap-2 ${isRedeemed ? 'opacity-70 bg-muted/50' : 'bg-card'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold flex items-center gap-2">
                      {r.icon} {r.title}
                    </div>
                    {r.description && <div className="text-xs text-muted-foreground mt-1">{r.description}</div>}
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm font-bold">{r.xp_required.toLocaleString()} XP</div>
                    <button onClick={() => deleteReward(r.id)} className="text-xs text-destructive hover:underline mt-1">Delete</button>
                  </div>
                </div>
                
                {isRedeemed ? (
                  <div className="text-xs font-semibold text-primary text-center mt-1 bg-primary/10 py-1.5 rounded">Redeemed ✓</div>
                ) : (
                  <button 
                    onClick={() => redeemReward(r)}
                    disabled={!canAfford}
                    className={`text-xs font-medium py-1.5 rounded mt-1 transition-colors ${canAfford ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
                  >
                    {canAfford ? 'Redeem' : `Need ${(r.xp_required - (rewardsStats?.xp || 0)).toLocaleString()} more XP`}
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/rewards")({
  head: () => ({
    meta: [
      { title: "Rewards — SkillGrid" },
      { name: "description", content: "Your rewards and achievements." },
      { property: "og:title", content: "Rewards — SkillGrid" },
    ],
  }),
  component: RewardsPage,
});

function RewardsPage() {
  const { data: user } = useUser();
  const { data: rewards, isLoading } = useRewards(user?.id);

  const { data: achievements } = useQuery({
    queryKey: ["achievements", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [allAch, userAch] = await Promise.all([
        supabase.from("achievements").select("*"),
        supabase.from("user_achievements").select("achievement_id").eq("user_id", user!.id)
      ]);
      const unlockedIds = new Set(userAch.data?.map(a => a.achievement_id) || []);
      return (allAch.data || []).map(a => ({
        ...a,
        unlocked: unlockedIds.has(a.id)
      }));
    }
  });

  const { data: history } = useQuery({
    queryKey: ["xp_history", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("xp_events")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    }
  });

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-4 animate-pulse">
          <div className="h-12 w-48 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded-xl"></div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader title="Rewards" subtitle="Your XP, level, and achievements." />
      
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Panel className="flex flex-col justify-center items-center p-6 text-center md:col-span-1 border-primary/20 bg-primary/5">
          <div className="grid place-items-center rounded-full bg-primary/20 p-4 mb-4 text-primary">
            <Star className="size-8" />
          </div>
          <div className="text-sm font-semibold uppercase tracking-wider text-primary mb-1">Current Level</div>
          <div className="text-4xl font-black">{rewards?.level || 1}</div>
          <div className="text-muted-foreground mt-2">{rewards?.xp.toLocaleString() || 0} Total XP</div>
        </Panel>

        <Panel className="md:col-span-2 flex flex-col justify-center p-6">
          <div className="flex justify-between items-end mb-2">
            <div>
              <div className="text-sm text-muted-foreground font-semibold">Progress to Level {(rewards?.level || 1) + 1}</div>
              <div className="text-2xl font-bold mt-1">
                {rewards?.currentLevelXp.toLocaleString()} / {rewards?.nextLevelXp?.toLocaleString() || 'Max'} XP
              </div>
            </div>
            <div className="text-primary font-mono font-bold text-xl">{Math.round(rewards?.levelProgress || 100)}%</div>
          </div>
          <Progress value={rewards?.levelProgress || 100} className="h-4 w-full" />
          <div className="mt-4 flex gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Flame className="size-4 text-streak" />
              <span className="font-semibold text-foreground">{rewards?.stats?.current_streak || 0}</span> day streak
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="size-4 text-yellow-500" />
              <span className="font-semibold text-foreground">{rewards?.achievementsCount || 0}</span> achievements
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <SectionTitle action={<Trophy className="size-4 text-muted-foreground" />}>
            Achievements
          </SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {achievements?.map((ach) => (
              <div 
                key={ach.id} 
                className={`flex gap-3 p-3 rounded-lg border ${ach.unlocked ? 'bg-card border-primary/20' : 'bg-muted/30 border-dashed opacity-70'}`}
              >
                <div className="text-2xl pt-1">{ach.icon}</div>
                <div>
                  <div className="font-semibold">{ach.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{ach.description}</div>
                  {ach.unlocked ? (
                    <div className="text-xs text-primary font-medium mt-2 flex items-center gap-1">
                      <Star className="size-3" /> Unlocked
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground mt-2">
                      Reward: +{ach.xp_reward} XP
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel>
            <SectionTitle action={<Target className="size-4 text-muted-foreground" />}>
              XP History
            </SectionTitle>
            <div className="mt-4 space-y-3">
              {history?.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">No XP events yet. Start completing tasks!</div>
              ) : (
                history?.map((ev) => (
                  <div key={ev.id} className="flex justify-between items-center text-sm border-b border-border/50 last:border-0 pb-2 last:pb-0">
                    <div>
                      <div className="font-medium">{ev.reason}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(ev.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="font-mono text-primary font-bold">+{ev.amount} XP</div>
                  </div>
                ))
              )}
            </div>
          </Panel>
          
          <Panel>
            <SectionTitle action={<Gift className="size-4 text-muted-foreground" />}>
              Personal Rewards
            </SectionTitle>
            <div className="py-2">
              <PersonalRewards />
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
