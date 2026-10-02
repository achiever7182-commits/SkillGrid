-- Chat System Schema & RLS Migrations

-- 1. Chat Requests Table
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


-- 2. Chat Rooms Table
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_rooms TO authenticated;
GRANT ALL ON public.chat_rooms TO service_role;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;


-- 3. Chat Room Members Table
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

-- Helper to check room membership
CREATE OR REPLACE FUNCTION public.is_room_member(_room_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.chat_room_members WHERE room_id = _room_id AND user_id = auth.uid())
$$;

DROP POLICY IF EXISTS "member read rooms" ON public.chat_rooms;
CREATE POLICY "member read rooms" ON public.chat_rooms FOR SELECT TO authenticated USING (public.is_room_member(id));
-- Prevent direct inserts to chat_rooms except via the accept RPC

DROP POLICY IF EXISTS "member read room members" ON public.chat_room_members;
CREATE POLICY "member read room members" ON public.chat_room_members FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_room_member(room_id));
DROP POLICY IF EXISTS "member update own member record" ON public.chat_room_members;
CREATE POLICY "member update own member record" ON public.chat_room_members FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());


-- 4. Messages Table
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


-- 5. RPC function to accept chat request and create room atomically
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
  
  -- Create room
  INSERT INTO public.chat_rooms (created_at, updated_at) VALUES (now(), now()) RETURNING id INTO v_room_id;
  
  -- Add members
  INSERT INTO public.chat_room_members (room_id, user_id) VALUES (v_room_id, v_req.sender_id), (v_room_id, v_req.receiver_id);
  
  -- Update request
  UPDATE public.chat_requests SET status = 'accepted', updated_at = now() WHERE id = _request_id;
  
  -- Add a notification for the sender
  INSERT INTO public.notifications (user_id, type, actor_id, message, link, dedupe_key)
  VALUES (v_req.sender_id, 'chat_accepted', auth.uid(), 'accepted your chat request.', '/messages', 'chat_accepted_' || v_req.id::text)
  ON CONFLICT (user_id, dedupe_key) DO NOTHING;
  
  RETURN v_room_id;
END $$;
