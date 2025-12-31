// import { useQuery } from "@tanstack/react-query";
// import { supabase } from "@/integrations/supabase/client";
// import type { Message } from "@/types";

// export function useMessages(chatId: string | null) {
//   return useQuery({
//     queryKey: ["messages", chatId],
//     queryFn: async () => {
//       if (!chatId) return [];

//       const { data, error } = await supabase
//         .from("messages")
//         .select("*")
//         .eq("chat_id", chatId)
//         .order("created_at", { ascending: true });

//       if (error) throw error;

//       // The selected shape already matches our `Message` type
//       return (data ?? []) as Message[];
//     },
//     enabled: !!chatId,
//   });
// }

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Message } from "@/types";

export function useMessages(chatId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
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

  // Subscribe to realtime changes
  useEffect(() => {
    if (!chatId) return;

    const channelName = `messages:${chatId}`;
    console.log(`[Realtime] Setting up subscription for chat: ${chatId}`);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          console.log('[Realtime] Message change received:', payload);

          // Update cache optimistically
          queryClient.setQueryData<Message[]>(
            ["messages", chatId],
            (oldData = []) => {
              if (payload.eventType === 'INSERT') {
                const newMessage = payload.new as Message;
                // Check if message already exists (avoid duplicates)
                if (oldData.some(msg => msg.id === newMessage.id)) {
                  console.log('[Realtime] Message already exists, skipping');
                  return oldData;
                }
                const updated = [...oldData, newMessage].sort(
                  (a, b) => 
                    new Date(a.created_at || 0).getTime() - 
                    new Date(b.created_at || 0).getTime()
                );
                console.log('[Realtime] Added new message, total:', updated.length);
                return updated;
              } else if (payload.eventType === 'UPDATE') {
                return oldData.map(msg => 
                  msg.id === payload.new.id ? payload.new as Message : msg
                );
              } else if (payload.eventType === 'DELETE') {
                return oldData.filter(msg => msg.id !== payload.old.id);
              }
              return oldData;
            }
          );
        }
      )
      .subscribe((status) => {
        console.log(`[Realtime] Subscription status for ${channelName}:`, status);
        if (status === 'SUBSCRIBED') {
          console.log(`[Realtime] ✅ Successfully subscribed to messages for chat ${chatId}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`[Realtime] ❌ Channel error for chat ${chatId}`);
        } else if (status === 'TIMED_OUT') {
          console.error(`[Realtime] ⏱️ Subscription timed out for chat ${chatId}`);
        } else if (status === 'CLOSED') {
          console.log(`[Realtime] 🔒 Channel closed for chat ${chatId}`);
        }
      });

    return () => {
      console.log(`[Realtime] Cleaning up subscription for chat: ${chatId}`);
      supabase.removeChannel(channel);
    };
  }, [chatId, queryClient]);

  return query;
}

