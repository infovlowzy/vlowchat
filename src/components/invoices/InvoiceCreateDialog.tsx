import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface InvoiceCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chat: {
    id: string;
    workspaceId: string;
    contactId: string;
    customerName: string;
    contactPhone?: string | null;
  };
}

interface DraftItem {
  id: string;
  name: string;
  price: string; // string for input
}

export function InvoiceCreateDialog({
  open,
  onOpenChange,
  chat,
}: InvoiceCreateDialogProps) {
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<DraftItem[]>([]);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const code = useMemo(() => {
    // You can replace this with a sequence or server-side generator later
    return `INV-${chat.id.slice(0, 4).toUpperCase()}-${new Date()
      .toISOString()
      .slice(2, 10)
      .replace(/-/g, "")}`;
  }, [chat.id]);

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => sum + (Number(item.price) || 0), 0),
    [items]
  );

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  const resetForm = () => {
    setNotes("");
    setItems([]);
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: "",
        price: "",
      },
    ]);
  };

  const handleItemChange = (
    id: string,
    field: "name" | "price",
    value: string
  ) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleCreateInvoice = async () => {
    if (!items.length) {
      toast({
        title: "Add at least one item",
        description: "Please add at least one line item with a price.",
        variant: "destructive",
      });
      return;
    }
    if (subtotal <= 0) {
      toast({
        title: "Amount must be > 0",
        description: "Please enter valid prices for your items.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      // 1) Insert invoice
      const { data: invoice, error: invErr } = await supabase
        .from("invoices")
        .insert({
          workspace_id: chat.workspaceId,
          chat_id: chat.id,
          contact_id: chat.contactId,
          created_by_type: "human",
          // created_by_user_id: current user id if you have it
          status: "waiting_for_payment",
          invoice_number: code,
          currency_code: "IDR",
          subtotal_amount: subtotal,
          discount_amount: 0,
          tax_amount: 0,
          total_amount: subtotal,
          // you can store notes in a custom field later if needed
        })
        .select("*")
        .maybeSingle();

      if (invErr) throw invErr;
      if (!invoice) throw new Error("Failed to create invoice record");

      // 2) Insert invoice items
      const itemsPayload = items.map((item) => ({
        invoice_id: invoice.id,
        name: item.name || "Item",
        description: null,
        unit_price: Number(item.price) || 0,
        quantity: 1,
        discount_type: "none",
        discount_value: 0,
        line_total: Number(item.price) || 0,
      }));

      const { error: itemsErr } = await supabase
        .from("invoice_items")
        .insert(itemsPayload);

      if (itemsErr) throw itemsErr;

      toast({
        title: "Invoice created",
        description: `Invoice ${code} for ${chat.customerName} has been created.`,
      });

      handleClose(false);
    } catch (error: any) {
      console.error("Error creating invoice:", error);
      toast({
        title: "Error",
        description: error?.message ?? "Failed to create invoice",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">Create Invoice</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Header: code + date */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold">{code}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {new Date().toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Bill To */}
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Bill To:</p>
            <p className="font-semibold">
              {chat.customerName || "Customer"}
            </p>
            <p className="text-sm text-muted-foreground">
              {chat.contactPhone || "+62••••••••••"}
            </p>
          </div>

          <Separator />

          {/* Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Items</h3>
              <Button variant="outline" size="sm" onClick={handleAddItem}>
                <Plus className="w-4 h-4 mr-1" />
                Add Item
              </Button>
            </div>

            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No items yet. Click &quot;Add Item&quot; to start.
              </p>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto] gap-2 items-center"
                  >
                    <div className="space-y-1">
                      <Label className="text-xs">Item</Label>
                      <Input
                        placeholder="Service / Product name"
                        value={item.name}
                        onChange={(e) =>
                          handleItemChange(item.id, "name", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Price (IDR)</Label>
                      <Input
                        type="number"
                        placeholder="300000"
                        value={item.price}
                        onChange={(e) =>
                          handleItemChange(item.id, "price", e.target.value)
                        }
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Notes */}
          <div className="space-y-1">
            <Label htmlFor="invoice-notes">Notes (optional)</Label>
            <Textarea
              id="invoice-notes"
              placeholder="Add notes or terms; can be shown in preview later."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Totals */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateInvoice} disabled={isSending}>
              <Send className="w-4 h-4 mr-2" />
              {isSending ? "Creating…" : "Create Invoice"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
