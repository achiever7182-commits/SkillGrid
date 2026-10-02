-- Reward System Schema

CREATE TABLE IF NOT EXISTS public.user_stats (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_xp int NOT NULL DEFAULT 0,
  current_level int NOT NULL DEFAULT 1,
  current_streak int NOT NULL DEFAULT 0,
  longest_streak int NOT NULL DEFAULT 0,
  last_active_date date,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Give all existing users a user_stats row
INSERT INTO public.user_stats (user_id)
SELECT id FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- Update trigger for handle_new_user to also create user_stats
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uname text := lower(coalesce(NEW.raw_user_meta_data->>'username', ''));
BEGIN
  IF uname = '' OR uname !~ '^[a-z0-9_]{3,24}$' OR EXISTS (SELECT 1 FROM public.profiles WHERE lower(username)=uname) THEN
    uname := 'user_' || substr(replace(NEW.id::text,'-',''),1,8);
  END IF;
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (NEW.id, uname, coalesce(NEW.raw_user_meta_data->>'full_name', ''));
  INSERT INTO public.user_settings (user_id) VALUES (NEW.id);
  INSERT INTO public.user_stats (user_id) VALUES (NEW.id);
  RETURN NEW;
END $$;

CREATE TABLE IF NOT EXISTS public.xp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount int NOT NULL,
  reason text NOT NULL,
  event_type text NOT NULL, -- e.g., 'task_complete', 'daily_goal', 'streak_3'
  reference_id text, -- e.g., task instance id, or date string
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_type, reference_id) -- Prevents farming (e.g. same task completion multiple times)
);

CREATE TABLE IF NOT EXISTS public.achievements (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  requirement_type text NOT NULL,
  requirement_value int NOT NULL,
  xp_reward int NOT NULL DEFAULT 0
);

-- Insert default achievements
INSERT INTO public.achievements (id, name, description, icon, requirement_type, requirement_value, xp_reward) VALUES
('first_step', 'First Step', 'Complete your first task.', '🚀', 'tasks_completed', 1, 100),
('on_fire', 'On Fire', 'Maintain a 7-day streak.', '🔥', 'streak_days', 7, 250),
('consistency', 'Consistency', 'Maintain a 30-day streak.', '💪', 'streak_days', 30, 1000),
('dsa_grinder', 'DSA Grinder', 'Complete 50 hours of DSA.', '🧠', 'subject_hours_dsa', 50, 500),
('math_warrior', 'Math Warrior', 'Complete 25 hours of Maths.', '📐', 'subject_hours_maths', 25, 250),
('ml_explorer', 'ML Explorer', 'Complete 25 hours of AI/ML.', '🤖', 'subject_hours_ml', 25, 250),
('goal_crusher', 'Goal Crusher', 'Complete a daily goal.', '🎯', 'daily_goals', 1, 100),
('overachiever', 'Overachiever', 'Reach at least 150% of a daily goal.', '⚡', 'daily_overachiever', 1, 200),
('weekly_champion', 'Weekly Champion', 'Complete an entire week''s planned goals.', '👑', 'weekly_goals', 1, 500)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id text NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS public.personal_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  icon text NOT NULL DEFAULT '🎁',
  xp_required int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reward_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_id uuid NOT NULL REFERENCES public.personal_rewards(id) ON DELETE CASCADE,
  redeemed_at timestamptz NOT NULL DEFAULT now()
);

-- RLS Policies

GRANT SELECT, INSERT, UPDATE ON public.user_stats TO authenticated;
GRANT ALL ON public.user_stats TO service_role;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own user_stats" ON public.user_stats FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "friends user_stats select" ON public.user_stats FOR SELECT TO authenticated USING (public.can_view(user_id, 'progress'));

GRANT SELECT, INSERT ON public.xp_events TO authenticated;
GRANT ALL ON public.xp_events TO service_role;
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own xp_events" ON public.xp_events FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own xp_events insert" ON public.xp_events FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

GRANT SELECT ON public.achievements TO authenticated;
GRANT ALL ON public.achievements TO service_role;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all select achievements" ON public.achievements FOR SELECT TO authenticated USING (true);

GRANT SELECT, INSERT ON public.user_achievements TO authenticated;
GRANT ALL ON public.user_achievements TO service_role;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own user_achievements" ON public.user_achievements FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "friends user_achievements select" ON public.user_achievements FOR SELECT TO authenticated USING (public.can_view(user_id, 'progress'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.personal_rewards TO authenticated;
GRANT ALL ON public.personal_rewards TO service_role;
ALTER TABLE public.personal_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own personal_rewards" ON public.personal_rewards FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT ON public.reward_redemptions TO authenticated;
GRANT ALL ON public.reward_redemptions TO service_role;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own reward_redemptions" ON public.reward_redemptions FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
