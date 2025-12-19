import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Chat } from "@/types";

export function useChats() {
  return useQuery({
    queryKey: ["chats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chats")
        .select("*")
        .order("last_message_time", { ascending: false });

      if (error) throw error;

      return data.map((chat) => ({
        id: chat.id,
        customerName: chat.customer_name,
        customerAvatar: chat.customer_avatar,
        channel: chat.channel,
        status: chat.status,
        mode: chat.mode,
        lastMessage: chat.last_message || '',
        lastMessageTime: new Date(chat.last_message_time),
        unreadCount: chat.unread_count,
        escalated: chat.escalated,
        paymentRelated: chat.payment_related,
        tags: chat.tags,
        notes: chat.notes,
        firstSeen: new Date(chat.first_seen),
        totalChats: chat.total_chats,
      })) as Chat[];
    },
  });
}
