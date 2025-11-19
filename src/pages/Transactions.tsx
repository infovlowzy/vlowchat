import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Globe, ExternalLink, Check, TrendingUp } from 'lucide-react';
import { mockTransactions } from '@/lib/mockData';
import { Channel } from '@/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function Transactions() {
  const [channelFilter, setChannelFilter] = useState<Channel | 'all'>('all');
  const { toast } = useToast();

  const incomingTransactions = mockTransactions.filter(t => t.status !== 'handled');
  const handledTransactions = mockTransactions.filter(t => t.status === 'handled');

  const filteredIncoming = channelFilter === 'all' 
    ? incomingTransactions 
    : incomingTransactions.filter(t => t.channel === channelFilter);
    
  const filteredHandled = channelFilter === 'all'
    ? handledTransactions
    : handledTransactions.filter(t => t.channel === channelFilter);

  const handleMarkAsHandled = (id: string) => {
    toast({
      title: 'Transaction marked as handled',
      description: 'The payment alert has been processed.'
    });
  };

  const handleOpenChat = () => {
    toast({
      title: 'Opening chat',
      description: 'Navigating to conversation...'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'awaiting_check':
        return <Badge variant="secondary">Awaiting Check</Badge>;
      case 'proof_received':
        return <Badge className="bg-warning text-warning-foreground">Proof Received</Badge>;
      case 'handled':
        return <Badge className="bg-success text-success-foreground">Handled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const todayHandled = handledTransactions.filter(t => {
    const today = new Date();
    const tDate = new Date(t.handledAt || t.timestamp);
    return tDate.toDateString() === today.toDateString();
  }).length;

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
            <div className="text-3xl font-bold">{todayHandled}</div>
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="w-48">
          <Select value={channelFilter} onValueChange={(v) => setChannelFilter(v as Channel | 'all')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="web">Website</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="incoming">
        <TabsList>
          <TabsTrigger value="incoming">
            Incoming
            {filteredIncoming.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                {filteredIncoming.length}
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
                Auto-detected payment conversations requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredIncoming.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Check className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No pending payment alerts</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredIncoming.map((transaction) => {
                    const ChannelIcon = transaction.channel === 'whatsapp' ? MessageSquare : Globe;
                    
                    return (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium text-primary">
                              {transaction.customerName.charAt(0)}
                            </span>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{transaction.customerName}</span>
                              <ChannelIcon className={cn(
                                'w-4 h-4',
                                transaction.channel === 'whatsapp' ? 'text-success' : 'text-primary'
                              )} />
                              <Badge variant="outline" className="text-xs">
                                {transaction.keyword}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-2">
                              "{transaction.snippet}"
                            </p>
                            
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>
                                {new Date(transaction.timestamp).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              {getStatusBadge(transaction.status)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleOpenChat}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Open Chat
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleMarkAsHandled(transaction.id)}
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Mark as Handled
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
                Resolved payment alerts and their outcomes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredHandled.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No handled transactions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredHandled.map((transaction) => {
                    const ChannelIcon = transaction.channel === 'whatsapp' ? MessageSquare : Globe;
                    
                    return (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 rounded-lg border"
                      >
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium">
                              {transaction.customerName.charAt(0)}
                            </span>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{transaction.customerName}</span>
                              <ChannelIcon className={cn(
                                'w-4 h-4',
                                transaction.channel === 'whatsapp' ? 'text-success' : 'text-primary'
                              )} />
                              <Badge variant="outline" className="text-xs">
                                {transaction.keyword}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-2">
                              "{transaction.snippet}"
                            </p>
                            
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>
                                Handled by {transaction.handledBy} • {' '}
                                {transaction.handledAt && new Date(transaction.handledAt).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              {getStatusBadge(transaction.status)}
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleOpenChat}
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
