-- SkillGrid Consolidated Database Migration
-- Run this script in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query -> Run)
-- It creates all missing tables, adds description columns, and refreshes the PostgREST schema cache.

-- 1. Add description columns to tasks and task_instances
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.task_instances ADD COLUMN IF NOT EXISTS description text;

-- 2. Reward & Gamification System

CREATE TABLE IF NOT EXISTS public.user_stats (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_xp int NOT NULL DEFAULT 0,
  current_level int NOT NULL DEFAULT 1,
  current_streak int NOT NULL DEFAULT 0,
  longest_streak int NOT NULL DEFAULT 0,
  last_active_date date,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed user_stats for any existing users
INSERT INTO public.user_stats (user_id)
SELECT id FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- Trigger to create user_stats on new user signup
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
  event_type text NOT NULL,
  reference_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_type, reference_id)
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

INSERT INTO public.achievements (id, name, description, icon, requirement_type, requirement_value, xp_reward) VALUES
('first_step', 'First Step', 'Complete your first task.', '🚀', 'tasks_completed', 1, 100),
('on_fire', 'On Fire', 'Maintain a 7-day streak.', '🔥', 'streak_days', 7, 250),
('consistency', 'Consistency', 'Maintain a 30-day streak.', '⚡', 'streak_days', 30, 1000),
('dsa_grinder', 'DSA Grinder', 'Complete 50 hours of DSA.', '💻', 'subject_hours_dsa', 50, 500),
('math_warrior', 'Math Warrior', 'Complete 25 hours of Maths.', '📐', 'subject_hours_maths', 25, 250),
('ml_explorer', 'ML Explorer', 'Complete 25 hours of AI/ML.', '🤖', 'subject_hours_ml', 25, 250),
('goal_crusher', 'Goal Crusher', 'Complete a daily goal.', '🎯', 'daily_goals', 1, 100),
('overachiever', 'Overachiever', 'Reach at least 150% of a daily goal.', '🏆', 'daily_overachiever', 1, 200),
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

-- RLS Policies for Rewards
GRANT SELECT, INSERT, UPDATE ON public.user_stats TO authenticated;
GRANT ALL ON public.user_stats TO service_role;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own user_stats" ON public.user_stats;
CREATE POLICY "own user_stats" ON public.user_stats FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "friends user_stats select" ON public.user_stats;
CREATE POLICY "friends user_stats select" ON public.user_stats FOR SELECT TO authenticated USING (public.can_view(user_id, 'progress'));

GRANT SELECT, INSERT ON public.xp_events TO authenticated;
GRANT ALL ON public.xp_events TO service_role;
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own xp_events" ON public.xp_events;
CREATE POLICY "own xp_events" ON public.xp_events FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "own xp_events insert" ON public.xp_events;
CREATE POLICY "own xp_events insert" ON public.xp_events FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

GRANT SELECT ON public.achievements TO authenticated;
GRANT ALL ON public.achievements TO service_role;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "all select achievements" ON public.achievements;
CREATE POLICY "all select achievements" ON public.achievements FOR SELECT TO authenticated USING (true);

GRANT SELECT, INSERT ON public.user_achievements TO authenticated;
GRANT ALL ON public.user_achievements TO service_role;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own user_achievements" ON public.user_achievements;
CREATE POLICY "own user_achievements" ON public.user_achievements FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "friends user_achievements select" ON public.user_achievements;
CREATE POLICY "friends user_achievements select" ON public.user_achievements FOR SELECT TO authenticated USING (public.can_view(user_id, 'progress'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.personal_rewards TO authenticated;
GRANT ALL ON public.personal_rewards TO service_role;
ALTER TABLE public.personal_rewards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own personal_rewards" ON public.personal_rewards;
CREATE POLICY "own personal_rewards" ON public.personal_rewards FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT ON public.reward_redemptions TO authenticated;
GRANT ALL ON public.reward_redemptions TO service_role;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own reward_redemptions" ON public.reward_redemptions;
CREATE POLICY "own reward_redemptions" ON public.reward_redemptions FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());


-- 3. Chat System

CREATE TABLE IF NOT EXISTS public.chat_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sender_id, receiver_id),
  CHECK (sender_id <> receiver_id)
);
CREATE INDEX IF NOT EXISTS chat_requests_sender_idx ON public.chat_requests(sender_id);
CREATE INDEX IF NOT EXISTS chat_requests_receiver_idx ON public.chat_requests(receiver_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_requests TO authenticated;
GRANT ALL ON public.chat_requests TO service_role;
ALTER TABLE public.chat_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "parties read chat requests" ON public.chat_requests;
CREATE POLICY "parties read chat requests" ON public.chat_requests FOR SELECT TO authenticated USING (auth.uid() IN (sender_id, receiver_id));
DROP POLICY IF EXISTS "sender insert chat request" ON public.chat_requests;
CREATE POLICY "sender insert chat request" ON public.chat_requests FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid() AND status = 'pending' AND public.are_friends(auth.uid(), receiver_id));
DROP POLICY IF EXISTS "parties update chat requests" ON public.chat_requests;
CREATE POLICY "parties update chat requests" ON public.chat_requests FOR UPDATE TO authenticated USING (auth.uid() IN (sender_id, receiver_id)) WITH CHECK (auth.uid() IN (sender_id, receiver_id));
DROP POLICY IF EXISTS "parties delete chat requests" ON public.chat_requests;
CREATE POLICY "parties delete chat requests" ON public.chat_requests FOR DELETE TO authenticated USING (auth.uid() IN (sender_id, receiver_id));

CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_rooms TO authenticated;
GRANT ALL ON public.chat_rooms TO service_role;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.chat_room_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, user_id)
);
CREATE INDEX IF NOT EXISTS chat_room_members_room_idx ON public.chat_room_members(room_id);
CREATE INDEX IF NOT EXISTS chat_room_members_user_idx ON public.chat_room_members(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_room_members TO authenticated;
GRANT ALL ON public.chat_room_members TO service_role;
ALTER TABLE public.chat_room_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_room_member(_room_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.chat_room_members WHERE room_id = _room_id AND user_id = auth.uid())
$$;

DROP POLICY IF EXISTS "member read rooms" ON public.chat_rooms;
CREATE POLICY "member read rooms" ON public.chat_rooms FOR SELECT TO authenticated USING (public.is_room_member(id));

DROP POLICY IF EXISTS "member read room members" ON public.chat_room_members;
CREATE POLICY "member read room members" ON public.chat_room_members FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_room_member(room_id));
DROP POLICY IF EXISTS "member update own member record" ON public.chat_room_members;
CREATE POLICY "member update own member record" ON public.chat_room_members FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz,
  deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS messages_room_idx ON public.messages(room_id);
CREATE INDEX IF NOT EXISTS messages_created_idx ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS messages_sender_idx ON public.messages(sender_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "member read messages" ON public.messages;
CREATE POLICY "member read messages" ON public.messages FOR SELECT TO authenticated USING (public.is_room_member(room_id));
DROP POLICY IF EXISTS "member insert messages" ON public.messages;
CREATE POLICY "member insert messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid() AND public.is_room_member(room_id));
DROP POLICY IF EXISTS "sender update messages" ON public.messages;
CREATE POLICY "sender update messages" ON public.messages FOR UPDATE TO authenticated USING (sender_id = auth.uid()) WITH CHECK (sender_id = auth.uid());
DROP POLICY IF EXISTS "sender delete messages" ON public.messages;
CREATE POLICY "sender delete messages" ON public.messages FOR DELETE TO authenticated USING (sender_id = auth.uid());

CREATE OR REPLACE FUNCTION public.accept_chat_request(_request_id uuid) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_req public.chat_requests;
  v_room_id uuid;
BEGIN
  SELECT * INTO v_req FROM public.chat_requests WHERE id = _request_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF v_req.receiver_id <> auth.uid() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF v_req.status = 'accepted' THEN RAISE EXCEPTION 'Already accepted'; END IF;
  
  INSERT INTO public.chat_rooms (created_at, updated_at) VALUES (now(), now()) RETURNING id INTO v_room_id;
  INSERT INTO public.chat_room_members (room_id, user_id) VALUES (v_room_id, v_req.sender_id), (v_room_id, v_req.receiver_id);
  UPDATE public.chat_requests SET status = 'accepted', updated_at = now() WHERE id = _request_id;
  
  INSERT INTO public.notifications (user_id, type, actor_id, message, link, dedupe_key)
  VALUES (v_req.sender_id, 'chat_accepted', auth.uid(), 'accepted your chat request.', '/messages', 'chat_accepted_' || v_req.id::text)
  ON CONFLICT (user_id, dedupe_key) DO NOTHING;
  
  RETURN v_room_id;
END $$;

-- 4. Reload PostgREST Schema Cache
NOTIFY pgrst, 'reload schema';

-- 5. Admin Controls (Block/Unblock/Delete)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blocked boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.admin_block_user(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.profiles SET blocked = true WHERE id = _user_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_block_user(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_unblock_user(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.profiles SET blocked = false WHERE id = _user_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_unblock_user(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_delete_user(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.profiles WHERE id = _user_id;
  DELETE FROM auth.users WHERE id = _user_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO anon, authenticated;
