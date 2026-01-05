import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ChatStatus } from "@/types";

export function useUpdateChatStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      chatId, 
      status 
    }: { 
      chatId: string; 
      status: ChatStatus;
    }) => {
      const { error } = await supabase
        .from("chats")
        .update({ 
          current_status: status,
        })
        .eq("id", chatId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
}



