import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import type { Message } from "@/types";

export function useMessages(chatId: string | null) {
  const { currentWorkspaceId } = useWorkspace();

  return useQuery({
    queryKey: ["messages", chatId],
    queryFn: async () => {
      if (!chatId || !currentWorkspaceId) return [];

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("workspace_id", currentWorkspaceId)
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      return (data || []) as Message[];
    },
    enabled: !!chatId && !!currentWorkspaceId,
  });
}

export function useSendMessage() {
  const { currentWorkspaceId } = useWorkspace();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      chatId, 
      contactId, 
      text 
    }: { 
      chatId: string; 
      contactId: string; 
      text: string;
    }) => {
      if (!currentWorkspaceId) throw new Error("No workspace selected");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Insert message
      const { error: messageError } = await supabase
        .from("messages")
        .insert({
          workspace_id: currentWorkspaceId,
          chat_id: chatId,
          contact_id: contactId,
          direction: "outbound",
          sender_type: "human",
          sender_user_id: user.id,
          content_type: "text",
          text: text,
        });

      if (messageError) throw messageError;

      // Update chat
      const { error: chatError } = await supabase
        .from("chats")
        .update({
          last_message_at: new Date().toISOString(),
          current_status: "human",
          unread_count_for_human: 0,
        })
        .eq("id", chatId);

      if (chatError) throw chatError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["messages", variables.chatId] });
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
}

export function useUpdateChatStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      chatId, 
      status,
      assignedUserId 
    }: { 
      chatId: string; 
      status: 'ai' | 'needs_action' | 'human' | 'resolved';
      assignedUserId?: string;
    }) => {
      const updateData: Record<string, unknown> = { current_status: status };
      if (assignedUserId !== undefined) {
        updateData.assigned_user_id = assignedUserId;
      }
      if (status === 'resolved' || status === 'human') {
        updateData.unread_count_for_human = 0;
      }

      const { error } = await supabase
        .from("chats")
        .update(updateData)
        .eq("id", chatId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
}
