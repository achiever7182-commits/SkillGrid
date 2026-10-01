-- StudySync Complete PostgreSQL Schema & RLS Migrations
-- Generated for Supabase Auth & Database Integration

-- ========================================================
-- 1. Profiles Table & Security
-- ========================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  avatar_url text,
  bio text,
  college text,
  graduation_year int,
  timezone text DEFAULT 'UTC',
  onboarded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower ON public.profiles (lower(username));
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ========================================================
-- 2. User Settings Table
-- ========================================================
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_visibility text NOT NULL DEFAULT 'friends' CHECK (profile_visibility IN ('public','friends','private')),
  progress_visibility text NOT NULL DEFAULT 'friends' CHECK (progress_visibility IN ('public','friends','private')),
  activity_visibility text NOT NULL DEFAULT 'friends' CHECK (activity_visibility IN ('public','friends','private')),
  streak_threshold int NOT NULL DEFAULT 70 CHECK (streak_threshold BETWEEN 1 AND 100),
  notify_friend_activity boolean NOT NULL DEFAULT false,
  notify_streaks boolean NOT NULL DEFAULT true,
  daily_reminders boolean NOT NULL DEFAULT false
);
GRANT SELECT, INSERT, UPDATE ON public.user_settings TO authenticated;
GRANT ALL ON public.user_settings TO service_role;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own settings select" ON public.user_settings;
CREATE POLICY "own settings select" ON public.user_settings FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "own settings update" ON public.user_settings;
CREATE POLICY "own settings update" ON public.user_settings FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "own settings insert" ON public.user_settings;
CREATE POLICY "own settings insert" ON public.user_settings FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- ========================================================
-- 3. Friendships Table
-- ========================================================
CREATE TABLE IF NOT EXISTS public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (requester_id, receiver_id),
  CHECK (requester_id <> receiver_id)
);
CREATE INDEX IF NOT EXISTS friendships_receiver_idx ON public.friendships(receiver_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.friendships TO authenticated;
GRANT ALL ON public.friendships TO service_role;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "parties read" ON public.friendships;
CREATE POLICY "parties read" ON public.friendships FOR SELECT TO authenticated USING (auth.uid() IN (requester_id, receiver_id));
DROP POLICY IF EXISTS "request send" ON public.friendships;
CREATE POLICY "request send" ON public.friendships FOR INSERT TO authenticated WITH CHECK (requester_id = auth.uid() AND status = 'pending');
DROP POLICY IF EXISTS "receiver respond" ON public.friendships;
CREATE POLICY "receiver respond" ON public.friendships FOR UPDATE TO authenticated USING (receiver_id = auth.uid()) WITH CHECK (receiver_id = auth.uid());
DROP POLICY IF EXISTS "parties delete" ON public.friendships;
CREATE POLICY "parties delete" ON public.friendships FOR DELETE TO authenticated USING (auth.uid() IN (requester_id, receiver_id));

-- Helper functions for privacy controls
CREATE OR REPLACE FUNCTION public.are_friends(_a uuid, _b uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.friendships WHERE status='accepted'
    AND ((requester_id=_a AND receiver_id=_b) OR (requester_id=_b AND receiver_id=_a)))
$$;

CREATE OR REPLACE FUNCTION public.can_view(_owner uuid, _kind text) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v text;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  IF _owner = auth.uid() THEN RETURN true; END IF;
  SELECT CASE _kind WHEN 'profile' THEN profile_visibility WHEN 'progress' THEN progress_visibility ELSE activity_visibility END
    INTO v FROM public.user_settings WHERE user_id = _owner;
  IF v = 'public' THEN RETURN true; END IF;
  IF v = 'friends' THEN RETURN public.are_friends(_owner, auth.uid()); END IF;
  RETURN false;
END $$;

DROP POLICY IF EXISTS "profiles visible" ON public.profiles;
CREATE POLICY "profiles visible" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.can_view(id, 'profile'));
DROP POLICY IF EXISTS "profiles own update" ON public.profiles;
CREATE POLICY "profiles own update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
DROP POLICY IF EXISTS "profiles own insert" ON public.profiles;
CREATE POLICY "profiles own insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- ========================================================
-- 4. Subjects Table
-- ========================================================
CREATE TABLE IF NOT EXISTS public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text,
  color text NOT NULL DEFAULT '#84cc16',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subjects TO authenticated;
