import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import type { Invoice, InvoiceStatus } from "@/types";

export function useInvoices(status?: InvoiceStatus | InvoiceStatus[]) {
  const { currentWorkspaceId } = useWorkspace();

  return useQuery({
    queryKey: ["invoices", currentWorkspaceId, status],
    queryFn: async () => {
      if (!currentWorkspaceId) return [];

      let query = supabase
        .from("invoices")
        .select(`
          *,
          contact:contacts(*),
          chat:chats(*)
        `)
        .eq("workspace_id", currentWorkspaceId)
        .order("created_at", { ascending: false });

      if (status) {
        if (Array.isArray(status)) {
          query = query.in("status", status);
        } else {
          query = query.eq("status", status);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((invoice: any) => ({
        ...invoice,
        contact: invoice.contact || null,
        chat: invoice.chat || null,
      })) as Invoice[];
    },
    enabled: !!currentWorkspaceId,
  });
}

export function useUpdateInvoiceStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      invoiceId, 
      status 
    }: { 
      invoiceId: string; 
      status: InvoiceStatus;
    }) => {
      const { error } = await supabase
        .from("invoices")
        .update({ 
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", invoiceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useTodayPaidCount() {
  const { currentWorkspaceId } = useWorkspace();

  return useQuery({
    queryKey: ["invoices-today-paid", currentWorkspaceId],
    queryFn: async () => {
      if (!currentWorkspaceId) return 0;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count, error } = await supabase
        .from("invoices")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", currentWorkspaceId)
        .eq("status", "paid")
        .gte("updated_at", today.toISOString());

      if (error) throw error;

      return count || 0;
    },
    enabled: !!currentWorkspaceId,
  });
}
