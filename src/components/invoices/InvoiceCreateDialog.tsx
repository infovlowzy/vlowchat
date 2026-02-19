import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Send, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
// import { supabase } from '@/integrations/supabase/client'; // for future backend hookup

interface InvoiceCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chat: {
    id: string;
    customerName: string;
  };
}

export function InvoiceCreateDialog({
  open,
  onOpenChange,
  chat,
}: InvoiceCreateDialogProps) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setDescription('');
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
  };

  const handleCreateInvoice = async () => {
    if (!amount.trim()) {
      toast({
        title: 'Amount required',
        description: 'Please enter an invoice amount.',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    try {
      // TODO: hook to backend
      // const { data, error } = await supabase.functions.invoke('create-invoice', {
      //   body: {
      //     chat_id: chat.id,
      //     title,
      //     amount: Number(amount),
      //     description,
      //   },
      // });
      // if (error) throw error;

      // For now, just simulate success
      toast({
        title: 'Invoice created',
        description: `Invoice for ${chat.customerName} has been created (not yet persisted).`,
      });
      handleClose(false);
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      toast({
        title: 'Error',
        description: error?.message ?? 'Failed to create invoice',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-lg">Create Invoice</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleClose(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="text-sm text-muted-foreground">
            Issue a quick invoice for{' '}
            <span className="font-medium text-foreground">
              {chat.customerName}
            </span>
            . This will later be sent via chat after integration.
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="invoice-title">Title (optional)</Label>
              <Input
                id="invoice-title"
                placeholder="e.g. ITAD Service – March 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="invoice-amount">Amount (IDR)</Label>
              <Input
                id="invoice-amount"
                type="number"
                placeholder="e.g. 250000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="invoice-description">Description (optional)</Label>
              <Textarea
                id="invoice-description"
                placeholder="Short description, terms, or notes."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[80px] resize-none"
              />
            </div>
          </div>

          <Separator />

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
              {isSending ? 'Creating…' : 'Create Invoice'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