GRANT ALL ON public.subjects TO service_role;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own subjects" ON public.subjects;
CREATE POLICY "own subjects" ON public.subjects FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ========================================================
-- 5. Tasks Table
-- ========================================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  title text NOT NULL,
  planned_minutes int NOT NULL CHECK (planned_minutes > 0),
  days_of_week int[] NOT NULL DEFAULT '{0,1,2,3,4,5,6}',
  recurring boolean NOT NULL DEFAULT true,
  start_date date NOT NULL DEFAULT current_date,
  end_date date,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tasks_user_idx ON public.tasks(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own tasks" ON public.tasks;
CREATE POLICY "own tasks" ON public.tasks FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ========================================================
-- 6. Task Instances Table (Daily Occurrences)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.task_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  title text NOT NULL,
  date date NOT NULL,
  planned_minutes int NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  notes text,
  UNIQUE (task_id, date)
);
CREATE INDEX IF NOT EXISTS task_instances_user_date ON public.task_instances(user_id, date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_instances TO authenticated;
GRANT ALL ON public.task_instances TO service_role;
ALTER TABLE public.task_instances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own instances" ON public.task_instances;
CREATE POLICY "own instances" ON public.task_instances FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ========================================================
-- 7. Activities Table
-- ========================================================
CREATE TABLE IF NOT EXISTS public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  message text NOT NULL,
  dedupe_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, dedupe_key)
);
CREATE INDEX IF NOT EXISTS activities_created_idx ON public.activities(created_at DESC);
GRANT SELECT, INSERT, DELETE ON public.activities TO authenticated;
GRANT ALL ON public.activities TO service_role;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "activities visible" ON public.activities;
CREATE POLICY "activities visible" ON public.activities FOR SELECT TO authenticated USING (public.can_view(user_id, 'activity'));
DROP POLICY IF EXISTS "activities own insert" ON public.activities;
CREATE POLICY "activities own insert" ON public.activities FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "activities own delete" ON public.activities;
CREATE POLICY "activities own delete" ON public.activities FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ========================================================
-- 8. Reactions Table
-- ========================================================
CREATE TABLE IF NOT EXISTS public.reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_id uuid NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  reaction text NOT NULL CHECK (reaction IN ('🔥','👏','💪','🎯')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, activity_id, reaction)
);
GRANT SELECT, INSERT, DELETE ON public.reactions TO authenticated;
GRANT ALL ON public.reactions TO service_role;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reactions visible" ON public.reactions;
CREATE POLICY "reactions visible" ON public.reactions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.activities a WHERE a.id = activity_id));
DROP POLICY IF EXISTS "reactions own insert" ON public.reactions;
CREATE POLICY "reactions own insert" ON public.reactions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.activities a WHERE a.id = activity_id));
DROP POLICY IF EXISTS "reactions own delete" ON public.reactions;
CREATE POLICY "reactions own delete" ON public.reactions FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ========================================================
-- 9. Notifications Table
-- ========================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  link text,
  read boolean NOT NULL DEFAULT false,
  dedupe_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, dedupe_key)
);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own notifications select" ON public.notifications;
CREATE POLICY "own notifications select" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "own notifications insert" ON public.notifications;
CREATE POLICY "own notifications insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND actor_id IS NULL);
DROP POLICY IF EXISTS "own notifications update" ON public.notifications;
CREATE POLICY "own notifications update" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "own notifications delete" ON public.notifications;
CREATE POLICY "own notifications delete" ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ========================================================
-- 10. Triggers & Functions
-- ========================================================

-- Trigger: Auto-create profile and settings on signup
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
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Notify on friend request or acceptance
CREATE OR REPLACE FUNCTION public.on_friendship_change() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT coalesce(nullif(full_name,''), username) INTO n FROM public.profiles WHERE id = NEW.requester_id;
    INSERT INTO public.notifications (user_id, type, actor_id, message, link)
    VALUES (NEW.receiver_id, 'friend_request', NEW.requester_id, n || ' sent you a friend request', '/friends');
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'accepted' AND OLD.status <> 'accepted' THEN
    SELECT coalesce(nullif(full_name,''), username) INTO n FROM public.profiles WHERE id = NEW.receiver_id;
    INSERT INTO public.notifications (user_id, type, actor_id, message, link)
    VALUES (NEW.requester_id, 'friend_accepted', NEW.receiver_id, n || ' accepted your friend request', '/friends');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS friendship_notify ON public.friendships;
CREATE TRIGGER friendship_notify AFTER INSERT OR UPDATE ON public.friendships FOR EACH ROW EXECUTE FUNCTION public.on_friendship_change();

-- Trigger: Create activity on task instance completion
CREATE OR REPLACE FUNCTION public.on_instance_completed() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.completed AND NOT OLD.completed THEN
    INSERT INTO public.activities (user_id, type, message, dedupe_key)
    VALUES (NEW.user_id, 'task_completed', 'completed ' || NEW.title, 'task:' || NEW.id)
    ON CONFLICT (user_id, dedupe_key) DO NOTHING;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS instance_completed ON public.task_instances;
