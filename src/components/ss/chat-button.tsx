import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { MessageSquare, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/use-session";

export function ChatButton({ friendId }: { friendId: string }) {
  const { data: user } = useUser();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { data: state, isLoading } = useQuery({
    queryKey: ["chat-state", user?.id, friendId],
    enabled: !!user && !!friendId && user.id !== friendId,
    queryFn: async () => {
      // Are they friends?
      const { data: fs } = await supabase
        .from("friendships")
        .select("*")
        .eq("status", "accepted")
        .or(`and(requester_id.eq.${user!.id},receiver_id.eq.${friendId}),and(requester_id.eq.${friendId},receiver_id.eq.${user!.id})`)
        .maybeSingle();

      if (!fs) return { status: "not_friends" as const };

      // Is there a room?
      const { data: myRooms } = await supabase.from("chat_room_members").select("room_id").eq("user_id", user!.id);
      if (myRooms && myRooms.length > 0) {
        const roomIds = myRooms.map(m => m.room_id);
        const { data: theirRooms } = await supabase
          .from("chat_room_members")
          .select("room_id")
          .eq("user_id", friendId)
          .in("room_id", roomIds)
          .maybeSingle();
        if (theirRooms) return { status: "has_room" as const, roomId: theirRooms.room_id };
      }

      // Is there a request?
      const { data: req } = await supabase
        .from("chat_requests")
        .select("*")
        .or(`and(sender_id.eq.${user!.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user!.id})`)
        .maybeSingle();

      if (req) {
        if (req.status === "pending") {
          if (req.sender_id === user!.id) return { status: "request_sent" as const };
          return { status: "request_received" as const, requestId: req.id };
        }
        if (req.status === "declined") {
          return { status: "declined" as const };
        }
      }

      return { status: "can_request" as const };
    },
  });

  if (!user || user.id === friendId || isLoading || !state) return null;

  if (state.status === "not_friends") return null;

  if (state.status === "has_room") {
    return (
      <Button asChild variant="outline" size="sm">
        <Link to="/messages" search={{ room: state.roomId }}>
          <MessageSquare className="size-4 mr-2" />
          Message
        </Link>
      </Button>
    );
  }

  if (state.status === "request_sent") {
    return (
      <Button disabled variant="outline" size="sm">
        <Clock className="size-4 mr-2" />
        Request Pending
      </Button>
    );
  }

  if (state.status === "request_received") {
    const handleAccept = async () => {
      setLoading(true);
      const { data: roomId, error } = await supabase.rpc("accept_chat_request", { _request_id: state.requestId });
      setLoading(false);
      if (error) {
        toast.error("Failed to accept: " + error.message);
        return;
      }
      qc.invalidateQueries({ queryKey: ["chat-state"] });
      qc.invalidateQueries({ queryKey: ["messages-data"] });
      navigate({ to: "/messages", search: { room: roomId } });
    };
    return (
      <Button size="sm" onClick={handleAccept} disabled={loading}>
        <MessageSquare className="size-4 mr-2" />
        Accept Chat Request
      </Button>
    );
  }

  const handleRequest = async () => {
    setLoading(true);
    const { error } = await supabase.from("chat_requests").insert({
      sender_id: user.id,
      receiver_id: friendId,
    });
    setLoading(false);
    if (error) {
      toast.error("Failed to send chat request");
      return;
    }
    toast.success("Chat request sent ✓");
    qc.invalidateQueries({ queryKey: ["chat-state"] });
    
    // Also notify
    await supabase.from("notifications").upsert({
      user_id: friendId,
      type: "chat_request",
      actor_id: user.id,
      message: "wants to chat with you.",
      link: "/messages",
      dedupe_key: `chat_request_${user.id}_${friendId}`
    });
  };

  return (
    <Button size="sm" variant="outline" onClick={handleRequest} disabled={loading}>
      <MessageSquare className="size-4 mr-2" />
      Request Chat
    </Button>
  );
}
