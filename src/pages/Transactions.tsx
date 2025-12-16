import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Check, TrendingUp, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useInvoices, useUpdateInvoiceStatus, useTodayPaidCount } from '@/hooks/useInvoices';
import { useAuth } from '@/hooks/useAuth';

export default function Transactions() {
  useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Fetch incoming invoices (waiting for payment)
  const { data: incomingInvoices = [], isLoading: loadingIncoming } = useInvoices('waiting_for_payment');
  
  // Fetch handled invoices (paid or approved)
  const { data: handledInvoices = [], isLoading: loadingHandled } = useInvoices(['paid', 'approved']);
  
  // Get today's paid count
  const { data: todayPaidCount = 0 } = useTodayPaidCount();
  
  const updateInvoiceStatus = useUpdateInvoiceStatus();

  const handleMarkAsHandled = async (invoiceId: string) => {
    try {
      await updateInvoiceStatus.mutateAsync({
        invoiceId,
        status: 'paid',
      });
      toast({
        title: 'Invoice marked as paid',
        description: 'The payment alert has been processed.'
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting_for_payment':
        return <Badge variant="secondary">Awaiting Payment</Badge>;
      case 'paid':
        return <Badge className="bg-success text-success-foreground">Paid</Badge>;
      case 'approved':
        return <Badge className="bg-primary text-primary-foreground">Approved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isLoading = loadingIncoming || loadingHandled;

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        description="Monitor payment-related conversations and alerts detected by AI"
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
              <CardDescription>Payments handled today</CardDescription>
            </div>
            <div className="text-3xl font-bold">{todayPaidCount}</div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="incoming">
        <TabsList>
          <TabsTrigger value="incoming">
            Incoming
            {incomingInvoices.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                {incomingInvoices.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="handled">Handled</TabsTrigger>
        </TabsList>

        <TabsContent value="incoming" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Incoming Payment Alerts</CardTitle>
              <CardDescription>
                Invoices awaiting payment confirmation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {incomingInvoices.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Check className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No pending payment alerts</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {incomingInvoices.map((invoice) => {
                    const contactName = invoice.contact?.display_name || invoice.contact?.phone_number || 'Unknown';
                    
                    return (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium text-primary">
                              {contactName.charAt(0)}
                            </span>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{contactName}</span>
                              {invoice.invoice_number && (
                                <Badge variant="outline" className="text-xs">
                                  {invoice.invoice_number}
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-2">
                              Total: {invoice.currency_code || 'IDR'} {Number(invoice.total_amount).toLocaleString()}
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
                              {getStatusBadge(invoice.status)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenChat(invoice.chat_id)}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Open Chat
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleMarkAsHandled(invoice.id)}
                            disabled={updateInvoiceStatus.isPending}
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Mark as Paid
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="handled" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Handled Transactions</CardTitle>
              <CardDescription>
                Paid and approved invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              {handledInvoices.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No handled transactions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {handledInvoices.map((invoice) => {
                    const contactName = invoice.contact?.display_name || invoice.contact?.phone_number || 'Unknown';
                    
                    return (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between p-4 rounded-lg border"
                      >
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium">
                              {contactName.charAt(0)}
                            </span>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{contactName}</span>
                              {invoice.invoice_number && (
                                <Badge variant="outline" className="text-xs">
                                  {invoice.invoice_number}
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-2">
                              Total: {invoice.currency_code || 'IDR'} {Number(invoice.total_amount).toLocaleString()}
                            </p>
                            
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>
                                {invoice.updated_at && new Date(invoice.updated_at).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              {getStatusBadge(invoice.status)}
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenChat(invoice.chat_id)}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Chat
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
