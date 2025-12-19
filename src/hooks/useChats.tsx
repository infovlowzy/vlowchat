import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import type { Chat, ChatStatus } from "@/types";

export function useChats(status?: ChatStatus) {
  const { currentWorkspaceId } = useWorkspace();

  return useQuery({
    queryKey: ["chats", currentWorkspaceId, status],
    queryFn: async () => {
      if (!currentWorkspaceId) return [];

      let query = supabase
        .from("chats")
        .select(`
          *,
          contact:contacts(*)
        `)
        .eq("workspace_id", currentWorkspaceId)
        .order("last_message_at", { ascending: false });

      if (status) {
        query = query.eq("current_status", status);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((chat: any) => ({
        ...chat,
        contact: chat.contact || null,
      })) as Chat[];
    },
    enabled: !!currentWorkspaceId,
  });
}
