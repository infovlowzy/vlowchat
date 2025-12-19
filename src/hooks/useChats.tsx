import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ChatStatus, Channel } from "@/types";

export function useChats() {
  return useQuery({
    queryKey: ["chats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chats")
        .select(`
          id,
          workspace_id,
          contact_id,
          current_status,
          assigned_user_id,
          unread_count_for_human,
          last_message_at,
          created_at,
          contact:contacts (
            id,
            display_name,
            phone_number
          ),
          messages (
            id,
            text,
            created_at,
            direction,
            sender_type
          )
        `)
        .order("last_message_at", { ascending: false, nullsFirst: false });

      if (error) throw error;

      return (data ?? []).map((chat: any) => {
        const messages = Array.isArray(chat.messages) ? [...chat.messages] : [];

        // Sort messages by created_at just in case they are not already sorted
        messages.sort((a, b) => {
          const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
          return aTime - bTime;
        });

        const lastMessage = messages[messages.length - 1] ?? null;

        const customerName =
          chat.contact?.display_name ||
          chat.contact?.phone_number ||
          "Unknown contact";

        const status = (chat.current_status ?? "ai") as ChatStatus;

        const mode =
          lastMessage?.sender_type === "ai"
            ? "ai"
            : "admin";

        const channel: Channel = "whatsapp";

        return {
          id: chat.id,
          customerName,
          customerAvatar: null,
          channel,
          status,
          mode,
          lastMessage: lastMessage?.text ?? "",
          lastMessageTime: lastMessage?.created_at ?? chat.last_message_at,
          unreadCount: chat.unread_count_for_human ?? 0,
          escalated: false,
          paymentRelated: false,
          tags: [],
          notes: "",
          firstSeen: chat.created_at,
          totalChats: messages.length,
        };
      });
    },
  });
}
