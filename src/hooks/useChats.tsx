import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Chat } from "@/types";

export function useChats() {
  return useQuery({
    queryKey: ["chats"],
    queryFn: async () => {
      const { data: chatsData, error } = await supabase
        .from("chats")
        .select("*")
        .order("last_message_time", { ascending: false });

      if (error) throw error;

      // Grab the latest message for each chat so the list always shows a preview,
      // even when the chats table hasn't been updated with a last_message.
      const chatIds = (chatsData || []).map((chat) => chat.id);

      let latestMessages: Record<
        string,
        { content: string; timestamp: string | Date }
      > = {};

      if (chatIds.length > 0) {
        const { data: messageData, error: messageError } = await supabase
          .from("messages")
          .select("chat_id, content, timestamp")
          .in("chat_id", chatIds)
          .order("timestamp", { ascending: false });

        if (messageError) throw messageError;

        for (const message of messageData || []) {
          if (!latestMessages[message.chat_id]) {
            latestMessages[message.chat_id] = {
              content: message.content,
              timestamp: message.timestamp,
            };
          }
        }
      }

      return (chatsData || []).map((chat) => {
        const latestMessage = latestMessages[chat.id];
        const lastMessageContent =
          (chat.last_message && chat.last_message.trim()) ||
          latestMessage?.content ||
          "No messages yet";
        const lastMessageTimestamp =
          chat.last_message_time ||
          latestMessage?.timestamp ||
          chat.first_seen;

        return {
          id: chat.id,
          customerName: chat.customer_name,
          customerAvatar: chat.customer_avatar,
          channel: chat.channel,
          status: chat.status,
          mode: chat.mode,
          lastMessage: lastMessageContent,
          lastMessageTime: new Date(lastMessageTimestamp),
          unreadCount: chat.unread_count,
          escalated: chat.escalated,
          paymentRelated: chat.payment_related,
          tags: chat.tags,
          notes: chat.notes,
          firstSeen: new Date(chat.first_seen),
          totalChats: chat.total_chats,
        } as Chat;
      });
    },
  });
}
