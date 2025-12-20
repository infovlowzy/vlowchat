import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ExternalLink, 
  Check, 
  TrendingUp, 
  MessageSquare, 
  FileText, 
  Search,
  RotateCcw,
  Clock,
  CheckCircle2,
  Receipt
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useInvoices, useUpdateInvoiceStatus, useTodayPaidCount } from '@/hooks/useInvoices';
import { useAuth } from '@/hooks/useAuth';
import { InvoicePreviewDialog } from '@/components/invoices/InvoicePreviewDialog';
import type { Invoice } from '@/types';

type ChannelFilter = 'all' | 'whatsapp' | 'web';

export default function Transactions() {
  useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  
  // Fetch invoices by status
  const { data: triggeredInvoices = [], isLoading: loadingTriggered } = useInvoices('waiting_for_payment');
  const { data: paidInvoices = [], isLoading: loadingPaid } = useInvoices('paid');
  const { data: approvedInvoices = [], isLoading: loadingApproved } = useInvoices('approved');
  
  // Get today's paid count
  const { data: todayPaidCount = 0 } = useTodayPaidCount();
  
  const updateInvoiceStatus = useUpdateInvoiceStatus();

  // Filter invoices based on search and channel
  const filterInvoices = (invoices: Invoice[]) => {
    return invoices.filter(invoice => {
      const contactName = invoice.contact?.display_name || invoice.contact?.phone_number || '';
      const matchesSearch = !searchQuery || 
        contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (invoice.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const phoneNumber = invoice.contact?.phone_number || '';
      const isWebChat = phoneNumber.startsWith('web-');
      const matchesChannel = channelFilter === 'all' || 
        (channelFilter === 'web' && isWebChat) ||
        (channelFilter === 'whatsapp' && !isWebChat);
      
      return matchesSearch && matchesChannel;
    });
  };

  const filteredTriggered = filterInvoices(triggeredInvoices);
  const filteredPaid = filterInvoices(paidInvoices);
  const filteredApproved = filterInvoices(approvedInvoices);

  const handleMarkAsPaid = async (invoiceId: string) => {
    try {
      await updateInvoiceStatus.mutateAsync({
        invoiceId,
        status: 'paid',
      });
      toast({
        title: 'Invoice marked as paid',
        description: 'The invoice has been moved to the Paid tab.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update invoice status',
        variant: 'destructive'
      });
    }
  };

  const handleMarkAsApproved = async (invoiceId: string) => {
    try {
      await updateInvoiceStatus.mutateAsync({
        invoiceId,
        status: 'approved',
      });
      toast({
        title: 'Invoice approved',
        description: 'The invoice has been moved to the Approved tab.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update invoice status',
        variant: 'destructive'
      });
    }
  };

  const handleReturnToPaid = async (invoiceId: string) => {
    try {
      await updateInvoiceStatus.mutateAsync({
        invoiceId,
        status: 'paid',
      });
      toast({
        title: 'Invoice returned',
        description: 'The invoice has been moved back to the Paid tab.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update invoice status',
        variant: 'destructive'
      });
    }
  };

  const handleOpenChat = (chatId: string) => {
    navigate(`/chats?chatId=${chatId}`);
  };

  const handleOpenInvoice = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    setInvoiceDialogOpen(true);
  };

  const getChannelBadge = (phoneNumber: string) => {
    if (phoneNumber.startsWith('web-')) {
      return <Badge variant="outline" className="text-xs">Web</Badge>;
    }
    return <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">WA</Badge>;
  };

  const isLoading = loadingTriggered || loadingPaid || loadingApproved;

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const renderInvoiceCard = (
    invoice: Invoice, 
    actions: React.ReactNode
  ) => {
    const contactName = invoice.contact?.display_name || invoice.contact?.phone_number || 'Unknown';
    const phoneNumber = invoice.contact?.phone_number || '';
    
    return (
      <div
        key={invoice.id}
        className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-start gap-4 flex-1">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-primary">
              {contactName.charAt(0).toUpperCase()}
            </span>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-medium">{contactName}</span>
              {getChannelBadge(phoneNumber)}
              {invoice.invoice_number && (
                <Badge variant="secondary" className="text-xs">
                  {invoice.invoice_number}
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mb-2">
              {invoice.currency_code || 'IDR'} {Number(invoice.total_amount).toLocaleString()}
            </p>
            
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>
                {invoice.created_at && new Date(invoice.created_at).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-4 flex-wrap justify-end">
          {actions}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        description="Monitor payment-related conversations and invoices detected by AI"
      />

      {/* Stats Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Payment Activity
              </CardTitle>
              <CardDescription>Payments processed today</CardDescription>
            </div>
            <div className="text-3xl font-bold">{todayPaidCount}</div>
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or invoice number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={channelFilter} onValueChange={(v) => setChannelFilter(v as ChannelFilter)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="web">Website</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="triggered">
        <TabsList className="h-auto p-1 gap-1">
          <TabsTrigger value="triggered" className="flex items-center gap-2 py-2 px-4">
            <Clock className="w-4 h-4" />
            <span>Invoice Triggered</span>
            {triggeredInvoices.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5">
                {triggeredInvoices.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="paid" className="flex items-center gap-2 py-2 px-4">
            <Receipt className="w-4 h-4" />
            <span>Paid</span>
            {paidInvoices.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5">
                {paidInvoices.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2 py-2 px-4">
            <CheckCircle2 className="w-4 h-4" />
            <span>Approved</span>
            {approvedInvoices.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5">
                {approvedInvoices.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Invoice Triggered Tab */}
        <TabsContent value="triggered" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Invoice Triggered
              </CardTitle>
              <CardDescription>
                Invoices waiting for customer payment. Auto-moves to Paid when customer completes transaction.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredTriggered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No pending invoices</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTriggered.map((invoice) => 
                    renderInvoiceCard(invoice, (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenInvoice(invoice.id)}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Invoice
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenChat(invoice.chat_id)}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Chat
                        </Button>
                      </>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Paid Tab */}
        <TabsContent value="paid" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Paid Invoices
              </CardTitle>
              <CardDescription>
                Invoices where payment has been received. Review and approve to complete.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredPaid.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Receipt className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No paid invoices pending approval</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredPaid.map((invoice) => 
                    renderInvoiceCard(invoice, (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleMarkAsApproved(invoice.id)}
                          disabled={updateInvoiceStatus.isPending}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenInvoice(invoice.id)}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Invoice
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenChat(invoice.chat_id)}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Chat
                        </Button>
                      </>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approved Tab */}
        <TabsContent value="approved" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Approved Invoices
              </CardTitle>
              <CardDescription>
                Completed transactions that have been verified and approved.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredApproved.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No approved invoices yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredApproved.map((invoice) => 
                    renderInvoiceCard(invoice, (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReturnToPaid(invoice.id)}
                          disabled={updateInvoiceStatus.isPending}
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Return
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenInvoice(invoice.id)}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Invoice
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenChat(invoice.chat_id)}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Chat
                        </Button>
                      </>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invoice Preview Dialog */}
      <InvoicePreviewDialog
        invoiceId={selectedInvoiceId}
        open={invoiceDialogOpen}
        onOpenChange={setInvoiceDialogOpen}
      />
    </div>
  );
}