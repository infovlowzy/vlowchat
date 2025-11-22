import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Message } from "@/types";

export function useMessages(chatId: string | null) {
  return useQuery({
    queryKey: ["messages", chatId],
    queryFn: async () => {
      if (!chatId) return [];

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("timestamp", { ascending: true });

      if (error) throw error;

      return data.map((message) => ({
        ...message,
        chatId: message.chat_id,
        timestamp: new Date(message.timestamp),
      })) as Message[];
    },
    enabled: !!chatId,
  });
}
