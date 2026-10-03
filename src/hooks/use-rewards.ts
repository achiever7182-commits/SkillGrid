import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { calculateLevel } from "@/lib/rewards";

export function useRewards(userId?: string) {
  return useQuery({
    queryKey: ["rewards", userId],
    enabled: !!userId,
    queryFn: async () => {
      try {
        const [{ data: stats, error: statsError }, { count: achievementsCount }] = await Promise.all([
          supabase.from("user_stats").select("*").eq("user_id", userId!).maybeSingle(),
          supabase.from("user_achievements").select("*", { count: "exact", head: true }).eq("user_id", userId!)
        ]);

        if (statsError && statsError.code !== "PGRST116") {
          console.warn("user_stats query notice:", statsError.message);
        }
        
        const xp = stats?.total_xp || 0;
        const { level, currentLevelXp, nextLevelXp } = calculateLevel(xp);
        const levelProgress = nextLevelXp ? ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100 : 100;
        
        return {
          stats: stats || null,
          level,
          xp,
          currentLevelXp,
          nextLevelXp,
          levelProgress,
          achievementsCount: achievementsCount || 0
        };
      } catch (err) {
        console.warn("Rewards hook fallback:", err);
        const { level, currentLevelXp, nextLevelXp } = calculateLevel(0);
        return {
          stats: null,
          level: 1,
          xp: 0,
          currentLevelXp: 0,
          nextLevelXp: 500,
          levelProgress: 0,
          achievementsCount: 0
        };
      }
    }
  });
}