CREATE TRIGGER instance_completed AFTER UPDATE ON public.task_instances FOR EACH ROW EXECUTE FUNCTION public.on_instance_completed();

-- Trigger: Notify friends on activity created
CREATE OR REPLACE FUNCTION public.on_activity_created() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n text; vis text;
BEGIN
  SELECT activity_visibility INTO vis FROM public.user_settings WHERE user_id = NEW.user_id;
  IF vis = 'private' THEN RETURN NEW; END IF;
  SELECT coalesce(nullif(full_name,''), username) INTO n FROM public.profiles WHERE id = NEW.user_id;
  INSERT INTO public.notifications (user_id, type, actor_id, message, link)
  SELECT s.user_id, 'friend_activity', NEW.user_id, n || ' ' || NEW.message, '/friends'
  FROM public.user_settings s
  WHERE s.notify_friend_activity AND s.user_id <> NEW.user_id AND public.are_friends(s.user_id, NEW.user_id);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS activity_notify ON public.activities;
CREATE TRIGGER activity_notify AFTER INSERT ON public.activities FOR EACH ROW EXECUTE FUNCTION public.on_activity_created();

-- ========================================================
-- 11. RPC Functions
-- ========================================================

CREATE OR REPLACE FUNCTION public.username_available(_username text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = lower(_username))
$$;
GRANT EXECUTE ON FUNCTION public.username_available(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.search_users(_q text)
RETURNS TABLE (id uuid, username text, full_name text, avatar_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.username, p.full_name, p.avatar_url FROM public.profiles p
  JOIN public.user_settings s ON s.user_id = p.id
  WHERE auth.uid() IS NOT NULL AND p.id <> auth.uid() AND s.profile_visibility <> 'private'
    AND length(trim(_q)) >= 2
    AND (p.username ILIKE '%' || trim(_q) || '%' OR p.full_name ILIKE '%' || trim(_q) || '%')
  ORDER BY p.username LIMIT 20
$$;

CREATE OR REPLACE FUNCTION public.basic_profiles(_ids uuid[])
RETURNS TABLE (id uuid, username text, full_name text, avatar_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.username, p.full_name, p.avatar_url FROM public.profiles p
  WHERE auth.uid() IS NOT NULL AND p.id = ANY(_ids)
$$;

CREATE OR REPLACE FUNCTION public.profile_id_by_username(_username text) RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.profiles WHERE auth.uid() IS NOT NULL AND lower(username) = lower(_username)
$$;

CREATE OR REPLACE FUNCTION public.get_daily_stats(_user uuid, _from date, _to date)
RETURNS TABLE (day date, planned int, completed int, total_tasks int, done_tasks int)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.can_view(_user, 'progress') THEN RETURN; END IF;
  RETURN QUERY
  SELECT d::date,
    coalesce(sum(ti.planned_minutes),0)::int,
    coalesce(sum(ti.planned_minutes) FILTER (WHERE ti.completed),0)::int,
    count(ti.id)::int,
    (count(ti.id) FILTER (WHERE ti.completed))::int
  FROM generate_series(_from, _to, interval '1 day') d
  LEFT JOIN public.task_instances ti ON ti.user_id = _user AND ti.date = d::date
  GROUP BY d ORDER BY d;
END $$;

CREATE OR REPLACE FUNCTION public.get_subject_stats(_user uuid, _from date, _to date)
RETURNS TABLE (subject_id uuid, name text, color text, planned int, completed int)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.can_view(_user, 'progress') THEN RETURN; END IF;
  RETURN QUERY
  SELECT s.id, coalesce(s.name, 'Other'), coalesce(s.color, '#71717a'),
    coalesce(sum(ti.planned_minutes),0)::int,
    coalesce(sum(ti.planned_minutes) FILTER (WHERE ti.completed),0)::int
  FROM public.task_instances ti LEFT JOIN public.subjects s ON s.id = ti.subject_id
  WHERE ti.user_id = _user AND ti.date BETWEEN _from AND _to
  GROUP BY s.id, s.name, s.color ORDER BY 4 DESC;
END $$;

CREATE OR REPLACE FUNCTION public.get_streak_threshold(_user uuid) RETURNS int
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN public.can_view(_user,'progress') THEN streak_threshold END FROM public.user_settings WHERE user_id = _user
$$;

REVOKE EXECUTE ON FUNCTION public.search_users(text), public.basic_profiles(uuid[]), public.profile_id_by_username(text),
  public.get_daily_stats(uuid,date,date), public.get_subject_stats(uuid,date,date), public.get_streak_threshold(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.search_users(text), public.basic_profiles(uuid[]), public.profile_id_by_username(text),
  public.get_daily_stats(uuid,date,date), public.get_subject_stats(uuid,date,date), public.get_streak_threshold(uuid) TO authenticated;
