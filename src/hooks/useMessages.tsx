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


import { useEffect } from 'react';
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
      return (data ?? []) as Message[];
    },
    enabled: !!chatId,
  });

  // Subscribe to realtime changes
  useEffect(() => {
    if (!chatId) return;

    const channel = supabase
      .channel(`messages:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          console.log('Realtime message change:', payload);

          // Update cache optimistically
          queryClient.setQueryData<Message[]>(
            ["messages", chatId],
            (oldData = []) => {
              if (payload.eventType === 'INSERT') {
                return [...oldData, payload.new as Message].sort(
                  (a, b) => 
                    new Date(a.created_at || 0).getTime() - 
                    new Date(b.created_at || 0).getTime()
                );
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, queryClient]);

  return query;
}


