import { supabase } from "@/integrations/supabase/client";

export const XP_REWARDS = {
  TASK_COMPLETE: 25,
  TASK_TIME_100: 50,
  DAILY_EXCEED: 25, // not used directly if we just use overachiever achievement
  DAILY_GOAL_COMPLETE: 100,
  FIRST_TASK_TODAY: 10,
  STREAK_3: 100,
  STREAK_7: 250,
  STREAK_30: 1000,
  WEEKLY_GOAL_COMPLETE: 500,
};

// Simple XP level progression formula or fixed table
// Level 1: 0, 2: 500, 3: 1200, 4: 2000, 5: 3000, 6: 4200, 7: 5500
export function calculateLevel(xp: number): { level: number; nextLevelXp: number | null; currentLevelXp: number } {
  const levels = [
    { level: 1, xp: 0 },
    { level: 2, xp: 500 },
    { level: 3, xp: 1200 },
    { level: 4, xp: 2000 },
    { level: 5, xp: 3000 },
    { level: 6, xp: 4200 },
    { level: 7, xp: 5500 },
    { level: 8, xp: 7000 },
    { level: 9, xp: 8700 },
    { level: 10, xp: 10600 },
    { level: 11, xp: 12700 },
    { level: 12, xp: 15000 },
  ];

  let currentLevel = levels[0];
  let nextLevel = levels[1];

  for (let i = 0; i < levels.length; i++) {
    if (xp >= levels[i].xp) {
      currentLevel = levels[i];
      nextLevel = levels[i + 1] || null;
    } else {
      break;
    }
  }

  return {
    level: currentLevel.level,
    currentLevelXp: currentLevel.xp,
    nextLevelXp: nextLevel ? nextLevel.xp : null,
  };
}

export async function awardXP(userId: string, amount: number, reason: string, eventType: string, referenceId?: string) {
  if (amount <= 0) return null;

  // Insert the event. The database UNIQUE constraint on (user_id, event_type, reference_id) 
  // will prevent farming (duplicate events).
  const { data, error } = await supabase
    .from("xp_events")
    .insert({
      user_id: userId,
      amount,
      reason,
      event_type: eventType,
      reference_id: referenceId || null,
    })
    .select()
    .maybeSingle();

  // If error is duplicate key, it means already awarded. Return null.
  if (error) {
    if (error.code === '23505') {
      return null; // Already awarded
    }
    console.error("Error awarding XP:", error);
    return null;
  }

  // Update user total_xp
  const { data: userStats, error: statsError } = await supabase
    .from("user_stats")
    .select("total_xp, current_level")
    .eq("user_id", userId)
    .single();

  if (statsError) {
    console.error("Error fetching user stats:", statsError);
    return null;
  }

  const newTotalXp = userStats.total_xp + amount;
  const { level: newLevel } = calculateLevel(newTotalXp);

  await supabase
    .from("user_stats")
    .update({ 
      total_xp: newTotalXp,
      current_level: newLevel,
      updated_at: new Date().toISOString()
    })
    .eq("user_id", userId);

  return {
    event: data,
    leveledUp: newLevel > userStats.current_level,
    newLevel
  };
}

// Evaluate milestones (Achievements, Daily/Weekly goals) based on current state
export async function checkTaskMilestones(userId: string, date: string) {
  // Try to award "First task of the day"
  await awardXP(userId, XP_REWARDS.FIRST_TASK_TODAY, "First task of the day", "first_task_today", date);
}

export async function awardTaskCompletion(userId: string, taskId: string, taskTitle: string, subjectName?: string) {
  const res = await awardXP(userId, XP_REWARDS.TASK_COMPLETE, `Completed ${taskTitle}`, "task_complete", taskId);
  if (res?.event) {
    await checkAndAwardAchievements(userId, "tasks_completed", 1);
    
    // Check subject achievements if subjectName is provided
    if (subjectName) {
      const type = `subject_hours_${subjectName.toLowerCase()}`;
      
      // Calculate total hours for this subject
      const { data } = await supabase.rpc("get_subject_stats", {
        _user: userId,
        _from: "2000-01-01", // fetch all time
        _to: "2100-01-01"
      });
      
      const subjStat = data?.find((s: any) => s.name.toLowerCase() === subjectName.toLowerCase());
      if (subjStat) {
        const hours = Math.floor((subjStat.completed || 0) / 60);
        await checkAndAwardAchievements(userId, type, hours);
      }
    }
  }
  return res;
}

export async function awardTaskTime100(userId: string, taskId: string, taskTitle: string) {
  return await awardXP(userId, XP_REWARDS.TASK_TIME_100, `Reached 100% for ${taskTitle}`, "task_time_100", taskId);
}

export async function awardDailyGoalComplete(userId: string, date: string) {
  const res = await awardXP(userId, XP_REWARDS.DAILY_GOAL_COMPLETE, `Completed daily goals`, "daily_goal", date);
  if (res?.event) {
    await checkAndAwardAchievements(userId, "daily_goals", 1);
    // Since we don't have exact metrics for overachiever here easily without params, we can just do 150% in the component or rely on daily_overachiever being checked elsewhere.
  }
  return res;
}

export async function awardWeeklyGoalComplete(userId: string, weekRef: string) {
  const res = await awardXP(userId, XP_REWARDS.WEEKLY_GOAL_COMPLETE, `Completed weekly goals`, "weekly_goal", weekRef);
  if (res?.event) await checkAndAwardAchievements(userId, "weekly_goals", 1);
  return res;
}

export async function checkAndAwardAchievements(userId: string, eventType: string, currentValue: number) {
  // Fetch unawarded achievements matching the type
  const { data: achievements } = await supabase
    .from("achievements")
    .select("*")
    .eq("requirement_type", eventType);

  if (!achievements || achievements.length === 0) return;

  const { data: userAchievements } = await supabase
    .from("user_achievements")
    .select("achievement_id")
    .eq("user_id", userId);

  const awardedIds = new Set(userAchievements?.map(a => a.achievement_id) || []);

  for (const ach of achievements) {
    if (!awardedIds.has(ach.id)) {
      if (currentValue >= ach.requirement_value) {
        // Unlock achievement
        const { error } = await supabase
          .from("user_achievements")
          .insert({
            user_id: userId,
            achievement_id: ach.id
          });
        
        if (!error && ach.xp_reward > 0) {
          await awardXP(userId, ach.xp_reward, `Unlocked achievement: ${ach.name}`, "achievement_unlock", ach.id);
        }
      }
    }
  }
}
