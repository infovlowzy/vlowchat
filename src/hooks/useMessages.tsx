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
        .order("created_at", { ascending: true });

      if (error) throw error;

      // The selected shape already matches our `Message` type
      return (data ?? []) as Message[];
    },
    enabled: !!chatId,
  });
}
