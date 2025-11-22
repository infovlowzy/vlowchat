import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Transaction } from "@/types";

export function useTransactions() {
  return useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data.map((transaction) => ({
        ...transaction,
        customerId: transaction.user_id,
        customerName: transaction.customer_name,
        chatId: transaction.chat_id,
        timestamp: new Date(transaction.created_at),
        handledAt: transaction.handled_at ? new Date(transaction.handled_at) : undefined,
      })) as Transaction[];
    },
  });
}
