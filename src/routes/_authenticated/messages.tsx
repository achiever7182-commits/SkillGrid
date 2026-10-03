import { useState, useEffect, useRef } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppShell, PageHeader } from "@/components/ss/app-shell";
import { EmptyState, Panel, SectionTitle, UserAvatar } from "@/components/ss/primitives";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/use-session";

export const Route = createFileRoute("/_authenticated/messages")({
  validateSearch: (s: Record<string, unknown>): { room?: string } =>
    typeof s["room"] === "string" ? { room: s["room"] } : {},
  head: () => ({
    meta: [{ title: "Messages — SkillGrid" }],
  }),
  component: MessagesPage,
});

type BasicProfile = { id: string; username: string; full_name: string; avatar_url: string | null };

function MessagesPage() {
  const { room: activeRoomId } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { data: user } = useUser();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["messages-data", user?.id],
    enabled: !!user,
    queryFn: async () => {
      try {
        // Fetch friends
        const { data: fs } = await supabase.from("friendships").select("*").eq("status", "accepted");
        
        // Fetch chat requests
        const { data: reqs } = await supabase.from("chat_requests").select("*");
        
        // Fetch rooms I am part of
        const { data: myRooms } = await supabase.from("chat_room_members").select("room_id, user_id, last_read_at, room:chat_rooms(updated_at)");
        
        // Find IDs to fetch profiles
        const ids = new Set<string>();
        (fs ?? []).forEach(f => { ids.add(f.requester_id); ids.add(f.receiver_id); });
        (reqs ?? []).forEach(r => { ids.add(r.sender_id); ids.add(r.receiver_id); });
        
        // We also need profiles for members of my rooms (other users)
        const myRoomIds = [...new Set((myRooms ?? []).filter(m => m.user_id === user!.id).map(m => m.room_id))];
        const otherMembers = (myRooms ?? []).filter(m => m.user_id !== user!.id && myRoomIds.includes(m.room_id));
        otherMembers.forEach(m => ids.add(m.user_id));

        const { data: people } = await supabase.rpc("basic_profiles", { _ids: [...ids] });
        const get = (id: string) => people?.find((p) => p.id === id) as BasicProfile | undefined;

        return {
          fs: fs ?? [],
          reqs: reqs ?? [],
          myRooms: myRooms ?? [],
          myRoomIds,
          otherMembers,
          get
        };
      } catch (err) {
        console.warn("Messages query fallback:", err);
        return {
          fs: [],
          reqs: [],
          myRooms: [],
          myRoomIds: [],
          otherMembers: [],
          get: () => undefined
        };
      }
    },
  });

  const [messages, setMessages] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeRoomId || !user) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("room_id", activeRoomId)
        .order("created_at", { ascending: true })
        .limit(100);
      setMessages(msgs ?? []);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    };

    fetchMessages();

    const channel = supabase
      .channel(`room:${activeRoomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${activeRoomId}` },
        (payload) => {
          setMessages((prev) => {
            if (prev.find((m) => m.id === (payload.new as any).id)) return prev;
            return [...prev, payload.new];
          });
          setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeRoomId, user]);

  if (!data || !user) return <AppShell><PageHeader title="Messages" /></AppShell>;

  const { reqs, get, otherMembers } = data;
  
  const incomingReqs = reqs.filter(r => r.receiver_id === user.id && r.status === "pending");
  
  // Chats we can open
  const activeChats = otherMembers.map(m => {
    const p = get(m.user_id);
    return {
      room_id: m.room_id,
      user_id: m.user_id,
      profile: p
    };
  });

  async function handleAccept(id: string) {
    const { data: roomId, error } = await supabase.rpc("accept_chat_request", { _request_id: id });
    if (error) {
      toast.error("Failed to accept: " + error.message);
      return;
    }
    toast.success("Chat request accepted");
    qc.invalidateQueries({ queryKey: ["messages-data"] });
    navigate({ search: { room: roomId } });
  }

  async function handleDecline(id: string) {
    await supabase.from("chat_requests").update({ status: "declined" }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["messages-data"] });
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !activeRoomId) return;

    const val = content.trim();
    setContent("");
    
    // Optimistic update
    const tempId = crypto.randomUUID();
    setMessages(prev => [...prev, { id: tempId, room_id: activeRoomId, sender_id: user!.id, content: val, created_at: new Date().toISOString() }]);
    setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

    const { error } = await supabase.from("messages").insert({
      room_id: activeRoomId,
      sender_id: user!.id,
      content: val
    });

    if (error) {
      toast.error("Failed to send message");
    }
  }

  const activeProfile = activeRoomId ? activeChats.find(c => c.room_id === activeRoomId)?.profile : null;

  return (
    <AppShell>
      <div className="grid h-[calc(100vh-8rem)] grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Sidebar */}
        <div className="flex flex-col gap-4 overflow-y-auto">
          <SectionTitle>Messages</SectionTitle>
          
          {incomingReqs.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Chat Requests</div>
              {incomingReqs.map(r => {
                const p = get(r.sender_id);
                return (
                  <Panel key={r.id} className="p-3 text-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <UserAvatar url={p?.avatar_url} name={p?.full_name} size={24} />
                      <span className="font-medium">{p?.full_name || p?.username}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1" onClick={() => handleAccept(r.id)}>Accept</Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => handleDecline(r.id)}>Decline</Button>
                    </div>
                  </Panel>
                )
              })}
            </div>
          )}

          <div className="space-y-2 flex-1">
            <div className="text-sm font-medium text-muted-foreground">Chats</div>
            {activeChats.length === 0 ? (
              <EmptyState title="No chats yet" body="Accept a chat request or go to a friend's profile to start one." />
            ) : (
              activeChats.map(c => (
                <button
                  key={c.room_id}
                  onClick={() => navigate({ search: { room: c.room_id } })}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition ${activeRoomId === c.room_id ? 'bg-primary/10 border border-primary/20' : 'glass hover:border-primary/40'}`}
                >
                  <UserAvatar url={c.profile?.avatar_url} name={c.profile?.full_name || c.profile?.username} />
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-medium truncate">{c.profile?.full_name || c.profile?.username}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Area - Chat */}
        <Panel className="md:col-span-2 flex flex-col h-full overflow-hidden">
          {activeRoomId && activeProfile ? (
            <>
              <div className="p-4 border-b flex items-center gap-3 bg-muted/30">
                <UserAvatar url={activeProfile.avatar_url} name={activeProfile.full_name} />
                <div className="font-semibold">{activeProfile.full_name || activeProfile.username}</div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <UserIcon className="size-12 opacity-20 mb-2" />
                    <p>No messages yet. Say hi!</p>
                  </div>
                ) : (
                  messages.map(m => {
                    const isMe = m.sender_id === user.id;
                    return (
                      <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${isMe ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted rounded-bl-sm'}`}>
                          {m.content}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-1 px-1">
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={scrollRef} />
              </div>

              <div className="p-3 border-t">
                <form onSubmit={sendMessage} className="flex gap-2">
                  <Input 
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" disabled={!content.trim()}>
                    <Send className="size-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <EmptyState title="Select a conversation" body="Choose a friend from the left sidebar to start chatting." />
            </div>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}
