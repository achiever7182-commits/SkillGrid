import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { calculateLevel } from "@/lib/rewards";

export function useRewards(userId?: string) {
  return useQuery({
    queryKey: ["rewards", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [{ data: stats, error: statsError }, { count: achievementsCount, error: achError }] = await Promise.all([
        supabase.from("user_stats").select("*").eq("user_id", userId!).single(),
        supabase.from("user_achievements").select("*", { count: "exact", head: true }).eq("user_id", userId!)
      ]);

      if (statsError && statsError.code !== 'PGRST116') {
        throw statsError;
      }
      
      const xp = stats?.total_xp || 0;
      const { level, currentLevelXp, nextLevelXp } = calculateLevel(xp);
      const levelProgress = nextLevelXp ? ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100 : 100;
      
      return {
        stats,
        level,
        xp,
        currentLevelXp,
        nextLevelXp,
        levelProgress,
        achievementsCount: achievementsCount || 0
      };
    }
  });
}
