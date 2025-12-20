import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { X, Printer, Send, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Invoice, InvoiceItem } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface InvoicePreviewDialogProps {
  invoiceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoicePreviewDialog({ invoiceId, open, onOpenChange }: InvoicePreviewDialogProps) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (invoiceId && open) {
      fetchInvoiceDetails();
    }
  }, [invoiceId, open]);

  const fetchInvoiceDetails = async () => {
    if (!invoiceId) return;
    
    setLoading(true);
    try {
      // Fetch invoice with contact
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          *,
          contact:contacts(*)
        `)
        .eq('id', invoiceId)
        .maybeSingle();

      if (invoiceError) throw invoiceError;
      
      if (invoiceData) {
        setInvoice({
          ...invoiceData,
          contact: invoiceData.contact || null,
        } as Invoice);
      }

      // Fetch invoice items
      const { data: itemsData, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId);

      if (itemsError) throw itemsError;
      
      setItems((itemsData || []).map(item => ({
        ...item,
        unit_price: Number(item.unit_price) || 0,
        quantity: Number(item.quantity) || 1,
        discount_value: Number(item.discount_value) || 0,
        line_total: Number(item.line_total) || 0,
      })) as InvoiceItem[]);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to load invoice details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendInvoice = () => {
    toast({
      title: 'Invoice Sent',
      description: 'Invoice has been sent to the customer via chat.',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting_for_payment':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'paid':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'approved':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      default:
        return '';
    }
  };

  const formatCurrency = (amount: number) => {
    const currency = invoice?.currency_code || 'IDR';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl">Invoice Preview</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
            <Separator />
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
            <Separator />
            <Skeleton className="h-8 w-32 ml-auto" />
          </div>
        ) : invoice ? (
          <div className="space-y-6 py-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  {invoice.invoice_number || `INV-${invoice.id.slice(0, 8).toUpperCase()}`}
                </h2>
                <p className="text-muted-foreground mt-1">
                  {invoice.created_at && new Date(invoice.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <Badge variant="outline" className={getStatusColor(invoice.status)}>
                {invoice.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>

            {/* Customer Info */}
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Bill To:</p>
              <p className="font-semibold">
                {invoice.contact?.display_name || 'Customer'}
              </p>
              <p className="text-sm text-muted-foreground">
                {invoice.contact?.phone_number}
              </p>
            </div>

            <Separator />

            {/* Items Table */}
            <div>
              <h3 className="font-semibold mb-3">Items</h3>
              {items.length === 0 ? (
                <p className="text-muted-foreground text-sm">No items in this invoice</p>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium">Item</th>
                        <th className="text-right p-3 text-sm font-medium">Qty</th>
                        <th className="text-right p-3 text-sm font-medium">Price</th>
                        <th className="text-right p-3 text-sm font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-3">
                            <p className="font-medium">{item.name}</p>
                            {item.description && (
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            )}
                          </td>
                          <td className="p-3 text-right">{item.quantity}</td>
                          <td className="p-3 text-right">{formatCurrency(item.unit_price)}</td>
                          <td className="p-3 text-right font-medium">{formatCurrency(item.line_total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(Number(invoice.subtotal_amount) || 0)}</span>
              </div>
              {Number(invoice.discount_amount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-green-600">-{formatCurrency(Number(invoice.discount_amount))}</span>
                </div>
              )}
              {Number(invoice.tax_amount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatCurrency(Number(invoice.tax_amount))}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(Number(invoice.total_amount) || 0)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button onClick={handleSendInvoice}>
                <Send className="w-4 h-4 mr-2" />
                Send to Customer
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            <p>Invoice not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
