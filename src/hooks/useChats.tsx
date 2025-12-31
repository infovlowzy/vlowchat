// import { useQuery } from "@tanstack/react-query";
// import { supabase } from "@/integrations/supabase/client";
// import type { ChatStatus, Channel } from "@/types";

// export function useChats() {
//   return useQuery({
//     queryKey: ["chats"],
//     queryFn: async () => {
//       const { data, error } = await supabase
//         .from("chats")
//         .select(`
//           id,
//           workspace_id,
//           contact_id,
//           current_status,
//           assigned_user_id,
//           unread_count_for_human,
//           last_message_at,
//           created_at,
//           contact:contacts (
//             id,
//             display_name,
//             phone_number
//           ),
//           messages (
//             id,
//             text,
//             created_at,
//             direction,
//             sender_type
//           )
//         `)
//         .order("last_message_at", { ascending: false, nullsFirst: false });

//       if (error) throw error;

//       return (data ?? []).map((chat: any) => {
//         const messages = Array.isArray(chat.messages) ? [...chat.messages] : [];

//         // Sort messages by created_at just in case they are not already sorted
//         messages.sort((a, b) => {
//           const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
//           const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
//           return aTime - bTime;
//         });

//         const lastMessage = messages[messages.length - 1] ?? null;

//         const customerName =
//           chat.contact?.display_name ||
//           chat.contact?.phone_number ||
//           "Unknown contact";

//         const status = (chat.current_status ?? "ai") as ChatStatus;

//         // Determine mode from last message sender type
//         const mode: 'ai' | 'admin' =
//           lastMessage?.sender_type === "ai"
//             ? "ai"
//             : "admin";

//         // Determine channel from phone number prefix
//         const phoneNumber = chat.contact?.phone_number || "";
//         const channel: Channel = phoneNumber.startsWith("web-") ? "web" : "whatsapp";

//         return {
//           id: chat.id,
//           customerName,
//           customerAvatar: null,
//           channel,
//           status,
//           current_status: status, // Add for compatibility
//           mode,
//           lastMessage: lastMessage?.text ?? "",
//           lastMessageTime: lastMessage?.created_at ?? chat.last_message_at,
//           unreadCount: chat.unread_count_for_human ?? 0,
//           escalated: false,
//           paymentRelated: false,
//           tags: [],
//           notes: "",
//           firstSeen: chat.created_at,
//           totalChats: messages.length,
//         };
//       });
//     },
//   });
// }


import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import type { ChatStatus, Channel } from "@/types";

export function useChats() {
  const queryClient = useQueryClient();
  const { currentWorkspaceId } = useWorkspace();

  const query = useQuery({
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

        // Determine mode from last message sender type
        const mode: 'ai' | 'admin' =
          lastMessage?.sender_type === "ai"
            ? "ai"
            : "admin";

        // Determine channel from phone number prefix
        const phoneNumber = chat.contact?.phone_number || "";
        const channel: Channel = phoneNumber.startsWith("web-") ? "web" : "whatsapp";

        return {
          id: chat.id,
          customerName,
          customerAvatar: null,
          channel,
          status,
          current_status: status, // Add for compatibility
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

  // Subscribe to realtime changes for chats
  useEffect(() => {
    if (!currentWorkspaceId) {
      console.log('[Realtime] No workspace ID, skipping chats subscription');
      return;
    }

    const channelName = `chats:${currentWorkspaceId}`;
    console.log(`[Realtime] Setting up subscription for chats in workspace: ${currentWorkspaceId}`);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
          filter: `workspace_id=eq.${currentWorkspaceId}`,
        },
        (payload) => {
          console.log('[Realtime] Chat change received:', payload);
          
          // Invalidate and refetch chats list to get updated data
          queryClient.invalidateQueries({ queryKey: ["chats"] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `workspace_id=eq.${currentWorkspaceId}`,
        },
        (payload) => {
          console.log('[Realtime] New message in workspace:', payload);
          
          // Invalidate chats to update last_message_at and unread counts
          queryClient.invalidateQueries({ queryKey: ["chats"] });
          
          // Also invalidate messages for the specific chat if it's loaded
          const newMessage = payload.new as any;
          if (newMessage?.chat_id) {
            queryClient.invalidateQueries({ queryKey: ["messages", newMessage.chat_id] });
          }
        }
      )
      .subscribe((status) => {
        console.log(`[Realtime] Chats subscription status:`, status);
        if (status === 'SUBSCRIBED') {
          console.log(`[Realtime] ✅ Successfully subscribed to chats for workspace ${currentWorkspaceId}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`[Realtime] ❌ Channel error for chats`);
        } else if (status === 'TIMED_OUT') {
          console.error(`[Realtime] ⏱️ Subscription timed out for chats`);
        }
      });

    return () => {
      console.log(`[Realtime] Cleaning up chats subscription`);
      supabase.removeChannel(channel);
    };
  }, [currentWorkspaceId, queryClient]);

  return query;
}
