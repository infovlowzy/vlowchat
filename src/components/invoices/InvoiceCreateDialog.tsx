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
  chat: ChatDetailChatViewModel & {
    contact?: {
      id: string;
      display_name: string;
      phone_number: string | null;
    };
    workspaceId: string;
  };
}

interface DraftItem {
  id: string;
  name: string;
  price: string;     // string for input
  quantity: string;  // string for input
}

export function InvoiceCreateDialog({
  open,
  onOpenChange,
  chat,
}: InvoiceCreateDialogProps) {
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<DraftItem[]>([]);
  const [discount, setDiscount] = useState<string>("0");
  const [tax, setTax] = useState<string>("0");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const code = useMemo(() => {
    return `INV-${chat.id.slice(0, 4).toUpperCase()}-${new Date()
      .toISOString()
      .slice(2, 10)
      .replace(/-/g, "")}`;
  }, [chat.id]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const price = Number(item.price) || 0;
      const qty = Number(item.quantity) || 0;
      return sum + price * qty;
    }, 0);
  }, [items]);

  const discountAmount = useMemo(
    () => Number(discount) || 0,
    [discount]
  );

  const taxAmount = useMemo(
    () => Number(tax) || 0,
    [tax]
  );

  const total = useMemo(
    () => subtotal - discountAmount + taxAmount,
    [subtotal, discountAmount, taxAmount]
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
    setDiscount("0");
    setTax("0");
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
        quantity: "1",
      },
    ]);
  };

  const handleItemChange = (
    id: string,
    field: keyof DraftItem,
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
        description: "Please add at least one line item.",
        variant: "destructive",
      });
      return;
    }
    if (subtotal <= 0) {
      toast({
        title: "Amount must be > 0",
        description: "Please enter valid prices and quantities.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      const { data: invoice, error: invErr } = await supabase
        .from("invoices")
        .insert({
          workspace_id: chat.workspaceId,
          chat_id: chat.id,
          contact_id: chat.contactId,
          created_by_type: "human",
          status: "waiting_for_payment",
          invoice_number: code,
          currency_code: "IDR",
          subtotal_amount: subtotal,
          discount_amount: discountAmount,
          tax_amount: taxAmount,
          total_amount: total,
        })
        .select("*")
        .maybeSingle();

      if (invErr) throw invErr;
      if (!invoice) throw new Error("Failed to create invoice");

      const itemsPayload = items.map((item) => {
        const price = Number(item.price) || 0;
        const qty = Number(item.quantity) || 0;
        const lineTotal = price * qty;

        return {
          invoice_id: invoice.id,
          name: item.name || "Item",
          description: null,
          unit_price: price,
          quantity: qty,
          discount_type: "none",
          discount_value: 0,
          line_total: lineTotal,
        };
      });

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
          {/* Header */}
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
              {chat.contact?.display_name || chat.customerName || "Customer"}
            </p>
            <p className="text-sm text-muted-foreground">
              {chat.contact?.phone_number || "+62••••••••••"}
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
                    className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 items-center"
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
                      <Label className="text-xs">Qty</Label>
                      <Input
                        type="number"
                        min={1}
                        placeholder="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(item.id, "quantity", e.target.value)
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
              placeholder="Notes or terms to show on the invoice."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Discount & Tax */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="invoice-discount">Discount (IDR)</Label>
              <Input
                id="invoice-discount"
                type="number"
                min={0}
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="invoice-tax">Tax (IDR)</Label>
              <Input
                id="invoice-tax"
                type="number"
                min={0}
                value={tax}
                onChange={(e) => setTax(e.target.value)}
              />
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span className="text-green-600">
                  -{formatCurrency(discountAmount)}
                </span>
              </div>
            )}
            {taxAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
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
